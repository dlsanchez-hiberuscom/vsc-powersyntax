import type { Diagnostic } from 'vscode-languageserver/node';

import type {
  ApiCurrentObjectContext,
  ApiCrossProjectSymbolConflicts,
  ApiDataWindowSqlLineage,
  ApiPowerBuilderDependencyGraph,
  ApiSemanticWorkspaceManifest,
  ApiSemanticWorkspaceManifestObject,
} from '../../shared/publicApi';
import type { SourceOrigin } from '../../shared/sourceOrigin';
import { compareResolutionConfidence } from './featureReadiness';
import { inferPowerBuilderObjectKindFromUri } from './powerBuilderObjectKind';

export type SemanticConsistencyReasonCode =
  | 'focus-unavailable'
  | 'manifest-object-missing'
  | 'graph-focus-missing'
  | 'object-name-mismatch'
  | 'object-kind-mismatch'
  | 'project-mismatch'
  | 'library-mismatch'
  | 'source-origin-mismatch'
  | 'ancestor-chain-mismatch'
  | 'diagnostic-total-mismatch'
  | 'diagnostic-code-mismatch'
  | 'readiness-mismatch'
  | 'confidence-mismatch'
  | 'datawindow-binding-mismatch'
  | 'cross-project-ambiguity';

export interface SemanticConsistencyFinding {
  code: SemanticConsistencyReasonCode;
  severity: 'error' | 'warning';
  field:
    | 'availability'
    | 'objectName'
    | 'objectKind'
    | 'project'
    | 'library'
    | 'sourceOrigin'
    | 'ancestorChain'
    | 'diagnostics'
    | 'readiness'
    | 'confidence'
    | 'dataWindowBindings'
    | 'workspaceAmbiguity';
  message: string;
  sources: string[];
}

export interface SemanticConsistencyDiagnosticsSnapshot {
  total: number;
  byCode: Record<string, number>;
}

export interface SemanticConsistencyOracleInput {
  currentObjectContext: ApiCurrentObjectContext;
  workspaceManifest?: ApiSemanticWorkspaceManifest;
  dependencyGraph?: ApiPowerBuilderDependencyGraph;
  diagnostics?: SemanticConsistencyDiagnosticsSnapshot;
  dataWindowSqlLineage?: ApiDataWindowSqlLineage;
  crossProjectSymbolConflicts?: ApiCrossProjectSymbolConflicts;
}

export interface SemanticConsistencyOracleReport {
  status: 'healthy' | 'warning' | 'error';
  focus?: {
    uri: string;
    objectName?: string;
    objectKind?: ApiSemanticWorkspaceManifestObject['objectKind'];
    project?: string;
    library?: string;
    sourceOrigin?: SourceOrigin;
  };
  checkedFields: Array<SemanticConsistencyFinding['field']>;
  counts: {
    checkedFieldCount: number;
    errorCount: number;
    warningCount: number;
  };
  findings: SemanticConsistencyFinding[];
}

interface SurfaceValue {
  source: string;
  value?: string | null;
}

