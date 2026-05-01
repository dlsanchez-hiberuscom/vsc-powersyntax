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
import { resolveDocumentQueryTargets } from './queryContext';
import { formatLineageHover, formatUserHover } from './hoverFormat';

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
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: formatUserHover(definition)
      }
    };
  }

  // 2. Si no hay en el usuario, buscar en el catálogo del sistema (PowerBuilder oficial)
  const systemSymbols = catalog.findSystemSymbol(identifier);
  if (systemSymbols.length > 0) {
    // Tomamos la primera coincidencia
    const symbol = systemSymbols[0];
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: buildSystemSymbolMarkdown(symbol)
      }
    };
  }

  return null;
}

/**
 * Formatea un PbSystemSymbolEntry como un Markdown rico con firmas, resumen y enlaces.
 */
function buildSystemSymbolMarkdown(symbol: PbSystemSymbolEntry): string {
  const lines: string[] = [];

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
