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
import {
  clonePbAutoBuildBuildFileCandidate,
  clonePbAutoBuildBuildFileInfo,
  resolvePbAutoBuildBuildFiles,
  summarizePbAutoBuildBuildFiles,
  type PbAutoBuildBuildFileCandidate,
  type PbAutoBuildBuildFileInfo,
  type PbAutoBuildBuildFileSummary
} from './pbAutoBuildBuildFiles';
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
  kind: 'target' | 'project' | 'library';
  name: string;
  libraries: string[];
  files: string[];
}

export interface WorkspaceDiscoverySnapshot {
  sourceFiles: string[];
  sourceOrigins?: Record<string, SourceOrigin>;
  librarySourceAliases?: Record<string, string[]>;
  roots: WorkspaceRoots;
  buildFiles?: PbAutoBuildBuildFileInfo[];
  discoveryArtifacts?: Record<string, string[]>;
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

function dirname(uri: string): string {
  const index = uri.lastIndexOf('/');
  return index > 0 ? uri.slice(0, index) : uri;
}

function ensureTrailingSlash(uri: string): string {
  return uri.endsWith('/') ? uri : `${uri}/`;
}

function resolveHasSolutionRootsForUri(uri: string, roots: WorkspaceRoots): boolean {
  const normalizedUri = normalizeUri(uri).toLowerCase();
  let bestPrefixLength = -1;
  let bestMode: 'solution' | 'workspace' | null = null;

  const workspaceMarkers = [...roots.workspaces, ...roots.targets].map((rootUri) => ensureTrailingSlash(dirname(normalizeUri(rootUri))).toLowerCase());
  for (const markerDir of workspaceMarkers) {
    if (!normalizedUri.startsWith(markerDir)) {
      continue;
    }
    if (markerDir.length > bestPrefixLength) {
      bestPrefixLength = markerDir.length;
      bestMode = 'workspace';
    }
  }

  const solutionMarkers = [...roots.solutions, ...roots.projects].map((rootUri) => ensureTrailingSlash(dirname(normalizeUri(rootUri))).toLowerCase());
  for (const markerDir of solutionMarkers) {
    if (!normalizedUri.startsWith(markerDir)) {
      continue;
    }
    if (markerDir.length > bestPrefixLength) {
      bestPrefixLength = markerDir.length;
      bestMode = 'solution';
    }
  }

  if (bestMode) {
    return bestMode === 'solution';
  }

  return solutionMarkers.length > 0 && workspaceMarkers.length === 0;
}

/**
 * Modo de proyecto detectado durante el discovery.
 *
 * - `workspace`: solo se han encontrado markers clásicos (`.pbw`/`.pbt`).
 * - `solution`: solo se han encontrado markers de Solution (`.pbsln`/`.pbproj`).
 * - `mixed`: coexisten ambos tipos en el mismo workspace.
 * - `pbl-only`: no hay markers `.pbw/.pbt/.pbsln/.pbproj`, pero sí roots `.pbl`.
 * - `unknown`: no se ha encontrado ningún marker reconocible.
 */
export type WorkspaceMode = 'workspace' | 'solution' | 'mixed' | 'pbl-only' | 'unknown';

/**
 * Mantiene el inventario global de archivos descubiertos en el workspace.
 */
export class WorkspaceState {
  private knownFiles: Map<string, SourceOrigin> = new Map();
  private librarySourceAliases: Map<string, string[]> = new Map();
  private discoveryArtifacts: Map<string, string[]> = new Map();
  private indexDirty = true;
  private buildFileCandidates: Map<string, PbAutoBuildBuildFileCandidate> = new Map();
  private buildFiles: PbAutoBuildBuildFileInfo[] = [];

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

  recordDiscoveryArtifact(kind: string, uri: string): void {
    const normalized = normalizeUri(uri);
    const current = this.discoveryArtifacts.get(kind) ?? [];
    if (current.includes(normalized)) {
      return;
    }

    current.push(normalized);
    current.sort();
    this.discoveryArtifacts.set(kind, current);
  }

  getDiscoveryArtifacts(): Record<string, string[]> {
    const artifacts: Record<string, string[]> = {};
    for (const [kind, uris] of this.discoveryArtifacts.entries()) {
      artifacts[kind] = [...uris];
    }
    return artifacts;
  }

