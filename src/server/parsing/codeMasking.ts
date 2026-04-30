/**
 * Code masking (Spec 028 / B092).
 *
 * Pipeline canónico para neutralizar strings y comentarios preservando
 * posiciones. Cualquier consumidor (diagnostics, references, completion)
 * debe usar este módulo en vez de regex ad hoc.
 *
 * @module parsing/codeMasking
 */

/**
 * Enmascara una sola línea: comentarios `//` y contenidos de `'...'`/`"..."`
 * se sustituyen por espacios. Mantiene la longitud original.
 */
export function maskLine(line: string): string {
  const out: string[] = [];
  let i = 0;
  let inStr: '"' | "'" | null = null;
  while (i < line.length) {
    const c = line[i];
    if (inStr) {
      if (c === inStr) {
        out.push(c);
        inStr = null;
      } else {
        out.push(' ');
      }
      i++;
      continue;
    }
    if (c === '/' && line[i + 1] === '/') {
      while (i < line.length) { out.push(' '); i++; }
      break;
    }
    if (c === '"' || c === "'") {
      out.push(c);
      inStr = c;
      i++;
      continue;
    }
    out.push(c);
    i++;
  }
  return out.join('');
}

export interface MaskOptions {
  /** Si true, soporta comentarios bloque anidados con contador (Spec 040 / B089). */
  nested?: boolean;
}

/**
 * Enmascara un documento completo, soportando además comentarios bloque `/* ... *​/`
 * que pueden cruzar varias líneas. Preserva posiciones y saltos de línea.
 */
export function maskDocument(content: string, options: MaskOptions = {}): string {
  const nested = options.nested === true;
  const out: string[] = [];
  let i = 0;
  let inStr: '"' | "'" | null = null;
  let blockDepth = 0;
  while (i < content.length) {
    const c = content[i];
    const next = content[i + 1];
    // Conservar siempre los EOL.
    if (c === '\n' || c === '\r') {
      out.push(c);
      i++;
      // Cualquier cadena no cerrada finaliza al cambiar de línea.
      inStr = null;
      continue;
    }
    if (blockDepth > 0) {
      if (nested && c === '/' && next === '*') {
        out.push(' ', ' ');
        i += 2;
        blockDepth++;
        continue;
      }
      if (c === '*' && next === '/') {
        out.push(' ', ' ');
        i += 2;
        blockDepth--;
        continue;
      }
      out.push(' ');
      i++;
      continue;
    }
    if (inStr) {
      if (c === inStr) {
        out.push(c);
        inStr = null;
      } else {
        out.push(' ');
      }
      i++;
      continue;
    }
    if (c === '/' && next === '/') {
      // Comentario de línea: hasta EOL.
      while (i < content.length && content[i] !== '\n' && content[i] !== '\r') {
        out.push(' ');
        i++;
      }
      continue;
    }
    if (c === '/' && next === '*') {
      out.push(' ', ' ');
      i += 2;
      blockDepth++;
      continue;
    }
    if (c === '"' || c === "'") {
      out.push(c);
      inStr = c;
      i++;
      continue;
    }
    out.push(c);
    i++;
  }
  return out.join('');
}
