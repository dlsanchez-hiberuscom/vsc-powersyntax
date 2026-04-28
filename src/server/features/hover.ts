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
import { Entity } from '../knowledge/types';
import { getInvocationContext } from '../utils/invocationContext';
import { resolveTargetEntity } from '../knowledge/resolution/semanticQueryService';

/**
 * Provee la información de Hover cuando el usuario pone el ratón sobre una palabra.
 */
export function provideHover(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  catalog: SystemCatalog,
  graph: InheritanceGraph
): Hover | null {
  const lines = document.getText().split(/\r?\n/);
  const context = getInvocationContext(lines, position);

  if (!context) {
    return null;
  }

  const { identifier } = context;

  // 1. Buscar en la KnowledgeBase (Definiciones del usuario/proyecto) mediante resolución semántica
  const userDefinitions = resolveTargetEntity(context, document.uri, kb, graph);
  if (userDefinitions.length > 0) {
    // Tomamos la primera definición (el override más cercano o coincidencia exacta)
    const definition = userDefinitions[0];
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: buildUserEntityMarkdown(definition)
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

  if (symbol.sourceUrl) {
    lines.push('');
    lines.push(`[📚 Documentación Oficial Appeon](${symbol.sourceUrl})`);
  }

  return lines.join('\n');
}

/**
 * Formatea una Entity del usuario (KnowledgeBase) como Markdown básico.
 */
function buildUserEntityMarkdown(entity: Entity): string {
  // Convertimos el tipo numérico al nombre amigable para humanos
  const kindMap: Record<number, string> = {
    1: 'Type / Object',
    2: 'Function',
    3: 'Subroutine',
    4: 'Event',
    5: 'Variable'
  };
  const kindName = kindMap[entity.kind as unknown as number] || 'Symbol';

  const lines: string[] = [];
  lines.push(`\`\`\`powerbuilder\n(${kindName}) ${entity.name}\n\`\`\``);
  lines.push('---');
  lines.push(`Definido en el proyecto.`);

  return lines.join('\n');
}
