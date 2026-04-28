import { TextDocument } from 'vscode-languageserver-textdocument';
import { CancellationToken } from '../runtime/cancellation';
import { IFileSystem } from '../system/fileSystem';
import { calculateHash } from '../system/hash';
import { DocumentCache } from '../knowledge/DocumentCache';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { WorkspaceState } from '../workspace/workspaceState';
import { analyzeDocument } from '../analysis/documentAnalysis';
import { extractDocumentSymbols } from '../features/documentSymbols';

export type IndexerLogger = (msg: string) => void;

/**
 * Procesa todos los archivos descubiertos en el workspace e inicializa el índice global.
 */
export async function indexWorkspace(
  fs: IFileSystem,
  cache: DocumentCache,
  kb: KnowledgeBase,
  workspaceState: WorkspaceState,
  token: CancellationToken,
  logger?: IndexerLogger
): Promise<void> {
  const log = logger || (() => {});
  const files = workspaceState.getAllSourceFiles();
  let processedCount = 0;

  for (const uri of files) {
    if (token.isCancelled) return;

    try {
      const content = await fs.readFile(uri);
      const hash = calculateHash(content);

      // Si ya está en caché y el hash coincide, saltamos el parseo
      if (cache.isValid(uri, hash)) {
        processedCount++;
        continue;
      }

      // Parseo y análisis
      const document = TextDocument.create(uri, 'powerbuilder', 1, content);
      const analysis = analyzeDocument(document);
      const symbols = extractDocumentSymbols(document);

      // Actualizar Caché
      cache.set(uri, {
        version: hash,
        facts: analysis.semanticFacts,
        symbols: symbols,
        scopes: analysis.scopes
      });

      // Actualizar KnowledgeBase
      kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes);

      processedCount++;

      // Ceder el control cada N archivos para no bloquear el hilo principal
      if (processedCount % 10 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    } catch (e) {
      log(`[INDEXER] Error procesando ${uri}: ${String(e)}`);
    }
  }
}
