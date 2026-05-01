import { TextDocument } from 'vscode-languageserver-textdocument';
import { CancellationToken } from '../runtime/cancellation';
import { IFileSystem } from '../system/fileSystem';
import { calculateHash } from '../system/hash';
import { normalizeUri } from '../system/uriUtils';
import { DocumentCache } from '../knowledge/DocumentCache';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
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
  activeUri?: string
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

  return ordered.sort((left, right) => {
    const leftUri = normalizeUri(left);
    const rightUri = normalizeUri(right);
    const leftPriority = leftUri === normalizedActiveUri ? 0 : sameProject.has(leftUri) ? 1 : 2;
    const rightPriority = rightUri === normalizedActiveUri ? 0 : sameProject.has(rightUri) ? 1 : 2;
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
  let files = prioritizeFilesForIndexing(workspaceState.getAllSourceFiles(), workspaceState, activeUri);
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
    reportProgress(onProgress, 0, total, 'structural');
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
          preparedDocuments.push({
            uri,
            hash,
            facts: cachedEntry.facts,
            scopes: cachedEntry.scopes,
            structuralSnapshot: createStructuralSnapshot(cachedEntry.snapshot),
            enrichedSnapshot: cachedEntry.snapshot
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

    kb.beginBatchUpdate();
    for (const prepared of preparedDocuments) {
      kb.upsertDocument(
        prepared.uri,
        prepared.structuralSnapshot.symbols,
        prepared.structuralSnapshot.scopes,
        prepared.structuralSnapshot
      );
    }
    kb.commitBatchUpdate();
    indexerStatus.structuralPublished = preparedDocuments.length;

    indexerStatus.phase = 'enriched';
    indexerStatus.pass = 'enriched';
    indexerStatus.current = 0;
    reportProgress(onProgress, 0, total, 'enriched');

    kb.beginBatchUpdate();
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
      indexerStatus.enrichedPublished = enrichedProcessed + 1;
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
