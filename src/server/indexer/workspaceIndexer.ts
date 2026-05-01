import { TextDocument } from 'vscode-languageserver-textdocument';
import { CancellationToken } from '../runtime/cancellation';
import { IFileSystem } from '../system/fileSystem';
import { calculateHash } from '../system/hash';
import { normalizeUri } from '../system/uriUtils';
import { DocumentCache } from '../knowledge/DocumentCache';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { collectSnapshotDependencyKeys } from '../knowledge/semanticDiff';
import { PB_IDENTIFIER_SOURCE, PB_KEYWORDS } from '../parsing/grammar';
import { WorkspaceState } from '../workspace/workspaceState';
import { analyzeDocument, analyzeDocumentStructural } from '../analysis/documentAnalysis';
import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import { createLatencyGovernor } from '../runtime/latencyGovernor';
import type { ProgressPass } from '../../shared/types';

export type IndexerLogger = (msg: string) => void;

/**
 * Callback opcional para reportar progreso de indexación.
 *
 * Se invoca:
 * - una vez al inicio con `current = 0`,
 * - cada `PROGRESS_INTERVAL` archivos procesados,
 * - una vez al final con `current = total`.
 */
export type IndexerProgress = (current: number, total: number) => void;

export interface IndexerProgressMeta {
  pass: ProgressPass;
  degraded: boolean;
  skipped: number;
  failed: number;
  budgetMs: number;
}

export type IndexerProgressCallback = (current: number, total: number, meta: IndexerProgressMeta) => void;

interface PreparedDocument {
  uri: string;
  hash: string;
  content?: string;
  facts?: ReturnType<typeof analyzeDocument>['semanticFacts'];
  scopes?: ReturnType<typeof analyzeDocument>['scopes'];
  structuralSnapshot: SemanticDocumentSnapshot;
  enrichedSnapshot?: SemanticDocumentSnapshot;
  skipStructuralPublish?: boolean;
  skipEnrichedPublish?: boolean;
}

/** Cada cuántos archivos se reporta progreso intermedio. */
const DEFAULT_PROGRESS_INTERVAL = 25;

/**
 * Spec 095: el intervalo de progreso es configurable vía variable de entorno
 * `PB_PROGRESS_INTERVAL`. Útil en tests y diagnósticos sin recompilar.
 * Cualquier valor inválido o ≤ 0 se ignora y se usa el default.
 */
function resolveProgressInterval(): number {
  const raw = process.env.PB_PROGRESS_INTERVAL;
  if (!raw) return DEFAULT_PROGRESS_INTERVAL;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_PROGRESS_INTERVAL;
}

const PROGRESS_INTERVAL = resolveProgressInterval();

/**
 * Spec 125: presupuesto de tiempo por "rebanada" entre yields cooperativos
 * (en milisegundos). Si la rebanada actual excede este presupuesto, cedemos
 * al event loop. Configurable vía `PB_TIME_SLICE_MS` (default 50ms).
 */
function resolveTimeSliceMs(): number {
  const raw = process.env.PB_TIME_SLICE_MS;
  if (!raw) return 50;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 50;
}
const TIME_SLICE_MS = resolveTimeSliceMs();

/**
 * Spec 126: ignorar archivos demasiado grandes para no estancar la
 * indexación. Configurable vía `PB_MAX_FILE_BYTES` (default 4 MiB).
 */
function resolveMaxFileBytes(): number {
  const raw = process.env.PB_MAX_FILE_BYTES;
  if (!raw) return 4 * 1024 * 1024;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 4 * 1024 * 1024;
}
const MAX_FILE_BYTES = resolveMaxFileBytes();
const PROBABLE_CALL_REGEX = new RegExp(`\\b(?:(this|super)\\.)?(${PB_IDENTIFIER_SOURCE})\\s*\\(`, 'gi');

/**
 * Spec 123: máquina de estados por archivo durante la indexación.
 */
export enum FileIndexState {
  Pending = 'pending',
  Indexing = 'indexing',
  Indexed = 'indexed',
  Skipped = 'skipped',
  Failed = 'failed'
}

const fileStates: Map<string, FileIndexState> = new Map();

export type IndexerPhase = 'idle' | 'structural' | 'enriched' | 'partial' | 'ready';

