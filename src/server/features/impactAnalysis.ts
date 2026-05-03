import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { buildCurrentObjectContext } from './currentObjectContext';
import { resolveAncestorDescriptor } from './ancestorDescriptor';
import { createDocumentQueryContext } from './queryContext';
import { provideReferences, type ReferenceSource } from './references';
import type { WorkspaceState } from '../workspace/workspaceState';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { HotContextCache } from '../knowledge/HotContextCache';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { Entity, EntityKind } from '../knowledge/types';
import {
  type ApiCurrentObjectAncestor,
  type ApiCurrentObjectContextSymbol,
  type ApiCurrentObjectRelatedFile,
  type ApiImpactAnalysis,
  type ApiImpactAnalysisRequest,
  type ApiImpactBuildTarget,
  type ApiImpactLocation,
} from '../../shared/publicApi';
import { getQueryConsumerPolicy } from './queryScopePolicy';

const DEFAULT_SAFE_REFERENCES = getQueryConsumerPolicy('impact-analysis').resultCap;
const MAX_SAFE_REFERENCES = 256;

interface ImpactAnalysisOptions {
  workspaceState?: WorkspaceState;
  hotContext?: HotContextCache;
}

type SourceLoader = (uri: string) => Promise<string | null>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toImpactSymbol(entity: Entity): ApiCurrentObjectContextSymbol {
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
  };
}

