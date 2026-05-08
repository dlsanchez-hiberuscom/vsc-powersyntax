import { Position } from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';

export function getDocumentLineText(document: TextDocument, line: number): string {
  if (line < 0 || line >= document.lineCount) {
    return '';
  }

  const text = document.getText();
  if (typeof (document as { offsetAt?: unknown }).offsetAt !== 'function') {
    const lines = text.split(/\r?\n/);
    return lines[line] ?? '';
  }

  const startOffset = document.offsetAt(Position.create(line, 0));
  let endOffset = startOffset;

  while (endOffset < text.length) {
    const char = text[endOffset];
    if (char === '\n' || char === '\r') {
      break;
    }
    endOffset += 1;
  }

  return text.slice(startOffset, endOffset);
}