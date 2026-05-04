import * as path from 'path';

import {
  PUBLIC_API_VERSION,
  type ApiCurrentObjectContext,
  type ApiImpactAnalysis,
  type ApiObjectCheckFinding,
  type ApiObjectCheckReport,
  type ApiObjectCheckRequest,
  type ApiPowerBuilderDependencyGraph,
  type ApiSafeEditPlan,
} from '../shared/publicApi';

type ObjectCheckSectionErrorKey = 'dependencyGraph' | 'impactAnalysis' | 'safeEditPlan';

export interface NormalizedObjectCheckRequest {
  includeDiagnostics: boolean;
  includeContext: boolean;
  includeDependencyGraph: boolean;
  includeImpactAnalysis: boolean;
  includeSafeEditPlan: boolean;
  includeDataWindowBindings: boolean;
  includeEmbeddedSql: boolean;
  includeLifecycle: boolean;
  maxDiagnostics: number;
  maxReferences: number;
  maxDependencyNodes: number;
  maxFindings: number;
}

export interface ObjectCheckBuildInput {
  request?: ApiObjectCheckRequest;
  source: ApiObjectCheckReport['source'];
  objectContext?: ApiCurrentObjectContext;
  dependencyGraph?: ApiPowerBuilderDependencyGraph;
  impactAnalysis?: ApiImpactAnalysis;
  safeEditPlan?: ApiSafeEditPlan;
  sectionErrors?: Partial<Record<ObjectCheckSectionErrorKey, string>>;
}

const SEVERITY_ORDER: Record<ApiObjectCheckFinding['severity'], number> = {
  error: 0,
  warning: 1,
  info: 2,
};

export function normalizeObjectCheckRequest(request: ApiObjectCheckRequest = {}): NormalizedObjectCheckRequest {
  return {
    includeDiagnostics: request.includeDiagnostics ?? true,
    includeContext: request.includeContext ?? true,
    includeDependencyGraph: request.includeDependencyGraph ?? true,
    includeImpactAnalysis: request.includeImpactAnalysis ?? false,
    includeSafeEditPlan: request.includeSafeEditPlan ?? true,
    includeDataWindowBindings: request.includeDataWindowBindings ?? true,
    includeEmbeddedSql: request.includeEmbeddedSql ?? true,
    includeLifecycle: request.includeLifecycle ?? true,
    maxDiagnostics: clampNumber(request.maxDiagnostics, 0, 200, 8),
    maxReferences: clampNumber(request.maxReferences, 1, 200, 24),
    maxDependencyNodes: clampNumber(request.maxDependencyNodes, 1, 100, 12),
    maxFindings: clampNumber(request.maxFindings, 1, 200, 24),
  };
}

export function buildUnavailableObjectCheckReport(
  reason: string,
  source: ApiObjectCheckReport['source'],
  request: ApiObjectCheckRequest = {},
): ApiObjectCheckReport {
  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    apiVersion: PUBLIC_API_VERSION,
    available: false,
    reason,
    status: 'failed',
    source,
    summary: {
      ...(source.objectName ? { objectName: source.objectName } : {}),
      ...(source.uri ? { uri: source.uri } : {}),
      diagnostics: { error: 0, warning: 0, info: 0, hint: 0 },
      dependencyCount: 0,
      dependentCount: 0,
      unresolvedDependencyCount: 0,
      ambiguousDependencyCount: 0,
      dataWindowBindingCount: 0,
      unresolvedDataWindowBindingCount: 0,
      embeddedSqlCount: 0,
      dynamicSqlRiskCount: 0,
      blockingFindings: 1,
      warningFindings: 0,
      truncated: false,
    },
    findings: [
      {
        code: 'object-check-unavailable',
        severity: 'error',
        area: 'unknown',
        message: 'Object check no disponible.',
        detail: reason,
        suggestedAction: 'Abrir un objeto PowerBuilder resoluble y reintentar.',
      },
    ],
    recommendedActions: ['Abrir un objeto PowerBuilder resoluble y reintentar.'],
  };
}

