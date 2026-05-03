import type {
  ApiPublicContractDescriptor,
  ApiReadOnlyToolBridgeDescriptor,
  ApiSemanticWorkspaceSnapshotDiff,
  ApiSemanticWorkspaceSnapshotDiffCount,
  ApiSemanticWorkspaceSnapshotDiffItem,
  ApiSemanticWorkspaceSnapshotDiffRequest,
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

interface IndexedSnapshotEntry {
  key: string;
  label: string;
  detail?: string;
  signature: string;
}

function basenameFromPathOrUri(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.replace(/\\/g, '/');
  const index = normalized.lastIndexOf('/');
  return index >= 0 ? normalized.substring(index + 1) : normalized;
}

function serializeStable(value: unknown): string {
  return JSON.stringify(value);
}

function normalizeLimit(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.trunc(value));
}

function buildProjectEntry(project: ApiSemanticWorkspaceManifest['projects'][number]): IndexedSnapshotEntry {
  return {
    key: project.projectUri,
    label: project.name,
    detail: [project.kind, `${project.fileCount} archivos`, `${project.libraries.length} librerías`]
      .filter((part): part is string => Boolean(part))
      .join(' · '),
    signature: serializeStable({
      kind: project.kind,
      name: project.name,
      libraries: [...project.libraries].sort(),
      fileCount: project.fileCount,
    }),
  };
}

function buildObjectEntry(object: ApiSemanticWorkspaceManifest['objects'][number]): IndexedSnapshotEntry {
  return {
    key: object.uri,
    label: object.name,
    detail: [object.objectKind, object.baseType, object.library, object.sourceOrigin, object.readiness]
      .filter((part): part is string => Boolean(part))
      .join(' · '),
    signature: serializeStable({
      name: object.name,
      baseType: object.baseType ?? null,
      projectUri: object.projectUri ?? null,
      library: object.library ?? null,
      objectKind: object.objectKind ?? null,
      readiness: object.readiness ?? null,
      sourceOrigin: object.sourceOrigin ?? null,
    }),
  };
}

function buildSymbolEntry(symbol: ApiSemanticWorkspaceManifest['exportedSymbols'][number]): IndexedSnapshotEntry {
  return {
    key: `${symbol.uri}::${symbol.kind}::${symbol.name}`,
    label: `${symbol.kind} ${symbol.name}`,
    detail: [basenameFromPathOrUri(symbol.uri), `L${symbol.line + 1}:${symbol.character + 1}`]
      .filter((part): part is string => Boolean(part))
      .join(' · '),
    signature: serializeStable({
      uri: symbol.uri,
      kind: symbol.kind,
      name: symbol.name,
      line: symbol.line,
      character: symbol.character,
      lineage: symbol.lineage ?? null,
    }),
  };
}

function buildEntryIndex(entries: IndexedSnapshotEntry[]): Map<string, IndexedSnapshotEntry> {
  const index = new Map<string, IndexedSnapshotEntry>();
  for (const entry of entries) {
    index.set(entry.key, entry);
  }
  return index;
}

function diffIndexedEntries(
  previous: IndexedSnapshotEntry[],
  next: IndexedSnapshotEntry[],
  maxChanges: number,
): { summary: ApiSemanticWorkspaceSnapshotDiffCount; items: ApiSemanticWorkspaceSnapshotDiffItem[] } {
  const previousIndex = buildEntryIndex(previous);
  const nextIndex = buildEntryIndex(next);
  const items: ApiSemanticWorkspaceSnapshotDiffItem[] = [];
  let added = 0;
  let removed = 0;
  let updated = 0;

  const pushItem = (item: ApiSemanticWorkspaceSnapshotDiffItem): void => {
    if (items.length < maxChanges) {
      items.push(item);
    }
  };

  for (const [key, entry] of nextIndex.entries()) {
    const previousEntry = previousIndex.get(key);
    if (!previousEntry) {
      added++;
      pushItem({ key, label: entry.label, change: 'added', detail: entry.detail });
      continue;
    }
    if (previousEntry.signature !== entry.signature) {
      updated++;
      pushItem({ key, label: entry.label, change: 'updated', detail: entry.detail });
    }
  }

  for (const [key, entry] of previousIndex.entries()) {
    if (nextIndex.has(key)) {
      continue;
    }
    removed++;
    pushItem({ key, label: entry.label, change: 'removed', detail: entry.detail });
  }

  items.sort((left, right) => left.label.localeCompare(right.label) || left.change.localeCompare(right.change) || left.key.localeCompare(right.key));

  return {
    summary: {
      added,
      removed,
      updated,
      ...(items.length < added + removed + updated ? { truncated: true } : {}),
    },
    items,
  };
}

function getDiagnosticsTotals(snapshot: ApiSemanticWorkspaceSnapshot): { error: number; warning: number; info: number; hint: number } {
  const totals = snapshot.workspaceManifest.diagnosticsSummary?.totals;
  return {
    error: totals?.error ?? 0,
    warning: totals?.warning ?? 0,
    info: totals?.info ?? 0,
    hint: totals?.hint ?? 0,
  };
}

function getReadinessState(snapshot: ApiSemanticWorkspaceSnapshot): string | undefined {
  return snapshot.workspaceManifest.readiness.state ?? snapshot.summary.readinessState;
}

