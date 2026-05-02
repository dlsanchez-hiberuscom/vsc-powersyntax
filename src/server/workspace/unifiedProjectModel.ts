import { normalizeUri } from '../system/uriUtils';
import type { WorkspaceTopology } from './topology';
import { resolveProjectRouting } from './projectRouting';

export interface UnifiedProjectNode {
  projectUri: string;
  kind: 'target' | 'project' | 'library';
  name: string;
  libraries: string[];
}

export interface UnifiedProjectModel {
  getProjects(): UnifiedProjectNode[];
  getProjectForFile(uri: string): UnifiedProjectNode | null;
  getFilesForProject(projectUri: string): string[];
  getLibrariesForFile(uri: string): string[];
  getStats(): { projects: number; libraries: number; orphanFiles: number };
}

export function buildUnifiedProjectModel(
  topology: WorkspaceTopology,
  sourceFiles: string[],
  libraryRoots: string[] = [],
  librarySourceAliases: Record<string, string[]> = {}
): UnifiedProjectModel {
  const nodes = new Map<string, UnifiedProjectNode>();
  const projectFiles = new Map<string, string[]>();
  const routing = resolveProjectRouting(topology, sourceFiles, libraryRoots, librarySourceAliases);

  for (const target of topology.targets) {
    nodes.set(normalizeUri(target.uri), {
      projectUri: normalizeUri(target.uri),
      kind: 'target',
      name: target.name,
      libraries: [...target.libraries]
    });
  }

  for (const project of topology.projects) {
    nodes.set(normalizeUri(project.uri), {
      projectUri: normalizeUri(project.uri),
      kind: 'project',
      name: project.name,
      libraries: [...project.libraries]
    });
  }

  const declaredLibraries = new Set(
    [...topology.targets.flatMap((target) => target.libraries), ...topology.projects.flatMap((project) => project.libraries)]
      .map((library) => normalizeUri(library))
  );

  for (const libraryRoot of libraryRoots) {
    const normalizedLibraryRoot = normalizeUri(libraryRoot);
    if (declaredLibraries.has(normalizedLibraryRoot)) {
      continue;
    }

    nodes.set(normalizedLibraryRoot, {
      projectUri: normalizedLibraryRoot,
      kind: 'library',
      name: basename(normalizedLibraryRoot),
      libraries: [normalizedLibraryRoot]
    });
  }

  for (const file of sourceFiles) {
    const projectUri = routing.fileToProject.get(normalizeUri(file));
    if (!projectUri) continue;
    const normalizedProjectUri = normalizeUri(projectUri);
    const project = nodes.get(normalizedProjectUri);
    if (!project) continue;

    const normalizedFile = normalizeUri(file);
    const belongsToDeclaredLibrary = project.libraries.some((libraryUri) => {
      return expandLibrarySourceRoots(libraryUri, librarySourceAliases).some((prefix) => normalizedFile.startsWith(prefix));
    });
    if (!belongsToDeclaredLibrary) continue;

    const files = projectFiles.get(normalizedProjectUri) ?? [];
    files.push(normalizedFile);
    projectFiles.set(normalizedProjectUri, files);
  }

  return {
    getProjects(): UnifiedProjectNode[] {
      return [...nodes.values()].sort((a, b) => a.projectUri.localeCompare(b.projectUri));
    },
    getProjectForFile(uri: string): UnifiedProjectNode | null {
      const projectUri = routing.fileToProject.get(normalizeUri(uri)) ?? null;
      return projectUri ? nodes.get(normalizeUri(projectUri)) ?? null : null;
    },
    getFilesForProject(projectUri: string): string[] {
      return [...(projectFiles.get(normalizeUri(projectUri)) ?? [])];
    },
    getLibrariesForFile(uri: string): string[] {
      return this.getProjectForFile(uri)?.libraries ?? [];
    },
    getStats(): { projects: number; libraries: number; orphanFiles: number } {
      const projects = [...nodes.values()];
      const orphanFiles = sourceFiles.filter((uri) => {
        const normalizedUri = normalizeUri(uri);
        return !projects.some((project) =>
          project.libraries.some((libraryUri) => {
            return expandLibrarySourceRoots(libraryUri, librarySourceAliases).some((prefix) => normalizedUri.startsWith(prefix));
          })
        );
      }).length;
      return {
        projects: projects.length,
        libraries: projects.reduce((count, project) => count + project.libraries.length, 0),
        orphanFiles
      };
    }
  };
}

function basename(uri: string): string {
  const normalized = uri.replace(/\/+$/, '');
  const segment = normalized.substring(normalized.lastIndexOf('/') + 1);
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function expandLibrarySourceRoots(libraryUri: string, aliases: Record<string, string[]>): string[] {
  const normalizedLibraryUri = normalizeUri(libraryUri);
  const sourceRoots = [normalizedLibraryUri, ...(aliases[normalizedLibraryUri] ?? [])]
    .map((entry) => normalizeUri(entry));
  return [...new Set(sourceRoots.map((entry) => (entry.endsWith('/') ? entry : `${entry}/`)))].sort();
}