function clampNumber(value: number | undefined, minValue: number, maxValue: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maxValue, Math.max(minValue, Math.trunc(value)));
}

function uriLabel(uri: string | undefined): string {
  if (!uri) {
    return 'unknown';
  }

  try {
    if (uri.startsWith('file:')) {
      return path.basename(decodeURIComponent(new URL(uri).pathname));
    }
  } catch {
    // fallback below
  }

  const normalized = uri.replace(/\\/g, '/');
  const segments = normalized.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? uri;
}

function getDiagnosticTotals(context: ApiCurrentObjectContext | undefined): ApiObjectCheckReport['summary']['diagnostics'] {
  const bySeverity = context?.diagnostics?.bySeverity ?? {};
  return {
    error: bySeverity.error ?? 0,
    warning: bySeverity.warning ?? 0,
    info: bySeverity.info ?? 0,
    hint: bySeverity.hint ?? 0,
  };
}

function trimObjectContext(
  context: ApiCurrentObjectContext,
  request: NormalizedObjectCheckRequest,
): { value?: ApiCurrentObjectContext; truncated: boolean } {
  if (!request.includeContext) {
    return { value: undefined, truncated: false };
  }

  let truncated = false;
  const value: ApiCurrentObjectContext = {
    ...context,
    ...(request.includeDiagnostics && context.diagnostics
      ? {
          diagnostics: {
            ...context.diagnostics,
            items: context.diagnostics.items.slice(0, request.maxDiagnostics),
          },
        }
      : {}),
    ...(request.includeDataWindowBindings ? {} : { dataWindowBindings: undefined }),
    ...(request.includeEmbeddedSql ? {} : { embeddedSqlAnchors: undefined }),
  };

  if (request.includeDiagnostics && context.diagnostics) {
    truncated = context.diagnostics.items.length > value.diagnostics!.items.length;
  }

  if (!request.includeDiagnostics) {
    value.diagnostics = undefined;
  }

  if (!request.includeLifecycle) {
    value.members = undefined;
    value.ancestorChain = undefined;
  }

  return { value, truncated };
}

function addFinding(findings: ApiObjectCheckFinding[], finding: ApiObjectCheckFinding): void {
  findings.push(finding);
}

function addSectionErrorFindings(
  findings: ApiObjectCheckFinding[],
  recommendedActions: Set<string>,
  sectionErrors: Partial<Record<ObjectCheckSectionErrorKey, string>> | undefined,
): void {
  if (!sectionErrors) {
    return;
  }

  for (const [key, detail] of Object.entries(sectionErrors) as Array<[ObjectCheckSectionErrorKey, string]>) {
    const area: ApiObjectCheckFinding['area'] = key === 'dependencyGraph'
      ? 'dependency'
      : key === 'safeEditPlan'
        ? 'safe-edit'
        : 'semantic';

    addFinding(findings, {
      code: `${key}-unavailable`,
      severity: 'warning',
      area,
      message: `La seccion ${key} no estuvo disponible durante el object check.`,
      detail,
    });
    recommendedActions.add(`Revisar la disponibilidad de ${key} y reintentar el object check.`);
  }
}

