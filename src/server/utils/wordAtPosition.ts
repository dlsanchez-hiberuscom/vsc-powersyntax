import { Position } from 'vscode-languageserver/node';

/**
 * Patrón de identificador válido en PowerBuilder/PowerScript.
 * Incluye letras, dígitos, underscores y el prefijo de scope (e.g. `this.`, `parent.`).
 */
const PB_IDENTIFIER_CHAR = /[a-zA-Z0-9_]/;

/**
 * Extrae el identificador PowerBuilder bajo la posición del cursor.
 * Devuelve null si no hay identificador válido en esa posición.
 */
export function getWordAtPosition(lines: string[], position: Position): string | null {
  const { line, character } = position;

  if (line < 0 || line >= lines.length) return null;

  const lineText = lines[line];
  if (character < 0 || character >= lineText.length) return null;

  // Si el carácter bajo el cursor no es parte de un identificador, no hay palabra
  if (!PB_IDENTIFIER_CHAR.test(lineText[character])) return null;

  // Expandir hacia la izquierda
  let start = character;
  while (start > 0 && PB_IDENTIFIER_CHAR.test(lineText[start - 1])) {
    start--;
  }

  // Expandir hacia la derecha
  let end = character;
  while (end < lineText.length - 1 && PB_IDENTIFIER_CHAR.test(lineText[end + 1])) {
    end++;
  }

  const word = lineText.substring(start, end + 1);

  // Descartar si es puramente numérico (no es un identificador)
  if (/^\d+$/.test(word)) return null;

  return word;
}
