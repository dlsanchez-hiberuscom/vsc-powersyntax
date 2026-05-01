import { normalizeUri } from '../system/uriUtils';
import type { ProjectRegistry } from './projectRegistry';
import type { WorkspaceTopology } from './topology';

export interface UnifiedProjectNode {
  projectUri: string;
  kind: 'target' | 'project';
  name: string;
  libraries: string[];
}

export interface UnifiedProjectModel {
  getProjects(): UnifiedProjectNode[];
  getProjectForFile(uri: string): UnifiedProjectNode | null;
  getLibrariesForFile(uri: string): string[];
  getStats(): { projects: number; libraries: number; orphanFiles: number };
}

export function buildUnifiedProjectModel(
  topology: WorkspaceTopology,
  registry: ProjectRegistry | null,
  sourceFiles: string[]
): UnifiedProjectModel {
  const nodes = new Map<string, UnifiedProjectNode>();

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

  return {
    getProjects(): UnifiedProjectNode[] {
      return [...nodes.values()].sort((a, b) => a.projectUri.localeCompare(b.projectUri));
    },
    getProjectForFile(uri: string): UnifiedProjectNode | null {
      const projectUri = registry?.getProjectForFile(uri) ?? null;
      return projectUri ? nodes.get(normalizeUri(projectUri)) ?? null : null;
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
            const prefix = libraryUri.endsWith('/') ? normalizeUri(libraryUri) : `${normalizeUri(libraryUri)}/`;
            return normalizedUri.startsWith(prefix);
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