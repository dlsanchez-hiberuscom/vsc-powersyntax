import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { getDocumentAnalysis } from '../analysis/analysisCache';
import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import type { HotContextCache } from '../knowledge/HotContextCache';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import type { PbSystemSymbolEntry } from '../knowledge/system/types';
import type { ActiveDocumentServingSnapshot } from '../serving/activeDocumentServingSnapshot';
import type { SourceOrigin } from '../../shared/sourceOrigin';
import {
  collectDataObjectBindings,
  DATAWINDOW_BIND_OWNER_TYPES,
  resolveCatalogOwnerTypes,
  resolveDataWindowDefinitionTargets,
  type DataWindowBindingSummary,
} from './dataWindowBindingModel';
import {
  buildDataWindowModel,
  buildDataWindowModelFromSnapshot,
  type DataWindowModel,
  type DataWindowExpressionDependency,
  type DataWindowExpressionNode,
  type DataWindowRetrieveArgument,
  type DataWindowTableColumnNode,
} from './dataWindowModel';
import { listKnownSafeDataWindowPropertyPaths } from './dataWindowPropertyPaths';
import { resolveDocumentQualifierType } from './queryContext';

export type DataWindowReceiverKind = 'datawindow-control' | 'datastore' | 'datawindowchild' | 'datawindow-source' | 'unknown';
export type DataWindowBindingConfidence = 'high' | 'medium' | 'low' | 'unknown';
export type DataWindowBindingSource = 'dataobject-literal' | 'simple-assignment' | 'getchild-output' | 'source-datawindow' | 'dynamic-string' | 'unknown';

export type DataWindowBindingReasonCode =
  | 'datawindow-source-srd'
  | 'dataobject-literal-resolved'
  | 'dataobject-literal-ambiguous'
  | 'dataobject-target-missing'
  | 'dataobject-empty-literal'
  | 'dataobject-dynamic-expression'
  | 'getchild-output-parameter'
  | 'getchild-target-missing'
  | 'receiver-not-datawindow'
  | 'receiver-type-unknown'
  | 'no-dataobject-binding';

export interface DataWindowFastColumnView {
  name: string;
  type?: string;
  dbName?: string;
  sourceOrigin: 'datawindow-model';
}

export interface DataWindowFastBufferView {
  name: string;
  source: 'system-catalog';
  enumType: 'DWBuffer';
}

export interface DataWindowFastComputedFieldDependencyView {
  name: string;
  kind: DataWindowExpressionDependency['kind'];
  sourceOrigin: 'datawindow-model';
}

export interface DataWindowFastComputedFieldView {
  name: string;
  controlType: 'compute';
  propertyName: string;
  expressionText: string;
  staticValue?: string;
  dependencies: DataWindowFastComputedFieldDependencyView[];
  sourceOrigin: 'datawindow-model';
}

export interface DataWindowFastBindingView {
  targetName?: string;
  receiverKind: DataWindowReceiverKind;
  state: DataWindowBindingSummary['state'] | 'unknown';
  source: DataWindowBindingSource;
  confidence: DataWindowBindingConfidence;
  reasonCodes: DataWindowBindingReasonCode[];
  dataObject?: string | null;
  targetUri?: string;
  retrieveArguments: DataWindowRetrieveArgument[];
  dynamic: boolean;
}

export interface DataWindowFastContext {
  uri: string;
  documentVersion: number;
  kbVersion: number;
  documentFingerprint: number | string;
  sourceOrigin: SourceOrigin | 'unknown';
  cacheKey: string;
  receiverName?: string;
  receiverType?: string;
  receiverKind: DataWindowReceiverKind;
  ownerTypes: string[];
  binding: DataWindowFastBindingView;
  dataObjectName?: string;
  columns: DataWindowFastColumnView[];
  computedFields: DataWindowFastComputedFieldView[];
  propertyPaths: string[];
  buffers: DataWindowFastBufferView[];
  builtIns: readonly PbSystemSymbolEntry[];
  sqlLineage: {
    state: 'available-evidence' | 'not-computed-hot-path' | 'unknown';
    reason: string;
  };
}

