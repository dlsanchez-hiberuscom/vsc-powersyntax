import type { ApiRuntimeMemoryLayerBudget, ApiRuntimeMemoryReport } from '../../shared/publicApi';

export interface RuntimeMemoryBudgetInput {
  analysis?: { size?: number; capacity?: number };
  serving?: { size?: number; capacity?: number };
  documents?: { size?: number; internedStrings?: number };
  hotContext?: { inheritedTypes?: number; capacity?: number };
  codeLens?: { size?: number; capacity?: number };
  kb?: {
    totalEntities?: number;
    indexedScopes?: number;
    internedStrings?: number;
    snapshotDocuments?: number;
  };
}

const KIB = 1024;
const MIB = 1024 * KIB;
const WARNING_RATIO = 0.85;

const LAYER_BUDGETS = {
  analysis: { label: 'analysis cache', budgetBytes: 24 * MIB, unitBytes: 96 * KIB },
  serving: { label: 'serving cache', budgetBytes: 8 * MIB, unitBytes: 12 * KIB },
  documents: { label: 'document cache', budgetBytes: 48 * MIB, entryBytes: 64 * KIB, internedStringBytes: 48 },
  hotContext: { label: 'hot context', budgetBytes: 1 * MIB, unitBytes: 4 * KIB },
  codeLens: { label: 'code lens cache', budgetBytes: 2 * MIB, unitBytes: 6 * KIB },
  knowledge: { label: 'knowledge index', budgetBytes: 96 * MIB, entityBytes: 256, scopeBytes: 128, internedStringBytes: 48, snapshotBytes: 24 * KIB },
} as const;

export function buildRuntimeMemoryReport(input: RuntimeMemoryBudgetInput): ApiRuntimeMemoryReport {
  const layers: ApiRuntimeMemoryLayerBudget[] = [];

  pushLayer(layers, 'analysis', LAYER_BUDGETS.analysis.label, estimateByUnits(input.analysis?.size, LAYER_BUDGETS.analysis.unitBytes), LAYER_BUDGETS.analysis.budgetBytes, input.analysis?.size, 'entries');
  pushLayer(layers, 'serving', LAYER_BUDGETS.serving.label, estimateByUnits(input.serving?.size, LAYER_BUDGETS.serving.unitBytes), LAYER_BUDGETS.serving.budgetBytes, input.serving?.size, 'entries');
  pushLayer(
    layers,
    'documents',
    LAYER_BUDGETS.documents.label,
    estimateDocumentCache(input.documents?.size, input.documents?.internedStrings),
    LAYER_BUDGETS.documents.budgetBytes,
    input.documents?.size,
    'documents',
  );
  pushLayer(layers, 'hot-context', LAYER_BUDGETS.hotContext.label, estimateByUnits(input.hotContext?.inheritedTypes, LAYER_BUDGETS.hotContext.unitBytes), LAYER_BUDGETS.hotContext.budgetBytes, input.hotContext?.inheritedTypes, 'types');
  pushLayer(layers, 'code-lens', LAYER_BUDGETS.codeLens.label, estimateByUnits(input.codeLens?.size, LAYER_BUDGETS.codeLens.unitBytes), LAYER_BUDGETS.codeLens.budgetBytes, input.codeLens?.size, 'entries');
  pushLayer(
    layers,
    'knowledge',
    LAYER_BUDGETS.knowledge.label,
    estimateKnowledgeIndex(input.kb),
    LAYER_BUDGETS.knowledge.budgetBytes,
    input.kb?.totalEntities,
    'entities',
  );

  const processUsage = typeof process.memoryUsage === 'function' ? process.memoryUsage() : undefined;
  const totalEstimatedBytes = layers.reduce((total, layer) => total + layer.estimatedBytes, 0);
  const totalBudgetBytes = layers.reduce((total, layer) => total + layer.budgetBytes, 0);
  const totalRatio = totalBudgetBytes > 0 ? totalEstimatedBytes / totalBudgetBytes : 0;
  let status: ApiRuntimeMemoryReport['status'] = 'healthy';
  if (layers.some((layer) => layer.status === 'error') || totalRatio >= 1) {
    status = 'error';
  } else if (layers.some((layer) => layer.status === 'warning') || totalRatio >= WARNING_RATIO) {
    status = 'warning';
  }

  return {
    status,
    totalEstimatedBytes,
    totalBudgetBytes,
    layers,
    ...(processUsage ? {
      process: {
        rssBytes: processUsage.rss,
        heapUsedBytes: processUsage.heapUsed,
        heapTotalBytes: processUsage.heapTotal,
        externalBytes: processUsage.external,
      }
    } : {}),
  };
}

function estimateByUnits(units: number | undefined, unitBytes: number): number {
  return (units ?? 0) * unitBytes;
}

function estimateDocumentCache(entries: number | undefined, internedStrings: number | undefined): number {
  return (entries ?? 0) * LAYER_BUDGETS.documents.entryBytes
    + (internedStrings ?? 0) * LAYER_BUDGETS.documents.internedStringBytes;
}

function estimateKnowledgeIndex(input: RuntimeMemoryBudgetInput['kb']): number {
  return (input?.totalEntities ?? 0) * LAYER_BUDGETS.knowledge.entityBytes
    + (input?.indexedScopes ?? 0) * LAYER_BUDGETS.knowledge.scopeBytes
    + (input?.internedStrings ?? 0) * LAYER_BUDGETS.knowledge.internedStringBytes
    + (input?.snapshotDocuments ?? 0) * LAYER_BUDGETS.knowledge.snapshotBytes;
}

function pushLayer(
  layers: ApiRuntimeMemoryLayerBudget[],
  layer: ApiRuntimeMemoryLayerBudget['layer'],
  label: string,
  estimatedBytes: number,
  budgetBytes: number,
  unitCount: number | undefined,
  unitLabel: string,
): void {
  const usageRatio = budgetBytes > 0 ? estimatedBytes / budgetBytes : 0;
  layers.push({
    layer,
    label,
    estimatedBytes,
    budgetBytes,
    usageRatio,
    status: usageRatio >= 1 ? 'error' : usageRatio >= WARNING_RATIO ? 'warning' : 'healthy',
    ...(typeof unitCount === 'number' ? { unitCount, unitLabel } : {}),
  });
}