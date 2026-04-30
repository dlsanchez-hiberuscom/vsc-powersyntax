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
const PROGRESS_INTERVAL = 25;

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
  onProgress?: IndexerProgress
): Promise<void> {
  const log = logger || (() => {});
  const files = workspaceState.getAllSourceFiles();
  const total = files.length;
  let processedCount = 0;

  onProgress?.(0, total);

  kb.beginBatchUpdate();
  try {
    for (const uri of files) {
      if (token.isCancelled) return;

      try {
        const content = await fs.readFile(uri);
        const hash = calculateHash(content);

        // Si ya está en caché y el hash coincide, saltamos el parseo
        if (cache.isValid(uri, hash)) {
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

        processedCount++;

        // Reportar progreso intermedio
        if (processedCount % PROGRESS_INTERVAL === 0) {
          onProgress?.(processedCount, total);
        }

        // Ceder el control cada N archivos para no bloquear el hilo principal
        if (processedCount % 10 === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      } catch (e) {
        log(`[INDEXER] Error procesando ${uri}: ${String(e)}`);
      }
    }
  } finally {
    kb.endBatchUpdate();
  }

  onProgress?.(processedCount, total);
}