export interface IndexPrioritySummary {
  strategy: 'lexicographic' | 'active-project' | 'semantic-nearby';
  ancestors: number;
  semantic: number;
  probableCalls: number;
  sameProject: number;
}

const indexerStatus: {
  phase: IndexerPhase;
  total: number;
  current: number;
  structuralProcessed: number;
  enrichedProcessed: number;
  structuralPublished: number;
  enrichedPublished: number;
  yielded: number;
  workBudgetMs: number;
  degraded: boolean;
  degradedReason?: string;
  activeUri?: string;
  pass?: ProgressPass;
  lastProcessedUri?: string;
  lastFailedUri?: string;
  partialRuns: number;
  prioritySummary?: IndexPrioritySummary;
} = {
  phase: 'idle',
  total: 0,
  current: 0,
  structuralProcessed: 0,
  enrichedProcessed: 0,
  structuralPublished: 0,
  enrichedPublished: 0,
  yielded: 0,
  workBudgetMs: TIME_SLICE_MS,
  degraded: false,
  partialRuns: 0
};

/** Spec 123: lectura del estado de un archivo (sólo lectura). */
export function getFileIndexState(uri: string): FileIndexState | undefined {
  return fileStates.get(uri);
}

export function setFileIndexState(uri: string, state: FileIndexState): void {
  fileStates.set(normalizeUri(uri), state);
}

export function clearFileIndexState(uri: string): void {
  fileStates.delete(normalizeUri(uri));
}

/** Spec 127: snapshot del estado global del indexer. */
export function getIndexerStatus(): {
  phase: IndexerPhase;
  total: number;
  current: number;
  structuralProcessed: number;
  enrichedProcessed: number;
  structuralPublished: number;
  enrichedPublished: number;
  yielded: number;
  workBudgetMs: number;
  degraded: boolean;
  degradedReason?: string;
  activeUri?: string;
  pass?: ProgressPass;
  lastProcessedUri?: string;
  lastFailedUri?: string;
  partialRuns: number;
  prioritySummary?: IndexPrioritySummary;
  byState: Record<FileIndexState, number>;
} {
  const byState: Record<FileIndexState, number> = {
    [FileIndexState.Pending]: 0,
    [FileIndexState.Indexing]: 0,
    [FileIndexState.Indexed]: 0,
    [FileIndexState.Skipped]: 0,
    [FileIndexState.Failed]: 0
  };
  for (const s of fileStates.values()) byState[s]++;
  return {
    ...indexerStatus,
    total: fileStates.size,
    byState,
    degraded:
      indexerStatus.degraded
      || byState[FileIndexState.Skipped] > 0
      || byState[FileIndexState.Failed] > 0,
    degradedReason:
      indexerStatus.degradedReason
      ?? (byState[FileIndexState.Failed] > 0 ? 'failed-files'
      : byState[FileIndexState.Skipped] > 0 ? 'skipped-files'
      : undefined)
  };
}

export function prioritizeFilesForIndexing(
  files: string[],
  workspaceState: WorkspaceState,
  activeUri?: string,
  kb?: KnowledgeBase
): string[] {
  const ordered = [...files].sort();
  if (!activeUri) {
    return ordered;
  }

  const normalizedActiveUri = normalizeUri(activeUri);
  const projectModel = workspaceState.getProjectModel();
  const activeProject = projectModel?.getProjectForFile(normalizedActiveUri) ?? null;
  const sameProject = new Set(
    activeProject ? projectModel?.getFilesForProject(activeProject.projectUri).map((uri) => normalizeUri(uri)) : []
  );
  const semanticPriority = kb
    ? buildSemanticPriorityBuckets(kb, normalizedActiveUri)
    : { ancestors: new Set<string>(), semantic: new Set<string>(), probableCalls: new Set<string>() };

  return ordered.sort((left, right) => {
    const leftUri = normalizeUri(left);
    const rightUri = normalizeUri(right);
    const leftPriority = getPriorityBucket(leftUri, normalizedActiveUri, semanticPriority, sameProject);
    const rightPriority = getPriorityBucket(rightUri, normalizedActiveUri, semanticPriority, sameProject);
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }
    return leftUri.localeCompare(rightUri);
  });
}

