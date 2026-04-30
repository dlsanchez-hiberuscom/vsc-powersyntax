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

export interface ProjectRegistry {
  getProjectForFile(uri: string): string | null;
  getAllProjects(): string[];
  getFilesForProject(projectUri: string): string[];
}

interface MarkerEntry {
  /** URI del target o pbproj (clave de la asignación). */
  markerUri: string;
  /** Dirname del marker (para fallback por proximidad). */
  markerDir: string;
  /** Dirname de cada library, normalizada con `/` final. */
  libraryDirs: string[];
}

function dirname(uri: string): string {
  const i = uri.lastIndexOf('/');
  return i > 0 ? uri.substring(0, i) : uri;
}

function withTrailingSlash(uri: string): string {
  return uri.endsWith('/') ? uri : `${uri}/`;
}

function commonPrefixLength(a: string, b: string): number {
  let i = 0;
  const max = Math.min(a.length, b.length);
  while (i < max && a[i]!.toLowerCase() === b[i]!.toLowerCase()) i++;
  return i;
}

export function buildProjectRegistry(
  topology: WorkspaceTopology,
  sourceFiles: string[]
): ProjectRegistry {
  const markers: MarkerEntry[] = [];

  for (const t of topology.targets) {
    const markerUri = normalizeUri(t.uri);
    markers.push({
      markerUri,
      markerDir: withTrailingSlash(dirname(markerUri)),
      // `.pbl` puede ser carpeta (contiene `.sr*`) o archivo binario.
      // Tratamos su URI como prefijo: si es carpeta, los archivos lo
      // tendrán como prefijo; si es binario, no habrá match (correcto).
      libraryDirs: t.libraries.map((l) => withTrailingSlash(normalizeUri(l)))
    });
  }
  for (const p of topology.projects) {
    const markerUri = normalizeUri(p.uri);
    markers.push({
      markerUri,
      markerDir: withTrailingSlash(dirname(markerUri)),
      libraryDirs: p.libraries.map((l) => withTrailingSlash(normalizeUri(l)))
    });
  }

  const fileToProject = new Map<string, string>();
  const projectToFiles = new Map<string, string[]>();

  for (const fileRaw of sourceFiles) {
    const file = normalizeUri(fileRaw);
    let bestMarker: string | null = null;
    let bestExplicit = -1;
    let bestPathScore = -1;

    for (const m of markers) {
      // Match explícito por library
      let explicit = -1;
      for (const libDir of m.libraryDirs) {
        if (file.toLowerCase().startsWith(libDir.toLowerCase())) {
          if (libDir.length > explicit) explicit = libDir.length;
        }
      }

      if (explicit > bestExplicit) {
        bestExplicit = explicit;
        bestMarker = m.markerUri;
        bestPathScore = -1; // explícito gana sobre fallback
      } else if (explicit === bestExplicit && explicit < 0) {
        // Empate sin match explícito → comparar fallback path
        const score = commonPrefixLength(file.toLowerCase(), m.markerDir.toLowerCase());
        if (score > bestPathScore) {
          bestPathScore = score;
          bestMarker = m.markerUri;
        }
      }
    }

    if (bestMarker) {
      fileToProject.set(file, bestMarker);
      const list = projectToFiles.get(bestMarker) ?? [];
      list.push(file);
      projectToFiles.set(bestMarker, list);
    }
  }

  return {
    getProjectForFile(uri: string): string | null {
      return fileToProject.get(normalizeUri(uri)) ?? null;
    },
    getAllProjects(): string[] {
      return Array.from(projectToFiles.keys());
    },
    getFilesForProject(projectUri: string): string[] {
      return projectToFiles.get(normalizeUri(projectUri)) ?? [];
    }
  };
}
