import * as assert from 'assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { buildCurrentObjectContext } from '../../../src/server/features/currentObjectContext';
import { buildPowerBuilderDependencyGraph } from '../../../src/server/features/dependencyGraph';
import { buildDiagnosticsForDocument } from '../../../src/server/features/diagnostics';
import {
  buildSemanticConsistencyOracleReport,
  summarizeDiagnosticsForConsistency,
} from '../../../src/server/features/semanticConsistencyOracle';
import { buildSemanticWorkspaceManifest } from '../../../src/server/features/semanticWorkspaceManifest';
import { indexWorkspace } from '../../../src/server/indexer/workspaceIndexer';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { createCancellationSource } from '../../../src/server/runtime/cancellation';
import { NodeFileSystem } from '../../../src/server/system/fileSystem';
import { discoverWorkspace } from '../../../src/server/workspace/discovery';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import { getOrderEntryPath, hasOrderEntry } from '../helpers/orderEntryPaths';
import { getPfcSolutionPath, hasPfcSolution } from '../helpers/pfcPaths';

function toFileUri(fsPath: string): string {
  return pathToFileURL(fsPath).toString();
}

async function indexCorpus(rootPath: string): Promise<{
  kb: KnowledgeBase;
  graph: InheritanceGraph;
  catalog: SystemCatalog;
  workspaceState: WorkspaceState;
}> {
  const fileSystem = new NodeFileSystem();
  const cache = new DocumentCache();
  const kb = new KnowledgeBase();
  const workspaceState = new WorkspaceState();
  const cancelSource = createCancellationSource();

  await discoverWorkspace([toFileUri(rootPath)], fileSystem, workspaceState, cancelSource.token);
  await indexWorkspace(fileSystem, cache, kb, workspaceState, cancelSource.token);

  return {
    kb,
    graph: new InheritanceGraph(kb),
    catalog: new SystemCatalog(),
    workspaceState,
  };
}

function loadPowerBuilderDocument(fsPath: string): TextDocument {
  return TextDocument.create(toFileUri(fsPath), 'powerbuilder', 1, fs.readFileSync(fsPath, 'utf8'));
}

function formatFindings(report: ReturnType<typeof buildSemanticConsistencyOracleReport>): string {
  if (report.findings.length === 0) {
    return 'sin findings';
  }

  return report.findings.map((finding) => `${finding.code}: ${finding.message}`).join(' | ');
}

function assertHealthyRealCorpus(
  targetPath: string,
  indexed: {
    kb: KnowledgeBase;
    graph: InheritanceGraph;
    catalog: SystemCatalog;
    workspaceState: WorkspaceState;
  },
): void {
  const document = loadPowerBuilderDocument(targetPath);
  const diagnostics = buildDiagnosticsForDocument(document, 'full', indexed.kb, indexed.catalog, indexed.graph);
  const report = buildSemanticConsistencyOracleReport({
    currentObjectContext: buildCurrentObjectContext(
      document,
      undefined,
      indexed.kb,
      indexed.graph,
      indexed.catalog,
      { workspaceState: indexed.workspaceState },
    ),
    workspaceManifest: buildSemanticWorkspaceManifest(
      {
        maxObjects: 1000,
        maxSymbols: 2000,
      },
      indexed.kb,
      indexed.graph,
      indexed.workspaceState,
      null,
      { state: 'ready' },
    ),
    dependencyGraph: buildPowerBuilderDependencyGraph(
      {
        uri: document.uri,
        maxDependencies: 16,
        maxDependents: 16,
      },
      indexed.kb,
      indexed.workspaceState,
    ),
    diagnostics: summarizeDiagnosticsForConsistency(diagnostics),
  });

  assert.equal(report.status, 'healthy', `El oracle debería quedar healthy para ${path.basename(targetPath)}. Findings: ${formatFindings(report)}`);
}

suite('performance/semanticConsistencyOracle-smoke', () => {
  test('PFC Solution: mantiene consistencia read-only sobre una clase real conocida', async function () {
    if (!hasPfcSolution()) {
      this.skip();
      return;
    }

    this.timeout(120000);
    const root = getPfcSolutionPath();
    const target = path.join(root, 'pfc libs', 'pfcdwsrv.pbl', 'pfc_n_cst_filterattrib.sru');
    const indexed = await indexCorpus(root);

    assertHealthyRealCorpus(target, indexed);
  });

  test('OrderEntry: mantiene consistencia read-only sobre un objeto enterprise representativo', async function () {
    if (!hasOrderEntry()) {
      this.skip();
      return;
    }

    this.timeout(120000);
    const root = getOrderEntryPath();
    const target = path.join(root, 'oes_main.pbl', 'nc_ac_orderentry.sru');
    const indexed = await indexCorpus(root);

    assertHealthyRealCorpus(target, indexed);
  });
});