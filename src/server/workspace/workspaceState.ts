import { normalizeUri } from '../system/uriUtils';
import {
  emptyTopology,
  type WorkspaceTopology,
  type TargetInfo,
  type ProjectInfo,
  type SolutionInfo,
  type WorkspaceFile
} from './topology';
import type { ProjectRegistry } from './projectRegistry';

export interface WorkspaceRoots {
  /** URIs of .pbw files found (Workspace mode marker). */
  workspaces: string[];
  /** URIs of .pbt files found (Workspace target marker). */
  targets: string[];
  /** URIs of .pbl directories/files found. */
  libraries: string[];
  /** URIs of .pbsln files found (Solution mode marker). */
  solutions: string[];
  /** URIs of .pbproj files found (Solution project marker). */
  projects: string[];
}

/**
 * Modo de proyecto detectado durante el discovery.
 *
 * - `workspace`: solo se han encontrado markers clásicos (`.pbw`/`.pbt`).
 * - `solution`: solo se han encontrado markers de Solution (`.pbsln`/`.pbproj`).
 * - `mixed`: coexisten ambos tipos en el mismo workspace.
 * - `unknown`: no se ha encontrado ningún marker reconocible.
 */
export type WorkspaceMode = 'workspace' | 'solution' | 'mixed' | 'unknown';

/**
 * Mantiene el inventario global de archivos descubiertos en el workspace.
 */
export class WorkspaceState {
  private knownFiles: Set<string> = new Set();

  private roots: WorkspaceRoots = {
    workspaces: [],
    targets: [],
    libraries: [],
    solutions: [],
    projects: []
  };

  private topology: WorkspaceTopology = emptyTopology();

  private projectRegistry: ProjectRegistry | null = null;

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
   * Registra un root de proyecto (pbw, pbt, pbl, pbsln, pbproj).
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
   * Devuelve el modo del proyecto detectado a partir de los markers
   * presentes. Útil para decisiones de UX (status bar) y de scheduling
   * (priorización por dependencias en cada modo).
   */
  getMode(): WorkspaceMode {
    const hasWorkspace = this.roots.workspaces.length > 0 || this.roots.targets.length > 0;
    const hasSolution = this.roots.solutions.length > 0 || this.roots.projects.length > 0;

    if (hasWorkspace && hasSolution) return 'mixed';
    if (hasSolution) return 'solution';
    if (hasWorkspace) return 'workspace';
    return 'unknown';
  }

  /**
   * Limpia todo el estado (útil para re-indexación completa o reinicios).
   */
  clear(): void {
    this.knownFiles.clear();
    this.roots = {
      workspaces: [],
      targets: [],
      libraries: [],
      solutions: [],
      projects: []
    };
    this.topology = emptyTopology();
  }

  /** Inserta o reemplaza la entrada de topología correspondiente. */
  addTopologyEntry(
    entry:
      | { kind: 'workspace'; data: WorkspaceFile }
      | { kind: 'target'; data: TargetInfo }
      | { kind: 'project'; data: ProjectInfo }
      | { kind: 'solution'; data: SolutionInfo }
  ): void {
    const list =
      entry.kind === 'workspace' ? this.topology.workspaces
      : entry.kind === 'target' ? this.topology.targets
      : entry.kind === 'project' ? this.topology.projects
      : this.topology.solutions;

    const idx = (list as Array<{ uri: string }>).findIndex((x) => x.uri === entry.data.uri);
    if (idx >= 0) {
      (list as Array<{ uri: string }>)[idx] = entry.data;
    } else {
      (list as Array<{ uri: string }>).push(entry.data);
    }
  }

  /** Devuelve la topología parseada actual (referencia, no clonada). */
  getTopology(): WorkspaceTopology {
    return this.topology;
  }

  // ---- Project Registry ---------------------------------------------------

  setProjectRegistry(registry: ProjectRegistry): void {
    this.projectRegistry = registry;
  }

  getProjectRegistry(): ProjectRegistry | null {
    return this.projectRegistry;
  }
}
