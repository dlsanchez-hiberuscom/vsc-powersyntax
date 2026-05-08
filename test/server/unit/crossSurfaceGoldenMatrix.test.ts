import * as assert from 'assert/strict';
import * as path from 'path';

import { DiagnosticSeverity, Position, type DocumentSymbol, type Location, type SymbolInformation } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { buildSupportBundle } from '../../../src/client/support/supportBundle';
import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { buildCurrentObjectContext } from '../../../src/server/features/currentObjectContext';
import { buildDataWindowSqlLineage } from '../../../src/server/features/dataWindowSqlLineage';
import { buildPowerBuilderDependencyGraph } from '../../../src/server/features/dependencyGraph';
import { buildDiagnosticsForDocument } from '../../../src/server/features/diagnostics';
import { provideDefinition } from '../../../src/server/features/definition';
import { extractDocumentSymbolsWithReconciliation } from '../../../src/server/features/documentSymbols';
import { provideHover } from '../../../src/server/features/hover';
import { buildImpactAnalysis } from '../../../src/server/features/impactAnalysis';
import { provideReferences, type ReferenceSource } from '../../../src/server/features/references';
import { validateRenameTarget } from '../../../src/server/features/renamePreflight';
import { buildSafeEditPlan } from '../../../src/server/features/safeEditPlan';
import { getSemanticTokensLegend, provideSemanticTokens } from '../../../src/server/features/semanticTokens';
import { buildSemanticWorkspaceManifest } from '../../../src/server/features/semanticWorkspaceManifest';
import { summarizeDiagnosticsForConsistency } from '../../../src/server/features/semanticConsistencyOracle';
import { provideWorkspaceSymbols } from '../../../src/server/features/workspaceSymbols';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import {
  getPublicApiContractDescriptor,
  getReadOnlyToolBridgeDescriptor,
  type ApiDiagnosticsSnapshot,
  type ApiServerStats,
} from '../../../src/shared/publicApi';

suite('unit/crossSurfaceGoldenMatrix (B273)', () => {
  test('golden: congela una matriz resumida de surfaces visibles sobre un fixture compartido', async () => {
    const fixture = createCrossSurfaceFixture();
    const matrix = await buildCrossSurfaceMatrix(fixture);

    assert.deepEqual(matrix, {
      documentSymbols: {
        status: 'warning',
        names: [
          'create',
          'forward',
          'of_build',
          'of_build',
          'of_only_proto',
          'prototypes',
          'w_context',
          'w_context',
        ],
      },
      workspaceSymbols: [
        'w_context:5:w_context.srw',
        'w_context_base:5:w_context_base.sru',
      ],
      hover: {
        mentionsInherited: true,
        mentionsBase: true,
        mentionsInteger: true,
      },
      definition: [
        'w_context_base.sru:8:25',
      ],
      references: [
        'w_context.srw:19:3',
        'w_context_base.sru:8:25',
      ],
      renameEligibility: {
        of_build: true,
        reservedIf: false,
      },
      diagnostics: {
        total: 1,
        byCode: {
          'retrieve-arity-mismatch': 1,
        },
      },
      semanticTokens: [
        { text: 'ids_orders', type: 'variable' },
        { text: 'ids_orders', type: 'variable' },
        { text: 'ids_orders', type: 'variable' },
        { text: 'ids_orders', type: 'variable' },
        { text: 'of_inherited', type: 'function' },
        { text: 'Retrieve', type: 'function' },
        { text: 'w_context', type: 'class' },
        { text: 'w_context', type: 'class' },
      ],
      currentObjectContext: {
        object: 'w_context',
        kind: 'window',
        ancestors: ['w_context_base', 'window', 'powerobject'],
        members: {
          functions: ['of_build', 'of_inherited'],
          prototypes: ['of_only_proto'],
          events: ['create'],
        },
        dataWindows: [{
          dataObject: 'd_sales_orders',
          retrieveArgs: ['custarg'],
        }],
        reason: 'local-scope',
      },
      impactAnalysis: {
        rootSymbol: 'of_inherited',
        reason: 'member-hierarchy',
        descendants: ['w_context'],
        relatedEvents: ['create'],
        dataObjects: ['d_sales_orders'],
        buildTargets: ['file:///proj/app.pbt'],
      },
      safeEditPlan: {
        targetSymbol: 'of_inherited',
        fileRisks: [
          'app.pbt:low',
          'd_sales_orders.srd:high',
          'lib_app.pbl:low',
          'w_context.srw:high',
          'w_context.srw:medium',
          'w_context_base.sru:medium',
          'w_context_base.sru:medium',
        ],
        docsToReview: [
          'docs/architecture.md',
          'docs/powerbuilder-2025-vscode-plugin-technical-guide.md',
          'docs/rules-catalog.md',
          'docs/testing.md',
        ],
        recommendedTests: [
          'npm run test:unit -- --grep "unit/(diagnostics|signatureHelp|currentObjectContext|impactAnalysis|powerbuilderSemanticGolden)"',
          'npm run test:unit -- --grep "unit/(hierarchyInspection|powerbuilderSemanticGolden)"',
          'npm run test:unit -- --grep "unit/(impactAnalysis|safeEditPlan|currentObjectContext)"',
          'npm run test:unit -- --grep "unit/references"',
        ],
      },
      manifest: {
        readiness: 'ready',
        objects: [
          'd_sales_orders:datawindow:pbl-folder-source',
          'w_context:window:pbl-folder-source',
          'w_context_base:userobject:pbl-folder-source',
        ],
        sourceOriginSummary: {
          'pbl-folder-source': 3,
        },
      },
      dependencyGraph: {
        focus: 'w_context',
        nodes: [
          'focus-object:w_context:resolved',
          'workspace-object:w_context_base:resolved',
        ],
        edges: ['inherits'],
      },
      dataWindowSqlLineage: {
        state: 'resolved',
        dataObject: 'd_sales_orders',
        sqlColumns: [],
        children: [],
      },
      supportBundle: {
        summary: {
          readinessState: 'ready',
          healthStatus: 'healthy',
          diagnosticsAvailable: true,
          runtimeJournalEvents: 2,
          rawSourceIncluded: false,
        },
        files: [
          'README.md',
          'api-inventory.json',
          'build-orca-snapshot.json',
          'diagnostics-snapshot.sanitized.json',
          'performance-summary.json',
          'public-contract.json',
          'read-only-tool-bridge.json',
          'runtime-health.json',
          'runtime-journal-tail.json',
          'semantic-workspace-manifest.reduced.json',
          'server-stats.sanitized.json',
          'settings-governance.json',
          'settings-sanitized.json',
          'workspace-cleanup-advisor.json',
        ],
      },
    });
  });
});

