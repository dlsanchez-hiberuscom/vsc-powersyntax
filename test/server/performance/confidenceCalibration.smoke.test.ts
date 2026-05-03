import * as assert from 'assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  buildConfidenceCalibrationReport,
  type ConfidenceCalibrationExpectation,
  type ConfidenceCalibrationScenario,
} from '../../../src/server/features/confidenceCalibration';
import type { QueryResolutionConfidence } from '../../../src/server/knowledge/resolution/semanticQueryService';
import type { ProgressReadinessSnapshot } from '../../../src/server/features/progressReadiness';
import { buildCurrentObjectContext } from '../../../src/server/features/currentObjectContext';
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
import { getLegacyPblDumpPath, hasLegacyPblDump } from '../helpers/publicCorpusPaths';

type CorpusKey = 'pfc' | 'order-entry' | 'legacy';

interface IndexedCorpus {
  kb: KnowledgeBase;
  graph: InheritanceGraph;
  catalog: SystemCatalog;
  workspaceState: WorkspaceState;
}

interface ProbeExpectation {
  corpus: CorpusKey;
  label: string;
  filePath: string;
  needle: string;
  token: string;
  expectedConfidence: QueryResolutionConfidence;
}

interface SampleProbe {
  confidence: QueryResolutionConfidence;
  line: number;
  reasonCode?: string;
  uri: string;
}

function toFileUri(fsPath: string): string {
  return pathToFileURL(fsPath).toString();
}

function createReadySnapshot(): ProgressReadinessSnapshot {
  return {
    readiness: {
      state: 'ready',
      levels: {
        activeContextReady: true,
        projectReady: true,
        workspaceReady: true,
      },
    },
    progress: {
      discovery: { current: 1, total: 1 },
      indexing: {
        current: 1,
        total: 1,
        degraded: false,
        skipped: 0,
        failed: 0,
      },
    },
    projectStatus: {
      readiness: 'ready',
      totalFiles: 1,
      indexedFiles: 1,
    },
    projectStatusText: 'workspace — ready',
  };
}

function buildExpectations(confidence: QueryResolutionConfidence): ConfidenceCalibrationExpectation[] {
  switch (confidence) {
    case 'high':
      return [
        { feature: 'hover', expectedAction: 'allow' },
        { feature: 'completion', expectedAction: 'allow' },
        { feature: 'definition', expectedAction: 'allow' },
        { feature: 'references', expectedAction: 'allow' },
        { feature: 'rename', expectedAction: 'allow' },
        { feature: 'signature-help', expectedAction: 'allow' },
      ];
    case 'medium':
      return [
        { feature: 'hover', expectedAction: 'allow' },
        { feature: 'completion', expectedAction: 'allow' },
        { feature: 'definition', expectedAction: 'allow' },
        { feature: 'references', expectedAction: 'block' },
        { feature: 'rename', expectedAction: 'block' },
        { feature: 'signature-help', expectedAction: 'allow' },
      ];
    case 'low':
      return [
        { feature: 'hover', expectedAction: 'allow' },
        { feature: 'completion', expectedAction: 'allow' },
        { feature: 'definition', expectedAction: 'block' },
        { feature: 'references', expectedAction: 'block' },
        { feature: 'rename', expectedAction: 'block' },
        { feature: 'signature-help', expectedAction: 'allow' },
      ];
  }
}

