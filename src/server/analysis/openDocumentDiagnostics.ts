import type { Connection } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { publishDiagnosticsNow } from './diagnosticScheduler';
import { TaskScheduler } from '../runtime/scheduler';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { WorkspaceState } from '../workspace/workspaceState';

export interface RepublishOpenDiagnosticsOptions {
  connection: Connection;
  documents: readonly TextDocument[];
  scheduler: TaskScheduler;
  knowledgeBase: KnowledgeBase;
  systemCatalog: SystemCatalog;
  inheritanceGraph: InheritanceGraph;
  workspaceState: WorkspaceState;
  isSemanticallyServedDocument(document: TextDocument): boolean;
  uris?: readonly string[];
}

export function republishOpenDiagnosticsForDocuments(options: RepublishOpenDiagnosticsOptions): void {
  const targetUris = options.uris ? new Set(options.uris) : null;

  for (const document of options.documents) {
    if (targetUris && !targetUris.has(document.uri)) {
      continue;
    }
    if (!options.isSemanticallyServedDocument(document)) {
      continue;
    }

    publishDiagnosticsNow(
      options.connection,
      document,
      options.scheduler,
      options.knowledgeBase,
      options.systemCatalog,
      options.inheritanceGraph,
      options.workspaceState
    );
  }
}