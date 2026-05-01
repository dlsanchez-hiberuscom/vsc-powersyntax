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
import { isPowerBuilderSourceUri } from '../../shared/powerbuilderFiles';
import type { WorkspaceState } from './workspaceState';

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
  clearDiagnostics?: (uri: string) => void;
  log?: (message: string) => void;
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
  const sourceEvents = opts.events.filter((event) => isPowerBuilderSourceUri(event.uri));
  const massive = sourceEvents.length >= (opts.massiveChangeThreshold ?? 32);
  let reindexed = 0;
  let removed = 0;
  let skipped = 0;
  let routingDirty = false;
  const touchedProjects = new Set<string>();
  const projectCandidates = new Set<string>();

  for (const event of opts.events) {
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
      routingDirty = routingDirty || hadSourceFile;
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
    projectCandidates.add(event.uri);
    if (opts.isDocumentOpen?.(event.uri)) {
      skipped++;
      continue;
    }

    try {
      const previousSnapshot = opts.knowledgeBase.getDocumentSnapshot(event.uri) ?? undefined;
      const previousPlan = createSemanticInvalidationPlan(event.uri, opts.knowledgeBase);
      const content = await opts.fs.readFile(event.uri);
      const document = TextDocument.create(event.uri, 'powerbuilder', 1, content);
      const analysis = analyzeDocument(document);

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
      reindexed++;
    } catch (error) {
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

  if (routingDirty) {
    opts.workspaceState.refreshProjectRouting();
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