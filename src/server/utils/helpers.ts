import {
  InternalDocumentSymbol,
  InternalDocumentSymbolKind,
  type TextPosition,
  type TextRange,
} from '../model/types';

export function eventSelectionStart(line: string, name: string): number {
  const index = line.indexOf(name);
  return index >= 0 ? index : 0;
}

export function createSymbol(
  name: string,
  kind: InternalDocumentSymbolKind,
  startLine: number,
  startCharacter: number,
  endLine: number,
  endCharacter: number,
  detail?: string
): InternalDocumentSymbol {
  const safeStart = Math.max(0, startCharacter);
  const safeEnd = Math.max(0, endCharacter);

  return {
    name,
    kind,
    detail,
    range: createRange(startLine, safeStart, endLine, safeEnd),
    selectionRange: createRange(startLine, safeStart, startLine, safeStart + name.length),
    children: []
  };
}

export function createPosition(line: number, character: number): TextPosition {
  return { line, character };
}

export function createRange(
  startLine: number,
  startCharacter: number,
  endLine: number,
  endCharacter: number,
): TextRange {
  return {
    start: createPosition(startLine, startCharacter),
    end: createPosition(endLine, endCharacter),
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