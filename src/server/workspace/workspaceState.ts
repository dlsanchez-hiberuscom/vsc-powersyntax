import { normalizeUri } from '../system/uriUtils';

export interface WorkspaceRoots {
  /** URIs of .pbw files found */
  workspaces: string[];
  /** URIs of .pbt files found */
  targets: string[];
  /** URIs of .pbl directories/files found */
  libraries: string[];
}

/**
 * Mantiene el inventario global de archivos descubiertos en el workspace.
 */
export class WorkspaceState {
  private knownFiles: Set<string> = new Set();
  
  private roots: WorkspaceRoots = {
    workspaces: [],
    targets: [],
    libraries: []
  };

  /**
   * Registra un archivo de código fuente (.sr*) descubierto.
   */
  addSourceFile(uri: string): void {
    this.knownFiles.add(normalizeUri(uri));
  }

  /**
   * Comprueba si un archivo ya fue descubierto.
   */
  hasSourceFile(uri: string): boolean {
    return this.knownFiles.has(normalizeUri(uri));
  }

  /**
   * Registra un root de proyecto (pbw, pbt, pbl).
   */
  addRoot(type: keyof WorkspaceRoots, uri: string): void {
    const normalized = normalizeUri(uri);
    if (!this.roots[type].includes(normalized)) {
      this.roots[type].push(normalized);
    }
  }

  /**
   * Devuelve todos los URIs de código fuente conocidos.
   */
  getAllSourceFiles(): string[] {
    return Array.from(this.knownFiles);
  }

  /**
   * Devuelve los roots descubiertos.
   */
  getRoots(): WorkspaceRoots {
    return this.roots;
  }

  /**
   * Limpia todo el estado (útil para re-indexación completa o reinicios).
   */
  clear(): void {
    this.knownFiles.clear();
    this.roots = { workspaces: [], targets: [], libraries: [] };
  }
}
