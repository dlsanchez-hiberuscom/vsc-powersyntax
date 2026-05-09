import {
  createDegradedProjectionEnvelope,
  createReadOnlyProjectionEnvelope,
  type ApiObjectExplorerProjectionNode,
  type ApiObjectExplorerProjectionNodePath,
  type ApiObjectExplorerProjectionPage,
  type ApiObjectExplorerProjectionRequest,
  type ApiObjectExplorerScope,
  type ApiSemanticWorkspaceManifestObject,
} from '../../shared/publicApi';
import { inferPowerBuilderObjectKindFromUri } from './powerBuilderObjectKind';
import { buildSymbolKey } from '../knowledge/symbolKey';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { EntityKind } from '../knowledge/types';
import type { WorkspaceState } from '../workspace/workspaceState';

const SCHEMA_VERSION = '1.0.0';
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;
const MAX_OBJECTS = 100000;
const UNASSIGNED_PROJECT_KEY = '__unassigned_project__';
const UNASSIGNED_LIBRARY_KEY = '__unassigned_library__';

interface ObjectExplorerEntry {
  name: string;
  uri: string;
  identityKey?: string;
  baseType?: string;
  projectUri?: string;
  library?: string;
  objectKind: NonNullable<ApiSemanticWorkspaceManifestObject['objectKind']>;
  readiness?: string;
  sourceOrigin?: ApiSemanticWorkspaceManifestObject['sourceOrigin'];
}

