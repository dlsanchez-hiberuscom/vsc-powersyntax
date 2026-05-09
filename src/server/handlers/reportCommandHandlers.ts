import type {
  ApiExplainSemanticQueryRequest,
  ApiExplainSystemSymbolRequest,
  ApiSafeBatchRefactorPlanRequest,
  ApiSafeEditPlan,
  ApiSpecDrivenPblUpdateBatchRequest,
  ApiSpecDrivenPblUpdateRequest,
} from '../../shared/publicApi';
import type { OrcaRunResult } from '../../shared/orcaProtocol';
import type { DiagnosticsSnapshot } from '../features/diagnosticsSnapshot';
import type { ProgressReadinessSnapshot } from '../features/progressReadiness';
import type { BuildOrcaJournalStore } from '../runtime/buildOrcaJournalStore';
import type { RuntimeMemoryPressurePolicy } from '../runtime/memoryPressurePolicy';
import type { RuntimeJournal } from '../runtime/runtimeJournal';
import type { IFileSystem } from '../system/fileSystem';
import type { WorkspaceState } from '../workspace/workspaceState';
import type { ExecuteCommandParams } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { applySpecDrivenPblUpdate, applySpecDrivenPblUpdateBatch } from '../build/specDrivenPblUpdate';
import { buildCrossProjectSymbolConflicts } from '../features/crossProjectSymbolConflicts';
import { buildCurrentObjectContext } from '../features/currentObjectContext';
import { buildDataWindowSqlLineage } from '../features/dataWindowSqlLineage';
import { buildExplainSemanticQueryReport } from '../features/explainSemanticQuery';
import { buildExplainSystemSymbolReport } from '../features/explainSystemSymbol';
import { buildPowerBuilderDependencyGraph } from '../features/dependencyGraph';
import { decideFeatureReadiness } from '../features/featureReadiness';
import { buildHierarchyInspection } from '../features/hierarchyInspection';
import { buildImpactAnalysis } from '../features/impactAnalysis';
import { buildObjectInfo } from '../features/objectInfo';
import { buildPowerBuilderCodeMetrics } from '../features/powerBuilderCodeMetrics';
import { buildPowerBuilderTechnicalDebtReport } from '../features/powerBuilderTechnicalDebtReport';
import { buildWorkspaceCheckCatalogSummary } from '../features/workspaceCheckCatalogSummary';
import { buildSafeBatchRefactorPlan } from '../features/safeBatchRefactorPlan';
import { buildSafeEditPlan } from '../features/safeEditPlan';
import { buildWorkspaceMigrationAssistant } from '../features/workspaceMigrationAssistant';
import { queryApiSymbols } from '../features/workspaceSymbols';
import type { HotContextCache } from '../knowledge/HotContextCache';
import type { KnowledgeBase } from '../knowledge/KnowledgeBase';
import type { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { EntityKind } from '../knowledge/types';

export interface ReportCommandHandlerContext {
  workspaceState: WorkspaceState;
  knowledgeBase: KnowledgeBase;
  inheritanceGraph: InheritanceGraph;
  systemCatalog: SystemCatalog;
  hotContextCache: HotContextCache;
  runtimeJournal: RuntimeJournal;
  buildOrcaJournal: BuildOrcaJournalStore;
  fs: IFileSystem;
  getActiveDocumentUri(): string | null;
  getWorkspaceFolders(): string[];
  getOpenDocument(uri: string): TextDocument | undefined;
  buildRuntimeProgressReadiness(activeUriOverride?: string | null): ProgressReadinessSnapshot;
  ensureRuntimeMemoryPressureRelief(): RuntimeMemoryPressurePolicy;
  isLatencyPressureHigh(): boolean;
  getDiagnosticsSummary(uri?: string): DiagnosticsSnapshot | DiagnosticsSnapshot['documents'][number] | null;
  resolveAdaptiveLimit(requested: unknown, cap: number | undefined, minValue?: number): number | undefined;
  runInteractiveWorkload<T>(idPrefix: string, execute: () => Promise<T> | T): Promise<T>;
  runNearContextWorkload<T>(idPrefix: string, execute: () => Promise<T> | T): Promise<T>;
  runExportReportingWorkload<T>(idPrefix: string, execute: () => Promise<T> | T): Promise<T>;
  runOrcaWithBackpressure(request: { executablePath: string; scriptUri: string; timeoutMs?: number }): Promise<OrcaRunResult>;
}

function buildBlockedSafeEditPlan(reason: string): ApiSafeEditPlan {
  return {
    available: false,
    blocked: true,
    reason,
    objects: [],
    files: [],
    risks: [],
    recommendedTests: [],
    docsToReview: [],
    blockedReasons: [reason],
  };
}

async function loadSourceText(
  context: ReportCommandHandlerContext,
  uri: string,
): Promise<string | null> {
  const opened = context.getOpenDocument(uri);
  if (opened) {
    return opened.getText();
  }

  try {
    return await context.fs.readFile(uri);
  } catch {
    return null;
  }
}

async function loadTextDocument(
  context: ReportCommandHandlerContext,
  uri: string,
): Promise<TextDocument | null> {
  const opened = context.getOpenDocument(uri);
  if (opened) {
    return opened;
  }

  try {
    const content = await context.fs.readFile(uri);
    return TextDocument.create(uri, 'powerbuilder', 0, content);
  } catch {
    return null;
  }
}

export async function tryHandleReportCommand(
  params: ExecuteCommandParams,
  context: ReportCommandHandlerContext,
): Promise<{ handled: boolean; result?: unknown }> {
  const {
    workspaceState,
    knowledgeBase,
    inheritanceGraph,
    systemCatalog,
    hotContextCache,
    runtimeJournal,
    buildOrcaJournal,
    getActiveDocumentUri,
    getWorkspaceFolders,
    buildRuntimeProgressReadiness,
    ensureRuntimeMemoryPressureRelief,
    isLatencyPressureHigh,
    getDiagnosticsSummary,
    resolveAdaptiveLimit,
    runInteractiveWorkload,
    runNearContextWorkload,
    runExportReportingWorkload,
    runOrcaWithBackpressure,
  } = context;

  switch (params.command) {
    case 'powerbuilder.inspectHierarchy': {
      const [uriArg, lineArg, characterArg] = params.arguments ?? [];
      const uri = typeof uriArg === 'string' ? uriArg : getActiveDocumentUri();
      if (!uri) {
        return { handled: true, result: { available: false, reason: 'No hay documento activo.' } };
      }

      const line = typeof lineArg === 'number' ? lineArg : undefined;
      const character = typeof characterArg === 'number' ? characterArg : undefined;
      const readinessDecision = decideFeatureReadiness('definition', buildRuntimeProgressReadiness(uri), {
        latencyOverloaded: isLatencyPressureHigh()
      });
      if (readinessDecision.action === 'block') {
        return {
          handled: true,
          result: { available: false, reason: readinessDecision.reason, uri, line, character }
        };
      }

      const content = await loadSourceText(context, uri);
      if (!content) {
        return {
          handled: true,
          result: { available: false, reason: 'No se pudo leer el documento.', uri, line, character }
        };
      }

      const projectContext = workspaceState.getProjectContextForFile(uri);
      const objectInfo = buildObjectInfo({
        uri,
        content,
        line,
        library: projectContext?.libraries[0],
        project: projectContext?.projectUri
      });
      const focusType = objectInfo.globalType
        ?? knowledgeBase.getEntitiesByUri(uri).find((entity) => entity.kind === EntityKind.Type)?.name
        ?? null;

      if (!focusType) {
        return {
          handled: true,
          result: {
            available: false,
            reason: 'No se pudo determinar el tipo activo.',
            uri,
            line,
            character,
            objectInfo
          }
        };
      }

      return {
        handled: true,
        result: {
          available: true,
          uri,
          line,
          character,
          objectInfo,
          ...buildHierarchyInspection(focusType, inheritanceGraph, knowledgeBase, systemCatalog)
        }
      };
    }
    case 'powerbuilder.querySymbols': {
      const [queryArg, limitArg] = params.arguments ?? [];
      const query = typeof queryArg === 'string' ? queryArg : '';
      const limit = typeof limitArg === 'number' && Number.isFinite(limitArg)
        ? Math.max(0, Math.trunc(limitArg))
        : 200;
      try {
        const result = await runInteractiveWorkload('query-symbols', () => queryApiSymbols(query, knowledgeBase, limit));
        return {
          handled: true,
          result: JSON.parse(JSON.stringify(result)) as typeof result,
        };
      } catch {
        return { handled: true, result: [] };
      }
    }
    case 'powerbuilder.currentObjectContext': {
      const [uriArg, lineArg, characterArg, excerptArg, refsArg] = params.arguments ?? [];
      const uri = typeof uriArg === 'string' ? uriArg : undefined;
      if (!uri) {
        return {
          handled: true,
          result: { available: false, reason: 'No se recibió una URI válida.' }
        };
      }

      const document = await loadTextDocument(context, uri);
      if (!document) {
        return {
          handled: true,
          result: { available: false, reason: 'No se pudo leer el documento solicitado.', uri }
        };
      }

        return {
          handled: true,
          result: await runInteractiveWorkload('current-object-context', () => buildCurrentObjectContext(
          document,
          {
            ...(typeof lineArg === 'number' ? { line: Math.max(0, Math.trunc(lineArg)) } : {}),
            ...(typeof characterArg === 'number' ? { character: Math.max(0, Math.trunc(characterArg)) } : {}),
            ...(typeof excerptArg === 'number' ? { maxExcerptLines: Math.max(1, Math.trunc(excerptArg)) } : {}),
            ...(typeof refsArg === 'number' ? { maxReferencedSymbols: Math.max(0, Math.trunc(refsArg)) } : {}),
          },
          knowledgeBase,
          inheritanceGraph,
          systemCatalog,
          {
            workspaceState,
            hotContext: hotContextCache,
          }
        ))
      };
    }
    case 'powerbuilder.analyzeImpact': {
      const [uriArg, lineArg, characterArg, safeRefsArg] = params.arguments ?? [];
      const uri = typeof uriArg === 'string' ? uriArg : undefined;
      if (!uri) {
        return {
          handled: true,
          result: {
            available: false,
            reason: 'No se recibió una URI válida.',
            safeReferences: [],
            probableImpactFiles: [],
            descendants: [],
            overrides: [],
            relatedEvents: [],
            relatedDataWindows: [],
            affectedSymbols: [],
            buildTargets: [],
          }
        };
      }

      const document = await loadTextDocument(context, uri);
      if (!document) {
        return {
          handled: true,
          result: {
            available: false,
            reason: 'No se pudo leer el documento solicitado.',
            safeReferences: [],
            probableImpactFiles: [],
            descendants: [],
            overrides: [],
            relatedEvents: [],
            relatedDataWindows: [],
            affectedSymbols: [],
            buildTargets: [],
          }
        };
      }

      return {
        handled: true,
        result: await runExportReportingWorkload('impact-analysis', () => buildImpactAnalysis(
          document,
          {
            ...(typeof lineArg === 'number' ? { line: Math.max(0, Math.trunc(lineArg)) } : {}),
            ...(typeof characterArg === 'number' ? { character: Math.max(0, Math.trunc(characterArg)) } : {}),
            ...(typeof safeRefsArg === 'number' ? { maxSafeReferences: Math.max(0, Math.trunc(safeRefsArg)) } : {}),
          },
          knowledgeBase,
          inheritanceGraph,
          systemCatalog,
          async (targetUri) => loadSourceText(context, targetUri),
          {
            workspaceState,
            hotContext: hotContextCache,
          }
        ))
      };
    }
    case 'powerbuilder.safeEditPlan': {
      const [uriArg, lineArg, characterArg, safeRefsArg] = params.arguments ?? [];
      const uri = typeof uriArg === 'string' ? uriArg : undefined;
      if (!uri) {
        return {
          handled: true,
          result: buildBlockedSafeEditPlan('No se recibió una URI válida.')
        };
      }

      const document = await loadTextDocument(context, uri);
      if (!document) {
        return {
          handled: true,
          result: buildBlockedSafeEditPlan('No se pudo leer el documento solicitado.')
        };
      }

      return {
        handled: true,
        result: await runInteractiveWorkload('safe-edit-plan', () => buildSafeEditPlan(
          document,
          {
            ...(typeof lineArg === 'number' ? { line: Math.max(0, Math.trunc(lineArg)) } : {}),
            ...(typeof characterArg === 'number' ? { character: Math.max(0, Math.trunc(characterArg)) } : {}),
            ...(typeof safeRefsArg === 'number' ? { maxSafeReferences: Math.max(0, Math.trunc(safeRefsArg)) } : {}),
          },
          knowledgeBase,
          inheritanceGraph,
          systemCatalog,
          async (targetUri) => loadSourceText(context, targetUri),
          {
            workspaceState,
            hotContext: hotContextCache,
          }
        ))
      };
    }
    case 'powerbuilder.safeBatchRefactorPlan': {
      const [requestArg] = params.arguments ?? [];
      const request = typeof requestArg === 'object' && requestArg !== null
        ? requestArg as ApiSafeBatchRefactorPlanRequest
        : undefined;

      return {
        handled: true,
        result: await runExportReportingWorkload('safe-batch-refactor-plan', () => buildSafeBatchRefactorPlan(
          request,
          async (targetUri) => loadTextDocument(context, targetUri),
          knowledgeBase,
          inheritanceGraph,
          systemCatalog,
          async (targetUri) => loadSourceText(context, targetUri),
          {
            workspaceState,
            hotContext: hotContextCache,
          }
        ))
      };
    }
    case 'powerbuilder.applySpecDrivenPblUpdate': {
      const request = Array.isArray(params.arguments) ? params.arguments[0] : undefined;
      if (!request || typeof request !== 'object') {
        const reason = 'No se recibió una solicitud válida para el update PBL spec-driven.';
        return {
          handled: true,
          result: {
            available: false,
            blocked: true,
            reason,
            blockedReasons: [reason],
            safeEditPlan: buildBlockedSafeEditPlan(reason),
            appliedEdits: [],
            ...(buildOrcaJournal.storageUri ? { journalUri: buildOrcaJournal.storageUri } : {}),
          }
        };
      }

      const uri = typeof (request as { uri?: unknown }).uri === 'string'
        ? (request as { uri: string }).uri
        : undefined;
      if (!uri) {
        const reason = 'No se recibió una URI válida para el update PBL spec-driven.';
        return {
          handled: true,
          result: {
            available: false,
            blocked: true,
            reason,
            blockedReasons: [reason],
            safeEditPlan: buildBlockedSafeEditPlan(reason),
            appliedEdits: [],
            ...(buildOrcaJournal.storageUri ? { journalUri: buildOrcaJournal.storageUri } : {}),
          }
        };
      }

      const document = await loadTextDocument(context, uri);
      if (!document) {
        const reason = 'No se pudo leer el documento solicitado para el update PBL spec-driven.';
        return {
          handled: true,
          result: {
            available: false,
            blocked: true,
            reason,
            blockedReasons: [reason],
            safeEditPlan: buildBlockedSafeEditPlan(reason),
            appliedEdits: [],
            ...(buildOrcaJournal.storageUri ? { journalUri: buildOrcaJournal.storageUri } : {}),
          }
        };
      }

      return {
        handled: true,
        result: await applySpecDrivenPblUpdate(
          document,
          request as ApiSpecDrivenPblUpdateRequest,
          {
            workspaceFolders: getWorkspaceFolders(),
            workspaceState,
            fs: context.fs,
            kb: knowledgeBase,
            graph: inheritanceGraph,
            systemCatalog,
            runOrca: (orcaRequest) => runOrcaWithBackpressure(orcaRequest),
            loadSource: async (targetUri) => loadSourceText(context, targetUri),
            journal: runtimeJournal,
            journalUri: buildOrcaJournal.storageUri,
          }
        )
      };
    }
    case 'powerbuilder.applySpecDrivenPblUpdateBatch': {
      const request = Array.isArray(params.arguments) ? params.arguments[0] : undefined;
      if (!request || typeof request !== 'object') {
        return {
          handled: true,
          result: {
            blocked: true,
            stoppedEarly: false,
            total: 0,
            succeeded: 0,
            blockedCount: 0,
            items: [],
            ...(buildOrcaJournal.storageUri ? { journalUri: buildOrcaJournal.storageUri } : {}),
          }
        };
      }

      return {
        handled: true,
        result: await applySpecDrivenPblUpdateBatch(
          request as ApiSpecDrivenPblUpdateBatchRequest,
          {
            workspaceFolders: getWorkspaceFolders(),
            workspaceState,
            fs: context.fs,
            kb: knowledgeBase,
            graph: inheritanceGraph,
            systemCatalog,
            runOrca: (orcaRequest) => runOrcaWithBackpressure(orcaRequest),
            loadSource: async (targetUri) => loadSourceText(context, targetUri),
            loadDocument: async (targetUri) => {
              const document = await loadTextDocument(context, targetUri);
              if (!document) {
                throw new Error('No se pudo cargar el documento solicitado para el item batch.');
              }
              return document;
            },
            journal: runtimeJournal,
            journalUri: buildOrcaJournal.storageUri,
          }
        )
      };
    }
    case 'powerbuilder.crossProjectSymbolConflicts': {
      const [symbolNameArg, maxConflictsArg, maxCandidatesPerConflictArg] = params.arguments ?? [];
      const reportLimits = ensureRuntimeMemoryPressureRelief().reportLimits?.crossProjectSymbolConflicts;
      const maxConflicts = resolveAdaptiveLimit(maxConflictsArg, reportLimits?.maxConflicts, 0);
      const maxCandidatesPerConflict = resolveAdaptiveLimit(maxCandidatesPerConflictArg, reportLimits?.maxCandidatesPerConflict, 0);
      return {
        handled: true,
        result: await runExportReportingWorkload('cross-project-symbol-conflicts', () => buildCrossProjectSymbolConflicts(
          {
            ...(typeof symbolNameArg === 'string' && symbolNameArg.trim().length > 0 ? { symbolName: symbolNameArg } : {}),
            ...(typeof maxConflicts === 'number' ? { maxConflicts } : {}),
            ...(typeof maxCandidatesPerConflict === 'number' ? { maxCandidatesPerConflict } : {}),
          },
          knowledgeBase,
          workspaceState,
        ))
      };
    }
    case 'powerbuilder.workspaceCheckCatalogSummary': {
      return {
        handled: true,
        result: await runInteractiveWorkload('workspace-check-catalog', () => buildWorkspaceCheckCatalogSummary())
      };
    }
    case 'powerbuilder.workspaceMigrationAssistant': {
      const [preferredTargetModeArg, maxRecommendationsArg] = params.arguments ?? [];
      const reportLimits = ensureRuntimeMemoryPressureRelief().reportLimits?.workspaceMigrationAssistant;
      const maxRecommendations = resolveAdaptiveLimit(maxRecommendationsArg, reportLimits?.maxRecommendations, 0);
      return {
        handled: true,
        result: await runInteractiveWorkload('workspace-migration-assistant', () => buildWorkspaceMigrationAssistant(
          {
            ...(preferredTargetModeArg === 'workspace' || preferredTargetModeArg === 'solution'
              ? { preferredTargetMode: preferredTargetModeArg }
              : {}),
            ...(typeof maxRecommendations === 'number' ? { maxRecommendations } : {}),
          },
          workspaceState,
        ))
      };
    }
    case 'powerbuilder.explainSystemSymbol': {
      const [requestArg] = params.arguments ?? [];
      const request = typeof requestArg === 'object' && requestArg !== null
        ? requestArg as ApiExplainSystemSymbolRequest
        : undefined;
      const requestUri = typeof request?.uri === 'string' ? request.uri : undefined;
      const effectiveUri = requestUri
        ?? ((typeof request?.line === 'number' || typeof request?.character === 'number') ? getActiveDocumentUri() ?? undefined : undefined);
      const document = effectiveUri ? await loadTextDocument(context, effectiveUri) ?? undefined : undefined;

      return {
        handled: true,
        result: await runInteractiveWorkload('explain-system-symbol', () => buildExplainSystemSymbolReport(
          effectiveUri && effectiveUri !== requestUri
            ? {
              ...(request ?? {}),
              uri: effectiveUri,
            }
            : request,
          {
            systemCatalog,
            document,
            knowledgeBase,
          },
        )),
      };
    }
    case 'powerbuilder.explainSemanticQuery': {
      const [requestArg] = params.arguments ?? [];
      const request = typeof requestArg === 'object' && requestArg !== null
        ? requestArg as ApiExplainSemanticQueryRequest
        : undefined;
      const requestUri = typeof request?.uri === 'string' ? request.uri : undefined;
      const effectiveUri = requestUri ?? getActiveDocumentUri() ?? undefined;
      const document = effectiveUri ? await loadTextDocument(context, effectiveUri) ?? undefined : undefined;

      return {
        handled: true,
        result: await runInteractiveWorkload('explain-semantic-query', () => buildExplainSemanticQueryReport(
          effectiveUri && effectiveUri !== requestUri
            ? {
              ...(request ?? {}),
              uri: effectiveUri,
            }
            : request,
          {
            knowledgeBase,
            inheritanceGraph,
            document,
            hotContext: hotContextCache,
          },
        )),
      };
    }
    case 'powerbuilder.dependencyGraph': {
      const [uriArg, objectNameArg, maxDependenciesArg, maxDependentsArg] = params.arguments ?? [];
      return {
        handled: true,
        result: await runInteractiveWorkload('dependency-graph', () => buildPowerBuilderDependencyGraph(
          {
            ...(typeof uriArg === 'string' ? { uri: uriArg } : {}),
            ...(typeof objectNameArg === 'string' && objectNameArg.trim().length > 0 ? { objectName: objectNameArg } : {}),
            ...(typeof maxDependenciesArg === 'number' ? { maxDependencies: Math.max(0, Math.trunc(maxDependenciesArg)) } : {}),
            ...(typeof maxDependentsArg === 'number' ? { maxDependents: Math.max(0, Math.trunc(maxDependentsArg)) } : {}),
          },
          knowledgeBase,
          workspaceState,
        ))
      };
    }
    case 'powerbuilder.codeMetrics': {
      const [maxObjectsArg] = params.arguments ?? [];
      const reportLimits = ensureRuntimeMemoryPressureRelief().reportLimits?.codeMetrics;
      const maxObjects = resolveAdaptiveLimit(maxObjectsArg, reportLimits?.maxObjects, 0);
      return {
        handled: true,
        result: await runExportReportingWorkload('code-metrics', () => buildPowerBuilderCodeMetrics(
          {
            ...(typeof maxObjects === 'number' ? { maxObjects } : {}),
          },
          knowledgeBase,
          workspaceState,
          getDiagnosticsSummary(),
        ))
      };
    }
    case 'powerbuilder.technicalDebtReport': {
      const [maxObjectsArg, maxHotspotsArg, maxRecommendationsArg] = params.arguments ?? [];
      const reportLimits = ensureRuntimeMemoryPressureRelief().reportLimits?.technicalDebtReport;
      const maxObjects = resolveAdaptiveLimit(maxObjectsArg, reportLimits?.maxObjects, 0);
      const maxHotspots = resolveAdaptiveLimit(maxHotspotsArg, reportLimits?.maxHotspots, 0);
      const maxRecommendations = resolveAdaptiveLimit(maxRecommendationsArg, reportLimits?.maxRecommendations, 0);
      return {
        handled: true,
        result: await runExportReportingWorkload('technical-debt-report', () => buildPowerBuilderTechnicalDebtReport(
          {
            ...(typeof maxObjects === 'number' ? { maxObjects } : {}),
            ...(typeof maxHotspots === 'number' ? { maxHotspots } : {}),
            ...(typeof maxRecommendations === 'number' ? { maxRecommendations } : {}),
          },
          knowledgeBase,
          workspaceState,
          getDiagnosticsSummary(),
        ))
      };
    }
    case 'powerbuilder.dataWindowSqlLineage': {
      const [uriArg, lineArg, dataObjectNameArg, maxDepthArg] = params.arguments ?? [];
      return {
        handled: true,
        result: buildDataWindowSqlLineage(
          {
            ...(typeof uriArg === 'string' ? { uri: uriArg } : {}),
            ...(typeof lineArg === 'number' ? { line: Math.max(0, Math.trunc(lineArg)) } : {}),
            ...(typeof dataObjectNameArg === 'string' && dataObjectNameArg.trim().length > 0 ? { dataObjectName: dataObjectNameArg } : {}),
            ...(typeof maxDepthArg === 'number' ? { maxDepth: Math.max(0, Math.trunc(maxDepthArg)) } : {}),
          },
          knowledgeBase,
        )
      };
    }
    default:
      return { handled: false };
  }
}