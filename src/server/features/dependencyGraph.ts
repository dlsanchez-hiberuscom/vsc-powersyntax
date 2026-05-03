import {
  type ApiPowerBuilderDependencyGraph,
  type ApiPowerBuilderDependencyGraphEdge,
  type ApiPowerBuilderDependencyGraphFocus,
  type ApiPowerBuilderDependencyGraphNode,
  type ApiPowerBuilderDependencyGraphRequest,
} from '../../shared/publicApi';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { buildSymbolKey } from '../knowledge/symbolKey';
import { EntityKind, type Entity } from '../knowledge/types';
import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import type { WorkspaceState } from '../workspace/workspaceState';
import { buildInvocationRiskSummary } from './invocationRiskModel';

const GRAPH_SCHEMA_VERSION = '1.0.0';
const DEFAULT_MAX_DEPENDENCIES = 12;
const DEFAULT_MAX_DEPENDENTS = 12;
const MAX_NEIGHBORS = 48;

const BUILTIN_DEPENDENCIES = new Set([
  'any',
  'blob',
  'boolean',
  'byte',
  'char',
  'date',
  'datetime',
  'decimal',
  'double',
  'function_object',
  'graph',
  'integer',
  'long',
  'longlong',
  'menu',
  'nonvisualobject',
  'pbobject',
  'powerobject',
  'real',
  'string',
  'structure',
  'time',
  'transaction',
  'uinteger',
  'ulong',
  'userobject',
  'window',
]);

type DependencyEvidenceKind = 'base-type' | 'container-name' | 'owner-name' | 'datatype' | 'return-type';

function clamp(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(MAX_NEIGHBORS, Math.max(0, Math.trunc(value)));
}

function normalizeDependencyKey(raw: string | undefined): string | null {
  if (!raw) {
    return null;
  }
  const normalized = raw.trim().replace(/\[\]$/, '').toLowerCase();
  if (!normalized || BUILTIN_DEPENDENCIES.has(normalized)) {
    return null;
  }
  return normalized;
}

function createUnavailableGraph(reason: string): ApiPowerBuilderDependencyGraph {
  return {
    schemaVersion: GRAPH_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    available: false,
    scope: 'immediate-neighborhood',
    reason,
    summary: {
      nodeCount: 0,
      edgeCount: 0,
      dependencyCount: 0,
      dependentCount: 0,
      unresolvedDependencyCount: 0,
      ambiguousDependencyCount: 0,
    },
    nodes: [],
    edges: [],
    mermaidFlowchart: 'flowchart LR\n  unavailable["Dependency graph unavailable"]',
  };
}

function collectDependencyEvidence(snapshot: SemanticDocumentSnapshot): Map<string, Set<DependencyEvidenceKind>> {
  const exportedIds = new Set(snapshot.symbols.map((symbol) => symbol.id));
  const evidence = new Map<string, Set<DependencyEvidenceKind>>();

  const addEvidence = (candidate: string | undefined, kind: DependencyEvidenceKind): void => {
    const dependencyKey = normalizeDependencyKey(candidate);
    if (!dependencyKey || exportedIds.has(dependencyKey)) {
      return;
    }
    const bucket = evidence.get(dependencyKey) ?? new Set<DependencyEvidenceKind>();
    bucket.add(kind);
    evidence.set(dependencyKey, bucket);
  };

  for (const symbol of snapshot.symbols) {
    addEvidence(symbol.baseTypeName, 'base-type');
    addEvidence(symbol.containerName, 'container-name');
    addEvidence(symbol.ownerName, 'owner-name');
    addEvidence(symbol.datatype, 'datatype');
    addEvidence(symbol.returnType, 'return-type');
  }

  return evidence;
}

function buildFocus(request: ApiPowerBuilderDependencyGraphRequest | undefined, kb: KnowledgeBase): Entity | null {
  if (!request?.uri) {
    return null;
  }

  const entities = kb.getEntitiesByUri(request.uri);
  if (entities.length === 0) {
    return null;
  }

  const requestedName = request.objectName?.trim().toLowerCase();
  if (requestedName) {
    return entities.find((entity) => entity.kind === EntityKind.Type && entity.name.toLowerCase() === requestedName) ?? null;
  }

  return entities.find((entity) => entity.kind === EntityKind.Type) ?? null;
}

function buildNodeId(kind: string, value: string): string {
  return `${kind}:${value}`;
}

function createFocusDescriptor(entity: Entity, workspaceState: WorkspaceState): ApiPowerBuilderDependencyGraphFocus {
  const projectContext = workspaceState.getProjectContextForFile(entity.uri);
  const library = workspaceState.resolveLibraryForFile(entity.uri, projectContext?.libraries);
  return {
    objectName: entity.name,
    uri: entity.uri,
    identityKey: buildSymbolKey(entity),
    ...(entity.baseTypeName ? { baseType: entity.baseTypeName } : {}),
    ...(projectContext?.projectUri ? { projectUri: projectContext.projectUri } : {}),
    ...(library ? { library } : {}),
    ...(entity.lineage?.sourceOrigin ? { sourceOrigin: entity.lineage.sourceOrigin } : {}),
  };
}

