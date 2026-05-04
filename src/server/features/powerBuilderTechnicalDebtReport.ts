import { buildPowerBuilderCodeMetrics } from './powerBuilderCodeMetrics';
import { buildWorkspaceMigrationAssistant } from './workspaceMigrationAssistant';
import type { DiagnosticsSnapshot } from './diagnosticsSnapshot';
import type { ApiEmbeddedSqlAnchor } from '../../shared/publicApi';
import { type ApiPowerBuilderCodeMetricsObject } from '../../shared/publicApi';
import type { SourceOrigin } from '../../shared/sourceOrigin';
import type { KnowledgeBase } from '../knowledge/KnowledgeBase';
import type { Fact } from '../knowledge/types';
import type { WorkspaceState } from '../workspace/workspaceState';

export interface PowerBuilderTechnicalDebtReportRequest {
  maxObjects?: number;
  maxHotspots?: number;
  maxRecommendations?: number;
}

export type PowerBuilderTechnicalDebtHotspotCategory =
  | 'obsolete'
  | 'dynamic-sql'
  | 'lifecycle-risk'
  | 'external-dependency'
  | 'modern-integration'
  | 'web-ui-integration'
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
    lifecycleWarnings: number;
    webBrowserUsages?: number;
    httpIntegrationUsages?: number;
    jsonIntegrationUsages?: number;
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
  lifecycleRiskFindings: number;
  externalDependencyFindings: number;
  modernIntegrationFindings: number;
  webUiIntegrationFindings: number;
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

interface ExternalDependencyInsight {
  total: number;
  byKind: Record<'dll' | 'pbx' | 'unknown', number>;
  aliases: string[];
}

interface ModernIntegrationInsight {
  endpoints: string[];
  patterns: string[];
}

