import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { buildCurrentObjectContext } from '../../../src/server/features/currentObjectContext';
import { buildDataWindowSqlLineage } from '../../../src/server/features/dataWindowSqlLineage';
import { buildPowerBuilderDependencyGraph } from '../../../src/server/features/dependencyGraph';
import { buildDiagnosticsForDocument } from '../../../src/server/features/diagnostics';
import {
  buildSemanticConsistencyOracleReport,
  summarizeDiagnosticsForConsistency,
} from '../../../src/server/features/semanticConsistencyOracle';
import { buildSemanticWorkspaceManifest } from '../../../src/server/features/semanticWorkspaceManifest';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import type { SourceOrigin } from '../../../src/shared/sourceOrigin';

suite('unit/semanticConsistencyOracle (B264)', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;
  let catalog: SystemCatalog;
  let workspaceState: WorkspaceState;

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);
    catalog = new SystemCatalog();
    workspaceState = new WorkspaceState();
  });

  function setupAnalyzedDocument(
    uri: string,
    content: string,
    sourceOrigin: SourceOrigin = 'pbl-folder-source',
  ): TextDocument {
    invalidateDocumentAnalysis(uri);
    const document = TextDocument.create(uri, 'powerbuilder', 1, content);
    const analysis = analyzeDocument(document);
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    workspaceState.addSourceFile(uri, sourceOrigin);
    return document;
  }

  function buildWindowFixture() {
    const baseUri = 'file:///proj/lib_app.pbl/w_context_base.sru';
    const dataWindowUri = 'file:///proj/lib_app.pbl/d_sales_orders.srd';
    const mainUri = 'file:///proj/lib_app.pbl/w_context.srw';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });

    setupAnalyzedDocument(baseUri, [
      'forward',
      'global type w_context_base from window',
      'end type',
      'end forward',
      'global type w_context_base from window',
      'integer ii_base_counter',
      'end type',
      'public function integer of_inherited();',
      '  return 42',
      'end function',
    ].join('\r\n'));

    setupAnalyzedDocument(dataWindowUri, [
      '$PBExportHeader$d_sales_orders.srd',
      'release 39;',
      'table(retrieve="PBSELECT( VERSION(400) TABLE(NAME=~"sales_order~" ) ARG(NAME = ~"custarg~" TYPE = number) " arguments=(("custarg", number)) )")',
    ].join('\r\n'));

    const document = setupAnalyzedDocument(mainUri, [
      'forward',
      'global type w_context from w_context_base',
      'end type',
      'end forward',
      'forward prototypes',
      'public function integer of_only_proto(string as_name)',
      'public subroutine of_build()',
      'end prototypes',
      'global type w_context from w_context_base',
      'end type',
      'event create;',
      '  call super::create',
      'end event',
      'public subroutine of_build();',
      '  datastore ids_orders',
      '  ids_orders.SetTrans(&',
      '    SQLCA)',
      '  ids_orders.DataObject = &',
      '    "d_sales_orders"',
      '  ids_orders.Retrieve(&',
      '    1, &',
      '    2)',
      '  of_inherited()',
      'end subroutine',
    ].join('\r\n'));

    workspaceState.refreshProjectRouting();
    const lines = document.getText().split(/\r?\n/);
    const retrieveLine = lines.findIndex((line) => line.includes('ids_orders.Retrieve('));
    const retrieveCharacter = lines[retrieveLine].indexOf('ids_orders') + 2;
    const diagnostics = buildDiagnosticsForDocument(document, kb, catalog, graph);

    return {
      document,
      currentObjectContext: buildCurrentObjectContext(
        document,
        {
          line: retrieveLine,
          character: retrieveCharacter,
          maxExcerptLines: 12,
          maxReferencedSymbols: 8,
        },
        kb,
        graph,
        catalog,
        { workspaceState },
      ),
      workspaceManifest: buildSemanticWorkspaceManifest(
        undefined,
        kb,
        graph,
        workspaceState,
        null,
        { state: 'ready' },
      ),
      dependencyGraph: buildPowerBuilderDependencyGraph(
        {
          uri: document.uri,
          maxDependencies: 8,
          maxDependents: 8,
        },
        kb,
        workspaceState,
      ),
      diagnostics: summarizeDiagnosticsForConsistency(diagnostics),
      dataWindowSqlLineage: buildDataWindowSqlLineage(
        {
          uri: document.uri,
          line: retrieveLine,
          maxDepth: 4,
        },
        kb,
      ),
    };
  }

  test('reporta healthy cuando currentObjectContext, manifest, grafo, diagnostics y lineage cuentan la misma historia', () => {
    const fixture = buildWindowFixture();

    const report = buildSemanticConsistencyOracleReport(fixture);

    assert.equal(report.status, 'healthy');
    assert.equal(report.findings.length, 0);
    assert.equal(report.focus?.objectName, 'w_context');
    assert.equal(report.focus?.objectKind, 'window');
  });

  test('emite reason codes específicos cuando las surfaces divergen', () => {
    const fixture = buildWindowFixture();
    const report = buildSemanticConsistencyOracleReport({
      currentObjectContext: {
        ...fixture.currentObjectContext,
        evidence: {
          ...fixture.currentObjectContext.evidence,
          resolutionConfidence: 'high',
          evidenceKinds: [...(fixture.currentObjectContext.evidence?.evidenceKinds ?? [])],
        },
      },
      workspaceManifest: {
        ...fixture.workspaceManifest,
        objects: fixture.workspaceManifest.objects.map((entry) => entry.uri === fixture.document.uri
          ? {
            ...entry,
            name: 'w_other',
            objectKind: 'userobject',
            projectUri: 'file:///proj/other_app.pbt',
            library: 'file:///proj/lib_other.pbl',
            sourceOrigin: 'solution-source',
            baseType: 'w_other_base',
            readiness: 'project-semantic-ready',
          }
          : entry),
      },
      dependencyGraph: {
        ...fixture.dependencyGraph,
        focus: {
          ...fixture.dependencyGraph.focus!,
          objectName: 'w_other',
          baseType: 'w_other_base',
          projectUri: 'file:///proj/other_app.pbt',
          library: 'file:///proj/lib_other.pbl',
          sourceOrigin: 'solution-source',
        },
      },
      diagnostics: {
        total: 0,
        byCode: {},
      },
      dataWindowSqlLineage: {
        ...fixture.dataWindowSqlLineage,
        source: {
          ...fixture.dataWindowSqlLineage.source,
          dataObject: 'd_other',
          state: 'ambiguous',
        },
        lineage: fixture.dataWindowSqlLineage.lineage
          ? {
            ...fixture.dataWindowSqlLineage.lineage,
            dataObject: 'd_other',
            uri: 'file:///proj/lib_app.pbl/d_other.srd',
          }
          : fixture.dataWindowSqlLineage.lineage,
      },
    });

    const codes = new Set(report.findings.map((finding) => finding.code));

    assert.equal(report.status, 'error');
    assert.ok(codes.has('object-name-mismatch'));
    assert.ok(codes.has('object-kind-mismatch'));
    assert.ok(codes.has('project-mismatch'));
    assert.ok(codes.has('library-mismatch'));
    assert.ok(codes.has('source-origin-mismatch'));
    assert.ok(codes.has('ancestor-chain-mismatch'));
    assert.ok(codes.has('diagnostic-total-mismatch'));
    assert.ok(codes.has('readiness-mismatch'));
    assert.ok(codes.has('confidence-mismatch'));
    assert.ok(codes.has('datawindow-binding-mismatch'));
  });

  test('no trata orca-staging colapsado como drift cuando la surface real sigue siendo preferida', () => {
    const realUri = 'file:///proj/lib_app.pbl/n_shared.sru';
    const stagedUri = 'file:///proj/.vsc-powersyntax/orca-export/orca-staging/lib_app.pbl-source/n_shared.sru';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });
    workspaceState.registerLibrarySourceAlias(
      'file:///proj/lib_app.pbl',
      'file:///proj/.vsc-powersyntax/orca-export/orca-staging/lib_app.pbl-source',
    );

    const source = [
      'forward',
      'global type n_shared from nonvisualobject',
      'end type',
      'end forward',
      'global type n_shared from nonvisualobject',
      'end type',
    ].join('\r\n');

    const document = setupAnalyzedDocument(realUri, source, 'solution-source');
    setupAnalyzedDocument(stagedUri, source, 'orca-staging');
    workspaceState.refreshProjectRouting();

    const report = buildSemanticConsistencyOracleReport({
      currentObjectContext: buildCurrentObjectContext(
        document,
        undefined,
        kb,
        graph,
        catalog,
        { workspaceState },
      ),
      workspaceManifest: buildSemanticWorkspaceManifest(
        {
          maxObjects: 1,
          maxSymbols: 10,
        },
        kb,
        graph,
        workspaceState,
        null,
        { state: 'ready' },
      ),
      dependencyGraph: buildPowerBuilderDependencyGraph(
        {
          uri: realUri,
          maxDependencies: 4,
          maxDependents: 4,
        },
        kb,
        workspaceState,
      ),
    });

    assert.equal(report.status, 'healthy');
    assert.equal(report.findings.length, 0);
    assert.ok(!report.findings.some((finding) => finding.code === 'source-origin-mismatch'));
  });
});