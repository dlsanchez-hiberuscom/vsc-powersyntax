import type {
  ApiSemanticWorkspaceManifest,
  ApiSemanticWorkspaceManifestObject,
} from '../shared/publicApi';

export type ObjectExplorerScope = 'workspace' | 'current-project' | 'current-file';

export interface ObjectExplorerProjectNode {
  type: 'project';
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  projectUri?: string;
  children: ObjectExplorerNode[];
}

export interface ObjectExplorerLibraryNode {
  type: 'library';
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  library?: string;
  children: ObjectExplorerNode[];
}

export interface ObjectExplorerKindNode {
  type: 'kind';
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  objectKind: NonNullable<ApiSemanticWorkspaceManifestObject['objectKind']>;
  children: ObjectExplorerNode[];
}

export interface ObjectExplorerObjectNode {
  type: 'object';
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  uri: string;
  objectKind: NonNullable<ApiSemanticWorkspaceManifestObject['objectKind']>;
  sourceOrigin?: ApiSemanticWorkspaceManifestObject['sourceOrigin'];
  readiness?: string;
  projectUri?: string;
  library?: string;
  baseType?: string;
}

export type ObjectExplorerNode =
  | ObjectExplorerProjectNode
  | ObjectExplorerLibraryNode
  | ObjectExplorerKindNode
  | ObjectExplorerObjectNode;

export interface ObjectExplorerModel {
  scope: ObjectExplorerScope;
  effectiveScope: ObjectExplorerScope;
  message?: string;
  roots: ObjectExplorerNode[];
  focusObjectId?: string;
}

const KIND_ORDER: Array<NonNullable<ApiSemanticWorkspaceManifestObject['objectKind']>> = [
  'application',
  'window',
  'userobject',
  'menu',
  'datawindow',
  'function',
  'structure',
  'pipeline',
  'query',
  'unknown',
];

const KIND_LABELS: Record<NonNullable<ApiSemanticWorkspaceManifestObject['objectKind']>, string> = {
  application: 'Application',
  window: 'Window',
  userobject: 'UserObject',
  menu: 'Menu',
  datawindow: 'DataWindow',
  function: 'Function',
  structure: 'Structure',
  pipeline: 'Pipeline',
  query: 'Query',
  unknown: 'Unknown',
};

const UNASSIGNED_PROJECT_KEY = '__unassigned_project__';
const UNASSIGNED_LIBRARY_KEY = '__unassigned_library__';

interface ExplorerSummaryTarget {
  readiness?: string;
  sourceOrigin?: ApiSemanticWorkspaceManifestObject['sourceOrigin'];
}