/**
 * Procesa todos los archivos descubiertos en el workspace e inicializa el índice global.
 *
 * Encapsula la actualización masiva de la KnowledgeBase en un batch update para
 * evitar invalidar cachés derivadas (p. ej. InheritanceGraph) en cada archivo.
 */
export async function indexWorkspace(
  fs: IFileSystem,
  cache: DocumentCache,
  kb: KnowledgeBase,
  workspaceState: WorkspaceState,
  token: CancellationToken,
  logger?: IndexerLogger,
  onProgress?: IndexerProgress | IndexerProgressCallback,
  /** Spec 124: archivo activo a priorizar (se indexa primero). */
  activeUri?: string
): Promise<void> {
  const log = logger || (() => {});
  indexerStatus.prioritySummary = buildPrioritySummary(workspaceState, activeUri, kb);
  let files = prioritizeFilesForIndexing(workspaceState.getAllSourceFiles(), workspaceState, activeUri, kb);
  const total = files.length;
  let structuralProcessed = 0;
  let enrichedProcessed = 0;
  let committed = false;
  const latencyGovernor = createLatencyGovernor({ initialBudgetMs: TIME_SLICE_MS });
  const preparedDocuments: PreparedDocument[] = [];
  // Spec 123: marcar todos como Pending al arrancar.
  fileStates.clear();
  for (const f of files) fileStates.set(f, FileIndexState.Pending);
  indexerStatus.phase = 'structural';
  indexerStatus.total = total;
  indexerStatus.current = 0;
  indexerStatus.structuralProcessed = 0;
  indexerStatus.enrichedProcessed = 0;
  indexerStatus.structuralPublished = 0;
  indexerStatus.enrichedPublished = 0;
  indexerStatus.yielded = 0;
  indexerStatus.workBudgetMs = latencyGovernor.getBudgetMs();
  indexerStatus.degraded = false;
  indexerStatus.degradedReason = undefined;
  indexerStatus.activeUri = activeUri;
  indexerStatus.pass = 'structural';
  indexerStatus.lastProcessedUri = undefined;
  indexerStatus.lastFailedUri = undefined;

  reportProgress(onProgress, 0, total, 'structural');

  if (total === 0) {
    indexerStatus.phase = 'ready';
    indexerStatus.pass = undefined;
    workspaceState.markIndexClean();
    reportProgress(onProgress, 0, total, 'structural');
    return;
  }

  if (canSkipFullIndex(files, cache, kb, workspaceState)) {
    for (const uri of files) {
      fileStates.set(uri, FileIndexState.Indexed);
    }
    indexerStatus.phase = 'ready';
    indexerStatus.current = total;
    indexerStatus.structuralProcessed = total;
    indexerStatus.enrichedProcessed = total;
    indexerStatus.structuralPublished = 0;
    indexerStatus.enrichedPublished = 0;
    indexerStatus.pass = undefined;
    indexerStatus.lastProcessedUri = files[files.length - 1];
    workspaceState.markIndexClean();
    reportProgress(onProgress, total, total, 'enriched');
    return;
  }

  let sliceStart = Date.now();
  try {
    for (const uri of files) {
      if (token.isCancelled) {
        markPartial();
        return;
      }

      try {
        indexerStatus.lastProcessedUri = uri;
        fileStates.set(uri, FileIndexState.Indexing);
        const content = await fs.readFile(uri);
        // Spec 126: skip si excede el budget.
        if (content.length > MAX_FILE_BYTES) {
          fileStates.set(uri, FileIndexState.Skipped);
          structuralProcessed++;
          updateStatus('structural', structuralProcessed, enrichedProcessed, latencyGovernor.getBudgetMs());
          continue;
        }
        const hash = calculateHash(content);
        const cachedEntry = cache.get(uri);

        // Si ya está en caché y el hash coincide, saltamos el parseo
        if (cache.isValid(uri, hash) && cachedEntry?.snapshot && isEnrichedSnapshot(cachedEntry.snapshot)) {
          const reusePublishedSnapshot = hasMatchingPublishedEnrichedSnapshot(kb, uri, cachedEntry.snapshot);
          preparedDocuments.push({
            uri,
            hash,
            facts: cachedEntry.facts,
            scopes: cachedEntry.scopes,
            structuralSnapshot: createStructuralSnapshot(cachedEntry.snapshot),
            enrichedSnapshot: cachedEntry.snapshot,
            skipStructuralPublish: reusePublishedSnapshot,
            skipEnrichedPublish: reusePublishedSnapshot
          });
          structuralProcessed++;
          updateStatus('structural', structuralProcessed, enrichedProcessed, latencyGovernor.getBudgetMs());
          if (structuralProcessed % PROGRESS_INTERVAL === 0) {
            reportProgress(onProgress, structuralProcessed, total, 'structural');
          }
          continue;
        }

        // El primer pase solo necesita un snapshot estructural barato.
        const document = TextDocument.create(uri, 'powerbuilder', 1, content);
        const analysis = analyzeDocumentStructural(document);
        preparedDocuments.push({
          uri,
          hash,
          content,
          structuralSnapshot: analysis.snapshot,
          enrichedSnapshot: undefined
        });
        structuralProcessed++;
        updateStatus('structural', structuralProcessed, enrichedProcessed, latencyGovernor.getBudgetMs());

        // Reportar progreso intermedio
        if (structuralProcessed % PROGRESS_INTERVAL === 0) {
          reportProgress(onProgress, structuralProcessed, total, 'structural');
        }

        // Ceder el control cada N archivos para no bloquear el hilo principal.
        // Spec 073: tras el yield re-comprobamos cancellation para abortar
        // de forma cooperativa lo antes posible.
        // Spec 125: además del módulo cada 10, cedemos si la rebanada actual
        // supera el presupuesto temporal (TIME_SLICE_MS).
        if (structuralProcessed % 10 === 0 || (Date.now() - sliceStart) > latencyGovernor.getBudgetMs()) {
          const elapsed = Date.now() - sliceStart;
          latencyGovernor.recordElapsedMs(elapsed);
          await new Promise(resolve => setImmediate(resolve));
          sliceStart = Date.now();
          indexerStatus.yielded++;
          updateStatus('structural', structuralProcessed, enrichedProcessed, latencyGovernor.getBudgetMs());
          if (token.isCancelled) {
            markPartial();
            return;
          }
        }
      } catch (e) {
        fileStates.set(uri, FileIndexState.Failed);
        indexerStatus.lastFailedUri = uri;
        log(`[INDEXER] Error procesando ${uri}: ${String(e)}`);
      }
    }

    const structuralToPublish = preparedDocuments.filter((prepared) => !prepared.skipStructuralPublish);
    if (structuralToPublish.length > 0) {
      kb.beginBatchUpdate();
      for (const prepared of structuralToPublish) {
        kb.upsertDocument(
          prepared.uri,
          prepared.structuralSnapshot.symbols,
          prepared.structuralSnapshot.scopes,
          prepared.structuralSnapshot
        );
      }
      kb.commitBatchUpdate();
    }
    indexerStatus.structuralPublished = structuralToPublish.length;

    indexerStatus.phase = 'enriched';
    indexerStatus.pass = 'enriched';
    indexerStatus.current = 0;
    reportProgress(onProgress, 0, total, 'enriched');

    const hasEnrichedPublications = preparedDocuments.some((prepared) => !prepared.skipEnrichedPublish);
    let enrichedPublished = 0;
    if (hasEnrichedPublications) {
      kb.beginBatchUpdate();
    }
    sliceStart = Date.now();
    for (const prepared of preparedDocuments) {
      if (token.isCancelled) {
        markPartial();
        committed = enrichedProcessed > 0;
        break;
      }

      indexerStatus.lastProcessedUri = prepared.uri;
      let facts = prepared.facts;
      let scopes = prepared.scopes;
      let enrichedSnapshot = prepared.enrichedSnapshot;

      if (!prepared.skipEnrichedPublish) {
        if (!facts || !scopes || !enrichedSnapshot) {
          const document = TextDocument.create(prepared.uri, 'powerbuilder', 1, prepared.content ?? '');
          const analysis = analyzeDocument(document);
          facts = analysis.semanticFacts;
          scopes = analysis.scopes;
          enrichedSnapshot = analysis.snapshot;
          cache.set(prepared.uri, {
            version: prepared.hash,
            facts,
            symbols: [],
            scopes,
            snapshot: enrichedSnapshot
          });
        }

        kb.upsertDocument(prepared.uri, facts, scopes, enrichedSnapshot);
        enrichedPublished++;
        indexerStatus.enrichedPublished = enrichedPublished;
      }
      fileStates.set(prepared.uri, FileIndexState.Indexed);
      enrichedProcessed++;
      updateStatus('enriched', structuralProcessed, enrichedProcessed, latencyGovernor.getBudgetMs());

      if (enrichedProcessed % PROGRESS_INTERVAL === 0) {
        reportProgress(onProgress, enrichedProcessed, total, 'enriched');
      }

      if (enrichedProcessed % 10 === 0 || (Date.now() - sliceStart) > latencyGovernor.getBudgetMs()) {
        const elapsed = Date.now() - sliceStart;
        latencyGovernor.recordElapsedMs(elapsed);
        await new Promise(resolve => setImmediate(resolve));
        sliceStart = Date.now();
        indexerStatus.yielded++;
        updateStatus('enriched', structuralProcessed, enrichedProcessed, latencyGovernor.getBudgetMs());
      }
    }
    if (!token.isCancelled) {
      committed = true;
      indexerStatus.phase = 'ready';
      indexerStatus.pass = undefined;
      indexerStatus.current = total;
      workspaceState.markIndexClean();
    }
  } finally {
    if (kb.isBatchUpdating) {
      if (committed) {
        kb.commitBatchUpdate();
      } else {
        kb.rollbackBatchUpdate();
      }
    }
  }

  if (getIndexerStatus().phase !== 'partial') {
    reportProgress(onProgress, enrichedProcessed, total, 'enriched');
  }

  function updateStatus(
    pass: ProgressPass,
    nextStructuralProcessed: number,
    nextEnrichedProcessed: number,
    budgetMs: number
  ): void {
    indexerStatus.pass = pass;
    indexerStatus.current = pass === 'structural' ? nextStructuralProcessed : nextEnrichedProcessed;
    indexerStatus.structuralProcessed = nextStructuralProcessed;
    indexerStatus.enrichedProcessed = nextEnrichedProcessed;
    indexerStatus.workBudgetMs = budgetMs;
    const status = getIndexerStatus();
    indexerStatus.degraded = status.degraded;
    indexerStatus.degradedReason = status.degradedReason;
  }

  function reportProgress(
    progress: IndexerProgress | IndexerProgressCallback | undefined,
    current: number,
    all: number,
    pass: ProgressPass
  ): void {
    if (!progress) return;
    const status = getIndexerStatus();
    (progress as IndexerProgressCallback)(current, all, {
      pass,
      degraded: status.degraded,
      skipped: status.byState[FileIndexState.Skipped],
      failed: status.byState[FileIndexState.Failed],
      budgetMs: indexerStatus.workBudgetMs
    });
  }

  function markPartial(): void {
    indexerStatus.phase = 'partial';
    indexerStatus.degraded = true;
    indexerStatus.degradedReason = 'partial-index';
    indexerStatus.partialRuns++;
  }
}