function createEntityNode(
  entity: Entity,
  workspaceState: WorkspaceState,
  kind: ApiPowerBuilderDependencyGraphNode['kind'],
  resolution: ApiPowerBuilderDependencyGraphNode['resolution'],
  candidateCount?: number,
  evidence?: string[],
): ApiPowerBuilderDependencyGraphNode {
  const projectContext = workspaceState.getProjectContextForFile(entity.uri);
  const library = workspaceState.resolveLibraryForFile(entity.uri, projectContext?.libraries);
  return {
    id: buildNodeId('uri', entity.uri),
    label: entity.name,
    kind,
    resolution,
    identityKey: buildSymbolKey(entity),
    uri: entity.uri,
    ...(projectContext?.projectUri ? { projectUri: projectContext.projectUri } : {}),
    ...(library ? { library } : {}),
    ...(entity.lineage?.sourceOrigin ? { sourceOrigin: entity.lineage.sourceOrigin } : {}),
    ...(typeof candidateCount === 'number' ? { candidateCount } : {}),
    ...(evidence && evidence.length > 0 ? { evidence } : {}),
  };
}

function createDependencyKeyNode(key: string, evidence: string[]): ApiPowerBuilderDependencyGraphNode {
  return {
    id: buildNodeId('dependency', key),
    label: key,
    kind: 'dependency-key',
    resolution: 'unresolved',
    evidence,
  };
}

function createDocumentNode(uri: string, workspaceState: WorkspaceState): ApiPowerBuilderDependencyGraphNode {
  const projectContext = workspaceState.getProjectContextForFile(uri);
  const library = workspaceState.resolveLibraryForFile(uri, projectContext?.libraries);
  return {
    id: buildNodeId('uri', uri),
    label: uri.slice(uri.lastIndexOf('/') + 1),
    kind: 'document',
    resolution: 'resolved',
    uri,
    ...(projectContext?.projectUri ? { projectUri: projectContext.projectUri } : {}),
    ...(library ? { library } : {}),
  };
}

function addNode(target: Map<string, ApiPowerBuilderDependencyGraphNode>, node: ApiPowerBuilderDependencyGraphNode): void {
  if (!target.has(node.id)) {
    target.set(node.id, node);
  }
}

function addEdge(target: ApiPowerBuilderDependencyGraphEdge[], edge: ApiPowerBuilderDependencyGraphEdge): void {
  if (target.some((existing) => existing.sourceId === edge.sourceId && existing.targetId === edge.targetId && existing.relation === edge.relation && existing.reason === edge.reason)) {
    return;
  }
  target.push(edge);
}

function toEvidenceList(evidence: Set<DependencyEvidenceKind>): string[] {
  return [...evidence].sort();
}

function mermaidNodeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