function basenameFromUri(uri: string | undefined): string {
  if (!uri) {
    return 'Sin dato';
  }

  const normalized = uri.replace(/\/+$/, '');
  const segment = normalized.slice(normalized.lastIndexOf('/') + 1);
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function summarizeReadiness(objects: readonly ExplorerSummaryTarget[]): string {
  if (objects.length === 0) {
    return 'sin objetos';
  }

  const ready = objects.filter((entry) => entry.readiness === 'nearby-semantic-ready').length;
  return `${objects.length} objetos · listos ${ready}/${objects.length}`;
}

function summarizeOrigins(objects: readonly ExplorerSummaryTarget[]): string {
  const counts = new Map<string, number>();
  for (const entry of objects) {
    const key = entry.sourceOrigin ?? 'unknown';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([origin, count]) => `${origin}: ${count}`)
    .join(' · ');
}

function collectObjectNodes(nodes: readonly ObjectExplorerNode[]): ObjectExplorerObjectNode[] {
  const collected: ObjectExplorerObjectNode[] = [];

  for (const node of nodes) {
    if (node.type === 'object') {
      collected.push(node);
      continue;
    }

    if ('children' in node) {
      collected.push(...collectObjectNodes(node.children));
    }
  }

  return collected;
}

function resolveProjectUriForActiveUri(manifest: ApiSemanticWorkspaceManifest, activeUri: string | undefined): string | undefined {
  if (!activeUri) {
    return undefined;
  }

  const fromObject = manifest.objects.find((entry) => entry.uri === activeUri)?.projectUri;
  if (fromObject) {
    return fromObject;
  }

  const normalizedActiveUri = activeUri.toLowerCase();
  const matchedProject = [...manifest.projects]
    .sort((left, right) => right.libraries.length - left.libraries.length)
    .find((project) => project.libraries.some((library) => normalizedActiveUri.startsWith(library.toLowerCase())));

  return matchedProject?.projectUri;
}

function compareObjects(left: ApiSemanticWorkspaceManifestObject, right: ApiSemanticWorkspaceManifestObject): number {
  const leftProject = left.projectUri ?? '';
  const rightProject = right.projectUri ?? '';
  const projectOrder = leftProject.localeCompare(rightProject);
  if (projectOrder !== 0) {
    return projectOrder;
  }

  const leftLibrary = left.library ?? '';
  const rightLibrary = right.library ?? '';
  const libraryOrder = leftLibrary.localeCompare(rightLibrary);
  if (libraryOrder !== 0) {
    return libraryOrder;
  }

  const kindOrder = KIND_ORDER.indexOf(left.objectKind ?? 'unknown') - KIND_ORDER.indexOf(right.objectKind ?? 'unknown');
  if (kindOrder !== 0) {
    return kindOrder;
  }

  return left.name.localeCompare(right.name);
}

export function buildObjectExplorerModel(
  manifest: ApiSemanticWorkspaceManifest,
  requestedScope: ObjectExplorerScope,
  activeUri?: string,
): ObjectExplorerModel {
  const messages: string[] = [];
  let effectiveScope = requestedScope;
  let focusObjectId: string | undefined;
  let filteredObjects = [...manifest.objects];

  if (requestedScope === 'current-file') {
    const currentFileObjects = activeUri ? filteredObjects.filter((entry) => entry.uri === activeUri) : [];
    if (currentFileObjects.length === 0) {
      effectiveScope = 'workspace';
      messages.push('Foco en archivo actual no resuelto; mostrando workspace completo.');
    } else {
      filteredObjects = currentFileObjects;
      focusObjectId = `object:${currentFileObjects[0].uri}`;
    }
  }

  if (requestedScope === 'current-project') {
    const activeProjectUri = resolveProjectUriForActiveUri(manifest, activeUri);
    if (!activeProjectUri) {
      effectiveScope = 'workspace';
      messages.push('Foco en proyecto actual no resuelto; mostrando workspace completo.');
    } else {
      filteredObjects = filteredObjects.filter((entry) => entry.projectUri === activeProjectUri);
      const focusedObject = activeUri ? filteredObjects.find((entry) => entry.uri === activeUri) : undefined;
      if (focusedObject) {
        focusObjectId = `object:${focusedObject.uri}`;
      }
    }
  }

  const projectIndex = new Map(manifest.projects.map((project) => [project.projectUri, project]));
  const sortedObjects = [...filteredObjects].sort(compareObjects);
  const rootNodes: ObjectExplorerNode[] = [];
  const projectNodeIndex = new Map<string, ObjectExplorerProjectNode>();

  for (const object of sortedObjects) {
    const projectKey = object.projectUri ?? UNASSIGNED_PROJECT_KEY;
    const project = object.projectUri ? projectIndex.get(object.projectUri) : undefined;
    let projectNode = projectNodeIndex.get(projectKey);
    if (!projectNode) {
      projectNode = {
        type: 'project',
        id: `project:${projectKey}`,
        label: project?.name ?? 'Sin proyecto',
        description: undefined,
        tooltip: undefined,
        ...(project?.projectUri ? { projectUri: project.projectUri } : {}),
        children: [],
      };
      projectNodeIndex.set(projectKey, projectNode);
      rootNodes.push(projectNode);
    }

    const libraryKey = object.library ?? UNASSIGNED_LIBRARY_KEY;
    let libraryNode = projectNode.children.find((entry): entry is ObjectExplorerLibraryNode => entry.type === 'library' && entry.id === `library:${projectKey}:${libraryKey}`);
    if (!libraryNode) {
      libraryNode = {
        type: 'library',
        id: `library:${projectKey}:${libraryKey}`,
        label: object.library ? basenameFromUri(object.library) : 'Sin librería',
        description: undefined,
        tooltip: undefined,
        ...(object.library ? { library: object.library } : {}),
        children: [],
      };
      projectNode.children.push(libraryNode);
    }

    const objectKind = object.objectKind ?? 'unknown';
    let kindNode = libraryNode.children.find((entry): entry is ObjectExplorerKindNode => entry.type === 'kind' && entry.objectKind === objectKind);
    if (!kindNode) {
      kindNode = {
        type: 'kind',
        id: `kind:${projectKey}:${libraryKey}:${objectKind}`,
        label: KIND_LABELS[objectKind],
        description: undefined,
        tooltip: undefined,
        objectKind,
        children: [],
      };
      libraryNode.children.push(kindNode);
    }

    kindNode.children.push({
      type: 'object',
      id: `object:${object.uri}`,
      label: object.name,
      description: [KIND_LABELS[objectKind], object.readiness, object.sourceOrigin].filter((part): part is string => Boolean(part)).join(' · '),
      tooltip: [
        `Objeto: ${object.name}`,
        `Kind: ${KIND_LABELS[objectKind]}`,
        ...(object.baseType ? [`Base: ${object.baseType}`] : []),
        ...(object.readiness ? [`Readiness: ${object.readiness}`] : []),
        ...(object.sourceOrigin ? [`Source origin: ${object.sourceOrigin}`] : []),
        ...(object.library ? [`Librería: ${basenameFromUri(object.library)}`] : []),
        ...(project?.name ? [`Proyecto: ${project.name}`] : []),
      ].join('\n'),
      uri: object.uri,
      objectKind,
      ...(object.sourceOrigin ? { sourceOrigin: object.sourceOrigin } : {}),
      ...(object.readiness ? { readiness: object.readiness } : {}),
      ...(object.projectUri ? { projectUri: object.projectUri } : {}),
      ...(object.library ? { library: object.library } : {}),
      ...(object.baseType ? { baseType: object.baseType } : {}),
    });
  }

  rootNodes.sort((left, right) => left.label.localeCompare(right.label));

  for (const projectNode of rootNodes) {
    if (projectNode.type !== 'project') {
      continue;
    }

    const projectObjects = collectObjectNodes(projectNode.children);
    projectNode.description = summarizeReadiness(projectObjects);
    projectNode.tooltip = [
      `Proyecto: ${projectNode.label}`,
      ...(projectNode.projectUri ? [`URI: ${projectNode.projectUri}`] : []),
      `Librerías: ${projectNode.children.length}`,
      summarizeReadiness(projectObjects),
      `Origins: ${summarizeOrigins(projectObjects)}`,
    ].join('\n');

    projectNode.children.sort((left, right) => left.label.localeCompare(right.label));

    for (const libraryNode of projectNode.children) {
      if (libraryNode.type !== 'library') {
        continue;
      }

      const libraryObjects = collectObjectNodes(libraryNode.children);
      libraryNode.description = summarizeReadiness(libraryObjects);
      libraryNode.tooltip = [
        `Librería: ${libraryNode.label}`,
        ...(libraryNode.library ? [`URI: ${libraryNode.library}`] : []),
        summarizeReadiness(libraryObjects),
        `Origins: ${summarizeOrigins(libraryObjects)}`,
      ].join('\n');

      libraryNode.children.sort((left, right) => {
        if (left.type !== 'kind' || right.type !== 'kind') {
          return left.label.localeCompare(right.label);
        }
        return KIND_ORDER.indexOf(left.objectKind) - KIND_ORDER.indexOf(right.objectKind);
      });

      for (const kindNode of libraryNode.children) {
        if (kindNode.type !== 'kind') {
          continue;
        }

        const kindObjects = kindNode.children.filter((entry): entry is ObjectExplorerObjectNode => entry.type === 'object');
        kindNode.description = summarizeReadiness(kindObjects);
        kindNode.tooltip = [
          `Kind: ${kindNode.label}`,
          summarizeReadiness(kindObjects),
          `Origins: ${summarizeOrigins(kindObjects)}`,
        ].join('\n');
        kindNode.children.sort((left, right) => left.label.localeCompare(right.label));
      }
    }
  }

  if (manifest.limits.objectsTruncated) {
    messages.push(`Manifest truncado a ${manifest.limits.maxObjects} objetos; usa filtros para reducir alcance.`);
  }

  if (rootNodes.length === 0) {
    messages.push('Sin objetos PowerBuilder indexados todavía.');
  }

  return {
    scope: requestedScope,
    effectiveScope,
    ...(messages.length > 0 ? { message: messages.join(' ') } : {}),
    roots: rootNodes,
    ...(focusObjectId ? { focusObjectId } : {}),
  };
}

export function findObjectExplorerNodeById(
  roots: ObjectExplorerNode[],
  nodeId: string | undefined,
): ObjectExplorerNode | undefined {
  if (!nodeId) {
    return undefined;
  }

  const stack = [...roots];
  while (stack.length > 0) {
    const current = stack.shift();
    if (!current) {
      continue;
    }
    if (current.id === nodeId) {
      return current;
    }
    if ('children' in current && current.children.length > 0) {
      stack.unshift(...current.children);
    }
  }

  return undefined;
}