  getDiscoveryArtifactSummary(): Record<string, { count: number; samples: string[] }> {
    const summary: Record<string, { count: number; samples: string[] }> = {};
    for (const [kind, uris] of this.discoveryArtifacts.entries()) {
      summary[kind] = {
        count: uris.length,
        samples: uris.slice(0, 3),
      };
    }
    return summary;
  }

  inferSourceOriginForUri(uri: string): SourceOrigin {
    return inferSourceOrigin(uri, {
      hasSolutionRoots: resolveHasSolutionRootsForUri(uri, this.roots)
    });
  }

  registerLibrarySourceAlias(libraryUri: string, sourceRootUri: string): void {
    const normalizedLibraryUri = normalizeUri(libraryUri);
    const normalizedSourceRootUri = normalizeUri(sourceRootUri);
    const aliases = this.librarySourceAliases.get(normalizedLibraryUri) ?? [];
    if (aliases.includes(normalizedSourceRootUri)) {
      return;
    }

    aliases.push(normalizedSourceRootUri);
    aliases.sort();
    this.librarySourceAliases.set(normalizedLibraryUri, aliases);
    this.indexDirty = true;
  }

  getLibrarySourceAliases(): Record<string, string[]> {
    const aliases: Record<string, string[]> = {};
    for (const [libraryUri, sourceRoots] of this.librarySourceAliases.entries()) {
      aliases[libraryUri] = [...sourceRoots];
    }
    return aliases;
  }

  resolveLibraryForFile(uri: string, libraries?: string[]): string | undefined {
    const normalizedUri = normalizeUri(uri);
    const candidates = libraries ?? this.roots.libraries;
    let bestLibrary: string | undefined;
    let bestPrefix = -1;

    for (const libraryUri of candidates) {
      const sourceRoots = expandLibrarySourceRoots(libraryUri, this.librarySourceAliases);
      for (const sourceRoot of sourceRoots) {
        if (!normalizedUri.startsWith(sourceRoot)) {
          continue;
        }
        if (sourceRoot.length > bestPrefix) {
          bestPrefix = sourceRoot.length;
          bestLibrary = libraryUri;
        }
      }
    }

    return bestLibrary;
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
      librarySourceAliases: this.getLibrarySourceAliases(),
      roots: cloneRoots(this.roots),
      buildFiles: this.getBuildFiles(),
      discoveryArtifacts: this.getDiscoveryArtifacts(),
    };
  }

  restoreDiscoverySnapshot(snapshot?: Partial<WorkspaceDiscoverySnapshot> | null): void {
    if (!snapshot) {
      return;
    }

    const roots = normalizeRoots(snapshot.roots);
    this.roots = roots;
    this.knownFiles = new Map(
      normalizeRootList(snapshot.sourceFiles).map((uri) => [
        uri,
        snapshot.sourceOrigins?.[uri] ?? this.inferSourceOriginForUri(uri)
      ])
    );
    this.librarySourceAliases = new Map(
      Object.entries(snapshot.librarySourceAliases ?? {}).map(([libraryUri, sourceRoots]) => [
        normalizeUri(libraryUri),
        normalizeRootList(sourceRoots)
      ])
    );
    this.discoveryArtifacts = new Map(
      Object.entries(snapshot.discoveryArtifacts ?? {}).map(([kind, uris]) => [kind, normalizeRootList(uris)])
    );
    this.topology = emptyTopology();
    this.buildFileCandidates = new Map();
    this.buildFiles = (snapshot.buildFiles ?? []).map((buildFile) => clonePbAutoBuildBuildFileInfo(buildFile));
    this.projectRegistry = null;
    this.projectModel = null;
    this.indexDirty = true;
  }

