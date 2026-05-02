import { CancellationToken } from '../runtime/cancellation';
import { IFileSystem } from '../system/fileSystem';
import { WorkspaceState } from './workspaceState';
import { parsePbAutoBuildBuildFileCandidate } from './pbAutoBuildBuildFiles';
import { parseTopology } from './topology';
import { POWERBUILDER_SOURCE_EXTENSIONS } from '../../shared/powerbuilderFiles';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.svn',
  'node_modules',
  '.vscode',
  '.idea',
  'out',
  'dist',
  'bin',
  'obj',
  // PowerBuilder build/respaldo: ruido sin valor semántico para el plugin.
  '.pb',
  'build',
  '_backupfiles'
]);

const PB_SOURCE_EXTENSIONS = new Set<string>(POWERBUILDER_SOURCE_EXTENSIONS);

export type DiscoveryProgressHandler = (current: number, total: number) => void;

/**
 * Recorre recursivamente las carpetas del workspace descubriendo archivos PB.
 */
export async function discoverWorkspace(
  roots: string[],
  fs: IFileSystem,
  state: WorkspaceState,
  token: CancellationToken,
  onProgress?: DiscoveryProgressHandler
): Promise<void> {
  const progress = {
    current: 0,
    total: roots.length
  };
  onProgress?.(progress.current, progress.total);

  // Procesamos cada root (workspace folder) secuencialmente
  for (const rootUri of roots) {
    if (token.isCancelled) return;
    await walkDirectory(rootUri, fs, state, token, progress, onProgress);
  }

  state.recomputeSourceOrigins();
}

async function walkDirectory(
  dirUri: string,
  fs: IFileSystem,
  state: WorkspaceState,
  token: CancellationToken,
  progress: { current: number; total: number },
  onProgress?: DiscoveryProgressHandler
): Promise<void> {
  if (token.isCancelled) return;

  const entries = await fs.readDirectory(dirUri);
  progress.current++;
  onProgress?.(progress.current, progress.total);

  // Permitir preempción interactiva antes de procesar un directorio grande
  await yieldToEventLoop();

  const files: Array<{ entryUri: string; lowerName: string }> = [];
  const directories: Array<{ entryUri: string; lowerName: string }> = [];

  for (const [name, stat] of entries) {
    if (token.isCancelled) return;

    const entryUri = `${dirUri.replace(/\/$/, '')}/${encodeURIComponent(name)}`;
    const lowerName = name.toLowerCase();

    if (stat.isDirectory) {
      if (IGNORED_DIRECTORIES.has(lowerName)) {
        continue;
      }
      directories.push({ entryUri, lowerName });
    } else if (stat.isFile) {
      files.push({ entryUri, lowerName });
    }
  }

  files.sort(compareDiscoveryEntries);
  directories.sort(compareDiscoveryEntries);

  for (const file of files) {
    if (token.isCancelled) return;

    // Detección de roots
    if (file.lowerName.endsWith('.pbw')) {
      state.addRoot('workspaces', file.entryUri);
      await tryParseTopology(file.entryUri, fs, state);
    } else if (file.lowerName.endsWith('.pbt')) {
      state.addRoot('targets', file.entryUri);
      await tryParseTopology(file.entryUri, fs, state);
    } else if (file.lowerName.endsWith('.pbl')) {
      state.addRoot('libraries', file.entryUri); // PBL como archivo binario
    } else if (file.lowerName.endsWith('.pbsln')) {
      state.addRoot('solutions', file.entryUri);
      await tryParseTopology(file.entryUri, fs, state);
    } else if (file.lowerName.endsWith('.pbproj')) {
      state.addRoot('projects', file.entryUri);
      await tryParseTopology(file.entryUri, fs, state);
    } else if (file.lowerName.endsWith('.json')) {
      await tryParseBuildFile(file.entryUri, fs, state);
    } else {
      const extMatch = file.lowerName.match(/\.[^.]+$/);
      if (extMatch && PB_SOURCE_EXTENSIONS.has(extMatch[0])) {
        state.addSourceFile(file.entryUri);
      }
    }
  }

  for (const directory of directories) {
    if (token.isCancelled) return;

    // Si es un .pbl (en algunos proyectos exportados los PBL son carpetas)
    if (directory.lowerName.endsWith('.pbl')) {
      state.addRoot('libraries', directory.entryUri);
    }

    progress.total++;
    onProgress?.(progress.current, progress.total);
    await walkDirectory(directory.entryUri, fs, state, token, progress, onProgress);
  }
}

function compareDiscoveryEntries(
  left: { lowerName: string },
  right: { lowerName: string }
): number {
  return left.lowerName.localeCompare(right.lowerName);
}

/**
 * Cede el control al event loop (usando setImmediate) para permitir 
 * que otras tareas (interactivas) se ejecuten.
 */
function yieldToEventLoop(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

/**
 * Lee el contenido de un marker (`.pbw/.pbt/.pbsln/.pbproj`) y parsea su
 * topología, registrándola en el `WorkspaceState`. Errores son silenciosos:
 * un marker no parseable no debe romper el discovery.
 */
async function tryParseTopology(
  uri: string,
  fs: IFileSystem,
  state: WorkspaceState
): Promise<void> {
  try {
    const content = await fs.readFile(uri);
    const entry = parseTopology(uri, content);
    if (entry) {
      state.addTopologyEntry(entry);
    }
  } catch {
    // Marker ilegible → ignorado.
  }
}

async function tryParseBuildFile(
  uri: string,
  fs: IFileSystem,
  state: WorkspaceState
): Promise<void> {
  try {
    const content = await fs.readFile(uri);
    const candidate = parsePbAutoBuildBuildFileCandidate(uri, content);
    if (candidate) {
      state.addBuildFileCandidate(candidate);
    }
  } catch {
    // JSON ilegible → ignorado como candidato de build.
  }
}
