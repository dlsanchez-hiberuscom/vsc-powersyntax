import {
  type ApiSemanticWorkspaceManifest,
  type ApiSemanticWorkspaceManifestObject,
  type ApiSemanticWorkspaceManifestRequest,
} from '../../shared/publicApi';
import { queryApiSymbols } from './workspaceSymbols';
import type { DiagnosticsSnapshot } from './diagnosticsSnapshot';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { listPowerBuilderFrameworkKnowledgePacks } from '../knowledge/system/frameworkKnowledgePacks';
import { EntityKind } from '../knowledge/types';
import type { WorkspaceState } from '../workspace/workspaceState';

const MANIFEST_SCHEMA_VERSION = '1.0.0';
const DEFAULT_MAX_OBJECTS = 200;
const DEFAULT_MAX_SYMBOLS = 400;
const MAX_OBJECTS = 1000;
const MAX_SYMBOLS = 2000;

function inferObjectKindFromUri(uri: string): ApiSemanticWorkspaceManifestObject['objectKind'] {
  const normalizedUri = uri.toLowerCase();
  if (normalizedUri.endsWith('.sra')) return 'application';
  if (normalizedUri.endsWith('.srw')) return 'window';
  if (normalizedUri.endsWith('.sru')) return 'userobject';
  if (normalizedUri.endsWith('.srm')) return 'menu';
  if (normalizedUri.endsWith('.srd')) return 'datawindow';
  if (normalizedUri.endsWith('.srf')) return 'function';
  if (normalizedUri.endsWith('.srs')) return 'structure';
  if (normalizedUri.endsWith('.srp')) return 'pipeline';
  if (normalizedUri.endsWith('.srq')) return 'query';
  return 'unknown';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildSemanticWorkspaceManifest(
  request: ApiSemanticWorkspaceManifestRequest | undefined,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  workspaceState: WorkspaceState,
  diagnosticsSummary: DiagnosticsSnapshot | DiagnosticsSnapshot['documents'][number] | null,
  readiness: { state?: string; detail?: string },
  systemCatalog: SystemCatalog = new SystemCatalog(),
): ApiSemanticWorkspaceManifest {
  const maxObjects = clamp(
    typeof request?.maxObjects === 'number' ? Math.trunc(request.maxObjects) : DEFAULT_MAX_OBJECTS,
    1,
    MAX_OBJECTS
  );
  const maxSymbols = clamp(
    typeof request?.maxSymbols === 'number' ? Math.trunc(request.maxSymbols) : DEFAULT_MAX_SYMBOLS,
    1,
    MAX_SYMBOLS
  );

  const projectModel = workspaceState.getProjectModel();
  const projects = (projectModel?.getProjects() ?? []).map((project) => ({
    projectUri: project.projectUri,
    kind: project.kind,
    name: project.name,
    libraries: [...project.libraries],
    fileCount: projectModel?.getFilesForProject(project.projectUri).length ?? 0,
  }));
  const libraries = [...new Set(projects.flatMap((project) => project.libraries))].sort();

  const visibleTypes = kb.queryEntities({ kinds: [EntityKind.Type], limit: maxObjects });
  const totalTypes = kb.countEntities({ kinds: [EntityKind.Type] });
  const totalSymbols = kb.countEntities();
  const rootTypes = kb.countEntities({
    kinds: [EntityKind.Type],
    include: (entity) => !entity.baseTypeName || entity.baseTypeName.trim() === ''
  });
  const objects: ApiSemanticWorkspaceManifestObject[] = visibleTypes.map((entity) => {
    const projectContext = workspaceState.getProjectContextForFile(entity.uri);
    const snapshot = kb.getDocumentSnapshot(entity.uri);
    const library = workspaceState.resolveLibraryForFile(entity.uri, projectContext?.libraries);

    return {
      name: entity.name,
      uri: entity.uri,
      ...(entity.baseTypeName ? { baseType: entity.baseTypeName } : {}),
      ...(projectContext?.projectUri ? { projectUri: projectContext.projectUri } : {}),
      ...(library ? { library } : {}),
      objectKind: inferObjectKindFromUri(entity.uri),
      ...(snapshot?.readiness ? { readiness: snapshot.readiness } : {}),
      ...(entity.lineage?.sourceOrigin ? { sourceOrigin: entity.lineage.sourceOrigin } : {}),
    };
  });

  const inheritanceItems = visibleTypes.map((entity) => ({
    name: entity.name,
    ...(entity.baseTypeName ? { baseType: entity.baseTypeName } : {}),
    descendantCount: graph.getDescendants(entity.name).length,
  }));
  const knowledgePacks = listPowerBuilderFrameworkKnowledgePacks(systemCatalog);

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    generatedAt: Date.now(),
    limits: {
      maxObjects,
      maxSymbols,
      objectsTruncated: totalTypes > maxObjects,
      symbolsTruncated: totalSymbols > maxSymbols,
    },
    projects,
    libraries,
    objects,
    inheritanceSummary: {
      totalTypes,
      roots: rootTypes,
      items: inheritanceItems,
    },
    exportedSymbols: queryApiSymbols('', kb, maxSymbols),
    diagnosticsSummary: diagnosticsSummary && 'documents' in diagnosticsSummary ? diagnosticsSummary : null,
    knowledgePacks: {
      total: knowledgePacks.length,
      items: knowledgePacks,
    },
    sourceOriginSummary: workspaceState.getSourceOriginSummary(),
    readiness: {
      ...(readiness.state ? { state: readiness.state } : {}),
      ...(readiness.detail ? { detail: readiness.detail } : {}),
    },
  };
}