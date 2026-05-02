import type { TextDocument } from 'vscode-languageserver-textdocument';

import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import type { IFileSystem } from '../system/fileSystem';
import { normalizeUri } from '../system/uriUtils';
import type { WorkspaceState } from '../workspace/workspaceState';
import type { ReferenceSource } from './references';

export type ReferenceSourcePoolScope = 'direct' | 'project' | 'multi-project' | 'workspace';

export interface ReferenceSourcePool {
  sources: ReferenceSource[];
  candidateUris: string[];
  scope: ReferenceSourcePoolScope;
}

export interface CollectReferenceSourcePoolOptions {
  currentUri: string;
  resolvedTargetUris?: readonly string[];
  workspaceState?: WorkspaceState;
  fs: IFileSystem;
  getOpenDocument?: (uri: string) => TextDocument | undefined;
  getSnapshot?: (uri: string) => SemanticDocumentSnapshot | null | undefined;
}

function addAll(target: Set<string>, uris: readonly string[] | Iterable<string>): void {
  for (const uri of uris) {
    target.add(normalizeUri(uri));
  }
}

function getProjectFileSet(workspaceState: WorkspaceState | undefined, uris: readonly string[]): {
  projectUris: string[];
  files: string[];
} {
  if (!workspaceState) {
    return { projectUris: [], files: [] };
  }

  const projectUris = new Set<string>();
  const projectFiles = new Set<string>();
  const projectModel = workspaceState.getProjectModel();

  for (const uri of uris) {
    const project = workspaceState.getProjectContextForFile(uri);
    if (!project) {
      continue;
    }

    projectUris.add(project.projectUri);
    addAll(projectFiles, projectModel?.getFilesForProject(project.projectUri) ?? project.files);
  }

  return {
    projectUris: [...projectUris].sort(),
    files: [...projectFiles].sort()
  };
}

function resolveCandidateUris(options: CollectReferenceSourcePoolOptions): {
  candidateUris: string[];
  scope: ReferenceSourcePoolScope;
} {
  const directUris = new Set<string>();
  directUris.add(normalizeUri(options.currentUri));
  addAll(directUris, options.resolvedTargetUris ?? []);

  const project = getProjectFileSet(options.workspaceState, [...directUris]);
  if (project.files.length > 0) {
    addAll(directUris, project.files);
    return {
      candidateUris: [...directUris].sort(),
      scope: project.projectUris.length > 1 ? 'multi-project' : 'project'
    };
  }

  const workspaceFiles = options.workspaceState?.getAllSourceFiles().map((uri) => normalizeUri(uri)) ?? [];
  if (workspaceFiles.length > directUris.size) {
    addAll(directUris, workspaceFiles);
    return {
      candidateUris: [...directUris].sort(),
      scope: 'workspace'
    };
  }

  return {
    candidateUris: [...directUris].sort(),
    scope: 'direct'
  };
}

export async function collectReferenceSourcePool(
  options: CollectReferenceSourcePoolOptions
): Promise<ReferenceSourcePool> {
  const { candidateUris, scope } = resolveCandidateUris(options);
  const sources: ReferenceSource[] = [];

  for (const uri of candidateUris) {
    const openDocument = options.getOpenDocument?.(uri);
    let content = openDocument?.getText();
    if (content == null) {
      try {
        content = await options.fs.readFile(uri);
      } catch {
        continue;
      }
    }

    const lines = content.split(/\r?\n/);
    const snapshot = options.getSnapshot?.(uri) ?? undefined;
    const maskedLines = snapshot?.maskedText.lines.length === lines.length
      ? snapshot.maskedText.lines
      : undefined;

    sources.push({
      uri,
      content,
      lines,
      ...(maskedLines ? { maskedLines } : {})
    });
  }

  return {
    sources,
    candidateUris,
    scope
  };
}