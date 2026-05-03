/**
 * Statement splitter (Spec 029 / B095).
 *
 * Segmenta un documento en statements lógicos respetando:
 *   - Continuaciones `&` al final de línea.
 *   - Separadores `;` fuera de strings/comentarios.
 *   - Texto lógico limpio de comentarios para no contaminar diagnósticos
 *     ni analizadores derivados.
 *
 * @module parsing/statementSplitter
 */

import { CharType, stripCommentsSmart } from '../utils/comments';

export interface LogicalStatement {
  /** Texto unido (sin `&` final ni saltos de línea). */
  text: string;
  startLine: number;
  endLine: number;
  rawLines: string[];
}

export function splitStatements(content: string): LogicalStatement[] {
  const raw = content.split(/\r?\n/);
  const { lines: stripped, masks } = stripCommentsSmart(raw);
  const result: LogicalStatement[] = [];

  let bufText: string[] = [];
  let bufRaw: string[] = [];
  let bufStart = -1;

  function flush(endLine: number): void {
    if (bufText.length === 0) return;
    const joined = bufText.join(' ').trim();
    if (joined.length > 0) {
      // Dividir por `;` adicionales en la última línea unida.
      // Para simplicidad: si no hay `;` interno (ya filtramos por mask), un solo statement.
      result.push({
        text: joined,
        startLine: bufStart,
        endLine,
        rawLines: [...bufRaw]
      });
    }
    bufText = [];
    bufRaw = [];
    bufStart = -1;
  }

  for (let i = 0; i < raw.length; i++) {
    const strippedLine = stripped[i] ?? '';
    const mask = masks[i] ?? new Uint8Array(raw[i]?.length ?? 0);
    const rawLine = raw[i];
    if (bufStart < 0) bufStart = i;
    bufRaw.push(rawLine);

    // ¿Esta línea (sin comentarios) acaba con `&`?
    const trimmed = strippedLine.replace(/\s+$/, '');
    const continues = trimmed.endsWith('&');
    if (continues) {
      const cut = strippedLine.replace(/&\s*$/, '');
      bufText.push(cut);
      continue;
    }

    // Detectar `;` reales de código (no strings/comentarios) → split adicional.
    if (hasCodeSemicolon(strippedLine, mask)) {
      // Recorrer y separar.
      let segmentText = '';
      const finalText: string[] = [...bufText];
      let lastEnd = i;
      for (let c = 0; c < strippedLine.length; c++) {
        if (strippedLine[c] === ';' && mask[c] === CharType.Code) {
          finalText.push(segmentText);
          if (finalText.join(' ').trim()) {
            result.push({
              text: finalText.join(' ').trim(),
              startLine: bufStart,
              endLine: lastEnd,
              rawLines: [...bufRaw]
            });
          }
          finalText.length = 0;
          segmentText = '';
          bufStart = i;
          bufRaw = [rawLine];
        } else {
          segmentText += strippedLine[c];
        }
      }
      if (segmentText.trim()) {
        bufText = [segmentText];
        bufStart = i;
        bufRaw = [rawLine];
        flush(i);
      } else {
        bufText = [];
        bufRaw = [];
        bufStart = -1;
      }
      continue;
    }

    bufText.push(strippedLine);
    flush(i);
  }
  flush(raw.length - 1);
  return result;
}

function hasCodeSemicolon(line: string, mask: Uint8Array): boolean {
  for (let i = 0; i < line.length; i++) {
    if (line[i] === ';' && mask[i] === CharType.Code) {
      return true;
    }
  }

  return false;
}