function isEnrichedSnapshot(snapshot: SemanticDocumentSnapshot): boolean {
  return snapshot.pass === 'enriched' && snapshot.readiness === 'nearby-semantic-ready';
}

function createStructuralSnapshot(snapshot: SemanticDocumentSnapshot): SemanticDocumentSnapshot {
  return {
    ...snapshot,
    pass: 'structural',
    readiness: 'structural-only',
    symbols: [],
    scopes: [],
    logicalStatements: [],
    controlBlocks: []
  };
}

function hasMatchingPublishedEnrichedSnapshot(
  kb: KnowledgeBase,
  uri: string,
  snapshot: SemanticDocumentSnapshot
): boolean {
  const published = kb.getDocumentSnapshot(uri);
  return published?.identity === snapshot.identity
    && isEnrichedSnapshot(published)
    && isEnrichedSnapshot(snapshot);
}

function canSkipFullIndex(
  files: string[],
  cache: DocumentCache,
  kb: KnowledgeBase,
  workspaceState: WorkspaceState
): boolean {
  if (workspaceState.isIndexDirty()) {
    return false;
  }

  return files.every((uri) => cache.hasSnapshot(uri) && kb.hasDocumentSnapshot(uri));
}

function buildPrioritySummary(
  workspaceState: WorkspaceState,
  activeUri: string | undefined,
  kb?: KnowledgeBase
): IndexPrioritySummary {
  if (!activeUri) {
    return {
      strategy: 'lexicographic',
      ancestors: 0,
      semantic: 0,
      probableCalls: 0,
      sameProject: 0
    };
  }

  const normalizedActiveUri = normalizeUri(activeUri);
  const projectModel = workspaceState.getProjectModel();
  const activeProject = projectModel?.getProjectForFile(normalizedActiveUri) ?? null;
  const sameProject = new Set(
    activeProject ? projectModel?.getFilesForProject(activeProject.projectUri).map((uri) => normalizeUri(uri)) : []
  );
  sameProject.delete(normalizedActiveUri);

  const semanticPriority = kb
    ? buildSemanticPriorityBuckets(kb, normalizedActiveUri)
    : { ancestors: new Set<string>(), semantic: new Set<string>(), probableCalls: new Set<string>() };

  const strategy = semanticPriority.ancestors.size > 0
    || semanticPriority.semantic.size > 0
    || semanticPriority.probableCalls.size > 0
    ? 'semantic-nearby'
    : 'active-project';

  return {
    strategy,
    ancestors: semanticPriority.ancestors.size,
    semantic: semanticPriority.semantic.size,
    probableCalls: semanticPriority.probableCalls.size,
    sameProject: sameProject.size
  };
}

