import { Range, type CompletionItem, type Connection, type TextDocuments } from 'vscode-languageserver/node';
import { TaskPriority, type TaskScheduler } from '../runtime/scheduler';
import { InteractiveLoopGuard } from '../runtime/interactiveLoopGuard';
import { measureMs, formatTiming, type FirstInvocationTracker } from '../runtime/timing';
import { provideCodeActions } from '../features/codeActions';
import {
  extractDocumentSymbolsWithReconciliation,
  formatDocumentSymbolReconciliationReport,
} from '../features/documentSymbols';
import { provideReferenceCodeLenses, type CodeLensSymbol } from '../features/codeLensReferences';
import { provideDefinition } from '../features/definition';
import { buildHoverPresentationResult, provideHover } from '../features/hover';
import { provideLinkedEditingRanges } from '../features/linkedEditing';
import { provideReferences, type ReferenceSource } from '../features/references';
import { provideRename } from '../features/rename';
import { provideSignatureHelp } from '../features/signatureHelp';
import {
  isCompletionItemResolveData,
  provideCompletion,
  resolveCompletionItemResult,
  type CompletionResolveNegativeReason,
  type CompletionItemResolveResult,
} from '../features/completion';
import { provideWorkspaceSymbols } from '../features/workspaceSymbols';
import { provideSemanticTokens } from '../features/semanticTokens';
import { decideFeatureReadiness } from '../features/featureReadiness';
import { createDocumentQueryContext, type DocumentQueryContext } from '../features/queryContext';
import { resolveServingReadiness } from '../features/servingReadiness';
import { getQueryConsumerPolicy, type QueryConsumerId } from '../features/queryScopePolicy';
import { RuntimeJournal } from '../runtime/runtimeJournal';
import {
  estimateLspPayloadBytes,
  type InteractiveServingFeature,
  type InteractiveServingReason,
  InteractiveServingStatsTracker,
} from '../runtime/interactiveServingStats';
import { CodeLensResultCache } from '../features/codeLensResultCache';
import { WorkspaceState } from '../workspace/workspaceState';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { HotContextCache } from '../knowledge/HotContextCache';
import { ServingCache } from '../knowledge/ServingCache';
import { DocumentCache } from '../knowledge/DocumentCache';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import type { DocumentationLocale } from '../knowledge/system/localization';
import { Entity, EntityKind } from '../knowledge/types';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ActiveDocumentServingSnapshot } from '../serving/activeDocumentServingSnapshot';
import { buildInteractiveServingCacheKey, buildInteractiveServingStaleKeyMatcher } from '../serving/cacheKeyContract';
import { recordInteractiveServingEvent, runInteractiveServingPipeline } from '../serving/interactiveServingPipeline';
import type { InteractiveServingRequestState, InteractiveServingStaleGuard } from '../serving/staleGuard';
import { formatHoverViewModel } from '../features/hoverFormat';
import type { HoverNegativeReason, HoverViewModel } from '../features/hoverViewModel';

type RuntimeProgressReadinessSnapshot = Parameters<typeof decideFeatureReadiness>[1];
type DefinitionCacheEntry = {
  result: ReturnType<typeof provideDefinition>;
  resolutionConfidence?: ReturnType<typeof createDocumentQueryContext>['resolutionConfidence'];
};

export const INTERACTIVE_TIMING_LOG_THRESHOLD_MS = 50;

const INTERACTIVE_SERVING_BUDGET_MS: Record<InteractiveServingFeature, number | undefined> = {
  hover: getQueryConsumerPolicy('hover').budgetMs,
  completion: getQueryConsumerPolicy('completion').budgetMs,
  'completion-resolve': getQueryConsumerPolicy('completion').budgetMs,
  signatureHelp: getQueryConsumerPolicy('signature-help').budgetMs,
  definition: getQueryConsumerPolicy('definition').budgetMs,
  references: getQueryConsumerPolicy('references').budgetMs,
  documentSymbols: undefined,
  semanticTokens: undefined,
};

const interactiveLoopGuard = new InteractiveLoopGuard();

export function shouldLogInteractiveTiming(elapsedMs: number): boolean {
  return elapsedMs >= INTERACTIVE_TIMING_LOG_THRESHOLD_MS;
}

export function buildCurrentServingRequestState(options: {
  feature: InteractiveServingFeature;
  document: TextDocument;
  knowledgeBase: KnowledgeBase;
  documentCache: Pick<DocumentCache, 'getSnapshot'>;
  inheritanceGraph: InheritanceGraph;
  systemCatalog: SystemCatalog;
  workspaceState: Pick<WorkspaceState, 'getSourceOrigin' | 'inferSourceOriginForUri'>;
  locale?: DocumentationLocale;
  contextKey?: string;
}): InteractiveServingRequestState {
  const snapshot = new ActiveDocumentServingSnapshot({
    document: options.document,
    knowledgeBase: options.knowledgeBase,
    documentCache: options.documentCache,
    inheritanceGraph: options.inheritanceGraph,
    systemCatalog: options.systemCatalog,
    workspaceState: options.workspaceState,
    ...(options.locale ? { locale: options.locale } : {}),
  });

  return {
    feature: options.feature,
    uri: snapshot.uri,
    documentVersion: snapshot.documentVersion,
    kbVersion: snapshot.kbVersion,
    documentFingerprint: snapshot.documentFingerprint,
    sourceOrigin: snapshot.sourceOrigin,
    locale: snapshot.locale,
    ...(options.contextKey ? { contextKey: options.contextKey } : {}),
  };
}

function buildInteractiveLoopGuardKey(
  feature: 'hover' | 'definition',
  document: TextDocument,
  position: { line: number; character: number },
): string {
  return `${feature}|${document.uri}|${document.version}|${position.line}:${position.character}`;
}

function runInteractiveWithLoopGuard<T>(options: {
  feature: 'hover' | 'definition';
  document: TextDocument;
  position: { line: number; character: number };
  connection: Connection;
  runtimeJournal: RuntimeJournal;
  execute: () => Promise<T> | T;
}): Promise<T> {
  const key = buildInteractiveLoopGuardKey(options.feature, options.document, options.position);
  return interactiveLoopGuard.run(key, options.execute, () => {
    options.connection.console.log(`[LSP] duplicate request reused ${options.feature} ${key}`);
    options.runtimeJournal.record({
      phase: 'serve',
      kind: options.feature,
      action: 'dedupe-hit',
      severity: 'info',
      label: key,
      detail: {
        feature: options.feature,
        uri: options.document.uri,
        documentVersion: options.document.version,
        position: options.position,
      },
    });
  });
}

function hasDefinitionResult(result: ReturnType<typeof provideDefinition>): boolean {
  if (!result) {
    return false;
  }

  return !Array.isArray(result) || result.length > 0;
}

