import { enrichEntity } from '../knowledge/enrichEntity';
import { getDisplayDocumentation, getDisplayObsoleteMessage, getDisplayParameterDocumentation, getDisplayReturnDocumentation, getDisplaySummary, getDisplayUsageNotes, type DocumentationLocale } from '../knowledge/system/localization';
import type { PbSystemSymbolEntry } from '../knowledge/system/types';
import type { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { EntityKind, type Entity } from '../knowledge/types';
import type { QueryAmbiguityKind, QueryReasonCode, QueryResolutionConfidence } from '../knowledge/resolution/semanticQueryService';

export type HoverKind =
  | 'local-variable'
  | 'argument'
  | 'instance-variable'
  | 'shared-variable'
  | 'global-variable'
  | 'function'
  | 'event'
  | 'inherited-member'
  | 'built-in'
  | 'enumerated-type'
  | 'enumerated-value'
  | 'datawindow-method'
  | 'datawindow-column'
  | 'datawindow-property'
  | 'sql-symbol'
  | 'dynamic'
  | 'unknown';

export type HoverConfidence = 'high' | 'medium' | 'low';

export type HoverNegativeReason = 'whitespace' | 'comment' | 'string' | 'keyword' | 'separator' | 'unresolved';

export interface HoverViewModelBlock {
  kind: 'context' | 'documentation' | 'warning' | 'details';
  lines: string[];
}

export interface HoverViewModel {
  kind: HoverKind;
  title?: string;
  signature?: string;
  summary?: string;
  blocks: HoverViewModelBlock[];
  confidence?: HoverConfidence;
  locale?: DocumentationLocale;
  preformattedMarkdown?: string;
}

export interface HoverResolutionSummary {
  confidence?: QueryResolutionConfidence;
  reasonCode?: QueryReasonCode;
  ambiguous?: boolean;
  ambiguityKind?: QueryAmbiguityKind;
  targetCount?: number;
}

const KIND_NAME: Record<string, string> = {
  Type: 'Type',
  Function: 'Function',
  Subroutine: 'Subroutine',
  Event: 'Event',
  Variable: 'Variable',
};

function sanitizeCallableSignature(signature?: string): string | undefined {
  if (!signature) {
    return undefined;
  }

  const sanitized = signature.split(';', 1)[0]?.trim().replace(/\s+/g, ' ');
  return sanitized && sanitized.length > 0 ? sanitized : undefined;
}

function buildEntityHeading(entity: Entity): string {
  if (entity.kind === EntityKind.Variable) {
    if (entity.declarationScope === 'parameter' || entity.scope === 'Argumento') {
      return `**Argument** \`${entity.name}\``;
    }
    if (entity.declarationScope === 'local' || entity.scope === 'Local') {
      return `**Local variable** \`${entity.name}\``;
    }
    if (entity.scope === 'Compartida') {
      return `**Shared variable** \`${entity.name}\``;
    }
    if (entity.scope === 'Global') {
      return `**Global variable** \`${entity.name}\``;
    }
    if (entity.lineage?.role === 'inherited') {
      return `**Inherited variable** \`${entity.name}\``;
    }
    return `**Instance variable** \`${entity.name}\``;
  }

  if (entity.kind === EntityKind.Type) {
    return `**Type** \`${entity.name}\``;
  }

  if (entity.isExternal && entity.kind === EntityKind.Function) {
    return `**External function** \`${entity.name}\``;
  }

  if (entity.isExternal && entity.kind === EntityKind.Subroutine) {
    return `**External subroutine** \`${entity.name}\``;
  }

  const kindName = KIND_NAME[entity.kind] ?? 'Symbol';
  if (entity.lineage?.role === 'inherited') {
    return `**Inherited ${kindName.toLowerCase()}** \`${entity.name}\``;
  }

  return `**${kindName}** \`${entity.name}\``;
}

function buildEntityContextLines(entity: Entity): string[] {
  const lines: string[] = [];

  if (entity.access && entity.declarationScope !== 'local' && entity.declarationScope !== 'parameter') {
    lines.push(`**Access:** \`${entity.access}\``);
  }

  if (entity.kind === EntityKind.Type && entity.baseTypeName) {
    lines.push(`**Inherits:** \`${entity.name} -> ${entity.baseTypeName}\``);
    lines.push(`Hereda de: ${entity.baseTypeName}`);
    return lines;
  }

  if (entity.declarationScope === 'local' || entity.declarationScope === 'parameter') {
    const callableSignature = sanitizeCallableSignature(entity.containerSignature);
    if (callableSignature) {
      lines.push(`**Scope:** \`${callableSignature}\``);
    } else if (entity.containerName) {
      lines.push(`**Scope:** \`${entity.containerName}\``);
    }
  } else if (entity.ownerName) {
    lines.push(`**Defined in:** \`${entity.ownerName}\``);
  } else if (entity.containerName) {
    lines.push(`**Defined in:** \`${entity.containerName}\``);
  }

  if (entity.lineage?.inheritedFrom && entity.kind !== EntityKind.Type) {
    lines.push(`**Inherited from:** \`${entity.lineage.inheritedFrom}\``);
  }

  return lines;
}

function buildExternalWarning(entity: Entity): string | null {
  if (!entity.isExternal) {
    return null;
  }

  if (entity.externalCallableKind === 'rpcfunc') {
    return 'Warning: external stored procedure declaration. Runtime behavior is not validated.';
  }

  return 'Warning: external/native call. Runtime behavior is not validated.';
}

function buildResolutionWarning(resolution?: HoverResolutionSummary): string | null {
  if (!resolution) {
    return null;
  }

  if (resolution.ambiguous) {
    return resolution.ambiguityKind === 'global-fallback'
      ? 'Warning: ambiguous target resolved through workspace fallback.'
      : 'Warning: ambiguous target; multiple candidates match the current context.';
  }

  switch (resolution.reasonCode) {
    case 'global-fallback':
      return 'Warning: resolved using workspace fallback; inherited members may be incomplete.';
    default:
      break;
  }

  if (resolution.confidence === 'low') {
    return 'Warning: low-confidence resolution.';
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

function formatSystemSymbolRisk(risk: NonNullable<PbSystemSymbolEntry['risk']>): string {
  switch (risk) {
    case 'safe':
      return 'seguro';
    case 'dynamic':
      return 'dinamico';
    case 'deprecated':
      return 'deprecated';
    case 'legacy':
      return 'legacy';
    case 'external':
      return 'externo';
  }
}

export function buildUserHoverViewModel(
  entity: Entity,
  resolution?: HoverResolutionSummary,
  options: { detailLines?: string[] } = {}
): HoverViewModel {
  const enriched = enrichEntity(entity);
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
  const contextLines = buildEntityContextLines(enriched);
  if (contextLines.length > 0) {
    blocks.push({ kind: 'context', lines: contextLines });
  }

  if (options.detailLines && options.detailLines.length > 0) {
    blocks.push({ kind: 'details', lines: options.detailLines });
  }

  const externalWarning = buildExternalWarning(enriched);
  const resolutionWarning = buildResolutionWarning(resolution);
  const warnings = [externalWarning, resolutionWarning].filter((line): line is string => Boolean(line));
  if (warnings.length > 0) {
    blocks.push({ kind: 'warning', lines: warnings });
  }

  if (enriched.documentation) {
    blocks.push({ kind: 'documentation', lines: [enriched.documentation] });
  }

  return {
    kind: classifyUserHoverKind(enriched),
    title: buildEntityHeading(enriched),
    signature,
    blocks,
    confidence: resolution?.ambiguous || resolution?.confidence === 'low'
      ? 'low'
      : resolution?.confidence === 'medium'
        ? 'medium'
        : 'high',
  };
}

export function buildSystemHoverViewModel(
  symbol: PbSystemSymbolEntry,
  catalog: SystemCatalog,
  documentationLocale: DocumentationLocale,
): HoverViewModel {
  const effectiveEnumValues = collectEffectiveEnumeratedTypeValues(symbol, catalog);
  const displaySummary = getDisplaySummary(symbol, documentationLocale);
  const displayDocumentation = getDisplayDocumentation(symbol, documentationLocale);
  const displayObsoleteMessage = getDisplayObsoleteMessage(symbol, documentationLocale);
  const displayUsageNotes = getDisplayUsageNotes(symbol, documentationLocale);
  const displayReturnDocumentation = getDisplayReturnDocumentation(symbol, documentationLocale);
  const blocks: HoverViewModelBlock[] = [];
  const warningLines: string[] = [];

  if (symbol.obsolete) {
    warningLines.push(`**⚠️ OBSOLETO:** ${displayObsoleteMessage || 'Evita usar esta función.'}`);
    if (symbol.replacement) {
      warningLines.push(`> *Usa \`${symbol.replacement}\` en su lugar.*`);
    }
  }
  if (symbol.risk) {
    warningLines.push(`**Riesgo de uso:** ${formatSystemSymbolRisk(symbol.risk)}`);
  }
  if (warningLines.length > 0) {
    blocks.push({ kind: 'warning', lines: warningLines });
  }

  const detailLines: string[] = [];
  if (symbol.signatures && symbol.signatures.length > 0) {
    const mainSig = symbol.signatures[0];
    if (mainSig.parameters && mainSig.parameters.length > 0) {
      detailLines.push('**Parámetros:**');
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
    detailLines.push(`**Retorno:** ${displayReturnDocumentation}`);
  }
  if (displayUsageNotes.length > 0) {
    detailLines.push('**Notas de uso:**');
    for (const usageNote of displayUsageNotes) {
      detailLines.push(`* ${usageNote}`);
    }
  }
  if (symbol.appliesTo && symbol.appliesTo.length > 0) {
    detailLines.push(`**Se aplica a:** ${symbol.appliesTo.join(', ')}`);
  }
  if (symbol.kind === 'enumerated-type' && effectiveEnumValues.length > 0) {
    detailLines.push(`**Valores:** ${effectiveEnumValues.join(', ')}`);
  }
  if (symbol.kind === 'enumerated-value' && symbol.enumValueOf) {
    detailLines.push(`**Tipo:** ${symbol.enumValueOf}`);
    if (symbol.enumNumericValue !== undefined) {
      detailLines.push(`**Valor numérico:** ${symbol.enumNumericValue}`);
    }
    if (symbol.enumValueMeaning) {
      detailLines.push(`**Significado:** ${symbol.enumValueMeaning}`);
    }
  }
  if (symbol.sourceUrl) {
    detailLines.push(`[📚 Documentación Oficial Appeon](${symbol.sourceUrl})`);
  }
  if (detailLines.length > 0) {
    blocks.push({ kind: 'details', lines: detailLines });
  }
  if (displayDocumentation) {
    blocks.push({ kind: 'documentation', lines: [displayDocumentation] });
  }

  return {
    kind: classifySystemHoverKind(symbol),
    signature: symbol.signatures?.[0]?.label ?? symbol.name,
    summary: displaySummary,
    blocks,
    confidence: 'high',
    locale: documentationLocale,
  };
}

export function buildLanguageHoverViewModel(
  symbol: PbSystemSymbolEntry,
  catalog: SystemCatalog,
  documentationLocale: DocumentationLocale,
): HoverViewModel {
  const effectiveEnumValues = collectEffectiveEnumeratedTypeValues(symbol, catalog);
  const displaySummary = getDisplaySummary(symbol, documentationLocale);
  const displayDocumentation = getDisplayDocumentation(symbol, documentationLocale);
  const blocks: HoverViewModelBlock[] = [];
  const detailLines: string[] = [];

  if (symbol.category) {
    detailLines.push(`**Categoría:** ${symbol.category}`);
  }
  if (symbol.kind === 'enumerated-type' && effectiveEnumValues.length > 0) {
    detailLines.push(`**Valores:** ${effectiveEnumValues.join(', ')}`);
  }
  if (symbol.kind === 'enumerated-value' && symbol.enumValueOf) {
    detailLines.push(`**Tipo:** ${symbol.enumValueOf}`);
    if (symbol.enumNumericValue !== undefined) {
      detailLines.push(`**Valor numérico:** ${symbol.enumNumericValue}`);
    }
    if (symbol.enumValueMeaning) {
      detailLines.push(`**Significado:** ${symbol.enumValueMeaning}`);
    }
  }
  if (detailLines.length > 0) {
    blocks.push({ kind: 'details', lines: detailLines });
  }
  if (displayDocumentation) {
    blocks.push({ kind: 'documentation', lines: [displayDocumentation] });
  }

  return {
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
  };
}

export function buildPreformattedHoverViewModel(kind: HoverKind, markdown: string): HoverViewModel {
  return {
    kind,
    blocks: [],
    preformattedMarkdown: markdown,
    confidence: kind === 'unknown' ? 'low' : 'high',
  };
}