function addContextAvailabilityFinding(
  findings: ApiObjectCheckFinding[],
  recommendedActions: Set<string>,
  context: ApiCurrentObjectContext,
  includeLifecycle: boolean,
): number {
  let unresolvedInheritanceCount = 0;

  if (!context.available) {
    addFinding(findings, {
      code: 'object-context-unavailable',
      severity: 'error',
      area: 'parser',
      message: 'No se pudo resolver el objeto actual.',
      ...(context.reason ? { detail: context.reason } : {}),
    });
    recommendedActions.add('Confirmar que el objeto activo esta indexado y que el cursor apunta a una unidad PowerBuilder valida.');
    return unresolvedInheritanceCount;
  }

  const readiness = context.objectInfo?.readiness ?? context.evidence?.readiness;
  if (includeLifecycle && readiness && readiness !== 'ready') {
    addFinding(findings, {
      code: `object-readiness-${readiness}`,
      severity: readiness === 'error' ? 'error' : 'warning',
      area: 'lifecycle',
      message: `El objeto actual tiene readiness ${readiness}.`,
    });
  }

  if (includeLifecycle && context.objectInfo?.baseType) {
    const unresolvedInheritance = (context.ancestorChain ?? []).filter((ancestor) => !ancestor.isSystemType && !ancestor.uri);
    unresolvedInheritanceCount = unresolvedInheritance.length;
    if (unresolvedInheritance.length > 0) {
      addFinding(findings, {
        code: 'inheritance-unresolved-base',
        severity: 'error',
        area: 'inheritance',
        message: `No se pudo resolver ${unresolvedInheritance.length} base type(s) del objeto actual.`,
        evidence: unresolvedInheritance.map((ancestor) => ancestor.name),
      });
      recommendedActions.add('Revisar la cadena de herencia y la disponibilidad de librerias/proyectos del objeto base.');
    }
  }

  return unresolvedInheritanceCount;
}

function addDiagnosticsFindings(
  findings: ApiObjectCheckFinding[],
  recommendedActions: Set<string>,
  context: ApiCurrentObjectContext,
  includeDiagnostics: boolean,
): void {
  if (!includeDiagnostics || !context.diagnostics) {
    return;
  }

  const totals = getDiagnosticTotals(context);
  if (totals.error > 0) {
    addFinding(findings, {
      code: 'object-diagnostics-errors',
      severity: 'error',
      area: 'diagnostics',
      message: `${totals.error} diagnostics de error activos en el objeto actual.`,
      detail: `${totals.warning} warnings, ${totals.info} infos, ${totals.hint} hints.`,
      uri: context.uri,
    });
    recommendedActions.add('Resolver primero los diagnostics de error del objeto antes de cerrar cambios locales.');
  } else if (totals.warning > 0) {
    addFinding(findings, {
      code: 'object-diagnostics-warnings',
      severity: 'warning',
      area: 'diagnostics',
      message: `${totals.warning} diagnostics de warning activos en el objeto actual.`,
      detail: `${totals.info} infos, ${totals.hint} hints.`,
      uri: context.uri,
    });
  }

  for (const item of context.diagnostics.items) {
    addFinding(findings, {
      code: item.code ?? 'object-diagnostic-item',
      severity: item.severity === 'hint' ? 'info' : (item.severity ?? 'info'),
      area: 'diagnostics',
      message: item.message,
      uri: context.uri,
      line: item.line,
      character: item.character,
    });
  }
}

function addDependencyFindings(
  findings: ApiObjectCheckFinding[],
  recommendedActions: Set<string>,
  dependencyGraph: ApiPowerBuilderDependencyGraph | undefined,
): number {
  if (!dependencyGraph) {
    return 0;
  }

  if (!dependencyGraph.available) {
    addFinding(findings, {
      code: 'dependency-graph-unavailable',
      severity: 'warning',
      area: 'dependency',
      message: 'No se pudo construir el dependency graph del objeto actual.',
      ...(dependencyGraph.reason ? { detail: dependencyGraph.reason } : {}),
    });
    return 0;
  }

  const unresolvedInheritanceCount = dependencyGraph.edges.filter((edge) => edge.relation === 'inherits' && !edge.resolved).length;
  if (unresolvedInheritanceCount > 0) {
    addFinding(findings, {
      code: 'dependency-inheritance-unresolved',
      severity: 'error',
      area: 'inheritance',
      message: `El dependency graph contiene ${unresolvedInheritanceCount} enlace(s) de herencia sin resolver.`,
    });
    recommendedActions.add('Resolver el base type o la libreria/proyecto que sostiene la herencia del objeto.');
  }

  if (dependencyGraph.summary.unresolvedDependencyCount > 0 || dependencyGraph.summary.ambiguousDependencyCount > 0) {
    addFinding(findings, {
      code: 'dependency-graph-risks',
      severity: 'warning',
      area: 'dependency',
      message: `El dependency graph contiene ${dependencyGraph.summary.unresolvedDependencyCount} dependencias no resueltas y ${dependencyGraph.summary.ambiguousDependencyCount} ambiguas.`,
    });
    recommendedActions.add('Revisar dependencias no resueltas o ambiguas antes de cerrar la unidad actual.');
  }

  return unresolvedInheritanceCount;
}

