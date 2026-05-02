import * as path from 'path';

import type {
  OrcaFileFingerprint,
  OrcaStagingExportRequest,
  OrcaStagingLibraryExport,
  OrcaStagingSelectedProject,
} from '../../shared/orcaProtocol';
import type { IFileSystem } from '../system/fileSystem';
import { fsPathToUri, getBasename, normalizeUri, uriToFsPath } from '../system/uriUtils';
import type { WorkspaceState } from '../workspace/workspaceState';

export const EXPORT_ROOT_SEGMENTS = ['.vsc-powersyntax', 'orca-export'] as const;
export const STAGING_SEGMENT = 'orca-staging';
export const SCRIPTS_SEGMENT = 'scripts';
export const STATE_SEGMENT = 'state';
export const EXPORT_SCRIPT_FILE = 'export-to-staging.orc';
export const EXPORT_STATE_FILE = 'last-export.state';
const EXPORT_STATE_SCHEMA_VERSION = '1.0.0';

export interface PreparedOrcaStagingExport {
  stagingRootUri: string;
  scriptUri: string;
  stateUri: string;
  exportedLibraries: OrcaStagingLibraryExport[];
  sessionLibrary: string;
  selectedProject?: OrcaStagingSelectedProject;
}

export interface OrcaStagingExportStateLibrary extends OrcaStagingLibraryExport {
  libraryFingerprint?: OrcaFileFingerprint;
  trackedSources?: Array<{
    uri: string;
    basename: string;
    fingerprint: OrcaFileFingerprint;
  }>;
}

type OrcaTrackedSourceState = NonNullable<OrcaStagingExportStateLibrary['trackedSources']>[number];

export interface OrcaStagingExportState {
  schemaVersion: string;
  generatedAt: number;
  workspaceFolderUri: string;
  stagingRootUri: string;
  scriptUri: string;
  stateUri: string;
  sessionLibrary: string;
  exportedLibraries: OrcaStagingExportStateLibrary[];
  selectedProject?: OrcaStagingSelectedProject;
}

export async function prepareOrcaStagingExport(
  request: OrcaStagingExportRequest,
  options: {
    workspaceFolders: string[];
    workspaceState: WorkspaceState;
    fs: IFileSystem;
  }
): Promise<PreparedOrcaStagingExport> {
  const sessionLibrary = request.sessionLibrary.trim();
  if (!sessionLibrary) {
    throw new Error('Configura la DLL ORCA de sesión antes de exportar a staging.');
  }

  const selection = resolveOrcaStagingSelection(options.workspaceState, request.focusUri);
  const workspaceFolderUri = resolveWorkspaceFolderUri(
    options.workspaceFolders,
    request.focusUri,
    selection.libraries[0],
    selection.selectedProject?.projectUri
  );

  const exportRootUri = joinUri(workspaceFolderUri, ...EXPORT_ROOT_SEGMENTS);
  const stagingRootUri = joinUri(exportRootUri, STAGING_SEGMENT);
  const scriptsRootUri = joinUri(exportRootUri, SCRIPTS_SEGMENT);
  const stateRootUri = joinUri(exportRootUri, STATE_SEGMENT);

  await options.fs.createDirectory(stagingRootUri);
  await options.fs.createDirectory(scriptsRootUri);
  await options.fs.createDirectory(stateRootUri);

  const exportedLibraries: OrcaStagingLibraryExport[] = [];
  const stateLibraries: OrcaStagingExportStateLibrary[] = [];
  for (const libraryUri of selection.libraries) {
    const folderName = buildStagingFolderName(libraryUri, workspaceFolderUri);
    const stagingDirectoryUri = joinUri(stagingRootUri, folderName);

    await options.fs.deletePath(stagingDirectoryUri);
    await options.fs.createDirectory(stagingDirectoryUri);
    options.workspaceState.registerLibrarySourceAlias(libraryUri, stagingDirectoryUri);

    exportedLibraries.push({
      libraryUri,
      stagingDirectoryUri,
      folderName,
    });

    const stateLibrary: OrcaStagingExportStateLibrary = {
      libraryUri,
      stagingDirectoryUri,
      folderName,
    };
    const fingerprint = await captureFileFingerprint(options.fs, libraryUri);
    if (fingerprint) {
      stateLibrary.libraryFingerprint = fingerprint;
    }
    const trackedSources = await collectTrackedSourcesForLibrary(
      options.workspaceState,
      options.fs,
      libraryUri,
    );
    if (trackedSources.length > 0) {
      stateLibrary.trackedSources = trackedSources;
    }
    stateLibraries.push(stateLibrary);
  }

  options.workspaceState.refreshProjectRouting();

  const scriptUri = joinUri(scriptsRootUri, EXPORT_SCRIPT_FILE);
  const stateUri = joinUri(stateRootUri, EXPORT_STATE_FILE);
  await options.fs.writeFile(scriptUri, buildOrcaStagingScript(sessionLibrary, exportedLibraries));

  const statePayload: OrcaStagingExportState = {
    schemaVersion: EXPORT_STATE_SCHEMA_VERSION,
    generatedAt: Date.now(),
    workspaceFolderUri,
    stagingRootUri,
    scriptUri,
    stateUri,
    sessionLibrary,
    exportedLibraries: stateLibraries,
    ...(selection.selectedProject ? { selectedProject: selection.selectedProject } : {}),
  };
  await options.fs.writeFile(stateUri, JSON.stringify(statePayload, null, 2));

  return {
    stagingRootUri,
    scriptUri,
    stateUri,
    exportedLibraries,
    sessionLibrary,
    ...(selection.selectedProject ? { selectedProject: selection.selectedProject } : {}),
  };
}

