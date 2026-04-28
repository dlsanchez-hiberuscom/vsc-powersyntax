import { Position } from 'vscode-languageserver/node';

const PB_IDENTIFIER_CHAR = /[a-zA-Z0-9_]/;

export interface InvocationContext {
  /** El identificador bajo el cursor (e.g. 'of_init') */
  identifier: string;
  /** El cualificador antes del punto o doble punto (e.g. 'this', 'super', 'my_var') */
  qualifier?: string;
}

export function getInvocationContext(lines: string[], position: Position): InvocationContext | null {
  const { line, character } = position;

  if (line < 0 || line >= lines.length) return null;

  const lineText = lines[line];
  if (character < 0 || character >= lineText.length) return null;

  if (!PB_IDENTIFIER_CHAR.test(lineText[character])) return null;

  // 1. Expandir para obtener el identifier
  let start = character;
  while (start > 0 && PB_IDENTIFIER_CHAR.test(lineText[start - 1])) {
    start--;
  }

  let end = character;
  while (end < lineText.length - 1 && PB_IDENTIFIER_CHAR.test(lineText[end + 1])) {
    end++;
  }

  const identifier = lineText.substring(start, end + 1);
  if (/^\d+$/.test(identifier)) return null;

  // 2. Buscar cualificador hacia atrás
  let qStart = start - 1;
  
  // Ignorar espacios en blanco antes del identifier
  while (qStart >= 0 && /\s/.test(lineText[qStart])) {
    qStart--;
  }

  if (qStart < 0) {
    return { identifier };
  }

  // Comprobar si hay un separador '.' o '::'
  let hasSeparator = false;
  if (lineText[qStart] === '.') {
    hasSeparator = true;
    qStart--;
  } else if (qStart >= 1 && lineText[qStart] === ':' && lineText[qStart - 1] === ':') {
    hasSeparator = true;
    qStart -= 2;
  }

  if (!hasSeparator) {
    return { identifier };
  }

  // Ignorar espacios antes del separador
  while (qStart >= 0 && /\s/.test(lineText[qStart])) {
    qStart--;
  }

  if (qStart < 0 || !PB_IDENTIFIER_CHAR.test(lineText[qStart])) {
    return { identifier };
  }

  // Extraer el cualificador
  let qualEnd = qStart;
  let qualStart = qStart;
  while (qualStart > 0 && PB_IDENTIFIER_CHAR.test(lineText[qualStart - 1])) {
    qualStart--;
  }

  const qualifier = lineText.substring(qualStart, qualEnd + 1);

  return { identifier, qualifier };
}