interface CrossSurfaceFixture {
  kb: KnowledgeBase;
  graph: InheritanceGraph;
  catalog: SystemCatalog;
  workspaceState: WorkspaceState;
  contentsByUri: Map<string, string>;
  baseUri: string;
  dataWindowUri: string;
  mainUri: string;
  document: TextDocument;
  inheritedPosition: Position;
  retrievePosition: Position;
}

function createCrossSurfaceFixture(): CrossSurfaceFixture {
  const kb = new KnowledgeBase();
  const graph = new InheritanceGraph(kb);
  const catalog = new SystemCatalog();
  const workspaceState = new WorkspaceState();
  const contentsByUri = new Map<string, string>();

  function setupAnalyzedDocument(uri: string, content: string): TextDocument {
    invalidateDocumentAnalysis(uri);
    contentsByUri.set(uri, content);
    const document = TextDocument.create(uri, 'powerbuilder', 1, content);
    const analysis = analyzeDocument(document);
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    workspaceState.addSourceFile(uri, 'pbl-folder-source');
    return document;
  }

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
    '  ids_orders.SetTrans(SQLCA)',
    '  ids_orders.DataObject = "d_sales_orders"',
    '  ids_orders.Retrieve(1, 2)',
    '  of_inherited()',
    'end subroutine',
  ].join('\r\n'));

  workspaceState.refreshProjectRouting();

  const lines = document.getText().split(/\r?\n/);
  const inheritedLine = lines.findIndex((line) => line.includes('of_inherited()'));
  const retrieveLine = lines.findIndex((line) => line.includes('ids_orders.Retrieve('));

  return {
    kb,
    graph,
    catalog,
    workspaceState,
    contentsByUri,
    baseUri,
    dataWindowUri,
    mainUri,
    document,
    inheritedPosition: Position.create(inheritedLine, lines[inheritedLine].indexOf('of_inherited') + 2),
    retrievePosition: Position.create(retrieveLine, lines[retrieveLine].indexOf('ids_orders') + 2),
  };
}

