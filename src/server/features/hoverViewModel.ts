import { enrichEntity } from '../knowledge/enrichEntity';
import { getDisplayDocumentation, getDisplayObsoleteMessage, getDisplayParameterDocumentation, getDisplayReturnDocumentation, getDisplaySummary, getDisplayUsageNotes, type DocumentationLocale } from '../knowledge/system/localization';
import type { PbSystemSymbolEntry } from '../knowledge/system/types';
import type { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { EntityKind, type Entity } from '../knowledge/types';
import type { QueryAmbiguityKind, QueryReasonCode, QueryResolutionConfidence } from '../knowledge/resolution/semanticQueryService';
import { buildSymbolHoverViewModel } from '../presentation/hoverPresentation';
import { getPresentationTerm, resolvePresentationTerminologyLocale } from '../presentation/terminology';
import type {
  HoverBlockViewModel as HoverViewModelBlock,
  HoverPresentationKind as HoverKind,
  PresentationConfidence as HoverConfidence,
  SymbolHoverViewModel as HoverViewModel,
} from '../presentation/viewModels';

export type { HoverKind, HoverConfidence, HoverViewModelBlock, HoverViewModel };

export type HoverNegativeReason = 'whitespace' | 'comment' | 'string' | 'keyword' | 'separator' | 'unresolved';

export interface HoverResolutionSummary {
  confidence?: QueryResolutionConfidence;
  reasonCode?: QueryReasonCode;
  ambiguous?: boolean;
  ambiguityKind?: QueryAmbiguityKind;
  targetCount?: number;
}

const KIND_NAME: Record<string, string> = {
  Type: 'type',
  Function: 'function',
  Subroutine: 'subroutine',
  Event: 'event',
  Variable: 'variable',
};

function sanitizeCallableSignature(signature?: string): string | undefined {
  if (!signature) {
    return undefined;
  }

  const sanitized = signature.split(';', 1)[0]?.trim().replace(/\s+/g, ' ');
  return sanitized && sanitized.length > 0 ? sanitized : undefined;
}

function buildEntityHeading(entity: Entity, locale: DocumentationLocale): string {
  if (entity.kind === EntityKind.Variable) {
    if (entity.declarationScope === 'parameter' || entity.scope === 'Argumento') {
      return `**${getPresentationTerm('argument', locale)}** \`${entity.name}\``;
    }
    if (entity.declarationScope === 'local' || entity.scope === 'Local') {
      return `**${getPresentationTerm('local-variable', locale)}** \`${entity.name}\``;
    }
    if (entity.scope === 'Compartida') {
      return `**${getPresentationTerm('shared-variable', locale)}** \`${entity.name}\``;
    }
    if (entity.scope === 'Global') {
      return `**${getPresentationTerm('global-variable', locale)}** \`${entity.name}\``;
    }
    if (entity.lineage?.role === 'inherited') {
      return `**${getPresentationTerm('inherited-variable', locale)}** \`${entity.name}\``;
    }
    return `**${getPresentationTerm('instance-variable', locale)}** \`${entity.name}\``;
  }

  if (entity.kind === EntityKind.Type) {
    return `**${getPresentationTerm('type', locale)}** \`${entity.name}\``;
  }

  if (entity.isExternal && entity.kind === EntityKind.Function) {
    return `**${getPresentationTerm('external-function', locale)}** \`${entity.name}\``;
  }

  if (entity.isExternal && entity.kind === EntityKind.Subroutine) {
    return `**${getPresentationTerm('external-subroutine', locale)}** \`${entity.name}\``;
  }

  const kindName = getPresentationTerm(
    (KIND_NAME[entity.kind] as Parameters<typeof getPresentationTerm>[0] | undefined) ?? 'symbol',
    locale,
  );
  if (entity.lineage?.role === 'inherited') {
    if (entity.kind === EntityKind.Function) {
      return `**${getPresentationTerm('inherited-function', locale)}** \`${entity.name}\``;
    }
    if (entity.kind === EntityKind.Event) {
      return `**${getPresentationTerm('inherited-event', locale)}** \`${entity.name}\``;
    }
    if (entity.kind === EntityKind.Subroutine) {
      return `**${getPresentationTerm('inherited-subroutine', locale)}** \`${entity.name}\``;
    }
    return `**${getPresentationTerm('inherited', locale)} ${kindName.toLowerCase()}** \`${entity.name}\``;
  }

  return `**${kindName}** \`${entity.name}\``;
}

function buildEntityContextLines(entity: Entity, locale: DocumentationLocale): string[] {
  const lines: string[] = [];

  if (entity.access && entity.declarationScope !== 'local' && entity.declarationScope !== 'parameter') {
    lines.push(`**${getPresentationTerm('access-label', locale)}:** \`${entity.access}\``);
  }

  if (entity.kind === EntityKind.Type && entity.baseTypeName) {
    lines.push(`**${getPresentationTerm('inherits-label', locale)}:** \`${entity.name} -> ${entity.baseTypeName}\``);
    lines.push(`${getPresentationTerm('inherits-label', 'es')}: ${entity.baseTypeName}`);
    return lines;
  }

  if (entity.declarationScope === 'local' || entity.declarationScope === 'parameter') {
    const callableSignature = sanitizeCallableSignature(entity.containerSignature);
    if (callableSignature) {
      lines.push(`**${getPresentationTerm('scope', locale)}:** \`${callableSignature}\``);
    } else if (entity.containerName) {
      lines.push(`**${getPresentationTerm('scope', locale)}:** \`${entity.containerName}\``);
    }
  } else if (entity.ownerName) {
    lines.push(`**${getPresentationTerm('defined-in-label', locale)}:** \`${entity.ownerName}\``);
  } else if (entity.containerName) {
    lines.push(`**${getPresentationTerm('defined-in-label', locale)}:** \`${entity.containerName}\``);
  }

  if (entity.lineage?.inheritedFrom && entity.kind !== EntityKind.Type) {
    lines.push(`**${getPresentationTerm('inherited-from-label', locale)}:** \`${entity.lineage.inheritedFrom}\``);
  }

  return lines;
}

function buildExternalWarning(entity: Entity, locale: DocumentationLocale): string | null {
  if (!entity.isExternal) {
    return null;
  }

  if (entity.externalCallableKind === 'rpcfunc') {
    return getPresentationTerm('warning-external-stored-procedure', locale);
  }

  return getPresentationTerm('warning-external-call', locale);
}

function buildResolutionWarning(resolution: HoverResolutionSummary | undefined, locale: DocumentationLocale): string | null {
  if (!resolution) {
    return null;
  }

  if (resolution.ambiguous) {
    return resolution.ambiguityKind === 'global-fallback'
      ? getPresentationTerm('warning-ambiguous-fallback', locale)
      : getPresentationTerm('warning-ambiguous-target', locale);
  }

  switch (resolution.reasonCode) {
    case 'global-fallback':
      return getPresentationTerm('warning-workspace-fallback', locale);
    default:
      break;
  }

  if (resolution.confidence === 'low') {
    return getPresentationTerm('warning-low-confidence', locale);
  }

  return null;
}

function classifyUserHoverKind(entity: Entity): HoverKind {
  if (entity.kind === EntityKind.Variable) {
    if (entity.declarationScope === 'parameter' || entity.scope === 'Argumento') {
      return 'argument';
    }
    if (entity.declarationScope === 'local' || entity.scope === 'Local') {
      return 'local-variable';
    }
    if (entity.scope === 'Compartida') {
      return 'shared-variable';
    }
    if (entity.scope === 'Global') {
      return 'global-variable';
    }
    if (entity.lineage?.role === 'inherited') {
      return 'inherited-member';
    }
    return 'instance-variable';
  }

  if (entity.kind === EntityKind.Event) {
    return entity.lineage?.role === 'inherited' ? 'inherited-member' : 'event';
  }

  if (entity.kind === EntityKind.Function || entity.kind === EntityKind.Subroutine) {
    return entity.lineage?.role === 'inherited' ? 'inherited-member' : 'function';
  }

  return entity.lineage?.role === 'inherited' ? 'inherited-member' : 'dynamic';
}

function classifySystemHoverKind(symbol: PbSystemSymbolEntry): HoverKind {
  if (symbol.kind === 'enumerated-type') {
    return 'enumerated-type';
  }
  if (symbol.kind === 'enumerated-value') {
    return 'enumerated-value';
  }
  if (symbol.name.toUpperCase() === 'SQLCA' || symbol.enumValueOf?.toLowerCase() === 'sqlca') {
    return 'sql-symbol';
  }

  const appliesTo = symbol.appliesTo?.map((entry) => entry.toLowerCase()) ?? [];
  if (appliesTo.some((entry) => entry.includes('datawindow') || entry.includes('datastore') || entry.includes('datawindowchild'))) {
    return 'datawindow-method';
  }

  return 'built-in';
}

function collectEffectiveEnumeratedTypeValues(
  symbol: PbSystemSymbolEntry,
  catalog: SystemCatalog
): readonly string[] {
  if (symbol.kind !== 'enumerated-type') {
    return [];
  }

  const values = new Set<string>(symbol.enumValues ?? []);
  for (const entry of catalog.listEnumeratedValuesForType(symbol.name)) {
    values.add(entry.name);
  }
  return Array.from(values);
}

function formatSystemSymbolRisk(risk: NonNullable<PbSystemSymbolEntry['risk']>, locale: DocumentationLocale): string {
  switch (risk) {
    case 'safe':
      return getPresentationTerm('risk-safe', locale);
    case 'dynamic':
      return getPresentationTerm('risk-dynamic', locale);
    case 'deprecated':
      return getPresentationTerm('risk-deprecated', locale);
    case 'legacy':
      return getPresentationTerm('risk-legacy', locale);
    case 'external':
      return getPresentationTerm('risk-external', locale);
  }
}

export function buildUserHoverViewModel(
  entity: Entity,
  resolution?: HoverResolutionSummary,
  options: { detailLines?: string[]; locale?: string } = {}
): HoverViewModel {
  const enriched = enrichEntity(entity);
  const locale = resolvePresentationTerminologyLocale(options.locale);
  const access = enriched.access ? `${enriched.access} ` : '';

  let signature: string;
  if (enriched.kind === EntityKind.Variable) {
    const scopeStr = enriched.scope ? `(${enriched.scope}) ` : '';
    signature = `${scopeStr}${access}${enriched.datatype ?? 'any'} ${enriched.name}`;
  } else if (enriched.kind === EntityKind.Function || enriched.kind === EntityKind.Subroutine) {
    signature = enriched.signature ?? `${access}${enriched.kind.toLowerCase()} ${enriched.name}(...)`;
  } else {
    signature = enriched.signature ?? `(${KIND_NAME[enriched.kind] ?? enriched.kind}) ${enriched.name}`;
  }

  const blocks: HoverViewModelBlock[] = [];
  const contextLines = buildEntityContextLines(enriched, locale);
  if (contextLines.length > 0) {
    blocks.push({ kind: 'context', lines: contextLines });
  }

  if (options.detailLines && options.detailLines.length > 0) {
    blocks.push({ kind: 'details', lines: options.detailLines });
  }

  const externalWarning = buildExternalWarning(enriched, locale);
  const resolutionWarning = buildResolutionWarning(resolution, locale);
  const warnings = [externalWarning, resolutionWarning].filter((line): line is string => Boolean(line));
  if (warnings.length > 0) {
    blocks.push({ kind: 'warning', lines: warnings });
  }

  if (enriched.documentation) {
    blocks.push({ kind: 'documentation', lines: [enriched.documentation] });
  }

  return buildSymbolHoverViewModel({
    kind: classifyUserHoverKind(enriched),
    title: buildEntityHeading(enriched, locale),
    signature,
    blocks,
    confidence: resolution?.ambiguous || resolution?.confidence === 'low'
      ? 'low'
      : resolution?.confidence === 'medium'
        ? 'medium'
        : 'high',
    locale,
  });
}

export function buildSystemHoverViewModel(
  symbol: PbSystemSymbolEntry,
  catalog: SystemCatalog,
  documentationLocale: DocumentationLocale,
): HoverViewModel {
  const labelLocale: DocumentationLocale = 'es';
  const effectiveEnumValues = collectEffectiveEnumeratedTypeValues(symbol, catalog);
  const displaySummary = getDisplaySummary(symbol, documentationLocale);
  const displayDocumentation = getDisplayDocumentation(symbol, documentationLocale);
  const displayObsoleteMessage = getDisplayObsoleteMessage(symbol, documentationLocale);
  const displayUsageNotes = getDisplayUsageNotes(symbol, documentationLocale);
  const displayReturnDocumentation = getDisplayReturnDocumentation(symbol, documentationLocale);
  const blocks: HoverViewModelBlock[] = [];
  const warningLines: string[] = [];

  if (symbol.obsolete) {
    warningLines.push(`**⚠️ ${getPresentationTerm('obsolete-label', labelLocale).toUpperCase()}:** ${displayObsoleteMessage || getPresentationTerm('deprecated-default-message', labelLocale)}`);
    if (symbol.replacement) {
      warningLines.push(`> *${getPresentationTerm('use-instead', labelLocale)} \`${symbol.replacement}\`.*`);
    }
  }
  if (symbol.risk) {
    warningLines.push(`**${getPresentationTerm('risk-of-use-label', labelLocale)}:** ${formatSystemSymbolRisk(symbol.risk, labelLocale)}`);
  }
  if (warningLines.length > 0) {
    blocks.push({ kind: 'warning', lines: warningLines });
  }

  const detailLines: string[] = [];
  if (symbol.signatures && symbol.signatures.length > 0) {
    const mainSig = symbol.signatures[0];
    if (mainSig.parameters && mainSig.parameters.length > 0) {
      detailLines.push(`**${getPresentationTerm('parameters-label', labelLocale)}:**`);
      for (const parameter of mainSig.parameters) {
        const parameterDocumentation = getDisplayParameterDocumentation(
          symbol,
          mainSig.label,
          parameter.label,
          documentationLocale,
        ) ?? parameter.documentation;
        detailLines.push(`* \`${parameter.label}\`${parameterDocumentation ? `: ${parameterDocumentation}` : ''}`);
      }
    }
  }
  if (displayReturnDocumentation) {
    detailLines.push(`**${getPresentationTerm('returns-label', labelLocale)}:** ${displayReturnDocumentation}`);
  }
  if (displayUsageNotes.length > 0) {
    detailLines.push(`**${getPresentationTerm('usage-notes-label', labelLocale)}:**`);
    for (const usageNote of displayUsageNotes) {
      detailLines.push(`* ${usageNote}`);
    }
  }
  if (symbol.appliesTo && symbol.appliesTo.length > 0) {
    detailLines.push(`**${getPresentationTerm('applies-to-label', labelLocale)}:** ${symbol.appliesTo.join(', ')}`);
  }
  if (symbol.kind === 'enumerated-type' && effectiveEnumValues.length > 0) {
    detailLines.push(`**${getPresentationTerm('values-label', labelLocale)}:** ${effectiveEnumValues.join(', ')}`);
  }
  if (symbol.kind === 'enumerated-value' && symbol.enumValueOf) {
    detailLines.push(`**${getPresentationTerm('type', labelLocale)}:** ${symbol.enumValueOf}`);
    if (symbol.enumNumericValue !== undefined) {
      detailLines.push(`**${getPresentationTerm('numeric-value-label', labelLocale)}:** ${symbol.enumNumericValue}`);
    }
    if (symbol.enumValueMeaning) {
      detailLines.push(`**${getPresentationTerm('meaning-label', labelLocale)}:** ${symbol.enumValueMeaning}`);
    }
  }
  if (symbol.sourceUrl) {
    detailLines.push(`[📚 ${getPresentationTerm('official-documentation-label', labelLocale)}](${symbol.sourceUrl})`);
  }
  if (detailLines.length > 0) {
    blocks.push({ kind: 'details', lines: detailLines });
  }
  if (displayDocumentation) {
    blocks.push({ kind: 'documentation', lines: [displayDocumentation] });
  }

  return buildSymbolHoverViewModel({
    kind: classifySystemHoverKind(symbol),
    signature: symbol.signatures?.[0]?.label ?? symbol.name,
    summary: displaySummary,
    blocks,
    confidence: 'high',
    locale: documentationLocale,
  });
}

export function buildLanguageHoverViewModel(
  symbol: PbSystemSymbolEntry,
  catalog: SystemCatalog,
  documentationLocale: DocumentationLocale,
): HoverViewModel {
  const labelLocale: DocumentationLocale = 'es';
  const effectiveEnumValues = collectEffectiveEnumeratedTypeValues(symbol, catalog);
  const displaySummary = getDisplaySummary(symbol, documentationLocale);
  const displayDocumentation = getDisplayDocumentation(symbol, documentationLocale);
  const blocks: HoverViewModelBlock[] = [];
  const detailLines: string[] = [];

  if (symbol.category) {
    detailLines.push(`**${getPresentationTerm('category-label', labelLocale)}:** ${symbol.category}`);
  }
  if (symbol.kind === 'enumerated-type' && effectiveEnumValues.length > 0) {
    detailLines.push(`**${getPresentationTerm('values-label', labelLocale)}:** ${effectiveEnumValues.join(', ')}`);
  }
  if (symbol.kind === 'enumerated-value' && symbol.enumValueOf) {
    detailLines.push(`**${getPresentationTerm('type', labelLocale)}:** ${symbol.enumValueOf}`);
    if (symbol.enumNumericValue !== undefined) {
      detailLines.push(`**${getPresentationTerm('numeric-value-label', labelLocale)}:** ${symbol.enumNumericValue}`);
    }
    if (symbol.enumValueMeaning) {
      detailLines.push(`**${getPresentationTerm('meaning-label', labelLocale)}:** ${symbol.enumValueMeaning}`);
    }
  }
  if (detailLines.length > 0) {
    blocks.push({ kind: 'details', lines: detailLines });
  }
  if (displayDocumentation) {
    blocks.push({ kind: 'documentation', lines: [displayDocumentation] });
  }

  return buildSymbolHoverViewModel({
    kind: symbol.kind === 'enumerated-type'
      ? 'enumerated-type'
      : symbol.kind === 'enumerated-value'
        ? 'enumerated-value'
        : 'built-in',
    signature: symbol.name,
    summary: displaySummary,
    blocks,
    confidence: 'high',
    locale: documentationLocale,
  });
}

export function buildPreformattedHoverViewModel(kind: HoverKind, markdown: string): HoverViewModel {
  return buildSymbolHoverViewModel({
    kind,
    blocks: [],
    preformattedMarkdown: markdown,
    confidence: kind === 'unknown' ? 'low' : 'high',
  });
}