import { TextDocument } from 'vscode-languageserver-textdocument';

import { invalidateDocumentAnalysis } from '../analysis/analysisCache';
import { analyzeDocument } from '../analysis/documentAnalysis';
import { invalidateServingCacheEntries } from '../cache/servingCacheRuntime';
import type { ServingCacheFlushCoordinator } from '../cache/servingCacheFlushCoordinator';
import type { DocumentCache } from '../knowledge/DocumentCache';
import type { HotContextCache } from '../knowledge/HotContextCache';
import type { KnowledgeBase } from '../knowledge/KnowledgeBase';
import type { ServingCache } from '../knowledge/ServingCache';
import {
  createSemanticInvalidationPlan,
  createSnapshotAwareInvalidationPlan
} from '../knowledge/semanticInvalidation';
import { FsEvent } from '../system/fileWatcherDebouncer';
import type { IFileSystem } from '../system/fileSystem';
import { calculateHash } from '../system/hash';
import {
  isPbAutoBuildBuildFileCandidateUri,
  isPowerBuilderProjectMarkerUri,
  isPowerBuilderSourceUri
} from '../../shared/powerbuilderFiles';
import { inferSourceOrigin } from '../../shared/sourceOrigin';
import type { WorkspaceState } from './workspaceState';
import { clearFileIndexState, FileIndexState, setFileIndexState } from '../indexer/workspaceIndexer';
import { parsePbAutoBuildBuildFileCandidate } from './pbAutoBuildBuildFiles';
import { parseTopology } from './topology';

export interface ApplyWatchedFileEventsOptions {
  events: FsEvent[];
  fs: IFileSystem;
  documentCache: DocumentCache;
  knowledgeBase: KnowledgeBase;
  workspaceState: WorkspaceState;
  hotContextCache: HotContextCache;
  servingCache: ServingCache<unknown>;
  servingCacheFlushCoordinator: ServingCacheFlushCoordinator;
  massiveChangeThreshold?: number;
  isDocumentOpen?: (uri: string) => boolean;
  getOpenDocument?: (uri: string) => TextDocument | undefined;
  clearDiagnostics?: (uri: string) => void;
  log?: (message: string) => void;
}

function resolveContextualSourceOrigin(uri: string, workspaceState: WorkspaceState) {
  const contextual = workspaceState.getSourceOrigin(uri);
  if (contextual && contextual !== 'unknown') {
    return contextual;
  }

  return workspaceState.inferSourceOriginForUri(uri);
}

function snapshotMatchesSourceOrigin(snapshot: ReturnType<KnowledgeBase['getDocumentSnapshot']>, sourceOrigin: ReturnType<typeof inferSourceOrigin>): boolean {
  if (!snapshot) {
    return false;
  }

  return snapshot.symbols.every((symbol) => !symbol.lineage?.sourceOrigin || symbol.lineage.sourceOrigin === sourceOrigin);
}

