/**
 * Public API surface (Spec 054 / B109).
 *
 * @module shared/publicApi
 */

export const PUBLIC_API_VERSION = '2.25.0';
export const PUBLIC_API_EXTENSION_ID = 'lopez.vsc-powersyntax';

export type ApiReadOnlyToolName =
  | 'contract'
  | 'server-stats'
  | 'workspace-check'
  | 'object-check'
  | 'explain-diagnostic'
  | 'explain-system-symbol'
  | 'explain-semantic-query'
  | 'ai-task-context-bundle'
  | 'task-execution-dry-run'
  | 'task-replay-bundle'
  | 'query-symbols'
  | 'cross-project-symbol-conflicts'
  | 'workspace-migration-assistant'
  | 'build-profile-matrix'
  | 'dependency-graph'
  | 'code-metrics'
  | 'technical-debt-report'
  | 'datawindow-sql-lineage'
  | 'current-object-context'
  | 'impact-analysis'
  | 'safe-edit-plan'
  | 'safe-batch-refactor-plan'
  | 'semantic-snapshot-diff'
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

export interface ApiSemanticWorkspaceSnapshotDiffRequest {
  previous: ApiSemanticWorkspaceSnapshot;
  next: ApiSemanticWorkspaceSnapshot;
  previousLabel?: string;
  nextLabel?: string;
  maxProjectChanges?: number;
  maxObjectChanges?: number;
  maxSymbolChanges?: number;
}

export interface ApiSemanticWorkspaceSnapshotDiffCount {
  added: number;
  removed: number;
  updated: number;
  truncated?: boolean;
}

export interface ApiSemanticWorkspaceSnapshotDiffItem {
  key: string;
  label: string;
  change: 'added' | 'removed' | 'updated';
  detail?: string;
}

export interface ApiSemanticWorkspaceSnapshotSourceOriginDelta {
  sourceOrigin: import('./sourceOrigin').SourceOrigin;
  previous: number;
  next: number;
  delta: number;
}

export interface ApiSemanticWorkspaceSnapshotStateDelta {
  changed: boolean;
  previous?: string;
  next?: string;
}

export interface ApiSemanticWorkspaceSnapshotDiagnosticsDelta {
  changed: boolean;
  previous: { error: number; warning: number; info: number; hint: number };
  next: { error: number; warning: number; info: number; hint: number };
  delta: { error: number; warning: number; info: number; hint: number };
}

export interface ApiSemanticWorkspaceSnapshotDiff {
  changed: boolean;
  comparedAt: string;
  previousLabel: string;
  nextLabel: string;
  summary: {
    projects: ApiSemanticWorkspaceSnapshotDiffCount;
    objects: ApiSemanticWorkspaceSnapshotDiffCount;
    exportedSymbols: ApiSemanticWorkspaceSnapshotDiffCount;
    sourceOriginsChanged: number;
    diagnosticsChanged: boolean;
    readinessChanged: boolean;
    healthChanged: boolean;
  };
  projectChanges: ApiSemanticWorkspaceSnapshotDiffItem[];
  objectChanges: ApiSemanticWorkspaceSnapshotDiffItem[];
  symbolChanges: ApiSemanticWorkspaceSnapshotDiffItem[];
  sourceOriginChanges: ApiSemanticWorkspaceSnapshotSourceOriginDelta[];
  diagnostics: ApiSemanticWorkspaceSnapshotDiagnosticsDelta;
  readiness: ApiSemanticWorkspaceSnapshotStateDelta;
  health: ApiSemanticWorkspaceSnapshotStateDelta;
}

export interface ApiPowerBuilderDependencyGraphRequest {
  uri?: string;
  objectName?: string;
  maxDependencies?: number;
  maxDependents?: number;
}

export type ApiInvocationRisk = 'safe' | 'inherited' | 'fallback' | 'dynamic' | 'external';

export interface ApiInvocationRiskSummary {
  risk: ApiInvocationRisk;
  reasons: string[];
  dynamicStringReferenceCount?: number;
}

export type ApiPowerBuilderDependencyGraphNodeKind =
  | 'focus-object'
  | 'workspace-object'
  | 'dependent-object'
  | 'dependency-key'
  | 'document';

export type ApiPowerBuilderDependencyGraphNodeResolution = 'resolved' | 'ambiguous' | 'unresolved';

export interface ApiPowerBuilderDependencyGraphFocus {
  objectName: string;
  uri: string;
  identityKey?: string;
  baseType?: string;
  projectUri?: string;
  library?: string;
  sourceOrigin?: import('./sourceOrigin').SourceOrigin;
}

export interface ApiPowerBuilderDependencyGraphNode {
  id: string;
  label: string;
  kind: ApiPowerBuilderDependencyGraphNodeKind;
  resolution: ApiPowerBuilderDependencyGraphNodeResolution;
  identityKey?: string;
  uri?: string;
  projectUri?: string;
  library?: string;
  sourceOrigin?: import('./sourceOrigin').SourceOrigin;
  candidateCount?: number;
  evidence?: string[];
}

export interface ApiPowerBuilderDependencyGraphEdge {
  sourceId: string;
  targetId: string;
  relation: 'inherits' | 'depends-on' | 'used-by';
  reason: string;
  resolved: boolean;
}

export interface ApiPowerBuilderDependencyGraph {
  schemaVersion: '1.0.0';
  generatedAt: string;
  available: boolean;
  scope: 'immediate-neighborhood';
  reason?: string;
  focus?: ApiPowerBuilderDependencyGraphFocus;
  summary: {
    nodeCount: number;
    edgeCount: number;
    dependencyCount: number;
    dependentCount: number;
    unresolvedDependencyCount: number;
    ambiguousDependencyCount: number;
    invocationRisk?: ApiInvocationRisk;
    riskReasons?: string[];
  };
  nodes: ApiPowerBuilderDependencyGraphNode[];
  edges: ApiPowerBuilderDependencyGraphEdge[];
  mermaidFlowchart: string;
}

export interface ApiDataWindowSqlLineageRequest {
  uri?: string;
  line?: number;
  dataObjectName?: string;
  maxDepth?: number;
}

export interface ApiDataWindowSqlLineageReference {
  rawText: string;
  columnName: string;
  qualifiedTableName?: string;
}

export interface ApiDataWindowSqlLineageNode {
  id: string;
  dataObject: string;
  relation: 'root' | 'report-child' | 'dropdown-child';
  state: 'resolved' | 'missing' | 'ambiguous' | 'dynamic';
  uri?: string;
  via?: string;
  path: string[];
  statement?: string;
  sqlReferences: ApiDataWindowSqlLineageReference[];
  children: ApiDataWindowSqlLineageNode[];
}

export interface ApiDataWindowSqlLineage {
  schemaVersion: '1.0.0';
  generatedAt: string;
  available: boolean;
  reason?: string;
  source: {
    kind: 'datawindow-document' | 'script-binding' | 'dataobject-name';
    uri?: string;
    line?: number;
    targetName?: string;
    dataObject?: string | null;
    state?: 'resolved' | 'missing' | 'ambiguous' | 'dynamic';
  };
  summary: {
    totalNodes: number;
    totalStatements: number;
    totalSqlReferences: number;
    unresolvedLinks: number;
    maxDepthReached: boolean;
  };
  lineage?: ApiDataWindowSqlLineageNode;
}

export interface ApiCrossProjectSymbolConflictsRequest {
  symbolName?: string;
  maxConflicts?: number;
  maxCandidatesPerConflict?: number;
}

export interface ApiCrossProjectSymbolConflictCandidate {
  name: string;
  kind: string;
  uri: string;
  line: number;
  character: number;
  identityKey?: string;
  ownerName?: string;
  parameterCount?: number;
  signature?: string;
  projectUri?: string;
  projectName?: string;
  library?: string;
  sourceOrigin?: import('./sourceOrigin').SourceOrigin;
}

export interface ApiCrossProjectSymbolConflict {
  symbolKey: string;
  symbolName: string;
  kind: string;
  ownerName?: string;
  parameterCount?: number;
  scope: 'cross-project' | 'cross-library' | 'cross-workspace';
  candidateCount: number;
  projectCount: number;
  libraryCount: number;
  sourceOrigins: import('./sourceOrigin').SourceOrigin[];
  evidence: string[];
  truncatedCandidates?: boolean;
  candidates: ApiCrossProjectSymbolConflictCandidate[];
}

export interface ApiCrossProjectSymbolConflicts {
  schemaVersion: '1.0.0';
  generatedAt: string;
  available: boolean;
  reason?: string;
  summary: {
    totalConflictCount: number;
    returnedConflictCount: number;
    totalCandidateCount: number;
    crossProjectConflictCount: number;
    crossLibraryConflictCount: number;
    truncated: boolean;
  };
  conflicts: ApiCrossProjectSymbolConflict[];
}

export interface ApiWorkspaceMigrationAssistantRequest {
  preferredTargetMode?: 'workspace' | 'solution';
  maxRecommendations?: number;
}

export interface ApiWorkspaceMigrationRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'topology' | 'build' | 'legacy';
  title: string;
  detail: string;
  evidence: string[];
  actions: string[];
}

export interface ApiWorkspaceMigrationAssistant {
  schemaVersion: '1.0.0';
  generatedAt: string;
  available: boolean;
  reason?: string;
  currentMode: 'workspace' | 'solution' | 'mixed' | 'pbl-only' | 'unknown';
  targetMode?: 'workspace' | 'solution';
  summary: {
    sourceFileCount: number;
    projectCount: number;
    buildFilesTotal: number;
    usableBuildFiles: number;
    hasLegacyLibraries: boolean;
    hasMixedMarkers: boolean;
    hasOrcaAliases: boolean;
  };
  recommendations: ApiWorkspaceMigrationRecommendation[];
}

