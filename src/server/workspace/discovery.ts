import { CancellationToken } from '../runtime/cancellation';
import { IFileSystem } from '../system/fileSystem';
import { WorkspaceState } from './workspaceState';
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

/**
 * Recorre recursivamente las carpetas del workspace descubriendo archivos PB.
 */
export async function discoverWorkspace(
  roots: string[],
  fs: IFileSystem,
  state: WorkspaceState,
  token: CancellationToken
): Promise<void> {
  
  // Procesamos cada root (workspace folder) secuencialmente
  for (const rootUri of roots) {
    if (token.isCancelled) return;
    await walkDirectory(rootUri, fs, state, token);
  }
}

async function walkDirectory(
  dirUri: string,
  fs: IFileSystem,
  state: WorkspaceState,
  token: CancellationToken
): Promise<void> {
  if (token.isCancelled) return;

  const entries = await fs.readDirectory(dirUri);

  // Permitir preempción interactiva antes de procesar un directorio grande
  await yieldToEventLoop();

  for (const [name, stat] of entries) {
    if (token.isCancelled) return;

    const entryUri = `${dirUri.replace(/\/$/, '')}/${encodeURIComponent(name)}`;
    const lowerName = name.toLowerCase();

    if (stat.isDirectory) {
      if (IGNORED_DIRECTORIES.has(lowerName)) {
        continue;
      }
      
      // Si es un .pbl (en algunos proyectos exportados los PBL son carpetas)
      if (lowerName.endsWith('.pbl')) {
        state.addRoot('libraries', entryUri);
      }

      await walkDirectory(entryUri, fs, state, token);
    } else if (stat.isFile) {
      // Detección de roots
      if (lowerName.endsWith('.pbw')) {
        state.addRoot('workspaces', entryUri);
        await tryParseTopology(entryUri, fs, state);
      } else if (lowerName.endsWith('.pbt')) {
        state.addRoot('targets', entryUri);
        await tryParseTopology(entryUri, fs, state);
      } else if (lowerName.endsWith('.pbl')) {
        state.addRoot('libraries', entryUri); // PBL como archivo binario
      } else if (lowerName.endsWith('.pbsln')) {
        state.addRoot('solutions', entryUri);
        await tryParseTopology(entryUri, fs, state);
      } else if (lowerName.endsWith('.pbproj')) {
        state.addRoot('projects', entryUri);
        await tryParseTopology(entryUri, fs, state);
      } else {
        // Detección de código fuente
        const extMatch = lowerName.match(/\.[^.]+$/);
        if (extMatch && PB_SOURCE_EXTENSIONS.has(extMatch[0])) {
          state.addSourceFile(entryUri);
        }
      }
    }
  }
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
