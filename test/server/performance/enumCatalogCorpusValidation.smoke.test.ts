import * as assert from 'assert/strict';
import * as fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  buildEnumCatalogCorpusUsageReport,
  collectEnumCatalogCorpusUsageObservations,
  type EnumCatalogCorpusUsageObservation,
  type EnumCatalogCorpusUsageReport,
} from '../../../src/server/features/catalogCorpusValidation';
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

interface IndexedCorpus {
  kb: KnowledgeBase;
  graph: InheritanceGraph;
  catalog: SystemCatalog;
  workspaceState: WorkspaceState;
}

interface CorpusScanResult {
  report: EnumCatalogCorpusUsageReport;
  observations: readonly EnumCatalogCorpusUsageObservation[];
  scannedFiles: number;
  matchingFiles: number;
  durationMs: number;
}

function toFileUri(fsPath: string): string {
  return pathToFileURL(fsPath).toString();
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

function scanCorpusForEnumUsage(corpus: string, indexed: IndexedCorpus): CorpusScanResult {
  const observations: EnumCatalogCorpusUsageObservation[] = [];
  let scannedFiles = 0;
  let matchingFiles = 0;
  const startedAt = performance.now();

  for (const uri of indexed.workspaceState.getAllSourceFiles()) {
    scannedFiles += 1;
    const fsPath = fileURLToPath(uri);
    const text = fs.readFileSync(fsPath, 'utf8');
    if (!text.includes('!')) {
      continue;
    }

    matchingFiles += 1;
    const document = TextDocument.create(uri, 'powerbuilder', 1, text);
    observations.push(...collectEnumCatalogCorpusUsageObservations({
      corpus,
      document,
      kb: indexed.kb,
      graph: indexed.graph,
      systemCatalog: indexed.catalog,
    }));
  }

  return {
    report: buildEnumCatalogCorpusUsageReport(observations),
    observations,
    scannedFiles,
    matchingFiles,
    durationMs: performance.now() - startedAt,
  };
}

function summarizeReport(report: EnumCatalogCorpusUsageReport): Omit<EnumCatalogCorpusUsageReport, 'byCorpus' | 'findings'> {
  return {
    totalDetectedValues: report.totalDetectedValues,
    catalogedValues: report.catalogedValues,
    officialKnownValues: report.officialKnownValues,
    curatedKnownValues: report.curatedKnownValues,
    unknownValues: report.unknownValues,
    candidates: report.candidates,
    falsePositives: report.falsePositives,
    outOfContextValues: report.outOfContextValues,
  };
}

function sampleFindings(report: EnumCatalogCorpusUsageReport): readonly Record<string, string | number | undefined>[] {
  return report.findings.slice(0, 10).map((finding) => ({
    corpus: finding.corpus,
    line: finding.line,
    value: finding.value,
    classification: finding.classification,
    expectedEnumType: finding.expectedEnumType,
    actualEnumType: finding.actualEnumType,
    target: finding.target,
  }));
}

function roundMs(value: number): number {
  return Number(value.toFixed(2));
}

suite('performance/enumCatalogCorpusValidation-smoke (B364)', () => {
  test('PFC/OrderEntry/legacy: clasifica uso real de enum values y produce reporte corpus-driven', async function () {
    if (!hasPfcSolution() || !hasOrderEntry() || !hasLegacyPblDump()) {
      this.skip();
      return;
    }

    this.timeout(300000);

    const [pfc, orderEntry, legacy] = await Promise.all([
      indexCorpus(getPfcSolutionPath()),
      indexCorpus(getOrderEntryPath()),
      indexCorpus(getLegacyPblDumpPath()),
    ]);

    const pfcScan = scanCorpusForEnumUsage('pfc', pfc);
    const orderEntryScan = scanCorpusForEnumUsage('order-entry', orderEntry);
    const legacyScan = scanCorpusForEnumUsage('legacy', legacy);
    const combinedReport = buildEnumCatalogCorpusUsageReport([
      ...pfcScan.observations,
      ...orderEntryScan.observations,
      ...legacyScan.observations,
    ]);

    console.log(JSON.stringify({
      combined: summarizeReport(combinedReport),
      pfc: {
        ...summarizeReport(pfcScan.report),
        scannedFiles: pfcScan.scannedFiles,
        matchingFiles: pfcScan.matchingFiles,
        durationMs: roundMs(pfcScan.durationMs),
      },
      orderEntry: {
        ...summarizeReport(orderEntryScan.report),
        scannedFiles: orderEntryScan.scannedFiles,
        matchingFiles: orderEntryScan.matchingFiles,
        durationMs: roundMs(orderEntryScan.durationMs),
      },
      legacy: {
        ...summarizeReport(legacyScan.report),
        scannedFiles: legacyScan.scannedFiles,
        matchingFiles: legacyScan.matchingFiles,
        durationMs: roundMs(legacyScan.durationMs),
      },
      findingSamples: sampleFindings(combinedReport),
    }, null, 2));

    assert.ok(pfcScan.scannedFiles > 0, 'PFC debe aportar archivos fuente reales.');
    assert.ok(orderEntryScan.scannedFiles > 0, 'OrderEntry debe aportar archivos fuente reales.');
    assert.ok(legacyScan.scannedFiles > 0, 'legacy debe aportar archivos fuente reales.');

    assert.ok(pfcScan.report.totalDetectedValues > 0, 'PFC debe contener usos reales de enum values.');
    assert.ok(orderEntryScan.report.totalDetectedValues > 0, 'OrderEntry debe contener usos reales de enum values.');
    assert.ok(legacyScan.report.totalDetectedValues > 0, 'legacy debe contener usos reales de enum values.');
    assert.ok(combinedReport.catalogedValues > 0, 'El reporte combinado debe detectar valores catalogados en código real.');
    assert.equal(Object.keys(combinedReport.byCorpus).length, 3, 'El reporte combinado debe conservar el breakdown por corpus.');
  });
});