/**
 * Public API surface (Spec 054 / B109).
 *
 * @module shared/publicApi
 */

export const PUBLIC_API_VERSION = '2.3.0';
export const PUBLIC_API_EXTENSION_ID = 'lopez.vsc-powersyntax';

export type ApiReadOnlyToolName =
  | 'contract'
  | 'server-stats'
  | 'query-symbols'
  | 'current-object-context'
  | 'impact-analysis'
  | 'safe-edit-plan'
  | 'safe-batch-refactor-plan'
  | 'semantic-workspace-manifest';

export interface ApiReadOnlyToolDescriptor {
  name: ApiReadOnlyToolName;
  description: string;
  requestSchema?: string;
  responseSchema: string;
  command?: string;
  usesActiveEditorFallback: boolean;
}

export interface ApiReadOnlyToolBridgeDescriptor {
  schemaVersion: '1.0.0';
  apiVersion: string;
  tools: ApiReadOnlyToolDescriptor[];
}

export interface ApiReadOnlyToolCallRequest {
  tool: ApiReadOnlyToolName;
  args?: unknown;
}

export interface ApiReadOnlyToolCallResult {
  tool: ApiReadOnlyToolName;
  mode: 'read-only';
  schema: string;
  payload: unknown;
}

export interface ApiSemanticWorkspaceSnapshotSummary {
  projectCount: number;
  objectCount: number;
  exportedSymbolCount: number;
  readinessState?: string;
  healthStatus?: string;
}

export interface ApiSemanticWorkspaceSnapshot {
  schemaVersion: '1.0.0';
  generatedAt: string;
  apiVersion: string;
  contract: ApiPublicContractDescriptor;
  readOnlyToolBridge: ApiReadOnlyToolBridgeDescriptor;
  workspaceManifest: ApiSemanticWorkspaceManifest;
  serverStats?: ApiServerStats;
  summary: ApiSemanticWorkspaceSnapshotSummary;
}

export interface ApiSemanticWorkspaceSnapshotExportRequest extends ApiSemanticWorkspaceManifestRequest {
  includeServerStats?: boolean;
  destinationUri?: string;
}

export interface ApiSemanticWorkspaceSnapshotExportResult {
  snapshot: ApiSemanticWorkspaceSnapshot;
  destinationUri?: string;
}

export interface ApiSemanticWorkspaceSnapshotImportRequest {
  sourceUri?: string;
  serializedSnapshot?: string;
  snapshot?: ApiSemanticWorkspaceSnapshot;
}

export interface ApiSemanticWorkspaceSnapshotImportResult {
  valid: boolean;
  reason?: string;
  sourceUri?: string;
  snapshot?: ApiSemanticWorkspaceSnapshot;
  summary?: ApiSemanticWorkspaceSnapshotSummary;
}

const READ_ONLY_TOOL_DESCRIPTORS: ReadonlyArray<ApiReadOnlyToolDescriptor> = [
  {
    name: 'contract',
    description: 'Devuelve el descriptor contractual endurecido de la API pública exportada.',
    responseSchema: 'ApiPublicContractDescriptor',
    usesActiveEditorFallback: false,
  },
  {
    name: 'server-stats',
    description: 'Devuelve estadísticas serializables del runtime del servidor.',
    command: 'powerbuilder.showStats',
    responseSchema: 'ApiServerStats',
    usesActiveEditorFallback: false,
  },
  {
    name: 'query-symbols',
    description: 'Ejecuta una query read-only de símbolos exportables del workspace.',
    command: 'powerbuilder.querySymbols',
    requestSchema: 'ApiQuerySymbolsRequest',
    responseSchema: 'ApiSymbol[]',
    usesActiveEditorFallback: false,
  },
  {
    name: 'current-object-context',
    description: 'Devuelve el context pack estructurado del objeto actual o de una posición explícita.',
    command: 'powerbuilder.currentObjectContext',
    requestSchema: 'ApiCurrentObjectContextRequest',
    responseSchema: 'ApiCurrentObjectContext',
    usesActiveEditorFallback: true,
  },
  {
    name: 'impact-analysis',
    description: 'Devuelve el análisis read-only de impacto para una posición PowerBuilder.',
    command: 'powerbuilder.analyzeImpact',
    requestSchema: 'ApiImpactAnalysisRequest',
    responseSchema: 'ApiImpactAnalysis',
    usesActiveEditorFallback: true,
  },
  {
    name: 'safe-edit-plan',
    description: 'Devuelve el safe edit plan read-only para una posición PowerBuilder.',
    command: 'powerbuilder.safeEditPlan',
    requestSchema: 'ApiSafeEditPlanRequest',
    responseSchema: 'ApiSafeEditPlan',
    usesActiveEditorFallback: true,
  },
  {
    name: 'safe-batch-refactor-plan',
    description: 'Planifica un batch read-only de rename/refactor reutilizando rename preflight, impact analysis y safe edit plan.',
    command: 'powerbuilder.safeBatchRefactorPlan',
    requestSchema: 'ApiSafeBatchRefactorPlanRequest',
    responseSchema: 'ApiSafeBatchRefactorPlan',
    usesActiveEditorFallback: false,
  },
  {
    name: 'semantic-workspace-manifest',
    description: 'Devuelve el manifest semántico compacto del workspace actual.',
    command: 'powerbuilder.semanticWorkspaceManifest',
    requestSchema: 'ApiSemanticWorkspaceManifestRequest',
    responseSchema: 'ApiSemanticWorkspaceManifest',
    usesActiveEditorFallback: false,
  },
];

