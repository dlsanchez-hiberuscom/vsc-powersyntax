import {
  type ApiSemanticWorkspaceManifest,
  type ApiSemanticWorkspaceManifestObject,
  type ApiSemanticWorkspaceManifestRequest,
} from '../../shared/publicApi';
import { queryApiSymbols } from './workspaceSymbols';
import type { DiagnosticsSnapshot } from './diagnosticsSnapshot';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { EntityKind } from '../knowledge/types';
import type { WorkspaceState } from '../workspace/workspaceState';

const MANIFEST_SCHEMA_VERSION = '1.0.0';
const DEFAULT_MAX_OBJECTS = 200;
const DEFAULT_MAX_SYMBOLS = 400;
const MAX_OBJECTS = 1000;
const MAX_SYMBOLS = 2000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildSemanticWorkspaceManifest(
  request: ApiSemanticWorkspaceManifestRequest | undefined,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  workspaceState: WorkspaceState,
  diagnosticsSummary: DiagnosticsSnapshot | DiagnosticsSnapshot['documents'][number] | null,
  readiness: { state?: string; detail?: string }
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

  const typeFilter = (entity: { kind: EntityKind; baseTypeName?: string }) => entity.kind === EntityKind.Type;
  const visibleTypes = kb.queryEntities({ kinds: [EntityKind.Type], limit: maxObjects });
  const totalTypes = kb.countEntities((entity) => typeFilter(entity));
  const totalSymbols = kb.countEntities();
  const rootTypes = kb.countEntities((entity) =>
    typeFilter(entity) && (!entity.baseTypeName || entity.baseTypeName.trim() === '')
  );
  const objects: ApiSemanticWorkspaceManifestObject[] = visibleTypes.map((entity) => ({
    name: entity.name,
    uri: entity.uri,
    ...(entity.baseTypeName ? { baseType: entity.baseTypeName } : {}),
    ...(entity.lineage?.sourceOrigin ? { sourceOrigin: entity.lineage.sourceOrigin } : {}),
  }));

  const inheritanceItems = visibleTypes.map((entity) => ({
    name: entity.name,
    ...(entity.baseTypeName ? { baseType: entity.baseTypeName } : {}),
    descendantCount: graph.getDescendants(entity.name).length,
  }));

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
    sourceOriginSummary: workspaceState.getSourceOriginSummary(),
    readiness: {
      ...(readiness.state ? { state: readiness.state } : {}),
      ...(readiness.detail ? { detail: readiness.detail } : {}),
    },
  };
}