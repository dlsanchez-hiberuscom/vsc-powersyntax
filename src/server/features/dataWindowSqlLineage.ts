import {
  type ApiDataWindowSqlLineage,
  type ApiDataWindowSqlLineageNode,
  type ApiDataWindowSqlLineageReference,
  type ApiDataWindowSqlLineageRequest,
} from '../../shared/publicApi';
import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import {
  collectDataObjectBindings,
  resolveDataWindowDefinitionTargets,
  type DataWindowBindingSummary,
} from './dataWindowBindingModel';
import {
  buildDataWindowModelFromSnapshot,
  inferDataWindowObjectName,
} from './dataWindowModel';

const LINEAGE_SCHEMA_VERSION = '1.0.0';
const DEFAULT_MAX_DEPTH = 4;
const MAX_MAX_DEPTH = 8;

interface LineageSource {
  kind: ApiDataWindowSqlLineage['source']['kind'];
  uri?: string;
  line?: number;
  targetName?: string;
  dataObject?: string | null;
  state?: ApiDataWindowSqlLineageNode['state'];
  targetUri?: string;
}

function clampMaxDepth(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_MAX_DEPTH;
  }
  return Math.min(MAX_MAX_DEPTH, Math.max(0, Math.trunc(value)));
}

function createUnavailableLineage(reason: string, source: ApiDataWindowSqlLineage['source'] = { kind: 'dataobject-name' }): ApiDataWindowSqlLineage {
  return {
    schemaVersion: LINEAGE_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    available: false,
    reason,
    source,
    summary: {
      totalNodes: 0,
      totalStatements: 0,
      totalSqlReferences: 0,
      unresolvedLinks: 0,
      maxDepthReached: false,
    },
  };
}

function toSqlReferences(snapshotReferences: ReadonlyArray<{ rawText: string; columnName: string; qualifiedTableName?: string }>): ApiDataWindowSqlLineageReference[] {
  return snapshotReferences.map((reference) => ({
    rawText: reference.rawText,
    columnName: reference.columnName,
    ...(reference.qualifiedTableName ? { qualifiedTableName: reference.qualifiedTableName } : {}),
  }));
}

function resolveSourceFromScript(snapshot: SemanticDocumentSnapshot, kb: KnowledgeBase, line: number | undefined, uri: string): LineageSource | null {
  const effectiveLine = typeof line === 'number'
    ? Math.max(0, Math.min(snapshot.maskedText.lines.length - 1, Math.trunc(line)))
    : snapshot.maskedText.lines.length - 1;
  const bindings = collectDataObjectBindings(snapshot, kb, 0, effectiveLine);
  const binding = bindings.length > 0 ? bindings[bindings.length - 1] : undefined;
  if (!binding) {
    return null;
  }

  return {
    kind: 'script-binding',
    uri,
    line: binding.line,
    targetName: binding.targetName,
    ...(binding.dataObject !== undefined ? { dataObject: binding.dataObject } : {}),
    state: binding.state,
    ...(binding.targetUri ? { targetUri: binding.targetUri } : {}),
  };
}

function resolveLineageSource(request: ApiDataWindowSqlLineageRequest | undefined, kb: KnowledgeBase): LineageSource | null {
  if (request?.dataObjectName) {
    const targets = resolveDataWindowDefinitionTargets(request.dataObjectName, kb);
    return {
      kind: 'dataobject-name',
      dataObject: request.dataObjectName,
      state: targets.length === 0 ? 'missing' : targets.length === 1 ? 'resolved' : 'ambiguous',
      ...(targets.length === 1 ? { targetUri: targets[0].uri } : {}),
    };
  }

  if (!request?.uri) {
    return null;
  }

  if (request.uri.toLowerCase().endsWith('.srd')) {
    const objectName = inferDataWindowObjectName(request.uri);
    if (!objectName) {
      return null;
    }
    return {
      kind: 'datawindow-document',
      uri: request.uri,
      dataObject: objectName,
      state: 'resolved',
      targetUri: request.uri,
    };
  }

  const snapshot = kb.getDocumentSnapshot(request.uri);
  if (!snapshot) {
    return null;
  }

  return resolveSourceFromScript(snapshot, kb, request.line, request.uri);
}

function buildNodeId(path: readonly string[]): string {
  return path.join('>');
}

function toUnresolvedNode(
  dataObject: string,
  relation: ApiDataWindowSqlLineageNode['relation'],
  state: ApiDataWindowSqlLineageNode['state'],
  path: string[],
  via?: string,
): ApiDataWindowSqlLineageNode {
  return {
    id: buildNodeId(path),
    dataObject,
    relation,
    state,
    ...(via ? { via } : {}),
    path,
    sqlReferences: [],
    children: [],
  };
}

