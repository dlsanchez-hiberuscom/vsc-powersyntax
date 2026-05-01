/**
 * Project status helper (Spec 052 / B107).
 *
 * @module features/projectStatus
 */

import type { ReadinessState } from '../workspace/readiness';
import type { ProgressPass } from '../../shared/types';

export interface ProjectStatus {
  readiness: ReadinessState;
  projectName?: string;
  totalFiles: number;
  indexedFiles: number;
  pass?: ProgressPass;
  skippedFiles?: number;
  failedFiles?: number;
}

export function formatProjectStatus(s: ProjectStatus): string {
  const name = s.projectName ?? 'workspace';
  switch (s.readiness) {
    case 'ready':
      return `${name} — ${s.totalFiles} archivos`;
    case 'indexing':
      return `${name} — ${s.pass === 'structural' ? 'estructural' : s.pass === 'enriched' ? 'semántico' : 'indexando'} ${s.indexedFiles}/${s.totalFiles}`;
    case 'discovering':
      return `${name} — descubriendo`;
    case 'degraded':
      return `${name} — degradado (${s.totalFiles - (s.skippedFiles ?? 0) - (s.failedFiles ?? 0)}/${s.totalFiles})`;
    case 'error':
      return `${name} — error`;
    default:
      return `${name} — inactivo`;
  }
}
