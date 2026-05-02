import { normalizeUri } from '../system/uriUtils';
import {
  inferSourceOrigin,
  pickPreferredSourceOrigin,
  summarizeSourceOrigins,
  type SourceOrigin
} from '../../shared/sourceOrigin';
import {
  emptyTopology,
  type WorkspaceTopology,
  type TargetInfo,
  type ProjectInfo,
  type SolutionInfo,
  type WorkspaceFile
} from './topology';
import type { ProjectRegistry } from './projectRegistry';
import type { UnifiedProjectModel } from './unifiedProjectModel';
import { buildProjectRegistry } from './projectRegistry';
import { buildUnifiedProjectModel } from './unifiedProjectModel';

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

export interface ActiveProjectContext {
  projectUri: string;
  kind: 'target' | 'project';
  name: string;
  libraries: string[];
  files: string[];
}

export interface WorkspaceDiscoverySnapshot {
  sourceFiles: string[];
  sourceOrigins?: Record<string, SourceOrigin>;
  roots: WorkspaceRoots;
}

function cloneRoots(roots: WorkspaceRoots): WorkspaceRoots {
  return {
    workspaces: [...roots.workspaces],
    targets: [...roots.targets],
    libraries: [...roots.libraries],
    solutions: [...roots.solutions],
    projects: [...roots.projects]
  };
}

function normalizeRootList(uris: string[] | undefined): string[] {
  return [...new Set((uris ?? []).map((uri) => normalizeUri(uri)))].sort();
}