export interface CreateDataWindowFastContextOptions {
  document: TextDocument;
  position: Position;
  kb: KnowledgeBase;
  graph: InheritanceGraph;
  systemCatalog: SystemCatalog;
  receiverName?: string;
  receiverType?: string;
  sourceOrigin?: SourceOrigin | 'unknown';
  hotContext?: HotContextCache;
  activeSnapshot?: ActiveDocumentServingSnapshot;
}

interface GetChildBindingCandidate {
  targetName: string;
  parentName: string;
  childName: string;
  dataObject?: string;
  state: DataWindowBindingSummary['state'];
  targetUri?: string;
  line: number;
}

const GETCHILD_CALL_REGEX = /\b([A-Za-z_][\w$#%\-]*)\s*\.\s*GetChild\s*\(\s*(["'])(.*?)\2\s*,\s*([A-Za-z_][\w$#%\-]*)/gi;

export function createDataWindowFastContext(options: CreateDataWindowFastContextOptions): DataWindowFastContext {
  const sourceOrigin = options.sourceOrigin ?? options.activeSnapshot?.sourceOrigin ?? 'unknown';
  const isDataWindowSource = options.document.uri.toLowerCase().endsWith('.srd');
  const receiverType = options.receiverType
    ?? (options.receiverName
      ? resolveDocumentQualifierType(options.document, options.receiverName, options.position, options.kb, options.hotContext)
      : undefined);
  const ownerTypes = isDataWindowSource ? ['datawindow'] : resolveCatalogOwnerTypes(receiverType, options.graph);
  const provisionalReceiverKind = isDataWindowSource
    ? 'datawindow-source'
    : classifyDataWindowReceiver(ownerTypes, receiverType);

  const binding = isDataWindowSource
    ? buildSourceDataWindowBinding(options.document, provisionalReceiverKind)
    : buildScriptDataWindowBinding(options, provisionalReceiverKind);
  const receiverKind = provisionalReceiverKind === 'unknown' && binding.receiverKind !== 'unknown'
    ? binding.receiverKind
    : provisionalReceiverKind;
  const effectiveOwnerTypes = ownerTypes.length > 0 ? ownerTypes : fallbackOwnerTypesForReceiverKind(receiverKind);
  const dataObjectName = typeof binding.dataObject === 'string' && binding.dataObject.length > 0
    ? binding.dataObject
    : isDataWindowSource
      ? inferDataObjectNameFromSourceUri(options.document.uri)
      : undefined;
  const model = resolveDataWindowModelForFastContext(options.document, options.kb, dataObjectName, isDataWindowSource, binding.targetUri);
  const columns = binding.confidence === 'high' || binding.confidence === 'medium' || isDataWindowSource
    ? toFastColumns(model?.tableColumns ?? [])
    : [];
  const computedFields = binding.confidence === 'high' || binding.confidence === 'medium' || isDataWindowSource
    ? toFastComputedFields(model?.expressions ?? [])
    : [];
  const propertyPaths = binding.confidence === 'unknown' && !isDataWindowSource
    ? []
    : listKnownSafeDataWindowPropertyPaths();
  const buffers = listOfficialDwBuffers(options.systemCatalog);
  const builtIns = receiverKind === 'unknown'
    ? []
    : listMembersForOwner(options.systemCatalog, effectiveOwnerTypes).filter((entry) => entry.domain === 'datawindow-functions');

  const context: Omit<DataWindowFastContext, 'cacheKey'> = {
    uri: options.document.uri,
    documentVersion: options.document.version,
    kbVersion: options.kb.version,
    documentFingerprint: options.activeSnapshot?.documentFingerprint ?? options.kb.semanticEpoch,
    sourceOrigin,
    ...(options.receiverName ? { receiverName: options.receiverName } : {}),
    ...(receiverType ? { receiverType } : {}),
    receiverKind,
    ownerTypes: effectiveOwnerTypes,
    binding,
    ...(dataObjectName ? { dataObjectName } : {}),
    columns,
    computedFields,
    propertyPaths,
    buffers,
    builtIns,
    sqlLineage: {
      state: model?.retrieve || model?.sqlReferences.length ? 'available-evidence' : 'not-computed-hot-path',
      reason: model?.retrieve || model?.sqlReferences.length
        ? 'datawindow-model-already-available'
        : 'sql-lineage-deep-computation-skipped',
    },
  };

  return {
    ...context,
    cacheKey: buildDataWindowFastContextCacheKey(context),
  };
}

export function isConfidentDataWindowBinding(binding: DataWindowFastBindingView): boolean {
  return binding.confidence === 'high' || binding.confidence === 'medium';
}

function classifyDataWindowReceiver(ownerTypes: readonly string[], receiverType?: string): DataWindowReceiverKind {
  if (ownerTypes.includes('datastore')) {
    return 'datastore';
  }
  if (ownerTypes.includes('datawindowchild')) {
    return 'datawindowchild';
  }
  if (ownerTypes.includes('datawindow')) {
    return 'datawindow-control';
  }
  return receiverType ? 'unknown' : 'unknown';
}

function fallbackOwnerTypesForReceiverKind(receiverKind: DataWindowReceiverKind): string[] {
  switch (receiverKind) {
    case 'datastore':
      return ['datastore'];
    case 'datawindowchild':
      return ['datawindowchild'];
    case 'datawindow-control':
    case 'datawindow-source':
      return ['datawindow'];
    default:
      return [];
  }
}

function buildSourceDataWindowBinding(document: TextDocument, receiverKind: DataWindowReceiverKind): DataWindowFastBindingView {
  return {
    receiverKind,
    state: 'resolved',
    source: 'source-datawindow',
    confidence: 'high',
    reasonCodes: ['datawindow-source-srd'],
    dataObject: inferDataObjectNameFromSourceUri(document.uri),
    retrieveArguments: buildDataWindowModel(document)?.retrieveArguments ?? [],
    dynamic: false,
  };
}

function buildScriptDataWindowBinding(
  options: CreateDataWindowFastContextOptions,
  receiverKind: DataWindowReceiverKind,
): DataWindowFastBindingView {
  if (!options.receiverName) {
    return {
      receiverKind,
      state: 'unknown',
      source: 'unknown',
      confidence: 'unknown',
      reasonCodes: ['no-dataobject-binding'],
      retrieveArguments: [],
      dynamic: false,
    };
  }

  const snapshot = getHotSemanticSnapshot(options);
  const directBinding = snapshot
    ? findNearestBindingForReceiver(snapshot, options.kb, options.receiverName, options.position.line)
    : undefined;
  if (directBinding) {
    return fromBindingSummary(directBinding, receiverKind === 'unknown' ? 'datawindow-control' : receiverKind);
  }

  const childBinding = receiverKind === 'datawindowchild' && snapshot
    ? findNearestGetChildBinding(snapshot, options.kb, options.receiverName, options.position.line)
    : undefined;
  if (childBinding) {
    return fromGetChildBinding(childBinding, receiverKind);
  }

  return {
    targetName: options.receiverName,
    receiverKind,
    state: 'unknown',
    source: 'unknown',
    confidence: 'unknown',
    reasonCodes: ['no-dataobject-binding'],
    retrieveArguments: [],
    dynamic: false,
  };
}

function getHotSemanticSnapshot(options: CreateDataWindowFastContextOptions): SemanticDocumentSnapshot | null {
  if (options.activeSnapshot?.hasSemanticSnapshot()) {
    return options.kb.getDocumentSnapshot(options.document.uri) ?? getDocumentAnalysis(options.document).snapshot;
  }
  return getDocumentAnalysis(options.document).snapshot;
}

function findNearestBindingForReceiver(
  snapshot: SemanticDocumentSnapshot,
  kb: KnowledgeBase,
  receiverName: string,
  line: number,
): DataWindowBindingSummary | undefined {
  const normalizedReceiver = receiverName.toLowerCase();
  const bindings = collectDataObjectBindings(snapshot, kb, 0, line);
  for (let index = bindings.length - 1; index >= 0; index--) {
    const binding = bindings[index];
    if (binding.targetName.toLowerCase() === normalizedReceiver && binding.line <= line) {
      return binding;
    }
  }
  return undefined;
}

function fromBindingSummary(binding: DataWindowBindingSummary, receiverKind: DataWindowReceiverKind): DataWindowFastBindingView {
  if (binding.state === 'resolved') {
    return {
      targetName: binding.targetName,
      receiverKind,
      state: binding.state,
      source: 'simple-assignment',
      confidence: 'high',
      reasonCodes: ['dataobject-literal-resolved'],
      ...(binding.dataObject !== undefined ? { dataObject: binding.dataObject } : {}),
      ...(binding.targetUri ? { targetUri: binding.targetUri } : {}),
      retrieveArguments: [...binding.retrieveArguments],
      dynamic: false,
    };
  }

  if (binding.state === 'ambiguous') {
    return {
      targetName: binding.targetName,
      receiverKind,
      state: binding.state,
      source: 'dataobject-literal',
      confidence: 'medium',
      reasonCodes: ['dataobject-literal-ambiguous'],
      ...(binding.dataObject !== undefined ? { dataObject: binding.dataObject } : {}),
      retrieveArguments: [],
      dynamic: false,
    };
  }

  if (binding.state === 'dynamic') {
    return {
      targetName: binding.targetName,
      receiverKind,
      state: binding.state,
      source: 'dynamic-string',
      confidence: 'low',
      reasonCodes: ['dataobject-dynamic-expression'],
      retrieveArguments: [],
      dynamic: true,
    };
  }

  return {
    targetName: binding.targetName,
    receiverKind,
    state: binding.state,
    source: 'dataobject-literal',
    confidence: 'low',
    reasonCodes: [binding.dataObject === null ? 'dataobject-empty-literal' : 'dataobject-target-missing'],
    ...(binding.dataObject !== undefined ? { dataObject: binding.dataObject } : {}),
    retrieveArguments: [],
    dynamic: false,
  };
}

function findNearestGetChildBinding(
  snapshot: SemanticDocumentSnapshot,
  kb: KnowledgeBase,
  receiverName: string,
  line: number,
): GetChildBindingCandidate | undefined {
  const normalizedReceiver = receiverName.toLowerCase();
  const statements = snapshot.logicalStatements.filter((statement) => statement.endLine <= line);
  for (let index = statements.length - 1; index >= 0; index--) {
    const statement = statements[index];
    GETCHILD_CALL_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = GETCHILD_CALL_REGEX.exec(statement.text)) !== null) {
      const parentName = match[1];
      const childName = match[3];
      const targetName = match[4];
      if (targetName.toLowerCase() !== normalizedReceiver) {
        continue;
      }

      const parentBinding = findNearestBindingForReceiver(snapshot, kb, parentName, statement.startLine);
      if (!parentBinding || parentBinding.state !== 'resolved' || !parentBinding.dataObject || !parentBinding.targetUri) {
        return {
          targetName,
          parentName,
          childName,
          state: 'dynamic',
          line: statement.startLine,
        };
      }

      const parentModel = buildDataWindowModelFromSnapshot(kb.getDocumentSnapshot(parentBinding.targetUri));
      const childDataObject = parentModel?.tableColumns.find((column) => column.name.toLowerCase() === childName.toLowerCase())?.dddwName
        ?? parentModel?.reports.find((report) => report.name.toLowerCase() === childName.toLowerCase())?.dataObject;
      if (!childDataObject) {
        return {
          targetName,
          parentName,
          childName,
          state: 'missing',
          line: statement.startLine,
        };
      }

      const targets = resolveDataWindowDefinitionTargets(childDataObject, kb);
      return {
        targetName,
        parentName,
        childName,
        dataObject: childDataObject,
        state: targets.length === 0 ? 'missing' : targets.length === 1 ? 'resolved' : 'ambiguous',
        ...(targets.length === 1 ? { targetUri: targets[0].uri } : {}),
        line: statement.startLine,
      };
    }
  }
  return undefined;
}

