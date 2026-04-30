/**
 * SR* container parser (Spec 034 / B113).
 *
 * Reconoce la estructura contenedora típica de `.sra/.srw/.sru/.srm/.srf`.
 *
 * @module parsing/srContainerParser
 */

import type { SectionRange } from '../model/types';
import { scanSections } from './sectionMachine';

export interface SrContainer {
  forwardLine?: number;
  globalType?: { name: string; baseType: string; line: number };
  typeVariablesRange?: SectionRange;
  forwardPrototypesRange?: SectionRange;
  onCreateLine?: number;
  onDestroyLine?: number;
}

const RE_FORWARD = /^\s*forward\b(?!\s+prototypes)/i;
const RE_GLOBAL_TYPE = /^\s*global\s+type\s+([A-Za-z_][\w$#%-]*)\s+from\s+([A-Za-z_][\w$#%-]*)/i;
const RE_ON_CREATE = /^\s*on\s+\S+\.create\b/i;
const RE_ON_DESTROY = /^\s*on\s+\S+\.destroy\b/i;

export function parseSrContainer(content: string): SrContainer {
  const lines = content.split(/\r?\n/);
  const sections = scanSections(lines);
  const out: SrContainer = {};

  out.typeVariablesRange = sections.find((s) => s.kind === 'variables');
  out.forwardPrototypesRange = sections.find((s) => s.kind === 'prototypes');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (out.forwardLine === undefined && RE_FORWARD.test(line)) {
      out.forwardLine = i;
    }
    if (!out.globalType) {
      const m = RE_GLOBAL_TYPE.exec(line);
      if (m) {
        out.globalType = { name: m[1], baseType: m[2], line: i };
      }
    }
    if (out.onCreateLine === undefined && RE_ON_CREATE.test(line)) {
      out.onCreateLine = i;
    }
    if (out.onDestroyLine === undefined && RE_ON_DESTROY.test(line)) {
      out.onDestroyLine = i;
    }
  }
  return out;
}
