import { CancellationToken } from '../runtime/cancellation';
import { IFileSystem } from '../system/fileSystem';
import { getBasename } from '../system/uriUtils';
import { WorkspaceState } from './workspaceState';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.svn',
  'node_modules',
  '.vscode',
  '.idea',
  'out',
  'dist',
  'bin',
  'obj'
]);

const PB_SOURCE_EXTENSIONS = new Set([
  '.sru', '.srw', '.srm', '.sra', '.srs', '.srf', '.srd', '.srp', '.srj', '.srq'
]);

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
      } else if (lowerName.endsWith('.pbt')) {
        state.addRoot('targets', entryUri);
      } else if (lowerName.endsWith('.pbl')) {
        state.addRoot('libraries', entryUri); // PBL como archivo binario
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