async function rematerializeSourceOriginDocuments(
  uris: readonly string[],
  opts: ApplyWatchedFileEventsOptions
): Promise<{ reindexed: number; invalidatedUris: string[] }> {
  const invalidatedUris = new Set<string>();
  let reindexed = 0;

  for (const uri of uris) {
    const sourceOrigin = resolveContextualSourceOrigin(uri, opts.workspaceState);
    const currentSnapshot = opts.knowledgeBase.getDocumentSnapshot(uri);
    if (snapshotMatchesSourceOrigin(currentSnapshot, sourceOrigin)) {
      continue;
    }

    let document = opts.getOpenDocument?.(uri);
    let version: string | number;

    if (document) {
      version = document.version;
    } else {
      try {
        const content = await opts.fs.readFile(uri);
        document = TextDocument.create(uri, 'powerbuilder', 1, content);
        version = calculateHash(content);
      } catch (error) {
        opts.log?.(`[WATCHER] No se pudo rematerializar ${uri} tras cambio de sourceOrigin: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
    }

    const previousSnapshot = opts.knowledgeBase.getDocumentSnapshot(uri) ?? undefined;
    const previousPlan = createSemanticInvalidationPlan(uri, opts.knowledgeBase);
    const analysis = analyzeDocument(document, {
      sourceOrigin
    });

    opts.documentCache.set(uri, {
      version,
      facts: analysis.semanticFacts,
      symbols: [],
      scopes: analysis.scopes,
      snapshot: analysis.snapshot
    });
    opts.knowledgeBase.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);

    const nextPlan = createSemanticInvalidationPlan(uri, opts.knowledgeBase);
    const invalidationPlan = createSnapshotAwareInvalidationPlan(
      uri,
      previousSnapshot,
      analysis.snapshot,
      previousPlan,
      nextPlan
    );

    for (const invalidatedUri of invalidationPlan.allUris) {
      invalidatedUris.add(invalidatedUri);
    }
    reindexed++;
  }

  return {
    reindexed,
    invalidatedUris: [...invalidatedUris].sort()
  };
}

export interface WatchedFileIntakeResult {
  reindexed: number;
  removed: number;
  skipped: number;
  massive: boolean;
  touchedProjects: string[];
}

export async function applyWatchedFileEvents(
  opts: ApplyWatchedFileEventsOptions
): Promise<WatchedFileIntakeResult> {
  const semanticEvents = opts.events.filter((event) => isPowerBuilderSourceUri(event.uri) || isPowerBuilderProjectMarkerUri(event.uri));
  const massive = semanticEvents.length >= (opts.massiveChangeThreshold ?? 32);
  let reindexed = 0;
  let removed = 0;
  let skipped = 0;
  let routingDirty = false;
  let buildFilesDirty = false;
  let sourceOriginsDirty = false;
  const touchedProjects = new Set<string>();
  const projectCandidates = new Set<string>();
  const buildFileCandidates = new Set<string>();

  for (const event of opts.events) {
    if (isPbAutoBuildBuildFileCandidateUri(event.uri)) {
      const buildFileTouched = await applyBuildFileEvent(event, opts.workspaceState, opts.fs, opts.log);
      buildFilesDirty = buildFilesDirty || buildFileTouched;
      if (buildFileTouched) {
        buildFileCandidates.add(event.uri);
      }
      continue;
    }

    if (isPowerBuilderProjectMarkerUri(event.uri)) {
      const markerTouched = await applyProjectMarkerEvent(event, opts.workspaceState, opts.fs, touchedProjects, opts.log);
      routingDirty = routingDirty || markerTouched;
      sourceOriginsDirty = sourceOriginsDirty || markerTouched;
      continue;
    }

    if (!isPowerBuilderSourceUri(event.uri)) {
      skipped++;
      continue;
    }

    if (event.kind === 'delete') {
      const hadSourceFile = opts.workspaceState.hasSourceFile(event.uri);
      const previousProject = opts.workspaceState.getProjectContextForFile(event.uri);
      if (previousProject) {
        touchedProjects.add(previousProject.projectUri);
      }
      const invalidationPlan = createSemanticInvalidationPlan(event.uri, opts.knowledgeBase);
      invalidateDocumentAnalysis(event.uri);
      opts.documentCache.invalidate(event.uri);
      opts.knowledgeBase.removeDocument(event.uri);
      opts.workspaceState.removeSourceFile(event.uri);
      clearFileIndexState(event.uri);
      routingDirty = routingDirty || hadSourceFile;
      sourceOriginsDirty = sourceOriginsDirty || hadSourceFile;
      if (!massive) {
        for (const uri of invalidationPlan.allUris) {
          opts.hotContextCache.invalidateForUri(uri);
        }
        invalidateServingCacheEntries(
          opts.servingCache,
          invalidationPlan.allUris,
          opts.servingCacheFlushCoordinator
        );
      }
      opts.clearDiagnostics?.(event.uri);
      removed++;
      continue;
    }

    const hadSourceFile = opts.workspaceState.hasSourceFile(event.uri);
    opts.workspaceState.addSourceFile(event.uri);
    routingDirty = routingDirty || !hadSourceFile;
  sourceOriginsDirty = sourceOriginsDirty || !hadSourceFile;
    projectCandidates.add(event.uri);
    if (opts.isDocumentOpen?.(event.uri)) {
      setFileIndexState(event.uri, FileIndexState.Pending);
      skipped++;
      continue;
    }

    try {
      setFileIndexState(event.uri, FileIndexState.Indexing);
      const previousSnapshot = opts.knowledgeBase.getDocumentSnapshot(event.uri) ?? undefined;
      const previousPlan = createSemanticInvalidationPlan(event.uri, opts.knowledgeBase);
      const content = await opts.fs.readFile(event.uri);
      const document = TextDocument.create(event.uri, 'powerbuilder', 1, content);
      const analysis = analyzeDocument(document, {
        sourceOrigin: resolveContextualSourceOrigin(event.uri, opts.workspaceState)
      });

      opts.documentCache.set(event.uri, {
        version: calculateHash(content),
        facts: analysis.semanticFacts,
        symbols: [],
        scopes: analysis.scopes,
        snapshot: analysis.snapshot
      });
      opts.knowledgeBase.upsertDocument(
        event.uri,
        analysis.semanticFacts,
        analysis.scopes,
        analysis.snapshot
      );

      const nextPlan = createSemanticInvalidationPlan(event.uri, opts.knowledgeBase);
      const invalidationPlan = createSnapshotAwareInvalidationPlan(
        event.uri,
        previousSnapshot,
        analysis.snapshot,
        previousPlan,
        nextPlan
      );
      if (!massive) {
        for (const uri of invalidationPlan.allUris) {
          opts.hotContextCache.invalidateForUri(uri);
        }
        invalidateServingCacheEntries(
          opts.servingCache,
          invalidationPlan.allUris,
          opts.servingCacheFlushCoordinator
        );
      }
      setFileIndexState(event.uri, FileIndexState.Indexed);
      reindexed++;
    } catch (error) {
      setFileIndexState(event.uri, FileIndexState.Failed);
      skipped++;
      opts.log?.(`[WATCHER] No se pudo procesar ${event.kind} en ${event.uri}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (massive) {
    opts.hotContextCache.invalidate();
    invalidateServingCacheEntries(
      opts.servingCache,
      undefined,
      opts.servingCacheFlushCoordinator
    );
  }

  let sourceOriginInvalidatedUris: string[] = [];
  if (sourceOriginsDirty) {
    const previousSourceOrigins = new Map(
      opts.workspaceState.getAllSourceFiles().map((uri) => [uri, opts.workspaceState.getSourceOrigin(uri) ?? 'unknown'])
    );
    opts.workspaceState.recomputeSourceOrigins();
    const sourceOriginChangedUris = opts.workspaceState
      .getAllSourceFiles()
      .filter((uri) => previousSourceOrigins.get(uri) !== (opts.workspaceState.getSourceOrigin(uri) ?? 'unknown'));

    if (sourceOriginChangedUris.length > 0) {
      const rematerialized = await rematerializeSourceOriginDocuments(sourceOriginChangedUris, opts);
      reindexed += rematerialized.reindexed;
      sourceOriginInvalidatedUris = rematerialized.invalidatedUris;
    }
  }

  if (!massive && sourceOriginInvalidatedUris.length > 0) {
    for (const uri of sourceOriginInvalidatedUris) {
      opts.hotContextCache.invalidateForUri(uri);
    }
    invalidateServingCacheEntries(
      opts.servingCache,
      sourceOriginInvalidatedUris,
      opts.servingCacheFlushCoordinator
    );
  }

  if (routingDirty || buildFilesDirty) {
    opts.workspaceState.refreshProjectRouting();
  }

  for (const uri of buildFileCandidates) {
    const buildFile = opts.workspaceState.getBuildFile(uri);
    if (buildFile?.representedProjectUri) {
      touchedProjects.add(buildFile.representedProjectUri);
    }
  }

  for (const uri of projectCandidates) {
    const project = opts.workspaceState.getProjectContextForFile(uri);
    if (project) {
      touchedProjects.add(project.projectUri);
    }
  }

  return {
    reindexed,
    removed,
    skipped,
    massive,
    touchedProjects: [...touchedProjects].sort()
  };
}

async function applyProjectMarkerEvent(
  event: FsEvent,
  workspaceState: WorkspaceState,
  fs: IFileSystem,
  touchedProjects: Set<string>,
  log?: (message: string) => void
): Promise<boolean> {
  const rootKind = getMarkerRootKind(event.uri);
  const topologyKind = getMarkerTopologyKind(event.uri);
  if (!rootKind || !topologyKind) {
    return false;
  }

  touchedProjects.add(event.uri);
  workspaceState.removeTopologyEntry(topologyKind, event.uri);

  if (event.kind === 'delete') {
    workspaceState.removeRoot(rootKind, event.uri);
    return true;
  }

  workspaceState.addRoot(rootKind, event.uri);
  try {
    const content = await fs.readFile(event.uri);
    const entry = parseTopology(event.uri, content);
    if (entry) {
      workspaceState.addTopologyEntry(entry);
    }
  } catch (error) {
    log?.(`[WATCHER] No se pudo reparsear marker ${event.uri}: ${error instanceof Error ? error.message : String(error)}`);
  }

  return true;
}

async function applyBuildFileEvent(
  event: FsEvent,
  workspaceState: WorkspaceState,
  fs: IFileSystem,
  log?: (message: string) => void
): Promise<boolean> {
  if (event.kind === 'delete') {
    return workspaceState.removeBuildFileCandidate(event.uri);
  }

  try {
    const content = await fs.readFile(event.uri);
    const candidate = parsePbAutoBuildBuildFileCandidate(event.uri, content);
    if (!candidate) {
      return workspaceState.removeBuildFileCandidate(event.uri);
    }
    return workspaceState.addBuildFileCandidate(candidate);
  } catch (error) {
    log?.(`[WATCHER] No se pudo procesar build file ${event.uri}: ${error instanceof Error ? error.message : String(error)}`);
    return workspaceState.removeBuildFileCandidate(event.uri);
  }
}

function getMarkerRootKind(uri: string): 'workspaces' | 'targets' | 'projects' | 'solutions' | null {
  const normalized = uri.toLowerCase();
  if (normalized.endsWith('.pbw')) {
    return 'workspaces';
  }
  if (normalized.endsWith('.pbt')) {
    return 'targets';
  }
  if (normalized.endsWith('.pbproj')) {
    return 'projects';
  }
  if (normalized.endsWith('.pbsln')) {
    return 'solutions';
  }
  return null;
}

function getMarkerTopologyKind(uri: string): 'workspace' | 'target' | 'project' | 'solution' | null {
  const normalized = uri.toLowerCase();
  if (normalized.endsWith('.pbw')) {
    return 'workspace';
  }
  if (normalized.endsWith('.pbt')) {
    return 'target';
  }
  if (normalized.endsWith('.pbproj')) {
    return 'project';
  }
  if (normalized.endsWith('.pbsln')) {
    return 'solution';
  }
  return null;
}