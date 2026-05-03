import { buildPowerBuilderCodeMetrics } from './powerBuilderCodeMetrics';
import { buildWorkspaceMigrationAssistant } from './workspaceMigrationAssistant';
import type { DiagnosticsSnapshot } from './diagnosticsSnapshot';
import type { ApiEmbeddedSqlAnchor } from '../../shared/publicApi';
import { type ApiPowerBuilderCodeMetricsObject } from '../../shared/publicApi';
import type { SourceOrigin } from '../../shared/sourceOrigin';
import type { KnowledgeBase } from '../knowledge/KnowledgeBase';
import type { WorkspaceState } from '../workspace/workspaceState';

export interface PowerBuilderTechnicalDebtReportRequest {
  maxObjects?: number;
  maxHotspots?: number;
  maxRecommendations?: number;
}

export type PowerBuilderTechnicalDebtHotspotCategory =
  | 'obsolete'
  | 'dynamic-sql'
  | 'external-dependency'
  | 'datawindow-risk'
  | 'complexity'
  | 'source-origin-risk';

export type PowerBuilderTechnicalDebtPriority = 'high' | 'medium' | 'low';
export type PowerBuilderTechnicalDebtConfidence = 'high' | 'medium';

export interface PowerBuilderTechnicalDebtHotspot {
  name: string;
  uri: string;
  objectKind?: ApiPowerBuilderCodeMetricsObject['objectKind'];
  projectUri?: string;
  library?: string;
  sourceOrigin?: SourceOrigin;
  priority: PowerBuilderTechnicalDebtPriority;
  confidence: PowerBuilderTechnicalDebtConfidence;
  categories: PowerBuilderTechnicalDebtHotspotCategory[];
  evidence: string[];
  recommendations: string[];
  metrics: {
    approximateComplexity: number;
    diagnostics: number;
    externalDependencies: number;
    linkedDataWindows: number;
    dynamicSqlStatements: number;
    obsoleteDiagnostics: number;
  };
  embeddedSqlAnchors?: ApiEmbeddedSqlAnchor[];
}

export type PowerBuilderTechnicalDebtRecommendationCategory =
  | 'modernization'
  | 'datawindow'
  | 'source-origin'
  | 'legacy-layout'
  | 'orca-pbl'
  | 'build';

export interface PowerBuilderTechnicalDebtRecommendation {
  id: string;
  category: PowerBuilderTechnicalDebtRecommendationCategory;
  priority: PowerBuilderTechnicalDebtPriority;
  confidence: PowerBuilderTechnicalDebtConfidence;
  title: string;
  detail: string;
  evidence: string[];
  actions: string[];
}

export interface PowerBuilderTechnicalDebtReportSummary {
  totalHotspots: number;
  totalRecommendations: number;
  obsoleteFindings: number;
  dynamicSqlFindings: number;
  externalDependencyFindings: number;
  dataWindowRiskFindings: number;
  complexObjectFindings: number;
  sourceOriginRiskFindings: number;
  legacyWorkspaceRiskFindings: number;
}

export interface PowerBuilderTechnicalDebtReport {
  schemaVersion: '1.0.0';
  generatedAt: number;
  summary: PowerBuilderTechnicalDebtReportSummary;
  hotspots: PowerBuilderTechnicalDebtHotspot[];
  recommendations: PowerBuilderTechnicalDebtRecommendation[];
}

interface ObjectDiagnosticsIndex {
  total: number;
  byCode: Record<string, number>;
}

const SCHEMA_VERSION = '1.0.0';
const DEFAULT_MAX_OBJECTS = 400;
const DEFAULT_MAX_HOTSPOTS = 20;
const DEFAULT_MAX_RECOMMENDATIONS = 8;
const MAX_RESULTS = 5000;
const DYNAMIC_SQL_RE = /\b(execute\s+immediate|prepare|declare)\b/ig;
const RISKY_SOURCE_ORIGINS: readonly SourceOrigin[] = [
  'orca-staging',
  'manual-export-source',
  'pbl-dump-source',
  'generated',
  'backup',
  'unknown',
];

function clamp(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(MAX_RESULTS, Math.max(1, Math.trunc(value)));
}

function normalizeDiagnosticCode(codeKey: string): string {
  const separator = codeKey.lastIndexOf(':');
  return (separator >= 0 ? codeKey.slice(separator + 1) : codeKey).toUpperCase();
}