  replaceFrom(other: WorkspaceState): void {
    this.knownFiles = new Map(other.getAllSourceFiles().map((uri) => [uri, other.getSourceOrigin(uri) ?? 'unknown']));
    this.librarySourceAliases = new Map(
      Object.entries(other.getLibrarySourceAliases()).map(([libraryUri, sourceRoots]) => [libraryUri, [...sourceRoots]])
    );
    this.discoveryArtifacts = new Map(
      Object.entries(other.getDiscoveryArtifacts()).map(([kind, uris]) => [kind, [...uris]])
    );
    this.buildFileCandidates = new Map(
      [...other.buildFileCandidates.entries()].map(([uri, candidate]) => [uri, clonePbAutoBuildBuildFileCandidate(candidate)])
    );
    this.buildFiles = other.buildFiles.map((buildFile) => clonePbAutoBuildBuildFileInfo(buildFile));
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
    const hasLibraries = this.roots.libraries.length > 0;

    if (hasWorkspace && hasSolution) return 'mixed';
    if (hasSolution) return 'solution';
    if (hasWorkspace) return 'workspace';
    if (hasLibraries) return 'pbl-only';
    return 'unknown';
  }

  /**
   * Limpia todo el estado (útil para re-indexación completa o reinicios).
   */
  clear(): void {
    this.knownFiles.clear();
    this.librarySourceAliases.clear();
    this.discoveryArtifacts.clear();
    this.indexDirty = true;
    this.buildFileCandidates.clear();
    this.buildFiles = [];
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

  addBuildFileCandidate(candidate: PbAutoBuildBuildFileCandidate): boolean {
    const next = clonePbAutoBuildBuildFileCandidate(candidate);
    const previous = this.buildFileCandidates.get(next.uri);
    if (previous && areBuildFileCandidatesEqual(previous, next)) {
      return false;
    }
    this.buildFileCandidates.set(next.uri, next);
    this.indexDirty = true;
    return true;
  }

  removeBuildFileCandidate(uri: string): boolean {
    const normalized = normalizeUri(uri);
    const removed = this.buildFileCandidates.delete(normalized);
    if (!removed) {
      return false;
    }
    this.buildFiles = this.buildFiles.filter((buildFile) => buildFile.uri !== normalized);
    this.indexDirty = true;
    return true;
  }

  getBuildFiles(): PbAutoBuildBuildFileInfo[] {
    return this.buildFiles.map((buildFile) => clonePbAutoBuildBuildFileInfo(buildFile));
  }

  getBuildFile(uri: string): PbAutoBuildBuildFileInfo | null {
    const normalized = normalizeUri(uri);
    const buildFile = this.buildFiles.find((entry) => entry.uri === normalized);
    return buildFile ? clonePbAutoBuildBuildFileInfo(buildFile) : null;
  }

  getBuildFileSummary(): PbAutoBuildBuildFileSummary {
    return summarizePbAutoBuildBuildFiles(this.buildFiles);
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
    const librarySourceAliases = this.getLibrarySourceAliases();
    this.projectRegistry = buildProjectRegistry(this.topology, sourceFiles, this.roots.libraries, librarySourceAliases);
    this.projectModel = buildUnifiedProjectModel(this.topology, sourceFiles, this.roots.libraries, librarySourceAliases);
    this.buildFiles = resolvePbAutoBuildBuildFiles([...this.buildFileCandidates.values()], this.topology);
  }

  recomputeSourceOrigins(): void {
    this.knownFiles = new Map(
      this.getAllSourceFiles().map((uri) => [
        uri,
        pickPreferredSourceOrigin(this.getSourceOrigin(uri), this.inferSourceOriginForUri(uri))
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

function expandLibrarySourceRoots(libraryUri: string, aliases: Map<string, string[]>): string[] {
  const normalizedLibraryUri = normalizeUri(libraryUri);
  const sourceRoots = [normalizedLibraryUri, ...(aliases.get(normalizedLibraryUri) ?? [])]
    .map((entry) => normalizeUri(entry));
  return [...new Set(sourceRoots.map((entry) => (entry.endsWith('/') ? entry : `${entry}/`)))].sort();
}

function areBuildFileCandidatesEqual(
  left: PbAutoBuildBuildFileCandidate,
  right: PbAutoBuildBuildFileCandidate
): boolean {
  if (left.uri !== right.uri || left.hasBuildPlan !== right.hasBuildPlan || left.parseError !== right.parseError) {
    return false;
  }
  if (left.referencedProjectUris.length !== right.referencedProjectUris.length) {
    return false;
  }
  return left.referencedProjectUris.every((uri, index) => uri === right.referencedProjectUris[index]);
}
