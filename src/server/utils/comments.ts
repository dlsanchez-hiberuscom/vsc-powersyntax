/**
 * Utilidades para el manejo de comentarios en PowerScript.
 */

export enum CharType {
  None = 0,
  Code = 1,
  Comment = 2,
  String = 3
}

export interface StrippedResult {
  lines: string[];
  masks: Uint8Array[];
}

/**
 * Elimina los comentarios de un conjunto de líneas, preservando la longitud de las líneas
 * y las posiciones de los caracteres reemplazando los comentarios por espacios en blanco.
 * Maneja tanto comentarios de línea (//) como bloques de comentarios (/* * /).
 * 
 * @param lines Array de líneas originales.
 * @returns Objeto con las líneas limpias y máscaras de tipos de caracteres.
 */
export function stripCommentsSmart(lines: string[]): StrippedResult {
  const resultLines: string[] = [];
  const resultMasks: Uint8Array[] = [];
  let blockCommentDepth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let strippedLine = '';
    const mask = new Uint8Array(line.length);
    let j = 0;

    while (j < line.length) {
      const char = line[j];
      const nextChar = line[j + 1];

      if (blockCommentDepth > 0) {
        mask[j] = CharType.Comment;
        if (char === '/' && nextChar === '*') {
          blockCommentDepth++;
          strippedLine += '  ';
          mask[j + 1] = CharType.Comment;
          j += 2;
        } else if (char === '*' && nextChar === '/') {
          blockCommentDepth = Math.max(0, blockCommentDepth - 1);
          strippedLine += '  ';
          mask[j + 1] = CharType.Comment;
          j += 2;
        } else {
          strippedLine += ' ';
          j++;
        }
      } else if (inString) {
        mask[j] = CharType.String;
        if (char === '~') {
          // Carácter de escape en PowerBuilder
          strippedLine += char;
          const escapeLen = getEscapeLength(line, j);
          if (escapeLen > 1) {
            for (let k = 1; k < escapeLen; k++) {
              if (j + k < line.length) {
                mask[j + k] = CharType.String;
              }
            }
            const substringEnd = Math.min(j + escapeLen, line.length);
            strippedLine += line.substring(j + 1, substringEnd);
            j += escapeLen;
          } else {
            // `~` al final de la línea o sin carácter siguiente: lo conservamos como tal.
            j++;
          }
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
          strippedLine += char;
          j++;
        } else {
          strippedLine += char;
          j++;
        }
      } else {
        if (char === '/' && nextChar === '*') {
          blockCommentDepth++;
          strippedLine += '  ';
          mask[j] = CharType.Comment;
          mask[j + 1] = CharType.Comment;
          j += 2;
        } else if (char === '/' && nextChar === '/') {
          strippedLine += ' '.repeat(line.length - j);
          while (j < line.length) {
            mask[j] = CharType.Comment;
            j++;
          }
          break;
        } else if (char === '"' || char === "'") {
          inString = true;
          stringChar = char;
          strippedLine += char;
          mask[j] = CharType.String;
          j++;
        } else {
          strippedLine += char;
          mask[j] = char === ' ' || char === '\t' ? CharType.None : CharType.Code;
          j++;
        }
      }
    }

    // Al final de la línea, si estamos en un string, verificamos si hay continuación (&)
    if (inString) {
      const trimmedLine = line.trimEnd();
      const endsWithContinuation = trimmedLine.endsWith('&');
      
      if (!endsWithContinuation) {
        // En PowerBuilder, si no hay '&', el string se cierra (con error de compilación)
        // Para el análisis, asumimos que el usuario olvidó la comilla y no arrastramos el estado
        // a menos que sea un bloque de comentario (que sí es multi-línea por naturaleza).
        inString = false;
        stringChar = '';
      } else {
        // Es una continuación. El '&' en sí mismo NO es parte del contenido del string
        // en términos de valor, pero en la máscara lo marcamos como String por ahora.
        // Opcionalmente podríamos marcarlo como None si queremos que el 'code' esté limpio.
        // Lo dejamos como String para que el highlight y el análisis lo ignoren.
      }
    }

    resultLines.push(strippedLine);
    resultMasks.push(mask);
  }

  return { lines: resultLines, masks: resultMasks };
}

export function maskNonCodeCharacters(line: string, mask?: Uint8Array): string {
  if (!mask || mask.length === 0) {
    return line;
  }

  const chars = new Array<string>(line.length);
  for (let i = 0; i < line.length; i++) {
    const charType = mask[i] ?? CharType.None;
    chars[i] = charType === CharType.Comment || charType === CharType.String
      ? ' '
      : line[i];
  }
  return chars.join('');
}

export function buildCodeOnlyLines(lines: readonly string[], masks: readonly Uint8Array[]): string[] {
  return lines.map((line, index) => maskNonCodeCharacters(line, masks[index]));
}

/**
 * Calcula la longitud de una secuencia de escape de PowerBuilder (~).
 */
function getEscapeLength(line: string, index: number): number {
  if (line[index] !== '~') return 0;
  const next = line[index + 1]?.toLowerCase();
  if (!next) return 1;

  // Escapes comunes: ~n, ~t, ~v, ~r, ~f, ~b, ~", ~', ~~
  if ('ntvrfb"\'~'.includes(next)) return 2;

  // Hexadecimal: ~hXX
  if (next === 'h' && /^[0-9a-f]{2}$/i.test(line.substring(index + 2, index + 4))) {
    return 4;
  }

  // Octal: ~oXXX
  if (next === 'o' && /^[0-7]{3}$/.test(line.substring(index + 2, index + 5))) {
    return 5;
  }

  // Decimal: ~XXX
  if (/^\d{3}$/.test(line.substring(index + 1, index + 4))) {
    return 4;
  }

  return 2; // Por defecto asumimos que escapa el siguiente carácter
}