interface WebBrowserIntegrationInsight {
  patterns: string[];
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

function isOwnedCallable(symbol: Fact, objectName: string): boolean {
  return (symbol.containerName ?? symbol.fileObjectName ?? '').toLowerCase() === objectName.toLowerCase()
    && symbol.isPrototype !== true;
}

function collectExternalDependencyInsight(uri: string, objectName: string, kb: KnowledgeBase): ExternalDependencyInsight {
  const snapshot = kb.getDocumentSnapshot(uri);
  if (!snapshot) {
    return {
      total: 0,
      byKind: { dll: 0, pbx: 0, unknown: 0 },
      aliases: [],
    };
  }

  const dependencies = snapshot.symbols.filter((symbol) => isOwnedCallable(symbol, objectName) && symbol.isExternal === true);
  const aliases = new Set<string>();
  const byKind: ExternalDependencyInsight['byKind'] = { dll: 0, pbx: 0, unknown: 0 };

  for (const dependency of dependencies) {
    const kind = dependency.externalDependencyKind ?? 'unknown';
    byKind[kind] += 1;
    if (dependency.externalAlias) {
      aliases.add(dependency.externalAlias);
    }
  }

  return {
    total: dependencies.length,
    byKind,
    aliases: [...aliases].sort((left, right) => left.localeCompare(right)),
  };
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

function extractStringLiterals(line: string): Array<{ value: string; start: number; end: number }> {
  const literals: Array<{ value: string; start: number; end: number }> = [];
  let quote: '"' | '\'' | null = null;
  let start = -1;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    const next = line[index + 1];

    if (!quote && char === '/' && next === '/') {
      break;
    }

    if (!quote && (char === '"' || char === '\'')) {
      quote = char;
      start = index;
      continue;
    }

    if (quote && char === quote) {
      literals.push({ value: line.slice(start + 1, index), start, end: index });
      quote = null;
      start = -1;
    }
  }

  return literals;
}

function redactIntegrationEndpoint(value: string): string {
  try {
    const parsed = new URL(value);
    const scheme = parsed.protocol.replace(/:$/, '').toLowerCase();
    return `${scheme}://redacted-host/...`;
  } catch {
    return 'relative:/...';
  }
}

function looksLikeRelativeEndpoint(value: string): boolean {
  const trimmed = value.trim();
  return /^\/?(api|rest)\b/i.test(trimmed) || /^\//.test(trimmed);
}

function collectModernIntegrationInsight(uri: string, kb: KnowledgeBase): ModernIntegrationInsight {
  const snapshot = kb.getDocumentSnapshot(uri);
  if (!snapshot) {
    return {
      endpoints: [],
      patterns: [],
    };
  }

  const endpoints = new Set<string>();
  const patterns = new Set<string>();

  for (const line of snapshot.maskedText.lines) {
    const literals = extractStringLiterals(line);
    for (const match of line.matchAll(/\.\s*(get|post|put|patch|delete|sendrequest|requestresource|resendpostrequest)\s*\(/ig)) {
      patterns.add(`integration-pattern:http-verb:${match[1].toLowerCase()}`);
    }

    for (const literal of literals) {
      const value = literal.value.trim();
      if (value.length === 0) {
        continue;
      }

      if (/^https?:\/\//i.test(value)) {
        endpoints.add(`integration-endpoint:${redactIntegrationEndpoint(value)}`);
        continue;
      }

      if (looksLikeRelativeEndpoint(value) && /\b(get|post|put|patch|delete|sendrequest|requestresource|resendpostrequest|setrequesturi)\b/i.test(line)) {
        endpoints.add('integration-endpoint:relative:/...');
        continue;
      }

      if (/^authorization$/i.test(value) || /^bearer\b/i.test(value)) {
        patterns.add('integration-pattern:authorization-header');
        continue;
      }

      if (/^content-type$/i.test(value)) {
        patterns.add('integration-pattern:content-type-header');
        continue;
      }

      if (/application\/json/i.test(value)) {
        patterns.add('integration-pattern:json-payload');
      }
    }
  }

  return {
    endpoints: [...endpoints].sort((left, right) => left.localeCompare(right)),
    patterns: [...patterns].sort((left, right) => left.localeCompare(right)),
  };
}

function collectWebBrowserIntegrationInsight(uri: string, kb: KnowledgeBase): WebBrowserIntegrationInsight {
  const snapshot = kb.getDocumentSnapshot(uri);
  if (!snapshot) {
    return { patterns: [] };
  }

  const patterns = new Set<string>();

  for (const line of snapshot.maskedText.lines) {
    if (/\.\s*(navigate|navigatetostring|goback|goforward|refresh|stopnavigation)\s*\(/i.test(line)) {
      patterns.add('web-ui-pattern:navigation');
    }
    if (/\.\s*(evaluatejavascriptasync|evaluatejavascriptsync|postjsonwebmessage|poststringwebmessage|registerevent)\s*\(/i.test(line)) {
      patterns.add('web-ui-pattern:script-bridge');
    }
    if (/\bwebbrowserset\s*\(/i.test(line) && /remote-debugging-port|remote-allow-origins/i.test(line)) {
      patterns.add('web-ui-pattern:remote-debugging');
    }
  }

  return {
    patterns: [...patterns].sort((left, right) => left.localeCompare(right)),
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
  if (categories.includes('lifecycle-risk')) {
    recommendations.add('Revisar create/destroy, super calls y hooks constructor/destructor antes de modernizar el objeto.');
  }
  if (categories.includes('datawindow-risk')) {
    recommendations.add('Revisar bindings DataObject/Retrieve y fijar targets antes de cambios estructurales.');
  }
  if (categories.includes('external-dependency')) {
    recommendations.add('Inventariar DLL/PBX externas, validar su disponibilidad/portabilidad y documentar su despliegue fuera del carril ORCA cuando aplique.');
  }
  if (categories.includes('modern-integration')) {
    recommendations.add('Revisar contratos HTTP/REST/JSON y mantener redaction por defecto antes de automatizar cambios o ampliar soporte.');
  }
  if (categories.includes('web-ui-integration')) {
    recommendations.add('Revisar navegación, bridge JavaScript y settings WebView2 sin inspeccionar contenido web remoto ni ampliar automatización write-enabled.');
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
      case 'lifecycle-risk':
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
  if (obsoleteDiagnostics > 0 || dynamicSqlStatements > 0 || categories.includes('datawindow-risk') || categories.includes('lifecycle-risk')) {
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
  let lifecycleRiskFindings = 0;
  let externalDependencyFindings = 0;
  let modernIntegrationFindings = 0;
  let webUiIntegrationFindings = 0;
  let dataWindowRiskFindings = 0;
  let complexObjectFindings = 0;

  const hotspots = metrics.objects.flatMap((objectEntry) => {
    const objectDiagnostics = diagnosticsByObject.get(objectEntry.name.toLowerCase());
    const obsoleteDiagnostics = objectDiagnostics?.byCode.SD7 ?? 0;
    const dataObjectBindingDiagnostics = (objectDiagnostics?.byCode['DATAOBJECT-DYNAMIC'] ?? 0)
      + (objectDiagnostics?.byCode['DATAOBJECT-NOT-FOUND'] ?? 0)
      + (objectDiagnostics?.byCode['DATAOBJECT-AMBIGUOUS'] ?? 0);
    const dataWindowPathDiagnostics = objectDiagnostics?.byCode['DATAWINDOW-PROPERTY-PATH-UNRESOLVED'] ?? 0;
    const retrieveArityDiagnostics = objectDiagnostics?.byCode['RETRIEVE-ARITY-MISMATCH'] ?? 0;
    const transactionBindingDiagnostics = (objectDiagnostics?.byCode['TRANSACTION-BINDING-MISSING'] ?? 0)
      + (objectDiagnostics?.byCode['TRANSACTION-BINDING-UNKNOWN'] ?? 0)
      + (objectDiagnostics?.byCode['TRANSACTION-BINDING-DYNAMIC'] ?? 0);
    const dataWindowDiagnostics = dataObjectBindingDiagnostics
      + dataWindowPathDiagnostics
      + retrieveArityDiagnostics
      + transactionBindingDiagnostics;
    const lifecycleMissingSuperDiagnostics = Object.entries(objectDiagnostics?.byCode ?? {}).reduce((count, [codeKey, total]) => {
      return count + (codeKey.startsWith('MISSING-SUPER-') ? total : 0);
    }, 0);
    const lifecycleMissingTriggerDiagnostics = Object.entries(objectDiagnostics?.byCode ?? {}).reduce((count, [codeKey, total]) => {
      return count + (codeKey.startsWith('MISSING-TRIGGER-') ? total : 0);
    }, 0);
    const lifecycleUnresolvedHookDiagnostics = (objectDiagnostics?.byCode['UNRESOLVED-CONSTRUCTOR'] ?? 0)
      + (objectDiagnostics?.byCode['UNRESOLVED-DESTRUCTOR'] ?? 0);
    const lifecycleRiskDiagnostics = lifecycleMissingSuperDiagnostics
      + lifecycleMissingTriggerDiagnostics
      + lifecycleUnresolvedHookDiagnostics;
    const dynamicSql = countDynamicSqlStatements(objectEntry.uri, kb);
    const externalDependencyInsight = collectExternalDependencyInsight(objectEntry.uri, objectEntry.name, kb);
    const modernIntegrationInsight = collectModernIntegrationInsight(objectEntry.uri, kb);
    const webBrowserIntegrationInsight = collectWebBrowserIntegrationInsight(objectEntry.uri, kb);
    const webBrowserUsages = objectEntry.metrics.webBrowserUsages ?? 0;
    const httpIntegrationUsages = objectEntry.metrics.httpIntegrationUsages ?? 0;
    const jsonIntegrationUsages = objectEntry.metrics.jsonIntegrationUsages ?? 0;
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
    if (lifecycleRiskDiagnostics > 0) {
      categories.push('lifecycle-risk');
      evidence.add(`diagnostic:lifecycle=${lifecycleRiskDiagnostics}`);
      if (lifecycleMissingSuperDiagnostics > 0) {
        evidence.add(`diagnostic:lifecycle-missing-super=${lifecycleMissingSuperDiagnostics}`);
      }
      if (lifecycleMissingTriggerDiagnostics > 0) {
        evidence.add(`diagnostic:lifecycle-missing-trigger=${lifecycleMissingTriggerDiagnostics}`);
      }
      if (lifecycleUnresolvedHookDiagnostics > 0) {
        evidence.add(`diagnostic:lifecycle-unresolved-hook=${lifecycleUnresolvedHookDiagnostics}`);
      }
      lifecycleRiskFindings += lifecycleRiskDiagnostics;
    }
    for (const anchor of objectEntry.embeddedSqlAnchors ?? []) {
      evidence.add(`sql-anchor:${anchor.keyword.toLowerCase()}:${anchor.startLine + 1}-${anchor.endLine + 1}`);
    }
    if (objectEntry.metrics.externalDependencies > 0 || (objectDiagnostics?.byCode['NATIVE-DEPENDENCY'] ?? 0) > 0) {
      categories.push('external-dependency');
      evidence.add(`metric:externalDependencies=${objectEntry.metrics.externalDependencies}`);
      if (externalDependencyInsight.total > 0) {
        evidence.add(`external-consumers=${externalDependencyInsight.total}`);
        evidence.add('external-risk:native-runtime');
        evidence.add('external-build-impact:manual-native-deployment');
      }
      for (const [kind, total] of Object.entries(externalDependencyInsight.byKind)) {
        if (total > 0) {
          evidence.add(`external-kind:${kind}=${total}`);
        }
      }
      for (const alias of externalDependencyInsight.aliases) {
        evidence.add(`external-alias:${alias}`);
      }
      if (externalDependencyInsight.byKind.pbx > 0) {
        evidence.add('external-risk:pbni-runtime-surface');
        evidence.add('external-orca-impact:manual-pbx-packaging');
      }
      if (externalDependencyInsight.byKind.unknown > 0) {
        evidence.add('external-risk:unknown-binary-classification');
      }
      externalDependencyFindings += Math.max(objectEntry.metrics.externalDependencies, 1);
    }
    if (httpIntegrationUsages > 0 || jsonIntegrationUsages > 0) {
      categories.push('modern-integration');
      if (httpIntegrationUsages > 0) {
        evidence.add(`metric:httpIntegrationUsages=${httpIntegrationUsages}`);
        evidence.add('integration-surface:http-rest');
      }
      if (jsonIntegrationUsages > 0) {
        evidence.add(`metric:jsonIntegrationUsages=${jsonIntegrationUsages}`);
        evidence.add('integration-surface:json');
      }
      evidence.add('integration-risk:redaction-required');
      modernIntegrationInsight.endpoints.forEach((entry) => evidence.add(entry));
      modernIntegrationInsight.patterns.forEach((entry) => evidence.add(entry));
      modernIntegrationFindings += httpIntegrationUsages + jsonIntegrationUsages;
    }
    if (webBrowserUsages > 0) {
      categories.push('web-ui-integration');
      evidence.add(`metric:webBrowserUsages=${webBrowserUsages}`);
      evidence.add('web-ui-surface:webbrowser');
      webBrowserIntegrationInsight.patterns.forEach((entry) => evidence.add(entry));
      evidence.add('web-ui-risk:no-content-inspection');
      webUiIntegrationFindings++;
    }
    if (dataWindowDiagnostics > 0) {
      categories.push('datawindow-risk');
      if (objectEntry.metrics.linkedDataWindows > 0) {
        evidence.add(`metric:linkedDataWindows=${objectEntry.metrics.linkedDataWindows}`);
      }
      evidence.add(`diagnostic:datawindow=${dataWindowDiagnostics}`);
      if (dataObjectBindingDiagnostics > 0) {
        evidence.add(`diagnostic:dataobject-binding=${dataObjectBindingDiagnostics}`);
      }
      if (transactionBindingDiagnostics > 0) {
        evidence.add(`diagnostic:transaction-binding=${transactionBindingDiagnostics}`);
      }
      if (retrieveArityDiagnostics > 0) {
        evidence.add(`diagnostic:retrieve-arity=${retrieveArityDiagnostics}`);
      }
      if (dataWindowPathDiagnostics > 0) {
        evidence.add(`diagnostic:datawindow-path=${dataWindowPathDiagnostics}`);
      }
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
        lifecycleWarnings: objectEntry.metrics.lifecycleWarnings,
        webBrowserUsages,
        httpIntegrationUsages,
        jsonIntegrationUsages,
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
      lifecycleRiskFindings,
      externalDependencyFindings,
      modernIntegrationFindings,
      webUiIntegrationFindings,
      dataWindowRiskFindings,
      complexObjectFindings,
      sourceOriginRiskFindings: RISKY_SOURCE_ORIGINS.reduce((count, origin) => count + (workspaceState.getSourceOriginSummary()[origin] ?? 0), 0),
      legacyWorkspaceRiskFindings,
    },
    hotspots,
    recommendations: finalRecommendations,
  };
}