interface ObjectExplorerProjectEntry {
  projectUri: string;
  kind: 'target' | 'project' | 'library';
  name: string;
  libraries: string[];
  fileCount: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampPageSize(pageSize: number | undefined): number {
  if (typeof pageSize !== 'number' || !Number.isFinite(pageSize)) {
    return DEFAULT_PAGE_SIZE;
  }

  return clamp(Math.trunc(pageSize), 1, MAX_PAGE_SIZE);
}

function parseCursor(cursor: string | undefined): number {
  if (!cursor) {
    return 0;
  }

  const parsed = Number.parseInt(cursor, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function basenameFromUri(uri: string | undefined): string {
  if (!uri) {
    return 'Sin dato';
  }

  const normalized = uri.replace(/\/+$|\/+$/g, '');
  const segment = normalized.slice(normalized.lastIndexOf('/') + 1);
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function summarizeReadiness(entries: readonly Pick<ObjectExplorerEntry, 'readiness'>[]): string {
  if (entries.length === 0) {
    return 'sin objetos';
  }

  const ready = entries.filter((entry) => entry.readiness === 'nearby-semantic-ready').length;
  return `${entries.length} objetos · listos ${ready}/${entries.length}`;
}

function summarizeOrigins(entries: readonly Pick<ObjectExplorerEntry, 'sourceOrigin'>[]): string {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const key = entry.sourceOrigin ?? 'unknown';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([origin, count]) => `${origin}: ${count}`)
    .join(' · ');
}

function compareObjects(left: ObjectExplorerEntry, right: ObjectExplorerEntry): number {
  const projectOrder = (left.projectUri ?? '').localeCompare(right.projectUri ?? '');
  if (projectOrder !== 0) {
    return projectOrder;
  }

  const libraryOrder = (left.library ?? '').localeCompare(right.library ?? '');
  if (libraryOrder !== 0) {
    return libraryOrder;
  }

  const kindOrder = (left.objectKind ?? 'unknown').localeCompare(right.objectKind ?? 'unknown');
  if (kindOrder !== 0) {
    return kindOrder;
  }

  return left.name.localeCompare(right.name);
}

function resolveProjectUriForActiveUri(
  projects: readonly ObjectExplorerProjectEntry[],
  objects: readonly ObjectExplorerEntry[],
  activeUri: string | undefined,
): string | undefined {
  if (!activeUri) {
    return undefined;
  }

  const fromObject = objects.find((entry) => entry.uri === activeUri)?.projectUri;
  if (fromObject) {
    return fromObject;
  }

  const normalizedActiveUri = activeUri.toLowerCase();
  return [...projects]
    .sort((left, right) => right.libraries.length - left.libraries.length)
    .find((project) => project.libraries.some((library) => normalizedActiveUri.startsWith(library.toLowerCase())))
    ?.projectUri;
}

function collectObjectExplorerProjects(workspaceState: WorkspaceState): ObjectExplorerProjectEntry[] {
  const projectModel = workspaceState.getProjectModel();
  return (projectModel?.getProjects() ?? []).map((project) => ({
    projectUri: project.projectUri,
    kind: project.kind,
    name: project.name,
    libraries: [...project.libraries],
    fileCount: projectModel?.getFilesForProject(project.projectUri).length ?? 0,
  }));
}

function collectObjectExplorerEntries(
  kb: KnowledgeBase,
  workspaceState: WorkspaceState,
): ObjectExplorerEntry[] {
  return kb.queryEntities({ kinds: [EntityKind.Type], limit: MAX_OBJECTS }).map((entity) => {
    const projectContext = workspaceState.getProjectContextForFile(entity.uri);
    const snapshot = kb.getDocumentSnapshot(entity.uri);
    const library = workspaceState.resolveLibraryForFile(entity.uri, projectContext?.libraries);

    return {
      name: entity.name,
      uri: entity.uri,
      ...(buildSymbolKey(entity) ? { identityKey: buildSymbolKey(entity) } : {}),
      ...(entity.baseTypeName ? { baseType: entity.baseTypeName } : {}),
      ...(projectContext?.projectUri ? { projectUri: projectContext.projectUri } : {}),
      ...(library ? { library } : {}),
      objectKind: inferPowerBuilderObjectKindFromUri(entity.uri) ?? 'unknown',
      ...(snapshot?.readiness ? { readiness: snapshot.readiness } : {}),
      ...(entity.lineage?.sourceOrigin ? { sourceOrigin: entity.lineage.sourceOrigin } : {}),
    };
  });
}

function applyScope(
  scope: ApiObjectExplorerScope,
  activeUri: string | undefined,
  objects: readonly ObjectExplorerEntry[],
  projects: readonly ObjectExplorerProjectEntry[],
): {
  effectiveScope: ApiObjectExplorerScope;
  filteredObjects: ObjectExplorerEntry[];
  message?: string;
  focusNodeId?: string;
} {
  let effectiveScope = scope;
  let filteredObjects = [...objects];
  let message: string | undefined;
  let focusNodeId: string | undefined;

  if (scope === 'current-file') {
    const currentFileObjects = activeUri ? filteredObjects.filter((entry) => entry.uri === activeUri) : [];
    if (currentFileObjects.length === 0) {
      effectiveScope = 'workspace';
      message = 'Foco en archivo actual no resuelto; mostrando workspace completo.';
    } else {
      filteredObjects = currentFileObjects;
      focusNodeId = `object:${currentFileObjects[0].uri}`;
    }
  }

  if (scope === 'current-project') {
    const activeProjectUri = resolveProjectUriForActiveUri(projects, objects, activeUri);
    if (!activeProjectUri) {
      effectiveScope = 'workspace';
      message = 'Foco en proyecto actual no resuelto; mostrando workspace completo.';
    } else {
      filteredObjects = filteredObjects.filter((entry) => entry.projectUri === activeProjectUri);
      const focusedObject = activeUri ? filteredObjects.find((entry) => entry.uri === activeUri) : undefined;
      if (focusedObject) {
        focusNodeId = `object:${focusedObject.uri}`;
      }
    }
  }

  return {
    effectiveScope,
    filteredObjects,
    ...(message ? { message } : {}),
    ...(focusNodeId ? { focusNodeId } : {}),
  };
}

function buildProjectNodes(
  objects: readonly ObjectExplorerEntry[],
  projectIndex: ReadonlyMap<string, ObjectExplorerProjectEntry>,
): ApiObjectExplorerProjectionNode[] {
  const grouped = new Map<string, ObjectExplorerEntry[]>();
  for (const object of objects) {
    const key = object.projectUri ?? UNASSIGNED_PROJECT_KEY;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(object);
    } else {
      grouped.set(key, [object]);
    }
  }

  return [...grouped.entries()]
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([projectKey, projectObjects]) => {
      const project = projectKey !== UNASSIGNED_PROJECT_KEY ? projectIndex.get(projectKey) : undefined;
      return {
        id: `project:${projectKey}`,
        type: 'project',
        label: project?.name ?? 'Sin proyecto',
        description: summarizeReadiness(projectObjects),
        tooltip: summarizeOrigins(projectObjects),
        hasChildren: projectObjects.length > 0,
        path: project?.projectUri ? { projectUri: project.projectUri } : {},
        ...(project?.projectUri ? { projectUri: project.projectUri } : {}),
      };
    });
}

function buildLibraryNodes(
  objects: readonly ObjectExplorerEntry[],
  parentPath: ApiObjectExplorerProjectionNodePath,
): ApiObjectExplorerProjectionNode[] {
  const grouped = new Map<string, ObjectExplorerEntry[]>();
  for (const object of objects) {
    const key = object.library ?? UNASSIGNED_LIBRARY_KEY;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(object);
    } else {
      grouped.set(key, [object]);
    }
  }

