/**
 * Encoding helpers (Spec 042 / B130).
 *
 * Centraliza el manejo de BOM y decodificación UTF-8.
 *
 * @module system/encoding
 */

const BOM = '\uFEFF';

export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}

export function bytesToText(buf: Buffer | Uint8Array): string {
  const text = Buffer.from(buf).toString('utf8');
  return text.startsWith(BOM) ? text.slice(1) : text;
}
