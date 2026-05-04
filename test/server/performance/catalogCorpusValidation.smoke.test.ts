import * as assert from 'assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';

import type { Hover } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  buildCatalogCorpusValidationReport,
  type CatalogCorpusValidationProbe,
} from '../../../src/server/features/catalogCorpusValidation';
import { buildDiagnosticsForDocument } from '../../../src/server/features/diagnostics';
import { provideHover } from '../../../src/server/features/hover';
import { provideCompletion } from '../../../src/server/features/completion';
import { getQueryConsumerPolicy } from '../../../src/server/features/queryScopePolicy';
import { indexWorkspace } from '../../../src/server/indexer/workspaceIndexer';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import type { PbSystemSymbolDomain } from '../../../src/server/knowledge/system/types';
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
}

interface BaseProbeDefinition {
  corpus: CorpusKey;
  label: string;
  domain: PbSystemSymbolDomain;
  filePath: string;
  needle: string;
}

interface HoverProbeDefinition extends BaseProbeDefinition {
  kind: 'hover';
  token: string;
  expectedSubstring: string;
  offset?: number;
}

interface CompletionProbeDefinition extends BaseProbeDefinition {
  kind: 'completion';
  token: string;
  expectedLabel: string;
  offset?: number;
}

interface DiagnosticsProbeDefinition extends BaseProbeDefinition {
  kind: 'diagnostics';
  endingNeedle?: string;
}

type ProbeDefinition = HoverProbeDefinition | CompletionProbeDefinition | DiagnosticsProbeDefinition;

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
  };
}

function loadPowerBuilderDocument(fsPath: string): TextDocument {
  return TextDocument.create(toFileUri(fsPath), 'powerbuilder', 1, fs.readFileSync(fsPath, 'utf8'));
}

function findLineIndex(lines: readonly string[], needle: string, filePath: string): number {
  const lineIndex = lines.findIndex((line) => line.includes(needle));
  assert.notEqual(lineIndex, -1, `No se encontro el needle ${needle} en ${path.basename(filePath)}`);
  return lineIndex;
}

function findPosition(
  document: TextDocument,
  needle: string,
  token: string,
  filePath: string,
  offset = 2,
): { line: number; character: number } {
  const lines = document.getText().split(/\r?\n/);
  const lineIndex = findLineIndex(lines, needle, filePath);
  const character = lines[lineIndex].indexOf(token);
  assert.notEqual(character, -1, `No se encontro el token ${token} en ${path.basename(filePath)}:${lineIndex + 1}`);
  return { line: lineIndex, character: character + offset };
}

function extractHoverMarkdown(hover: Hover | null): string | null {
  if (!hover) {
    return null;
  }

  const { contents } = hover;
  if (typeof contents === 'string') {
    return contents;
  }
  if (Array.isArray(contents)) {
    return contents.map((entry) => typeof entry === 'string' ? entry : entry.value).join('\n');
  }

  return contents.value;
}

function summarizeMarkdown(markdown: string): string {
  return markdown.replace(/\s+/g, ' ').trim().slice(0, 160);
}

function formatIssues<T extends { label: string }>(issues: readonly T[]): string {
  if (issues.length === 0) {
    return 'sin issues';
  }

  return issues.map((issue) => issue.label).join(', ');
}

function runHoverProbe(
  indexed: IndexedCorpus,
  definition: HoverProbeDefinition,
): CatalogCorpusValidationProbe {
  const budgetMs = getQueryConsumerPolicy('hover').budgetMs;
  const document = loadPowerBuilderDocument(definition.filePath);
  const position = findPosition(
    document,
    definition.needle,
    definition.token,
    definition.filePath,
    definition.offset ?? 2,
  );
  // B336 protege la latencia servida sobre corpora ya indexados; el cold parse inicial
  // sigue cubierto por los perf tests de archivo activo y no debe contaminar esta baseline.
  provideHover(document, position, indexed.kb, indexed.catalog, indexed.graph);
  const startedAt = performance.now();
  const hover = provideHover(document, position, indexed.kb, indexed.catalog, indexed.graph);
  const durationMs = performance.now() - startedAt;
  const markdown = extractHoverMarkdown(hover);

  if (!markdown) {
    return {
      corpus: definition.corpus,
      label: definition.label,
      domain: definition.domain,
      feature: 'hover',
      status: 'miss',
      expected: definition.expectedSubstring,
      actualMatches: [],
      detail: 'Hover no devolvio markdown.',
      uri: document.uri,
      line: position.line + 1,
      durationMs,
      budgetMs,
    };
  }

  const status = markdown.toLowerCase().includes(definition.expectedSubstring.toLowerCase())
    ? 'hit'
    : 'ambiguous';

  return {
    corpus: definition.corpus,
    label: definition.label,
    domain: definition.domain,
    feature: 'hover',
    status,
    expected: definition.expectedSubstring,
    actualMatches: [summarizeMarkdown(markdown)],
    ...(status === 'ambiguous'
      ? { detail: 'Hover devolvio contenido, pero no el marcador esperado para este dominio.' }
      : {}),
    uri: document.uri,
    line: position.line + 1,
    durationMs,
    budgetMs,
  };
}