export async function restoreOrcaStagingAliases(
  workspaceFolders: string[],
  fs: IFileSystem,
  workspaceState: WorkspaceState,
): Promise<number> {
  let restored = 0;

  for (const workspaceFolderUri of workspaceFolders) {
    const stateUri = joinUri(workspaceFolderUri, ...EXPORT_ROOT_SEGMENTS, STATE_SEGMENT, EXPORT_STATE_FILE);
    const stateStat = await fs.stat(stateUri);
    if (!stateStat?.isFile) {
      continue;
    }

    let parsed: OrcaStagingExportState | undefined;
    try {
      parsed = parseOrcaStagingExportState(await fs.readFile(stateUri));
    } catch {
      parsed = undefined;
    }
    if (!parsed) {
      continue;
    }

    for (const entry of parsed.exportedLibraries) {
      const stat = await fs.stat(entry.stagingDirectoryUri);
      if (!stat?.isDirectory) {
        continue;
      }
      workspaceState.registerLibrarySourceAlias(entry.libraryUri, entry.stagingDirectoryUri);
      restored++;
    }
  }

  return restored;
}

export async function readOrcaStagingExportState(options: {
  workspaceFolders: string[];
  fs: IFileSystem;
  focusUri?: string;
}): Promise<OrcaStagingExportState> {
  const candidateWorkspaceFolders = buildStateCandidateWorkspaceFolders(options.workspaceFolders, options.focusUri);

  for (const workspaceFolderUri of candidateWorkspaceFolders) {
    const stateUri = joinUri(workspaceFolderUri, ...EXPORT_ROOT_SEGMENTS, STATE_SEGMENT, EXPORT_STATE_FILE);
    const stat = await options.fs.stat(stateUri);
    if (!stat?.isFile) {
      continue;
    }

    const parsed = parseOrcaStagingExportState(await options.fs.readFile(stateUri));
    if (!parsed) {
      throw new Error('El estado persistido de ORCA staging es inválido. Reexporta el staging antes de importar.');
    }

    return {
      ...parsed,
      workspaceFolderUri: parsed.workspaceFolderUri || workspaceFolderUri,
      stateUri: parsed.stateUri || stateUri,
    };
  }

  throw new Error('No se encontró un export ORCA staging persistido. Ejecuta primero el export a staging.');
}

