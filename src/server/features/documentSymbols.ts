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

export function extractDocumentSymbols(document: TextDocument): DocumentSymbol[] {
  const analysis = getDocumentAnalysis(document);
  const { lines, sections } = analysis;
  const symbols: DocumentSymbol[] = [];

  for (const section of sections) {
    symbols.push(createSectionSymbol(lines, section));
  }

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
      const endLine = findBlockEnd(lines, i, [/^\s*end\s+type\b/i]);
      if (endLine > i) {
        symbols.push(
          createSymbol(
            typeMatch.name,
            SymbolKind.Class,
            i,
            line.indexOf(typeMatch.name),
            endLine,
            lines[endLine].length,
            typeMatch.container
              ? `type from ${typeMatch.ancestor} within ${typeMatch.container}`
              : `type from ${typeMatch.ancestor}`
          )
        );
        i = endLine + 1;
        continue;
      }
    }

    if (!enclosingSection) {
      const fn = matchFunctionImplementationHeader(line);
      if (fn) {
        const endPatterns =
          fn.kind === 'function'
            ? [/^\s*end\s+function\b/i]
            : [/^\s*end\s+subroutine\b/i];

        const endLine = findBlockEnd(lines, i, endPatterns);
        if (endLine > i) {
          symbols.push(
            createSymbol(
              fn.name,
              SymbolKind.Function,
              i,
              line.indexOf(fn.name),
              endLine,
              lines[endLine].length,
              fn.kind === 'function'
                ? `function : ${fn.returnType}`
                : 'subroutine'
            )
          );
          i = endLine + 1;
          continue;
        }
      }

      const ev =
        matchEventImplementationHeader(line) ?? matchOnImplementationHeader(line);

      if (ev) {
        const endLine = findBlockEnd(lines, i, [
          /^\s*end\s+event\b/i,
          /^\s*end\s+on\b/i
        ]);

        if (endLine > i) {
          symbols.push(
            createSymbol(
              ev.name,
              SymbolKind.Event,
              i,
              eventSelectionStart(line, ev.name),
              endLine,
              lines[endLine].length,
              ev.detail
            )
          );
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