export function getReadOnlyToolBridgeDescriptor(): ApiReadOnlyToolBridgeDescriptor {
  return {
    schemaVersion: '1.0.0',
    apiVersion: PUBLIC_API_VERSION,
    tools: READ_ONLY_TOOL_DESCRIPTORS.map((tool) => ({ ...tool })),
  };
}

export type ApiPublicContractAccess = 'read-only' | 'write-enabled';
export type ApiPublicContractStability = 'stable' | 'preview';

export interface ApiPublicContractMethod {
  name: string;
  command?: string;
  access: ApiPublicContractAccess;
  stability: ApiPublicContractStability;
  requestSchema?: string;
  responseSchema?: string;
}

export interface ApiPublicContractSchema {
  name: string;
  version: string;
  kind: 'request' | 'response' | 'descriptor';
}

export interface ApiPublicContractDescriptor {
  extensionId: string;
  apiVersion: string;
  apiVersionMajor: number;
  exportedFrom: 'activate';
  methods: ApiPublicContractMethod[];
  schemas: ApiPublicContractSchema[];
  capabilities: {
    readOnlyMethods: string[];
    writeEnabledMethods: string[];
    readOnlyTools: ApiReadOnlyToolName[];
  };
}

const PUBLIC_API_CONTRACT_METHODS: ReadonlyArray<ApiPublicContractMethod> = [
  {
    name: 'isVersionCompatible',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'string',
    responseSchema: 'boolean',
  },
  {
    name: 'getPublicContract',
    access: 'read-only',
    stability: 'stable',
    responseSchema: 'ApiPublicContractDescriptor',
  },
  {
    name: 'getReadOnlyToolBridge',
    access: 'read-only',
    stability: 'stable',
    responseSchema: 'ApiReadOnlyToolBridgeDescriptor',
  },
  {
    name: 'invokeReadOnlyTool',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiReadOnlyToolCallRequest',
    responseSchema: 'ApiReadOnlyToolCallResult',
  },
  {
    name: 'exportSemanticWorkspaceSnapshot',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiSemanticWorkspaceSnapshotExportRequest',
    responseSchema: 'ApiSemanticWorkspaceSnapshotExportResult',
  },
  {
    name: 'importSemanticWorkspaceSnapshot',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiSemanticWorkspaceSnapshotImportRequest',
    responseSchema: 'ApiSemanticWorkspaceSnapshotImportResult',
  },
  {
    name: 'getServerStats',
    command: 'powerbuilder.showStats',
    access: 'read-only',
    stability: 'stable',
    responseSchema: 'ApiServerStats',
  },
  {
    name: 'querySymbols',
    command: 'powerbuilder.querySymbols',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiQuerySymbolsRequest',
    responseSchema: 'ApiSymbol[]',
  },
  {
    name: 'getCurrentObjectContext',
    command: 'powerbuilder.currentObjectContext',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiCurrentObjectContextRequest',
    responseSchema: 'ApiCurrentObjectContext',
  },
  {
    name: 'analyzeImpact',
    command: 'powerbuilder.analyzeImpact',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiImpactAnalysisRequest',
    responseSchema: 'ApiImpactAnalysis',
  },
  {
    name: 'generateSafeEditPlan',
    command: 'powerbuilder.safeEditPlan',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiSafeEditPlanRequest',
    responseSchema: 'ApiSafeEditPlan',
  },
  {
    name: 'generateSafeBatchRefactorPlan',
    command: 'powerbuilder.safeBatchRefactorPlan',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiSafeBatchRefactorPlanRequest',
    responseSchema: 'ApiSafeBatchRefactorPlan',
  },
  {
    name: 'applySpecDrivenPblUpdate',
    command: 'powerbuilder.applySpecDrivenPblUpdate',
    access: 'write-enabled',
    stability: 'stable',
    requestSchema: 'ApiSpecDrivenPblUpdateRequest',
    responseSchema: 'ApiSpecDrivenPblUpdateResult',
  },
  {
    name: 'applySpecDrivenPblUpdateBatch',
    command: 'powerbuilder.applySpecDrivenPblUpdateBatch',
    access: 'write-enabled',
    stability: 'stable',
    requestSchema: 'ApiSpecDrivenPblUpdateBatchRequest',
    responseSchema: 'ApiSpecDrivenPblUpdateBatchResult',
  },
  {
    name: 'getSemanticWorkspaceManifest',
    command: 'powerbuilder.semanticWorkspaceManifest',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiSemanticWorkspaceManifestRequest',
    responseSchema: 'ApiSemanticWorkspaceManifest',
  },
];

