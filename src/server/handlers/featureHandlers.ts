import { Range, type Connection, type TextDocuments } from 'vscode-languageserver/node';
import { TaskPriority, type TaskScheduler } from '../runtime/scheduler';
import { measureMs, formatTiming, type FirstInvocationTracker } from '../runtime/timing';
import { provideCodeActions } from '../features/codeActions';
import {
  extractDocumentSymbolsWithReconciliation,
  formatDocumentSymbolReconciliationReport,
} from '../features/documentSymbols';
import { provideReferenceCodeLenses, type CodeLensSymbol } from '../features/codeLensReferences';
import { provideDefinition } from '../features/definition';
import { provideHover } from '../features/hover';
import { provideLinkedEditingRanges } from '../features/linkedEditing';
import { provideReferences, type ReferenceSource } from '../features/references';
import { provideRename } from '../features/rename';
import { provideSignatureHelp } from '../features/signatureHelp';
import { provideCompletion } from '../features/completion';
import { provideWorkspaceSymbols } from '../features/workspaceSymbols';
import { provideSemanticTokens } from '../features/semanticTokens';
import { decideFeatureReadiness } from '../features/featureReadiness';
import { createDocumentQueryContext, type DocumentQueryContext } from '../features/queryContext';
import { resolveServingReadiness } from '../features/servingReadiness';
import type { QueryConsumerId } from '../features/queryScopePolicy';
import { RuntimeJournal } from '../runtime/runtimeJournal';
import { CodeLensResultCache } from '../features/codeLensResultCache';
import { WorkspaceState } from '../workspace/workspaceState';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { HotContextCache } from '../knowledge/HotContextCache';
import { ServingCache, makeKey as makeServingKey } from '../knowledge/ServingCache';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import type { DocumentationLocale } from '../knowledge/system/localization';
import { Entity, EntityKind } from '../knowledge/types';
import { TextDocument } from 'vscode-languageserver-textdocument';

type RuntimeProgressReadinessSnapshot = Parameters<typeof decideFeatureReadiness>[1];
type DefinitionCacheEntry = {
  result: ReturnType<typeof provideDefinition>;
  resolutionConfidence?: ReturnType<typeof createDocumentQueryContext>['resolutionConfidence'];
};

export interface FeatureHandlerContext {
  connection: Connection;
  documents: TextDocuments<TextDocument>;
  scheduler: TaskScheduler;
  firstInvocation: FirstInvocationTracker;
  runtimeJournal: RuntimeJournal;
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

          if (firstInvocation.isFirst('documentSymbols')) {
            const sinceStart = performance.now() - serverStartTime;
            connection.console.log(formatTiming('Primer documentSymbols (desde el inicio)', sinceStart));
          }

