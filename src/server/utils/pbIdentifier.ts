import { PB_IDENTIFIER_CHAR_SOURCE, PB_IDENTIFIER_SOURCE, PB_IDENTIFIER_START_SOURCE } from '../parsing/grammar';

export interface IdentifierSpan {
  word: string;
  start: number;
  end: number;
}

const PB_IDENTIFIER_CHAR_RE = new RegExp(`^${PB_IDENTIFIER_CHAR_SOURCE}$`, 'i');
const PB_IDENTIFIER_START_RE = new RegExp(`^${PB_IDENTIFIER_START_SOURCE}$`, 'i');
const PB_IDENTIFIER_RE = new RegExp(`^${PB_IDENTIFIER_SOURCE}$`, 'i');

export function isPowerBuilderIdentifierChar(value: string | undefined): boolean {
  return typeof value === 'string' && value.length > 0 && PB_IDENTIFIER_CHAR_RE.test(value);
}

export function isPowerBuilderIdentifierBoundary(text: string, index: number): boolean {
  return index < 0 || index >= text.length || !isPowerBuilderIdentifierChar(text[index]);
}

export function hasPowerBuilderIdentifierBoundaries(text: string, start: number, end: number): boolean {
  return isPowerBuilderIdentifierBoundary(text, start - 1) && isPowerBuilderIdentifierBoundary(text, end);
}

export function findPowerBuilderIdentifierSpan(
  text: string,
  character: number,
  options: { allowCursorAfterIdentifier?: boolean } = {}
): IdentifierSpan | null {
  if (!text || character < 0 || character > text.length) {
    return null;
  }

  let cursor = character;
  if (!isPowerBuilderIdentifierChar(text[cursor])) {
    if (text[cursor] === '!' && cursor > 0 && isPowerBuilderIdentifierChar(text[cursor - 1])) {
      cursor--;
    } else {
      const cursorAfterEnumValue = cursor > 1 && text[cursor - 1] === '!' && isPowerBuilderIdentifierChar(text[cursor - 2]);
      if (!options.allowCursorAfterIdentifier || cursor === 0 || (!isPowerBuilderIdentifierChar(text[cursor - 1]) && !cursorAfterEnumValue)) {
        return null;
      }

      cursor -= cursorAfterEnumValue ? 2 : 1;
    }
  }

  let start = cursor;
  while (start > 0 && isPowerBuilderIdentifierChar(text[start - 1])) {
    start--;
  }

  let end = cursor + 1;
  while (end < text.length && isPowerBuilderIdentifierChar(text[end])) {
    end++;
  }

  if (text[end] === '!') {
    end++;
  }

  const word = text.slice(start, end);
  const baseWord = word.endsWith('!') ? word.slice(0, -1) : word;
  if (!PB_IDENTIFIER_RE.test(baseWord) || !PB_IDENTIFIER_START_RE.test(baseWord[0] ?? '')) {
    return null;
  }

  return { word, start, end };
}