function resolveOrcaStagingSelection(
  workspaceState: WorkspaceState,
  focusUri?: string,
): { libraries: string[]; selectedProject?: OrcaStagingSelectedProject } {
  const roots = workspaceState.getRoots();
  const normalizedFocus = focusUri ? normalizeUri(focusUri) : undefined;

  if (normalizedFocus && roots.libraries.includes(normalizedFocus)) {
    return {
      libraries: [normalizedFocus],
      selectedProject: {
        projectUri: normalizedFocus,
        kind: 'library',
        name: getBasename(normalizedFocus),
      }
    };
  }

  const focusProject = workspaceState.getProjectContextForFile(focusUri ?? null);
  if (focusProject?.libraries.length) {
    return {
      libraries: [...new Set(focusProject.libraries.map((libraryUri) => normalizeUri(libraryUri)))],
      selectedProject: {
        projectUri: focusProject.projectUri,
        kind: focusProject.kind,
        name: focusProject.name,
      }
    };
  }

  const projects = workspaceState.getProjectModel()?.getProjects() ?? [];
  if (projects.length === 1 && projects[0]?.libraries.length) {
    const selectedProject = projects[0];
    return {
      libraries: [...new Set(selectedProject.libraries.map((libraryUri) => normalizeUri(libraryUri)))],
      selectedProject: {
        projectUri: selectedProject.projectUri,
        kind: selectedProject.kind,
        name: selectedProject.name,
      }
    };
  }

  if (workspaceState.getMode() === 'pbl-only' && roots.libraries.length > 0) {
    return { libraries: [...roots.libraries] };
  }

  if (roots.libraries.length === 1) {
    return {
      libraries: [...roots.libraries],
      selectedProject: {
        projectUri: roots.libraries[0]!,
        kind: 'library',
        name: getBasename(roots.libraries[0]!),
      }
    };
  }

  throw new Error(
    'No se pudo resolver un conjunto de librerías legacy para exportar. Abre un archivo del proyecto legacy o trabaja en un workspace PBL-only.'
  );
}

function resolveWorkspaceFolderUri(workspaceFolders: string[], ...candidates: Array<string | undefined>): string {
  const normalizedWorkspaceFolders = workspaceFolders.map((workspaceFolder) => ({
    original: workspaceFolder,
    normalized: ensureTrailingSlash(normalizeUri(workspaceFolder)),
  }));

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const normalizedCandidate = ensureTrailingSlash(normalizeUri(candidate));
    const best = normalizedWorkspaceFolders
      .filter((workspaceFolder) => normalizedCandidate.startsWith(workspaceFolder.normalized))
      .sort((left, right) => right.normalized.length - left.normalized.length)[0];
    if (best) {
      return best.original;
    }
  }

  const fallback = workspaceFolders[0];
  if (!fallback) {
    throw new Error('La exportación ORCA requiere al menos un workspace folder abierto.');
  }
  return fallback;
}

function buildStagingFolderName(libraryUri: string, workspaceFolderUri: string): string {
  const libraryFsPath = uriToFsPath(libraryUri);
  const workspaceFsPath = uriToFsPath(workspaceFolderUri);
  const rawRelative = libraryFsPath && workspaceFsPath
    ? path.relative(workspaceFsPath, libraryFsPath)
    : getBasename(libraryUri);
  const relative = rawRelative && !rawRelative.startsWith('..')
    ? rawRelative
    : getBasename(libraryUri);

  const sanitized = relative
    .replace(/[\\/]+/g, '__')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'legacy-library';

  return sanitized.endsWith('.pbl') ? `${sanitized}-source` : `${sanitized}.pbl-source`;
}

