import type { ProgressNotification, ProgressPass } from '../../shared/types';
import { FileIndexState, type IndexerPhase } from '../indexer/workspaceIndexer';
import type { ReadinessState } from '../workspace/readiness';
import { formatProjectStatus, type ProjectStatus } from './projectStatus';

export interface DiscoveryProgressState {
  current: number;
  total: number;
  startTimeMs?: number;
}

export interface IndexerStatusSnapshot {
  phase: IndexerPhase;
  current: number;
  total: number;
  pass?: ProgressPass;
  degraded: boolean;
  degradedReason?: string;
  byState: Record<FileIndexState, number>;
}

export interface ProgressReadinessLevels {
  activeContextReady: boolean;
  projectReady: boolean;
  workspaceReady: boolean;
}

export interface ProgressReadinessSnapshot {
  readiness: {
    state: ReadinessState;
    detail?: string;
    levels: ProgressReadinessLevels;
  };
  progress: {
    discovery: DiscoveryProgressState;
    indexing: {
      current: number;
      total: number;
      pass?: ProgressPass;
      degraded: boolean;
      skipped: number;
      failed: number;
    };
  };
  projectStatus: ProjectStatus;
  projectStatusText: string;
}

export interface BuildProgressReadinessSnapshotOptions {
  discovery: DiscoveryProgressState;
  indexer: IndexerStatusSnapshot;
  activeUri?: string | null;
  activeProjectName?: string;
  activeProjectFiles: string[];
  workspaceFiles: string[];
  isSemanticallyReady: (uri: string) => boolean;
  isSchedulerIdle?: boolean;
}

function countReadyFiles(files: string[], isSemanticallyReady: (uri: string) => boolean): number {
  let readyFiles = 0;
  for (const file of files) {
    if (isSemanticallyReady(file)) {
      readyFiles++;
    }
  }
  return readyFiles;
}

function deriveReadinessState(
  discovery: DiscoveryProgressState,
  indexer: IndexerStatusSnapshot,
  levels: ProgressReadinessLevels,
  workspaceFiles: string[],
  isSchedulerIdle?: boolean
): { state: ReadinessState; detail?: string } {
  if (discovery.total > 0 && discovery.current < discovery.total) {
    if (isSchedulerIdle && discovery.startTimeMs && Date.now() - discovery.startTimeMs > 30000) {
      return { state: 'degraded', detail: 'discovery-timeout' };
    }
    return { state: 'discovering', detail: 'discovery' };
  }

  if (indexer.degraded) {
    return { state: 'degraded', detail: indexer.degradedReason };
  }

  if (levels.workspaceReady) {
    return { state: 'ready' };
  }

  if (workspaceFiles.length === 0) {
    return { state: 'idle' };
  }

  if (
    indexer.phase !== 'idle'
    || indexer.byState[FileIndexState.Pending] > 0
    || indexer.byState[FileIndexState.Indexing] > 0
    || levels.activeContextReady
    || levels.projectReady
  ) {
    return {
      state: 'indexing',
      detail: indexer.pass ?? (indexer.phase === 'ready' ? 'enriched' : undefined)
    };
  }

  return { state: 'idle' };
}

export function buildProgressReadinessSnapshot(
  options: BuildProgressReadinessSnapshotOptions
): ProgressReadinessSnapshot {
  const workspaceReadyFiles = countReadyFiles(options.workspaceFiles, options.isSemanticallyReady);
  const projectReadyFiles = countReadyFiles(options.activeProjectFiles, options.isSemanticallyReady);
  const levels: ProgressReadinessLevels = {
    activeContextReady: options.activeUri ? options.isSemanticallyReady(options.activeUri) : false,
    projectReady: options.activeProjectFiles.length > 0 && projectReadyFiles === options.activeProjectFiles.length,
    workspaceReady: options.workspaceFiles.length > 0 && workspaceReadyFiles === options.workspaceFiles.length
  };
  const readiness = deriveReadinessState(options.discovery, options.indexer, levels, options.workspaceFiles, options.isSchedulerIdle);
  const projectStatus: ProjectStatus = {
    readiness: readiness.state,
    projectName: options.activeProjectName,
    totalFiles: options.activeProjectFiles.length > 0 ? options.activeProjectFiles.length : options.workspaceFiles.length,
    indexedFiles: options.activeProjectFiles.length > 0 ? projectReadyFiles : workspaceReadyFiles,
    pass: options.indexer.pass,
    skippedFiles: options.indexer.byState[FileIndexState.Skipped],
    failedFiles: options.indexer.byState[FileIndexState.Failed]
  };

  return {
    readiness: {
      state: readiness.state,
      detail: readiness.detail,
      levels
    },
    progress: {
      discovery: { ...options.discovery },
      indexing: {
        current: options.indexer.current,
        total: options.indexer.total,
        pass: options.indexer.pass,
        degraded: options.indexer.degraded,
        skipped: options.indexer.byState[FileIndexState.Skipped],
        failed: options.indexer.byState[FileIndexState.Failed]
      }
    },
    projectStatus,
    projectStatusText: formatProjectStatus(projectStatus)
  };
}

export function toProgressNotification(snapshot: ProgressReadinessSnapshot): ProgressNotification {
  switch (snapshot.readiness.state) {
    case 'discovering':
      return {
        phase: 'discovering',
        current: snapshot.progress.discovery.current,
        total: snapshot.progress.discovery.total,
        message: snapshot.projectStatusText
      };
    case 'indexing':
      return {
        phase: 'indexing',
        current: snapshot.progress.indexing.current,
        total: snapshot.progress.indexing.total,
        pass: snapshot.progress.indexing.pass,
        degraded: snapshot.progress.indexing.degraded,
        skipped: snapshot.progress.indexing.skipped,
        failed: snapshot.progress.indexing.failed,
        message: snapshot.projectStatusText
      };
    case 'degraded':
      return {
        phase: 'degraded',
        current: snapshot.progress.indexing.current,
        total: snapshot.progress.indexing.total,
        degraded: true,
        skipped: snapshot.progress.indexing.skipped,
        failed: snapshot.progress.indexing.failed,
        message: snapshot.projectStatusText
      };
    case 'ready':
      return {
        phase: 'ready',
        current: snapshot.progress.indexing.total,
        total: snapshot.progress.indexing.total,
        message: snapshot.projectStatusText
      };
    case 'idle':
      return { phase: 'idle', message: snapshot.projectStatusText };
    case 'error':
      return { phase: 'partial', message: snapshot.readiness.detail };
  }
}