function escapeMermaid(text: string): string {
  return text.replace(/"/g, '\\"');
}

function buildMermaidFlowchart(
  nodes: readonly ApiPowerBuilderDependencyGraphNode[],
  edges: readonly ApiPowerBuilderDependencyGraphEdge[],
): string {
  const lines = ['flowchart LR'];

  if (nodes.length === 0) {
    lines.push('  empty["No dependency data"]');
    return lines.join('\n');
  }

  for (const node of nodes) {
    const description = node.kind === 'dependency-key'
      ? `${node.label}\\n${node.resolution}`
      : node.label;
    lines.push(`  ${mermaidNodeId(node.id)}["${escapeMermaid(description)}"]`);
  }

  for (const edge of edges) {
    lines.push(`  ${mermaidNodeId(edge.sourceId)} -->|${escapeMermaid(edge.relation)}| ${mermaidNodeId(edge.targetId)}`);
  }

  const focusIds = nodes.filter((node) => node.kind === 'focus-object').map((node) => mermaidNodeId(node.id));
  const unresolvedIds = nodes.filter((node) => node.resolution === 'unresolved').map((node) => mermaidNodeId(node.id));
  if (focusIds.length > 0) {
    lines.push('  classDef focus fill:#0b7285,stroke:#0b7285,color:#ffffff;');
    lines.push(`  class ${focusIds.join(',')} focus;`);
  }
  if (unresolvedIds.length > 0) {
    lines.push('  classDef unresolved fill:#fff3bf,stroke:#f08c00,color:#5c3d00;');
    lines.push(`  class ${unresolvedIds.join(',')} unresolved;`);
  }

  return lines.join('\n');
}

export function buildPowerBuilderDependencyGraph(
  request: ApiPowerBuilderDependencyGraphRequest | undefined,
  kb: KnowledgeBase,
  workspaceState: WorkspaceState,
): ApiPowerBuilderDependencyGraph {
  if (!request?.uri) {
    return createUnavailableGraph('Se requiere una URI activa o explícita para construir el grafo.');
  }

  const focusEntity = buildFocus(request, kb);
  if (!focusEntity) {
    return createUnavailableGraph('No se pudo resolver un objeto PowerBuilder foco para la URI solicitada.');
  }

  const snapshot = kb.getDocumentSnapshot(focusEntity.uri);
  if (!snapshot) {
    return createUnavailableGraph('El documento foco no tiene snapshot semántico publicado todavía.');
  }

  const maxDependencies = clamp(request.maxDependencies, DEFAULT_MAX_DEPENDENCIES);
  const maxDependents = clamp(request.maxDependents, DEFAULT_MAX_DEPENDENTS);
  const focus = createFocusDescriptor(focusEntity, workspaceState);
  const nodeIndex = new Map<string, ApiPowerBuilderDependencyGraphNode>();
  const edges: ApiPowerBuilderDependencyGraphEdge[] = [];
  const focusNode = createEntityNode(focusEntity, workspaceState, 'focus-object', 'resolved');
  addNode(nodeIndex, focusNode);

  const dependencyEvidence = collectDependencyEvidence(snapshot);
  const dependencyKeys = [...dependencyEvidence.keys()].sort().slice(0, maxDependencies);
  let unresolvedDependencyCount = 0;
  let ambiguousDependencyCount = 0;

  for (const dependencyKey of dependencyKeys) {
    const evidenceKinds = dependencyEvidence.get(dependencyKey);
    if (!evidenceKinds) {
      continue;
    }
    const evidence = toEvidenceList(evidenceKinds);
    const definitions = kb.findAllDefinitions(dependencyKey);
    const resolvedEntity = definitions.find((entity) => entity.kind === EntityKind.Type) ?? definitions[0];
    const node = resolvedEntity
      ? createEntityNode(
          resolvedEntity,
          workspaceState,
          'workspace-object',
          definitions.length > 1 ? 'ambiguous' : 'resolved',
          definitions.length,
          evidence,
        )
      : createDependencyKeyNode(dependencyKey, evidence);
    addNode(nodeIndex, node);

    if (node.resolution === 'unresolved') {
      unresolvedDependencyCount++;
    }
    if (node.resolution === 'ambiguous') {
      ambiguousDependencyCount++;
    }

    if (evidenceKinds.has('base-type')) {
      addEdge(edges, {
        sourceId: focusNode.id,
        targetId: node.id,
        relation: 'inherits',
        reason: 'base-type',
        resolved: node.resolution !== 'unresolved',
      });
    }

    const nonInheritanceEvidence = evidence.filter((entry) => entry !== 'base-type');
    if (nonInheritanceEvidence.length > 0) {
      addEdge(edges, {
        sourceId: focusNode.id,
        targetId: node.id,
        relation: 'depends-on',
        reason: nonInheritanceEvidence.join(','),
        resolved: node.resolution !== 'unresolved',
      });
    }
  }

  const dependentUris = kb.getDependentDocumentsForUri(focusEntity.uri).slice(0, maxDependents);
  for (const dependentUri of dependentUris) {
    const dependentEntity = kb.getEntitiesByUri(dependentUri).find((entity) => entity.kind === EntityKind.Type);
    const node = dependentEntity
      ? createEntityNode(dependentEntity, workspaceState, 'dependent-object', 'resolved')
      : createDocumentNode(dependentUri, workspaceState);
    addNode(nodeIndex, node);
    addEdge(edges, {
      sourceId: focusNode.id,
      targetId: node.id,
      relation: 'used-by',
      reason: 'reverse-dependency-index',
      resolved: true,
    });
  }

  const nodes = [...nodeIndex.values()];
  const mermaidFlowchart = buildMermaidFlowchart(nodes, edges);
  const riskSummary = buildInvocationRiskSummary({
    sourceOrigin: focusEntity.lineage?.sourceOrigin,
    evidenceKinds: unresolvedDependencyCount > 0 || ambiguousDependencyCount > 0 ? ['fallback-ambiguity'] : [],
  });

  return {
    schemaVersion: GRAPH_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    available: true,
    scope: 'immediate-neighborhood',
    focus,
    summary: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      dependencyCount: dependencyKeys.length,
      dependentCount: dependentUris.length,
      unresolvedDependencyCount,
      ambiguousDependencyCount,
      invocationRisk: riskSummary.risk,
      riskReasons: riskSummary.reasons,
    },
    nodes,
    edges,
    mermaidFlowchart,
  };
}