function runCompletionProbe(
  indexed: IndexedCorpus,
  definition: CompletionProbeDefinition,
): CatalogCorpusValidationProbe {
  const budgetMs = getQueryConsumerPolicy('completion').budgetMs;
  const document = loadPowerBuilderDocument(definition.filePath);
  const position = findPosition(
    document,
    definition.needle,
    definition.token,
    definition.filePath,
    definition.offset ?? definition.token.length,
  );
  provideCompletion(document, position, indexed.kb, indexed.catalog, indexed.graph);
  const startedAt = performance.now();
  const items = provideCompletion(document, position, indexed.kb, indexed.catalog, indexed.graph) ?? [];
  const durationMs = performance.now() - startedAt;
  const matches = items
    .filter((item) => String(item.label).toLowerCase() === definition.expectedLabel.toLowerCase())
    .map((item) => String(item.label));

  const status = matches.length === 1
    ? 'hit'
    : matches.length === 0
      ? 'miss'
      : 'ambiguous';

  return {
    corpus: definition.corpus,
    label: definition.label,
    domain: definition.domain,
    feature: 'completion',
    status,
    expected: definition.expectedLabel,
    actualMatches: matches,
    ...(status === 'miss'
      ? { detail: 'Completion no devolvio el label esperado.' }
      : status === 'ambiguous'
        ? { detail: 'Completion devolvio varias coincidencias equivalentes.' }
        : {}),
    uri: document.uri,
    line: position.line + 1,
    durationMs,
    budgetMs,
  };
}

function overlapsLineRange(
  diagnosticStartLine: number,
  diagnosticEndLine: number,
  startLine: number,
  endLine: number,
): boolean {
  return diagnosticStartLine <= endLine && diagnosticEndLine >= startLine;
}

function runDiagnosticsProbe(
  indexed: IndexedCorpus,
  definition: DiagnosticsProbeDefinition,
): CatalogCorpusValidationProbe {
  const budgetMs = getQueryConsumerPolicy('diagnostics-unresolved-callable').budgetMs;
  const document = loadPowerBuilderDocument(definition.filePath);
  const lines = document.getText().split(/\r?\n/);
  const startLine = findLineIndex(lines, definition.needle, definition.filePath);
  const endLine = definition.endingNeedle
    ? findLineIndex(lines, definition.endingNeedle, definition.filePath)
    : startLine;
  buildDiagnosticsForDocument(document, indexed.kb, indexed.catalog, indexed.graph);
  const startedAt = performance.now();
  const diagnostics = buildDiagnosticsForDocument(document, indexed.kb, indexed.catalog, indexed.graph);
  const durationMs = performance.now() - startedAt;
  const overlaps = diagnostics.filter((diagnostic) => overlapsLineRange(
    diagnostic.range.start.line,
    diagnostic.range.end.line,
    startLine,
    endLine,
  ));

  return {
    corpus: definition.corpus,
    label: definition.label,
    domain: definition.domain,
    feature: 'diagnostics',
    status: overlaps.length === 0 ? 'hit' : 'miss',
    expected: 'Sin diagnostics sobre el call-site revisado.',
    actualMatches: overlaps.map((diagnostic) => diagnostic.message),
    ...(overlaps.length > 0
      ? { detail: 'Diagnostics publico findings sobre el call-site que deberia quedar limpio.' }
      : {}),
    uri: document.uri,
    line: startLine + 1,
    durationMs,
    budgetMs,
  };
}

