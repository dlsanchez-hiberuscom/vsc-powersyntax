/**
 * Section state machine (Spec 033 / B055).
 *
 * Reconoce secciones declarativas (`forward`, `prototypes`, `variables`).
 *
 * @module parsing/sectionMachine
 */

import type { SectionRange, SectionKind } from '../model/types';

type State = 'TopLevel' | 'InForward' | 'InPrototypes' | 'InVariables';

const RE = {
  forwardPrototypes: /^\s*forward\s+prototypes\b/i,
  typePrototypes: /^\s*type\s+prototypes\b/i,
  forward: /^\s*forward\b(?!\s+prototypes)/i,
  endForward: /^\s*end\s+forward\b/i,
  endPrototypes: /^\s*end\s+prototypes\b/i,
  // `type variables` o `<owner> type variables`.
  variables: /^\s*(?:[a-z_][\w-]*\s+)?type\s+variables\b/i,
  endVariables: /^\s*end\s+variables\b/i
};

export function scanSections(lines: string[]): SectionRange[] {
  const out: SectionRange[] = [];
  let state: State = 'TopLevel';
  let kind: SectionKind = 'forward';
  let start = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (state === 'TopLevel') {
      if (RE.forwardPrototypes.test(line) || RE.typePrototypes.test(line)) {
        state = 'InPrototypes';
        kind = 'prototypes';
        start = i;
      } else if (RE.forward.test(line)) {
        state = 'InForward';
        kind = 'forward';
        start = i;
      } else if (RE.variables.test(line)) {
        state = 'InVariables';
        kind = 'variables';
        start = i;
      }
      continue;
    }
    if (state === 'InForward' && RE.endForward.test(line)) {
      out.push({ kind, startLine: start, endLine: i });
      state = 'TopLevel';
      continue;
    }
    if (state === 'InPrototypes' && RE.endPrototypes.test(line)) {
      out.push({ kind, startLine: start, endLine: i });
      state = 'TopLevel';
      continue;
    }
    if (state === 'InVariables' && RE.endVariables.test(line)) {
      out.push({ kind, startLine: start, endLine: i });
      state = 'TopLevel';
      continue;
    }
  }
  // Cerrar sección abierta sin marker explícito.
  if (state !== 'TopLevel' && start >= 0) {
    out.push({ kind, startLine: start, endLine: lines.length - 1 });
  }
  return out;
}
