import { Position } from 'vscode-languageserver/node';
import { findPowerBuilderIdentifierSpan } from './pbIdentifier';

/**
 * Extrae el identificador PowerBuilder bajo la posición del cursor.
 * Devuelve null si no hay identificador válido en esa posición.
 */
export function getWordAtPosition(lines: string[], position: Position): string | null {
  const { line, character } = position;

  if (line < 0 || line >= lines.length) return null;

  const lineText = lines[line];
  const span = findPowerBuilderIdentifierSpan(lineText, character);
  return span?.word ?? null;
}