function fromGetChildBinding(binding: GetChildBindingCandidate, receiverKind: DataWindowReceiverKind): DataWindowFastBindingView {
  const confidence: DataWindowBindingConfidence = binding.state === 'resolved' || binding.state === 'ambiguous' ? 'medium' : 'low';
  return {
    targetName: binding.targetName,
    receiverKind,
    state: binding.state,
    source: 'getchild-output',
    confidence,
    reasonCodes: [binding.dataObject ? 'getchild-output-parameter' : 'getchild-target-missing'],
    ...(binding.dataObject ? { dataObject: binding.dataObject } : {}),
    ...(binding.targetUri ? { targetUri: binding.targetUri } : {}),
    retrieveArguments: [],
    dynamic: binding.state === 'dynamic',
  };
}

function resolveDataWindowModelForFastContext(
  document: TextDocument,
  kb: KnowledgeBase,
  dataObjectName: string | undefined,
  isDataWindowSource: boolean,
  targetUri?: string,
): DataWindowModel | null {
  if (isDataWindowSource) {
    return buildDataWindowModel(document);
  }
  if (targetUri) {
    return buildDataWindowModelFromSnapshot(kb.getDocumentSnapshot(targetUri));
  }
  if (!dataObjectName) {
    return null;
  }
  const targets = resolveDataWindowDefinitionTargets(dataObjectName, kb);
  return targets.length === 1 ? buildDataWindowModelFromSnapshot(kb.getDocumentSnapshot(targets[0].uri)) : null;
}

