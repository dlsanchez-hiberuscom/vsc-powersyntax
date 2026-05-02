/**
 * Project Registry: asocia cada archivo de código fuente con su proyecto/target
 * preferido a partir de la topología parseada.
 *
 * Scoring conservador:
 * 1. Si el archivo está bajo el dirname de una `.pbl` referenciada por un
 *    target/proyecto, se considera match explícito y gana el de prefijo
 *    coincidente más largo.
 * 2. En su ausencia, se usa el prefijo común con el dirname del marker
 *    (target/proyecto) como fallback.
 *
 * @module workspace/projectRegistry
 */

import { normalizeUri } from '../system/uriUtils';
import type { WorkspaceTopology } from './topology';
import { resolveProjectRouting } from './projectRouting';

export interface ProjectRegistry {
  getProjectForFile(uri: string): string | null;
  getAllProjects(): string[];
  getFilesForProject(projectUri: string): string[];
}

export function buildProjectRegistry(
  topology: WorkspaceTopology,
  sourceFiles: string[],
  libraryRoots: string[] = [],
  librarySourceAliases: Record<string, string[]> = {}
): ProjectRegistry {
  const { fileToProject, projectToFiles } = resolveProjectRouting(
    topology,
    sourceFiles,
    libraryRoots,
    librarySourceAliases
  );

  return {
    getProjectForFile(uri: string): string | null {
      return fileToProject.get(normalizeUri(uri)) ?? null;
    },
    /**
     * Spec 096: orden estable. Ordenamos alfabéticamente para que tests,
     * snapshots y consumidores deterministas no dependan del orden de
     * inserción del Map (que en práctica depende del orden de discovery).
     */
    getAllProjects(): string[] {
      return Array.from(projectToFiles.keys()).sort();
    },
    getFilesForProject(projectUri: string): string[] {
      const list = projectToFiles.get(normalizeUri(projectUri));
      return list ? [...list].sort() : [];
    }
  };
}
