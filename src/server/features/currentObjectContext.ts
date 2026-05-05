import { DiagnosticSeverity, Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { getDocumentAnalysis } from '../analysis/analysisCache';
import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import { buildDiagnosticsForDocument } from './diagnostics';
import { resolveAncestorDescriptor } from './ancestorDescriptor';
import { buildHierarchyInspection } from './hierarchyInspection';
import { buildObjectInfo } from './objectInfo';
import { inferPowerBuilderObjectKindFromUri } from './powerBuilderObjectKind';
import { createDocumentQueryContext } from './queryContext';
import { collectEmbeddedSqlAnchors } from './embeddedSqlAnchors';
import {
  collectDataObjectBindings,
  type DataWindowBindingSummary,
} from './dataWindowBindingModel';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { HotContextCache } from '../knowledge/HotContextCache';
import {
  resolveCurrentObjectAtLine,
  resolveTargetEntityDetailed,
} from '../knowledge/resolution/semanticQueryService';
import { Entity, EntityKind } from '../knowledge/types';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { buildFrameworkKnowledgeConflictPolicy } from '../knowledge/system/frameworkKnowledgePackPolicy';
import { inferSourceOrigin, type SourceOrigin } from '../../shared/sourceOrigin';
import {
  type ApiCurrentObjectAncestor,
  type ApiCurrentObjectContext,
  type ApiCurrentObjectDiagnostic,
  type ApiCurrentObjectContextRequest,
  type ApiCurrentObjectContextSymbol,
  type ApiCurrentObjectDataWindowBinding,
  type ApiCurrentObjectReference,
  type ApiCurrentObjectRelatedFile,
  type ApiCurrentObjectVisibleVariable,
} from '../../shared/publicApi';
import type { WorkspaceState } from '../workspace/workspaceState';
import { ScopeKind } from '../knowledge/types';
import { getQueryConsumerPolicy } from './queryScopePolicy';

const DEFAULT_EXCERPT_LINES = 48;
const DEFAULT_REFERENCED_SYMBOLS = getQueryConsumerPolicy('current-object-context').resultCap;
const MAX_EXCERPT_LINES = 120;
const MAX_REFERENCED_SYMBOLS = 64;

const QUALIFIED_CALL_REGEX = /([A-Za-z_$#%][\w$#%-]*)\s*(::|\.)\s*([A-Za-z_$#%][\w$#%-]*)\s*\(/gi;
const UNQUALIFIED_CALL_REGEX = /\b([A-Za-z_$#%][\w$#%-]*)\s*\(/gi;
const EVENT_METHOD_CALL_REGEX = /([A-Za-z_$#%][\w$#%-]*)\s*\.\s*(tabtriggerevent|tabpostevent|triggerevent|postevent)\s*\(\s*["']([^"']+)["']/gi;
const EVENT_GLOBAL_CALL_REGEX = /\b(tabtriggerevent|tabpostevent|triggerevent|postevent)\s*\(\s*([A-Za-z_$#%][\w$#%-]*)\s*,\s*["']([^"']+)["']/gi;
const DECLARATION_LINE_REGEX = /^\s*(forward\b|global\s+type\b|type\b|event\b|on\b|public\s+(function|subroutine|event)\b|private\s+(function|subroutine|event)\b|protected\s+(function|subroutine|event)\b)/i;

interface CurrentObjectContextOptions {
  workspaceState?: WorkspaceState;
  hotContext?: HotContextCache;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pickSourceOrigin(uri: string, workspaceState?: WorkspaceState): SourceOrigin {
  return workspaceState?.getSourceOrigin(uri)
    ?? inferSourceOrigin(uri, { hasSolutionRoots: workspaceState?.getMode() === 'solution' || workspaceState?.getMode() === 'mixed' });
}

function buildCurrentObjectFrameworkKnowledgeConflict(input: {
  objectInfo: ReturnType<typeof buildObjectInfo>;
  ancestorChain: readonly string[];
  sourceOrigin?: SourceOrigin;
  resolutionConfidence?: NonNullable<ApiCurrentObjectContext['evidence']>['resolutionConfidence'];
}): ApiCurrentObjectContext['frameworkKnowledgeConflict'] | undefined {
  return buildFrameworkKnowledgeConflictPolicy({
    ownerTypes: [
      input.objectInfo.globalType,
      input.objectInfo.baseType,
      ...input.ancestorChain,
    ],
    sourceOrigin: input.sourceOrigin,
    confidence: input.resolutionConfidence,
  });
}

function buildExcerpt(
  lines: string[],
  startLine: number,
  endLine: number,
  focusLine: number | undefined,
  maxExcerptLines: number
): NonNullable<ApiCurrentObjectContext['sourceExcerpt']> {
  const normalizedStart = clamp(startLine, 0, Math.max(lines.length - 1, 0));
  const normalizedEnd = clamp(endLine, normalizedStart, Math.max(lines.length - 1, normalizedStart));
  const span = normalizedEnd - normalizedStart + 1;

  if (span <= maxExcerptLines) {
    return {
      startLine: normalizedStart,
      endLine: normalizedEnd,
      text: lines.slice(normalizedStart, normalizedEnd + 1).join('\n'),
      truncated: false
    };
  }

  const anchor = clamp(focusLine ?? normalizedStart, normalizedStart, normalizedEnd);
  const excerptStart = clamp(
    anchor - Math.floor(maxExcerptLines / 2),
    normalizedStart,
    normalizedEnd - maxExcerptLines + 1
  );
  const excerptEnd = excerptStart + maxExcerptLines - 1;
  return {
    startLine: excerptStart,
    endLine: excerptEnd,
    text: lines.slice(excerptStart, excerptEnd + 1).join('\n'),
    truncated: true
  };
}

function mapSymbol(
  entity: Entity,
  extra: Partial<ApiCurrentObjectContextSymbol> = {}
): ApiCurrentObjectContextSymbol {
  return {
    name: entity.name,
    kind: entity.kind,
    uri: entity.uri,
    line: entity.line,
    character: entity.character,
    ...(entity.signatureLabel ?? entity.signature ? { signature: entity.signatureLabel ?? entity.signature } : {}),
    ...(entity.implementationKind ? { implementationKind: entity.implementationKind } : {}),
    ...(entity.lineage?.sourceOrigin ? { sourceOrigin: entity.lineage.sourceOrigin } : {}),
    ...(entity.isPrototype ? { isPrototype: true } : {}),
    ...extra,
  };
}

function collectMemberSymbols(
  focusType: string,
  localEntities: Entity[],
  graph: InheritanceGraph
): NonNullable<ApiCurrentObjectContext['members']> {
  const closure = graph.getMemberClosure(focusType).filter((entry) => !entry.overriddenByCurrentType);
  const functions: ApiCurrentObjectContextSymbol[] = [];
  const events: ApiCurrentObjectContextSymbol[] = [];
  const prototypes: ApiCurrentObjectContextSymbol[] = [];

  const pushMember = (entry: ApiCurrentObjectContextSymbol, kind: EntityKind, isPrototype = false): void => {
    if (isPrototype) {
      prototypes.push(entry);
      return;
    }
    if (kind === EntityKind.Event) {
      events.push(entry);
      return;
    }
    functions.push(entry);
  };

  if (closure.length > 0) {
    for (const entry of closure) {
      if (entry.entity.kind !== EntityKind.Function && entry.entity.kind !== EntityKind.Subroutine && entry.entity.kind !== EntityKind.Event) {
        continue;
      }

      pushMember(
        mapSymbol(entry.entity, {
          declaredIn: entry.declaredIn,
          relation: entry.relation,
        }),
        entry.entity.kind,
        entry.entity.isPrototype === true
      );
    }
    return { functions, events, prototypes };
  }

  const focusLower = focusType.toLowerCase();
  for (const entity of localEntities) {
    if (entity.kind !== EntityKind.Function && entity.kind !== EntityKind.Subroutine && entity.kind !== EntityKind.Event) {
      continue;
    }

    const owner = (entity.ownerName ?? entity.containerName ?? entity.fileObjectName ?? '').toLowerCase();
    if (owner !== focusLower && entity.kind !== EntityKind.Event) {
      continue;
    }

    pushMember(
      mapSymbol(entity, {
        declaredIn: entity.ownerName ?? entity.containerName ?? entity.fileObjectName ?? null,
        relation: 'own',
      }),
      entity.kind,
      entity.isPrototype === true
    );
  }

  return { functions, events, prototypes };
}

function collectVisibleVariables(
  documentUri: string,
  focusType: string,
  line: number | undefined,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
): ApiCurrentObjectVisibleVariable[] {
  const visibleVariables: ApiCurrentObjectVisibleVariable[] = [];
  const seen = new Set<string>();

  const pushVariable = (
    entity: Entity,
    extra: Partial<ApiCurrentObjectVisibleVariable> = {},
  ): void => {
    const key = entity.name.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    visibleVariables.push({
      name: entity.name,
      uri: entity.uri,
      line: entity.line,
      character: entity.character,
      ...(entity.datatype ? { datatype: entity.datatype } : {}),
      ...(entity.scope ? { scope: entity.scope } : {}),
      ...(entity.lineage?.sourceOrigin ? { sourceOrigin: entity.lineage.sourceOrigin } : {}),
      ...extra,
    });
  };

  if (line !== undefined) {
    let scope = kb.getScopeAt(documentUri, line);
    while (scope && (scope.kind === ScopeKind.Function || scope.kind === ScopeKind.Event)) {
      for (const symbol of scope.symbols) {
        if (symbol.kind !== EntityKind.Variable) {
          continue;
        }
        pushVariable(symbol, {
          declaredIn: scope.id,
          relation: 'own',
        });
      }
      scope = scope.parent ?? null;
    }
  }

  for (const member of graph.getMemberClosure(focusType)) {
    if (member.entity.kind !== EntityKind.Variable || member.overriddenByCurrentType) {
      continue;
    }

    pushVariable(member.entity, {
      declaredIn: member.declaredIn,
      relation: member.relation,
    });
  }

  return visibleVariables;
}

function summarizeDiagnostics(diagnostics: ApiCurrentObjectDiagnostic[]): NonNullable<ApiCurrentObjectContext['diagnostics']> {
  const byCode: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const diagnostic of diagnostics) {
    if (diagnostic.code) {
      byCode[diagnostic.code] = (byCode[diagnostic.code] ?? 0) + 1;
    }
    const severity = diagnostic.severity ?? 'info';
    bySeverity[severity] = (bySeverity[severity] ?? 0) + 1;
  }

  return {
    total: diagnostics.length,
    byCode,
    bySeverity,
    items: diagnostics
  };
}

function mapDiagnosticSeverity(severity: DiagnosticSeverity | undefined): ApiCurrentObjectDiagnostic['severity'] {
  switch (severity) {
    case DiagnosticSeverity.Error:
      return 'error';
    case DiagnosticSeverity.Warning:
      return 'warning';
    case DiagnosticSeverity.Hint:
      return 'hint';
    case DiagnosticSeverity.Information:
    default:
      return 'info';
  }
}

function mapDataWindowBinding(binding: DataWindowBindingSummary): ApiCurrentObjectDataWindowBinding {
  return {
    targetName: binding.targetName,
    line: binding.line,
    ...(binding.dataObject !== undefined ? { dataObject: binding.dataObject } : {}),
    state: binding.state,
    ...(binding.targetUri ? { targetUri: binding.targetUri } : {}),
    retrieveArguments: binding.retrieveArguments.map((argument) => ({ ...argument }))
  };
}

function buildAncestorChain(
  ancestorNames: string[],
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog
): ApiCurrentObjectAncestor[] {
  return ancestorNames.map((name) => resolveAncestorDescriptor(name, kb, systemCatalog));
}

function addRelatedFile(
  target: ApiCurrentObjectRelatedFile[],
  seen: Set<string>,
  uri: string | undefined,
  role: ApiCurrentObjectRelatedFile['role']
): void {
  if (!uri) {
    return;
  }
  const key = `${role}:${uri}`;
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  target.push({ uri, role });
}

function collectReferencedSymbols(
  document: TextDocument,
  rawLines: string[],
  maskedLines: string[],
  startLine: number,
  endLine: number,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  hotContext: HotContextCache | undefined,
  maxResults: number
): ApiCurrentObjectReference[] {
  const references: ApiCurrentObjectReference[] = [];
  const seen = new Set<string>();

  const pushResolved = (
    context: { identifier: string; qualifier?: string; separator?: '.' | '::' },
    line: number,
    character: number
  ): void => {
    if (references.length >= maxResults) {
      return;
    }

    const resolved = resolveTargetEntityDetailed(context, document.uri, kb, graph, {
      line,
      hotContext,
      traceLabel: 'current-object-context',
      budgetMs: getQueryConsumerPolicy('current-object-context').budgetMs,
      sourceOriginPolicy: getQueryConsumerPolicy('current-object-context')
    });
    const target = resolved.targets[0];
    if (!target) {
      return;
    }

    const key = `${context.qualifier ?? ''}:${context.identifier}:${target.uri}:${target.line}:${target.character}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);

    references.push({
      identifier: context.identifier,
      ...(context.qualifier ? { qualifier: context.qualifier } : {}),
      line,
      target: mapSymbol(target),
      confidence: resolved.confidence,
      reasonCode: resolved.reasonCodes[0],
      invocationKind: resolved.invocationKind,
      invocationRisk: resolved.invocationRisk,
    });
  };

  for (let line = startLine; line <= endLine && references.length < maxResults; line++) {
    const rawLine = rawLines[line] ?? '';
    const maskedLine = maskedLines[line] ?? rawLine;

    EVENT_METHOD_CALL_REGEX.lastIndex = 0;
    let eventMethodMatch: RegExpExecArray | null;
    while ((eventMethodMatch = EVENT_METHOD_CALL_REGEX.exec(rawLine)) !== null && references.length < maxResults) {
      pushResolved({
        qualifier: eventMethodMatch[1],
        identifier: eventMethodMatch[3],
        separator: '.'
      }, line, eventMethodMatch.index + eventMethodMatch[1].length + eventMethodMatch[2].length + 2);
    }

    EVENT_GLOBAL_CALL_REGEX.lastIndex = 0;
    let eventGlobalMatch: RegExpExecArray | null;
    while ((eventGlobalMatch = EVENT_GLOBAL_CALL_REGEX.exec(rawLine)) !== null && references.length < maxResults) {
      pushResolved({
        qualifier: eventGlobalMatch[2],
        identifier: eventGlobalMatch[3]
      }, line, eventGlobalMatch.index + eventGlobalMatch[1].length + 1);
    }

    if (DECLARATION_LINE_REGEX.test(rawLine)) {
      continue;
    }

    QUALIFIED_CALL_REGEX.lastIndex = 0;
    let qualifiedMatch: RegExpExecArray | null;
    while ((qualifiedMatch = QUALIFIED_CALL_REGEX.exec(maskedLine)) !== null && references.length < maxResults) {
      pushResolved({
        qualifier: qualifiedMatch[1],
        separator: qualifiedMatch[2] as '.' | '::',
        identifier: qualifiedMatch[3]
      }, line, qualifiedMatch.index + qualifiedMatch[0].lastIndexOf(qualifiedMatch[3]));
    }

    UNQUALIFIED_CALL_REGEX.lastIndex = 0;
    let unqualifiedMatch: RegExpExecArray | null;
    while ((unqualifiedMatch = UNQUALIFIED_CALL_REGEX.exec(maskedLine)) !== null && references.length < maxResults) {
      const previousChar = maskedLine[unqualifiedMatch.index - 1] ?? '';
      if (previousChar === '.' || previousChar === ':') {
        continue;
      }

      pushResolved({
        identifier: unqualifiedMatch[1]
      }, line, unqualifiedMatch.index);
    }
  }

  return references;
}

export function buildCurrentObjectContext(
  document: TextDocument,
  request: ApiCurrentObjectContextRequest | undefined,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  systemCatalog: SystemCatalog,
  options: CurrentObjectContextOptions = {}
): ApiCurrentObjectContext {
  const analysis = getDocumentAnalysis(document);
  const snapshot = analysis.snapshot;
  const rawLines = document.getText().split(/\r?\n/);
  const projectContext = options.workspaceState?.getProjectContextForFile(document.uri);
  const line = typeof request?.line === 'number' ? request.line : undefined;
  const character = typeof request?.character === 'number' ? request.character : undefined;
  const queryContext = line != null && character != null
    ? createDocumentQueryContext(document, Position.create(line, character), kb, graph, options.hotContext, 'current-object-context', 'current-object-context')
    : null;
  const documentEntities = queryContext?.documentEntities?.length
    ? queryContext.documentEntities
    : (kb.getEntitiesByUri(document.uri).length > 0 ? kb.getEntitiesByUri(document.uri) : analysis.semanticFacts);
  const objectInfo = buildObjectInfo({
    uri: document.uri,
    content: document.getText(),
    line,
    library: projectContext?.libraries[0],
    project: projectContext?.projectUri
  });
  const currentObject = queryContext?.currentMainObject
    ?? resolveCurrentObjectAtLine(document.uri, documentEntities, kb, line)
    ?? documentEntities.find((entity) => entity.kind === EntityKind.Type && entity.name.toLowerCase() === objectInfo.globalType?.toLowerCase())
    ?? documentEntities.find((entity) => entity.kind === EntityKind.Type);
  const focusType = currentObject?.name ?? objectInfo.globalType ?? null;

  if (!focusType) {
    return {
      available: false,
      reason: 'No se pudo determinar el objeto activo.',
      uri: document.uri,
      objectInfo: {
        uri: objectInfo.uri,
        ...(objectInfo.globalType ? { globalType: objectInfo.globalType } : {}),
        ...(objectInfo.baseType ? { baseType: objectInfo.baseType } : {}),
        ...(objectInfo.sectionKind ? { sectionKind: objectInfo.sectionKind } : {}),
        ...(objectInfo.library ? { library: objectInfo.library } : {}),
        ...(objectInfo.project ? { project: objectInfo.project } : {}),
        sourceOrigin: pickSourceOrigin(document.uri, options.workspaceState),
        readiness: snapshot.readiness,
      }
    };
  }

  const hierarchy = buildHierarchyInspection(focusType, graph, kb, systemCatalog, {
    activeUri: document.uri,
    workspaceState: options.workspaceState,
  });
  const excerptLineBudget = clamp(
    typeof request?.maxExcerptLines === 'number' ? Math.trunc(request.maxExcerptLines) : DEFAULT_EXCERPT_LINES,
    8,
    MAX_EXCERPT_LINES
  );
  const sourceExcerpt = buildExcerpt(
    rawLines,
    0,
    Math.max(rawLines.length - 1, 0),
    line,
    excerptLineBudget
  );
  const memberGroups = collectMemberSymbols(focusType, analysis.semanticFacts, graph);
  const visibleVariables = collectVisibleVariables(document.uri, focusType, line, kb, graph);
  const diagnostics = buildDiagnosticsForDocument(document, kb, systemCatalog, graph).map((diagnostic) => ({
    message: diagnostic.message,
    ...(diagnostic.code ? { code: String(diagnostic.code) } : {}),
    severity: mapDiagnosticSeverity(diagnostic.severity),
    line: diagnostic.range.start.line,
    character: diagnostic.range.start.character,
  } satisfies ApiCurrentObjectDiagnostic));
  const bindingStartLine = 0;
  const bindingEndLine = Math.max(snapshot.maskedText.lines.length - 1, 0);
  const dataWindowBindings = collectDataObjectBindings(snapshot, kb, bindingStartLine, bindingEndLine).map(mapDataWindowBinding);
  const embeddedSqlAnchors = collectEmbeddedSqlAnchors(snapshot);
  const referencedSymbols = collectReferencedSymbols(
    document,
    rawLines,
    snapshot.maskedText.lines,
    bindingStartLine,
    bindingEndLine,
    kb,
    graph,
    options.hotContext,
    clamp(
      typeof request?.maxReferencedSymbols === 'number' ? Math.trunc(request.maxReferencedSymbols) : DEFAULT_REFERENCED_SYMBOLS,
      0,
      MAX_REFERENCED_SYMBOLS
    )
  );

  const relatedFiles: ApiCurrentObjectRelatedFile[] = [];
  const relatedSeen = new Set<string>();
  addRelatedFile(relatedFiles, relatedSeen, document.uri, 'active-document');
  addRelatedFile(relatedFiles, relatedSeen, projectContext?.projectUri, 'project');
  for (const libraryUri of projectContext?.libraries ?? []) {
    addRelatedFile(relatedFiles, relatedSeen, libraryUri, 'library');
  }
  for (const ancestor of hierarchy.ancestorDescriptors) {
    addRelatedFile(relatedFiles, relatedSeen, ancestor.uri, 'ancestor');
  }
  for (const binding of dataWindowBindings) {
    addRelatedFile(relatedFiles, relatedSeen, binding.targetUri, 'datawindow');
  }
  for (const reference of referencedSymbols) {
    addRelatedFile(relatedFiles, relatedSeen, reference.target.uri, 'reference-target');
  }

  const resolvedSourceOrigin = currentObject?.lineage?.sourceOrigin ?? pickSourceOrigin(document.uri, options.workspaceState);
  const frameworkKnowledgeConflict = buildCurrentObjectFrameworkKnowledgeConflict({
    objectInfo,
    ancestorChain: hierarchy.ancestorChain,
    sourceOrigin: resolvedSourceOrigin,
    resolutionConfidence: 'high',
  });

  return {
    available: true,
    uri: document.uri,
    objectInfo: {
      uri: objectInfo.uri,
      ...(objectInfo.globalType ? { globalType: objectInfo.globalType } : {}),
      ...(objectInfo.baseType ? { baseType: objectInfo.baseType } : {}),
      ...(objectInfo.sectionKind ? { sectionKind: objectInfo.sectionKind } : {}),
      ...(objectInfo.library ? { library: objectInfo.library } : {}),
      ...(objectInfo.project ? { project: objectInfo.project } : {}),
      objectKind: inferPowerBuilderObjectKindFromUri(currentObject?.uri ?? objectInfo.uri),
      sourceOrigin: resolvedSourceOrigin,
      readiness: snapshot.readiness,
    },
    projectContext: {
      ...(projectContext?.projectUri ? { uri: projectContext.projectUri } : {}),
      ...(projectContext?.name ? { name: projectContext.name } : {}),
      libraries: [...(projectContext?.libraries ?? [])]
    },
    sourceExcerpt,
    ancestorChain: hierarchy.ancestorDescriptors.length > 0
      ? hierarchy.ancestorDescriptors
      : buildAncestorChain(hierarchy.ancestorChain, kb, systemCatalog),
    members: memberGroups,
    visibleVariables,
    referencedSymbols,
    diagnostics: summarizeDiagnostics(diagnostics),
    dataWindowBindings,
    ...(embeddedSqlAnchors.length > 0 ? { embeddedSqlAnchors } : {}),
    evidence: {
      readiness: snapshot.readiness,
      ...(queryContext?.context?.identifier ? { identifier: queryContext.context.identifier } : {}),
      ...(queryContext?.context?.qualifier ? { qualifier: queryContext.context.qualifier } : {}),
      ...(queryContext?.resolutionConfidence ? { resolutionConfidence: queryContext.resolutionConfidence } : {}),
      ...(queryContext?.primaryResolutionReasonCode ? { primaryReasonCode: queryContext.primaryResolutionReasonCode } : {}),
      ...(queryContext?.invocationKind ? { invocationKind: queryContext.invocationKind } : {}),
      ...(queryContext?.invocationRisk ? { invocationRisk: queryContext.invocationRisk } : {}),
      ...(queryContext ? { targetCount: queryContext.resolutionTargetCount } : {}),
      evidenceKinds: queryContext?.resolutionEvidenceKinds ?? []
    },
    ...(frameworkKnowledgeConflict ? { frameworkKnowledgeConflict } : {}),
    relatedFiles,
  };
}