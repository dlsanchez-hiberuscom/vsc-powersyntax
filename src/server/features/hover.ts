import {
  Hover,
  MarkupKind,
  Position
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { PbSystemSymbolEntry } from '../knowledge/system/types';
import { systemProvenanceToLineage } from '../knowledge/system/normalization';
import type { HotContextCache } from '../knowledge/HotContextCache';
import { EntityKind } from '../knowledge/types';
import { provideDataWindowLegacyHover } from './dataWindowLegacySafeMode';
import { providePowerScriptDataWindowPropertyHover } from './dataWindowPropertyPaths';
import { buildHierarchyInspection } from './hierarchyInspection';
import { resolveDocumentQualifierType, resolveDocumentQueryTargets } from './queryContext';
import { summarizeDataWindowSafeMode } from './dataWindowSafeMode';
import { formatLineageHover, formatUserHover } from './hoverFormat';

function buildLifecycleHoverBlock(
  entity: import('../knowledge/types').Entity,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  catalog: SystemCatalog
): string | null {
  if (entity.kind !== EntityKind.Event) {
    return null;
  }

  const eventName = entity.name.toLowerCase();
  if (!['create', 'destroy', 'constructor', 'destructor'].includes(eventName)) {
    return null;
  }

  const focusType = entity.ownerName ?? entity.containerName ?? entity.fileObjectName;
  if (!focusType) {
    return null;
  }

  const inspection = buildHierarchyInspection(focusType, graph, kb, catalog);
  const lines: string[] = ['', '**Lifecycle**'];

  if (eventName === 'create' || eventName === 'destroy') {
    const phase = inspection.lifecycle.find((entry) => entry.phase === eventName);
    if (!phase) {
      return null;
    }

    lines.push(`- Fase: ${phase.phase}`);
    lines.push(`- Declarado en: ${phase.declaredIn ?? 'origen desconocido'}`);
    lines.push(`- call super::${phase.phase}: ${phase.callsAncestor ? 'sí' : 'no'}`);
    lines.push(`- Hook: ${phase.triggersHook ? `${phase.triggersHook}${phase.hookResolved ? ` → ${phase.hookDeclaredIn ?? 'origen desconocido'}` : ' no resuelto'}` : 'sin trigger explícito'}`);
    for (const warning of phase.warnings) {
      lines.push(`- Warning: ${warning}`);
    }
    return lines.join('\n');
  }

  const relatedPhase = inspection.lifecycle.find((entry) => entry.triggersHook === eventName);
  if (!relatedPhase) {
    return null;
  }

  lines.push(`- Hook: ${eventName}`);
  lines.push(`- Disparado desde: ${relatedPhase.phase}`);
  lines.push(`- call super::${relatedPhase.phase}: ${relatedPhase.callsAncestor ? 'sí' : 'no'}`);
  lines.push(`- Declarado en hook: ${relatedPhase.hookDeclaredIn ?? 'origen desconocido'}`);
  for (const warning of relatedPhase.warnings) {
    lines.push(`- Warning: ${warning}`);
  }

  return lines.join('\n');
}

function buildDataWindowHoverBlock(
  entity: import('../knowledge/types').Entity,
  kb: KnowledgeBase
): string | null {
  if (entity.kind !== EntityKind.Type || (entity.baseTypeName ?? '').toLowerCase() !== 'datawindow') {
    return null;
  }

  const summary = summarizeDataWindowSafeMode(kb.getDocumentSnapshot(entity.uri));
  if (!summary) {
    return null;
  }

  const lines: string[] = ['', '**DataWindow Safe Mode**'];
  if (summary.retrieve) {
    lines.push(`- SQL base: \`${summary.retrieve}\``);
  }
  if (summary.retrieveArguments.length > 0) {
    lines.push(`- Args retrieve: ${summary.retrieveArguments.map((argument) => `\`${argument.label}\``).join(', ')}`);
  }
  if (summary.columns.length > 0) {
    const preview = summary.columns.slice(0, 4).map((column) => `\`${column.name}: ${column.type}\``).join(', ');
    const suffix = summary.columns.length > 4 ? ` (+${summary.columns.length - 4} más)` : '';
    lines.push(`- Columnas: ${preview}${suffix}`);
  }
  if (summary.bands.length > 0) {
    lines.push(`- Bandas: ${summary.bands.map((band) => `\`${band}\``).join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Provee la información de Hover cuando el usuario pone el ratón sobre una palabra.
 */
export function provideHover(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  catalog: SystemCatalog,
  graph: InheritanceGraph,
  hotContext?: HotContextCache
): Hover | null {
  const dataWindowHover = provideDataWindowLegacyHover(document, position)
    ?? providePowerScriptDataWindowPropertyHover(document, position, kb);
  if (dataWindowHover) {
    return dataWindowHover;
  }

  const resolved = resolveDocumentQueryTargets(document, position, kb, graph, hotContext, 'hover');
  if (!resolved) {
    return null;
  }

  const { identifier } = resolved.context;

  // 1. Buscar en la KnowledgeBase (Definiciones del usuario/proyecto) mediante resolución semántica
  const userDefinitions = resolved.targets;
  if (userDefinitions.length > 0) {
    // Tomamos la primera definición (el override más cercano o coincidencia exacta)
    const definition = userDefinitions[0];
    const lifecycleBlock = buildLifecycleHoverBlock(definition, kb, graph, catalog);
    const dataWindowBlock = buildDataWindowHoverBlock(definition, kb);
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: `${formatUserHover(definition, {
          confidence: resolved.confidence,
          reasonCode: resolved.reasonCodes[0],
          ambiguous: resolved.targets.length > 1,
          ambiguityKind: resolved.ambiguityKind,
          targetCount: resolved.targets.length
        })}${lifecycleBlock ? `\n${lifecycleBlock}` : ''}${dataWindowBlock ? `\n${dataWindowBlock}` : ''}`
      }
    };
  }

  // 2. Si no hay en el usuario, buscar en el catálogo del sistema (PowerBuilder oficial)
  const ownerType = resolved.context.qualifier
    ? resolveDocumentQualifierType(document, resolved.context.qualifier, position, kb)
    : undefined;
  const ownerScopedSymbol = ownerType
    ? catalog.resolveMemberFunctionForOwner(identifier, [ownerType])
      ?? catalog.resolveEventForOwner(identifier, [ownerType])
    : undefined;
  const systemSymbols = resolved.context.qualifier
    ? (ownerScopedSymbol ? [ownerScopedSymbol] : [])
    : catalog.findSystemSymbol(identifier);
  if (systemSymbols.length > 0) {
    // Tomamos la primera coincidencia
    const symbol = systemSymbols[0];
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: buildSystemSymbolMarkdown(symbol, catalog)
      }
    };
  }

  // 3. Si no hay callable/event/statement, buscar símbolos de lenguaje (keyword, datatype, pronoun, etc.)
  const langSymbol = catalog.resolveLanguageSymbol(identifier);
  if (langSymbol) {
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: buildLanguageSymbolMarkdown(langSymbol, catalog)
      }
    };
  }

  return null;
}