function logInteractiveFeatureTiming(
  connection: Connection,
  featureLabel: string,
  elapsedMs: number,
  firstInvocation?: FirstInvocationTracker,
  firstInvocationKey?: string,
  firstInvocationLabel?: string,
  serverStartTime?: number,
): void {
  if (
    firstInvocation
    && firstInvocationKey
    && firstInvocationLabel
    && typeof serverStartTime === 'number'
    && firstInvocation.isFirst(firstInvocationKey)
  ) {
    const sinceStart = performance.now() - serverStartTime;
    connection.console.log(formatTiming(firstInvocationLabel, sinceStart));
  }

  if (shouldLogInteractiveTiming(elapsedMs)) {
    connection.console.log(formatTiming(featureLabel, elapsedMs));
  }
}

export interface FeatureHandlerContext {
  connection: Connection;
  documents: TextDocuments<TextDocument>;
  scheduler: TaskScheduler;
  firstInvocation: FirstInvocationTracker;
  runtimeJournal: RuntimeJournal;
  interactiveServingStats: InteractiveServingStatsTracker;
  documentCache: DocumentCache;
  servingStaleGuard: InteractiveServingStaleGuard;
  workspaceState: WorkspaceState;
  knowledgeBase: KnowledgeBase;
  inheritanceGraph: InheritanceGraph;
  systemCatalog: SystemCatalog;
  hotContextCache: HotContextCache;
  servingCache: ServingCache;
  serverStartTime: number;
  getDocumentationLocale(): DocumentationLocale;
  isSemanticallyServedDocument(document: TextDocument): boolean;
  buildRuntimeProgressReadiness(activeUriOverride?: string | null): RuntimeProgressReadinessSnapshot;
  ensureRuntimeMemoryPressureRelief(): unknown;
  isLatencyPressureHigh(): boolean;
  recordInteractiveLatency(feature: string, elapsedMs: number): void;
  cacheServingResultWithMemoryPressure(key: string, value: unknown): void;
  getHoverViewModelCacheEntry(key: string): HoverViewModel | undefined;
  cacheHoverViewModelWithMemoryPressure(key: string, value: HoverViewModel): void;
  getHoverNegativeCacheEntry(key: string): { reason: HoverNegativeReason } | undefined;
  cacheHoverNegativeWithMemoryPressure(key: string, value: { reason: HoverNegativeReason }): void;
  getCompletionResolveNegativeCacheEntry(key: string): { reason: CompletionResolveNegativeReason } | undefined;
  cacheCompletionResolveNegativeWithMemoryPressure(key: string, value: { reason: CompletionResolveNegativeReason }): void;
  getDefinitionNegativeCacheEntry(key: string): { reason: string } | undefined;
  cacheDefinitionNegativeWithMemoryPressure(key: string, value: { reason: string }): void;
  isDefinitionCacheEntry(value: unknown): value is DefinitionCacheEntry;
  collectReferenceSourcesForQuery(
    document: TextDocument,
    consumerId: QueryConsumerId,
    queryContext: DocumentQueryContext,
  ): Promise<Iterable<ReferenceSource>>;
  wordAt(line: string, character: number): { word: string; start: number; end: number } | null;
  codeLensCache: CodeLensResultCache<ReturnType<typeof provideReferenceCodeLenses>>;
  buildCodeLensCacheKey(document: TextDocument, readinessReason: string, readinessAction: string): string;
  makeCodeLensSymbolKey(entity: Entity): string;
  getCodeLensHierarchyMeta(entity: Entity): { relation?: 'override'; overrideCount: number };
  getCodeLensUnavailableReason(reason: string): string;
  buildCodeLensReferenceCounts(symbols: Array<{ key: string; entity: Entity }>): Promise<Map<string, number>>;
}

