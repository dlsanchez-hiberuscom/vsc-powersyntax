/**
 * Public API surface (Spec 054 / B109).
 *
 * @module shared/publicApi
 */

export const PUBLIC_API_VERSION = '0.1.0';

export interface ApiSymbolLineage {
  sourceKind?: 'document' | 'project' | 'workspace' | 'system';
  sourceOrigin?: import('./sourceOrigin').SourceOrigin;
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
    ...(lineage.sourceOrigin ? { sourceOrigin: lineage.sourceOrigin } : {}),
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

export interface ApiCurrentObjectContextRequest {
  uri?: string;
  line?: number;
  character?: number;
  maxExcerptLines?: number;
  maxReferencedSymbols?: number;
}

export interface ApiCurrentObjectInfo {
  uri: string;
  globalType?: string;
  baseType?: string;
  sectionKind?: string;
  library?: string;
  project?: string;
  objectKind?: string;
  sourceOrigin?: import('./sourceOrigin').SourceOrigin;
  readiness?: string;
}

export interface ApiCurrentObjectContextSymbol {
  name: string;
  kind: string;
  uri: string;
  line: number;
  character: number;
  signature?: string;
  declaredIn?: string | null;
  relation?: 'own' | 'inherited' | 'override';
  isPrototype?: boolean;
  implementationKind?: string;
  sourceOrigin?: import('./sourceOrigin').SourceOrigin;
}

export interface ApiCurrentObjectAncestor {
  name: string;
  uri?: string;
  sourceOrigin?: import('./sourceOrigin').SourceOrigin;
  isSystemType?: boolean;
}

export interface ApiCurrentObjectReference {
  identifier: string;
  qualifier?: string;
  line: number;
  target: ApiCurrentObjectContextSymbol;
  confidence?: 'high' | 'medium' | 'low';
  reasonCode?: string;
  invocationKind?: string;
  invocationRisk?: string;
}

export interface ApiCurrentObjectDiagnostic {
  message: string;
  code?: string;
  severity?: 'error' | 'warning' | 'info' | 'hint';
  line: number;
  character: number;
}

export interface ApiCurrentObjectDataWindowBinding {
  targetName: string;
  line: number;
  dataObject?: string | null;
  state: 'resolved' | 'missing' | 'ambiguous' | 'dynamic';
  targetUri?: string;
  retrieveArguments: Array<{
    name: string;
    type: string;
    label: string;
  }>;
}

export interface ApiCurrentObjectRelatedFile {
  uri: string;
  role: 'active-document' | 'project' | 'library' | 'ancestor' | 'datawindow' | 'reference-target' | 'descendant' | 'override';
}

export interface ApiCurrentObjectContext {
  available: boolean;
  reason?: string;
  uri?: string;
  objectInfo?: ApiCurrentObjectInfo;
  projectContext?: {
    uri?: string;
    name?: string;
    libraries: string[];
  };
  sourceExcerpt?: {
    startLine: number;
    endLine: number;
    text: string;
    truncated: boolean;
  };
  ancestorChain?: ApiCurrentObjectAncestor[];
  members?: {
    functions: ApiCurrentObjectContextSymbol[];
    events: ApiCurrentObjectContextSymbol[];
    prototypes: ApiCurrentObjectContextSymbol[];
  };
  referencedSymbols?: ApiCurrentObjectReference[];
  diagnostics?: {
    total: number;
    byCode: Record<string, number>;
    bySeverity: Record<string, number>;
    items: ApiCurrentObjectDiagnostic[];
  };
  dataWindowBindings?: ApiCurrentObjectDataWindowBinding[];
  evidence?: {
    readiness?: string;
    identifier?: string;
    qualifier?: string;
    resolutionConfidence?: 'high' | 'medium' | 'low';
    primaryReasonCode?: string;
    invocationKind?: string;
    invocationRisk?: string;
    targetCount?: number;
    evidenceKinds: string[];
  };
  relatedFiles?: ApiCurrentObjectRelatedFile[];
}

export interface ApiImpactAnalysisRequest {
  uri?: string;
  line?: number;
  character?: number;
  maxSafeReferences?: number;
}

export interface ApiImpactLocation {
  uri: string;
  line: number;
  character: number;
}

export interface ApiImpactBuildTarget {
  projectUri: string;
  name?: string;
  files: string[];
}

export interface ApiImpactAnalysis {
  available: boolean;
  reason?: string;
  rootSymbol?: ApiCurrentObjectContextSymbol;
  confidence?: 'high' | 'medium' | 'low';
  primaryReasonCode?: string;
  evidenceKinds?: string[];
  safeReferences: ApiImpactLocation[];
  probableImpactFiles: ApiCurrentObjectRelatedFile[];
  descendants: ApiCurrentObjectAncestor[];
  overrides: ApiCurrentObjectContextSymbol[];
  relatedEvents: ApiCurrentObjectContextSymbol[];
  relatedDataWindows: ApiCurrentObjectDataWindowBinding[];
  affectedSymbols: ApiCurrentObjectContextSymbol[];
  buildTargets: ApiImpactBuildTarget[];
}

export interface ApiSafeEditPlanRequest extends ApiImpactAnalysisRequest {}

export interface ApiSafeEditPlanFile {
  uri: string;
  reason: string;
  risk: 'low' | 'medium' | 'high';
  sourceOrigin?: import('./sourceOrigin').SourceOrigin;
}

export interface ApiSafeEditPlan {
  available: boolean;
  blocked: boolean;
  reason?: string;
  confidence?: 'high' | 'medium' | 'low';
  targetSymbol?: ApiCurrentObjectContextSymbol;
  objects: ApiCurrentObjectContextSymbol[];
  files: ApiSafeEditPlanFile[];
  risks: string[];
  recommendedTests: string[];
  docsToReview: string[];
  blockedReasons: string[];
}

export interface ApiSemanticWorkspaceManifestRequest {
  maxObjects?: number;
  maxSymbols?: number;
}

export interface ApiSemanticWorkspaceManifestProject {
  projectUri: string;
  kind: 'target' | 'project';
  name: string;
  libraries: string[];
  fileCount: number;
}

export interface ApiSemanticWorkspaceManifestObject {
  name: string;
  uri: string;
  baseType?: string;
  sourceOrigin?: import('./sourceOrigin').SourceOrigin;
}

export interface ApiSemanticWorkspaceManifestInheritanceItem {
  name: string;
  baseType?: string;
  descendantCount: number;
}

export interface ApiSemanticWorkspaceManifest {
  schemaVersion: string;
  generatedAt: number;
  limits: {
    maxObjects: number;
    maxSymbols: number;
    objectsTruncated: boolean;
    symbolsTruncated: boolean;
  };
  projects: ApiSemanticWorkspaceManifestProject[];
  libraries: string[];
  objects: ApiSemanticWorkspaceManifestObject[];
  inheritanceSummary: {
    totalTypes: number;
    roots: number;
    items: ApiSemanticWorkspaceManifestInheritanceItem[];
  };
  exportedSymbols: ApiSymbol[];
  diagnosticsSummary?: ApiDiagnosticsSnapshot | null;
  sourceOriginSummary: Partial<Record<import('./sourceOrigin').SourceOrigin, number>>;
  readiness: {
    state?: string;
    detail?: string;
  };
}

export interface ApiCatalogReport {
  total: number;
  duplicates: number;
  missingSignatures: number;
}

export interface ApiRuntimeJournalEvent {
  ts: number;
  phase: string;
  kind: string;
  action: string;
  severity?: 'info' | 'warning' | 'error';
  label?: string;
  durationMs?: number;
  hits?: number;
  misses?: number;
  evictions?: number;
  invalidationCount?: number;
  detail?: unknown;
}

export interface ApiRuntimeJournalSnapshot {
  total: number;
  dropped: number;
  events: ApiRuntimeJournalEvent[];
}

export interface ApiRuntimeHealthFinding {
  code: string;
  layer: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  detail?: string;
}

export interface ApiRuntimeHealthReport {
  status: 'healthy' | 'warning' | 'error';
  summary: string;
  findings: ApiRuntimeHealthFinding[];
  counts: {
    info: number;
    warning: number;
    error: number;
  };
  checkedLayers: string[];
}

export interface ApiRuntimeMemoryLayerBudget {
  layer: 'analysis' | 'serving' | 'documents' | 'hot-context' | 'code-lens' | 'knowledge';
  label: string;
  estimatedBytes: number;
  budgetBytes: number;
  usageRatio: number;
  status: 'healthy' | 'warning' | 'error';
  unitCount?: number;
  unitLabel?: string;
}

export interface ApiRuntimeMemoryReport {
  status: 'healthy' | 'warning' | 'error';
  totalEstimatedBytes: number;
  totalBudgetBytes: number;
  layers: ApiRuntimeMemoryLayerBudget[];
  process?: {
    rssBytes?: number;
    heapUsedBytes?: number;
    heapTotalBytes?: number;
    externalBytes?: number;
  };
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
    sourceOrigins?: Partial<Record<import('./sourceOrigin').SourceOrigin, number>>;
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
  memory?: ApiRuntimeMemoryReport;
  diagnostics?: ApiDiagnosticsSnapshot;
  caches?: {
    analysis?: { size?: number; capacity?: number };
    serving?: {
      size?: number;
      capacity?: number;
      hits?: number;
      misses?: number;
      evictions?: number;
      ttlMs?: number;
    };
    documents?: { size?: number; internedStrings?: number };
    hotContext?: { inheritedTypes?: number; capacity?: number };
    codeLens?: { size?: number; capacity?: number; hits?: number; misses?: number; evictions?: number };
  };
  lastQueryTrace?: {
    label?: string;
    confidence?: 'high' | 'medium' | 'low';
    primaryReasonCode?: string;
    invocationKind?: string;
    invocationRisk?: string;
    evidenceKinds?: string[];
    targetCount?: number;
    hasAmbiguity?: boolean;
    steps?: Array<{ name?: string }>;
  };
  persistence?: {
    storageUri?: string;
    checkpointUri?: string;
    journalUri?: string;
    workspaceKey?: string;
    restoreState?: 'restored' | 'reused' | 'rebuilt';
    restoreReason?: string;
    restoredDocuments?: number;
    servingSnapshot?: {
      lastRestoredEntries?: number;
      lastPersistedEntries?: number;
    };
  };
  health?: ApiRuntimeHealthReport;
  runtimeJournal?: ApiRuntimeJournalSnapshot;
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
  sourceOrigin?: import('./sourceOrigin').SourceOrigin;
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
  getCurrentObjectContext(request?: ApiCurrentObjectContextRequest): Promise<ApiCurrentObjectContext>;
  analyzeImpact(request?: ApiImpactAnalysisRequest): Promise<ApiImpactAnalysis>;
  generateSafeEditPlan(request?: ApiSafeEditPlanRequest): Promise<ApiSafeEditPlan>;
  getSemanticWorkspaceManifest(request?: ApiSemanticWorkspaceManifestRequest): Promise<ApiSemanticWorkspaceManifest>;
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