function addDataWindowFindings(
  findings: ApiObjectCheckFinding[],
  recommendedActions: Set<string>,
  context: ApiCurrentObjectContext,
  includeDataWindowBindings: boolean,
): number {
  if (!includeDataWindowBindings) {
    return 0;
  }

  const bindings = context.dataWindowBindings ?? [];
  const unresolved = bindings.filter((binding) => binding.state !== 'resolved');
  if (unresolved.length > 0) {
    addFinding(findings, {
      code: 'datawindow-bindings-unresolved',
      severity: 'warning',
      area: 'datawindow',
      message: `Hay ${unresolved.length} binding(s) DataWindow no resueltos o dinamicos en el objeto actual.`,
      evidence: unresolved.map((binding) => binding.dataObject ?? binding.targetName),
      uri: context.uri,
    });
    recommendedActions.add('Revisar dataobjects faltantes, ambiguos o dinamicos antes de cerrar la unidad.');
  }

  return unresolved.length;
}

function addEmbeddedSqlFindings(
  findings: ApiObjectCheckFinding[],
  recommendedActions: Set<string>,
  context: ApiCurrentObjectContext,
  includeEmbeddedSql: boolean,
): number {
  if (!includeEmbeddedSql) {
    return 0;
  }

  const anchors = context.embeddedSqlAnchors ?? [];
  const dynamicRiskCount = anchors.filter((anchor) => anchor.keyword === 'EXECUTE').length;
  if (dynamicRiskCount > 0) {
    addFinding(findings, {
      code: 'embedded-sql-dynamic-risk',
      severity: 'warning',
      area: 'sql',
      message: `El objeto actual contiene ${dynamicRiskCount} anchor(s) SQL con riesgo dinamico basado en EXECUTE.`,
      evidence: anchors.filter((anchor) => anchor.keyword === 'EXECUTE').map((anchor) => anchor.preview),
      uri: context.uri,
    });
    recommendedActions.add('Revisar el SQL dinamico o EXECUTE del objeto antes de asumir que el cambio es seguro.');
  }

  return dynamicRiskCount;
}

function addSafeEditFindings(
  findings: ApiObjectCheckFinding[],
  recommendedActions: Set<string>,
  safeEditPlan: ApiSafeEditPlan | undefined,
): void {
  if (!safeEditPlan) {
    return;
  }

  if (!safeEditPlan.available) {
    addFinding(findings, {
      code: 'safe-edit-plan-unavailable',
      severity: 'warning',
      area: 'safe-edit',
      message: 'No se pudo generar el safe edit plan del objeto actual.',
      ...(safeEditPlan.reason ? { detail: safeEditPlan.reason } : {}),
    });
    return;
  }

  if (safeEditPlan.blocked) {
    addFinding(findings, {
      code: 'safe-edit-plan-blocked',
      severity: 'error',
      area: 'safe-edit',
      message: 'El safe edit plan queda bloqueado para el objeto actual.',
      evidence: safeEditPlan.blockedReasons,
    });
    recommendedActions.add('Resolver las causas de bloqueo del safe edit plan antes de editar o cerrar la spec local.');
    return;
  }

  const highRiskFiles = safeEditPlan.files.filter((file) => file.risk === 'high');
  if (highRiskFiles.length > 0 || safeEditPlan.risks.length > 0) {
    addFinding(findings, {
      code: 'safe-edit-plan-risks',
      severity: 'warning',
      area: 'safe-edit',
      message: `El safe edit plan reporta ${highRiskFiles.length} archivo(s) de alto riesgo y ${safeEditPlan.risks.length} riesgo(s) agregados.`,
      evidence: highRiskFiles.map((file) => uriLabel(file.uri)).slice(0, 8),
    });
    recommendedActions.add('Revisar riesgos, tests recomendados y docs to review antes de editar esta unidad.');
  }
}