function getPriorityBucket(
  uri: string,
  activeUri: string,
  buckets: {
    ancestors: Set<string>;
    semantic: Set<string>;
    probableCalls: Set<string>;
  },
  sameProject: Set<string>
): number {
  if (uri === activeUri) return 0;
  if (buckets.ancestors.has(uri)) return 1;
  if (buckets.semantic.has(uri)) return 2;
  if (buckets.probableCalls.has(uri)) return 3;
  if (sameProject.has(uri)) return 4;
  return 5;
}

function buildSemanticPriorityBuckets(
  kb: KnowledgeBase,
  activeUri: string
): {
  ancestors: Set<string>;
  semantic: Set<string>;
  probableCalls: Set<string>;
} {
  const activeSnapshot = kb.getDocumentSnapshot(activeUri);
  if (!activeSnapshot) {
    return {
      ancestors: new Set<string>(),
      semantic: new Set<string>(),
      probableCalls: new Set<string>()
    };
  }

  const ancestors = new Set<string>();
  const semantic = new Set<string>();
  const probableCalls = new Set<string>();

  for (const symbol of activeSnapshot.symbols) {
    if (!symbol.baseTypeName) {
      continue;
    }

    for (const entity of kb.findAllDefinitions(symbol.baseTypeName)) {
      const uri = normalizeUri(entity.uri);
      if (uri !== activeUri) {
        ancestors.add(uri);
      }
    }
  }

  for (const dependency of collectSnapshotDependencyKeys(activeSnapshot)) {
    for (const entity of kb.findAllDefinitions(dependency)) {
      const uri = normalizeUri(entity.uri);
      if (uri !== activeUri && !ancestors.has(uri)) {
        semantic.add(uri);
      }
    }
  }

  for (const dependentUri of kb.getDependentDocumentsForUri(activeUri)) {
    const normalized = normalizeUri(dependentUri);
    if (normalized !== activeUri && !ancestors.has(normalized)) {
      semantic.add(normalized);
    }
  }

  for (const probableCall of collectProbableCallNames(activeSnapshot)) {
    for (const entity of kb.findAllDefinitions(probableCall)) {
      const uri = normalizeUri(entity.uri);
      if (uri !== activeUri && !ancestors.has(uri) && !semantic.has(uri)) {
        probableCalls.add(uri);
      }
    }
  }

  return { ancestors, semantic, probableCalls };
}

function collectProbableCallNames(snapshot: SemanticDocumentSnapshot): string[] {
  const names = new Set<string>();

  for (const line of snapshot.maskedText.lines) {
    if (!line) {
      continue;
    }

    PROBABLE_CALL_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = PROBABLE_CALL_REGEX.exec(line)) !== null) {
      const qualifier = match[1];
      const name = match[2].toLowerCase();
      if (PB_KEYWORDS.has(name)) {
        continue;
      }

      const stringBefore = line.substring(0, match.index);
      if (stringBefore.endsWith('.') && !qualifier) {
        continue;
      }

      names.add(name);
    }
  }

  return [...names];
}
