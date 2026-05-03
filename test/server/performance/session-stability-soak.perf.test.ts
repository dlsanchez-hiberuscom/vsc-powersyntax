import * as assert from 'assert/strict';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { clearDocumentAnalysisCache, evictDocumentAnalysis, getAnalysisCacheStats, getDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { createCacheCheckpoint } from '../../../src/server/cache/cacheCheckpoint';
import { createSemanticCacheStore } from '../../../src/server/cache/cacheStore';
import { ServingCacheFlushCoordinator } from '../../../src/server/cache/servingCacheFlushCoordinator';
import { invalidateServingCacheEntries } from '../../../src/server/cache/servingCacheRuntime';
import { buildPbAutoBuildProfileMatrix } from '../../../src/client/build/pbAutoBuildProfileMatrix';
import { buildSupportBundle } from '../../../src/client/support/supportBundle';
import { provideCompletion } from '../../../src/server/features/completion';
import { validateStructure } from '../../../src/server/features/diagnostics';
import { provideHover } from '../../../src/server/features/hover';
import { buildSemanticWorkspaceManifest } from '../../../src/server/features/semanticWorkspaceManifest';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { HotContextCache } from '../../../src/server/knowledge/HotContextCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { ServingCache, makeKey as makeServingKey } from '../../../src/server/knowledge/ServingCache';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { buildRuntimeHealthReport } from '../../../src/server/runtime/runtimeHealth';
import { buildRuntimeMemoryReport } from '../../../src/server/runtime/memoryBudgets';
import type { FileStat, IFileSystem } from '../../../src/server/system/fileSystem';
import { NodeFileSystem } from '../../../src/server/system/fileSystem';
import { fsPathToUri } from '../../../src/server/system/uriUtils';
import { applyWatchedFileEvents } from '../../../src/server/workspace/watchedFileIntake';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import {
  type ApiDiagnosticsSnapshot,
  type ApiRuntimeJournalEvent,
  type ApiServerStats,
  getPublicApiContractDescriptor,
  getReadOnlyToolBridgeDescriptor,
} from '../../../src/shared/publicApi';

const WORKSPACE_URI = 'file:///soak-workspace';
const TARGET_URI = `${WORKSPACE_URI}/app.pbt`;
const LIBRARY_URI = `${WORKSPACE_URI}/lib_app.pbl`;
const BASELINE_FILES = 96;
const ACTIVE_WINDOW = 6;
const MASSIVE_CHANGE_THRESHOLD = 12;
const MASSIVE_CHANGE_BATCH = 18;
const DEFAULT_ITERATIONS = 24;
const CHECKPOINT_INTERVAL = 6;
const REPORT_INTERVAL = 4;
const MAX_SERVING_CACHE_ENTRIES = ACTIVE_WINDOW * 4;

interface SessionStabilitySoakReport {
  status: 'passed';
  iterations: number;
  baselineFiles: number;
  activeWindow: number;
  diagnosticsRuns: number;
  hoverRuns: number;
  completionRuns: number;
  incrementalBursts: number;
  massiveBursts: number;
  supportBundlesBuilt: number;
  buildSnapshotsBuilt: number;
  resumeChecks: number;
  flushes: number;
  readinessBrokenIterations: number;
  baselineDocumentCacheSize: number;
  finalDocumentCacheSize: number;
  baselineKnowledgeDocuments: number;
  finalKnowledgeDocuments: number;
  maxServingCacheEntries: number;
  finalServingCacheEntries: number;
  lastResumeAction: string;
  lastSupportBundleHealth: string | undefined;
  lastBuildHealthState: string | undefined;
}

class FakeFileSystem implements IFileSystem {
  readonly files = new Map<string, string>();

  async readFile(uri: string): Promise<string> {
    const value = this.files.get(uri);
    if (value === undefined) {
      throw new Error(`File not found: ${uri}`);
    }
    return value;
  }

  async readDirectory(): Promise<[string, FileStat][]> {
    return [];
  }

  async stat(uri: string): Promise<FileStat | null> {
    const content = this.files.get(uri);
    if (content === undefined) {
      return null;
    }

    return {
      isFile: true,
      isDirectory: false,
      size: content.length,
      mtime: 0,
    };
  }

  async createDirectory(): Promise<void> {
    return;
  }

  async writeFile(uri: string, content: string): Promise<void> {
    this.files.set(uri, content);
  }

  async copyFile(sourceUri: string, targetUri: string): Promise<void> {
    this.files.set(targetUri, this.files.get(sourceUri) ?? '');
  }

  async deletePath(uri: string): Promise<void> {
    this.files.delete(uri);
  }
}

function createSource(index: number, revision: number): string {
  return [
    'forward',
    `global type u_soak_${index} from nonvisualobject`,
    'end type',
    'end forward',
    '',
    `global type u_soak_${index} from nonvisualobject`,
    'public function integer of_revision();',
    `  return ${index + revision}`,
    'end function',
    'public function integer of_probe();',
    '  integer ll_value',
    '  ll_value = this.of_revision()',
    '  return ll_value',
    'end function',
    'end type',
  ].join('\n');
}

function createFileUri(index: number): string {
  return `${WORKSPACE_URI}/lib_app.pbl/u_soak_${index}.sru`;
}

function buildHoverPosition(source: string): { line: number; character: number } {
  const lines = source.split(/\r?\n/);
  const lineIndex = lines.findIndex((line) => line.includes('of_revision()'));
  const line = lines[lineIndex] ?? '';
  return {
    line: Math.max(0, lineIndex),
    character: Math.max(0, line.indexOf('of_revision') + 1),
  };
}

function buildCompletionPosition(source: string): { line: number; character: number } {
  const lines = source.split(/\r?\n/);
  const lineIndex = lines.findIndex((line) => line.includes('this.of_revision()'));
  const line = lines[lineIndex] ?? '';
  return {
    line: Math.max(0, lineIndex),
    character: Math.max(0, line.indexOf('this.') + 'this.'.length),
  };
}

function buildBuildInventory() {
  return [
    {
      uri: `${WORKSPACE_URI}/build/app.json`,
      label: 'app.json',
      detail: 'synthetic soak profile',
      representedProjectUri: TARGET_URI,
      status: 'usable' as const,
    },
    {
      uri: `${WORKSPACE_URI}/build/legacy.json`,
      label: 'legacy.json',
      detail: 'missing BuildPlan',
      representedProjectUri: TARGET_URI,
      status: 'invalid' as const,
      reasonCode: 'missing-build-plan' as const,
    },
  ];
}

function buildDiagnosticsSnapshot(uri: string, diagnostics: readonly import('vscode-languageserver/node').Diagnostic[]): ApiDiagnosticsSnapshot {
  const totals = { error: 0, warning: 0, info: 0, hint: 0 };
  const byCode: Record<string, number> = {};

  for (const diagnostic of diagnostics) {
    const code = typeof diagnostic.code === 'string' || typeof diagnostic.code === 'number'
      ? String(diagnostic.code)
      : 'unknown';
    byCode[code] = (byCode[code] ?? 0) + 1;
    totals.warning++;
  }

  return {
    totals,
    byFile: { [uri]: diagnostics.length },
    byCode,
    bySeverity: { error: totals.error, warning: totals.warning, info: totals.info, hint: totals.hint },
    documents: [{
      uri,
      total: diagnostics.length,
      byCode,
      bySeverity: { error: totals.error, warning: totals.warning, info: totals.info, hint: totals.hint },
      projectLabel: 'soak-app',
      objectLabel: path.posix.basename(uri),
      snapshotIdentity: `${uri}@1`,
      sourceOrigin: 'pbl-folder-source',
    }],
    projects: [{
      key: TARGET_URI,
      label: 'soak-app',
      total: diagnostics.length,
      byCode,
      bySeverity: { error: totals.error, warning: totals.warning, info: totals.info, hint: totals.hint },
      objects: [],
    }],
  };
}

function buildServerStats(
  workspaceState: WorkspaceState,
  documentCache: DocumentCache,
  knowledgeBase: KnowledgeBase,
  hotContextCache: HotContextCache,
  servingCache: ServingCache,
  diagnosticsSnapshot: ApiDiagnosticsSnapshot,
  runtimeJournalEvents: ApiRuntimeJournalEvent[],
): ApiServerStats {
  const buildMatrix = buildPbAutoBuildProfileMatrix({
    inventory: buildBuildInventory(),
    preferredBuildFileUri: `${WORKSPACE_URI}/build/app.json`,
    buildTooling: {
      status: 'available',
      source: 'default',
      executablePath: 'C:/tools/PBAutoBuild250.exe',
      versionLabel: '25.0',
      capabilities: ['build', 'clean'],
      detail: 'synthetic soak tooling',
    },
  });
  const memory = buildRuntimeMemoryReport({
    analysis: getAnalysisCacheStats(),
    serving: servingCache.getStats(),
    documents: documentCache.getStats(),
    hotContext: hotContextCache.getStats(),
    kb: knowledgeBase.getStats(),
  });

  const stats: ApiServerStats = {
    kb: knowledgeBase.getStats(),
    workspace: {
      mode: workspaceState.getMode(),
      files: workspaceState.getAllSourceFiles().length,
      sourceOrigins: workspaceState.getSourceOriginSummary(),
    },
    readiness: { state: 'ready', detail: 'session-stability-soak' },
    buildProfile: {
      buildFileUri: `${WORKSPACE_URI}/build/app.json`,
      label: 'app.json',
      detail: 'synthetic soak profile',
    },
    buildFiles: { total: 2, usable: 1, invalid: 1, ambiguous: 0 },
    buildHealth: buildMatrix.health,
    memory,
    diagnostics: diagnosticsSnapshot,
    caches: {
      analysis: getAnalysisCacheStats(),
      serving: servingCache.getStats(),
      documents: documentCache.getStats(),
      hotContext: hotContextCache.getStats(),
    },
    runtimeJournal: {
      total: runtimeJournalEvents.length,
      dropped: 0,
      events: runtimeJournalEvents.slice(-40),
    },
  };

  return {
    ...stats,
    health: buildRuntimeHealthReport({
      ...stats,
      diagnostics: diagnosticsSnapshot,
    }),
  };
}

async function seedWorkspace(
  fs: FakeFileSystem,
  workspaceState: WorkspaceState,
  documentCache: DocumentCache,
  knowledgeBase: KnowledgeBase,
  hotContextCache: HotContextCache,
  servingCache: ServingCache,
  servingCacheFlushCoordinator: ServingCacheFlushCoordinator,
): Promise<void> {
  workspaceState.addTopologyEntry({
    kind: 'target',
    data: {
      uri: TARGET_URI,
      name: 'soak-app',
      libraries: [LIBRARY_URI],
    },
  });
  workspaceState.refreshProjectRouting();

  const events: Array<{ uri: string; kind: 'create' }> = [];
  for (let index = 0; index < BASELINE_FILES; index++) {
    const uri = createFileUri(index);
    fs.files.set(uri, createSource(index, 0));
    events.push({ uri, kind: 'create' });
  }

  const result = await applyWatchedFileEvents({
    events,
    fs,
    documentCache,
    knowledgeBase,
    workspaceState,
    hotContextCache,
    servingCache,
    servingCacheFlushCoordinator,
    massiveChangeThreshold: BASELINE_FILES + 1,
  });

  assert.equal(result.reindexed, BASELINE_FILES);
}

async function persistAndRestore(
  storageUri: string,
  workspaceState: WorkspaceState,
  documentCache: DocumentCache,
): Promise<{ action: string; restoredDocuments: number }> {
  const metadata = {
    workspaceMode: workspaceState.getMode(),
    rootUris: [WORKSPACE_URI],
    discovery: workspaceState.exportDiscoverySnapshot(),
  };
  const store = createSemanticCacheStore(new NodeFileSystem(), storageUri, [WORKSPACE_URI], workspaceState.getProjectModel() ?? undefined);
  await store.persistCheckpoint(
    createCacheCheckpoint(0, documentCache.exportDocumentRecords(), metadata)
  );
  const restored = await store.load(metadata);

  const restoredDocumentCache = new DocumentCache();
  restoredDocumentCache.restoreDocumentRecords(restored.checkpoint.documents);
  assert.equal(restoredDocumentCache.getStats().size, documentCache.getStats().size);

  const restoredKnowledgeBase = new KnowledgeBase();
  restoredKnowledgeBase.restoreDocumentRecords(restored.checkpoint.documents, restored.checkpoint.semanticEpoch);
  assert.equal(restoredKnowledgeBase.exportDocumentRecords().length, documentCache.getStats().size);

  return {
    action: restored.decision.action,
    restoredDocuments: restored.checkpoint.documents.length,
  };
}

suite('performance/session-stability-soak', () => {
  test('simula una sesion larga sin crecimiento no acotado ni caches huerfanas', async function () {
    if (process.env.POWERSYNTAX_ENABLE_SOAK !== '1') {
      this.skip();
    }

    const iterations = Math.max(1, Number.parseInt(process.env.POWERSYNTAX_SOAK_ITERATIONS ?? `${DEFAULT_ITERATIONS}`, 10) || DEFAULT_ITERATIONS);
    const reportInterval = Math.max(1, Math.min(REPORT_INTERVAL, iterations));
    const checkpointInterval = Math.max(1, Math.min(CHECKPOINT_INTERVAL, iterations));
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-soak-'));
    const storageUri = fsPathToUri(tempRoot);
    const fakeFs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache<unknown>(256);
    let flushes = 0;
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {
      flushes += 1;
    });
    const catalog = new SystemCatalog();
    const graph = new InheritanceGraph(knowledgeBase);
    const activeUris: string[] = [];
    const runtimeJournalEvents: ApiRuntimeJournalEvent[] = [];
    let diagnosticsRuns = 0;
    let hoverRuns = 0;
    let completionRuns = 0;
    let incrementalBursts = 0;
    let massiveBursts = 0;
    let supportBundlesBuilt = 0;
    let buildSnapshotsBuilt = 0;
    let resumeChecks = 0;
    let readinessBrokenIterations = 0;
    let maxServingCacheEntries = 0;
    let lastResumeAction = 'unknown';
    let lastSupportBundleHealth: string | undefined;
    let lastBuildHealthState: string | undefined;

    try {
      await seedWorkspace(fakeFs, workspaceState, documentCache, knowledgeBase, hotContextCache, servingCache, servingCacheFlushCoordinator);

      const baselineDocumentCacheSize = documentCache.getStats().size;
      const baselineKnowledgeDocuments = knowledgeBase.exportDocumentRecords().length;

      for (let iteration = 0; iteration < iterations; iteration++) {
        const activeIndex = iteration % BASELINE_FILES;
        const activeUri = createFileUri(activeIndex);
        const source = fakeFs.files.get(activeUri) ?? '';
        const document = TextDocument.create(activeUri, 'powerbuilder', iteration + 1, source);
        const hoverPosition = buildHoverPosition(source);
        const completionPosition = buildCompletionPosition(source);

        activeUris.push(activeUri);
        getDocumentAnalysis(document);
        hotContextCache.setActive(activeUri, knowledgeBase.version);

        const diagnostics = validateStructure(document);
        diagnosticsRuns += 1;

        const hover = provideHover(document, hoverPosition, knowledgeBase, catalog, graph, hotContextCache);
        hoverRuns += 1;
        servingCache.set(makeServingKey({
          feature: 'hover',
          uri: activeUri,
          line: hoverPosition.line,
          character: hoverPosition.character,
          kbVersion: knowledgeBase.version,
        }), hover);

        const completion = provideCompletion(document, completionPosition, knowledgeBase, catalog, graph, hotContextCache, knowledgeBase.version);
        completionRuns += 1;
        servingCache.set(makeServingKey({
          feature: 'completion',
          uri: activeUri,
          line: completionPosition.line,
          character: completionPosition.character,
          kbVersion: knowledgeBase.version,
          extra: 'manual-soak',
        }), completion);

        if (activeUris.length > ACTIVE_WINDOW) {
          const closedUri = activeUris.shift();
          if (closedUri) {
            evictDocumentAnalysis(closedUri);
            invalidateServingCacheEntries(servingCache, [closedUri], servingCacheFlushCoordinator);
            await servingCacheFlushCoordinator.flushIfDirty();
          }
        }

        fakeFs.files.set(activeUri, createSource(activeIndex, iteration + 1));
        const incrementalResult = await applyWatchedFileEvents({
          events: [{ uri: activeUri, kind: 'change' }],
          fs: fakeFs,
          documentCache,
          knowledgeBase,
          workspaceState,
          hotContextCache,
          servingCache,
          servingCacheFlushCoordinator,
          massiveChangeThreshold: MASSIVE_CHANGE_THRESHOLD,
        });
        assert.equal(incrementalResult.massive, false);
        incrementalBursts += 1;

        if ((iteration + 1) % 3 === 0) {
          const massiveEvents: Array<{ uri: string; kind: 'change' }> = [];
          for (let offset = 0; offset < MASSIVE_CHANGE_BATCH; offset++) {
            const uri = createFileUri((activeIndex + offset) % BASELINE_FILES);
            fakeFs.files.set(uri, createSource((activeIndex + offset) % BASELINE_FILES, iteration + offset + 2));
            massiveEvents.push({ uri, kind: 'change' });
          }
          const massiveResult = await applyWatchedFileEvents({
            events: massiveEvents,
            fs: fakeFs,
            documentCache,
            knowledgeBase,
            workspaceState,
            hotContextCache,
            servingCache,
            servingCacheFlushCoordinator,
            massiveChangeThreshold: MASSIVE_CHANGE_THRESHOLD,
          });
          assert.equal(massiveResult.massive, true);
          massiveBursts += 1;
        }

        if (!knowledgeBase.getDocumentSnapshot(activeUri) || workspaceState.getProjectContextForFile(activeUri) === null) {
          readinessBrokenIterations += 1;
        }

        runtimeJournalEvents.push({
          ts: iteration + 1,
          phase: 'session',
          kind: 'soak-iteration',
          action: `iteration-${iteration + 1}`,
          detail: { activeUri },
        });

        if ((iteration + 1) % reportInterval === 0) {
          const diagnosticsSnapshot = buildDiagnosticsSnapshot(activeUri, diagnostics);
          const workspaceManifest = buildSemanticWorkspaceManifest(undefined, knowledgeBase, graph, workspaceState, null, { state: 'ready', detail: 'session-stability-soak' });
          const serverStats = buildServerStats(
            workspaceState,
            documentCache,
            knowledgeBase,
            hotContextCache,
            servingCache,
            diagnosticsSnapshot,
            runtimeJournalEvents,
          );
          const supportBundle = buildSupportBundle({
            workspaceRootPath: path.join('C:', 'repo'),
            bundleRootPath: path.join('C:', 'repo', 'tools', 'support-bundles', 'session-stability-soak'),
            workspaceLabel: 'session-stability-soak',
            activeUri,
            activeWorkspaceRelativePath: `lib_app.pbl/${path.posix.basename(activeUri)}`,
            workspaceManifest,
            serverStats,
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
            generatedAt: '2026-05-04T10:00:00.000Z',
          });

          const buildMatrix = buildPbAutoBuildProfileMatrix({
            inventory: buildBuildInventory(),
            preferredBuildFileUri: `${WORKSPACE_URI}/build/app.json`,
            buildTooling: {
              status: 'available',
              source: 'default',
              executablePath: 'C:/tools/PBAutoBuild250.exe',
              versionLabel: '25.0',
              capabilities: ['build', 'clean'],
              detail: 'synthetic soak tooling',
            },
          });

          assert.equal(supportBundle.manifest.summary.rawSourceIncluded, false);
          assert.equal(buildMatrix.summary.usableProfiles >= 1, true);
          supportBundlesBuilt += 1;
          buildSnapshotsBuilt += 1;
          lastSupportBundleHealth = supportBundle.manifest.summary.healthStatus;
          lastBuildHealthState = buildMatrix.summary.healthState;
        }

        if ((iteration + 1) % checkpointInterval === 0) {
          const resume = await persistAndRestore(storageUri, workspaceState, documentCache);
          assert.equal(resume.restoredDocuments, documentCache.getStats().size);
          lastResumeAction = resume.action;
          resumeChecks += 1;
        }

        maxServingCacheEntries = Math.max(maxServingCacheEntries, servingCache.size());
      }

      if (activeUris.length > 0) {
        invalidateServingCacheEntries(servingCache, [...activeUris], servingCacheFlushCoordinator);
        await servingCacheFlushCoordinator.flushIfDirty();
      }

      const finalDocumentCacheSize = documentCache.getStats().size;
      const finalKnowledgeDocuments = knowledgeBase.exportDocumentRecords().length;
      const finalServingCacheEntries = servingCache.size();

      assert.equal(finalDocumentCacheSize, baselineDocumentCacheSize);
      assert.equal(finalKnowledgeDocuments, baselineKnowledgeDocuments);
      assert.equal(finalServingCacheEntries, 0);
      assert.equal(readinessBrokenIterations, 0);
      assert.ok(maxServingCacheEntries <= MAX_SERVING_CACHE_ENTRIES, `ServingCache crecio fuera de budget: ${maxServingCacheEntries}`);
      assert.ok(supportBundlesBuilt > 0);
      assert.ok(buildSnapshotsBuilt > 0);
      assert.ok(resumeChecks > 0);
      assert.equal(lastResumeAction, 'reuse');

      const report: SessionStabilitySoakReport = {
        status: 'passed',
        iterations,
        baselineFiles: BASELINE_FILES,
        activeWindow: ACTIVE_WINDOW,
        diagnosticsRuns,
        hoverRuns,
        completionRuns,
        incrementalBursts,
        massiveBursts,
        supportBundlesBuilt,
        buildSnapshotsBuilt,
        resumeChecks,
        flushes,
        readinessBrokenIterations,
        baselineDocumentCacheSize,
        finalDocumentCacheSize,
        baselineKnowledgeDocuments,
        finalKnowledgeDocuments,
        maxServingCacheEntries,
        finalServingCacheEntries,
        lastResumeAction,
        lastSupportBundleHealth,
        lastBuildHealthState,
      };

      console.log(`[soak-report] ${JSON.stringify(report)}`);
    } finally {
      clearDocumentAnalysisCache();
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });
});