async function indexCorpus(rootPath: string): Promise<IndexedCorpus> {
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

function probeConfidence(indexed: IndexedCorpus, expectation: ProbeExpectation): SampleProbe {
  const content = fs.readFileSync(expectation.filePath, 'utf8');
  const document = TextDocument.create(toFileUri(expectation.filePath), 'powerbuilder', 1, content);
  const lines = content.split(/\r?\n/);
  const lineIndex = lines.findIndex((line) => line.includes(expectation.needle));
  assert.notEqual(lineIndex, -1, `No se encontro el needle ${expectation.needle} en ${path.basename(expectation.filePath)}`);

  const character = lines[lineIndex].indexOf(expectation.token);
  assert.notEqual(character, -1, `No se encontro el token ${expectation.token} en la linea ${lineIndex + 1}`);

  const context = buildCurrentObjectContext(
    document,
    { line: lineIndex, character: character + 2 },
    indexed.kb,
    indexed.graph,
    indexed.catalog,
    { workspaceState: indexed.workspaceState },
  );

  const confidence = context.evidence?.resolutionConfidence;
  assert.ok(confidence, `Se esperaba resolutionConfidence para ${expectation.label}`);

  return {
    confidence,
    line: lineIndex + 1,
    ...(context.evidence?.primaryReasonCode ? { reasonCode: context.evidence.primaryReasonCode } : {}),
    uri: document.uri,
  };
}

suite('performance/confidenceCalibration-smoke (B283)', () => {
  test('calibra thresholds por feature con escenarios low, medium y high sobre PFC, OrderEntry y legacy', async function () {
    if (!hasPfcSolution() || !hasOrderEntry() || !hasLegacyPblDump()) {
      this.skip();
      return;
    }

    this.timeout(180000);
    const ready = createReadySnapshot();
    const pfcRoot = getPfcSolutionPath();
    const orderEntryRoot = getOrderEntryPath();
    const legacyRoot = getLegacyPblDumpPath();

    const [pfc, orderEntry, legacy] = await Promise.all([
      indexCorpus(pfcRoot),
      indexCorpus(orderEntryRoot),
      indexCorpus(legacyRoot),
    ]);

    const probes: ProbeExpectation[] = [
      {
        corpus: 'pfc',
        label: 'pfc-trigger-event-global-fallback',
        filePath: path.join(pfcRoot, 'pfc libs', 'pfcdwsrv.pbl', 'pfc_n_cst_filterattrib.sru'),
        needle: 'TriggerEvent( this, "constructor" )',
        token: 'TriggerEvent',
        expectedConfidence: 'low',
      },
      {
        corpus: 'order-entry',
        label: 'orderentry-super-create-inherited',
        filePath: path.join(orderEntryRoot, 'oes_main.pbl', 'nc_ac_orderentry.sru'),
        needle: 'call super::create',
        token: 'create',
        expectedConfidence: 'medium',
      },
      {
        corpus: 'order-entry',
        label: 'orderentry-member-write-log',
        filePath: path.join(orderEntryRoot, 'oes_main.pbl', 'nc_ac_orderentry.sru'),
        needle: 'THIS.of_write_log',
        token: 'of_write_log',
        expectedConfidence: 'high',
      },
      {
        corpus: 'legacy',
        label: 'legacy-library-export-fallback',
        filePath: path.join(legacyRoot, 'Export Source Code', 'uo_dw.sru'),
        needle: 'ls_syntax=LibraryExport',
        token: 'LibraryExport',
        expectedConfidence: 'low',
      },
    ];

    const indexedByCorpus: Record<CorpusKey, IndexedCorpus> = {
      pfc,
      'order-entry': orderEntry,
      legacy,
    };

    const scenarios: ConfidenceCalibrationScenario[] = probes.map((expectation) => {
      const sample = probeConfidence(indexedByCorpus[expectation.corpus], expectation);
      assert.equal(
        sample.confidence,
        expectation.expectedConfidence,
        `${expectation.label} deberia permanecer en confidence ${expectation.expectedConfidence}`,
      );

      return {
        corpus: expectation.corpus,
        label: expectation.label,
        readinessSnapshot: ready,
        resolutionConfidence: sample.confidence,
        expectations: buildExpectations(expectation.expectedConfidence),
        uri: sample.uri,
        line: sample.line,
        ...(sample.reasonCode ? { reasonCode: sample.reasonCode } : {}),
      };
    });

    const report = buildConfidenceCalibrationReport(scenarios);

    assert.equal(report.falsePositives, 0, `False positives inesperados: ${JSON.stringify(report.findings, null, 2)}`);
    assert.equal(report.falseNegatives, 0, `False negatives inesperados: ${JSON.stringify(report.findings, null, 2)}`);
    assert.equal(report.matches, report.totalExpectations);
    assert.equal(report.byFeature.hover.matches, 4);
    assert.equal(report.byFeature.completion.matches, 4);
    assert.equal(report.byFeature['signature-help'].matches, 4);
    assert.equal(report.byFeature.definition.matches, 4);
    assert.equal(report.byFeature.references.matches, 4);
    assert.equal(report.byFeature.rename.matches, 4);
  });
});