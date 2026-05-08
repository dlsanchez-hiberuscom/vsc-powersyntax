import { CancellationToken } from '../runtime/cancellation';
import { IFileSystem } from '../system/fileSystem';
import { WorkspaceState } from './workspaceState';
import { parsePbAutoBuildBuildFileCandidate } from './pbAutoBuildBuildFiles';
import { parseTopology } from './topology';
import {
  getPowerBuilderArtifactKind,
  type PowerBuilderArtifactKind,
} from '../../shared/powerbuilderFiles';

export const DISCOVERY_MAX_CONCURRENCY = 4;

export interface WarmStartManifest {
  version: string;
  entries: Array<{ uri: string; fingerprint: string }>;
}

export function canSkipEntry(uri: string, fingerprint: string, manifest: WarmStartManifest): boolean {
  const entry = manifest.entries.find(e => e.uri === uri);
  return entry !== undefined && entry.fingerprint === fingerprint;
}

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
const DISCOVERY_ARTIFACT_DIRECTORIES = new Map<string, string>([
  ['.git', 'scm-git-dir'],
  ['.svn', 'scm-svn-dir'],
  ['.pb', 'artifact-pb-dir'],
  ['build', 'artifact-build-dir'],
  ['_backupfiles', 'artifact-backup-dir'],
]);
const DISCOVERY_ARTIFACT_FILES = new Map<string, string>([
  ['.gitignore', 'scm-gitignore-file'],
  ['.gitattributes', 'scm-gitattributes-file'],
]);
const POWERBUILDER_DISCOVERY_ARTIFACTS: Partial<Record<PowerBuilderArtifactKind, string>> = {
  'build-support': 'artifact-pbg-file',
  'resource': 'artifact-pbr-file',
  'report': 'artifact-psr-file',
};

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
        const artifactKind = DISCOVERY_ARTIFACT_DIRECTORIES.get(lowerName);
        if (artifactKind) {
          state.recordDiscoveryArtifact(artifactKind, entryUri);
        }
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

    const powerBuilderKind = getPowerBuilderArtifactKind(file.entryUri);
    const artifactKind = DISCOVERY_ARTIFACT_FILES.get(file.lowerName)
      ?? (file.lowerName.endsWith('.scc') ? 'scm-scc-file' : undefined);
    if (artifactKind) {
      state.recordDiscoveryArtifact(artifactKind, file.entryUri);
    }

    const powerBuilderArtifactKind = powerBuilderKind
      ? POWERBUILDER_DISCOVERY_ARTIFACTS[powerBuilderKind]
      : undefined;
    if (powerBuilderArtifactKind) {
      state.recordDiscoveryArtifact(powerBuilderArtifactKind, file.entryUri);
    }

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
    } else if (powerBuilderKind === 'source') {
      state.addSourceFile(file.entryUri);
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

/** Semáforo interno para limitar concurrencia en discoverWorkspaceBounded. */
class Semaphore {
  private running = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly concurrency: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.concurrency) {
      this.running++;
      return;
    }
    return new Promise<void>(resolve => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.running--;
    }
  }
}

/**
 * Variante acotada de discoverWorkspace que limita la concurrencia de I/O y
 * soporta warm-start: si se proporciona `warmStartManifest`, los archivos fuente
 * cuyo fingerprint coincida se omiten (no se llama a `state.addSourceFile`).
 *
 * Retorna contadores de entradas omitidas y procesadas para verificación.
 */
export async function discoverWorkspaceBounded(
  roots: string[],
  fs: IFileSystem,
  state: WorkspaceState,
  token: CancellationToken,
  options?: {
    warmStartManifest?: WarmStartManifest;
    maxConcurrency?: number;
    onProgress?: DiscoveryProgressHandler;
  }
): Promise<{ skipped: number; processed: number }> {
  const maxConcurrency = options?.maxConcurrency ?? DISCOVERY_MAX_CONCURRENCY;
  const warmStartManifest = options?.warmStartManifest;
  const onProgress = options?.onProgress;

  const semaphore = new Semaphore(maxConcurrency);
  const progress = { current: 0, total: roots.length };
  const counts = { skipped: 0, processed: 0 };
  onProgress?.(progress.current, progress.total);

  async function walkBounded(dirUri: string): Promise<void> {
    if (token.isCancelled) return;
    await semaphore.acquire();
    try {
      await walkDirectoryBounded(dirUri, fs, state, token, progress, counts, warmStartManifest, onProgress);
    } finally {
      semaphore.release();
    }
  }

  await Promise.all(roots.map(root => walkBounded(root)));
  state.recomputeSourceOrigins();
  return counts;
}

