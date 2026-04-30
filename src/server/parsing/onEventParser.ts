/**
 * On-event parser (Spec 038 / B104).
 *
 * Reconoce bloques `on <object>.<event>` y devuelve owner + event.
 *
 * @module parsing/onEventParser
 */

import { maskDocument } from './codeMasking';

export interface OnEvent {
  owner: string;
  event: string;
  line: number;
}

const RE = /^\s*on\s+([A-Za-z_][\w$#%-]*)\.([A-Za-z_][\w$#%-]*)\b/i;

export function parseOnEvents(content: string): OnEvent[] {
  const masked = maskDocument(content).split(/\r?\n/);
  const out: OnEvent[] = [];
  for (let line = 0; line < masked.length; line++) {
    const m = RE.exec(masked[line]);
    if (m) out.push({ owner: m[1], event: m[2], line });
  }
  return out;
}