async function buildCrossSurfaceMatrix(fixture: CrossSurfaceFixture): Promise<Record<string, unknown>> {
  const documentSymbols = extractDocumentSymbolsWithReconciliation(fixture.document);
  const workspaceSymbols = provideWorkspaceSymbols('w_context', fixture.kb)
    .map((symbol) => normalizeWorkspaceSymbol(symbol))
    .sort();
  const hover = provideHover(fixture.document, fixture.inheritedPosition, fixture.kb, fixture.catalog, fixture.graph);
  const definition = provideDefinition(fixture.document, fixture.inheritedPosition, fixture.kb, fixture.graph);
  const references = provideReferences(
    fixture.document,
    fixture.inheritedPosition,
    fixture.kb,
    fixture.graph,
    buildReferenceSources(fixture.contentsByUri),
    { includeDeclaration: true },
  );
  const diagnostics = buildDiagnosticsForDocument(fixture.document, 'full', fixture.kb, fixture.catalog, fixture.graph);
  const semanticTokens = provideSemanticTokens(fixture.document, fixture.kb, fixture.graph, fixture.catalog);
  const currentObjectContext = buildCurrentObjectContext(
    fixture.document,
    {
      line: fixture.retrievePosition.line,
      character: fixture.retrievePosition.character,
      maxExcerptLines: 12,
      maxReferencedSymbols: 8,
    },
    fixture.kb,
    fixture.graph,
    fixture.catalog,
    { workspaceState: fixture.workspaceState },
  );
  const impactAnalysis = await buildImpactAnalysis(
    fixture.document,
    {
      line: fixture.inheritedPosition.line,
      character: fixture.inheritedPosition.character,
      maxSafeReferences: 16,
    },
    fixture.kb,
    fixture.graph,
    fixture.catalog,
    async (uri) => fixture.contentsByUri.get(uri) ?? null,
    { workspaceState: fixture.workspaceState },
  );
  const safeEditPlan = await buildSafeEditPlan(
    fixture.document,
    {
      line: fixture.inheritedPosition.line,
      character: fixture.inheritedPosition.character,
      maxSafeReferences: 16,
    },
    fixture.kb,
    fixture.graph,
    fixture.catalog,
    async (uri) => fixture.contentsByUri.get(uri) ?? null,
    { workspaceState: fixture.workspaceState },
  );
  const workspaceManifest = buildSemanticWorkspaceManifest(undefined, fixture.kb, fixture.graph, fixture.workspaceState, null, { state: 'ready' });
  const dependencyGraph = buildPowerBuilderDependencyGraph(
    {
      uri: fixture.document.uri,
      maxDependencies: 8,
      maxDependents: 8,
    },
    fixture.kb,
    fixture.workspaceState,
  );
  const dataWindowSqlLineage = buildDataWindowSqlLineage(
    {
      uri: fixture.document.uri,
      line: fixture.retrievePosition.line,
      maxDepth: 4,
    },
    fixture.kb,
  );

  const supportBundle = buildSupportBundle({
    workspaceRootPath: path.join('C:', 'repo'),
    bundleRootPath: path.join('C:', 'repo', 'tools', 'support-bundles', 'cross-surface-golden'),
    workspaceLabel: 'cross-surface-golden',
    activeUri: fixture.document.uri,
    activeWorkspaceRelativePath: 'proj/lib_app.pbl/w_context.srw',
    workspaceManifest,
    serverStats: buildServerStats(fixture, diagnostics) as ApiServerStats,
    publicContract: getPublicApiContractDescriptor(),
    readOnlyToolBridge: getReadOnlyToolBridgeDescriptor(),
    settingsGovernance: {
      selectedProfile: 'balanced',
      availableProfiles: [{ id: 'balanced', label: 'Balanced', description: 'Default', managedSettings: { 'vscPowerSyntax.progress.show': true } }],
      managedSettings: [{ key: 'vscPowerSyntax.progress.show', expectedValue: true, currentValue: true, matchesProfile: true }],
      conflicts: [],
    } as import('../../../src/client/settingsGovernance').PowerSyntaxSettingsGovernanceReport,
    settingsValues: {
      'vscPowerSyntax.profile': 'balanced',
      'vscPowerSyntax.progress.show': true,
    },
    generatedAt: '2026-05-03T12:30:00.000Z',
  });

  return {
    documentSymbols: {
      status: documentSymbols.reconciliation.status,
      names: flattenDocumentSymbolNames(documentSymbols.symbols).sort(),
    },
    workspaceSymbols,
    hover: summarizeHover(hover),
    definition: normalizeLocations(Array.isArray(definition) ? definition : definition ? [definition] : []),
    references: normalizeLocations(references),
    renameEligibility: {
      of_build: validateRenameTarget('of_build', { systemCatalog: fixture.catalog }).ok,
      reservedIf: validateRenameTarget('if', { systemCatalog: fixture.catalog }).ok,
    },
    diagnostics: summarizeDiagnosticsForConsistency(diagnostics),
    semanticTokens: summarizeSemanticTokens(fixture.document, semanticTokens),
    currentObjectContext: {
      object: currentObjectContext.objectInfo?.globalType,
      kind: currentObjectContext.objectInfo?.objectKind,
      ancestors: currentObjectContext.ancestorChain?.map((entry) => entry.name),
      members: {
        functions: currentObjectContext.members?.functions.map((entry) => entry.name).sort(),
        prototypes: currentObjectContext.members?.prototypes.map((entry) => entry.name).sort(),
        events: currentObjectContext.members?.events.map((entry) => entry.name.toLowerCase()).sort(),
      },
      dataWindows: currentObjectContext.dataWindowBindings?.map((binding) => ({
        dataObject: binding.dataObject,
        retrieveArgs: binding.retrieveArguments.map((entry) => entry.name),
      })),
      reason: currentObjectContext.evidence?.primaryReasonCode,
    },
    impactAnalysis: {
      rootSymbol: impactAnalysis.rootSymbol?.name,
      reason: impactAnalysis.primaryReasonCode,
      descendants: impactAnalysis.descendants.map((entry) => entry.name).sort(),
      relatedEvents: impactAnalysis.relatedEvents.map((entry) => entry.name.toLowerCase()).sort(),
      dataObjects: impactAnalysis.relatedDataWindows.map((entry) => entry.dataObject).sort(),
      buildTargets: impactAnalysis.buildTargets.map((entry) => entry.projectUri).sort(),
    },
    safeEditPlan: {
      targetSymbol: safeEditPlan.targetSymbol?.name,
      fileRisks: safeEditPlan.files.map((entry) => `${basenameFromUri(entry.uri)}:${entry.risk}`).sort(),
      docsToReview: [...safeEditPlan.docsToReview].sort(),
      recommendedTests: [...safeEditPlan.recommendedTests].sort(),
    },
    manifest: {
      readiness: workspaceManifest.readiness.state,
      objects: workspaceManifest.objects.map((entry) => `${entry.name}:${entry.objectKind}:${entry.sourceOrigin ?? 'unknown'}`).sort(),
      sourceOriginSummary: workspaceManifest.sourceOriginSummary,
    },
    dependencyGraph: {
      focus: dependencyGraph.focus?.objectName,
      nodes: dependencyGraph.nodes.map((node) => `${node.kind}:${node.label}:${node.resolution}`).sort(),
      edges: dependencyGraph.edges.map((edge) => edge.relation).sort(),
    },
    dataWindowSqlLineage: {
      state: dataWindowSqlLineage.source.state,
      dataObject: dataWindowSqlLineage.source.dataObject,
      sqlColumns: dataWindowSqlLineage.lineage?.sqlReferences.map((entry) => entry.columnName) ?? [],
      children: dataWindowSqlLineage.lineage?.children.map((entry) => `${entry.relation}:${entry.dataObject}:${entry.state}`).sort() ?? [],
    },
    supportBundle: {
      summary: {
        readinessState: supportBundle.manifest.summary.readinessState,
        healthStatus: supportBundle.manifest.summary.healthStatus,
        diagnosticsAvailable: supportBundle.manifest.summary.diagnosticsAvailable,
        runtimeJournalEvents: supportBundle.manifest.summary.runtimeJournalEvents,
        rawSourceIncluded: supportBundle.manifest.summary.rawSourceIncluded,
      },
      files: supportBundle.manifest.files.map((entry) => entry.relativePath).sort(),
    },
  };
}

