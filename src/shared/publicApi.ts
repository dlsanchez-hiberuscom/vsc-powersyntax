/**
 * Public API surface (Spec 054 / B109).
 *
 * @module shared/publicApi
 */

export const PUBLIC_API_VERSION = '0.1.0';

export interface ApiSymbolLineage {
  sourceKind?: 'document' | 'project' | 'workspace' | 'system';
  authority?: 'derived' | 'curated' | 'official' | 'project' | 'workspace' | 'custom';
  phase?: 'declaration' | 'prototype' | 'implementation';
  role?: 'prototype' | 'implementation' | 'override' | 'inherited';
  inheritedFrom?: string;
  confidence?: 'direct' | 'inherited' | 'fallback';
}

export interface ApiSymbol {
  name: string;
  kind: string;
  uri: string;
  line: number;
  character: number;
  lineage?: ApiSymbolLineage;
}

export interface ApiSymbolInput {
  name: string;
  kind: string;
  uri: string;
  line: number;
  character: number;
  lineage?: ApiSymbolLineage;
}

function cloneApiSymbolLineage(lineage?: ApiSymbolLineage): ApiSymbolLineage | undefined {
  if (!lineage) {
    return undefined;
  }

  const normalized: ApiSymbolLineage = {
    ...(lineage.sourceKind ? { sourceKind: lineage.sourceKind } : {}),
    ...(lineage.authority ? { authority: lineage.authority } : {}),
    ...(lineage.phase ? { phase: lineage.phase } : {}),
    ...(lineage.role ? { role: lineage.role } : {}),
    ...(lineage.inheritedFrom ? { inheritedFrom: lineage.inheritedFrom } : {}),
    ...(lineage.confidence ? { confidence: lineage.confidence } : {}),
  };

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function toApiSymbol(symbol: ApiSymbolInput): ApiSymbol {
  return {
    name: symbol.name,
    kind: symbol.kind,
    uri: symbol.uri,
    line: symbol.line,
    character: symbol.character,
    ...(cloneApiSymbolLineage(symbol.lineage) ? { lineage: cloneApiSymbolLineage(symbol.lineage) } : {}),
  };
}

export interface ApiQuerySymbolsRequest {
  query: string;
  limit?: number;
}

export interface ApiCatalogReport {
  total: number;
  duplicates: number;
  missingSignatures: number;
}

/**
 * Spec 128: estadísticas globales del servidor expuestas como contrato
 * estable. Los campos son opcionales para permitir extensiones sin romper
 * compatibilidad de minor.
 */
export interface ApiServerStats {
  kb?: {
    totalEntities?: number;
    totalScopes?: number;
    indexedScopes?: number;
    version?: number;
  };
  scheduler?: {
    pendingNear?: number;
    pendingBackground?: number;
    interactiveBusy?: boolean;
  };
  workspace?: {
    mode?: string;
    files?: number;
  };
  readiness?: {
    state?: string;
    detail?: string;
  };
  indexer?: {
    phase?: string;
    total?: number;
    current?: number;
    degraded?: boolean;
  };
  projectModel?: {
    projects?: number;
    libraries?: number;
    orphanFiles?: number;
  };
  diagnostics?: ApiDiagnosticsSnapshot;
  caches?: {
    analysis?: { size?: number; capacity?: number };
    serving?: { size?: number; capacity?: number };
    documents?: { size?: number };
    hotContext?: { inheritedTypes?: number; capacity?: number };
  };
  lastQueryTrace?: {
    label?: string;
    steps?: Array<{ name?: string }>;
  };
  persistence?: {
    storageUri?: string;
    checkpointUri?: string;
    journalUri?: string;
    workspaceKey?: string;
  };
}

/**
 * Spec 129: información mínima de un proyecto detectado.
 */
export interface ApiProjectInfo {
  id: string;
  name?: string;
  pbtUri?: string;
  pbwUri?: string;
  fileCount: number;
}

/**
 * Spec 130: árbol agregado de diagnósticos por archivo.
 */
export interface ApiDiagnosticsTreeNode {
  uri: string;
  total: number;
  byCode: Record<string, number>;
  bySeverity: Record<string, number>;
  projectKey?: string;
  projectLabel?: string;
  objectKey?: string;
  objectLabel?: string;
  documentVersion?: number;
  snapshotVersion?: number;
  snapshotIdentity?: string;
}

export interface ApiDiagnosticsObjectNode {
  key: string;
  label: string;
  total: number;
  byCode: Record<string, number>;
  bySeverity: Record<string, number>;
  documents: ApiDiagnosticsTreeNode[];
}

export interface ApiDiagnosticsProjectNode {
  key: string;
  label: string;
  total: number;
  byCode: Record<string, number>;
  bySeverity: Record<string, number>;
  objects: ApiDiagnosticsObjectNode[];
}

export interface ApiDiagnosticsSnapshot {
  totals: { error: number; warning: number; info: number; hint: number };
  byFile: Record<string, number>;
  byCode: Record<string, number>;
  bySeverity: Record<string, number>;
  documents: ApiDiagnosticsTreeNode[];
  projects: ApiDiagnosticsProjectNode[];
}

export interface VscPowerSyntaxApi {
  version: string;
  isVersionCompatible(requested: string): boolean;
  getServerStats(): Promise<ApiServerStats>;
  querySymbols(request: ApiQuerySymbolsRequest): Promise<ApiSymbol[]>;
}

/**
 * Compatibilidad mayor.
 *
 * Mismo MAJOR ⇒ compatible. MAJOR distinto ⇒ no compatible.
 */
export function isApiVersionCompatible(requested: string): boolean {
  const parts = requested.split('.');
  if (parts.length < 1) return false;
  const reqMajor = Number.parseInt(parts[0] ?? '', 10);
  const ourMajor = Number.parseInt(PUBLIC_API_VERSION.split('.')[0] ?? '', 10);
  if (Number.isNaN(reqMajor) || Number.isNaN(ourMajor)) return false;
  return reqMajor === ourMajor;
}

