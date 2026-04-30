/**
 * Catálogo de funciones obsoletas (Spec 036 / B074).
 *
 * Set inicial conservador. Crece con curación posterior.
 *
 * @module knowledge/obsoleteCatalog
 */

export interface ObsoleteEntry {
  name: string;
  replacement?: string;
  reason?: string;
}

export const OBSOLETE_FUNCTIONS: ObsoleteEntry[] = [
  { name: 'Yield', replacement: 'await/async patterns or DoEvents', reason: 'Bloqueo cooperativo legacy' },
  { name: 'Halt', replacement: 'Return / Exit / proper error handling', reason: 'Termina el proceso PB de forma abrupta' },
  { name: 'RunFork', replacement: 'Run', reason: 'Variante legacy' }
];

export function buildObsoleteIndex(entries: ObsoleteEntry[] = OBSOLETE_FUNCTIONS): Map<string, ObsoleteEntry> {
  const m = new Map<string, ObsoleteEntry>();
  for (const e of entries) m.set(e.name.toLowerCase(), e);
  return m;
}