  return [...grouped.entries()]
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([libraryKey, libraryObjects]) => ({
      id: `library:${parentPath.projectUri ?? UNASSIGNED_PROJECT_KEY}:${libraryKey}`,
      type: 'library',
      label: libraryKey === UNASSIGNED_LIBRARY_KEY ? 'Sin librería' : basenameFromUri(libraryKey),
      description: summarizeReadiness(libraryObjects),
      tooltip: summarizeOrigins(libraryObjects),
      hasChildren: libraryObjects.length > 0,
      path: {
        ...(parentPath.projectUri ? { projectUri: parentPath.projectUri } : {}),
        ...(libraryKey !== UNASSIGNED_LIBRARY_KEY ? { library: libraryKey } : {}),
      },
      ...(parentPath.projectUri ? { projectUri: parentPath.projectUri } : {}),
      ...(libraryKey !== UNASSIGNED_LIBRARY_KEY ? { library: libraryKey } : {}),
    }));
}

function buildKindNodes(
  objects: readonly ObjectExplorerEntry[],
  parentPath: ApiObjectExplorerProjectionNodePath,
): ApiObjectExplorerProjectionNode[] {
  const grouped = new Map<NonNullable<ApiSemanticWorkspaceManifestObject['objectKind']>, ObjectExplorerEntry[]>();
  for (const object of objects) {
    const key = object.objectKind ?? 'unknown';
    const existing = grouped.get(key);
    if (existing) {
      existing.push(object);
    } else {
      grouped.set(key, [object]);
    }
  }

  return [...grouped.entries()]
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([objectKind, kindObjects]) => ({
      id: `kind:${parentPath.projectUri ?? UNASSIGNED_PROJECT_KEY}:${parentPath.library ?? UNASSIGNED_LIBRARY_KEY}:${objectKind}`,
      type: 'kind',
      label: objectKind === 'unknown'
        ? 'Unknown'
        : objectKind === 'userobject'
          ? 'UserObject'
          : objectKind.charAt(0).toUpperCase() + objectKind.slice(1),
      description: `${kindObjects.length} objetos`,
      tooltip: summarizeOrigins(kindObjects),
      hasChildren: kindObjects.length > 0,
      path: {
        ...(parentPath.projectUri ? { projectUri: parentPath.projectUri } : {}),
        ...(parentPath.library ? { library: parentPath.library } : {}),
        objectKind,
      },
      ...(parentPath.projectUri ? { projectUri: parentPath.projectUri } : {}),
      ...(parentPath.library ? { library: parentPath.library } : {}),
      objectKind,
    }));
}

function buildObjectNodes(objects: readonly ObjectExplorerEntry[]): ApiObjectExplorerProjectionNode[] {
  return [...objects]
    .sort(compareObjects)
    .map((object) => ({
      id: `object:${object.uri}`,
      type: 'object',
      label: object.name,
      description: [object.readiness, object.sourceOrigin].filter((part): part is string => Boolean(part)).join(' · '),
      tooltip: [
        `Objeto: ${object.name}`,
        ...(object.baseType ? [`Base: ${object.baseType}`] : []),
        ...(object.readiness ? [`Readiness: ${object.readiness}`] : []),
        ...(object.sourceOrigin ? [`Source origin: ${object.sourceOrigin}`] : []),
      ].join('\n'),
      hasChildren: false,
      path: {
        ...(object.projectUri ? { projectUri: object.projectUri } : {}),
        ...(object.library ? { library: object.library } : {}),
        ...(object.objectKind ? { objectKind: object.objectKind } : {}),
      },
      uri: object.uri,
      ...(object.projectUri ? { projectUri: object.projectUri } : {}),
      ...(object.library ? { library: object.library } : {}),
      ...(object.objectKind ? { objectKind: object.objectKind } : {}),
      ...(object.baseType ? { baseType: object.baseType } : {}),
      ...(object.readiness ? { readiness: object.readiness } : {}),
      ...(object.sourceOrigin ? { sourceOrigin: object.sourceOrigin } : {}),
    }));
}