function buildReferenceSources(contentsByUri: ReadonlyMap<string, string>): ReferenceSource[] {
  return [...contentsByUri.entries()].map(([uri, content]) => ({ uri, content }));
}

function flattenDocumentSymbolNames(symbols: readonly DocumentSymbol[]): string[] {
  const names: string[] = [];
  for (const symbol of symbols) {
    names.push(symbol.name);
    if (symbol.children && symbol.children.length > 0) {
      names.push(...flattenDocumentSymbolNames(symbol.children));
    }
  }
  return names;
}

function normalizeWorkspaceSymbol(symbol: SymbolInformation): string {
  return `${symbol.name}:${symbol.kind}:${basenameFromUri(symbol.location.uri)}`;
}

function normalizeLocations(locations: readonly Location[]): string[] {
  return locations
    .map((location) => `${basenameFromUri(location.uri)}:${location.range.start.line + 1}:${location.range.start.character + 1}`)
    .sort();
}

function summarizeHover(hover: ReturnType<typeof provideHover>): Record<string, unknown> {
  const value = hover ? String((hover.contents as { value?: string }).value ?? '') : '';
  return {
    mentionsInherited: /of_inherited/i.test(value),
    mentionsBase: /w_context_base/i.test(value),
    mentionsInteger: /integer/i.test(value),
  };
}