function toFastColumns(columns: readonly DataWindowTableColumnNode[]): DataWindowFastColumnView[] {
  return columns.map((column) => ({
    name: column.name,
    ...(column.type ? { type: column.type } : {}),
    ...(column.dbName ? { dbName: column.dbName } : {}),
    sourceOrigin: 'datawindow-model',
  }));
}

function toFastComputedFields(expressions: readonly DataWindowExpressionNode[]): DataWindowFastComputedFieldView[] {
  return expressions
    .filter((expression) => expression.controlType === 'compute')
    .map((expression) => ({
      name: expression.ownerName ?? expression.name,
      controlType: 'compute',
      propertyName: expression.propertyName,
      expressionText: expression.expressionText,
      ...(expression.staticValue !== undefined ? { staticValue: expression.staticValue } : {}),
      dependencies: expression.dependencies.map((dependency) => ({
        name: dependency.name,
        kind: dependency.kind,
        sourceOrigin: 'datawindow-model',
      })),
      sourceOrigin: 'datawindow-model',
    }));
}

function listOfficialDwBuffers(systemCatalog: SystemCatalog): DataWindowFastBufferView[] {
  const catalog = systemCatalog as SystemCatalog & {
    listDataWindowConstantValuesForType?: (typeName: string) => readonly PbSystemSymbolEntry[];
  };
  if (typeof catalog.listDataWindowConstantValuesForType !== 'function') {
    return [];
  }

  return catalog.listDataWindowConstantValuesForType('DWBuffer').map((entry) => ({
    name: entry.name,
    source: 'system-catalog',
    enumType: 'DWBuffer',
  }));
}

