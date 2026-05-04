import { findSqlRegions } from '../parsing/sqlRegions';
import { collectDataObjectBindings } from './dataWindowBindingModel';
import { collectEmbeddedSqlAnchors } from './embeddedSqlAnchors';
import type { DiagnosticsSnapshot } from './diagnosticsSnapshot';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { EntityKind, type Entity, type Fact } from '../knowledge/types';
import type { WorkspaceState } from '../workspace/workspaceState';
import {
  type ApiPowerBuilderCodeMetrics,
  type ApiPowerBuilderCodeMetricsDiagnosticArea,
  type ApiPowerBuilderCodeMetricsDiagnosticsSummary,
  type ApiPowerBuilderCodeMetricsObject,
  type ApiPowerBuilderCodeMetricsObjectMetrics,
  type ApiPowerBuilderCodeMetricsRequest,
  type ApiPowerBuilderCodeMetricsSummary,
} from '../../shared/publicApi';

const CODE_METRICS_SCHEMA_VERSION = '1.0.0';
const DEFAULT_MAX_OBJECTS = 400;
const MAX_OBJECTS = 5000;
const LIFECYCLE_WARNING_PREFIXES = ['missing-super-', 'missing-trigger-', 'unresolved-constructor', 'unresolved-destructor'] as const;
const HTTP_INTEGRATION_TYPES = new Set([
  'httpclient',
  'restclient',
  'oauthclient',
  'oauthrequest',
  'tokenrequest',
  'tokenresponse',
  'inet',
  'internetresult',
  'resourceresponse',
  'service',
  'sslcallback',
  'sslserviceprovider',
  'wsconnection',
]);
const JSON_INTEGRATION_TYPES = new Set([
  'jsonparser',
  'jsongenerator',
  'jsonpackage',
  'datawindowjson',
]);
const WEB_BROWSER_INTEGRATION_TYPES = new Set([
  'webbrowser',
]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function inferObjectKindFromUri(uri: string): ApiPowerBuilderCodeMetricsObject['objectKind'] {
  const normalizedUri = uri.toLowerCase();
  if (normalizedUri.endsWith('.sra')) return 'application';
  if (normalizedUri.endsWith('.srw')) return 'window';
  if (normalizedUri.endsWith('.sru')) return 'userobject';
  if (normalizedUri.endsWith('.srm')) return 'menu';
  if (normalizedUri.endsWith('.srd')) return 'datawindow';
  if (normalizedUri.endsWith('.srf')) return 'function';
  if (normalizedUri.endsWith('.srs')) return 'structure';
  if (normalizedUri.endsWith('.srp')) return 'pipeline';
  if (normalizedUri.endsWith('.srq')) return 'query';
  return 'unknown';
}

interface ObjectDiagnosticsSummary {
  total: number;
  lifecycleWarnings: number;
  dataObjectBindingDiagnostics: number;
  transactionBindingDiagnostics: number;
  retrieveArityDiagnostics: number;
}

function normalizeDiagnosticCode(codeKey: string): string {
  const separator = codeKey.lastIndexOf(':');
  return separator >= 0 ? codeKey.slice(separator + 1) : codeKey;
}

function isLifecycleDiagnosticCode(code: string): boolean {
  return LIFECYCLE_WARNING_PREFIXES.some((prefix) => code.startsWith(prefix));
}

function classifyDiagnosticArea(codeKey: string): ApiPowerBuilderCodeMetricsDiagnosticArea['area'] {
  const code = normalizeDiagnosticCode(codeKey).toLowerCase();
  if (isLifecycleDiagnosticCode(code)) {
    return 'lifecycle';
  }
  if (code.startsWith('dataobject-') || code.startsWith('retrieve-') || code.startsWith('transaction-binding-') || code.startsWith('datawindow-')) {
    return 'datawindow';
  }
  if (code === 'native-dependency') {
    return 'external';
  }
  if (code === 'sd4' || code === 'sd5') {
    return 'unused';
  }
  if (code === 'sd6') {
    return 'shadowing';
  }
  if (code === 'sd7') {
    return 'obsolete';
  }
  if (code === 'sd2' || code === 'sd3' || code === 'sd8') {
    return 'resolution';
  }
  if (code === 'sd9' || code === 'sd10' || code === 'sd11' || code === 'sd12' || code === 'sd13') {
    return 'control-flow';
  }
  return 'general';
}

function buildDiagnosticsByObject(
  diagnosticsSummary: DiagnosticsSnapshot | DiagnosticsSnapshot['documents'][number] | null
): Map<string, ObjectDiagnosticsSummary> {
  const byObject = new Map<string, ObjectDiagnosticsSummary>();

  if (!diagnosticsSummary || !('projects' in diagnosticsSummary)) {
    return byObject;
  }

  for (const project of diagnosticsSummary.projects) {
    for (const objectNode of project.objects) {
      const normalizedByCode = Object.fromEntries(
        Object.entries(objectNode.byCode).map(([codeKey, total]) => [normalizeDiagnosticCode(codeKey).toLowerCase(), total]),
      );
      const lifecycleWarnings = Object.entries(normalizedByCode).reduce((count, [codeKey, total]) => {
        return count + (isLifecycleDiagnosticCode(codeKey) ? total : 0);
      }, 0);
      const dataObjectBindingDiagnostics = (normalizedByCode['dataobject-dynamic'] ?? 0)
        + (normalizedByCode['dataobject-not-found'] ?? 0)
        + (normalizedByCode['dataobject-ambiguous'] ?? 0);
      const transactionBindingDiagnostics = (normalizedByCode['transaction-binding-missing'] ?? 0)
        + (normalizedByCode['transaction-binding-unknown'] ?? 0)
        + (normalizedByCode['transaction-binding-dynamic'] ?? 0);
      const retrieveArityDiagnostics = normalizedByCode['retrieve-arity-mismatch'] ?? 0;
      byObject.set(objectNode.label.toLowerCase(), {
        total: objectNode.total,
        lifecycleWarnings,
        dataObjectBindingDiagnostics,
        transactionBindingDiagnostics,
        retrieveArityDiagnostics,
      });
    }
  }

  return byObject;
}

function buildDiagnosticsSummary(
  diagnosticsSummary: DiagnosticsSnapshot | DiagnosticsSnapshot['documents'][number] | null
): ApiPowerBuilderCodeMetricsDiagnosticsSummary {
  if (!diagnosticsSummary || !('byCode' in diagnosticsSummary)) {
    return {
      total: 0,
      byArea: [],
    };
  }

  const byArea = new Map<ApiPowerBuilderCodeMetricsDiagnosticArea['area'], number>();
  for (const [codeKey, total] of Object.entries(diagnosticsSummary.byCode)) {
    const area = classifyDiagnosticArea(codeKey);
    byArea.set(area, (byArea.get(area) ?? 0) + total);
  }

  return {
    total: Object.values(diagnosticsSummary.byCode).reduce((sum, total) => sum + total, 0),
    byArea: [...byArea.entries()]
      .map(([area, total]) => ({ area, total }))
      .sort((left, right) => right.total - left.total || left.area.localeCompare(right.area)),
  };
}

function isOwnedCallable(symbol: Fact, objectName: string): boolean {
  return (symbol.containerName ?? symbol.fileObjectName ?? '').toLowerCase() === objectName.toLowerCase()
    && symbol.isPrototype !== true;
}

function countFunctions(symbols: readonly Fact[], objectName: string): number {
  return symbols.filter((symbol) =>
    isOwnedCallable(symbol, objectName)
    && (symbol.kind === EntityKind.Function || symbol.kind === EntityKind.Subroutine)
  ).length;
}

function countEvents(symbols: readonly Fact[], objectName: string): number {
  return symbols.filter((symbol) => isOwnedCallable(symbol, objectName) && symbol.kind === EntityKind.Event).length;
}

function countExternalDependencies(symbols: readonly Fact[], objectName: string): number {
  return symbols.filter((symbol) => isOwnedCallable(symbol, objectName) && symbol.isExternal === true).length;
}

function isOwnedByObject(symbol: Fact, objectName: string): boolean {
  const normalizedObjectName = objectName.toLowerCase();
  return symbol.isPrototype !== true && (
    (symbol.kind === EntityKind.Type && symbol.name.toLowerCase() === normalizedObjectName)
    || (symbol.ownerName ?? symbol.fileObjectName ?? symbol.containerName ?? '').toLowerCase() === normalizedObjectName
  );
}

function matchesIntegrationUsage(symbol: Pick<Fact, 'kind' | 'name' | 'baseTypeName' | 'datatype' | 'ownerName' | 'fileObjectName' | 'containerName' | 'isPrototype'>,
  objectName: string,
  integrationTypes: ReadonlySet<string>): boolean {
  if (!isOwnedByObject(symbol as Fact, objectName)) {
    return false;
  }

  const baseTypeName = symbol.baseTypeName?.toLowerCase();
  const datatype = symbol.datatype?.toLowerCase();
  return (baseTypeName ? integrationTypes.has(baseTypeName) : false)
    || (datatype ? integrationTypes.has(datatype) : false);
}

function countIntegrationUsages(
  snapshot: NonNullable<ReturnType<KnowledgeBase['getDocumentSnapshot']>>,
  objectName: string,
  integrationTypes: ReadonlySet<string>
): number {
  const semanticFacts = snapshot.symbols.filter((symbol) => matchesIntegrationUsage(symbol, objectName, integrationTypes));
  const scopeSymbols = snapshot.scopes.flatMap((scope) => scope.symbols)
    .filter((symbol) => matchesIntegrationUsage(symbol, objectName, integrationTypes));
  return semanticFacts.length + scopeSymbols.length;
}

function countLinkedDataWindows(snapshot: NonNullable<ReturnType<KnowledgeBase['getDocumentSnapshot']>>, kb: KnowledgeBase): number {
  return new Set(
    collectDataObjectBindings(snapshot, kb)
      .filter((binding) => binding.state === 'resolved' && binding.dataObject)
      .map((binding) => binding.dataObject?.toLowerCase())
      .filter((binding): binding is string => Boolean(binding))
  ).size;
}

function countEmbeddedSqlStatements(snapshot: NonNullable<ReturnType<KnowledgeBase['getDocumentSnapshot']>>): number {
  return findSqlRegions(snapshot.maskedText.lines.join('\n')).length;
}

function approximateComplexity(snapshot: NonNullable<ReturnType<KnowledgeBase['getDocumentSnapshot']>>): number {
  return snapshot.controlBlocks.length;
}

function compareObjects(left: Entity, right: Entity): number {
  const leftName = left.name.toLowerCase();
  const rightName = right.name.toLowerCase();
  if (leftName !== rightName) {
    return leftName.localeCompare(rightName);
  }
  return left.uri.localeCompare(right.uri);
}

export function buildPowerBuilderCodeMetrics(
  request: ApiPowerBuilderCodeMetricsRequest | undefined,
  kb: KnowledgeBase,
  workspaceState: WorkspaceState,
  diagnosticsSummary: DiagnosticsSnapshot | DiagnosticsSnapshot['documents'][number] | null
): ApiPowerBuilderCodeMetrics {
  const maxObjects = clamp(
    typeof request?.maxObjects === 'number' ? Math.trunc(request.maxObjects) : DEFAULT_MAX_OBJECTS,
    1,
    MAX_OBJECTS
  );
  const projectModel = workspaceState.getProjectModel();
  const projects = projectModel?.getProjects() ?? [];
  const libraries = new Set(projects.flatMap((project) => project.libraries));
  const diagnosticsByObject = buildDiagnosticsByObject(diagnosticsSummary);
  const diagnostics = buildDiagnosticsSummary(diagnosticsSummary);
  const buildSummary = workspaceState.getBuildFileSummary();
  const sourceOriginSummary = workspaceState.getSourceOriginSummary();
  const typeEntities = kb.queryEntities({ kinds: [EntityKind.Type], limit: maxObjects }).sort(compareObjects);

  const objects = typeEntities.map((entity) => {
    const snapshot = kb.getDocumentSnapshot(entity.uri);
    const embeddedSqlAnchors = collectEmbeddedSqlAnchors(snapshot, 4);
    const projectContext = workspaceState.getProjectContextForFile(entity.uri);
    const library = workspaceState.resolveLibraryForFile(entity.uri, projectContext?.libraries);
    const objectDiagnostics = diagnosticsByObject.get(entity.name.toLowerCase());
    const metrics: ApiPowerBuilderCodeMetricsObjectMetrics = {
      functions: snapshot ? countFunctions(snapshot.symbols, entity.name) : 0,
      events: snapshot ? countEvents(snapshot.symbols, entity.name) : 0,
      approximateComplexity: snapshot ? approximateComplexity(snapshot) : 0,
      embeddedSqlStatements: snapshot ? countEmbeddedSqlStatements(snapshot) : 0,
      linkedDataWindows: snapshot ? countLinkedDataWindows(snapshot, kb) : 0,
      externalDependencies: snapshot ? countExternalDependencies(snapshot.symbols, entity.name) : 0,
      webBrowserUsages: snapshot ? countIntegrationUsages(snapshot, entity.name, WEB_BROWSER_INTEGRATION_TYPES) : 0,
      httpIntegrationUsages: snapshot ? countIntegrationUsages(snapshot, entity.name, HTTP_INTEGRATION_TYPES) : 0,
      jsonIntegrationUsages: snapshot ? countIntegrationUsages(snapshot, entity.name, JSON_INTEGRATION_TYPES) : 0,
      lifecycleWarnings: objectDiagnostics?.lifecycleWarnings ?? 0,
      diagnostics: objectDiagnostics?.total ?? 0,
      dataObjectBindingDiagnostics: objectDiagnostics?.dataObjectBindingDiagnostics ?? 0,
      transactionBindingDiagnostics: objectDiagnostics?.transactionBindingDiagnostics ?? 0,
      retrieveArityDiagnostics: objectDiagnostics?.retrieveArityDiagnostics ?? 0,
    };

    return {
      name: entity.name,
      uri: entity.uri,
      ...(projectContext?.projectUri ? { projectUri: projectContext.projectUri } : {}),
      ...(library ? { library } : {}),
      objectKind: inferObjectKindFromUri(entity.uri),
      ...(snapshot?.readiness ? { readiness: snapshot.readiness } : {}),
      ...(entity.lineage?.sourceOrigin ? { sourceOrigin: entity.lineage.sourceOrigin } : {}),
      metrics,
      ...(embeddedSqlAnchors.length > 0 ? { embeddedSqlAnchors } : {}),
    } satisfies ApiPowerBuilderCodeMetricsObject;
  });

  const summary = objects.reduce<ApiPowerBuilderCodeMetricsSummary>((accumulator, objectEntry) => {
    accumulator.totalObjects++;
    accumulator.totalFunctions += objectEntry.metrics.functions;
    accumulator.totalEvents += objectEntry.metrics.events;
    accumulator.totalEmbeddedSqlStatements += objectEntry.metrics.embeddedSqlStatements;
    accumulator.totalLinkedDataWindows += objectEntry.metrics.linkedDataWindows;
    accumulator.totalExternalDependencies += objectEntry.metrics.externalDependencies;
    accumulator.totalWebBrowserUsages = (accumulator.totalWebBrowserUsages ?? 0)
      + (objectEntry.metrics.webBrowserUsages ?? 0);
    accumulator.totalHttpIntegrationUsages = (accumulator.totalHttpIntegrationUsages ?? 0)
      + (objectEntry.metrics.httpIntegrationUsages ?? 0);
    accumulator.totalJsonIntegrationUsages = (accumulator.totalJsonIntegrationUsages ?? 0)
      + (objectEntry.metrics.jsonIntegrationUsages ?? 0);
    accumulator.totalLifecycleWarnings += objectEntry.metrics.lifecycleWarnings;
    accumulator.totalDiagnostics += objectEntry.metrics.diagnostics;
    accumulator.totalDataObjectBindingDiagnostics = (accumulator.totalDataObjectBindingDiagnostics ?? 0)
      + (objectEntry.metrics.dataObjectBindingDiagnostics ?? 0);
    accumulator.totalTransactionBindingDiagnostics = (accumulator.totalTransactionBindingDiagnostics ?? 0)
      + (objectEntry.metrics.transactionBindingDiagnostics ?? 0);
    accumulator.totalRetrieveArityDiagnostics = (accumulator.totalRetrieveArityDiagnostics ?? 0)
      + (objectEntry.metrics.retrieveArityDiagnostics ?? 0);
    return accumulator;
  }, {
    totalProjects: projects.length,
    totalLibraries: libraries.size,
    totalObjects: 0,
    totalFunctions: 0,
    totalEvents: 0,
    totalEmbeddedSqlStatements: 0,
    totalLinkedDataWindows: 0,
    totalExternalDependencies: 0,
    totalWebBrowserUsages: 0,
    totalHttpIntegrationUsages: 0,
    totalJsonIntegrationUsages: 0,
    totalLifecycleWarnings: 0,
    totalDiagnostics: 0,
    totalDataObjectBindingDiagnostics: 0,
    totalTransactionBindingDiagnostics: 0,
    totalRetrieveArityDiagnostics: 0,
  });

  return {
    schemaVersion: CODE_METRICS_SCHEMA_VERSION,
    generatedAt: Date.now(),
    summary,
    diagnostics,
    footprint: {
      build: {
        total: buildSummary.total,
        usable: buildSummary.usable,
        invalid: buildSummary.invalid,
        ambiguous: buildSummary.ambiguous,
      },
      orca: {
        stagedFiles: sourceOriginSummary['orca-staging'] ?? 0,
        libraryAliases: Object.keys(workspaceState.getLibrarySourceAliases()).length,
      },
    },
    objects,
  };
}