export interface ApiBuildProfileMatrixRequest {
  maxProfiles?: number;
}

export interface ApiBuildProfileMatrixFinding {
  code: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  detail?: string;
}

export interface ApiBuildProfileMatrixProfile {
  buildFileUri: string;
  label: string;
  detail?: string;
  representedProjectUri?: string;
  status: 'usable' | 'invalid' | 'ambiguous';
  reasonCode?: 'missing-build-plan' | 'malformed-json' | 'missing-project-reference' | 'unresolved-project-reference' | 'ambiguous-project-reference';
  isLastUsed: boolean;
  canRun: boolean;
  validationState: 'ready' | 'warning' | 'error';
  validationMessage: string;
}

export interface ApiBuildProfileMatrix {
  schemaVersion: '1.0.0';
  generatedAt: string;
  available: true;
  summary: {
    totalProfiles: number;
    usableProfiles: number;
    ambiguousProfiles: number;
    invalidProfiles: number;
    runnableProfiles: number;
    toolingStatus: ApiPbAutoBuildCapabilitySnapshot['status'] | 'unknown';
    healthState: ApiBuildHealthSnapshot['state'];
    preferredProfileUri?: string;
  };
  tooling?: ApiPbAutoBuildCapabilitySnapshot;
  health: ApiBuildHealthSnapshot;
  findings: ApiBuildProfileMatrixFinding[];
  profiles: ApiBuildProfileMatrixProfile[];
}

export type ApiWorkspaceCheckMode = 'quick' | 'full' | 'catalog' | 'diagnostics' | 'upgrade';

export interface ApiWorkspaceCheckRequest {
  mode?: ApiWorkspaceCheckMode;
  includeDiagnostics?: boolean;
  includeCatalog?: boolean;
  includeHealth?: boolean;
  includeBuildProfiles?: boolean;
  includeTechnicalDebt?: boolean;
  includeCodeMetrics?: boolean;
  includeManifest?: boolean;
  includeUpgradeCompatibility?: boolean;
  maxDiagnostics?: number;
  maxFiles?: number;
  maxFindings?: number;
}

export interface ApiWorkspaceCheckFinding {
  code: string;
  severity: 'info' | 'warning' | 'error';
  area:
    | 'readiness'
    | 'indexing'
    | 'diagnostics'
    | 'catalog'
    | 'semantic'
    | 'datawindow'
    | 'build'
    | 'health'
    | 'performance'
    | 'upgrade'
    | 'localization'
    | 'unknown';
  message: string;
  detail?: string;
  uri?: string;
  line?: number;
  character?: number;
  evidence?: string[];
  suggestedAction?: string;
}

export type ApiCatalogAdoptionRecommendedPolicy =
  | 'generated-primary-with-manual-overlays'
  | 'manual-primary'
  | 'hybrid-by-domain';

export interface ApiWorkspaceCheckCatalogOverlaySummary {
  gap: number;
  enrichment: number;
  override: number;
  candidate: number;
}

export interface ApiWorkspaceCheckCatalogAdrComplianceSummary {
  status: 'passed' | 'warning' | 'failed';
  issueCount: number;
  recommendedPolicy: ApiCatalogAdoptionRecommendedPolicy;
  completenessMode: string;
  officialDomainCount: number;
  manualPrimaryDomains: string[];
  officialDomainsWithGaps: string[];
  officialCoverageDriftDomains: string[];
  overlayCounts: ApiWorkspaceCheckCatalogOverlaySummary;
  candidateCount: number;
  candidateHotPathViolations: number;
  scraperErrorCount: number;
  localizationIncompleteOverlays: number;
  localizationInvalidParameterTargets: number;
  localizationRecoveredTargetIds: number;
  officialEntries: number;
  curatedEntries: number;
  generatedEntries: number;
  manualEntries: number;
}

export interface ApiWorkspaceCheckCatalogSummary {
  available: boolean;
  totalEntries?: number;
  duplicates?: number;
  missingSignatures?: number;
  invalidEnumTypes?: number;
  orphanEnumValues?: number;
  orphanLocalizationOverlays?: number;
  generatedManualConflicts?: number;
  consistencyStatus: 'passed' | 'warning' | 'failed' | 'unknown';
  adrCompliance?: ApiWorkspaceCheckCatalogAdrComplianceSummary;
}

export interface ApiWorkspaceCheckUpgradeCompatibility {
  reviewStatus: 'passed' | 'warning';
  currentApiVersion: string;
  workspaceManifestSchemaVersion?: string;
  cachePolicyVersion?: number;
  cacheRestoreState?: 'restored' | 'reused' | 'rebuilt';
  selectedProfile?: string;
  settingsConflicts: number;
  managedSettingsOutOfProfile: number;
  hasPersistentRuntimeState: boolean;
  workspaceArtifactRecommendations: number;
}

export interface ApiWorkspaceCheckSummary {
  projectCount: number;
  objectCount: number;
  exportedSymbolCount: number;
  diagnostics: {
    error: number;
    warning: number;
    info: number;
    hint: number;
  };
  healthStatus?: 'healthy' | 'warning' | 'error';
  readinessState?: string;
  catalogIssues: number;
  blockingFindings: number;
  warningFindings: number;
  generatedFromCache?: boolean;
  truncated: boolean;
}

export interface ApiWorkspaceCheckReport {
  schemaVersion: '1.0.0';
  generatedAt: string;
  apiVersion: string;
  mode: ApiWorkspaceCheckMode;
  status: 'passed' | 'warning' | 'failed';
  available: boolean;
  reason?: string;
  summary: ApiWorkspaceCheckSummary;
  readiness?: ApiServerStats['readiness'];
  health?: ApiRuntimeHealthReport;
  diagnostics?: ApiDiagnosticsSnapshot;
  catalog?: ApiWorkspaceCheckCatalogSummary;
  upgradeCompatibility?: ApiWorkspaceCheckUpgradeCompatibility;
  manifest?: ApiSemanticWorkspaceManifest;
  codeMetrics?: ApiPowerBuilderCodeMetrics;
  technicalDebt?: ApiPowerBuilderTechnicalDebtReport;
  buildProfiles?: ApiBuildProfileMatrix;
  findings: ApiWorkspaceCheckFinding[];
  recommendedActions: string[];
}

export interface ApiObjectCheckRequest {
  uri?: string;
  objectName?: string;
  line?: number;
  character?: number;
  includeDiagnostics?: boolean;
  includeContext?: boolean;
  includeDependencyGraph?: boolean;
  includeImpactAnalysis?: boolean;
  includeSafeEditPlan?: boolean;
  includeDataWindowBindings?: boolean;
  includeEmbeddedSql?: boolean;
  includeLifecycle?: boolean;
  maxDiagnostics?: number;
  maxReferences?: number;
  maxDependencyNodes?: number;
  maxFindings?: number;
}

export interface ApiObjectCheckFinding {
  code: string;
  severity: 'info' | 'warning' | 'error';
  area:
    | 'parser'
    | 'diagnostics'
    | 'semantic'
    | 'inheritance'
    | 'override'
    | 'lifecycle'
    | 'datawindow'
    | 'sql'
    | 'dependency'
    | 'safe-edit'
    | 'health'
    | 'unknown';
  message: string;
  detail?: string;
  uri?: string;
  line?: number;
  character?: number;
  evidence?: string[];
  suggestedAction?: string;
}

export interface ApiObjectCheckSummary {
  objectName?: string;
  objectKind?: string;
  uri?: string;
  diagnostics: {
    error: number;
    warning: number;
    info: number;
    hint: number;
  };
  dependencyCount: number;
  dependentCount: number;
  unresolvedDependencyCount: number;
  ambiguousDependencyCount: number;
  dataWindowBindingCount: number;
  unresolvedDataWindowBindingCount: number;
  embeddedSqlCount: number;
  dynamicSqlRiskCount: number;
  blockingFindings: number;
  warningFindings: number;
  truncated: boolean;
}

export interface ApiObjectCheckReport {
  schemaVersion: '1.0.0';
  generatedAt: string;
  apiVersion: string;
  available: boolean;
  reason?: string;
  status: 'passed' | 'warning' | 'failed';
  source: {
    kind: 'active-editor' | 'uri' | 'object-name';
    uri?: string;
    objectName?: string;
    line?: number;
    character?: number;
  };
  summary: ApiObjectCheckSummary;
  objectContext?: ApiCurrentObjectContext;
  dependencyGraph?: ApiPowerBuilderDependencyGraph;
  impactAnalysis?: ApiImpactAnalysis;
  safeEditPlan?: ApiSafeEditPlan;
  findings: ApiObjectCheckFinding[];
  recommendedActions: string[];
}

export interface ApiExplainDiagnosticRequest {
  uri?: string;
  line?: number;
  character?: number;
  code?: string;
  diagnosticIndex?: number;
  includeObjectContext?: boolean;
  includeSafeFixPlan?: boolean;
  maxEvidence?: number;
  maxExcerptLines?: number;
}

export interface ApiExplainDiagnosticReport {
  schemaVersion: '1.0.0';
  generatedAt: string;
  apiVersion: string;

  available: boolean;
  reason?: string;

  diagnostic?: {
    code?: string;
    message: string;
    severity: 'error' | 'warning' | 'info' | 'hint';
    uri: string;
    line: number;
    character: number;
  };