function addImpactFindings(
  findings: ApiObjectCheckFinding[],
  recommendedActions: Set<string>,
  impactAnalysis: ApiImpactAnalysis | undefined,
): void {
  if (!impactAnalysis) {
    return;
  }

  if (!impactAnalysis.available) {
    addFinding(findings, {
      code: 'impact-analysis-unavailable',
      severity: 'warning',
      area: 'semantic',
      message: 'No se pudo calcular el impact analysis del objeto actual.',
      ...(impactAnalysis.reason ? { detail: impactAnalysis.reason } : {}),
    });
    return;
  }

  if ((impactAnalysis.dynamicStringReferenceCount ?? 0) > 0 || impactAnalysis.invocationRisk === 'dynamic') {
    addFinding(findings, {
      code: 'impact-analysis-dynamic-risk',
      severity: 'warning',
      area: 'semantic',
      message: 'El impact analysis detecta riesgo dinamico en referencias del objeto actual.',
      evidence: impactAnalysis.riskReasons?.slice(0, 8),
    });
    recommendedActions.add('Revisar referencias dinamicas o fallback antes de usar este objeto como base de refactors.');
  }
}

function addFrameworkKnowledgeFindings(
  findings: ApiObjectCheckFinding[],
  recommendedActions: Set<string>,
  input: ObjectCheckBuildInput,
): void {
  const conflict = input.objectContext?.frameworkKnowledgeConflict
    ?? input.impactAnalysis?.frameworkKnowledgeConflict
    ?? input.safeEditPlan?.frameworkKnowledgeConflict;

  if (!conflict) {
    return;
  }

  addFinding(findings, {
    code: conflict.state === 'workspace-wins'
      ? 'framework-knowledge-workspace-wins'
      : 'framework-knowledge-pack-advisory',
    severity: conflict.state === 'workspace-wins' ? 'info' : 'warning',
    area: 'semantic',
    message: conflict.state === 'workspace-wins'
      ? 'El objeto tiene knowledge packs aplicables, pero la source real del workspace sigue siendo la autoridad.'
      : 'El objeto depende de knowledge packs advisory sin una source real fuerte del workspace.',
    detail: conflict.summary,
    evidence: conflict.packs.map((pack) => pack.title),
    uri: input.objectContext?.uri,
  });
  recommendedActions.add('Revisar el knowledge pack aplicable y confirmar que el comportamiento custom del workspace sigue siendo la fuente autoritativa.');
}

function sortFindings(findings: readonly ApiObjectCheckFinding[]): ApiObjectCheckFinding[] {
  return [...findings].sort((left, right) => {
    const severityDelta = SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }

    const areaDelta = left.area.localeCompare(right.area);
    if (areaDelta !== 0) {
      return areaDelta;
    }

    return left.message.localeCompare(right.message);
  });
}