function buildOrcaStagingScript(
  sessionLibrary: string,
  exportedLibraries: OrcaStagingLibraryExport[],
): string {
  const lines = [
    '# generated by VSC PowerSyntax',
    `session begin ${formatOrcaParameter(sessionLibrary)}`,
    ...exportedLibraries.map((entry) => {
      const libraryPath = toOrcaPath(entry.libraryUri);
      const stagingDirectory = toOrcaPath(entry.stagingDirectoryUri);
      return `export ${formatOrcaParameter(libraryPath)}, , , ${formatOrcaParameter(stagingDirectory)}`;
    }),
    'session end',
    ''
  ];

  return lines.join('\r\n');
}

function formatOrcaParameter(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  return /[\s,]/.test(trimmed)
    ? `"${trimmed.replace(/"/g, '""')}"`
    : trimmed;
}

function toOrcaPath(pathOrUri: string): string {
  const fsPath = pathOrUri.includes('://') ? uriToFsPath(pathOrUri) : pathOrUri;
  return fsPath.replace(/\//g, '\\');
}

export async function captureFileFingerprint(fs: IFileSystem, uri: string): Promise<OrcaFileFingerprint | undefined> {
  const stat = await fs.stat(uri);
  if (!stat?.isFile) {
    return undefined;
  }

  const normalizedMtime = Math.trunc(stat.mtime);
  return {
    strategy: 'stat-v1',
    size: stat.size,
    mtime: normalizedMtime,
    fingerprint: `stat-v1:${normalizedMtime}:${stat.size}`,
  };
}

export async function captureTextFingerprint(fs: IFileSystem, uri: string): Promise<OrcaFileFingerprint | undefined> {
  const stat = await fs.stat(uri);
  if (!stat?.isFile) {
    return undefined;
  }

  const content = await fs.readFile(uri);
  const normalizedMtime = Math.trunc(stat.mtime);
  return {
    strategy: 'text-fnv1a32',
    size: stat.size,
    mtime: normalizedMtime,
    fingerprint: `text-fnv1a32:${fingerprintText(content)}`,
  };
}

function parseOrcaStagingExportState(content: string): OrcaStagingExportState | undefined {
  const parsed = JSON.parse(content) as Partial<OrcaStagingExportState>;
  if (parsed.schemaVersion !== EXPORT_STATE_SCHEMA_VERSION || !Array.isArray(parsed.exportedLibraries)) {
    return undefined;
  }

  const exportedLibraries = parsed.exportedLibraries.filter(
    (entry): entry is OrcaStagingExportStateLibrary =>
      Boolean(entry)
      && typeof entry.libraryUri === 'string'
      && typeof entry.stagingDirectoryUri === 'string'
      && typeof entry.folderName === 'string'
  );
  if (exportedLibraries.length === 0) {
    return undefined;
  }

  return {
    schemaVersion: parsed.schemaVersion,
    generatedAt: typeof parsed.generatedAt === 'number' ? parsed.generatedAt : Date.now(),
    workspaceFolderUri: typeof parsed.workspaceFolderUri === 'string' ? parsed.workspaceFolderUri : '',
    stagingRootUri: typeof parsed.stagingRootUri === 'string' ? parsed.stagingRootUri : '',
    scriptUri: typeof parsed.scriptUri === 'string' ? parsed.scriptUri : '',
    stateUri: typeof parsed.stateUri === 'string' ? parsed.stateUri : '',
    sessionLibrary: typeof parsed.sessionLibrary === 'string' ? parsed.sessionLibrary : '',
    exportedLibraries: exportedLibraries.map((entry) => ({
      libraryUri: entry.libraryUri,
      stagingDirectoryUri: entry.stagingDirectoryUri,
      folderName: entry.folderName,
      ...(entry.libraryFingerprint
        && isSupportedFingerprint(entry.libraryFingerprint)
        && typeof entry.libraryFingerprint.fingerprint === 'string'
        && typeof entry.libraryFingerprint.mtime === 'number'
        && typeof entry.libraryFingerprint.size === 'number'
        ? {
          libraryFingerprint: {
            strategy: entry.libraryFingerprint.strategy,
            fingerprint: entry.libraryFingerprint.fingerprint,
            mtime: entry.libraryFingerprint.mtime,
            size: entry.libraryFingerprint.size,
          }
        }
        : {}),
      ...(Array.isArray(entry.trackedSources)
        ? {
          trackedSources: entry.trackedSources.filter(
            (trackedSource): trackedSource is OrcaTrackedSourceState =>
              Boolean(trackedSource)
              && typeof trackedSource.uri === 'string'
              && typeof trackedSource.basename === 'string'
              && Boolean(trackedSource.fingerprint)
              && isSupportedFingerprint(trackedSource.fingerprint)
              && typeof trackedSource.fingerprint.fingerprint === 'string'
              && typeof trackedSource.fingerprint.mtime === 'number'
              && typeof trackedSource.fingerprint.size === 'number'
          ).map((trackedSource) => ({
            uri: trackedSource.uri,
            basename: trackedSource.basename,
            fingerprint: {
              strategy: trackedSource.fingerprint.strategy,
              fingerprint: trackedSource.fingerprint.fingerprint,
              mtime: trackedSource.fingerprint.mtime,
              size: trackedSource.fingerprint.size,
            },
          }))
        }
        : {}),
    })),
    ...(parsed.selectedProject
      && typeof parsed.selectedProject.projectUri === 'string'
      && typeof parsed.selectedProject.kind === 'string'
      && typeof parsed.selectedProject.name === 'string'
      ? {
        selectedProject: {
          projectUri: parsed.selectedProject.projectUri,
          kind: parsed.selectedProject.kind as OrcaStagingSelectedProject['kind'],
          name: parsed.selectedProject.name,
        }
      }
      : {}),
  };
}

export function joinUri(baseUri: string, ...segments: string[]): string {
  const baseFsPath = uriToFsPath(baseUri);
  if (!baseFsPath) {
    throw new Error(`No se pudo resolver la ruta local de ${baseUri}`);
  }

  return fsPathToUri(path.join(baseFsPath, ...segments));
}

function buildStateCandidateWorkspaceFolders(workspaceFolders: string[], focusUri?: string): string[] {
  const candidates: string[] = [];
  if (workspaceFolders.length > 0) {
    candidates.push(resolveWorkspaceFolderUri(workspaceFolders, focusUri));
  }
  for (const workspaceFolder of workspaceFolders) {
    if (!candidates.includes(workspaceFolder)) {
      candidates.push(workspaceFolder);
    }
  }
  return candidates;
}

async function collectTrackedSourcesForLibrary(
  workspaceState: WorkspaceState,
  fs: IFileSystem,
  libraryUri: string,
): Promise<NonNullable<OrcaStagingExportStateLibrary['trackedSources']>> {
  const trackedSources: NonNullable<OrcaStagingExportStateLibrary['trackedSources']> = [];

  for (const sourceUri of workspaceState.getAllSourceFiles()) {
    if (workspaceState.getSourceOrigin(sourceUri) === 'orca-staging') {
      continue;
    }
    if (workspaceState.resolveLibraryForFile(sourceUri, [libraryUri]) !== libraryUri) {
      continue;
    }

    const fingerprint = await captureTextFingerprint(fs, sourceUri);
    if (!fingerprint) {
      continue;
    }

    trackedSources.push({
      uri: sourceUri,
      basename: getBasename(sourceUri),
      fingerprint,
    });
  }

  return trackedSources.sort((left, right) => left.uri.localeCompare(right.uri));
}

function fingerprintText(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function isSupportedFingerprint(fingerprint: OrcaFileFingerprint | undefined): fingerprint is OrcaFileFingerprint {
  if (!fingerprint) {
    return false;
  }
  return fingerprint.strategy === 'stat-v1' || fingerprint.strategy === 'text-fnv1a32';
}

function ensureTrailingSlash(uri: string): string {
  return uri.endsWith('/') ? uri : `${uri}/`;
}