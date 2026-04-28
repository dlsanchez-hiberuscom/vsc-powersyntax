import * as crypto from 'crypto';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CancellationToken } from '../runtime/cancellation';
import { IFileSystem } from '../system/fileSystem';
import { DocumentCache } from '../knowledge/DocumentCache';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { WorkspaceState } from '../workspace/workspaceState';
import { analyzeDocument } from '../analysis/documentAnalysis';
import { extractDocumentSymbols } from '../features/documentSymbols';

/**
 * Calcula un hash rápido MD5 del contenido de un archivo para la caché.
 */
export function calculateHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Procesa todos los archivos descubiertos en el workspace e inicializa el índice global.
 */
export async function indexWorkspace(
  fs: IFileSystem,
  cache: DocumentCache,
  kb: KnowledgeBase,
  workspaceState: WorkspaceState,
  token: CancellationToken
): Promise<void> {
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
        symbols: symbols
      });

      // Actualizar KnowledgeBase
      kb.upsertDocument(uri, analysis.semanticFacts);

      processedCount++;

      // Ceder el control cada N archivos para no bloquear el hilo principal
      if (processedCount % 10 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    } catch (e) {
      // Si un archivo falla, lo ignoramos y seguimos (logging sutil)
      console.error(`[INDEXER] Error procesando ${uri}: ${String(e)}`);
    }
  }
}