export function buildObjectCheckReport(input: ObjectCheckBuildInput): ApiObjectCheckReport {
  const normalized = normalizeObjectCheckRequest(input.request);
  if (!input.objectContext) {
    return buildUnavailableObjectCheckReport('No se pudo obtener el context pack del objeto.', input.source, input.request);
  }

  if (!input.objectContext.available) {
    return buildUnavailableObjectCheckReport(
      input.objectContext.reason ?? 'No se pudo resolver el objeto actual.',
      {
        ...input.source,
        ...(input.objectContext.uri ? { uri: input.objectContext.uri } : {}),
        ...(input.objectContext.objectInfo?.globalType ? { objectName: input.objectContext.objectInfo.globalType } : {}),
      },
      input.request,
    );
  }

  const { value: objectContext, truncated: contextTruncated } = trimObjectContext(input.objectContext, normalized);
  const findings: ApiObjectCheckFinding[] = [];
  const recommendedActions = new Set<string>();
  let truncated = contextTruncated;

  addSectionErrorFindings(findings, recommendedActions, input.sectionErrors);
  const unresolvedInheritanceFromContext = addContextAvailabilityFinding(findings, recommendedActions, input.objectContext, normalized.includeLifecycle);
  addDiagnosticsFindings(findings, recommendedActions, input.objectContext, normalized.includeDiagnostics);
  const unresolvedInheritanceFromDependencies = normalized.includeDependencyGraph
    ? addDependencyFindings(findings, recommendedActions, input.dependencyGraph)
    : 0;
  const unresolvedDataWindowBindings = addDataWindowFindings(findings, recommendedActions, input.objectContext, normalized.includeDataWindowBindings);
  const dynamicSqlRiskCount = addEmbeddedSqlFindings(findings, recommendedActions, input.objectContext, normalized.includeEmbeddedSql);

  if (normalized.includeSafeEditPlan) {
    addSafeEditFindings(findings, recommendedActions, input.safeEditPlan);
  }
  if (normalized.includeImpactAnalysis) {
    addImpactFindings(findings, recommendedActions, input.impactAnalysis);
  }
  addFrameworkKnowledgeFindings(findings, recommendedActions, input);

  const sortedFindings = sortFindings(findings);
  const visibleFindings = sortedFindings.slice(0, normalized.maxFindings);
  truncated = truncated || sortedFindings.length > visibleFindings.length;
  truncated = truncated || Boolean(input.dependencyGraph && input.dependencyGraph.summary.nodeCount > input.dependencyGraph.nodes.length);
  truncated = truncated || Boolean(input.objectContext.sourceExcerpt?.truncated);

  const diagnostics = normalized.includeDiagnostics ? getDiagnosticTotals(input.objectContext) : { error: 0, warning: 0, info: 0, hint: 0 };
  const blockingFindings = sortedFindings.filter((finding) => finding.severity === 'error').length;
  const warningFindings = sortedFindings.filter((finding) => finding.severity === 'warning').length;
  const dependencySummary = input.dependencyGraph?.summary;
  const dataWindowBindings = normalized.includeDataWindowBindings ? input.objectContext.dataWindowBindings ?? [] : [];
  const embeddedSqlAnchors = normalized.includeEmbeddedSql ? input.objectContext.embeddedSqlAnchors ?? [] : [];
  const failed = diagnostics.error > 0
    || unresolvedInheritanceFromContext > 0
    || unresolvedInheritanceFromDependencies > 0
    || Boolean(normalized.includeSafeEditPlan && input.safeEditPlan?.blocked)
    || blockingFindings > 0;
  const warning = !failed && (
    diagnostics.warning > 0
    || (dependencySummary?.unresolvedDependencyCount ?? 0) > 0
    || (dependencySummary?.ambiguousDependencyCount ?? 0) > 0
    || unresolvedDataWindowBindings > 0
    || dynamicSqlRiskCount > 0
    || warningFindings > 0
  );

  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    apiVersion: PUBLIC_API_VERSION,
    available: true,
    status: failed ? 'failed' : warning ? 'warning' : 'passed',
    source: {
      ...input.source,
      ...(input.objectContext.uri ? { uri: input.objectContext.uri } : {}),
      ...(input.objectContext.objectInfo?.globalType ? { objectName: input.objectContext.objectInfo.globalType } : {}),
    },
    summary: {
      ...(input.objectContext.objectInfo?.globalType ? { objectName: input.objectContext.objectInfo.globalType } : {}),
      ...(input.objectContext.objectInfo?.objectKind ? { objectKind: input.objectContext.objectInfo.objectKind } : {}),
      ...(input.objectContext.uri ? { uri: input.objectContext.uri } : {}),
      diagnostics,
      dependencyCount: dependencySummary?.dependencyCount ?? 0,
      dependentCount: dependencySummary?.dependentCount ?? 0,
      unresolvedDependencyCount: dependencySummary?.unresolvedDependencyCount ?? 0,
      ambiguousDependencyCount: dependencySummary?.ambiguousDependencyCount ?? 0,
      dataWindowBindingCount: dataWindowBindings.length,
      unresolvedDataWindowBindingCount: unresolvedDataWindowBindings,
      embeddedSqlCount: embeddedSqlAnchors.length,
      dynamicSqlRiskCount,
      blockingFindings,
      warningFindings,
      truncated,
    },
    ...(objectContext ? { objectContext } : {}),
    ...(normalized.includeDependencyGraph && input.dependencyGraph ? { dependencyGraph: input.dependencyGraph } : {}),
    ...(normalized.includeImpactAnalysis && input.impactAnalysis ? { impactAnalysis: input.impactAnalysis } : {}),
    ...(normalized.includeSafeEditPlan && input.safeEditPlan ? { safeEditPlan: input.safeEditPlan } : {}),
    findings: visibleFindings,
    recommendedActions: [...recommendedActions],
  };
}

