/**
 * Project status helper (Spec 052 / B107).
 *
 * @module features/projectStatus
 */

import type { ReadinessState } from '../workspace/readiness';

export interface ProjectStatus {
  readiness: ReadinessState;
  projectName?: string;
  totalFiles: number;
  indexedFiles: number;
}

export function formatProjectStatus(s: ProjectStatus): string {
  const name = s.projectName ?? 'workspace';
  switch (s.readiness) {
    case 'ready':
      return `${name} — ${s.totalFiles} archivos`;
    case 'indexing':
      return `${name} — indexando ${s.indexedFiles}/${s.totalFiles}`;
    case 'discovering':
      return `${name} — descubriendo`;
    case 'error':
      return `${name} — error`;
    default:
      return `${name} — inactivo`;
  }
}