  explanation: {
    summary: string;
    reasonCode?: string;
    area:
      | 'parser'
      | 'semantic'
      | 'catalog'
      | 'datawindow'
      | 'sql'
      | 'lifecycle'
      | 'unused'
      | 'shadowing'
      | 'unknown';
    confidence: 'high' | 'medium' | 'low' | 'unknown';
    whyItMatters?: string;
  };

  evidence: Array<{
    kind: 'source-excerpt' | 'symbol' | 'scope' | 'catalog' | 'datawindow' | 'dependency' | 'rule';
    label: string;
    detail?: string;
    uri?: string;
    line?: number;
    character?: number;
  }>;

  safeFix?: {
    available: boolean;
    kind?:
      | 'remove-declaration'
      | 'rename-symbol'
      | 'add-reference'
      | 'adjust-signature'
      | 'replace-enum-value'
      | 'update-datatype'
      | 'manual-review';
    confidence?: 'high' | 'medium' | 'low' | 'unknown';
    blocked?: boolean;
    blockedReasons?: string[];
    planSummary?: string;
  };

  recommendedActions: string[];
}

export interface ApiExplainSystemSymbolRequest {
  name?: string;
  uri?: string;
  line?: number;
  character?: number;
  ownerType?: string;
  domain?: string;
  kind?: string;
  locale?: 'en' | 'es';
  includeSignatures?: boolean;
  includeParameters?: boolean;
  includeEnumValues?: boolean;
  includeProvenance?: boolean;
  includeConflicts?: boolean;
  maxCandidates?: number;
  maxSignatures?: number;
  maxEnumValues?: number;
}

export interface ApiExplainSystemSymbolReport {
  schemaVersion: '1.0.0';
  generatedAt: string;
  apiVersion: string;

  available: boolean;
  reason?: string;
  query: ApiExplainSystemSymbolRequest;

  resolution: {
    state: 'resolved' | 'ambiguous' | 'unresolved';
    candidateCount: number;
    selectedId?: string;
    confidence: 'high' | 'medium' | 'low' | 'unknown';
  };

  symbol?: {
    id?: string;
    name: string;
    normalizedName?: string;
    domain?: string;
    kind?: string;
    category?: string;
    ownerTypes?: readonly string[];
    appliesTo?: readonly string[];
    summary?: string;
    documentation?: string;
    obsolete?: boolean;
    obsoleteMessage?: string;
    replacement?: string;
    risk?: string;
    sourceUrl?: string;
    authority?: 'official' | 'curated' | 'generated' | 'project' | 'workspace' | 'custom';
  };

  signatures?: Array<{
    label: string;
    returnType?: string;
    parameters?: Array<{
      name: string;
      type?: string;
      documentation?: string;
    }>;
  }>;

  enumInfo?: {
    enumValueOf?: string;
    enumValues?: readonly string[];
    enumNumericValue?: number;
    enumValueMeaning?: string;
  };

  candidates?: Array<{
    id?: string;
    name: string;
    domain?: string;
    kind?: string;
    ownerTypes?: readonly string[];
    summary?: string;
    sourceUrl?: string;
  }>;

  findings: Array<{
    code: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    detail?: string;
  }>;

  recommendedActions: string[];
}

export interface ApiExplainSemanticQueryRequest {
  uri?: string;
  line?: number;
  character?: number;
  includeCandidates?: boolean;
  includeDiscards?: boolean;
  includeTrace?: boolean;
  maxCandidates?: number;
  maxDiscards?: number;
  maxTraceSteps?: number;
}

export interface ApiExplainSemanticQueryReport {
  schemaVersion: '1.0.0';
  generatedAt: string;
  apiVersion: string;

  available: boolean;
  reason?: string;
  query: ApiExplainSemanticQueryRequest;

  document?: {
    uri: string;
    line: number;
    character: number;
    identifier?: string;
    qualifier?: string;
    currentObject?: string;
  };

  resolution: {
    state: 'resolved' | 'ambiguous' | 'unresolved' | 'no-context';
    candidateCount: number;
    targetCount: number;
    confidence?: 'high' | 'medium' | 'low' | 'unknown';
    reasonCodes: string[];
    primaryReasonCode?: string;
    invocationKind?: string;
    invocationRisk?: string;
    ambiguityKind?: string;
    resolvedQualifierType?: string;
    evidenceKinds: string[];
  };

  winner?: ApiSymbol & {
    containerName?: string;
    sourceOrigin?: import('./sourceOrigin').SourceOrigin;
    authority?: string;
    phase?: string;
    role?: string;
    confidence?: string;
    resolutionKind?: string;
  };

  candidates?: Array<{
    name: string;
    kind: string;
    uri: string;
    containerName?: string;
    reasonCode?: string;
  }>;

  discards?: Array<{
    kind: string;
    reasonCode?: string;
    summary: string;
    detail?: string;
  }>;

  phases: Array<{
    name: 'context' | 'candidates' | 'resolution' | 'trace';
    status: 'resolved' | 'ambiguous' | 'unresolved' | 'skipped';
    summary: string;
  }>;

  cost: {
    approximate: 'low' | 'medium' | 'high';
    traceSteps: number;
    candidateCount: number;
    discardCount: number;
  };

  trace?: {
    label?: string;
    stepCount: number;
    phases: string[];
    actions: string[];
    lastStepName?: string;
    steps?: Array<{
      name: string;
      phase?: string;
      action?: string;
      detail?: unknown;
    }>;
  };

  findings: Array<{
    code: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    detail?: string;
  }>;

  recommendedActions: string[];
}

export type ApiAiTaskIntent =
  | 'bug-fix'
  | 'refactor'
  | 'add-feature'
  | 'diagnose'
  | 'catalog-work'
  | 'documentation-update'
  | 'unknown';

export interface ApiAiTaskContextBundleRequest {
  intent?: ApiAiTaskIntent;
  uri?: string;
  objectName?: string;
  line?: number;
  character?: number;
  includeWorkspaceCheck?: boolean;
  includeObjectCheck?: boolean;
  includeSafeEditPlan?: boolean;
  includeDependencyGraph?: boolean;
  includeDiagnosticsExplanation?: boolean;
  includeSystemSymbolExplanations?: boolean;
  maxTokensHint?: number;
  maxDiagnostics?: number;
  maxSymbols?: number;
  maxFiles?: number;
}

export type ApiAiTaskContextBundleReasonCode =
  | 'missing-focus'
  | 'diagnostics-limit'
  | 'system-symbol-limit'
  | 'token-budget-context'
  | 'token-budget-meta'
  | 'token-budget-minimal';

export interface ApiAiTaskContextBundlePaginationEntry {
  requested: number;
  available: number;
  included: number;
  truncated: boolean;
  reasonCode?: ApiAiTaskContextBundleReasonCode;
}

export interface ApiAiTaskContextBundle {
  schemaVersion: '1.0.0';
  generatedAt: string;
  apiVersion: string;

  available: boolean;
  reason?: string;

  intent: ApiAiTaskIntent;
  tokenBudget: {
    maxTokensHint?: number;
    estimatedTokens?: number;
    truncated: boolean;
  };

  reasonCodes: ApiAiTaskContextBundleReasonCode[];

  pagination: {
    diagnosticExplanations: ApiAiTaskContextBundlePaginationEntry;
    systemSymbolExplanations: ApiAiTaskContextBundlePaginationEntry;
  };

  focus: {
    uri?: string;
    objectName?: string;
    line?: number;
    character?: number;
  };

  summary: string;
  rules: string[];
  context: {
    workspaceCheck?: ApiWorkspaceCheckReport;
    objectCheck?: ApiObjectCheckReport;
    currentObjectContext?: ApiCurrentObjectContext;
    safeEditPlan?: ApiSafeEditPlan;
    dependencyGraph?: ApiPowerBuilderDependencyGraph;
    diagnosticExplanations?: ApiExplainDiagnosticReport[];
    systemSymbolExplanations?: ApiExplainSystemSymbolReport[];
  };

  recommendedWorkflow: string[];
  validationCommands: string[];
  docsToReview: string[];
  omissions: string[];
}