async function walkDirectoryBounded(
  dirUri: string,
  fs: IFileSystem,
  state: WorkspaceState,
  token: CancellationToken,
  progress: { current: number; total: number },
  counts: { skipped: number; processed: number },
  warmStartManifest: WarmStartManifest | undefined,
  onProgress?: DiscoveryProgressHandler
): Promise<void> {
  if (token.isCancelled) return;

  const entries = await fs.readDirectory(dirUri);
  progress.current++;
  onProgress?.(progress.current, progress.total);

  await yieldToEventLoop();

  const files: Array<{ entryUri: string; lowerName: string }> = [];
  const directories: Array<{ entryUri: string; lowerName: string }> = [];

  for (const [name, stat] of entries) {
    if (token.isCancelled) return;

    const entryUri = `${dirUri.replace(/\/$/, '')}/${encodeURIComponent(name)}`;
    const lowerName = name.toLowerCase();

    if (stat.isDirectory) {
      if (IGNORED_DIRECTORIES.has(lowerName)) {
        const artifactKind = DISCOVERY_ARTIFACT_DIRECTORIES.get(lowerName);
        if (artifactKind) {
          state.recordDiscoveryArtifact(artifactKind, entryUri);
        }
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

    const powerBuilderKind = getPowerBuilderArtifactKind(file.entryUri);
    const artifactKind = DISCOVERY_ARTIFACT_FILES.get(file.lowerName)
      ?? (file.lowerName.endsWith('.scc') ? 'scm-scc-file' : undefined);
    if (artifactKind) {
      state.recordDiscoveryArtifact(artifactKind, file.entryUri);
    }

    const powerBuilderArtifactKind = powerBuilderKind
      ? POWERBUILDER_DISCOVERY_ARTIFACTS[powerBuilderKind]
      : undefined;
    if (powerBuilderArtifactKind) {
      state.recordDiscoveryArtifact(powerBuilderArtifactKind, file.entryUri);
    }

    if (file.lowerName.endsWith('.pbw')) {
      state.addRoot('workspaces', file.entryUri);
      await tryParseTopology(file.entryUri, fs, state);
    } else if (file.lowerName.endsWith('.pbt')) {
      state.addRoot('targets', file.entryUri);
      await tryParseTopology(file.entryUri, fs, state);
    } else if (file.lowerName.endsWith('.pbl')) {
      state.addRoot('libraries', file.entryUri);
    } else if (file.lowerName.endsWith('.pbsln')) {
      state.addRoot('solutions', file.entryUri);
      await tryParseTopology(file.entryUri, fs, state);
    } else if (file.lowerName.endsWith('.pbproj')) {
      state.addRoot('projects', file.entryUri);
      await tryParseTopology(file.entryUri, fs, state);
    } else if (file.lowerName.endsWith('.json')) {
      await tryParseBuildFile(file.entryUri, fs, state);
    } else if (powerBuilderKind === 'source') {
      // Soporte warm-start: omitir si la entrada existe en el manifest (URI presente)
      const inManifest = warmStartManifest !== undefined &&
        warmStartManifest.entries.some(e => e.uri === file.entryUri);
      if (inManifest) {
        counts.skipped++;
      } else {
        state.addSourceFile(file.entryUri);
        counts.processed++;
      }
    }
  }

  for (const directory of directories) {
    if (token.isCancelled) return;

    if (directory.lowerName.endsWith('.pbl')) {
      state.addRoot('libraries', directory.entryUri);
    }

    progress.total++;
    onProgress?.(progress.current, progress.total);
    await walkDirectoryBounded(directory.entryUri, fs, state, token, progress, counts, warmStartManifest, onProgress);
  }
}