function buildObjectDiagnosticsIndex(
  diagnosticsSummary: DiagnosticsSnapshot | DiagnosticsSnapshot['documents'][number] | null,
): Map<string, ObjectDiagnosticsIndex> {
  const byObject = new Map<string, ObjectDiagnosticsIndex>();

  if (!diagnosticsSummary || !('projects' in diagnosticsSummary)) {
    return byObject;
  }

  for (const project of diagnosticsSummary.projects) {
    for (const objectNode of project.objects) {
      const normalizedByCode = Object.fromEntries(
        Object.entries(objectNode.byCode).map(([codeKey, total]) => [normalizeDiagnosticCode(codeKey), total]),
      );

      byObject.set(objectNode.label.toLowerCase(), {
        total: objectNode.total,
        byCode: normalizedByCode,
      });
    }
  }

  return byObject;
}

function countDynamicSqlStatements(uri: string, kb: KnowledgeBase): { total: number; evidence: string[] } {
  const snapshot = kb.getDocumentSnapshot(uri);
  if (!snapshot) {
    return { total: 0, evidence: [] };
  }

  const content = snapshot.maskedText.lines.join('\n');
  const matches = [...content.matchAll(DYNAMIC_SQL_RE)];
  const evidence = Array.from(new Set(matches.map((match) => `dynamic-sql:${match[1].toLowerCase()}`)));
  return {
    total: matches.length,
    evidence,
  };
}

function isRiskySourceOrigin(sourceOrigin: SourceOrigin | undefined): sourceOrigin is SourceOrigin {
  return Boolean(sourceOrigin && RISKY_SOURCE_ORIGINS.includes(sourceOrigin));
}

function buildHotspotRecommendations(categories: readonly PowerBuilderTechnicalDebtHotspotCategory[]): string[] {
  const recommendations = new Set<string>();

  if (categories.includes('obsolete')) {
    recommendations.add('Sustituir funciones obsoletas por alternativas soportadas antes de ampliar automatización o refactors.');
  }
  if (categories.includes('dynamic-sql')) {
    recommendations.add('Aislar SQL dinámico o fijar plantillas/contratos antes de modernizar el objeto.');
  }
  if (categories.includes('datawindow-risk')) {
    recommendations.add('Revisar bindings DataObject/Retrieve y fijar targets antes de cambios estructurales.');
  }
  if (categories.includes('external-dependency')) {
    recommendations.add('Inventariar DLL/PBX externas y validar su disponibilidad/portabilidad en el entorno objetivo.');
  }
  if (categories.includes('complexity')) {
    recommendations.add('Reducir complejidad aproximada dividiendo el objeto o extrayendo helpers antes de automatizar cambios.');
  }
  if (categories.includes('source-origin-risk')) {
    recommendations.add('Consolidar el objeto sobre source real y evitar staging/manual-export como referencia canónica.');
  }

  return [...recommendations];
}

function computePriority(categories: readonly PowerBuilderTechnicalDebtHotspotCategory[]): PowerBuilderTechnicalDebtPriority {
  let score = 0;
  for (const category of categories) {
    switch (category) {
      case 'obsolete':
      case 'dynamic-sql':
      case 'datawindow-risk':
        score += 2;
        break;
      case 'external-dependency':
      case 'complexity':
        score += 1;
        break;
      case 'source-origin-risk':
        score += 1;
        break;
    }
  }

  if (score >= 5 || categories.length >= 4) {
    return 'high';
  }
  if (score >= 2) {
    return 'medium';
  }
  return 'low';
}

function computeConfidence(
  categories: readonly PowerBuilderTechnicalDebtHotspotCategory[],
  obsoleteDiagnostics: number,
  dynamicSqlStatements: number,
): PowerBuilderTechnicalDebtConfidence {
  if (obsoleteDiagnostics > 0 || dynamicSqlStatements > 0 || categories.includes('datawindow-risk')) {
    return 'high';
  }
  return 'medium';
}

function compareHotspots(left: PowerBuilderTechnicalDebtHotspot, right: PowerBuilderTechnicalDebtHotspot): number {
  const priorityOrder = (priority: PowerBuilderTechnicalDebtPriority): number => {
    switch (priority) {
      case 'high':
        return 0;
      case 'medium':
        return 1;
      default:
        return 2;
    }
  };

  const priorityDelta = priorityOrder(left.priority) - priorityOrder(right.priority);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const confidenceDelta = (left.confidence === 'high' ? 0 : 1) - (right.confidence === 'high' ? 0 : 1);
  if (confidenceDelta !== 0) {
    return confidenceDelta;
  }

  const categoryDelta = right.categories.length - left.categories.length;
  if (categoryDelta !== 0) {
    return categoryDelta;
  }

  return left.name.localeCompare(right.name);
}