const READ_ONLY_TOOL_DESCRIPTORS: ReadonlyArray<ApiReadOnlyToolDescriptor> = [
  {
    name: 'contract',
    description: 'Devuelve el descriptor contractual endurecido de la API pública exportada.',
    responseSchema: 'ApiPublicContractDescriptor',
    usesActiveEditorFallback: false,
  },
  {
    name: 'workspace-check',
    description: 'Ejecuta una comprobacion read-only consolidada del workspace usando discovery, indexing, diagnostics, health, catalogo, compatibilidad de upgrade y senales semanticas ya disponibles.',
    command: 'powerbuilder.checkWorkspace',
    requestSchema: 'ApiWorkspaceCheckRequest',
    responseSchema: 'ApiWorkspaceCheckReport',
    usesActiveEditorFallback: false,
  },
  {
    name: 'object-check',
    description: 'Ejecuta una comprobacion read-only de un objeto PowerBuilder usando contexto semantico, diagnostics, dependencias y safe-edit signals ya disponibles.',
    command: 'powerbuilder.checkCurrentObject',
    requestSchema: 'ApiObjectCheckRequest',
    responseSchema: 'ApiObjectCheckReport',
    usesActiveEditorFallback: true,
  },
  {
    name: 'explain-diagnostic',
    description: 'Explica un diagnostic PowerBuilder concreto con evidencia minima, reason code y safe fix read-only cuando exista.',
    command: 'powerbuilder.explainDiagnostic',
    requestSchema: 'ApiExplainDiagnosticRequest',
    responseSchema: 'ApiExplainDiagnosticReport',
    usesActiveEditorFallback: true,
  },
  {
    name: 'explain-system-symbol',
    description: 'Explica un simbolo del catalogo del runtime con signatures, enum values, provenance y localizacion opcional.',
    command: 'powerbuilder.explainSystemSymbol',
    requestSchema: 'ApiExplainSystemSymbolRequest',
    responseSchema: 'ApiExplainSystemSymbolReport',
    usesActiveEditorFallback: true,
  },
  {
    name: 'explain-semantic-query',
    description: 'Explica una resolución semántica real con fases, candidatos, descartes, winner, confidence y trace resumido.',
    command: 'powerbuilder.explainSemanticQuery',
    requestSchema: 'ApiExplainSemanticQueryRequest',
    responseSchema: 'ApiExplainSemanticQueryReport',
    usesActiveEditorFallback: true,
  },
  {
    name: 'ai-task-context-bundle',
    description: 'Orquesta un bundle read-only compacto para una tarea IA combinando checks, contexto, explainability y planning ya publicados.',
    command: 'powerbuilder.exportAiTaskContextBundle',
    requestSchema: 'ApiAiTaskContextBundleRequest',
    responseSchema: 'ApiAiTaskContextBundle',
    usesActiveEditorFallback: true,
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
    name: 'cross-project-symbol-conflicts',
    description: 'Analiza conflictos read-only entre símbolos homónimos preferidos en distintos proyectos o librerías del workspace.',
    command: 'powerbuilder.crossProjectSymbolConflicts',
    requestSchema: 'ApiCrossProjectSymbolConflictsRequest',
    responseSchema: 'ApiCrossProjectSymbolConflicts',
    usesActiveEditorFallback: false,
  },
  {
    name: 'workspace-migration-assistant',
    description: 'Resume un plan read-only de migración para layouts legacy hacia una topología PowerBuilder soportada.',
    command: 'powerbuilder.workspaceMigrationAssistant',
    requestSchema: 'ApiWorkspaceMigrationAssistantRequest',
    responseSchema: 'ApiWorkspaceMigrationAssistant',
    usesActiveEditorFallback: false,
  },
  {
    name: 'build-profile-matrix',
    description: 'Resume perfiles de build PBAutoBuild y valida entorno/inventario de forma read-only.',
    command: 'powerbuilder.buildProfileMatrix',
    requestSchema: 'ApiBuildProfileMatrixRequest',
    responseSchema: 'ApiBuildProfileMatrix',
    usesActiveEditorFallback: false,
  },
  {
    name: 'dependency-graph',
    description: 'Devuelve el grafo inmediato de dependencias PowerBuilder para el objeto o archivo activo.',
    command: 'powerbuilder.dependencyGraph',
    requestSchema: 'ApiPowerBuilderDependencyGraphRequest',
    responseSchema: 'ApiPowerBuilderDependencyGraph',
    usesActiveEditorFallback: true,
  },
  {
    name: 'code-metrics',
    description: 'Resume métricas avanzadas de código PowerBuilder sobre la base semántica real ya indexada.',
    command: 'powerbuilder.codeMetrics',
    requestSchema: 'ApiPowerBuilderCodeMetricsRequest',
    responseSchema: 'ApiPowerBuilderCodeMetrics',
    usesActiveEditorFallback: false,
  },
  {
    name: 'technical-debt-report',
    description: 'Consolida un informe read-only de deuda técnica y modernización priorizable sobre señales ya publicadas del runtime.',
    command: 'powerbuilder.technicalDebtReport',
    requestSchema: 'ApiPowerBuilderTechnicalDebtReportRequest',
    responseSchema: 'ApiPowerBuilderTechnicalDebtReport',
    usesActiveEditorFallback: false,
  },
  {
    name: 'datawindow-sql-lineage',
    description: 'Devuelve el lineage SQL read-only de un DataWindow raíz, incluyendo reports y dropdown children resolubles.',
    command: 'powerbuilder.dataWindowSqlLineage',
    requestSchema: 'ApiDataWindowSqlLineageRequest',
    responseSchema: 'ApiDataWindowSqlLineage',
    usesActiveEditorFallback: true,
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
    name: 'semantic-snapshot-diff',
    description: 'Compara dos snapshots semánticos exportados y resume cambios de impacto read-only.',
    requestSchema: 'ApiSemanticWorkspaceSnapshotDiffRequest',
    responseSchema: 'ApiSemanticWorkspaceSnapshotDiff',
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

export type ApiObservabilityDomain =
  | 'readiness'
  | 'indexing'
  | 'cache'
  | 'memory'
  | 'latency'
  | 'interactive-serving'
  | 'build'
  | 'orca'
  | 'diagnostics'
  | 'query-trace'
  | 'support-bundle'
  | 'health';

export type ApiObservabilityExposure = 'public-api-method' | 'read-only-tool' | 'offline-export';
export type ApiObservabilityRedaction = 'none' | 'sanitized' | 'summary-only';

export interface ApiObservabilitySurfaceDescriptor {
  domain: ApiObservabilityDomain;
  schema: string;
  exposure: ApiObservabilityExposure;
  method?: string;
  tool?: ApiReadOnlyToolName;
  command?: string;
  fieldPath?: string;
  redaction: ApiObservabilityRedaction;
}

export interface ApiObservabilityContractDescriptor {
  schemaVersion: '1.0.0';
  apiVersion: string;
  privacy: {
    externalTelemetry: false;
    localOnly: true;
    offlineExportRequiresExplicitUserAction: true;
  };
  surfaces: ApiObservabilitySurfaceDescriptor[];
}

export interface ApiPublicContractDescriptor {
  extensionId: string;
  apiVersion: string;
  apiVersionMajor: number;
  exportedFrom: 'activate';
  methods: ApiPublicContractMethod[];
  schemas: ApiPublicContractSchema[];
  observability: ApiObservabilityContractDescriptor;
  taskExecutionCatalog: ApiTaskExecutionContractCatalog;
  capabilities: {
    readOnlyMethods: string[];
    writeEnabledMethods: string[];
    readOnlyTools: ApiReadOnlyToolName[];
  };
}

export type ApiTaskExecutionContractId = 'spec-driven-pbl-update' | 'spec-driven-pbl-update-batch';
export type ApiTaskExecutionDryRunStrategy = 'single-read-only-companion' | 'repeat-read-only-companion-per-item';

export interface ApiTaskExecutionContractMaxContext {
  scope: 'single-document' | 'explicit-batch';
  selection: 'explicit-uri' | 'explicit-request-items';
  allowsImplicitWorkspaceSelection: false;
}

export interface ApiTaskExecutionContractDryRun {
  strategy: ApiTaskExecutionDryRunStrategy;
  method: 'generateSafeEditPlan';
  requestSchema: 'ApiSafeEditPlanRequest';
  responseSchema: 'ApiSafeEditPlan';
  description: string;
}

export interface ApiTaskExecutionContract {
  id: ApiTaskExecutionContractId;
  stability: ApiPublicContractStability;
  method: 'applySpecDrivenPblUpdate' | 'applySpecDrivenPblUpdateBatch';
  command: 'powerbuilder.applySpecDrivenPblUpdate' | 'powerbuilder.applySpecDrivenPblUpdateBatch';
  requestSchema: 'ApiSpecDrivenPblUpdateRequest' | 'ApiSpecDrivenPblUpdateBatchRequest';
  responseSchema: 'ApiSpecDrivenPblUpdateResult' | 'ApiSpecDrivenPblUpdateBatchResult';
  maxContext: ApiTaskExecutionContractMaxContext;
  validationRequired: string[];
  docsAffected: string[];
  writeEnabledLimits: string[];
  receipts: string[];
  handoff: string[];
  dryRun: ApiTaskExecutionContractDryRun;
}

export interface ApiTaskExecutionContractCatalog {
  schemaVersion: '1.0.0';
  apiVersion: string;
  contracts: ApiTaskExecutionContract[];
}

export interface ApiTaskExecutionDryRunSimulationStep {
  method: 'generateSafeEditPlan';
  requestSchema: 'ApiSafeEditPlanRequest';
  responseSchema: 'ApiSafeEditPlan';
  simulatedCalls: number;
  description: string;
}

export interface ApiTaskExecutionDryRunSimulation {
  contractId: ApiTaskExecutionContractId;
  strategy: ApiTaskExecutionDryRunStrategy;
  steps: ApiTaskExecutionDryRunSimulationStep[];
}

export interface ApiTaskExecutionMetadata {
  validationCommands?: string[];
  docsTouched?: string[];
  specsAffected?: string[];
  nextFocus?: string;
}

export interface ApiTaskExecutionDryRunItemRequest extends ApiTaskExecutionMetadata {
  uri?: string;
  label?: string;
  line?: number;
  character?: number;
  maxSafeReferences?: number;
}

export interface ApiTaskExecutionDryRunRequest extends ApiTaskExecutionMetadata {
  contractId: ApiTaskExecutionContractId;
  uri?: string;
  line?: number;
  character?: number;
  maxSafeReferences?: number;
  requests?: ApiTaskExecutionDryRunItemRequest[];
}

export interface ApiTaskExecutionDryRunReportItem {
  label?: string;
  uri?: string;
  available: boolean;
  blocked: boolean;
  reason?: string;
  safeEditPlan?: ApiSafeEditPlan;
  impactAnalysis?: ApiImpactAnalysis;
  files: ApiSafeEditPlanFile[];
  risks: string[];
  recommendedTests: string[];
  docsToReview: string[];
  blockedReasons: string[];
}

export interface ApiTaskExecutionDryRunReport {
  schemaVersion: '1.0.0';
  contractId: ApiTaskExecutionContractId;
  available: boolean;
  blocked: boolean;
  reason?: string;
  contract: ApiTaskExecutionContract;
  simulation: ApiTaskExecutionDryRunSimulation;
  validationCommands: string[];
  docsTouched: string[];
  docsPending: string[];
  specsAffected: string[];
  nextFocus?: string;
  items: ApiTaskExecutionDryRunReportItem[];
  summary: {
    total: number;
    blockedCount: number;
    files: ApiSafeEditPlanFile[];
    risks: string[];
    recommendedTests: string[];
    docsToReview: string[];
  };
}

export interface ApiTaskExecutionValidationReceiptArtifact {
  name: string;
  status: 'present' | 'missing' | 'not-applicable';
  uri?: string;
  detail?: string;
}

export interface ApiTaskExecutionValidationReceipt {
  schemaVersion: '1.0.0';
  contractId: ApiTaskExecutionContractId;
  method: ApiTaskExecutionContract['method'];
  command: ApiTaskExecutionContract['command'];
  status: 'completed' | 'blocked';
  commands: string[];
  results: string[];
  docsAffected: string[];
  docsTouched: string[];
  docsPending: string[];
  specsAffected: string[];
  risks: string[];
  nextFocus?: string;
  artifacts: ApiTaskExecutionValidationReceiptArtifact[];
}

export type ApiTaskReplayBundleKind = 'auto' | 'semantic-repro-pack' | 'support-bundle';

export interface ApiTaskReplayBundleRequest {
  bundleKind?: ApiTaskReplayBundleKind;
  sourceUri?: string;
  manifest?: unknown;
  manifestJson?: string;
  files?: Record<string, string>;
}

export interface ApiTaskReplaySuggestedCommand {
  title: string;
  detail: string;
  commandId?: string;
  targetRelativePath?: string;
}

export interface ApiTaskReplayBundleReport {
  schemaVersion: '1.0.0';
  available: boolean;
  reason?: string;
  bundleKind?: Exclude<ApiTaskReplayBundleKind, 'auto'>;
  sourceUri?: string;
  focus: {
    uri?: string;
    workspaceRelativePath?: string;
    objectName?: string;
    symbolName?: string;
    sourceOrigin?: string;
  };
  minimalContext: string[];
  referencedFiles: string[];
  suggestedCommands: ApiTaskReplaySuggestedCommand[];
  recommendedContractId?: ApiTaskExecutionContractId;
}

const TASK_EXECUTION_CONTRACTS: ReadonlyArray<ApiTaskExecutionContract> = [
  {
    id: 'spec-driven-pbl-update',
    stability: 'stable',
    method: 'applySpecDrivenPblUpdate',
    command: 'powerbuilder.applySpecDrivenPblUpdate',
    requestSchema: 'ApiSpecDrivenPblUpdateRequest',
    responseSchema: 'ApiSpecDrivenPblUpdateResult',
    maxContext: {
      scope: 'single-document',
      selection: 'explicit-uri',
      allowsImplicitWorkspaceSelection: false,
    },
    validationRequired: [
      'safe-edit-plan',
      'fresh-orca-export',
      'orca-import-compile',
    ],
    docsAffected: [
      'docs/spec-driven-development.md',
      'docs/ai-orchestrator.md',
      'docs/ai-agents-catalog.md',
    ],
    writeEnabledLimits: [
      'explicit-edits-only',
      'single-session-library-per-request',
      'no-implicit-workspace-scan',
    ],
    receipts: [
      'journalUri',
      'importResult.ledgerUri',
      'importResult.compileResult',
    ],
    handoff: [
      'docs/spec-driven-development.md',
      'docs/ai-orchestrator.md',
      'docs/ai-agents-catalog.md',
    ],
    dryRun: {
      strategy: 'single-read-only-companion',
      method: 'generateSafeEditPlan',
      requestSchema: 'ApiSafeEditPlanRequest',
      responseSchema: 'ApiSafeEditPlan',
      description: 'Ejecutar generateSafeEditPlan sobre la misma URI foco antes de invocar applySpecDrivenPblUpdate.',
    },
  },
  {
    id: 'spec-driven-pbl-update-batch',
    stability: 'stable',
    method: 'applySpecDrivenPblUpdateBatch',
    command: 'powerbuilder.applySpecDrivenPblUpdateBatch',
    requestSchema: 'ApiSpecDrivenPblUpdateBatchRequest',
    responseSchema: 'ApiSpecDrivenPblUpdateBatchResult',
    maxContext: {
      scope: 'explicit-batch',
      selection: 'explicit-request-items',
      allowsImplicitWorkspaceSelection: false,
    },
    validationRequired: [
      'safe-edit-plan',
      'per-item-dry-run',
      'stop-on-error-policy',
      'journal-review',
    ],
    docsAffected: [
      'docs/spec-driven-development.md',
      'docs/ai-orchestrator.md',
      'docs/ai-agents-catalog.md',
    ],
    writeEnabledLimits: [
      'explicit-request-list-only',
      'per-item-document-load',
      'batch-stops-on-block-by-default',
    ],
    receipts: [
      'journalUri',
      'items[].reason',
      'items[].result.importResult.ledgerUri',
    ],
    handoff: [
      'docs/spec-driven-development.md',
      'docs/ai-orchestrator.md',
      'docs/ai-agents-catalog.md',
    ],
    dryRun: {
      strategy: 'repeat-read-only-companion-per-item',
      method: 'generateSafeEditPlan',
      requestSchema: 'ApiSafeEditPlanRequest',
      responseSchema: 'ApiSafeEditPlan',
      description: 'Repetir generateSafeEditPlan en modo per-item por cada request explícita del batch antes de invocar applySpecDrivenPblUpdateBatch.',
    },
  },
];

const OBSERVABILITY_SURFACES: ReadonlyArray<ApiObservabilitySurfaceDescriptor> = [
  {
    domain: 'readiness',
    schema: 'ApiServerStats',
    exposure: 'public-api-method',
    method: 'getServerStats',
    tool: 'server-stats',
    command: 'powerbuilder.showStats',
    fieldPath: 'readiness',
    redaction: 'none',
  },
  {
    domain: 'indexing',
    schema: 'ApiServerStats',
    exposure: 'public-api-method',
    method: 'getServerStats',
    tool: 'server-stats',
    command: 'powerbuilder.showStats',
    fieldPath: 'indexer',
    redaction: 'none',
  },
  {
    domain: 'cache',
    schema: 'ApiServerStats',
    exposure: 'public-api-method',
    method: 'getServerStats',
    tool: 'server-stats',
    command: 'powerbuilder.showStats',
    fieldPath: 'caches',
    redaction: 'none',
  },
  {
    domain: 'memory',
    schema: 'ApiServerStats',
    exposure: 'public-api-method',
    method: 'getServerStats',
    tool: 'server-stats',
    command: 'powerbuilder.showStats',
    fieldPath: 'memory',
    redaction: 'none',
  },
  {
    domain: 'latency',
    schema: 'ApiServerStats',
    exposure: 'public-api-method',
    method: 'getServerStats',
    tool: 'server-stats',
    command: 'powerbuilder.showStats',
    fieldPath: 'scheduler',
    redaction: 'none',
  },
  {
    domain: 'interactive-serving',
    schema: 'ApiServerStats',
    exposure: 'public-api-method',
    method: 'getServerStats',
    tool: 'server-stats',
    command: 'powerbuilder.showStats',
    fieldPath: 'interactiveServing',
    redaction: 'none',
  },
  {
    domain: 'build',
    schema: 'ApiServerStats',
    exposure: 'public-api-method',
    method: 'getServerStats',
    tool: 'server-stats',
    command: 'powerbuilder.showStats',
    fieldPath: 'buildTooling',
    redaction: 'none',
  },
  {
    domain: 'orca',
    schema: 'ApiServerStats',
    exposure: 'public-api-method',
    method: 'getServerStats',
    tool: 'server-stats',
    command: 'powerbuilder.showStats',
    fieldPath: 'orcaTooling',
    redaction: 'none',
  },
  {
    domain: 'diagnostics',
    schema: 'ApiServerStats',
    exposure: 'public-api-method',
    method: 'getServerStats',
    tool: 'server-stats',
    command: 'powerbuilder.showStats',
    fieldPath: 'diagnostics',
    redaction: 'none',
  },
  {
    domain: 'query-trace',
    schema: 'ApiServerStats',
    exposure: 'read-only-tool',
    method: 'getServerStats',
    tool: 'server-stats',
    command: 'powerbuilder.showStats',
    fieldPath: 'lastQueryTrace',
    redaction: 'none',
  },
  {
    domain: 'support-bundle',
    schema: 'SupportBundleManifest',
    exposure: 'offline-export',
    command: 'powerbuilder.exportSupportBundle',
    redaction: 'sanitized',
  },
  {
    domain: 'health',
    schema: 'ApiRuntimeHealthReport',
    exposure: 'public-api-method',
    method: 'getServerStats',
    tool: 'server-stats',
    command: 'powerbuilder.showStats',
    fieldPath: 'health',
    redaction: 'none',
  },
];

function cloneTaskExecutionContract(contract: ApiTaskExecutionContract): ApiTaskExecutionContract {
  return {
    ...contract,
    maxContext: { ...contract.maxContext },
    validationRequired: [...contract.validationRequired],
    docsAffected: [...contract.docsAffected],
    writeEnabledLimits: [...contract.writeEnabledLimits],
    receipts: [...contract.receipts],
    handoff: [...contract.handoff],
    dryRun: { ...contract.dryRun },
  };
}

export function getTaskExecutionContractCatalog(): ApiTaskExecutionContractCatalog {
  return {
    schemaVersion: '1.0.0',
    apiVersion: PUBLIC_API_VERSION,
    contracts: TASK_EXECUTION_CONTRACTS.map(cloneTaskExecutionContract),
  };
}

export function getObservabilityContractDescriptor(): ApiObservabilityContractDescriptor {
  return {
    schemaVersion: '1.0.0',
    apiVersion: PUBLIC_API_VERSION,
    privacy: {
      externalTelemetry: false,
      localOnly: true,
      offlineExportRequiresExplicitUserAction: true,
    },
    surfaces: OBSERVABILITY_SURFACES.map((surface) => ({ ...surface })),
  };
}

export function simulateTaskExecutionDryRun(
  contractId: ApiTaskExecutionContractId,
  options: { requestCount?: number } = {},
): ApiTaskExecutionDryRunSimulation {
  const contract = TASK_EXECUTION_CONTRACTS.find((candidate) => candidate.id === contractId);
  if (!contract) {
    throw new Error(`Contrato de tarea desconocido: ${contractId}`);
  }

  const rawRequestCount = typeof options.requestCount === 'number' && Number.isFinite(options.requestCount)
    ? Math.max(1, Math.trunc(options.requestCount))
    : 1;
  const simulatedCalls = contract.dryRun.strategy === 'repeat-read-only-companion-per-item'
    ? rawRequestCount
    : 1;

  return {
    contractId,
    strategy: contract.dryRun.strategy,
    steps: [
      {
        method: contract.dryRun.method,
        requestSchema: contract.dryRun.requestSchema,
        responseSchema: contract.dryRun.responseSchema,
        simulatedCalls,
        description: contract.dryRun.description,
      },
    ],
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
    name: 'diffSemanticWorkspaceSnapshots',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiSemanticWorkspaceSnapshotDiffRequest',
    responseSchema: 'ApiSemanticWorkspaceSnapshotDiff',
  },
  {
    name: 'getServerStats',
    command: 'powerbuilder.showStats',
    access: 'read-only',
    stability: 'stable',
    responseSchema: 'ApiServerStats',
  },
  {
    name: 'checkWorkspace',
    command: 'powerbuilder.checkWorkspace',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiWorkspaceCheckRequest',
    responseSchema: 'ApiWorkspaceCheckReport',
  },
  {
    name: 'checkObject',
    command: 'powerbuilder.checkCurrentObject',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiObjectCheckRequest',
    responseSchema: 'ApiObjectCheckReport',
  },
  {
    name: 'explainDiagnostic',
    command: 'powerbuilder.explainDiagnostic',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiExplainDiagnosticRequest',
    responseSchema: 'ApiExplainDiagnosticReport',
  },
  {
    name: 'explainSystemSymbol',
    command: 'powerbuilder.explainSystemSymbol',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiExplainSystemSymbolRequest',
    responseSchema: 'ApiExplainSystemSymbolReport',
  },
  {
    name: 'explainSemanticQuery',
    command: 'powerbuilder.explainSemanticQuery',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiExplainSemanticQueryRequest',
    responseSchema: 'ApiExplainSemanticQueryReport',
  },
  {
    name: 'getAiTaskContextBundle',
    command: 'powerbuilder.exportAiTaskContextBundle',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiAiTaskContextBundleRequest',
    responseSchema: 'ApiAiTaskContextBundle',
  },
  {
    name: 'getTaskExecutionDryRun',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiTaskExecutionDryRunRequest',
    responseSchema: 'ApiTaskExecutionDryRunReport',
  },
  {
    name: 'replayTaskFromBundle',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiTaskReplayBundleRequest',
    responseSchema: 'ApiTaskReplayBundleReport',
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
    name: 'getCrossProjectSymbolConflicts',
    command: 'powerbuilder.crossProjectSymbolConflicts',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiCrossProjectSymbolConflictsRequest',
    responseSchema: 'ApiCrossProjectSymbolConflicts',
  },
  {
    name: 'getWorkspaceMigrationAssistant',
    command: 'powerbuilder.workspaceMigrationAssistant',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiWorkspaceMigrationAssistantRequest',
    responseSchema: 'ApiWorkspaceMigrationAssistant',
  },
  {
    name: 'getBuildProfileMatrix',
    command: 'powerbuilder.buildProfileMatrix',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiBuildProfileMatrixRequest',
    responseSchema: 'ApiBuildProfileMatrix',
  },
  {
    name: 'getPowerBuilderDependencyGraph',
    command: 'powerbuilder.dependencyGraph',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiPowerBuilderDependencyGraphRequest',
    responseSchema: 'ApiPowerBuilderDependencyGraph',
  },
  {
    name: 'getPowerBuilderCodeMetrics',
    command: 'powerbuilder.codeMetrics',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiPowerBuilderCodeMetricsRequest',
    responseSchema: 'ApiPowerBuilderCodeMetrics',
  },
  {
    name: 'getPowerBuilderTechnicalDebtReport',
    command: 'powerbuilder.technicalDebtReport',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiPowerBuilderTechnicalDebtReportRequest',
    responseSchema: 'ApiPowerBuilderTechnicalDebtReport',
  },
  {
    name: 'getDataWindowSqlLineage',
    command: 'powerbuilder.dataWindowSqlLineage',
    access: 'read-only',
    stability: 'stable',
    requestSchema: 'ApiDataWindowSqlLineageRequest',
    responseSchema: 'ApiDataWindowSqlLineage',
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
  { name: 'ApiPublicContractDescriptor', version: PUBLIC_API_VERSION, kind: 'descriptor' },
  { name: 'ApiTaskExecutionContractCatalog', version: '1.0.0', kind: 'descriptor' },
  { name: 'ApiObservabilityContractDescriptor', version: '1.0.0', kind: 'descriptor' },
  { name: 'ApiReadOnlyToolBridgeDescriptor', version: '1.0.0', kind: 'descriptor' },
  { name: 'ApiReadOnlyToolCallRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiReadOnlyToolCallResult', version: '1.0.0', kind: 'response' },
  { name: 'ApiSemanticWorkspaceSnapshot', version: '1.0.0', kind: 'response' },
  { name: 'ApiSemanticWorkspaceSnapshotExportRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiSemanticWorkspaceSnapshotExportResult', version: '1.0.0', kind: 'response' },
  { name: 'ApiSemanticWorkspaceSnapshotImportRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiSemanticWorkspaceSnapshotImportResult', version: '1.0.0', kind: 'response' },
  { name: 'ApiSemanticWorkspaceSnapshotDiffRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiSemanticWorkspaceSnapshotDiff', version: '1.0.0', kind: 'response' },
  { name: 'ApiWorkspaceCheckRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiWorkspaceCheckFinding', version: '1.0.0', kind: 'response' },
  { name: 'ApiWorkspaceCheckCatalogSummary', version: '1.0.0', kind: 'response' },
  { name: 'ApiWorkspaceCheckSummary', version: '1.0.0', kind: 'response' },
  { name: 'ApiWorkspaceCheckReport', version: '1.0.0', kind: 'response' },
  { name: 'ApiObjectCheckRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiObjectCheckFinding', version: '1.0.0', kind: 'response' },
  { name: 'ApiObjectCheckSummary', version: '1.0.0', kind: 'response' },
  { name: 'ApiObjectCheckReport', version: '1.0.0', kind: 'response' },
  { name: 'ApiExplainDiagnosticRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiExplainDiagnosticReport', version: '1.0.0', kind: 'response' },
  { name: 'ApiExplainSystemSymbolRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiExplainSystemSymbolReport', version: '1.0.0', kind: 'response' },
  { name: 'ApiExplainSemanticQueryRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiExplainSemanticQueryReport', version: '1.0.0', kind: 'response' },
  { name: 'ApiAiTaskContextBundleRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiAiTaskContextBundle', version: '1.0.0', kind: 'response' },
  { name: 'ApiTaskExecutionDryRunRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiTaskExecutionDryRunReport', version: '1.0.0', kind: 'response' },
  { name: 'ApiTaskExecutionValidationReceipt', version: '1.0.0', kind: 'response' },
  { name: 'ApiTaskReplayBundleRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiTaskReplayBundleReport', version: '1.0.0', kind: 'response' },
  { name: 'ApiQuerySymbolsRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiCrossProjectSymbolConflictsRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiCrossProjectSymbolConflicts', version: '1.0.0', kind: 'response' },
  { name: 'ApiWorkspaceMigrationAssistantRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiWorkspaceMigrationAssistant', version: '1.0.0', kind: 'response' },
  { name: 'ApiBuildProfileMatrixRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiBuildProfileMatrix', version: '1.0.0', kind: 'response' },
  { name: 'ApiPowerBuilderDependencyGraphRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiPowerBuilderDependencyGraph', version: '1.0.0', kind: 'response' },
  { name: 'ApiPowerBuilderCodeMetricsRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiPowerBuilderCodeMetrics', version: '1.0.0', kind: 'response' },
  { name: 'ApiPowerBuilderTechnicalDebtReportRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiPowerBuilderTechnicalDebtReport', version: '1.0.0', kind: 'response' },
  { name: 'ApiDataWindowSqlLineageRequest', version: '1.0.0', kind: 'request' },
  { name: 'ApiDataWindowSqlLineage', version: '1.0.0', kind: 'response' },
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
    observability: getObservabilityContractDescriptor(),
    taskExecutionCatalog: getTaskExecutionContractCatalog(),
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

export interface ApiFrameworkKnowledgePackReference {
  id: string;
  version: string;
  title: string;
  ownerTypes: string[];
  source: string;
  sourceUrl?: string;
}

export interface ApiFrameworkKnowledgeConflict {
  state: 'workspace-wins' | 'pack-advisory';
  reasonCode: 'workspace-source-overrides-framework-pack' | 'framework-pack-advisory';
  summary: string;
  matchedOwnerTypes: string[];
  packs: ApiFrameworkKnowledgePackReference[];
  sourceOrigin?: import('./sourceOrigin').SourceOrigin;
  confidence?: 'high' | 'medium' | 'low' | 'unknown';
}

export interface ApiSymbol {
  name: string;
  kind: string;
  uri: string;
  line: number;
  character: number;
  identityKey?: string;
  lineage?: ApiSymbolLineage;
  frameworkKnowledgeConflict?: ApiFrameworkKnowledgeConflict;
}

export interface ApiSymbolInput {
  name: string;
  kind: string;
  uri: string;
  line: number;
  character: number;
  identityKey?: string;
  lineage?: ApiSymbolLineage;
  frameworkKnowledgeConflict?: ApiFrameworkKnowledgeConflict;
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

function cloneApiFrameworkKnowledgeConflict(
  conflict?: ApiFrameworkKnowledgeConflict,
): ApiFrameworkKnowledgeConflict | undefined {
  if (!conflict) {
    return undefined;
  }

  return {
    state: conflict.state,
    reasonCode: conflict.reasonCode,
    summary: conflict.summary,
    matchedOwnerTypes: [...conflict.matchedOwnerTypes],
    packs: conflict.packs.map((pack) => ({
      id: pack.id,
      version: pack.version,
      title: pack.title,
      ownerTypes: [...pack.ownerTypes],
      source: pack.source,
      ...(pack.sourceUrl ? { sourceUrl: pack.sourceUrl } : {}),
    })),
    ...(conflict.sourceOrigin ? { sourceOrigin: conflict.sourceOrigin } : {}),
    ...(conflict.confidence ? { confidence: conflict.confidence } : {}),
  };
}

export function toApiSymbol(symbol: ApiSymbolInput): ApiSymbol {
  return {
    name: symbol.name,
    kind: symbol.kind,
    uri: symbol.uri,
    line: symbol.line,
    character: symbol.character,
    ...(symbol.identityKey ? { identityKey: symbol.identityKey } : {}),
    ...(cloneApiSymbolLineage(symbol.lineage) ? { lineage: cloneApiSymbolLineage(symbol.lineage) } : {}),
    ...(cloneApiFrameworkKnowledgeConflict(symbol.frameworkKnowledgeConflict)
      ? { frameworkKnowledgeConflict: cloneApiFrameworkKnowledgeConflict(symbol.frameworkKnowledgeConflict) }
      : {}),
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

export interface ApiEmbeddedSqlAnchor {
  startLine: number;
  endLine: number;
  keyword:
    | 'SELECT'
    | 'UPDATE'
    | 'INSERT'
    | 'DELETE'
    | 'EXECUTE'
    | 'CONNECT'
    | 'DECLARE'
    | 'FETCH'
    | 'OPEN'
    | 'CLOSE'
    | 'PREPARE'
    | 'COMMIT'
    | 'ROLLBACK';
  preview: string;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  transactionTarget?: string;
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
  confidence?: 'high' | 'medium' | 'low' | 'unknown';
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
  embeddedSqlAnchors?: ApiEmbeddedSqlAnchor[];
  evidence?: {
    readiness?: string;
    identifier?: string;
    qualifier?: string;
    resolutionConfidence?: 'high' | 'medium' | 'low' | 'unknown';
    primaryReasonCode?: string;
    invocationKind?: string;
    invocationRisk?: string;
    targetCount?: number;
    evidenceKinds: string[];
  };
  frameworkKnowledgeConflict?: ApiFrameworkKnowledgeConflict;
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
  confidence?: 'high' | 'medium' | 'low' | 'unknown';
  primaryReasonCode?: string;
  evidenceKinds?: string[];
  invocationKind?: string;
  invocationRisk?: ApiInvocationRisk;
  riskReasons?: string[];
  dynamicStringReferenceCount?: number;
  safeReferences: ApiImpactLocation[];
  probableImpactFiles: ApiCurrentObjectRelatedFile[];
  descendants: ApiCurrentObjectAncestor[];
  overrides: ApiCurrentObjectContextSymbol[];
  relatedEvents: ApiCurrentObjectContextSymbol[];
  relatedDataWindows: ApiCurrentObjectDataWindowBinding[];
  affectedSymbols: ApiCurrentObjectContextSymbol[];
  buildTargets: ApiImpactBuildTarget[];
  frameworkKnowledgeConflict?: ApiFrameworkKnowledgeConflict;
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
  confidence?: 'high' | 'medium' | 'low' | 'unknown';
  invocationRisk?: ApiInvocationRisk;
  riskReasons?: string[];
  targetSymbol?: ApiCurrentObjectContextSymbol;
  objects: ApiCurrentObjectContextSymbol[];
  files: ApiSafeEditPlanFile[];
  risks: string[];
  recommendedTests: string[];
  docsToReview: string[];
  blockedReasons: string[];
  frameworkKnowledgeConflict?: ApiFrameworkKnowledgeConflict;
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

export interface ApiSpecDrivenPblUpdateRequest extends ApiSafeEditPlanRequest, ApiTaskExecutionMetadata {
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
  validationReceipt?: ApiTaskExecutionValidationReceipt;
}

export interface ApiSpecDrivenPblUpdateBatchRequestItem extends ApiSpecDrivenPblUpdateRequest {
  label?: string;
}

export interface ApiSpecDrivenPblUpdateBatchRequest extends ApiTaskExecutionMetadata {
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
  validationReceipt?: ApiTaskExecutionValidationReceipt;
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
  identityKey?: string;
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

export interface ApiPowerBuilderCodeMetricsRequest {
  maxObjects?: number;
}

export interface ApiPowerBuilderCodeMetricsObjectMetrics {
  functions: number;
  events: number;
  approximateComplexity: number;
  embeddedSqlStatements: number;
  linkedDataWindows: number;
  externalDependencies: number;
  webBrowserUsages?: number;
  httpIntegrationUsages?: number;
  jsonIntegrationUsages?: number;
  lifecycleWarnings: number;
  diagnostics: number;
  dataObjectBindingDiagnostics?: number;
  transactionBindingDiagnostics?: number;
  retrieveArityDiagnostics?: number;
}

export interface ApiPowerBuilderCodeMetricsObject {
  name: string;
  uri: string;
  projectUri?: string;
  library?: string;
  objectKind?: ApiSemanticWorkspaceManifestObject['objectKind'];
  readiness?: string;
  sourceOrigin?: import('./sourceOrigin').SourceOrigin;
  metrics: ApiPowerBuilderCodeMetricsObjectMetrics;
  embeddedSqlAnchors?: ApiEmbeddedSqlAnchor[];
}

export interface ApiPowerBuilderCodeMetricsSummary {
  totalProjects: number;
  totalLibraries: number;
  totalObjects: number;
  totalFunctions: number;
  totalEvents: number;
  totalEmbeddedSqlStatements: number;
  totalLinkedDataWindows: number;
  totalExternalDependencies: number;
  totalWebBrowserUsages?: number;
  totalHttpIntegrationUsages?: number;
  totalJsonIntegrationUsages?: number;
  totalLifecycleWarnings: number;
  totalDiagnostics: number;
  totalDataObjectBindingDiagnostics?: number;
  totalTransactionBindingDiagnostics?: number;
  totalRetrieveArityDiagnostics?: number;
}

export interface ApiPowerBuilderCodeMetricsDiagnosticArea {
  area: 'lifecycle' | 'datawindow' | 'external' | 'unused' | 'shadowing' | 'obsolete' | 'resolution' | 'control-flow' | 'general';
  total: number;
}

export interface ApiPowerBuilderCodeMetricsDiagnosticsSummary {
  total: number;
  byArea: ApiPowerBuilderCodeMetricsDiagnosticArea[];
}

export interface ApiPowerBuilderCodeMetricsFootprint {
  build: {
    total: number;
    usable: number;
    invalid: number;
    ambiguous: number;
  };
  orca: {
    stagedFiles: number;
    libraryAliases: number;
  };
}

export interface ApiPowerBuilderCodeMetrics {
  schemaVersion: string;
  generatedAt: number;
  summary: ApiPowerBuilderCodeMetricsSummary;
  diagnostics: ApiPowerBuilderCodeMetricsDiagnosticsSummary;
  footprint: ApiPowerBuilderCodeMetricsFootprint;
  objects: ApiPowerBuilderCodeMetricsObject[];
}

export interface ApiPowerBuilderTechnicalDebtReportRequest {
  maxObjects?: number;
  maxHotspots?: number;
  maxRecommendations?: number;
}

export type ApiPowerBuilderTechnicalDebtHotspotCategory =
  | 'obsolete'
  | 'dynamic-sql'
  | 'lifecycle-risk'
  | 'external-dependency'
  | 'modern-integration'
  | 'web-ui-integration'
  | 'datawindow-risk'
  | 'complexity'
  | 'source-origin-risk';

export type ApiPowerBuilderTechnicalDebtPriority = 'high' | 'medium' | 'low';
export type ApiPowerBuilderTechnicalDebtConfidence = 'high' | 'medium';

export interface ApiPowerBuilderTechnicalDebtHotspotMetrics {
  approximateComplexity: number;
  diagnostics: number;
  externalDependencies: number;
  linkedDataWindows: number;
  lifecycleWarnings?: number;
  webBrowserUsages?: number;
  httpIntegrationUsages?: number;
  jsonIntegrationUsages?: number;
  dynamicSqlStatements: number;
  obsoleteDiagnostics: number;
}

export interface ApiPowerBuilderTechnicalDebtHotspot {
  name: string;
  uri: string;
  projectUri?: string;
  library?: string;
  objectKind?: ApiSemanticWorkspaceManifestObject['objectKind'];
  sourceOrigin?: import('./sourceOrigin').SourceOrigin;
  priority: ApiPowerBuilderTechnicalDebtPriority;
  confidence: ApiPowerBuilderTechnicalDebtConfidence;
  categories: ApiPowerBuilderTechnicalDebtHotspotCategory[];
  evidence: string[];
  recommendations: string[];
  metrics: ApiPowerBuilderTechnicalDebtHotspotMetrics;
  embeddedSqlAnchors?: ApiEmbeddedSqlAnchor[];
}

export type ApiPowerBuilderTechnicalDebtRecommendationCategory =
  | 'modernization'
  | 'datawindow'
  | 'source-origin'
  | 'legacy-layout'
  | 'orca-pbl'
  | 'build';

export interface ApiPowerBuilderTechnicalDebtRecommendation {
  id: string;
  category: ApiPowerBuilderTechnicalDebtRecommendationCategory;
  priority: ApiPowerBuilderTechnicalDebtPriority;
  confidence: ApiPowerBuilderTechnicalDebtConfidence;
  title: string;
  detail: string;
  evidence: string[];
  actions: string[];
}

export interface ApiPowerBuilderTechnicalDebtReportSummary {
  totalHotspots: number;
  totalRecommendations: number;
  obsoleteFindings: number;
  dynamicSqlFindings: number;
  lifecycleRiskFindings?: number;
  externalDependencyFindings: number;
  modernIntegrationFindings?: number;
  webUiIntegrationFindings?: number;
  dataWindowRiskFindings: number;
  complexObjectFindings: number;
  sourceOriginRiskFindings: number;
  legacyWorkspaceRiskFindings: number;
}

export interface ApiPowerBuilderTechnicalDebtReport {
  schemaVersion: string;
  generatedAt: number;
  summary: ApiPowerBuilderTechnicalDebtReportSummary;
  hotspots: ApiPowerBuilderTechnicalDebtHotspot[];
  recommendations: ApiPowerBuilderTechnicalDebtRecommendation[];
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

export interface ApiPbAutoBuildCapabilitySnapshot {
  status: 'available' | 'missing' | 'invalid';
  source: 'config' | 'env' | 'default' | 'unresolved';
  executablePath?: string;
  versionLabel?: string;
  capabilities: string[];
  detail: string;
}

export interface ApiOrcaCapabilitySnapshot {
  status: 'available' | 'missing' | 'invalid';
  source: 'config' | 'env' | 'unresolved';
  executablePath?: string;
  capabilities: string[];
  detail: string;
  packagingPolicy: {
    exposure: 'not-exposed';
    requiresFeatureFlag: true;
    supportedArtifacts: Array<'exe' | 'pbd' | 'dll'>;
    detail: string;
  };
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
    pendingWorkloads?: Record<string, number>;
    activeInteractiveWorkloads?: Record<string, number>;
    activeNearWorkload?: string;
    activeBackgroundWorkload?: string;
    throttledBackgroundWorkload?: string;
    throttledBackgroundReason?: string;
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
  buildTooling?: ApiPbAutoBuildCapabilitySnapshot;
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
      byFeature?: Record<string, {
        size?: number;
        capacity?: number;
        hits?: number;
        misses?: number;
        evictions?: number;
      }>;
    };
    documents?: { size?: number; internedStrings?: number };
    hotContext?: { inheritedTypes?: number; capacity?: number };
    codeLens?: { size?: number; capacity?: number; hits?: number; misses?: number; evictions?: number };
  };
  interactiveServing?: {
    features?: Record<string, {
      requests?: number;
      reasons?: Record<string, number>;
      totalMsAvg?: number;
      providerMsAvg?: number;
      formatterMsAvg?: number;
      cacheWriteMsAvg?: number;
      payloadBytesAvg?: number;
      payloadBytesMax?: number;
      lastEvent?: {
        feature?: string;
        reason?: string;
        totalMs?: number;
        providerMs?: number;
        formatterMs?: number;
        cacheWriteMs?: number;
        payloadBytes?: number;
        payloadBudgetBytes?: number;
        payloadBudgetExceeded?: boolean;
        locale?: string;
        kbVersion?: number;
        semanticEpoch?: number;
        budgetMs?: number;
        readinessAction?: string;
        readinessReason?: string;
        staleReason?: string;
        ts?: number;
      };
    }>;
    recentEvents?: Array<{
      feature?: string;
      reason?: string;
      totalMs?: number;
      providerMs?: number;
      formatterMs?: number;
      cacheWriteMs?: number;
      payloadBytes?: number;
      payloadBudgetBytes?: number;
      payloadBudgetExceeded?: boolean;
      locale?: string;
      kbVersion?: number;
      semanticEpoch?: number;
      budgetMs?: number;
      readinessAction?: string;
      readinessReason?: string;
      staleReason?: string;
      ts?: number;
    }>;
  };
  lastQueryTrace?: {
    label?: string;
    confidence?: 'high' | 'medium' | 'low' | 'unknown';
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
    policy?: ApiSemanticCacheRetentionPolicy;
    maintenance?: ApiSemanticCacheMaintenanceSnapshot;
  };
  health?: ApiRuntimeHealthReport;
  runtimeJournal?: ApiRuntimeJournalSnapshot;
}

export interface ApiSemanticCacheRetentionPolicy {
  version: 2;
  staleWorkspaceTtlMs: number;
  maxJournalEntries: number;
  maxJournalBytes: number;
  maxWorkspaceBytes: number;
}

export interface ApiSemanticCacheWorkspaceMaintenanceSnapshot {
  workspaceKey: string;
  totalBytes: number;
  checkpointBytes: number;
  journalBytes: number;
  servingSnapshotBytes: number;
  partitionBytes: number;
  partitionCount: number;
  journalEntries: number;
  lastModifiedAt: number;
}

export interface ApiSemanticCacheMaintenanceSnapshot {
  policy: ApiSemanticCacheRetentionPolicy;
  currentWorkspace: ApiSemanticCacheWorkspaceMaintenanceSnapshot;
  staleWorkspaces: ApiSemanticCacheWorkspaceMaintenanceSnapshot[];
  maintenanceRecommended: boolean;
  needsCompaction: boolean;
}

export interface ApiSemanticCacheMaintenanceResult extends ApiSemanticCacheMaintenanceSnapshot {
  compacted: boolean;
  restoreValidated: boolean;
  prunedWorkspaceKeys: string[];
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
  diffSemanticWorkspaceSnapshots(request: ApiSemanticWorkspaceSnapshotDiffRequest): Promise<ApiSemanticWorkspaceSnapshotDiff>;
  getServerStats(): Promise<ApiServerStats>;
  checkWorkspace(request?: ApiWorkspaceCheckRequest): Promise<ApiWorkspaceCheckReport>;
  checkObject(request?: ApiObjectCheckRequest): Promise<ApiObjectCheckReport>;
  explainDiagnostic(request?: ApiExplainDiagnosticRequest): Promise<ApiExplainDiagnosticReport>;
  explainSystemSymbol(request?: ApiExplainSystemSymbolRequest): Promise<ApiExplainSystemSymbolReport>;
  explainSemanticQuery(request?: ApiExplainSemanticQueryRequest): Promise<ApiExplainSemanticQueryReport>;
  getAiTaskContextBundle(request?: ApiAiTaskContextBundleRequest): Promise<ApiAiTaskContextBundle>;
  getTaskExecutionDryRun(request: ApiTaskExecutionDryRunRequest): Promise<ApiTaskExecutionDryRunReport>;
  replayTaskFromBundle(request: ApiTaskReplayBundleRequest): Promise<ApiTaskReplayBundleReport>;
  querySymbols(request: ApiQuerySymbolsRequest): Promise<ApiSymbol[]>;
  getCrossProjectSymbolConflicts(request?: ApiCrossProjectSymbolConflictsRequest): Promise<ApiCrossProjectSymbolConflicts>;
  getWorkspaceMigrationAssistant(request?: ApiWorkspaceMigrationAssistantRequest): Promise<ApiWorkspaceMigrationAssistant>;
  getBuildProfileMatrix(request?: ApiBuildProfileMatrixRequest): Promise<ApiBuildProfileMatrix>;
  getPowerBuilderDependencyGraph(request?: ApiPowerBuilderDependencyGraphRequest): Promise<ApiPowerBuilderDependencyGraph>;
  getPowerBuilderCodeMetrics(request?: ApiPowerBuilderCodeMetricsRequest): Promise<ApiPowerBuilderCodeMetrics>;
  getPowerBuilderTechnicalDebtReport(request?: ApiPowerBuilderTechnicalDebtReportRequest): Promise<ApiPowerBuilderTechnicalDebtReport>;
  getDataWindowSqlLineage(request?: ApiDataWindowSqlLineageRequest): Promise<ApiDataWindowSqlLineage>;
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