export function registerDocumentSymbolHandler(context: FeatureHandlerContext): void {
  const {
    connection,
    documents,
    scheduler,
    firstInvocation,
    runtimeJournal,
    serverStartTime,
    isSemanticallyServedDocument,
  } = context;

  connection.onDocumentSymbol((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return [];
    }
    if (!isSemanticallyServedDocument(document)) {
      return [];
    }

    try {
      return scheduler.runInteractive({
        id: `documentSymbols-${document.uri}`,
        priority: TaskPriority.Interactive,
        execute: () => {
          const { result, elapsedMs } = measureMs(() => extractDocumentSymbolsWithReconciliation(document));

          if (result.reconciliation.status !== 'healthy') {
            connection.console.warn(formatDocumentSymbolReconciliationReport(result.reconciliation));
            runtimeJournal.record({
              phase: 'serve',
              kind: 'documentSymbols',
              action: 'reconcile',
              severity: result.reconciliation.status,
              label: document.uri,
              detail: result.reconciliation,
            });
          }

          logInteractiveFeatureTiming(
            connection,
            'documentSymbols',
            elapsedMs,
            firstInvocation,
            'documentSymbols',
            'Primer documentSymbols (desde el inicio)',
            serverStartTime,
          );
          return result.symbols;
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      connection.console.error(`[ERROR] documentSymbols: ${message}`);
      return [];
    }
  });
}

export function registerCodeActionHandler(context: FeatureHandlerContext): void {
  const { connection, documents, workspaceState, isSemanticallyServedDocument } = context;

  connection.onCodeAction((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];
    if (!isSemanticallyServedDocument(document)) return [];
    try {
      return provideCodeActions(
        params.textDocument.uri,
        document.getText(),
        params.context.diagnostics ?? [],
        {
          sourceOrigin: workspaceState.getSourceOrigin(params.textDocument.uri),
        }
      );
    } catch (error) {
      connection.console.error(`[ERROR] codeAction: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  });
}

export function registerWorkspaceSymbolHandler(context: FeatureHandlerContext): void {
  const { connection, knowledgeBase } = context;

  connection.onWorkspaceSymbol((params) => {
    try {
      const { result, elapsedMs } = measureMs(() => provideWorkspaceSymbols(params.query, knowledgeBase));
      logInteractiveFeatureTiming(connection, 'workspaceSymbol', elapsedMs);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      connection.console.error(`[ERROR] workspaceSymbol: ${message}`);
      return [];
    }
  });
}

export function registerHoverHandler(context: FeatureHandlerContext): void {
  const {
    connection,
    documents,
    scheduler,
    knowledgeBase,
    systemCatalog,
    inheritanceGraph,
    hotContextCache,
    servingCache,
    firstInvocation,
    runtimeJournal,
    interactiveServingStats,
    documentCache,
    servingStaleGuard,
    workspaceState,
    serverStartTime,
    getDocumentationLocale,
    buildRuntimeProgressReadiness,
    ensureRuntimeMemoryPressureRelief,
    isLatencyPressureHigh,
    recordInteractiveLatency,
    cacheServingResultWithMemoryPressure,
    getHoverViewModelCacheEntry,
    cacheHoverViewModelWithMemoryPressure,
    getHoverNegativeCacheEntry,
    cacheHoverNegativeWithMemoryPressure,
    isSemanticallyServedDocument,
  } = context;

  connection.onHover((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return null;
    }
    if (!isSemanticallyServedDocument(document)) {
      return null;
    }

    try {
      return runInteractiveWithLoopGuard({
        feature: 'hover',
        document,
        position: params.position,
        connection,
        runtimeJournal,
        execute: () => scheduler.runInteractive({
          id: `hover-${document.uri}`,
          priority: TaskPriority.Interactive,
          execute: (token) => {
            const documentationLocale = getDocumentationLocale();
            const readinessDecision = decideFeatureReadiness('hover', buildRuntimeProgressReadiness(document.uri), {
              latencyOverloaded: isLatencyPressureHigh()
            });
            hotContextCache.setActive(document.uri, knowledgeBase.version);
            const snapshot = new ActiveDocumentServingSnapshot({
              document,
              knowledgeBase,
              documentCache,
              hotContextCache,
              inheritanceGraph,
              systemCatalog,
              workspaceState,
              locale: documentationLocale,
            });
            const cacheKey = snapshot.buildCacheKey('hover', {
              cacheClass: 'serving',
              pressureClass: 'hot',
              line: params.position.line,
              character: params.position.character,
            });
            const hoverToken = snapshot.getTokenAt(params.position);
            const hoverContextKey = hoverToken
              ? `${params.position.line}:${hoverToken.start}-${hoverToken.end}:${hoverToken.word.toLowerCase()}`
              : `${params.position.line}:${params.position.character}`;
            const hoverViewModelCacheKey = snapshot.buildCacheKey('hover-view-model', {
              cacheClass: 'view-model',
              pressureClass: 'hot',
              line: params.position.line,
              character: params.position.character,
              ...(hoverToken ? {
                rangeStartLine: params.position.line,
                rangeStartCharacter: hoverToken.start,
                rangeEndLine: params.position.line,
                rangeEndCharacter: hoverToken.end,
                context: hoverToken.word.toLowerCase(),
              } : {
                context: 'cursor',
              }),
            });
            const hoverNegativeCacheKey = snapshot.buildCacheKey('hover-negative', {
              cacheClass: 'negative',
              pressureClass: 'negative',
              line: params.position.line,
              character: params.position.character,
              ...(hoverToken ? {
                rangeStartLine: params.position.line,
                rangeStartCharacter: hoverToken.start,
                rangeEndLine: params.position.line,
                rangeEndCharacter: hoverToken.end,
                context: hoverToken.word.toLowerCase(),
              } : {
                context: 'cursor',
              }),
            });

            return runInteractiveServingPipeline({
              feature: 'hover',
              cacheKey,
              readiness: {
                action: readinessDecision.action,
                reason: readinessDecision.reason,
                blockedResult: null,
                warningMessage: `[hover] bloqueado: ${readinessDecision.reason}`,
              },
              requestState: {
                feature: 'hover',
                uri: snapshot.uri,
                documentVersion: snapshot.documentVersion,
                kbVersion: snapshot.kbVersion,
                documentFingerprint: snapshot.documentFingerprint,
                sourceOrigin: snapshot.sourceOrigin,
                locale: snapshot.locale,
                contextKey: hoverContextKey,
              },
              readCurrentState: () => buildCurrentServingRequestState({
                feature: 'hover',
                document,
                knowledgeBase,
                documentCache,
                inheritanceGraph,
                systemCatalog,
                workspaceState,
                locale: documentationLocale,
                contextKey: hoverContextKey,
              }),
              staleGuard: servingStaleGuard,
              runtimeJournal,
              interactiveServingStats,
              budgetMs: INTERACTIVE_SERVING_BUDGET_MS.hover,
              kbVersion: snapshot.kbVersion,
              documentFingerprint: snapshot.documentFingerprint,
              locale: snapshot.locale,
              cancellationToken: token,
              ensureRuntimeMemoryPressureRelief,
              getCachedResult: () => servingCache.get(cacheKey) as ReturnType<typeof provideHover> | undefined,
              getStaleResult: () => {
                const matcher = buildInteractiveServingStaleKeyMatcher({
                  cacheClass: 'serving',
                  feature: 'hover',
                  pressureClass: 'hot',
                  uri: snapshot.uri,
                  documentVersion: snapshot.documentVersion,
                  kbVersion: snapshot.kbVersion,
                  documentFingerprint: snapshot.documentFingerprint,
                  sourceOrigin: snapshot.sourceOrigin,
                  locale: snapshot.locale,
                  line: params.position.line,
                  character: params.position.character,
                });
                return servingCache.getStale('hover', matcher) as ReturnType<typeof provideHover> | undefined;
              },
              resolveEarlyResult: () => {
                const cachedNegative = getHoverNegativeCacheEntry(hoverNegativeCacheKey);
                if (cachedNegative) {
                  connection.console.log(`[LSP] negative-cache hit hover ${cachedNegative.reason}`);
                  return {
                    handled: true,
                    reason: 'negative-hit',
                    result: null,
                    skipCacheWrite: true,
                  } as const;
                }

                const cachedViewModel = getHoverViewModelCacheEntry(hoverViewModelCacheKey);
                if (!cachedViewModel) {
                  return undefined;
                }

                const formatterStartedAt = performance.now();
                return {
                  handled: true,
                  reason: 'viewmodel-hit',
                  result: {
                    contents: {
                      kind: 'markdown',
                      value: formatHoverViewModel(cachedViewModel),
                    }
                  },
                  formatterMs: performance.now() - formatterStartedAt,
                } as const;
              },
              resolve: () => buildHoverPresentationResult(
                document,
                params.position,
                knowledgeBase,
                systemCatalog,
                inheritanceGraph,
                hotContextCache,
                documentationLocale,
                snapshot,
              ),
              onResolved: (resolved) => {
                const presentation = resolved as ReturnType<typeof buildHoverPresentationResult>;
                if (presentation.kind === 'viewmodel') {
                  cacheHoverViewModelWithMemoryPressure(hoverViewModelCacheKey, presentation.viewModel);
                  return;
                }

                connection.console.log(`[LSP] provider returned null hover ${presentation.reason}`);
                cacheHoverNegativeWithMemoryPressure(hoverNegativeCacheKey, { reason: presentation.reason });
              },
              format: (resolved) => {
                const presentation = resolved as ReturnType<typeof buildHoverPresentationResult>;
                if (presentation.kind === 'negative') {
                  return null;
                }

                return {
                  contents: {
                    kind: 'markdown',
                    value: formatHoverViewModel(presentation.viewModel),
                  }
                };
              },
              shouldWriteCache: (_result, resolved) => (resolved as ReturnType<typeof buildHoverPresentationResult>).kind === 'viewmodel',
              writeCache: (value) => cacheServingResultWithMemoryPressure(cacheKey, value),
              onBlocked: (message) => connection.console.warn(message),
              onComputed: (_result, telemetry) => {
                recordInteractiveLatency('hover', telemetry.totalMs);
                logInteractiveFeatureTiming(
                  connection,
                  'hover',
                  telemetry.totalMs,
                  firstInvocation,
                  'hover',
                  'Primer hover (desde el inicio)',
                  serverStartTime,
                );
              },
            });
          }
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      connection.console.error(`[ERROR] hover: ${message}`);
      return null;
    }
  });
}

export function registerSignatureHelpHandler(context: FeatureHandlerContext): void {
  const {
    connection,
    documents,
    scheduler,
    knowledgeBase,
    systemCatalog,
    inheritanceGraph,
    hotContextCache,
    servingCache,
    firstInvocation,
    runtimeJournal,
    interactiveServingStats,
    documentCache,
    servingStaleGuard,
    workspaceState,
    serverStartTime,
    getDocumentationLocale,
    buildRuntimeProgressReadiness,
    ensureRuntimeMemoryPressureRelief,
    isLatencyPressureHigh,
    recordInteractiveLatency,
    cacheServingResultWithMemoryPressure,
    getCompletionResolveNegativeCacheEntry,
    cacheCompletionResolveNegativeWithMemoryPressure,
    isSemanticallyServedDocument,
  } = context;

  connection.onSignatureHelp((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return null;
    }
    if (!isSemanticallyServedDocument(document)) {
      return null;
    }

    try {
      return scheduler.runInteractive({
        id: `signatureHelp-${document.uri}`,
        priority: TaskPriority.Interactive,
        execute: (token) => {
          const documentationLocale = getDocumentationLocale();
          hotContextCache.setActive(document.uri, knowledgeBase.version);
          const snapshot = new ActiveDocumentServingSnapshot({
            document,
            knowledgeBase,
            documentCache,
            hotContextCache,
            inheritanceGraph,
            systemCatalog,
            workspaceState,
            locale: documentationLocale,
          });
          const cacheKey = snapshot.buildCacheKey('signatureHelp', {
            cacheClass: 'serving',
            pressureClass: 'hot',
            line: params.position.line,
            character: params.position.character,
          });
          const readiness = resolveServingReadiness({
            feature: 'signature-help',
            consumerLabel: 'signatureHelp',
            snapshot: buildRuntimeProgressReadiness(document.uri),
            blockedResult: null,
            context: {
              latencyOverloaded: isLatencyPressureHigh()
            }
          });

          return runInteractiveServingPipeline({
            feature: 'signatureHelp',
            cacheKey,
            readiness: {
              action: readiness.decision.action,
              reason: readiness.decision.reason,
              blocked: readiness.blocked,
              blockedResult: readiness.blocked ? readiness.blockedResult : null,
              warningMessage: readiness.blocked ? readiness.warningMessage : undefined,
            },
            requestState: {
              feature: 'signatureHelp',
              uri: snapshot.uri,
              documentVersion: snapshot.documentVersion,
              kbVersion: snapshot.kbVersion,
              documentFingerprint: snapshot.documentFingerprint,
              sourceOrigin: snapshot.sourceOrigin,
              locale: snapshot.locale,
              contextKey: `${params.position.line}:${params.position.character}`,
            },
            readCurrentState: () => buildCurrentServingRequestState({
              feature: 'signatureHelp',
              document,
              knowledgeBase,
              documentCache,
              inheritanceGraph,
              systemCatalog,
              workspaceState,
              locale: documentationLocale,
              contextKey: `${params.position.line}:${params.position.character}`,
            }),
            staleGuard: servingStaleGuard,
            runtimeJournal,
            interactiveServingStats,
            budgetMs: INTERACTIVE_SERVING_BUDGET_MS.signatureHelp,
            kbVersion: snapshot.kbVersion,
            documentFingerprint: snapshot.documentFingerprint,
            locale: snapshot.locale,
            cancellationToken: token,
            ensureRuntimeMemoryPressureRelief,
            allowCachedWhileBlocked: false,
            getCachedResult: () => servingCache.get(cacheKey) as ReturnType<typeof provideSignatureHelp> | undefined,
            getStaleResult: () => {
              const matcher = buildInteractiveServingStaleKeyMatcher({
                cacheClass: 'serving',
                feature: 'signatureHelp',
                pressureClass: 'hot',
                uri: snapshot.uri,
                documentVersion: snapshot.documentVersion,
                kbVersion: snapshot.kbVersion,
                documentFingerprint: snapshot.documentFingerprint,
                sourceOrigin: snapshot.sourceOrigin,
                locale: snapshot.locale,
                line: params.position.line,
                character: params.position.character,
              });
              return servingCache.getStale('signatureHelp', matcher) as ReturnType<typeof provideSignatureHelp> | undefined;
            },
            execute: () => provideSignatureHelp(document, params.position, knowledgeBase, systemCatalog, inheritanceGraph, hotContextCache, documentationLocale),
            writeCache: (value) => cacheServingResultWithMemoryPressure(cacheKey, value),
            onBlocked: (message) => connection.console.warn(message),
            onComputed: (_result, telemetry) => {
              recordInteractiveLatency('signatureHelp', telemetry.totalMs);
              logInteractiveFeatureTiming(
                connection,
                'signatureHelp',
                telemetry.totalMs,
                firstInvocation,
                'signatureHelp',
                'Primer signatureHelp (desde el inicio)',
                serverStartTime,
              );
            },
          });
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      connection.console.error(`[ERROR] signatureHelp: ${message}`);
      return null;
    }
  });
}

export function registerCompletionHandler(context: FeatureHandlerContext): void {
  const {
    connection,
    documents,
    scheduler,
    knowledgeBase,
    systemCatalog,
    inheritanceGraph,
    hotContextCache,
    servingCache,
    firstInvocation,
    runtimeJournal,
    interactiveServingStats,
    documentCache,
    servingStaleGuard,
    workspaceState,
    serverStartTime,
    getDocumentationLocale,
    buildRuntimeProgressReadiness,
    ensureRuntimeMemoryPressureRelief,
    isLatencyPressureHigh,
    recordInteractiveLatency,
    cacheServingResultWithMemoryPressure,
    getCompletionResolveNegativeCacheEntry,
    cacheCompletionResolveNegativeWithMemoryPressure,
    isSemanticallyServedDocument,
  } = context;

  connection.onCompletion((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return null;
    }
    if (!isSemanticallyServedDocument(document)) {
      return null;
    }

    try {
      return scheduler.runInteractive({
        id: `completion-${document.uri}`,
        priority: TaskPriority.Interactive,
        execute: (token) => {
          const readinessDecision = decideFeatureReadiness('completion', buildRuntimeProgressReadiness(document.uri), {
            latencyOverloaded: isLatencyPressureHigh()
          });
          const documentationLocale = getDocumentationLocale();
          hotContextCache.setActive(document.uri, knowledgeBase.version);
          const snapshot = new ActiveDocumentServingSnapshot({
            document,
            knowledgeBase,
            documentCache,
            hotContextCache,
            inheritanceGraph,
            systemCatalog,
            workspaceState,
            locale: documentationLocale,
          });
          const cacheKey = snapshot.buildCacheKey('completion', {
            cacheClass: 'serving',
            pressureClass: 'heavy',
            line: params.position.line,
            character: params.position.character,
            triggerKind: params.context?.triggerKind,
            triggerCharacter: params.context?.triggerCharacter,
          });

          return runInteractiveServingPipeline({
            feature: 'completion',
            cacheKey,
            readiness: {
              action: readinessDecision.action,
              reason: readinessDecision.reason,
              blockedResult: null,
              warningMessage: `[completion] bloqueado: ${readinessDecision.reason}`,
            },
            requestState: {
              feature: 'completion',
              uri: snapshot.uri,
              documentVersion: snapshot.documentVersion,
              kbVersion: snapshot.kbVersion,
              documentFingerprint: snapshot.documentFingerprint,
              sourceOrigin: snapshot.sourceOrigin,
              locale: snapshot.locale,
              contextKey: `${params.position.line}:${params.position.character}:${params.context?.triggerKind ?? ''}:${params.context?.triggerCharacter ?? ''}`,
            },
            readCurrentState: () => buildCurrentServingRequestState({
              feature: 'completion',
              document,
              knowledgeBase,
              documentCache,
              inheritanceGraph,
              systemCatalog,
              workspaceState,
              locale: documentationLocale,
              contextKey: `${params.position.line}:${params.position.character}:${params.context?.triggerKind ?? ''}:${params.context?.triggerCharacter ?? ''}`,
            }),
            staleGuard: servingStaleGuard,
            runtimeJournal,
            interactiveServingStats,
            budgetMs: INTERACTIVE_SERVING_BUDGET_MS.completion,
            kbVersion: snapshot.kbVersion,
            documentFingerprint: snapshot.documentFingerprint,
            locale: snapshot.locale,
            cancellationToken: token,
            ensureRuntimeMemoryPressureRelief,
            getCachedResult: () => servingCache.get(cacheKey) as ReturnType<typeof provideCompletion> | undefined,
            getStaleResult: () => {
              const matcher = buildInteractiveServingStaleKeyMatcher({
                cacheClass: 'serving',
                feature: 'completion',
                pressureClass: 'heavy',
                uri: snapshot.uri,
                documentVersion: snapshot.documentVersion,
                kbVersion: snapshot.kbVersion,
                documentFingerprint: snapshot.documentFingerprint,
                sourceOrigin: snapshot.sourceOrigin,
                locale: snapshot.locale,
                line: params.position.line,
                character: params.position.character,
                triggerKind: params.context?.triggerKind,
                triggerCharacter: params.context?.triggerCharacter,
              });
              return servingCache.getStale('completion', matcher) as ReturnType<typeof provideCompletion> | undefined;
            },
            execute: () => provideCompletion(
              document,
              params.position,
              knowledgeBase,
              systemCatalog,
              inheritanceGraph,
              hotContextCache,
              knowledgeBase.version,
              documentationLocale,
              { sourceOrigin: snapshot.sourceOrigin },
            ),
            writeCache: (value) => cacheServingResultWithMemoryPressure(cacheKey, value),
            onBlocked: (message) => connection.console.warn(message),
            onComputed: (_result, telemetry) => {
              recordInteractiveLatency('completion', telemetry.totalMs);
              logInteractiveFeatureTiming(
                connection,
                'completion',
                telemetry.totalMs,
                firstInvocation,
                'completion',
                'Primer completion (desde el inicio)',
                serverStartTime,
              );
            },
          });
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      connection.console.error(`[ERROR] completion: ${message}`);
      return null;
    }
  });

  connection.onCompletionResolve((item) => {
    const data = isCompletionItemResolveData(item.data) ? item.data : null;
    if (!data) {
      return item;
    }

    const document = documents.get(data.uri);
    if (!document) {
      return item;
    }
    if (!isSemanticallyServedDocument(document)) {
      return item;
    }

    try {
      return scheduler.runInteractive({
        id: `completion-resolve-${document.uri}`,
        priority: TaskPriority.Interactive,
        execute: (token) => {
          const documentationLocale = getDocumentationLocale();
          const readinessDecision = decideFeatureReadiness('completion', buildRuntimeProgressReadiness(document.uri), {
            latencyOverloaded: isLatencyPressureHigh(),
          });
          const contextKey = data.source === 'system'
            ? `system:${data.symbolId}`
            : `entity:${data.entityUri}:${data.entityId}:${data.line}:${data.character}`;
          const cacheKey = buildInteractiveServingCacheKey({
            cacheClass: 'serving',
            feature: 'completion-resolve',
            pressureClass: 'hot',
            uri: data.uri,
            documentVersion: data.documentVersion,
            kbVersion: data.kbVersion,
            documentFingerprint: data.documentFingerprint,
            sourceOrigin: data.sourceOrigin,
            locale: documentationLocale,
            context: contextKey,
          });
          const completionResolveNegativeCacheKey = buildInteractiveServingCacheKey({
            cacheClass: 'negative',
            feature: 'completion-resolve',
            pressureClass: 'negative',
            uri: data.uri,
            documentVersion: data.documentVersion,
            kbVersion: data.kbVersion,
            documentFingerprint: data.documentFingerprint,
            sourceOrigin: data.sourceOrigin,
            locale: documentationLocale,
            context: contextKey,
          });

          return runInteractiveServingPipeline({
            feature: 'completion-resolve',
            cacheKey,
            readiness: {
              action: readinessDecision.action,
              reason: readinessDecision.reason,
              blockedResult: item,
              warningMessage: `[completion-resolve] bloqueado: ${readinessDecision.reason}`,
            },
            requestState: {
              feature: 'completion-resolve',
              uri: data.uri,
              documentVersion: data.documentVersion,
              kbVersion: data.kbVersion,
              documentFingerprint: data.documentFingerprint,
              sourceOrigin: data.sourceOrigin,
              locale: data.locale,
              contextKey,
            },
            readCurrentState: () => buildCurrentServingRequestState({
              feature: 'completion-resolve',
              document,
              knowledgeBase,
              documentCache,
              inheritanceGraph,
              systemCatalog,
              workspaceState,
              locale: documentationLocale,
              contextKey,
            }),
            staleGuard: servingStaleGuard,
            runtimeJournal,
            interactiveServingStats,
            budgetMs: INTERACTIVE_SERVING_BUDGET_MS['completion-resolve'],
            kbVersion: data.kbVersion,
            documentFingerprint: data.documentFingerprint,
            locale: data.locale,
            payloadBudgetFeature: 'completion-resolve',
            cancellationToken: token,
            ensureRuntimeMemoryPressureRelief,
            getCachedResult: () => servingCache.get(cacheKey) as CompletionItem | undefined,
            resolveEarlyResult: () => {
              if (!getCompletionResolveNegativeCacheEntry(completionResolveNegativeCacheKey)) {
                return undefined;
              }

              return {
                handled: true,
                reason: 'negative-hit',
                result: item,
                skipCacheWrite: true,
              } as const;
            },
            resolve: () => resolveCompletionItemResult(item, knowledgeBase, systemCatalog, documentationLocale),
            onResolved: (resolved) => {
              const result = resolved as CompletionItemResolveResult;
              if (!result.resolved && result.negativeReason) {
                cacheCompletionResolveNegativeWithMemoryPressure(completionResolveNegativeCacheKey, {
                  reason: result.negativeReason,
                });
              }
            },
            format: (resolved) => (resolved as CompletionItemResolveResult).item,
            shouldWriteCache: (_result, resolved) => (resolved as CompletionItemResolveResult).resolved,
            writeCache: (value) => cacheServingResultWithMemoryPressure(cacheKey, value),
            onBlocked: (message) => connection.console.warn(message),
            onComputed: (_result, telemetry) => {
              recordInteractiveLatency('completion-resolve', telemetry.totalMs);
              logInteractiveFeatureTiming(
                connection,
                'completion-resolve',
                telemetry.totalMs,
                firstInvocation,
                'completion-resolve',
                'Primer completion resolve (desde el inicio)',
                serverStartTime,
              );
            },
          });
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      connection.console.error(`[ERROR] completion-resolve: ${message}`);
      return item;
    }
  });
}

export function registerDefinitionHandler(context: FeatureHandlerContext): void {
  const {
    connection,
    documents,
    scheduler,
    knowledgeBase,
    systemCatalog,
    inheritanceGraph,
    hotContextCache,
    servingCache,
    firstInvocation,
    runtimeJournal,
    interactiveServingStats,
    documentCache,
    servingStaleGuard,
    workspaceState,
    serverStartTime,
    buildRuntimeProgressReadiness,
    ensureRuntimeMemoryPressureRelief,
    isLatencyPressureHigh,
    recordInteractiveLatency,
    cacheServingResultWithMemoryPressure,
    getDefinitionNegativeCacheEntry,
    cacheDefinitionNegativeWithMemoryPressure,
    isDefinitionCacheEntry,
    isSemanticallyServedDocument,
  } = context;

  connection.onDefinition((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return null;
    }
    if (!isSemanticallyServedDocument(document)) {
      return null;
    }

    try {
      return runInteractiveWithLoopGuard({
        feature: 'definition',
        document,
        position: params.position,
        connection,
        runtimeJournal,
        execute: () => scheduler.runInteractive({
          id: `definition-${document.uri}`,
          priority: TaskPriority.Interactive,
          execute: (token) => {
            const runtimeReadiness = buildRuntimeProgressReadiness(document.uri);
            hotContextCache.setActive(document.uri, knowledgeBase.version);
            const snapshot = new ActiveDocumentServingSnapshot({
              document,
              knowledgeBase,
              documentCache,
              hotContextCache,
              inheritanceGraph,
              systemCatalog,
              workspaceState,
            });
            const contextKey = `${params.position.line}:${params.position.character}`;
            const requestState = {
              feature: 'definition' as const,
              uri: snapshot.uri,
              documentVersion: snapshot.documentVersion,
              kbVersion: snapshot.kbVersion,
              documentFingerprint: snapshot.documentFingerprint,
              sourceOrigin: snapshot.sourceOrigin,
              locale: snapshot.locale,
              contextKey,
            };
            const readCurrentState = () => buildCurrentServingRequestState({
              feature: 'definition',
              document,
              knowledgeBase,
              documentCache,
              inheritanceGraph,
              systemCatalog,
              workspaceState,
              locale: snapshot.locale,
              contextKey,
            });
            const requestToken = servingStaleGuard.begin(requestState);
            const cacheKey = snapshot.buildCacheKey('definition', {
              cacheClass: 'serving',
              pressureClass: 'hot',
              line: params.position.line,
              character: params.position.character,
            });
            const definitionNegativeCacheKey = snapshot.buildCacheKey('definition', {
              cacheClass: 'negative',
              pressureClass: 'negative',
              line: params.position.line,
              character: params.position.character,
            });
            ensureRuntimeMemoryPressureRelief();
            const cacheLookupStartedAt = performance.now();
            const cachedNegative = getDefinitionNegativeCacheEntry(definitionNegativeCacheKey);
            if (cachedNegative) {
              connection.console.log(`[LSP] negative-cache hit definition ${cachedNegative.reason}`);
              recordInteractiveServingEvent(runtimeJournal, interactiveServingStats, {
                feature: 'definition',
                reason: 'negative-hit',
                totalMs: performance.now() - cacheLookupStartedAt,
                kbVersion: knowledgeBase.version,
                documentFingerprint: snapshot.documentFingerprint,
              });
              return null;
            }
            const cached = servingCache.get(cacheKey);
            if (isDefinitionCacheEntry(cached)) {
              const readiness = resolveServingReadiness({
                feature: 'definition',
                consumerLabel: 'definition',
                snapshot: runtimeReadiness,
                blockedResult: null,
                context: {
                  latencyOverloaded: isLatencyPressureHigh(),
                  resolutionConfidence: cached.resolutionConfidence
                }
              });
              if (readiness.blocked) {
                connection.console.warn(readiness.warningMessage);
                recordInteractiveServingEvent(runtimeJournal, interactiveServingStats, {
                  feature: 'definition',
                  reason: 'blocked',
                  totalMs: performance.now() - cacheLookupStartedAt,
                  kbVersion: knowledgeBase.version,
                  documentFingerprint: snapshot.documentFingerprint,
                  readinessAction: readiness.decision.action,
                  readinessReason: readiness.decision.reason,
                });
                return readiness.blockedResult;
              }
              recordInteractiveServingEvent(runtimeJournal, interactiveServingStats, {
                feature: 'definition',
                reason: 'cache-hit',
                totalMs: performance.now() - cacheLookupStartedAt,
                payloadBytes: estimateLspPayloadBytes(cached.result),
                kbVersion: knowledgeBase.version,
                documentFingerprint: snapshot.documentFingerprint,
                readinessAction: readiness.decision.action,
                readinessReason: readiness.decision.reason,
              });
              return cached.result;
            }

            const queryContext = createDocumentQueryContext(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache, 'definition', 'definition');
            const readinessDecision = decideFeatureReadiness('definition', runtimeReadiness, {
              latencyOverloaded: isLatencyPressureHigh(),
              resolutionConfidence: queryContext.resolutionConfidence
            });

            if (readinessDecision.action === 'block') {
              connection.console.log(`[LSP] provider returned null definition ${readinessDecision.reason}`);
              cacheDefinitionNegativeWithMemoryPressure(definitionNegativeCacheKey, { reason: readinessDecision.reason });
              connection.console.warn(`[definition] bloqueado: ${readinessDecision.reason}`);
              recordInteractiveServingEvent(runtimeJournal, interactiveServingStats, {
                feature: 'definition',
                reason: 'blocked',
                totalMs: 0,
                kbVersion: knowledgeBase.version,
                documentFingerprint: snapshot.documentFingerprint,
                readinessAction: readinessDecision.action,
                readinessReason: readinessDecision.reason,
              });
              return null;
            }

            const { result, elapsedMs } = measureMs(() => provideDefinition(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache, queryContext, systemCatalog));
            recordInteractiveLatency('definition', elapsedMs);

            logInteractiveFeatureTiming(
              connection,
              'definition',
              elapsedMs,
              firstInvocation,
              'definition',
              'Primera definición (desde el inicio)',
              serverStartTime,
            );
            const cacheEntry = {
              result,
              resolutionConfidence: queryContext.resolutionConfidence
            };
            if (!hasDefinitionResult(result)) {
              const staleBeforeNegativeWrite = servingStaleGuard.check(requestToken, readCurrentState(), token);
              if (staleBeforeNegativeWrite.stale) {
                recordInteractiveServingEvent(runtimeJournal, interactiveServingStats, {
                  feature: 'definition',
                  reason: 'stale-discarded',
                  totalMs: elapsedMs,
                  providerMs: elapsedMs,
                  kbVersion: knowledgeBase.version,
                  documentFingerprint: snapshot.documentFingerprint,
                  readinessAction: readinessDecision.action,
                  readinessReason: readinessDecision.reason,
                  staleReason: staleBeforeNegativeWrite.reason,
                });
                return null;
              }

              connection.console.log('[LSP] provider returned null definition unresolved');
              cacheDefinitionNegativeWithMemoryPressure(definitionNegativeCacheKey, { reason: 'unresolved' });
              recordInteractiveServingEvent(runtimeJournal, interactiveServingStats, {
                feature: 'definition',
                reason: 'miss',
                totalMs: elapsedMs,
                providerMs: elapsedMs,
                kbVersion: knowledgeBase.version,
                documentFingerprint: snapshot.documentFingerprint,
                readinessAction: readinessDecision.action,
                readinessReason: readinessDecision.reason,
              });
              return null;
            }
            const staleBeforeWrite = servingStaleGuard.check(requestToken, readCurrentState(), token);
            if (staleBeforeWrite.stale) {
              recordInteractiveServingEvent(runtimeJournal, interactiveServingStats, {
                feature: 'definition',
                reason: 'stale-discarded',
                totalMs: elapsedMs,
                providerMs: elapsedMs,
                kbVersion: knowledgeBase.version,
                documentFingerprint: snapshot.documentFingerprint,
                readinessAction: readinessDecision.action,
                readinessReason: readinessDecision.reason,
                staleReason: staleBeforeWrite.reason,
              });
              return null;
            }
            const cacheWriteStartedAt = performance.now();
            cacheServingResultWithMemoryPressure(cacheKey, cacheEntry);
            const cacheWriteMs = performance.now() - cacheWriteStartedAt;
            const staleBeforeReturn = servingStaleGuard.check(requestToken, readCurrentState(), token);
            if (staleBeforeReturn.stale) {
              recordInteractiveServingEvent(runtimeJournal, interactiveServingStats, {
                feature: 'definition',
                reason: 'stale-discarded',
                totalMs: elapsedMs + cacheWriteMs,
                providerMs: elapsedMs,
                cacheWriteMs,
                kbVersion: knowledgeBase.version,
                documentFingerprint: snapshot.documentFingerprint,
                readinessAction: readinessDecision.action,
                readinessReason: readinessDecision.reason,
                staleReason: staleBeforeReturn.reason,
              });
              return null;
            }
            recordInteractiveServingEvent(runtimeJournal, interactiveServingStats, {
              feature: 'definition',
              reason: 'miss',
              totalMs: elapsedMs + cacheWriteMs,
              providerMs: elapsedMs,
              cacheWriteMs,
              payloadBytes: estimateLspPayloadBytes(result),
              kbVersion: knowledgeBase.version,
              documentFingerprint: snapshot.documentFingerprint,
              readinessAction: readinessDecision.action,
              readinessReason: readinessDecision.reason,
            });
            return result;
          }
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      connection.console.error(`[ERROR] definition: ${message}`);
      return null;
    }
  });
}

export function registerReferencesHandler(context: FeatureHandlerContext): void {
  const {
    connection,
    documents,
    knowledgeBase,
    inheritanceGraph,
    hotContextCache,
    buildRuntimeProgressReadiness,
    isLatencyPressureHigh,
    recordInteractiveLatency,
    collectReferenceSourcesForQuery,
    isSemanticallyServedDocument,
  } = context;

  connection.onReferences(async (params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;
    if (!isSemanticallyServedDocument(document)) return [];
    try {
      hotContextCache.setActive(document.uri, knowledgeBase.version);
      const queryContext = createDocumentQueryContext(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache, 'references', 'references');
      const readiness = resolveServingReadiness({
        feature: 'references',
        consumerLabel: 'references',
        snapshot: buildRuntimeProgressReadiness(document.uri),
        blockedResult: [],
        context: {
          latencyOverloaded: isLatencyPressureHigh(),
          resolutionConfidence: queryContext.resolutionConfidence
        }
      });
      if (readiness.blocked) {
        connection.console.warn(readiness.warningMessage);
        return readiness.blockedResult;
      }
      const sources = await collectReferenceSourcesForQuery(document, 'references', queryContext);
      const { result, elapsedMs } = measureMs(() =>
        provideReferences(
          document,
          params.position,
          knowledgeBase,
          inheritanceGraph,
          sources,
          {
            includeDeclaration: params.context?.includeDeclaration ?? true
          },
          hotContextCache,
          queryContext
        )
      );
      recordInteractiveLatency('references', elapsedMs);
      logInteractiveFeatureTiming(connection, 'references', elapsedMs);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      connection.console.error(`[ERROR] references: ${message}`);
      return null;
    }
  });
}

export function registerRenameHandlers(context: FeatureHandlerContext): void {
  const {
    connection,
    documents,
    knowledgeBase,
    inheritanceGraph,
    systemCatalog,
    hotContextCache,
    buildRuntimeProgressReadiness,
    isLatencyPressureHigh,
    collectReferenceSourcesForQuery,
    wordAt,
    isSemanticallyServedDocument,
  } = context;

  connection.onPrepareRename((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;
    if (!isSemanticallyServedDocument(document)) return null;
    hotContextCache.setActive(document.uri, knowledgeBase.version);
    const queryContext = createDocumentQueryContext(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache, 'rename-prepare', 'rename-prepare');
    const readiness = resolveServingReadiness({
      feature: 'rename',
      consumerLabel: 'rename',
      snapshot: buildRuntimeProgressReadiness(document.uri),
      blockedResult: null,
      context: {
        latencyOverloaded: isLatencyPressureHigh(),
        resolutionConfidence: queryContext.resolutionConfidence
      }
    });
    if (readiness.blocked) {
      connection.console.warn(readiness.warningMessage);
      return readiness.blockedResult;
    }
    const line = document.getText().split(/\r?\n/)[params.position.line] ?? '';
    const match = wordAt(line, params.position.character);
    if (!match) return null;
    return {
      range: {
        start: { line: params.position.line, character: match.start },
        end: { line: params.position.line, character: match.end }
      },
      placeholder: match.word
    };
  });

  connection.onRenameRequest(async (params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;
    if (!isSemanticallyServedDocument(document)) return null;
    hotContextCache.setActive(document.uri, knowledgeBase.version);
    const queryContext = createDocumentQueryContext(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache, 'rename', 'rename');
    const readiness = resolveServingReadiness({
      feature: 'rename',
      consumerLabel: 'rename',
      snapshot: buildRuntimeProgressReadiness(document.uri),
      blockedResult: null,
      context: {
        latencyOverloaded: isLatencyPressureHigh(),
        resolutionConfidence: queryContext.resolutionConfidence
      }
    });
    if (readiness.blocked) {
      connection.console.warn(readiness.warningMessage);
      return readiness.blockedResult;
    }
    const rename = provideRename(
      document,
      params.position,
      params.newName,
      knowledgeBase,
      inheritanceGraph,
      await collectReferenceSourcesForQuery(document, 'rename', queryContext),
      systemCatalog,
      hotContextCache,
      queryContext
    );
    if (!rename.edit) {
      if (rename.reason) {
        connection.console.warn(`[rename] bloqueado: ${rename.reason}`);
      }
      return null;
    }
    return rename.edit;
  });
}

export function registerLinkedEditingHandler(context: FeatureHandlerContext): void {
  const {
    connection,
    documents,
    knowledgeBase,
    inheritanceGraph,
    hotContextCache,
    buildRuntimeProgressReadiness,
    isLatencyPressureHigh,
    recordInteractiveLatency,
    isSemanticallyServedDocument,
  } = context;

  connection.languages.onLinkedEditingRange((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;
    if (!isSemanticallyServedDocument(document)) return null;

    try {
      hotContextCache.setActive(document.uri, knowledgeBase.version);
      const queryContext = createDocumentQueryContext(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache, 'linked-editing');
      const readiness = resolveServingReadiness({
        feature: 'rename',
        consumerLabel: 'linkedEditing',
        snapshot: buildRuntimeProgressReadiness(document.uri),
        blockedResult: null,
        context: {
          latencyOverloaded: isLatencyPressureHigh(),
          resolutionConfidence: queryContext.resolutionConfidence,
        },
      });
      if (readiness.blocked) {
        connection.console.warn(readiness.warningMessage);
        return readiness.blockedResult;
      }

      const { result, elapsedMs } = measureMs(() =>
        provideLinkedEditingRanges(
          document,
          params.position,
          knowledgeBase,
          inheritanceGraph,
          hotContextCache,
          queryContext,
        )
      );
      recordInteractiveLatency('linkedEditing', elapsedMs);
      logInteractiveFeatureTiming(connection, 'linkedEditing', elapsedMs);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      connection.console.error(`[ERROR] linkedEditing: ${message}`);
      return null;
    }
  });
}

export function registerCodeLensHandler(context: FeatureHandlerContext): void {
  const {
    connection,
    documents,
    knowledgeBase,
    codeLensCache,
    buildRuntimeProgressReadiness,
    isLatencyPressureHigh,
    buildCodeLensCacheKey,
    makeCodeLensSymbolKey,
    getCodeLensHierarchyMeta,
    getCodeLensUnavailableReason,
    buildCodeLensReferenceCounts,
    isSemanticallyServedDocument,
  } = context;

  connection.onCodeLens(async (params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];
    if (!isSemanticallyServedDocument(document)) return [];
    try {
      const readinessDecision = decideFeatureReadiness('references', buildRuntimeProgressReadiness(document.uri), {
        latencyOverloaded: isLatencyPressureHigh()
      });
      const cacheKey = buildCodeLensCacheKey(document, readinessDecision.reason, readinessDecision.action);
      const cached = codeLensCache.get(document.uri, cacheKey);
      if (cached) {
        return cached;
      }

      const callableEntities = knowledgeBase.getEntitiesByUri(document.uri).filter((entity) =>
        entity.uri === document.uri &&
        (entity.kind === EntityKind.Function || entity.kind === EntityKind.Subroutine || entity.kind === EntityKind.Event)
      );

      const lensSymbols = callableEntities.map((entity) => {
        const hierarchy = getCodeLensHierarchyMeta(entity);
        return {
          key: makeCodeLensSymbolKey(entity),
          entity,
          name: entity.name,
          range: Range.create(entity.line, entity.character, entity.line, entity.character + entity.name.length),
          relation: hierarchy.relation,
          overrideCount: hierarchy.overrideCount,
          ...(readinessDecision.action === 'block'
            ? { unavailableReason: getCodeLensUnavailableReason(readinessDecision.reason) }
            : {})
        } satisfies CodeLensSymbol & { entity: Entity };
      });

      const counts = readinessDecision.action === 'block'
        ? new Map<string, number>()
        : await buildCodeLensReferenceCounts(lensSymbols);

      const lenses = provideReferenceCodeLenses(lensSymbols, counts);
      codeLensCache.set(document.uri, cacheKey, lenses);
      return lenses;
    } catch (error) {
      connection.console.error(`[ERROR] codeLens: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  });
}

export function registerSemanticTokensHandler(context: FeatureHandlerContext): void {
  const {
    connection,
    documents,
    scheduler,
    knowledgeBase,
    inheritanceGraph,
    systemCatalog,
    firstInvocation,
    serverStartTime,
    isSemanticallyServedDocument,
  } = context;

  connection.languages.semanticTokens.on((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return { data: [] };
    }
    if (!isSemanticallyServedDocument(document)) {
      return { data: [] };
    }

    try {
      return scheduler.runInteractive({
        id: `semanticTokens-${document.uri}`,
        priority: TaskPriority.Interactive,
        execute: () => {
          const { result, elapsedMs } = measureMs(() => provideSemanticTokens(document, knowledgeBase, inheritanceGraph, systemCatalog));

          logInteractiveFeatureTiming(
            connection,
            'semanticTokens',
            elapsedMs,
            firstInvocation,
            'semanticTokens',
            'Primer semanticTokens (desde el inicio)',
            serverStartTime,
          );
          return result;
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      connection.console.error(`[ERROR] semanticTokens: ${message}`);
      return { data: [] };
    }
  });
}