function buildNodesForParent(
  objects: readonly ObjectExplorerEntry[],
  projects: readonly ObjectExplorerProjectEntry[],
  parentPath: ApiObjectExplorerProjectionNodePath | undefined,
): ApiObjectExplorerProjectionNode[] {
  const projectIndex = new Map(projects.map((project) => [project.projectUri, project]));

  if (!parentPath?.projectUri && !parentPath?.library && !parentPath?.objectKind) {
    return buildProjectNodes(objects, projectIndex);
  }

  if (parentPath.projectUri && !parentPath.library && !parentPath.objectKind) {
    return buildLibraryNodes(
      objects.filter((entry) => entry.projectUri === parentPath.projectUri),
      parentPath,
    );
  }

  if (parentPath.projectUri && parentPath.library && !parentPath.objectKind) {
    return buildKindNodes(
      objects.filter((entry) => entry.projectUri === parentPath.projectUri && entry.library === parentPath.library),
      parentPath,
    );
  }

  return buildObjectNodes(objects.filter((entry) =>
    (!parentPath?.projectUri || entry.projectUri === parentPath.projectUri)
    && (!parentPath?.library || entry.library === parentPath.library)
    && (!parentPath?.objectKind || entry.objectKind === parentPath.objectKind)
  ));
}

export function buildObjectExplorerProjection(
  request: ApiObjectExplorerProjectionRequest | undefined,
  kb: KnowledgeBase,
  workspaceState: WorkspaceState,
  readiness: { state?: string; detail?: string },
): ApiObjectExplorerProjectionPage {
  const scope = request?.scope ?? 'workspace';
  const activeUri = request?.activeUri;
  const pageSize = clampPageSize(request?.pageSize);
  const offset = parseCursor(request?.cursor);
  const generatedAt = new Date().toISOString();
  const projects = collectObjectExplorerProjects(workspaceState);
  const objects = collectObjectExplorerEntries(kb, workspaceState);
  const scoped = applyScope(scope, activeUri, objects, projects);
  const allNodes = buildNodesForParent(scoped.filteredObjects, projects, request?.parentPath);
  const pageNodes = allNodes.slice(offset, offset + pageSize);
  const hasMore = offset + pageSize < allNodes.length;

  const projectionBase = {
    projectionId: 'object-explorer',
    projectionOwner: 'object-explorer.server',
    generatedAt,
    ...(readiness.state ? { readiness: readiness.state } : {}),
    caps: {
      pageSize,
      maxItems: pageSize,
    },
    pageInfo: {
      page: Math.floor(offset / pageSize) + 1,
      pageSize,
      totalItems: allNodes.length,
      hasMore,
      ...(hasMore ? { nextCursor: String(offset + pageSize) } : {}),
    },
    refreshHint: readiness.state && readiness.state !== 'ready'
      ? {
          strategy: 'wait-for-readiness' as const,
          detail: 'Esperar a que el runtime alcance ready antes de tratar la proyección como estable.',
        }
      : {
          strategy: 'refresh-on-demand' as const,
          detail: 'Expandir o refrescar Object Explorer para solicitar la siguiente página.',
        },
  };

  const projection = readiness.state && readiness.state !== 'ready'
    ? createDegradedProjectionEnvelope({
        ...projectionBase,
        paged: hasMore || offset > 0,
        degradedReason: readiness.detail ?? `workspace-readiness:${readiness.state}`,
      })
    : createReadOnlyProjectionEnvelope({
        ...projectionBase,
        state: hasMore || offset > 0 ? 'paged' : 'ready',
        paged: hasMore || offset > 0,
      });

  return {
    schemaVersion: SCHEMA_VERSION,
    scope,
    effectiveScope: scoped.effectiveScope,
    ...(request?.parentId ? { parentId: request.parentId } : {}),
    ...(request?.parentPath ? { parentPath: { ...request.parentPath } } : {}),
    ...(scoped.focusNodeId ? { focusNodeId: scoped.focusNodeId } : {}),
    ...(scoped.message ? { message: scoped.message } : {}),
    nodes: pageNodes,
    projection,
  };
}