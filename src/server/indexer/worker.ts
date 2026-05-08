import { parentPort } from 'worker_threads';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { analyzeDocument, analyzeDocumentStructural } from '../analysis/documentAnalysis';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import type { SourceOrigin } from '../../shared/sourceOrigin';

export interface WorkerTask {
  id: number;
  uri: string;
  content: string;
  sourceOrigin: SourceOrigin;
  type: 'structural' | 'enriched';
}

if (parentPort) {
  parentPort.on('message', (task: WorkerTask) => {
    try {
      const content = task.content;
      const document = TextDocument.create(task.uri, 'powerbuilder', 1, content);
      
      let result;
      if (task.type === 'structural') {
        const analysis = analyzeDocumentStructural(document, { sourceOrigin: task.sourceOrigin });
        result = {
          content,
          structuralSnapshot: analysis.snapshot
        };
      } else {
        const analysis = analyzeDocument(document, { sourceOrigin: task.sourceOrigin });
        result = {
          facts: analysis.semanticFacts,
          scopes: analysis.scopes,
          enrichedSnapshot: analysis.snapshot
        };
      }
      parentPort!.postMessage({ id: task.id, success: true, result });
    } catch (e) {
      parentPort!.postMessage({ id: task.id, success: false, error: String(e) });
    }
  });
}
