import type { ProgressNotification } from '../../shared/types';
import {
  buildProgressReadinessSnapshot,
  toProgressNotification,
  type DiscoveryProgressState,
  type IndexerStatusSnapshot,
  type ProgressReadinessSnapshot,
} from '../features/progressReadiness';
import type { ReadinessState } from '../workspace/readiness';

type ActiveProjectSnapshot = {
  name?: string;
  files: string[];
};

export interface RuntimeProgressController {
  buildRuntimeProgressReadiness(activeUriOverride?: string | null): ProgressReadinessSnapshot;
  publishRuntimeProgressReadiness(): void;
}

export function createRuntimeProgressController(args: {
  discoveryProgress: DiscoveryProgressState;
  getIndexerStatus(): IndexerStatusSnapshot;
  getActiveDocumentUri(): string | null;
  getActiveProject(activeUri: string | null): ActiveProjectSnapshot | null;
  getWorkspaceFiles(): string[];
  isSemanticallyReady(uri: string): boolean;
  transitionReadiness(state: ReadinessState, detail?: string): void;
  sendProgress(progress: ProgressNotification): void;
}): RuntimeProgressController {
  const buildRuntimeProgressReadiness = (activeUriOverride?: string | null): ProgressReadinessSnapshot => {
    const activeUri = activeUriOverride ?? args.getActiveDocumentUri();
    const activeProject = args.getActiveProject(activeUri);

    return buildProgressReadinessSnapshot({
      discovery: args.discoveryProgress,
      indexer: args.getIndexerStatus(),
      activeUri,
      activeProjectName: activeProject?.name,
      activeProjectFiles: activeProject?.files ?? [],
      workspaceFiles: args.getWorkspaceFiles(),
      isSemanticallyReady: args.isSemanticallyReady,
    });
  };

  return {
    buildRuntimeProgressReadiness,
    publishRuntimeProgressReadiness(): void {
      const snapshot = buildRuntimeProgressReadiness();
      args.transitionReadiness(snapshot.readiness.state, snapshot.readiness.detail);
      args.sendProgress(toProgressNotification(snapshot));
    },
  };
}