function toImpactAncestor(name: string, kb: KnowledgeBase, systemCatalog: SystemCatalog): ApiCurrentObjectAncestor {
  return resolveAncestorDescriptor(name, kb, systemCatalog);
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

function addAffectedSymbol(
  target: ApiCurrentObjectContextSymbol[],
  seen: Set<string>,
  symbol: ApiCurrentObjectContextSymbol | undefined
): void {
  if (!symbol) {
    return;
  }

  const key = `${symbol.uri}:${symbol.line}:${symbol.character}:${symbol.kind}:${symbol.name}`;
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  target.push(symbol);
}

function collectOverrides(rootEntity: Entity, ownerType: string, descendants: string[], graph: InheritanceGraph): ApiCurrentObjectContextSymbol[] {
  if (rootEntity.kind === EntityKind.Type) {
    return [];
  }

  const overrides: ApiCurrentObjectContextSymbol[] = [];
  const seen = new Set<string>();
  for (const descendant of descendants) {
    for (const entry of graph.getMemberClosure(descendant)) {
      if (
        entry.relation !== 'override'
        || entry.entity.kind !== rootEntity.kind
        || entry.entity.name.toLowerCase() !== rootEntity.name.toLowerCase()
      ) {
        continue;
      }

      addAffectedSymbol(overrides, seen, {
        ...toImpactSymbol(entry.entity),
        relation: 'override',
        declaredIn: entry.declaredIn,
      });
    }
  }

  return overrides;
}

async function collectReferenceSources(
  uris: string[],
  loader: SourceLoader
): Promise<ReferenceSource[]> {
  const sources: ReferenceSource[] = [];
  for (const uri of uris) {
    const content = await loader(uri);
    if (content == null) {
      continue;
    }
    sources.push({ uri, content });
  }
  return sources;
}

async function loadRootDocument(rootEntity: Entity, loader: SourceLoader, fallbackDocument: TextDocument): Promise<TextDocument> {
  if (rootEntity.uri === fallbackDocument.uri) {
    return fallbackDocument;
  }

  const content = await loader(rootEntity.uri);
  if (content == null) {
    return fallbackDocument;
  }

  return TextDocument.create(rootEntity.uri, 'powerbuilder', 0, content);
}

function toImpactLocations(locations: ReturnType<typeof provideReferences>, limit: number): ApiImpactLocation[] {
  return locations.slice(0, limit).map((location) => ({
    uri: location.uri,
    line: location.range.start.line,
    character: location.range.start.character,
  }));
}

function collectBuildTargets(
  files: readonly ApiCurrentObjectRelatedFile[],
  workspaceState?: WorkspaceState
): ApiImpactBuildTarget[] {
  if (!workspaceState) {
    return [];
  }

  const targets = new Map<string, ApiImpactBuildTarget>();
  for (const file of files) {
    const project = workspaceState.getProjectContextForFile(file.uri);
    if (!project) {
      continue;
    }

    const existing = targets.get(project.projectUri);
    if (existing) {
      continue;
    }

    targets.set(project.projectUri, {
      projectUri: project.projectUri,
      name: project.name,
      files: [...project.files],
    });
  }

  return [...targets.values()];
}

export async function buildImpactAnalysis(
  document: TextDocument,
  request: ApiImpactAnalysisRequest | undefined,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  systemCatalog: SystemCatalog,
  loadSource: SourceLoader,
  options: ImpactAnalysisOptions = {}
): Promise<ApiImpactAnalysis> {
  const line = typeof request?.line === 'number' ? request.line : undefined;
  const character = typeof request?.character === 'number' ? request.character : undefined;
  const currentContext = buildCurrentObjectContext(document, request, kb, graph, systemCatalog, options);
  const queryContext = line != null && character != null
    ? createDocumentQueryContext(document, Position.create(line, character), kb, graph, options.hotContext, 'impact-analysis')
    : null;
  const rootEntity = queryContext?.resolvedTargets?.targets[0]
    ?? queryContext?.currentMainObject
    ?? kb.getEntitiesByUri(document.uri).find((entity) => entity.kind === EntityKind.Type);

  if (!rootEntity || currentContext.available === false) {
    return {
      available: false,
      reason: currentContext.reason ?? 'No se pudo resolver un símbolo u objeto base para calcular impacto.',
      safeReferences: [],
      probableImpactFiles: [],
      descendants: [],
      overrides: [],
      relatedEvents: [],
      relatedDataWindows: [],
      affectedSymbols: [],
      buildTargets: [],
    };
  }

  const ownerType = rootEntity.kind === EntityKind.Type
    ? rootEntity.name
    : rootEntity.ownerName ?? rootEntity.containerName ?? currentContext.objectInfo?.globalType ?? rootEntity.fileObjectName;
  const descendants = ownerType ? graph.getDescendants(ownerType) : [];
  const descendantAncestors = descendants.map((name) => toImpactAncestor(name, kb, systemCatalog));
  const overrides = ownerType ? collectOverrides(rootEntity, ownerType, descendants, graph) : [];
  const relatedEvents = [...(currentContext.members?.events ?? [])];
  const relatedDataWindows = [...(currentContext.dataWindowBindings ?? [])];

  const projectFiles = options.workspaceState?.getProjectContextForFile(rootEntity.uri)?.files
    ?? options.workspaceState?.getProjectContextForFile(document.uri)?.files
    ?? [document.uri];
  const sources = await collectReferenceSources(projectFiles, loadSource);
  const rootDocument = await loadRootDocument(rootEntity, loadSource, document);
  const safeReferenceBudget = clamp(
    typeof request?.maxSafeReferences === 'number' ? Math.trunc(request.maxSafeReferences) : DEFAULT_SAFE_REFERENCES,
    0,
    MAX_SAFE_REFERENCES
  );
  const safeReferences = toImpactLocations(
    provideReferences(
      rootDocument,
      Position.create(rootEntity.line, rootEntity.character),
      kb,
      graph,
      sources,
      { includeDeclaration: true },
      options.hotContext,
    ),
    safeReferenceBudget
  );

  const probableImpactFiles: ApiCurrentObjectRelatedFile[] = [];
  const relatedSeen = new Set<string>();
  for (const file of currentContext.relatedFiles ?? []) {
    addRelatedFile(probableImpactFiles, relatedSeen, file.uri, file.role);
  }
  for (const descendant of descendantAncestors) {
    addRelatedFile(probableImpactFiles, relatedSeen, descendant.uri, 'descendant');
  }
  for (const override of overrides) {
    addRelatedFile(probableImpactFiles, relatedSeen, override.uri, 'override');
  }

  const affectedSymbols: ApiCurrentObjectContextSymbol[] = [];
  const affectedSeen = new Set<string>();
  addAffectedSymbol(affectedSymbols, affectedSeen, toImpactSymbol(rootEntity));
  for (const descendant of descendantAncestors) {
    const entity = descendant.uri
      ? kb.getEntitiesByUri(descendant.uri).find((candidate) => candidate.kind === EntityKind.Type && candidate.name.toLowerCase() === descendant.name.toLowerCase())
      : undefined;
    addAffectedSymbol(affectedSymbols, affectedSeen, entity ? toImpactSymbol(entity) : undefined);
  }
  for (const override of overrides) {
    addAffectedSymbol(affectedSymbols, affectedSeen, override);
  }
  for (const event of relatedEvents) {
    addAffectedSymbol(affectedSymbols, affectedSeen, event);
  }

  return {
    available: true,
    rootSymbol: toImpactSymbol(rootEntity),
    ...(queryContext?.resolutionConfidence ? { confidence: queryContext.resolutionConfidence } : { confidence: 'high' }),
    ...(queryContext?.primaryResolutionReasonCode ? { primaryReasonCode: queryContext.primaryResolutionReasonCode } : {}),
    ...(queryContext ? { evidenceKinds: queryContext.resolutionEvidenceKinds } : {}),
    safeReferences,
    probableImpactFiles,
    descendants: descendantAncestors,
    overrides,
    relatedEvents,
    relatedDataWindows,
    affectedSymbols,
    buildTargets: collectBuildTargets(probableImpactFiles, options.workspaceState),
  };
}