function listMembersForOwner(systemCatalog: SystemCatalog, ownerTypes: readonly string[]): readonly PbSystemSymbolEntry[] {
  const catalog = systemCatalog as SystemCatalog & {
    listMembersForOwner?: (ownerTypes: readonly string[]) => readonly PbSystemSymbolEntry[];
  };
  return typeof catalog.listMembersForOwner === 'function' ? catalog.listMembersForOwner(ownerTypes) : [];
}

function inferDataObjectNameFromSourceUri(uri: string): string | undefined {
  const basename = uri.replace(/^.*[\\/]/, '');
  return basename.toLowerCase().endsWith('.srd') ? basename.slice(0, -4) : undefined;
}

function buildDataWindowFastContextCacheKey(context: Omit<DataWindowFastContext, 'cacheKey'>): string {
  return [
    'dw-fast',
    context.uri,
    `doc:${context.documentVersion}`,
    `kb:${context.kbVersion}`,
    `fp:${context.documentFingerprint}`,
    `origin:${context.sourceOrigin}`,
    `receiver:${context.receiverName ?? ''}`,
    `kind:${context.receiverKind}`,
    `state:${context.binding.state}`,
    `confidence:${context.binding.confidence}`,
    `dataobject:${context.binding.dataObject ?? ''}`,
    `target:${context.binding.targetUri ?? ''}`,
    `reason:${context.binding.reasonCodes.join('+')}`,
  ].join('|');
}