const PUBLIC_API_CONTRACT_SCHEMAS: ReadonlyArray<ApiPublicContractSchema> = [
  { name: 'ApiPublicContractDescriptor', version: '2.2.0', kind: 'descriptor' },
  { name: 'ApiReadOnlyToolBridgeDescriptor', version: '1.0.0', kind: 'descriptor' },
  { name: 'ApiReadOnlyToolCallRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiReadOnlyToolCallResult', version: '1.0.0', kind: 'response' },
  { name: 'ApiSemanticWorkspaceSnapshot', version: '1.0.0', kind: 'response' },
  { name: 'ApiSemanticWorkspaceSnapshotExportRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiSemanticWorkspaceSnapshotExportResult', version: '1.0.0', kind: 'response' },
  { name: 'ApiSemanticWorkspaceSnapshotImportRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiSemanticWorkspaceSnapshotImportResult', version: '1.0.0', kind: 'response' },
  { name: 'ApiQuerySymbolsRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiCurrentObjectContextRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiCurrentObjectContext', version: '1.0.0', kind: 'response' },
  { name: 'ApiImpactAnalysisRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiImpactAnalysis', version: '1.0.0', kind: 'response' },
  { name: 'ApiSafeEditPlanRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiSafeEditPlan', version: '1.0.0', kind: 'response' },
  { name: 'ApiSafeBatchRefactorPlanRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiSafeBatchRefactorPlan', version: '1.0.0', kind: 'response' },
  { name: 'ApiSpecDrivenPblUpdateRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiSpecDrivenPblUpdateResult', version: '1.0.0', kind: 'response' },
  { name: 'ApiSpecDrivenPblUpdateBatchRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiSpecDrivenPblUpdateBatchResult', version: '1.0.0', kind: 'response' },
  { name: 'ApiSemanticWorkspaceManifestRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiSemanticWorkspaceManifest', version: '1.0.0', kind: 'response' },
  { name: 'ApiServerStats', version: '1.0.0', kind: 'response' },
];