suite('performance/catalogCorpusValidation-smoke (B336)', () => {
  test('valida consumo catalog-driven por dominio sobre PFC, OrderEntry y legacy sin misses ni budget regressions', async function () {
    if (!hasPfcSolution() || !hasOrderEntry() || !hasLegacyPblDump()) {
      this.skip();
      return;
    }

    this.timeout(180000);
    const pfcRoot = getPfcSolutionPath();
    const orderEntryRoot = getOrderEntryPath();
    const legacyRoot = getLegacyPblDumpPath();
    const [pfc, orderEntry, legacy] = await Promise.all([
      indexCorpus(pfcRoot),
      indexCorpus(orderEntryRoot),
      indexCorpus(legacyRoot),
    ]);

    const indexedByCorpus: Record<CorpusKey, IndexedCorpus> = {
      pfc,
      'order-entry': orderEntry,
      legacy,
    };

    const probes: ProbeDefinition[] = [
      {
        kind: 'hover',
        corpus: 'pfc',
        label: 'pfc-sqlca-hover',
        domain: 'system-globals',
        filePath: path.join(pfcRoot, 'examples', 'exmmain.pbl', 'w_master.srw'),
        needle: 'If lds_titles.of_settransobject(SQLCA) <> 1 Then Return "!"',
        token: 'SQLCA',
        expectedSubstring: 'SQLCA : Transaction',
      },
      {
        kind: 'completion',
        corpus: 'pfc',
        label: 'pfc-sqlca-completion',
        domain: 'system-globals',
        filePath: path.join(pfcRoot, 'examples', 'exmmain.pbl', 'w_master.srw'),
        needle: 'If lds_titles.of_settransobject(SQLCA) <> 1 Then Return "!"',
        token: 'SQLCA',
        expectedLabel: 'SQLCA',
      },
      {
        kind: 'hover',
        corpus: 'legacy',
        label: 'legacy-libraryexport-hover',
        domain: 'global-functions',
        filePath: path.join(legacyRoot, 'Export Source Code', 'uo_dw.sru'),
        needle: 'ls_syntax=LibraryExport(as_library,as_objname,ExportDataWindow!)',
        token: 'LibraryExport',
        expectedSubstring: 'Exports an object from a library',
      },
      {
        kind: 'hover',
        corpus: 'legacy',
        label: 'legacy-describe-hover',
        domain: 'datawindow-functions',
        filePath: path.join(legacyRoot, 'Export Source Code', 'uo_dw.sru'),
        needle: 'ls_syntax=adw.Describe("DataWindow.Syntax")',
        token: 'Describe',
        expectedSubstring: 'dwcontrol.Describe',
      },
      {
        kind: 'diagnostics',
        corpus: 'order-entry',
        label: 'orderentry-transaction-callsite-diagnostics',
        domain: 'datawindow-functions',
        filePath: path.join(orderEntryRoot, 'oes_product.pbl', 'wn_product_sales_report_e.srw'),
        needle: 'THIS.SetTransObject ( SQLCA )',
        endingNeedle: 'THIS.Retrieve ( ) ',
      },
    ];

    const probeResults = probes.map((probe): CatalogCorpusValidationProbe => {
      const indexed = indexedByCorpus[probe.corpus];
      switch (probe.kind) {
        case 'hover':
          return runHoverProbe(indexed, probe);
        case 'completion':
          return runCompletionProbe(indexed, probe);
        case 'diagnostics':
          return runDiagnosticsProbe(indexed, probe);
      }
    });

    const report = buildCatalogCorpusValidationReport(probeResults);

    assert.equal(report.totalProbes, 5);
    assert.equal(report.misses, 0, `Misses inesperados: ${JSON.stringify(report.findings, null, 2)}`);
    assert.equal(report.ambiguities, 0, `Ambiguedades inesperadas: ${JSON.stringify(report.findings, null, 2)}`);
    assert.equal(
      report.budgetViolations.length,
      0,
      `Budget violations inesperadas: ${JSON.stringify(report.budgetViolations, null, 2)}`,
    );
    assert.equal(report.hits, report.totalProbes);

    assert.equal(report.byDomain['system-globals']?.hits, 2);
    assert.equal(report.byDomain['global-functions']?.hits, 1);
    assert.equal(report.byDomain['datawindow-functions']?.hits, 2);
    assert.equal(report.byFeature.hover.hits, 3);
    assert.equal(report.byFeature.completion.hits, 1);
    assert.equal(report.byFeature.diagnostics.hits, 1);

    const legacyAndOrderEntryCovered = ['legacy-libraryexport-hover', 'legacy-describe-hover', 'orderentry-transaction-callsite-diagnostics']
      .every((label) => probeResults.some((probe) => probe.label === label && probe.status === 'hit'));
    assert.equal(legacyAndOrderEntryCovered, true, `Cobertura incompleta en corpora reales: ${formatIssues(probeResults)}`);
  });
});