import type {
  ApiPublicContractDescriptor,
  ApiReadOnlyToolBridgeDescriptor,
  ApiSemanticWorkspaceManifest,
  ApiSemanticWorkspaceSnapshot,
  ApiSemanticWorkspaceSnapshotImportResult,
  ApiSemanticWorkspaceSnapshotSummary,
  ApiServerStats,
} from '../shared/publicApi';

export interface BuildSemanticWorkspaceSnapshotInput {
  apiVersion: string;
  contract: ApiPublicContractDescriptor;
  readOnlyToolBridge: ApiReadOnlyToolBridgeDescriptor;
  workspaceManifest: ApiSemanticWorkspaceManifest;
  serverStats?: ApiServerStats;
  generatedAt?: string;
}

export function summarizeSemanticWorkspaceSnapshot(
  workspaceManifest: ApiSemanticWorkspaceManifest,
  serverStats?: ApiServerStats,
): ApiSemanticWorkspaceSnapshotSummary {
  return {
    projectCount: workspaceManifest.projects.length,
    objectCount: workspaceManifest.objects.length,
    exportedSymbolCount: workspaceManifest.exportedSymbols.length,
    ...(workspaceManifest.readiness.state ? { readinessState: workspaceManifest.readiness.state } : {}),
    ...(serverStats?.health?.status ? { healthStatus: serverStats.health.status } : {}),
  };
}

export function buildSemanticWorkspaceSnapshot(input: BuildSemanticWorkspaceSnapshotInput): ApiSemanticWorkspaceSnapshot {
  return {
    schemaVersion: '1.0.0',
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    apiVersion: input.apiVersion,
    contract: JSON.parse(JSON.stringify(input.contract)) as ApiPublicContractDescriptor,
    readOnlyToolBridge: JSON.parse(JSON.stringify(input.readOnlyToolBridge)) as ApiReadOnlyToolBridgeDescriptor,
    workspaceManifest: JSON.parse(JSON.stringify(input.workspaceManifest)) as ApiSemanticWorkspaceManifest,
    ...(input.serverStats ? { serverStats: JSON.parse(JSON.stringify(input.serverStats)) as ApiServerStats } : {}),
    summary: summarizeSemanticWorkspaceSnapshot(input.workspaceManifest, input.serverStats),
  };
}

export function importSemanticWorkspaceSnapshot(raw: unknown, sourceUri?: string): ApiSemanticWorkspaceSnapshotImportResult {
  if (!isRecord(raw)) {
    return {
      valid: false,
      reason: 'El snapshot semántico debe ser un objeto JSON.',
      ...(sourceUri ? { sourceUri } : {}),
    };
  }

  if (raw.schemaVersion !== '1.0.0') {
    return {
      valid: false,
      reason: `schemaVersion no soportado: ${String(raw.schemaVersion ?? 'unknown')}`,
      ...(sourceUri ? { sourceUri } : {}),
    };
  }

  if (typeof raw.generatedAt !== 'string' || typeof raw.apiVersion !== 'string') {
    return {
      valid: false,
      reason: 'El snapshot semántico requiere generatedAt y apiVersion string.',
      ...(sourceUri ? { sourceUri } : {}),
    };
  }

  if (!isRecord(raw.contract) || !isRecord(raw.readOnlyToolBridge) || !isRecord(raw.workspaceManifest) || !isRecord(raw.summary)) {
    return {
      valid: false,
      reason: 'El snapshot semántico requiere contract, readOnlyToolBridge, workspaceManifest y summary serializables.',
      ...(sourceUri ? { sourceUri } : {}),
    };
  }

  const snapshot = JSON.parse(JSON.stringify(raw)) as ApiSemanticWorkspaceSnapshot;
  return {
    valid: true,
    ...(sourceUri ? { sourceUri } : {}),
    snapshot,
    summary: snapshot.summary,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}