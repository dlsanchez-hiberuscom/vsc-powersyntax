import {
  Hover,
  MarkupKind,
  Position,
  Range
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { SymbolFact } from '../model/types';
import { getDocumentAnalysis } from '../analysis/analysisCache';

export function provideHover(
  document: TextDocument,
  position: Position
): Hover | null {
  const analysis = getDocumentAnalysis(document);
  const lineFacts = analysis.facts.filter((fact) => fact.line === position.line);

  const hit = lineFacts.find(
    (fact) =>
      position.character >= fact.startCharacter &&
      position.character <= fact.endCharacter
  );

  if (!hit) {
    return null;
  }

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: buildHoverMarkdown(hit)
    },
    range: Range.create(
      Position.create(hit.line, hit.startCharacter),
      Position.create(hit.line, hit.endCharacter)
    )
  };
}

function buildHoverMarkdown(fact: SymbolFact): string {
  switch (fact.kind) {
    case 'type':
      return [
        `**TYPE** \`${fact.name}\``,
        '',
        fact.declarationOnly ? '_Declaration-only_' : '_Definition_',
        fact.detail ? `**Detail:** ${fact.detail}` : ''
      ]
        .filter(Boolean)
        .join('\n');

    case 'function':
    case 'subroutine':
      return [
        `**${fact.kind.toUpperCase()}** \`${fact.name}\``,
        '',
        fact.declarationOnly ? '_Declaration-only_' : '_Definition_',
        fact.detail ? `**Signature:** ${fact.detail}` : ''
      ]
        .filter(Boolean)
        .join('\n');

    case 'event':
      return [
        `**EVENT** \`${fact.name}\``,
        '',
        fact.declarationOnly ? '_Declaration-only_' : '_Definition_',
        fact.detail ? `**Signature:** ${fact.detail}` : ''
      ]
        .filter(Boolean)
        .join('\n');

    case 'variable':
      return [
        `**VARIABLE** \`${fact.name}\``,
        '',
        fact.detail ? `**Declaration:** ${fact.detail}` : ''
      ]
        .filter(Boolean)
        .join('\n');

    case 'section':
      return [
        `**SECTION** \`${fact.name}\``,
        '',
        fact.detail ?? ''
      ]
        .filter(Boolean)
        .join('\n');

    default:
      return `\`${fact.name}\``;
  }
}