function getHealthState(snapshot: ApiSemanticWorkspaceSnapshot): string | undefined {
  return snapshot.serverStats?.health?.status ?? snapshot.summary.healthStatus;
}

function getSnapshotLabel(snapshot: ApiSemanticWorkspaceSnapshot, explicitLabel: string | undefined, fallback: string): string {
  const trimmed = explicitLabel?.trim();
  if (trimmed) {
    return trimmed;
  }

  const firstProject = snapshot.workspaceManifest.projects[0];
  return firstProject?.name ?? snapshot.generatedAt ?? fallback;
}

export function diffSemanticWorkspaceSnapshots(
  request: ApiSemanticWorkspaceSnapshotDiffRequest,
): ApiSemanticWorkspaceSnapshotDiff {
  const projectChanges = diffIndexedEntries(
    request.previous.workspaceManifest.projects.map(buildProjectEntry),
    request.next.workspaceManifest.projects.map(buildProjectEntry),
    normalizeLimit(request.maxProjectChanges, 32),
  );
  const objectChanges = diffIndexedEntries(
    request.previous.workspaceManifest.objects.map(buildObjectEntry),
    request.next.workspaceManifest.objects.map(buildObjectEntry),
    normalizeLimit(request.maxObjectChanges, 64),
  );
  const symbolChanges = diffIndexedEntries(
    request.previous.workspaceManifest.exportedSymbols.map(buildSymbolEntry),
    request.next.workspaceManifest.exportedSymbols.map(buildSymbolEntry),
    normalizeLimit(request.maxSymbolChanges, 64),
  );

  const previousDiagnostics = getDiagnosticsTotals(request.previous);
  const nextDiagnostics = getDiagnosticsTotals(request.next);
  const diagnostics = {
    changed:
      previousDiagnostics.error !== nextDiagnostics.error
      || previousDiagnostics.warning !== nextDiagnostics.warning
      || previousDiagnostics.info !== nextDiagnostics.info
      || previousDiagnostics.hint !== nextDiagnostics.hint,
    previous: previousDiagnostics,
    next: nextDiagnostics,
    delta: {
      error: nextDiagnostics.error - previousDiagnostics.error,
      warning: nextDiagnostics.warning - previousDiagnostics.warning,
      info: nextDiagnostics.info - previousDiagnostics.info,
      hint: nextDiagnostics.hint - previousDiagnostics.hint,
    },
  };

  const previousReadiness = getReadinessState(request.previous);
  const nextReadiness = getReadinessState(request.next);
  const readiness = {
    changed: previousReadiness !== nextReadiness,
    ...(previousReadiness ? { previous: previousReadiness } : {}),
    ...(nextReadiness ? { next: nextReadiness } : {}),
  };
  const previousHealth = getHealthState(request.previous);
  const nextHealth = getHealthState(request.next);
  const health = {
    changed: previousHealth !== nextHealth,
    ...(previousHealth ? { previous: previousHealth } : {}),
    ...(nextHealth ? { next: nextHealth } : {}),
  };

  const sourceOriginKeys = new Set([
    ...Object.keys(request.previous.workspaceManifest.sourceOriginSummary ?? {}),
    ...Object.keys(request.next.workspaceManifest.sourceOriginSummary ?? {}),
  ]);
  const sourceOriginChanges = [...sourceOriginKeys]
    .map((sourceOrigin) => {
      const previous = request.previous.workspaceManifest.sourceOriginSummary[sourceOrigin as keyof typeof request.previous.workspaceManifest.sourceOriginSummary] ?? 0;
      const next = request.next.workspaceManifest.sourceOriginSummary[sourceOrigin as keyof typeof request.next.workspaceManifest.sourceOriginSummary] ?? 0;
      return {
        sourceOrigin: sourceOrigin as ApiSemanticWorkspaceSnapshotDiff['sourceOriginChanges'][number]['sourceOrigin'],
        previous,
        next,
        delta: next - previous,
      };
    })
    .filter((entry) => entry.delta !== 0)
    .sort((left, right) => left.sourceOrigin.localeCompare(right.sourceOrigin));

  const changed =
    projectChanges.summary.added > 0
    || projectChanges.summary.removed > 0
    || projectChanges.summary.updated > 0
    || objectChanges.summary.added > 0
    || objectChanges.summary.removed > 0
    || objectChanges.summary.updated > 0
    || symbolChanges.summary.added > 0
    || symbolChanges.summary.removed > 0
    || symbolChanges.summary.updated > 0
    || diagnostics.changed
    || readiness.changed
    || health.changed
    || sourceOriginChanges.length > 0;

  return {
    changed,
    comparedAt: new Date().toISOString(),
    previousLabel: getSnapshotLabel(request.previous, request.previousLabel, 'previous'),
    nextLabel: getSnapshotLabel(request.next, request.nextLabel, 'next'),
    summary: {
      projects: projectChanges.summary,
      objects: objectChanges.summary,
      exportedSymbols: symbolChanges.summary,
      sourceOriginsChanged: sourceOriginChanges.length,
      diagnosticsChanged: diagnostics.changed,
      readinessChanged: readiness.changed,
      healthChanged: health.changed,
    },
    projectChanges: projectChanges.items,
    objectChanges: objectChanges.items,
    symbolChanges: symbolChanges.items,
    sourceOriginChanges,
    diagnostics,
    readiness,
    health,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}