/**
 * Formatea un PbSystemSymbolEntry como un Markdown rico con firmas, resumen y enlaces.
 */
function buildSystemSymbolMarkdown(symbol: PbSystemSymbolEntry, catalog: SystemCatalog): string {
  const lines: string[] = [];
  const effectiveEnumValues = collectEffectiveEnumeratedTypeValues(symbol, catalog);

  // Firma principal (tomamos la primera, a futuro se podría mostrar que hay N sobrecargas)
  if (symbol.signatures && symbol.signatures.length > 0) {
    const mainSig = symbol.signatures[0];
    lines.push(`\`\`\`powerbuilder\n${mainSig.label}\n\`\`\``);
  } else {
    lines.push(`\`\`\`powerbuilder\n${symbol.name}\n\`\`\``);
  }

  lines.push('---');
  
  if (symbol.obsolete) {
    lines.push(`**⚠️ OBSOLETO:** ${symbol.obsoleteMessage || 'Evita usar esta función.'}`);
    if (symbol.replacement) {
      lines.push(`> *Usa \`${symbol.replacement}\` en su lugar.*`);
    }
    lines.push('');
  }

  if (symbol.summary) {
    lines.push(symbol.summary);
  }

  if (symbol.risk) {
    lines.push('');
    lines.push(`**Riesgo de uso:** ${formatSystemSymbolRisk(symbol.risk)}`);
  }

  if (symbol.signatures && symbol.signatures.length > 0) {
    const mainSig = symbol.signatures[0];
    if (mainSig.parameters && mainSig.parameters.length > 0) {
      lines.push('');
      lines.push('**Parámetros:**');
      for (const p of mainSig.parameters) {
        lines.push(`* \`${p.label}\`${p.documentation ? `: ${p.documentation}` : ''}`);
      }
    }
  }
  
  if (symbol.appliesTo && symbol.appliesTo.length > 0) {
    lines.push('');
    lines.push(`**Se aplica a:** ${symbol.appliesTo.join(', ')}`);
  }

  if (symbol.kind === 'enumerated-type' && effectiveEnumValues.length > 0) {
    lines.push('');
    lines.push(`**Valores:** ${effectiveEnumValues.join(', ')}`);
  }

  if (symbol.kind === 'enumerated-value' && symbol.enumValueOf) {
    lines.push('');
    lines.push(`**Tipo:** ${symbol.enumValueOf}`);
    if (symbol.enumNumericValue !== undefined) {
      lines.push(`**Valor numérico:** ${symbol.enumNumericValue}`);
    }
    if (symbol.enumValueMeaning) {
      lines.push(`**Significado:** ${symbol.enumValueMeaning}`);
    }
  }

  if (symbol.sourceUrl) {
    lines.push('');
    lines.push(`[📚 Documentación Oficial Appeon](${symbol.sourceUrl})`);
  }

  const lineage = formatLineageHover(systemProvenanceToLineage(symbol.provenance));
  if (lineage) {
    lines.push('');
    lines.push(lineage);
  }

  return lines.join('\n');
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

/**
 * Formatea un símbolo de lenguaje (keyword, datatype, pronoun, etc.) como Markdown compacto.
 */
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

function buildLanguageSymbolMarkdown(symbol: PbSystemSymbolEntry, catalog: SystemCatalog): string {
  const kindLabels: Record<string, string> = {
    'keyword': '🔤 Palabra clave',
    'reserved-word': '🔒 Palabra reservada',
    'datatype': '📦 Tipo de dato',
    'system-type': '🏛️ Tipo de sistema',
    'enumerated-type': '🏷️ Tipo enumerado',
    'operator': '⚡ Operador',
    'pronoun': '👆 Pronombre de objeto',
    'system-global': '🌐 Global del sistema',
    'enumerated-value': '🔖 Valor enumerado',
    'property': '🔧 Propiedad',
    'constant': '📌 Constante',
  };

  const lines: string[] = [];
  const effectiveEnumValues = collectEffectiveEnumeratedTypeValues(symbol, catalog);
  lines.push(`\`\`\`powerbuilder\n${symbol.name}\n\`\`\``);
  lines.push('---');
  lines.push(kindLabels[symbol.kind] ?? `📋 ${symbol.kind}`);
  if (symbol.summary) {
    lines.push('');
    lines.push(symbol.summary);
  }
  if (symbol.category) {
    lines.push('');
    lines.push(`**Categoría:** ${symbol.category}`);
  }
  if (symbol.documentation) {
    lines.push('');
    lines.push(symbol.documentation);
  }
  if (symbol.kind === 'enumerated-type' && effectiveEnumValues.length > 0) {
    lines.push('');
    lines.push(`**Valores:** ${effectiveEnumValues.join(', ')}`);
  }
  if (symbol.kind === 'enumerated-value' && symbol.enumValueOf) {
    lines.push('');
    lines.push(`**Tipo:** ${symbol.enumValueOf}`);
    if (symbol.enumNumericValue !== undefined) {
      lines.push(`**Valor numérico:** ${symbol.enumNumericValue}`);
    }
    if (symbol.enumValueMeaning) {
      lines.push(`**Significado:** ${symbol.enumValueMeaning}`);
    }
  }

  return lines.join('\n');
}
