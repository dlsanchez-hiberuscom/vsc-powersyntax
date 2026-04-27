import {
  DocumentSymbol,
  Position,
  Range,
  SymbolKind
} from 'vscode-languageserver/node';

export function eventSelectionStart(line: string, name: string): number {
  const index = line.indexOf(name);
  return index >= 0 ? index : 0;
}

export function createSymbol(
  name: string,
  kind: SymbolKind,
  startLine: number,
  startCharacter: number,
  endLine: number,
  endCharacter: number,
  detail?: string
): DocumentSymbol {
  const safeStart = Math.max(0, startCharacter);
  const safeEnd = Math.max(0, endCharacter);

  return {
    name,
    kind,
    detail,
    range: Range.create(
      Position.create(startLine, safeStart),
      Position.create(endLine, safeEnd)
    ),
    selectionRange: Range.create(
      Position.create(startLine, safeStart),
      Position.create(startLine, safeStart + name.length)
    ),
    children: []
  };
}

export function findBlockEnd(
  lines: string[],
  startLine: number,
  endPatterns: RegExp[]
): number {
  for (let i = startLine + 1; i < lines.length; i++) {
    for (const pattern of endPatterns) {
      if (pattern.test(lines[i])) {
        return i;
      }
    }
  }

  return startLine;
}

export function firstNonWhitespace(text: string): number {
  const match = text.match(/\S/);
  return match ? (match.index ?? 0) : 0;
}

export function normalizeSpace(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}