export function getPublicApiContractDescriptor(): ApiPublicContractDescriptor {
  const apiVersionMajor = Number.parseInt(PUBLIC_API_VERSION.split('.')[0] ?? '', 10);
  const methods = PUBLIC_API_CONTRACT_METHODS.map((method) => ({ ...method }));
  const schemas = PUBLIC_API_CONTRACT_SCHEMAS.map((schema) => ({ ...schema }));

  return {
    extensionId: PUBLIC_API_EXTENSION_ID,
    apiVersion: PUBLIC_API_VERSION,
    apiVersionMajor: Number.isNaN(apiVersionMajor) ? 0 : apiVersionMajor,
    exportedFrom: 'activate',
    methods,
    schemas,
    capabilities: {
      readOnlyMethods: methods.filter((method) => method.access === 'read-only').map((method) => method.name),
      writeEnabledMethods: methods.filter((method) => method.access === 'write-enabled').map((method) => method.name),
      readOnlyTools: READ_ONLY_TOOL_DESCRIPTORS.map((tool) => tool.name),
    },
  };
}

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

export interface ApiCurrentObjectVisibleVariable {
  name: string;
  uri: string;
  line: number;
  character: number;
  datatype?: string;
  scope?: 'Local' | 'Instancia' | 'Global' | 'Compartida' | 'Argumento';
  declaredIn?: string | null;
  relation?: 'own' | 'inherited' | 'override';
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
  visibleVariables?: ApiCurrentObjectVisibleVariable[];
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

export interface ApiSafeBatchRefactorPlanItemRequest extends ApiSafeEditPlanRequest {
  uri?: string;
  label?: string;
  newName?: string;
}

export interface ApiSafeBatchRefactorPlanItemResult {
  label?: string;
  uri?: string;
  newName?: string;
  status: 'planned' | 'blocked' | 'skipped';
  renamePreflight?: {
    ok: boolean;
    reason?: string;
  };
  impactAnalysis?: ApiImpactAnalysis;
  safeEditPlan?: ApiSafeEditPlan;
  blockedReasons: string[];
}

export interface ApiSafeBatchRefactorPlanRequest {
  items: ApiSafeBatchRefactorPlanItemRequest[];
  stopOnBlocked?: boolean;
}

export interface ApiSafeBatchRefactorPlan {
  available: boolean;
  blocked: boolean;
  stoppedEarly: boolean;
  reason?: string;
  total: number;
  planned: number;
  blockedCount: number;
  skippedCount: number;
  items: ApiSafeBatchRefactorPlanItemResult[];
  aggregatedRisks: string[];
  recommendedTests: string[];
  docsToReview: string[];
}

export interface ApiSpecDrivenPblUpdateEdit {
  uri: string;
  content: string;
}

export interface ApiSpecDrivenPblUpdateRequest extends ApiSafeEditPlanRequest {
  executablePath: string;
  sessionLibrary: string;
  timeoutMs?: number;
  edits: ApiSpecDrivenPblUpdateEdit[];
}

export interface ApiSpecDrivenPblUpdateAppliedEdit {
  sourceUri: string;
  stagingUri: string;
}

export interface ApiSpecDrivenPblUpdateResult {
  available: boolean;
  blocked: boolean;
  reason?: string;
  blockedReasons: string[];
  safeEditPlan: ApiSafeEditPlan;
  appliedEdits: ApiSpecDrivenPblUpdateAppliedEdit[];
  exportResult?: import('./orcaProtocol').OrcaStagingExportResult;
  importResult?: import('./orcaProtocol').OrcaStagingImportResult;
  journalUri?: string;
}

export interface ApiSpecDrivenPblUpdateBatchRequestItem extends ApiSpecDrivenPblUpdateRequest {
  label?: string;
}

export interface ApiSpecDrivenPblUpdateBatchRequest {
  requests: ApiSpecDrivenPblUpdateBatchRequestItem[];
  stopOnError?: boolean;
}

export interface ApiSpecDrivenPblUpdateBatchItemResult {
  label?: string;
  uri?: string;
  blocked: boolean;
  reason?: string;
  result?: ApiSpecDrivenPblUpdateResult;
}

export interface ApiSpecDrivenPblUpdateBatchResult {
  blocked: boolean;
  stoppedEarly: boolean;
  total: number;
  succeeded: number;
  blockedCount: number;
  items: ApiSpecDrivenPblUpdateBatchItemResult[];
  journalUri?: string;
}

export interface ApiSemanticWorkspaceManifestRequest {
  maxObjects?: number;
  maxSymbols?: number;
}

export interface ApiSemanticWorkspaceManifestProject {
  projectUri: string;
  kind: 'target' | 'project' | 'library';
  name: string;
  libraries: string[];
  fileCount: number;
}

export interface ApiSemanticWorkspaceManifestObject {
  name: string;
  uri: string;
  baseType?: string;
  projectUri?: string;
  library?: string;
  objectKind?: 'application' | 'window' | 'userobject' | 'menu' | 'datawindow' | 'function' | 'structure' | 'pipeline' | 'query' | 'unknown';
  readiness?: string;
  sourceOrigin?: import('./sourceOrigin').SourceOrigin;
}

export interface ApiSemanticWorkspaceManifestInheritanceItem {
  name: string;
  baseType?: string;
  descendantCount: number;
}

export interface ApiFrameworkKnowledgePackSummary {
  id: string;
  version: string;
  title: string;
  summary: string;
  ownerTypes: string[];
  symbolCount: number;
  memberCount: number;
  eventCount: number;
  symbolSamples: string[];
  source: string;
  sourceUrl?: string;
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
  knowledgePacks?: {
    total: number;
    items: ApiFrameworkKnowledgePackSummary[];
  };
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

export interface ApiBuildHealthFinding {
  code: string;
  layer: 'tooling' | 'build-files' | 'runner' | 'problems';
  severity: 'info' | 'warning' | 'error';
  message: string;
  detail?: string;
}

export interface ApiBuildHealthSnapshot {
  state: 'ready' | 'running' | 'attention' | 'blocked';
  status: 'healthy' | 'warning' | 'error';
  canRun: boolean;
  summary: string;
  findings: ApiBuildHealthFinding[];
}

export interface ApiOrcaCapabilitySnapshot {
  status: 'available' | 'missing' | 'invalid';
  source: 'config' | 'env' | 'unresolved';
  executablePath?: string;
  capabilities: string[];
  detail: string;
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
  buildFiles?: {
    total?: number;
    usable?: number;
    invalid?: number;
    ambiguous?: number;
  };
  buildProfile?: {
    buildFileUri?: string;
    label?: string;
    detail?: string;
  };
  buildRunner?: import('./pbAutoBuildProtocol').PbAutoBuildRunSnapshot;
  orcaTooling?: ApiOrcaCapabilitySnapshot;
  orcaRunner?: import('./orcaProtocol').OrcaRunSnapshot;
  buildProblems?: import('./pbAutoBuildProtocol').PbAutoBuildProblemSummary;
  buildHealth?: ApiBuildHealthSnapshot;
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
    buildOrcaJournalUri?: string;
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
  extensionId: string;
  contract: ApiPublicContractDescriptor;
  isVersionCompatible(requested: string): boolean;
  getPublicContract(): ApiPublicContractDescriptor;
  getReadOnlyToolBridge(): ApiReadOnlyToolBridgeDescriptor;
  invokeReadOnlyTool(request: ApiReadOnlyToolCallRequest): Promise<ApiReadOnlyToolCallResult>;
  exportSemanticWorkspaceSnapshot(request?: ApiSemanticWorkspaceSnapshotExportRequest): Promise<ApiSemanticWorkspaceSnapshotExportResult>;
  importSemanticWorkspaceSnapshot(request: ApiSemanticWorkspaceSnapshotImportRequest): Promise<ApiSemanticWorkspaceSnapshotImportResult>;
  getServerStats(): Promise<ApiServerStats>;
  querySymbols(request: ApiQuerySymbolsRequest): Promise<ApiSymbol[]>;
  getCurrentObjectContext(request?: ApiCurrentObjectContextRequest): Promise<ApiCurrentObjectContext>;
  analyzeImpact(request?: ApiImpactAnalysisRequest): Promise<ApiImpactAnalysis>;
  generateSafeEditPlan(request?: ApiSafeEditPlanRequest): Promise<ApiSafeEditPlan>;
  generateSafeBatchRefactorPlan(request?: ApiSafeBatchRefactorPlanRequest): Promise<ApiSafeBatchRefactorPlan>;
  applySpecDrivenPblUpdate(request: ApiSpecDrivenPblUpdateRequest): Promise<ApiSpecDrivenPblUpdateResult>;
  applySpecDrivenPblUpdateBatch(request: ApiSpecDrivenPblUpdateBatchRequest): Promise<ApiSpecDrivenPblUpdateBatchResult>;
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