function buildLineageNode(
  dataObject: string,
  uri: string,
  relation: ApiDataWindowSqlLineageNode['relation'],
  path: string[],
  kb: KnowledgeBase,
  maxDepth: number,
  depth: number,
  seenUris: Set<string>,
  flags: { maxDepthReached: boolean },
  via?: string,
): ApiDataWindowSqlLineageNode {
  const snapshot = kb.getDocumentSnapshot(uri);
  const model = buildDataWindowModelFromSnapshot(snapshot);
  const node: ApiDataWindowSqlLineageNode = {
    id: buildNodeId(path),
    dataObject,
    relation,
    state: 'resolved',
    uri,
    ...(via ? { via } : {}),
    path,
    ...(model?.retrieve?.statement ? { statement: model.retrieve.statement } : {}),
    sqlReferences: model ? toSqlReferences(model.sqlReferences) : [],
    children: [],
  };

  if (!model) {
    return node;
  }

  if (depth >= maxDepth) {
    if (model.reports.length > 0 || model.tableColumns.some((column) => Boolean(column.dddwName))) {
      flags.maxDepthReached = true;
    }
    return node;
  }

  const nextSeen = new Set(seenUris);
  nextSeen.add(uri.toLowerCase());

  for (const report of model.reports) {
    if (!report.dataObject) {
      continue;
    }
    const childPath = [...path, `report:${report.name}`];
    const targets = resolveDataWindowDefinitionTargets(report.dataObject, kb);
    if (targets.length !== 1) {
      node.children.push(toUnresolvedNode(report.dataObject, 'report-child', targets.length === 0 ? 'missing' : 'ambiguous', childPath, report.name));
      continue;
    }
    const childUri = targets[0].uri;
    if (nextSeen.has(childUri.toLowerCase())) {
      node.children.push({
        id: buildNodeId(childPath),
        dataObject: report.dataObject,
        relation: 'report-child',
        state: 'resolved',
        uri: childUri,
        via: report.name,
        path: childPath,
        sqlReferences: [],
        children: [],
      });
      continue;
    }
    node.children.push(buildLineageNode(report.dataObject, childUri, 'report-child', childPath, kb, maxDepth, depth + 1, nextSeen, flags, report.name));
  }

  for (const column of model.tableColumns) {
    if (!column.dddwName) {
      continue;
    }
    const childPath = [...path, `dropdown:${column.name}`];
    const targets = resolveDataWindowDefinitionTargets(column.dddwName, kb);
    if (targets.length !== 1) {
      node.children.push(toUnresolvedNode(column.dddwName, 'dropdown-child', targets.length === 0 ? 'missing' : 'ambiguous', childPath, column.name));
      continue;
    }
    const childUri = targets[0].uri;
    if (nextSeen.has(childUri.toLowerCase())) {
      node.children.push({
        id: buildNodeId(childPath),
        dataObject: column.dddwName,
        relation: 'dropdown-child',
        state: 'resolved',
        uri: childUri,
        via: column.name,
        path: childPath,
        sqlReferences: [],
        children: [],
      });
      continue;
    }
    node.children.push(buildLineageNode(column.dddwName, childUri, 'dropdown-child', childPath, kb, maxDepth, depth + 1, nextSeen, flags, column.name));
  }

  return node;
}

function summarizeLineage(node: ApiDataWindowSqlLineageNode | undefined): ApiDataWindowSqlLineage['summary'] {
  if (!node) {
    return {
      totalNodes: 0,
      totalStatements: 0,
      totalSqlReferences: 0,
      unresolvedLinks: 0,
      maxDepthReached: false,
    };
  }

  let totalNodes = 0;
  let totalStatements = 0;
  let totalSqlReferences = 0;
  let unresolvedLinks = 0;

  const visit = (current: ApiDataWindowSqlLineageNode): void => {
    totalNodes++;
    if (current.statement) {
      totalStatements++;
    }
    totalSqlReferences += current.sqlReferences.length;
    if (current.state !== 'resolved') {
      unresolvedLinks++;
    }
    for (const child of current.children) {
      visit(child);
    }
  };

  visit(node);
  return {
    totalNodes,
    totalStatements,
    totalSqlReferences,
    unresolvedLinks,
    maxDepthReached: false,
  };
}

export function buildDataWindowSqlLineage(
  request: ApiDataWindowSqlLineageRequest | undefined,
  kb: KnowledgeBase,
): ApiDataWindowSqlLineage {
  const source = resolveLineageSource(request, kb);
  if (!source) {
    return createUnavailableLineage('No se pudo resolver un DataWindow raíz desde la petición actual.');
  }

  if (!source.dataObject) {
    return createUnavailableLineage('No hay un DataObject literal resoluble para construir el lineage SQL.', source);
  }

  if (source.state !== 'resolved' || !source.targetUri) {
    return createUnavailableLineage(`El DataObject raíz no quedó resuelto de forma única (${source.state ?? 'sin estado'}).`, source);
  }

  const maxDepth = clampMaxDepth(request?.maxDepth);
  const flags = { maxDepthReached: false };
  const lineage = buildLineageNode(
    source.dataObject,
    source.targetUri,
    'root',
    [source.dataObject],
    kb,
    maxDepth,
    0,
    new Set<string>(),
    flags,
  );
  const summary = summarizeLineage(lineage);

  return {
    schemaVersion: LINEAGE_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    available: true,
    source,
    summary: {
      ...summary,
      maxDepthReached: flags.maxDepthReached,
    },
    lineage,
  };
}