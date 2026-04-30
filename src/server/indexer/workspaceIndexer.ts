import { TextDocument } from 'vscode-languageserver-textdocument';
import { CancellationToken } from '../runtime/cancellation';
import { IFileSystem } from '../system/fileSystem';
import { calculateHash } from '../system/hash';
import { DocumentCache } from '../knowledge/DocumentCache';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { WorkspaceState } from '../workspace/workspaceState';
import { analyzeDocument } from '../analysis/documentAnalysis';

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

/** Spec 123: lectura del estado de un archivo (sólo lectura). */
export function getFileIndexState(uri: string): FileIndexState | undefined {
  return fileStates.get(uri);
}

/** Spec 127: snapshot del estado global del indexer. */
export function getIndexerStatus(): {
  total: number;
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
  return { total: fileStates.size, byState };
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
  onProgress?: IndexerProgress,
  /** Spec 124: archivo activo a priorizar (se indexa primero). */
  activeUri?: string
): Promise<void> {
  const log = logger || (() => {});
  // Spec 097: orden estable de archivos para que la indexación sea
  // determinista entre sesiones. Reduce ruido al comparar perfiles y mejora
  // la reproducibilidad de tests de regresión sobre KB.
  let files = [...workspaceState.getAllSourceFiles()].sort();
  // Spec 124: si hay archivo activo, lo movemos al frente sin perder el
  // resto del orden estable.
  if (activeUri) {
    const idx = files.indexOf(activeUri);
    if (idx > 0) {
      files = [activeUri, ...files.slice(0, idx), ...files.slice(idx + 1)];
    }
  }
  const total = files.length;
  let processedCount = 0;
  // Spec 123: marcar todos como Pending al arrancar.
  fileStates.clear();
  for (const f of files) fileStates.set(f, FileIndexState.Pending);

  onProgress?.(0, total);

  let sliceStart = Date.now();
  kb.beginBatchUpdate();
  try {
    for (const uri of files) {
      if (token.isCancelled) return;

      try {
        fileStates.set(uri, FileIndexState.Indexing);
        const content = await fs.readFile(uri);
        // Spec 126: skip si excede el budget.
        if (content.length > MAX_FILE_BYTES) {
          fileStates.set(uri, FileIndexState.Skipped);
          processedCount++;
          continue;
        }
        const hash = calculateHash(content);

        // Si ya está en caché y el hash coincide, saltamos el parseo
        if (cache.isValid(uri, hash)) {
          fileStates.set(uri, FileIndexState.Indexed);
          processedCount++;
          if (processedCount % PROGRESS_INTERVAL === 0) {
            onProgress?.(processedCount, total);
          }
          continue;
        }

        // Parseo y análisis (los DocumentSymbols se calculan bajo demanda
        // en el feature LSP correspondiente, evitando trabajo desperdiciado aquí).
        const document = TextDocument.create(uri, 'powerbuilder', 1, content);
        const analysis = analyzeDocument(document);

        // Actualizar Caché
        cache.set(uri, {
          version: hash,
          facts: analysis.semanticFacts,
          symbols: [],
          scopes: analysis.scopes
        });

        // Actualizar KnowledgeBase
        kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes);

        fileStates.set(uri, FileIndexState.Indexed);
        processedCount++;

        // Reportar progreso intermedio
        if (processedCount % PROGRESS_INTERVAL === 0) {
          onProgress?.(processedCount, total);
        }

        // Ceder el control cada N archivos para no bloquear el hilo principal.
        // Spec 073: tras el yield re-comprobamos cancellation para abortar
        // de forma cooperativa lo antes posible.
        // Spec 125: además del módulo cada 10, cedemos si la rebanada actual
        // supera el presupuesto temporal (TIME_SLICE_MS).
        if (processedCount % 10 === 0 || (Date.now() - sliceStart) > TIME_SLICE_MS) {
          await new Promise(resolve => setImmediate(resolve));
          sliceStart = Date.now();
          if (token.isCancelled) return;
        }
      } catch (e) {
        fileStates.set(uri, FileIndexState.Failed);
        log(`[INDEXER] Error procesando ${uri}: ${String(e)}`);
      }
    }
  } finally {
    kb.endBatchUpdate();
  }

  onProgress?.(processedCount, total);
}
