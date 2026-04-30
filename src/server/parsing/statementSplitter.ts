/**
 * Statement splitter (Spec 029 / B095).
 *
 * Segmenta un documento en statements lógicos respetando:
 *   - Continuaciones `&` al final de línea.
 *   - Separadores `;` fuera de strings/comentarios.
 *
 * @module parsing/statementSplitter
 */

import { maskDocument } from './codeMasking';

export interface LogicalStatement {
  /** Texto unido (sin `&` final ni saltos de línea). */
  text: string;
  startLine: number;
  endLine: number;
  rawLines: string[];
}

export function splitStatements(content: string): LogicalStatement[] {
  const masked = maskDocument(content).split(/\r?\n/);
  const raw = content.split(/\r?\n/);
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
    const maskedLine = masked[i] ?? '';
    const rawLine = raw[i];
    if (bufStart < 0) bufStart = i;
    bufRaw.push(rawLine);

    // ¿Esta línea (en su forma enmascarada) acaba con `&`?
    const trimmed = maskedLine.replace(/\s+$/, '');
    const continues = trimmed.endsWith('&');
    if (continues) {
      // Guardar la línea sin el `&` final usando el mismo recorte sobre `rawLine`.
      const cut = rawLine.replace(/&\s*$/, '');
      bufText.push(cut);
      continue;
    }

    // Detectar `;` en la línea enmascarada → potencial split adicional.
    if (maskedLine.includes(';')) {
      // Recorrer y separar.
      let segmentRaw = '';
      const finalText: string[] = [...bufText];
      let lastEnd = i;
      for (let c = 0; c < rawLine.length; c++) {
        if (maskedLine[c] === ';') {
          finalText.push(segmentRaw);
          if (finalText.join(' ').trim()) {
            result.push({
              text: finalText.join(' ').trim(),
              startLine: bufStart,
              endLine: lastEnd,
              rawLines: [...bufRaw]
            });
          }
          finalText.length = 0;
          segmentRaw = '';
          bufStart = i;
          bufRaw = [rawLine];
        } else {
          segmentRaw += rawLine[c];
        }
      }
      if (segmentRaw.trim()) {
        bufText = [segmentRaw];
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

    bufText.push(rawLine);
    flush(i);
  }
  flush(raw.length - 1);
  return result;
}
