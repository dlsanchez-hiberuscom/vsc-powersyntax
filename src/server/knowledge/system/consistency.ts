/**
 * Catalog consistency report (Spec 046 / B132).
 *
 * @module knowledge/system/consistency
 */

import { PB_SYSTEM_SYMBOL_REGISTRY } from './registry/registry';
import type { PbSystemSymbolDataset, PbSystemSymbolDomain, PbSystemSymbolKind } from './types';

export interface CatalogReport {
  total: number;
  duplicateIds: string[];
  missingSignatures: string[]; // ids
  emptyName: string[]; // ids
  domainCounts: Record<PbSystemSymbolDomain, number>;
  datasetCounts: Partial<Record<PbSystemSymbolDataset, number>>;
  kindCounts: Record<PbSystemSymbolKind, number>;
}

export function buildCatalogConsistencyReport(): CatalogReport {
  const entries = PB_SYSTEM_SYMBOL_REGISTRY.entries;
  const seen = new Map<string, number>();
  const missingSignatures: string[] = [];
  const emptyName: string[] = [];
  const domainCounts: Record<string, number> = {};
  const datasetCounts: Record<string, number> = {};
  const kindCounts: Record<string, number> = {};

  for (const e of entries) {
    seen.set(e.id, (seen.get(e.id) ?? 0) + 1);
    if (!e.signatures || e.signatures.length === 0) missingSignatures.push(e.id);
    if (!e.name || !e.name.trim()) emptyName.push(e.id);
    domainCounts[e.domain] = (domainCounts[e.domain] ?? 0) + 1;
    datasetCounts[e.dataset] = (datasetCounts[e.dataset] ?? 0) + 1;
    kindCounts[e.kind] = (kindCounts[e.kind] ?? 0) + 1;
  }

  const duplicateIds: string[] = [];
  for (const [id, n] of seen) if (n > 1) duplicateIds.push(id);

  return {
    total: entries.length,
    duplicateIds,
    missingSignatures,
    emptyName,
    domainCounts: domainCounts as Record<PbSystemSymbolDomain, number>,
    datasetCounts: datasetCounts as Partial<Record<PbSystemSymbolDataset, number>>,
    kindCounts: kindCounts as Record<PbSystemSymbolKind, number>,
  };
}