function buildSourceOriginRecommendation(
  sourceOriginSummary: Partial<Record<SourceOrigin, number>>,
): PowerBuilderTechnicalDebtRecommendation | null {
  const evidence = RISKY_SOURCE_ORIGINS
    .map((origin) => ({ origin, total: sourceOriginSummary[origin] ?? 0 }))
    .filter((entry) => entry.total > 0)
    .map((entry) => `${entry.origin}:${entry.total}`);

  if (evidence.length === 0) {
    return null;
  }

  const hasHighRiskOrigin = evidence.some((entry) => entry.startsWith('orca-staging:') || entry.startsWith('unknown:'));
  return {
    id: 'source-origin-drift',
    category: 'source-origin',
    priority: hasHighRiskOrigin ? 'high' : 'medium',
    confidence: 'high',
    title: 'Reducir sourceOrigin no canónico antes de modernizar',
    detail: 'El workspace mezcla source real con staging/manual export o fuentes no canónicas; conviene consolidar la base antes de priorizar automatización o refactors.',
    evidence,
    actions: [
      'Promover source real como referencia canónica y limpiar staging/manual export cuando deje de ser necesario.',
      'Evitar cerrar deuda técnica sobre objetos cuyo sourceOrigin principal siga siendo staging, backup o unknown.',
    ],
  };
}

function mapWorkspaceRecommendationCategory(category: string): PowerBuilderTechnicalDebtRecommendationCategory {
  switch (category) {
    case 'topology':
      return 'legacy-layout';
    case 'legacy':
      return 'orca-pbl';
    default:
      return 'build';
  }
}