function formatFindingsMarkdown(findings: readonly ApiObjectCheckFinding[]): string[] {
  if (findings.length === 0) {
    return ['No findings.'];
  }

  return findings.map((finding) => {
    const location = finding.uri ? ` (${uriLabel(finding.uri)}${typeof finding.line === 'number' ? `:${finding.line + 1}` : ''})` : '';
    const detail = finding.detail ? ` - ${finding.detail}` : '';
    return `- [${finding.severity}] [${finding.area}] ${finding.message}${location}${detail}`;
  });
}

export function buildObjectCheckMarkdown(report: ApiObjectCheckReport): string {
  const lines = [
    '# Object Check',
    '',
    `- Status: ${report.status}`,
    `- Available: ${report.available ? 'yes' : 'no'}`,
    `- Source: ${report.source.kind}`,
    ...(report.summary.objectName ? [`- Object: ${report.summary.objectName}`] : []),
    ...(report.summary.objectKind ? [`- Kind: ${report.summary.objectKind}`] : []),
    ...(report.summary.uri ? [`- URI: ${report.summary.uri}`] : []),
    '',
    '## Summary',
    '',
    `- Diagnostics: error=${report.summary.diagnostics.error}, warning=${report.summary.diagnostics.warning}, info=${report.summary.diagnostics.info}, hint=${report.summary.diagnostics.hint}`,
    `- Dependencies: ${report.summary.dependencyCount}`,
    `- Dependents: ${report.summary.dependentCount}`,
    `- Unresolved dependencies: ${report.summary.unresolvedDependencyCount}`,
    `- Ambiguous dependencies: ${report.summary.ambiguousDependencyCount}`,
    `- DataWindow bindings: ${report.summary.dataWindowBindingCount}`,
    `- Unresolved DataWindow bindings: ${report.summary.unresolvedDataWindowBindingCount}`,
    `- Embedded SQL: ${report.summary.embeddedSqlCount}`,
    `- Dynamic SQL risk count: ${report.summary.dynamicSqlRiskCount}`,
    `- Blocking findings: ${report.summary.blockingFindings}`,
    `- Warning findings: ${report.summary.warningFindings}`,
    `- Truncated: ${report.summary.truncated ? 'yes' : 'no'}`,
  ];

  if (!report.available && report.reason) {
    lines.push('', `Reason: ${report.reason}`);
  }

  if (report.recommendedActions.length > 0) {
    lines.push('', '## Recommended Actions', '', ...report.recommendedActions.map((action) => `- ${action}`));
  }

  lines.push('', '## Findings', '', ...formatFindingsMarkdown(report.findings));
  return `${lines.join('\n')}\n`;
}