function summarizeSemanticTokens(document: TextDocument, tokens: ReturnType<typeof provideSemanticTokens>): Array<{ text: string; type: string }> {
  const legend = getSemanticTokensLegend();
  const decoded: Array<{ text: string; type: string }> = [];
  const lines = document.getText().split(/\r?\n/);
  let currentLine = 0;
  let currentChar = 0;

  for (let index = 0; index < (tokens as any).data.length; index += 5) {
    const deltaLine = (tokens as any).data[index];
    const deltaChar = (tokens as any).data[index + 1];
    const length = (tokens as any).data[index + 2];
    const typeIndex = (tokens as any).data[index + 3];

    if (deltaLine > 0) {
      currentLine += deltaLine;
      currentChar = deltaChar;
    } else {
      currentChar += deltaChar;
    }

    const text = lines[currentLine]?.slice(currentChar, currentChar + length) ?? '';
    if (['w_context', 'ids_orders', 'Retrieve', 'of_inherited'].includes(text)) {
      decoded.push({ text, type: legend.tokenTypes[typeIndex] });
    }
  }

  return decoded.sort((left, right) => left.text.localeCompare(right.text) || left.type.localeCompare(right.type));
}

function basenameFromUri(uri: string): string {
  return uri.split('/').pop() ?? uri;
}

function buildServerStats(fixture: CrossSurfaceFixture, diagnostics: readonly import('vscode-languageserver/node').Diagnostic[]): ApiServerStats {
  const diagnosticSnapshot = buildDiagnosticsSnapshot(fixture, diagnostics);

  return {
    readiness: { state: 'ready', detail: 'cross-surface-golden' },
    workspace: { mode: 'workspace', files: fixture.contentsByUri.size },
    health: {
      status: 'healthy',
      summary: 'cross-surface-golden',
      findings: [],
      counts: { info: 0, warning: 0, error: 0 },
      checkedLayers: ['scheduler', 'diagnostics'],
    },
    diagnostics: diagnosticSnapshot,
    runtimeJournal: {
      total: 2,
      dropped: 0,
      events: [
        { ts: 1, phase: 'serve', kind: 'hover', action: 'query', detail: { focusUri: fixture.mainUri } },
        { ts: 2, phase: 'serve', kind: 'impact', action: 'query', detail: { focusUri: fixture.mainUri } },
      ],
    },
  } as ApiServerStats;
}

function buildDiagnosticsSnapshot(
  fixture: CrossSurfaceFixture,
  diagnostics: readonly import('vscode-languageserver/node').Diagnostic[]
): ApiDiagnosticsSnapshot {
  const totals = { error: 0, warning: 0, info: 0, hint: 0 };
  const byCode: Record<string, number> = {};

  for (const diagnostic of diagnostics) {
    const code = typeof diagnostic.code === 'string' || typeof diagnostic.code === 'number'
      ? String(diagnostic.code)
      : 'unknown';
    byCode[code] = (byCode[code] ?? 0) + 1;

    switch (diagnostic.severity) {
      case DiagnosticSeverity.Error:
        totals.error++;
        break;
      case DiagnosticSeverity.Warning:
        totals.warning++;
        break;
      case DiagnosticSeverity.Information:
        totals.info++;
        break;
      case DiagnosticSeverity.Hint:
        totals.hint++;
        break;
      default:
        totals.warning++;
        break;
    }
  }

  return {
    totals,
    byFile: { [fixture.mainUri]: diagnostics.length },
    byCode,
    bySeverity: { error: totals.error, warning: totals.warning, info: totals.info, hint: totals.hint },
    documents: [{
      uri: fixture.mainUri,
      total: diagnostics.length,
      byCode,
      bySeverity: { error: totals.error, warning: totals.warning, info: totals.info, hint: totals.hint },
      projectLabel: 'app',
      objectLabel: 'w_context',
      snapshotIdentity: `${fixture.mainUri}@1`,
      sourceOrigin: 'pbl-folder-source',
    }],
    projects: [{
      key: 'file:///proj/app.pbt',
      label: 'app',
      total: diagnostics.length,
      byCode,
      bySeverity: { error: totals.error, warning: totals.warning, info: totals.info, hint: totals.hint },
      objects: [],
    }],
  };
}