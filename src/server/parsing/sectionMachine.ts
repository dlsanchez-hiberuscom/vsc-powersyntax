/**
 * Section state machine (Spec 033 / B055).
 *
 * Reconoce secciones declarativas (`forward`, `prototypes`, `variables`).
 *
 * @module parsing/sectionMachine
 */

import type { SectionRange, SectionKind } from '../model/types';
import {
  END_FORWARD_PATTERN,
  END_PROTOTYPES_PATTERN,
  END_VARIABLES_PATTERN,
  FORWARD_PROTOTYPES_START_PATTERN,
  FORWARD_START_PATTERN,
  PROTOTYPES_START_PATTERN,
  VARIABLES_START_PATTERN
} from './grammar';

type State = 'TopLevel' | 'InForward' | 'InPrototypes' | 'InVariables';

export function scanSections(lines: string[]): SectionRange[] {
  const out: SectionRange[] = [];
  let state: State = 'TopLevel';
  let kind: SectionKind = 'forward';
  let start = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (state === 'TopLevel') {
      if (FORWARD_PROTOTYPES_START_PATTERN.test(line) || PROTOTYPES_START_PATTERN.test(line)) {
        state = 'InPrototypes';
        kind = 'prototypes';
        start = i;
      } else if (FORWARD_START_PATTERN.test(line) && !FORWARD_PROTOTYPES_START_PATTERN.test(line)) {
        state = 'InForward';
        kind = 'forward';
        start = i;
      } else if (VARIABLES_START_PATTERN.test(line)) {
        state = 'InVariables';
        kind = 'variables';
        start = i;
      }
      continue;
    }
    if (state === 'InForward' && END_FORWARD_PATTERN.test(line)) {
      out.push({ kind, startLine: start, endLine: i });
      state = 'TopLevel';
      continue;
    }
    if (state === 'InPrototypes' && END_PROTOTYPES_PATTERN.test(line)) {
      out.push({ kind, startLine: start, endLine: i });
      state = 'TopLevel';
      continue;
    }
    if (state === 'InVariables' && END_VARIABLES_PATTERN.test(line)) {
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
