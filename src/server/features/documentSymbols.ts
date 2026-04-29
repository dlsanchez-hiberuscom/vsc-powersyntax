import { DocumentSymbol, SymbolKind } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { getDocumentAnalysis } from '../analysis/analysisCache';
import { createSectionSymbol, findEnclosingSection } from '../parsing/sections';
import {
  matchEventImplementationHeader,
  matchFunctionImplementationHeader,
  matchOnImplementationHeader,
  matchTypeDefinition
} from '../parsing/matchers';
import {
  createSymbol,
  eventSelectionStart,
  findBlockEnd
} from '../utils/helpers';
import {
  END_TYPE_PATTERN,
  END_FUNCTION_PATTERN,
  END_SUBROUTINE_PATTERN,
  END_EVENT_PATTERN,
  END_ON_PATTERN
} from '../parsing/grammar';

export function extractDocumentSymbols(document: TextDocument): DocumentSymbol[] {
  const analysis = getDocumentAnalysis(document);
  const { lines, sections } = analysis;
  const symbols: DocumentSymbol[] = [];

  for (const section of sections) {
    symbols.push(createSectionSymbol(lines, section));
  }

  const typeSymbolsMap = new Map<string, DocumentSymbol>();
  let currentContainerName: string | undefined;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const enclosingSection = findEnclosingSection(i, sections);

    if (
      enclosingSection?.kind === 'prototypes' ||
      enclosingSection?.kind === 'variables'
    ) {
      i++;
      continue;
    }

    const typeMatch = matchTypeDefinition(line);
    if (typeMatch) {
      if (enclosingSection?.kind !== 'forward') {
        currentContainerName = typeMatch.name.toLowerCase();
      }
      const endLine = findBlockEnd(lines, i, [END_TYPE_PATTERN]);
      if (endLine > i) {
        const sym = createSymbol(
            typeMatch.name,
            SymbolKind.Class,
            i,
            line.indexOf(typeMatch.name),
            endLine,
            lines[endLine].length,
            typeMatch.container
              ? `type from ${typeMatch.ancestor} within ${typeMatch.container}`
              : `type from ${typeMatch.ancestor}`
        );

        // Truco para LSP: expandir el rango del contenedor hasta el EOF
        // para que VS Code permita anidar funciones y eventos que están más abajo.
        sym.range.end.line = lines.length - 1;
        sym.range.end.character = lines[lines.length - 1].length;

        typeSymbolsMap.set(typeMatch.name.toLowerCase(), sym);

        if (typeMatch.container) {
          const parent = typeSymbolsMap.get(typeMatch.container.toLowerCase());
          if (parent) {
            parent.children!.push(sym);
          } else {
            symbols.push(sym);
          }
        } else {
          symbols.push(sym);
        }

        i = endLine + 1;
        continue;
      }
    }

    if (!enclosingSection) {
      const fn = matchFunctionImplementationHeader(line);
      if (fn) {
        const endPatterns =
          fn.kind === 'function'
            ? [END_FUNCTION_PATTERN]
            : [END_SUBROUTINE_PATTERN];

        const endLine = findBlockEnd(lines, i, endPatterns);
        if (endLine > i) {
          const sym = createSymbol(
              fn.name,
              SymbolKind.Function,
              i,
              line.indexOf(fn.name),
              endLine,
              lines[endLine].length,
              fn.kind === 'function'
                ? `function : ${fn.returnType}`
                : 'subroutine'
          );

          if (currentContainerName) {
            const parent = typeSymbolsMap.get(currentContainerName);
            if (parent) {
              parent.children!.push(sym);
            } else {
              symbols.push(sym);
            }
          } else {
            symbols.push(sym);
          }

          i = endLine + 1;
          continue;
        }
      }

      const ev =
        matchEventImplementationHeader(line) ?? matchOnImplementationHeader(line);

      if (ev) {
        const endLine = findBlockEnd(lines, i, [
          END_EVENT_PATTERN,
          END_ON_PATTERN
        ]);

        if (endLine > i) {
          const sym = createSymbol(
              ev.name,
              SymbolKind.Event,
              i,
              eventSelectionStart(line, ev.name),
              endLine,
              lines[endLine].length,
              ev.detail
          );

          if (currentContainerName) {
            const parent = typeSymbolsMap.get(currentContainerName);
            if (parent) {
              parent.children!.push(sym);
            } else {
              symbols.push(sym);
            }
          } else {
            symbols.push(sym);
          }

          i = endLine + 1;
          continue;
        }
      }
    }

    i++;
  }

  symbols.sort((a, b) => a.range.start.line - b.range.start.line);
  return symbols;
}
