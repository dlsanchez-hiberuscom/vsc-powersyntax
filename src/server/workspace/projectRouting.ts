import { normalizeUri } from '../system/uriUtils';
import type { WorkspaceTopology } from './topology';

export interface ProjectRouting {
  fileToProject: Map<string, string>;
  projectToFiles: Map<string, string[]>;
}

interface MarkerEntry {
  markerUri: string;
  markerDir: string;
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

export function resolveProjectRouting(
  topology: WorkspaceTopology,
  sourceFiles: string[],
  libraryRoots: string[] = [],
  librarySourceAliases: Record<string, string[]> = {}
): ProjectRouting {
  const markers: MarkerEntry[] = [];
  const aliasesByLibrary = normalizeLibrarySourceAliases(librarySourceAliases);

  for (const target of topology.targets) {
    const markerUri = normalizeUri(target.uri);
    markers.push({
      markerUri,
      markerDir: withTrailingSlash(dirname(markerUri)),
      libraryDirs: expandLibraryDirs(target.libraries, aliasesByLibrary)
    });
  }
  for (const project of topology.projects) {
    const markerUri = normalizeUri(project.uri);
    markers.push({
      markerUri,
      markerDir: withTrailingSlash(dirname(markerUri)),
      libraryDirs: expandLibraryDirs(project.libraries, aliasesByLibrary)
    });
  }
  for (const libraryRoot of libraryRoots) {
    const markerUri = normalizeUri(libraryRoot);
    markers.push({
      markerUri,
      markerDir: withTrailingSlash(dirname(markerUri)),
      libraryDirs: expandLibraryDirs([markerUri], aliasesByLibrary)
    });
  }

  const fileToProject = new Map<string, string>();
  const projectToFiles = new Map<string, string[]>();

  for (const fileRaw of sourceFiles) {
    const file = normalizeUri(fileRaw);
    let bestMarker: string | null = null;
    let bestExplicit = -1;
    let bestPathScore = -1;

    for (const marker of markers) {
      let explicit = -1;
      for (const libraryDir of marker.libraryDirs) {
        if (file.toLowerCase().startsWith(libraryDir.toLowerCase())) {
          if (libraryDir.length > explicit) explicit = libraryDir.length;
        }
      }

      if (explicit > bestExplicit) {
        bestExplicit = explicit;
        bestMarker = marker.markerUri;
        bestPathScore = -1;
      } else if (explicit === bestExplicit && explicit < 0) {
        const score = commonPrefixLength(file.toLowerCase(), marker.markerDir.toLowerCase());
        if (score > bestPathScore) {
          bestPathScore = score;
          bestMarker = marker.markerUri;
        }
      }
    }

    if (bestMarker) {
      fileToProject.set(file, bestMarker);
      const files = projectToFiles.get(bestMarker) ?? [];
      files.push(file);
      projectToFiles.set(bestMarker, files);
    }
  }

  return { fileToProject, projectToFiles };
}

function normalizeLibrarySourceAliases(aliases: Record<string, string[]>): Map<string, string[]> {
  return new Map(
    Object.entries(aliases).map(([libraryUri, sourceRoots]) => [
      normalizeUri(libraryUri),
      [...new Set(sourceRoots.map((sourceRoot) => withTrailingSlash(normalizeUri(sourceRoot))))].sort()
    ])
  );
}

function expandLibraryDirs(libraries: string[], aliasesByLibrary: Map<string, string[]>): string[] {
  const expanded = new Set<string>();

  for (const library of libraries) {
    const normalizedLibrary = normalizeUri(library);
    expanded.add(withTrailingSlash(normalizedLibrary));
    for (const alias of aliasesByLibrary.get(normalizedLibrary) ?? []) {
      expanded.add(withTrailingSlash(normalizeUri(alias)));
    }
  }

  return [...expanded].sort();
}