          connection.console.log(formatTiming('documentSymbols', elapsedMs));
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
      connection.console.log(formatTiming('workspaceSymbol', elapsedMs));
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
    serverStartTime,
    getDocumentationLocale,
    buildRuntimeProgressReadiness,
    ensureRuntimeMemoryPressureRelief,
    isLatencyPressureHigh,
    recordInteractiveLatency,
    cacheServingResultWithMemoryPressure,
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
      return scheduler.runInteractive({
        id: `hover-${document.uri}`,
        priority: TaskPriority.Interactive,
        execute: () => {
          const documentationLocale = getDocumentationLocale();
          const readinessDecision = decideFeatureReadiness('hover', buildRuntimeProgressReadiness(document.uri), {
            latencyOverloaded: isLatencyPressureHigh()
          });
          hotContextCache.setActive(document.uri, knowledgeBase.version);
          const cacheKey = makeServingKey({
            feature: 'hover',
            uri: document.uri,
            line: params.position.line,
            character: params.position.character,
            kbVersion: knowledgeBase.version,
            extra: documentationLocale,
          });

          ensureRuntimeMemoryPressureRelief();
          const cached = servingCache.get(cacheKey);
          if (cached !== undefined) {
            return cached as ReturnType<typeof provideHover>;
          }

          if (readinessDecision.action === 'block') {
            connection.console.warn(`[hover] bloqueado: ${readinessDecision.reason}`);
            return null;
          }

          const { result, elapsedMs } = measureMs(() => provideHover(document, params.position, knowledgeBase, systemCatalog, inheritanceGraph, hotContextCache, documentationLocale));
          recordInteractiveLatency('hover', elapsedMs);

          if (firstInvocation.isFirst('hover')) {
            const sinceStart = performance.now() - serverStartTime;
            connection.console.log(formatTiming('Primer hover (desde el inicio)', sinceStart));
          }

          connection.console.log(formatTiming('hover', elapsedMs));
          cacheServingResultWithMemoryPressure(cacheKey, result);
          return result;
        }
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
    serverStartTime,
    getDocumentationLocale,
    buildRuntimeProgressReadiness,
    ensureRuntimeMemoryPressureRelief,
    isLatencyPressureHigh,
    recordInteractiveLatency,
    cacheServingResultWithMemoryPressure,
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
        execute: () => {
          const documentationLocale = getDocumentationLocale();
          hotContextCache.setActive(document.uri, knowledgeBase.version);
          const cacheKey = makeServingKey({
            feature: 'signatureHelp',
            uri: document.uri,
            line: params.position.line,
            character: params.position.character,
            kbVersion: knowledgeBase.version,
            extra: documentationLocale,
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
          ensureRuntimeMemoryPressureRelief();
          const cached = servingCache.get(cacheKey);
          if (cached !== undefined) {
            if (readiness.blocked) {
              connection.console.warn(readiness.warningMessage);
              return readiness.blockedResult;
            }
            return cached as ReturnType<typeof provideSignatureHelp>;
          }

          if (readiness.blocked) {
            connection.console.warn(readiness.warningMessage);
            return readiness.blockedResult;
          }

          const { result, elapsedMs } = measureMs(() => provideSignatureHelp(document, params.position, knowledgeBase, systemCatalog, inheritanceGraph, hotContextCache, documentationLocale));
          recordInteractiveLatency('signatureHelp', elapsedMs);

          if (firstInvocation.isFirst('signatureHelp')) {
            const sinceStart = performance.now() - serverStartTime;
            connection.console.log(formatTiming('Primer signatureHelp (desde el inicio)', sinceStart));
          }

          connection.console.log(formatTiming('signatureHelp', elapsedMs));
          cacheServingResultWithMemoryPressure(cacheKey, result);
          return result;
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
    serverStartTime,
    getDocumentationLocale,
    buildRuntimeProgressReadiness,
    ensureRuntimeMemoryPressureRelief,
    isLatencyPressureHigh,
    recordInteractiveLatency,
    cacheServingResultWithMemoryPressure,
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
        execute: () => {
          const readinessDecision = decideFeatureReadiness('completion', buildRuntimeProgressReadiness(document.uri), {
            latencyOverloaded: isLatencyPressureHigh()
          });
          const documentationLocale = getDocumentationLocale();
          hotContextCache.setActive(document.uri, knowledgeBase.version);
          const cacheKey = makeServingKey({
            feature: 'completion',
            uri: document.uri,
            line: params.position.line,
            character: params.position.character,
            kbVersion: knowledgeBase.version,
            extra: `${params.context?.triggerKind ?? ''}|${params.context?.triggerCharacter ?? ''}|${documentationLocale}`
          });
          ensureRuntimeMemoryPressureRelief();
          const cached = servingCache.get(cacheKey);
          if (cached !== undefined) {
            return cached as ReturnType<typeof provideCompletion>;
          }

          if (readinessDecision.action === 'block') {
            connection.console.warn(`[completion] bloqueado: ${readinessDecision.reason}`);
            return null;
          }

          const { result, elapsedMs } = measureMs(() => provideCompletion(document, params.position, knowledgeBase, systemCatalog, inheritanceGraph, hotContextCache, knowledgeBase.version, documentationLocale));
          recordInteractiveLatency('completion', elapsedMs);

          if (firstInvocation.isFirst('completion')) {
            const sinceStart = performance.now() - serverStartTime;
            connection.console.log(formatTiming('Primer completion (desde el inicio)', sinceStart));
          }

          connection.console.log(formatTiming('completion', elapsedMs));
          cacheServingResultWithMemoryPressure(cacheKey, result);
          return result;
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      connection.console.error(`[ERROR] completion: ${message}`);
      return null;
    }
  });
}

export function registerDefinitionHandler(context: FeatureHandlerContext): void {
  const {
    connection,
    documents,
    scheduler,
    knowledgeBase,
    inheritanceGraph,
    hotContextCache,
    servingCache,
    firstInvocation,
    serverStartTime,
    buildRuntimeProgressReadiness,
    ensureRuntimeMemoryPressureRelief,
    isLatencyPressureHigh,
    recordInteractiveLatency,
    cacheServingResultWithMemoryPressure,
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
      return scheduler.runInteractive({
        id: `definition-${document.uri}`,
        priority: TaskPriority.Interactive,
        execute: () => {
          const runtimeReadiness = buildRuntimeProgressReadiness(document.uri);
          hotContextCache.setActive(document.uri, knowledgeBase.version);
          const cacheKey = makeServingKey({
            feature: 'definition',
            uri: document.uri,
            line: params.position.line,
            character: params.position.character,
            kbVersion: knowledgeBase.version
          });
          ensureRuntimeMemoryPressureRelief();
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
              return readiness.blockedResult;
            }
            return cached.result;
          }

          const queryContext = createDocumentQueryContext(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache, 'definition');
          const readinessDecision = decideFeatureReadiness('definition', runtimeReadiness, {
            latencyOverloaded: isLatencyPressureHigh(),
            resolutionConfidence: queryContext.resolutionConfidence
          });

          if (readinessDecision.action === 'block') {
            connection.console.warn(`[definition] bloqueado: ${readinessDecision.reason}`);
            return null;
          }

          const { result, elapsedMs } = measureMs(() => provideDefinition(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache, queryContext));
          recordInteractiveLatency('definition', elapsedMs);

          if (firstInvocation.isFirst('definition')) {
            const sinceStart = performance.now() - serverStartTime;
            connection.console.log(formatTiming('Primera definición (desde el inicio)', sinceStart));
          }

          connection.console.log(formatTiming('definition', elapsedMs));
          cacheServingResultWithMemoryPressure(cacheKey, {
            result,
            resolutionConfidence: queryContext.resolutionConfidence
          });
          return result;
        }
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
      const queryContext = createDocumentQueryContext(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache, 'references');
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
      connection.console.log(formatTiming('references', elapsedMs));
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
    const queryContext = createDocumentQueryContext(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache, 'rename-prepare');
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
    const queryContext = createDocumentQueryContext(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache, 'rename');
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
      connection.console.log(formatTiming('linkedEditing', elapsedMs));
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

          if (firstInvocation.isFirst('semanticTokens')) {
            const sinceStart = performance.now() - serverStartTime;
            connection.console.log(formatTiming('Primer semanticTokens (desde el inicio)', sinceStart));
          }

          connection.console.log(formatTiming('semanticTokens', elapsedMs));
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