function normalize(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

function sameValue(left: string | null | undefined, right: string | null | undefined): boolean {
  return normalize(left) === normalize(right);
}

function sameUri(left: string | null | undefined, right: string | null | undefined): boolean {
  return sameValue(left, right);
}

function addFinding(
  findings: SemanticConsistencyFinding[],
  checkedFields: Array<SemanticConsistencyFinding['field']>,
  finding: SemanticConsistencyFinding,
): void {
  checkedFields.push(finding.field);
  findings.push(finding);
}

function markField(
  checkedFields: Array<SemanticConsistencyFinding['field']>,
  field: SemanticConsistencyFinding['field'],
): void {
  checkedFields.push(field);
}

function buildMismatchMessage(label: string, values: SurfaceValue[]): string {
  const rendered = values
    .filter((entry) => normalize(entry.value) != null)
    .map((entry) => `${entry.source}=${entry.value}`)
    .join(', ');
  return `Se detectó drift de ${label} entre surfaces read-only (${rendered || 'sin valores comparables'}).`;
}

function compareSurfaceValues(
  findings: SemanticConsistencyFinding[],
  checkedFields: Array<SemanticConsistencyFinding['field']>,
  field: SemanticConsistencyFinding['field'],
  code: SemanticConsistencyReasonCode,
  label: string,
  values: SurfaceValue[],
  severity: SemanticConsistencyFinding['severity'] = 'error',
): void {
  markField(checkedFields, field);
  const comparable = values.filter((entry) => normalize(entry.value) != null);
  if (comparable.length < 2) {
    return;
  }

  const distinct = new Map<string, string[]>();
  for (const entry of comparable) {
    const key = normalize(entry.value) ?? '';
    const bucket = distinct.get(key) ?? [];
    bucket.push(entry.source);
    distinct.set(key, bucket);
  }

  if (distinct.size <= 1) {
    return;
  }

  addFinding(findings, checkedFields, {
    code,
    severity,
    field,
    message: buildMismatchMessage(label, comparable),
    sources: comparable.map((entry) => entry.source),
  });
}

function summarizeDiagnosticCodes(diagnostics: readonly Diagnostic[]): Record<string, number> {
  const byCode: Record<string, number> = {};
  for (const diagnostic of diagnostics) {
    if (diagnostic.code == null) {
      continue;
    }
    const normalizedCode = String(diagnostic.code);
    byCode[normalizedCode] = (byCode[normalizedCode] ?? 0) + 1;
  }
  return byCode;
}

export function summarizeDiagnosticsForConsistency(diagnostics: readonly Diagnostic[]): SemanticConsistencyDiagnosticsSnapshot {
  return {
    total: diagnostics.length,
    byCode: summarizeDiagnosticCodes(diagnostics),
  };
}

function findManifestObject(
  manifest: ApiSemanticWorkspaceManifest | undefined,
  focusUri: string | undefined,
  focusName: string | undefined,
): ApiSemanticWorkspaceManifestObject | undefined {
  if (!manifest) {
    return undefined;
  }

  if (focusUri) {
    const byUri = manifest.objects.find((entry) => sameUri(entry.uri, focusUri));
    if (byUri) {
      return byUri;
    }
  }

  if (!focusName) {
    return undefined;
  }

  const byName = manifest.objects.filter((entry) => sameValue(entry.name, focusName));
  return byName.length === 1 ? byName[0] : undefined;
}

function inferGraphObjectKind(graph: ApiPowerBuilderDependencyGraph | undefined): ApiSemanticWorkspaceManifestObject['objectKind'] | undefined {
  if (!graph?.focus?.uri) {
    return undefined;
  }
  return inferPowerBuilderObjectKindFromUri(graph.focus.uri);
}

function compareDiagnostics(
  findings: SemanticConsistencyFinding[],
  checkedFields: Array<SemanticConsistencyFinding['field']>,
  currentObjectContext: ApiCurrentObjectContext,
  diagnostics: SemanticConsistencyDiagnosticsSnapshot | undefined,
): void {
  if (!diagnostics || !currentObjectContext.diagnostics) {
    return;
  }

  compareSurfaceValues(
    findings,
    checkedFields,
    'diagnostics',
    'diagnostic-total-mismatch',
    'diagnostics.total',
    [
      { source: 'currentObjectContext', value: String(currentObjectContext.diagnostics.total) },
      { source: 'diagnostics', value: String(diagnostics.total) },
    ]
  );

  markField(checkedFields, 'diagnostics');
  const currentCodes = currentObjectContext.diagnostics.byCode ?? {};
  const externalCodes = diagnostics.byCode ?? {};
  const keys = [...new Set([...Object.keys(currentCodes), ...Object.keys(externalCodes)])].sort();
  for (const key of keys) {
    if ((currentCodes[key] ?? 0) !== (externalCodes[key] ?? 0)) {
      addFinding(findings, checkedFields, {
        code: 'diagnostic-code-mismatch',
        severity: 'error',
        field: 'diagnostics',
        message: `El código diagnóstico ${key} no coincide entre currentObjectContext (${currentCodes[key] ?? 0}) y diagnostics (${externalCodes[key] ?? 0}).`,
        sources: ['currentObjectContext', 'diagnostics'],
      });
      return;
    }
  }
}

function compareDataWindowBindings(
  findings: SemanticConsistencyFinding[],
  checkedFields: Array<SemanticConsistencyFinding['field']>,
  currentObjectContext: ApiCurrentObjectContext,
  dataWindowSqlLineage: ApiDataWindowSqlLineage | undefined,
): void {
  if (!dataWindowSqlLineage || !(currentObjectContext.dataWindowBindings?.length)) {
    return;
  }

  markField(checkedFields, 'dataWindowBindings');
  const binding = currentObjectContext.dataWindowBindings.find((entry) => {
    if (dataWindowSqlLineage.source.dataObject && sameValue(entry.dataObject, dataWindowSqlLineage.source.dataObject)) {
      return true;
    }
    if (dataWindowSqlLineage.lineage?.uri && sameUri(entry.targetUri, dataWindowSqlLineage.lineage.uri)) {
      return true;
    }
    return false;
  }) ?? currentObjectContext.dataWindowBindings[0];

  if (!binding) {
    return;
  }

  const lineageState = dataWindowSqlLineage.source.state ?? (dataWindowSqlLineage.available ? 'resolved' : undefined);
  const mismatch = !sameValue(binding.dataObject ?? null, dataWindowSqlLineage.source.dataObject ?? dataWindowSqlLineage.lineage?.dataObject ?? null)
    || !sameValue(binding.state, lineageState)
    || !sameUri(binding.targetUri, dataWindowSqlLineage.lineage?.uri);

  if (mismatch) {
    addFinding(findings, checkedFields, {
      code: 'datawindow-binding-mismatch',
      severity: 'error',
      field: 'dataWindowBindings',
      message: `El binding DataWindow '${binding.targetName}' no coincide con la surface de lineage SQL.`,
      sources: ['currentObjectContext', 'dataWindowSqlLineage'],
    });
  }

  const confidence = currentObjectContext.evidence?.resolutionConfidence;
  if (!confidence || !lineageState) {
    return;
  }

  if (lineageState === 'resolved' && compareResolutionConfidence(confidence, 'medium') < 0) {
    addFinding(findings, checkedFields, {
      code: 'confidence-mismatch',
      severity: 'warning',
      field: 'confidence',
      message: `La confidence ${confidence} es demasiado baja para un DataObject resuelto de forma estable (${binding.dataObject ?? 'unknown'}).`,
      sources: ['currentObjectContext', 'dataWindowSqlLineage'],
    });
    return;
  }

  if (lineageState !== 'resolved' && compareResolutionConfidence(confidence, 'high') >= 0) {
    addFinding(findings, checkedFields, {
      code: 'confidence-mismatch',
      severity: 'warning',
      field: 'confidence',
      message: `La confidence ${confidence} es demasiado optimista para un DataObject con estado ${lineageState}.`,
      sources: ['currentObjectContext', 'dataWindowSqlLineage'],
    });
  }
}

function compareCrossProjectAmbiguity(
  findings: SemanticConsistencyFinding[],
  checkedFields: Array<SemanticConsistencyFinding['field']>,
  currentObjectContext: ApiCurrentObjectContext,
  conflicts: ApiCrossProjectSymbolConflicts | undefined,
): void {
  if (!conflicts?.available || !currentObjectContext.objectInfo?.globalType) {
    return;
  }

  markField(checkedFields, 'workspaceAmbiguity');
  const conflict = conflicts.conflicts.find((entry) => sameValue(entry.symbolName, currentObjectContext.objectInfo?.globalType));
  if (!conflict) {
    return;
  }

  addFinding(findings, checkedFields, {
    code: 'cross-project-ambiguity',
    severity: 'warning',
    field: 'workspaceAmbiguity',
    message: `El objeto ${currentObjectContext.objectInfo.globalType} sigue teniendo ${conflict.candidateCount} candidatos preferidos en distintas ubicaciones (${conflict.scope}).`,
    sources: ['currentObjectContext', 'crossProjectSymbolConflicts'],
  });
}

export function buildSemanticConsistencyOracleReport(
  input: SemanticConsistencyOracleInput,
): SemanticConsistencyOracleReport {
  const findings: SemanticConsistencyFinding[] = [];
  const checkedFields: Array<SemanticConsistencyFinding['field']> = [];
  const currentObjectContext = input.currentObjectContext;

  if (!currentObjectContext.available || !currentObjectContext.objectInfo?.uri) {
    addFinding(findings, checkedFields, {
      code: 'focus-unavailable',
      severity: 'error',
      field: 'availability',
      message: currentObjectContext.reason ?? 'No hay objeto activo para reconciliar surfaces read-only.',
      sources: ['currentObjectContext'],
    });
    return {
      status: 'error',
      checkedFields,
      counts: {
        checkedFieldCount: checkedFields.length,
        errorCount: 1,
        warningCount: 0,
      },
      findings,
    };
  }

  const focusUri = currentObjectContext.objectInfo.uri;
  const focusName = currentObjectContext.objectInfo.globalType;
  const manifestObject = findManifestObject(input.workspaceManifest, focusUri, focusName);
  const manifestObjectsTruncated = input.workspaceManifest?.limits.objectsTruncated === true;
  const graphFocus = input.dependencyGraph?.focus;

  if (input.workspaceManifest && !manifestObject && !manifestObjectsTruncated) {
    addFinding(findings, checkedFields, {
      code: 'manifest-object-missing',
      severity: 'error',
      field: 'availability',
      message: `El manifest no contiene un objeto único para ${focusName ?? focusUri}.`,
      sources: ['currentObjectContext', 'semanticWorkspaceManifest'],
    });
  }

  if (input.dependencyGraph?.available && !graphFocus) {
    addFinding(findings, checkedFields, {
      code: 'graph-focus-missing',
      severity: 'error',
      field: 'availability',
      message: 'El dependency graph no devolvió focus para el objeto activo.',
      sources: ['currentObjectContext', 'dependencyGraph'],
    });
  }

  compareSurfaceValues(
    findings,
    checkedFields,
    'objectName',
    'object-name-mismatch',
    'objectName',
    [
      { source: 'currentObjectContext', value: focusName },
      { source: 'semanticWorkspaceManifest', value: manifestObject?.name },
      { source: 'dependencyGraph', value: graphFocus?.objectName },
    ]
  );

  compareSurfaceValues(
    findings,
    checkedFields,
    'objectKind',
    'object-kind-mismatch',
    'objectKind',
    [
      { source: 'currentObjectContext', value: currentObjectContext.objectInfo.objectKind },
      { source: 'semanticWorkspaceManifest', value: manifestObject?.objectKind },
      { source: 'dependencyGraph', value: inferGraphObjectKind(input.dependencyGraph) },
    ]
  );

  compareSurfaceValues(
    findings,
    checkedFields,
    'project',
    'project-mismatch',
    'project',
    [
      { source: 'currentObjectContext', value: currentObjectContext.objectInfo.project },
      { source: 'semanticWorkspaceManifest', value: manifestObject?.projectUri },
      { source: 'dependencyGraph', value: graphFocus?.projectUri },
    ]
  );

  compareSurfaceValues(
    findings,
    checkedFields,
    'library',
    'library-mismatch',
    'library',
    [
      { source: 'currentObjectContext', value: currentObjectContext.objectInfo.library },
      { source: 'semanticWorkspaceManifest', value: manifestObject?.library },
      { source: 'dependencyGraph', value: graphFocus?.library },
    ]
  );

  compareSurfaceValues(
    findings,
    checkedFields,
    'sourceOrigin',
    'source-origin-mismatch',
    'sourceOrigin',
    [
      { source: 'currentObjectContext', value: currentObjectContext.objectInfo.sourceOrigin },
      { source: 'semanticWorkspaceManifest', value: manifestObject?.sourceOrigin },
      { source: 'dependencyGraph', value: graphFocus?.sourceOrigin },
    ]
  );

  compareSurfaceValues(
    findings,
    checkedFields,
    'ancestorChain',
    'ancestor-chain-mismatch',
    'baseType/ancestorChain',
    [
      { source: 'currentObjectContext', value: currentObjectContext.ancestorChain?.[0]?.name ?? currentObjectContext.objectInfo.baseType },
      { source: 'semanticWorkspaceManifest', value: manifestObject?.baseType },
      { source: 'dependencyGraph', value: graphFocus?.baseType },
    ]
  );

  compareDiagnostics(findings, checkedFields, currentObjectContext, input.diagnostics);

  compareSurfaceValues(
    findings,
    checkedFields,
    'readiness',
    'readiness-mismatch',
    'readiness',
    [
      { source: 'currentObjectContext', value: currentObjectContext.objectInfo.readiness ?? currentObjectContext.evidence?.readiness },
      { source: 'semanticWorkspaceManifest', value: manifestObject?.readiness },
    ],
    'warning'
  );

  compareDataWindowBindings(findings, checkedFields, currentObjectContext, input.dataWindowSqlLineage);
  compareCrossProjectAmbiguity(findings, checkedFields, currentObjectContext, input.crossProjectSymbolConflicts);

  const errorCount = findings.filter((finding) => finding.severity === 'error').length;
  const warningCount = findings.filter((finding) => finding.severity === 'warning').length;

  return {
    status: errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'healthy',
    focus: {
      uri: focusUri,
      ...(focusName ? { objectName: focusName } : {}),
      ...(currentObjectContext.objectInfo.objectKind ? { objectKind: currentObjectContext.objectInfo.objectKind as ApiSemanticWorkspaceManifestObject['objectKind'] } : {}),
      ...(currentObjectContext.objectInfo.project ? { project: currentObjectContext.objectInfo.project } : {}),
      ...(currentObjectContext.objectInfo.library ? { library: currentObjectContext.objectInfo.library } : {}),
      ...(currentObjectContext.objectInfo.sourceOrigin ? { sourceOrigin: currentObjectContext.objectInfo.sourceOrigin } : {}),
    },
    checkedFields,
    counts: {
      checkedFieldCount: checkedFields.length,
      errorCount,
      warningCount,
    },
    findings,
  };
}