function normalizeRoots(roots?: Partial<WorkspaceRoots>): WorkspaceRoots {
  return {
    workspaces: normalizeRootList(roots?.workspaces),
    targets: normalizeRootList(roots?.targets),
    libraries: normalizeRootList(roots?.libraries),
    solutions: normalizeRootList(roots?.solutions),
    projects: normalizeRootList(roots?.projects)
  };
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
  private knownFiles: Map<string, SourceOrigin> = new Map();
  private indexDirty = true;

  private roots: WorkspaceRoots = {
    workspaces: [],
    targets: [],
    libraries: [],
    solutions: [],
    projects: []
  };

  private topology: WorkspaceTopology = emptyTopology();

  private projectRegistry: ProjectRegistry | null = null;
  private projectModel: UnifiedProjectModel | null = null;

  /**
   * Registra un archivo de código fuente (.sr*) descubierto.
   */
  addSourceFile(uri: string, sourceOrigin: SourceOrigin = 'unknown'): void {
    const normalized = normalizeUri(uri);
    const next = pickPreferredSourceOrigin(this.knownFiles.get(normalized), sourceOrigin);
    this.knownFiles.set(normalized, next);
    this.indexDirty = true;
  }

  removeSourceFile(uri: string): void {
    this.knownFiles.delete(normalizeUri(uri));
    this.indexDirty = true;
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

  removeRoot(type: keyof WorkspaceRoots, uri: string): void {
    const normalized = normalizeUri(uri);
    const next = this.roots[type].filter((entry) => entry !== normalized);
    if (next.length !== this.roots[type].length) {
      this.roots[type] = next;
      this.indexDirty = true;
    }
  }

  /**
   * Devuelve todos los URIs de código fuente conocidos.
   */
  getAllSourceFiles(): string[] {
    return Array.from(this.knownFiles.keys());
  }

  getSourceOrigin(uri: string): SourceOrigin | undefined {
    return this.knownFiles.get(normalizeUri(uri));
  }

  getSourceOriginSummary(): Partial<Record<SourceOrigin, number>> {
    return summarizeSourceOrigins(this.knownFiles.values());
  }

  /**
   * Devuelve los roots descubiertos.
   */
  getRoots(): WorkspaceRoots {
    return this.roots;
  }

  exportDiscoverySnapshot(): WorkspaceDiscoverySnapshot {
    const sourceOrigins: Record<string, SourceOrigin> = {};
    for (const [uri, sourceOrigin] of this.knownFiles.entries()) {
      sourceOrigins[uri] = sourceOrigin;
    }

    return {
      sourceFiles: this.getAllSourceFiles(),
      sourceOrigins,
      roots: cloneRoots(this.roots)
    };
  }

  restoreDiscoverySnapshot(snapshot?: Partial<WorkspaceDiscoverySnapshot> | null): void {
    if (!snapshot) {
      return;
    }

    const roots = normalizeRoots(snapshot.roots);
    const hasSolutionRoots = roots.solutions.length > 0 || roots.projects.length > 0;
    this.knownFiles = new Map(
      normalizeRootList(snapshot.sourceFiles).map((uri) => [
        uri,
        snapshot.sourceOrigins?.[uri] ?? inferSourceOrigin(uri, { hasSolutionRoots })
      ])
    );
    this.roots = roots;
    this.topology = emptyTopology();
    this.projectRegistry = null;
    this.projectModel = null;
    this.indexDirty = true;
  }

  replaceFrom(other: WorkspaceState): void {
    this.knownFiles = new Map(other.getAllSourceFiles().map((uri) => [uri, other.getSourceOrigin(uri) ?? 'unknown']));
    this.roots = cloneRoots(other.getRoots());
    this.topology = structuredClone(other.getTopology());
    this.projectRegistry = other.getProjectRegistry();
    this.projectModel = other.getProjectModel();
    this.indexDirty = other.isIndexDirty();
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
    this.indexDirty = true;
    this.roots = normalizeRoots();
    this.topology = emptyTopology();
    this.projectRegistry = null;
    this.projectModel = null;
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
    this.indexDirty = true;
  }

  removeTopologyEntry(kind: 'workspace' | 'target' | 'project' | 'solution', uri: string): void {
    const normalized = normalizeUri(uri);
    if (kind === 'workspace') {
      const next = this.topology.workspaces.filter((entry) => entry.uri !== normalized);
      if (next.length !== this.topology.workspaces.length) {
        this.topology.workspaces = next;
        this.indexDirty = true;
      }
      return;
    }

    if (kind === 'target') {
      const next = this.topology.targets.filter((entry) => entry.uri !== normalized);
      if (next.length !== this.topology.targets.length) {
        this.topology.targets = next;
        this.indexDirty = true;
      }
      return;
    }

    if (kind === 'project') {
      const next = this.topology.projects.filter((entry) => entry.uri !== normalized);
      if (next.length !== this.topology.projects.length) {
        this.topology.projects = next;
        this.indexDirty = true;
      }
      return;
    }

    const next = this.topology.solutions.filter((entry) => entry.uri !== normalized);
    if (next.length !== this.topology.solutions.length) {
      this.topology.solutions = next;
      this.indexDirty = true;
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

  setProjectModel(model: UnifiedProjectModel): void {
    this.projectModel = model;
  }

  getProjectModel(): UnifiedProjectModel | null {
    return this.projectModel;
  }

  getProjectContextForFile(uri: string | null): ActiveProjectContext | null {
    if (!uri) return null;
    const project = this.projectModel?.getProjectForFile(uri);
    if (!project) return null;
    return {
      projectUri: project.projectUri,
      kind: project.kind,
      name: project.name,
      libraries: [...project.libraries],
      files: this.projectModel?.getFilesForProject(project.projectUri) ?? []
    };
  }

  refreshProjectRouting(): void {
    const sourceFiles = this.getAllSourceFiles();
    this.projectRegistry = buildProjectRegistry(this.topology, sourceFiles);
    this.projectModel = buildUnifiedProjectModel(this.topology, sourceFiles);
  }

  recomputeSourceOrigins(): void {
    const hasSolutionRoots = this.roots.solutions.length > 0 || this.roots.projects.length > 0;
    this.knownFiles = new Map(
      this.getAllSourceFiles().map((uri) => [
        uri,
        pickPreferredSourceOrigin(this.getSourceOrigin(uri), inferSourceOrigin(uri, { hasSolutionRoots }))
      ])
    );
    this.indexDirty = true;
  }

  isIndexDirty(): boolean {
    return this.indexDirty;
  }

  markIndexClean(): void {
    this.indexDirty = false;
  }
}