export function buildPowerBuilderTechnicalDebtReport(
  request: PowerBuilderTechnicalDebtReportRequest | undefined,
  kb: KnowledgeBase,
  workspaceState: WorkspaceState,
  diagnosticsSummary: DiagnosticsSnapshot | DiagnosticsSnapshot['documents'][number] | null,
): PowerBuilderTechnicalDebtReport {
  const maxObjects = clamp(request?.maxObjects, DEFAULT_MAX_OBJECTS);
  const maxHotspots = clamp(request?.maxHotspots, DEFAULT_MAX_HOTSPOTS);
  const maxRecommendations = clamp(request?.maxRecommendations, DEFAULT_MAX_RECOMMENDATIONS);
  const metrics = buildPowerBuilderCodeMetrics({ maxObjects }, kb, workspaceState, diagnosticsSummary);
  const diagnosticsByObject = buildObjectDiagnosticsIndex(diagnosticsSummary);

  let obsoleteFindings = 0;
  let dynamicSqlFindings = 0;
  let externalDependencyFindings = 0;
  let dataWindowRiskFindings = 0;
  let complexObjectFindings = 0;

  const hotspots = metrics.objects.flatMap((objectEntry) => {
    const objectDiagnostics = diagnosticsByObject.get(objectEntry.name.toLowerCase());
    const obsoleteDiagnostics = objectDiagnostics?.byCode.SD7 ?? 0;
    const dataWindowDiagnostics = (objectDiagnostics?.byCode['DATAOBJECT-DYNAMIC'] ?? 0)
      + (objectDiagnostics?.byCode['DATAOBJECT-NOT-FOUND'] ?? 0)
      + (objectDiagnostics?.byCode['DATAOBJECT-AMBIGUOUS'] ?? 0)
      + (objectDiagnostics?.byCode['DATAWINDOW-PROPERTY-PATH-UNRESOLVED'] ?? 0)
      + (objectDiagnostics?.byCode['RETRIEVE-ARITY-MISMATCH'] ?? 0)
      + (objectDiagnostics?.byCode['TRANSACTION-BINDING-MISSING'] ?? 0)
      + (objectDiagnostics?.byCode['TRANSACTION-BINDING-UNKNOWN'] ?? 0)
      + (objectDiagnostics?.byCode['TRANSACTION-BINDING-DYNAMIC'] ?? 0);
    const dynamicSql = countDynamicSqlStatements(objectEntry.uri, kb);
    const categories: PowerBuilderTechnicalDebtHotspotCategory[] = [];
    const evidence = new Set<string>();

    if (obsoleteDiagnostics > 0) {
      categories.push('obsolete');
      evidence.add(`diagnostic:SD7=${obsoleteDiagnostics}`);
      obsoleteFindings += obsoleteDiagnostics;
    }
    if (dynamicSql.total > 0) {
      categories.push('dynamic-sql');
      dynamicSql.evidence.forEach((entry) => evidence.add(entry));
      dynamicSqlFindings += dynamicSql.total;
    }
    for (const anchor of objectEntry.embeddedSqlAnchors ?? []) {
      evidence.add(`sql-anchor:${anchor.keyword.toLowerCase()}:${anchor.startLine + 1}-${anchor.endLine + 1}`);
    }
    if (objectEntry.metrics.externalDependencies > 0 || (objectDiagnostics?.byCode['NATIVE-DEPENDENCY'] ?? 0) > 0) {
      categories.push('external-dependency');
      evidence.add(`metric:externalDependencies=${objectEntry.metrics.externalDependencies}`);
      externalDependencyFindings += Math.max(objectEntry.metrics.externalDependencies, 1);
    }
    if (objectEntry.metrics.linkedDataWindows > 0 && dataWindowDiagnostics > 0) {
      categories.push('datawindow-risk');
      evidence.add(`metric:linkedDataWindows=${objectEntry.metrics.linkedDataWindows}`);
      evidence.add(`diagnostic:datawindow=${dataWindowDiagnostics}`);
      dataWindowRiskFindings++;
    }
    if (objectEntry.metrics.approximateComplexity >= 4) {
      categories.push('complexity');
      evidence.add(`metric:approximateComplexity=${objectEntry.metrics.approximateComplexity}`);
      complexObjectFindings++;
    }
    if (isRiskySourceOrigin(objectEntry.sourceOrigin)) {
      categories.push('source-origin-risk');
      evidence.add(`source-origin:${objectEntry.sourceOrigin}`);
    }

    if (categories.length === 0) {
      return [];
    }

    const hotspot: PowerBuilderTechnicalDebtHotspot = {
      name: objectEntry.name,
      uri: objectEntry.uri,
      ...(objectEntry.objectKind ? { objectKind: objectEntry.objectKind } : {}),
      ...(objectEntry.projectUri ? { projectUri: objectEntry.projectUri } : {}),
      ...(objectEntry.library ? { library: objectEntry.library } : {}),
      ...(objectEntry.sourceOrigin ? { sourceOrigin: objectEntry.sourceOrigin } : {}),
      priority: computePriority(categories),
      confidence: computeConfidence(categories, obsoleteDiagnostics, dynamicSql.total),
      categories: [...categories].sort(),
      evidence: [...evidence].sort(),
      recommendations: buildHotspotRecommendations(categories),
      metrics: {
        approximateComplexity: objectEntry.metrics.approximateComplexity,
        diagnostics: objectEntry.metrics.diagnostics,
        externalDependencies: objectEntry.metrics.externalDependencies,
        linkedDataWindows: objectEntry.metrics.linkedDataWindows,
        dynamicSqlStatements: dynamicSql.total,
        obsoleteDiagnostics,
      },
      ...(objectEntry.embeddedSqlAnchors?.length ? { embeddedSqlAnchors: objectEntry.embeddedSqlAnchors } : {}),
    };

    return [hotspot];
  }).sort(compareHotspots).slice(0, maxHotspots);

  const migrationAssistant = buildWorkspaceMigrationAssistant({ maxRecommendations }, workspaceState);
  const recommendations: PowerBuilderTechnicalDebtRecommendation[] = migrationAssistant.recommendations.map((recommendation) => ({
    id: recommendation.id,
    category: mapWorkspaceRecommendationCategory(recommendation.category),
    priority: recommendation.priority,
    confidence: 'high',
    title: recommendation.title,
    detail: recommendation.detail,
    evidence: [...recommendation.evidence],
    actions: [...recommendation.actions],
  }));

  const sourceOriginRecommendation = buildSourceOriginRecommendation(workspaceState.getSourceOriginSummary());
  if (sourceOriginRecommendation) {
    recommendations.push(sourceOriginRecommendation);
  }

  const finalRecommendations = recommendations
    .sort((left, right) => left.title.localeCompare(right.title))
    .slice(0, maxRecommendations);

  const legacyWorkspaceRiskFindings = finalRecommendations.filter((recommendation) =>
    recommendation.category === 'legacy-layout' || recommendation.category === 'orca-pbl'
  ).length;

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: Date.now(),
    summary: {
      totalHotspots: hotspots.length,
      totalRecommendations: finalRecommendations.length,
      obsoleteFindings,
      dynamicSqlFindings,
      externalDependencyFindings,
      dataWindowRiskFindings,
      complexObjectFindings,
      sourceOriginRiskFindings: RISKY_SOURCE_ORIGINS.reduce((count, origin) => count + (workspaceState.getSourceOriginSummary()[origin] ?? 0), 0),
      legacyWorkspaceRiskFindings,
    },
    hotspots,
    recommendations: finalRecommendations,
  };
}