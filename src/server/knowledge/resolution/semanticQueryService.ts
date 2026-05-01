import { KnowledgeBase } from '../KnowledgeBase';
import { InheritanceGraph } from './InheritanceGraph';
import type { HotContextCache } from '../HotContextCache';
import { InvocationContext } from '../../utils/invocationContext';
import { Entity, EntityKind } from '../types';
import { normalizeUri } from '../../system/uriUtils';
import { recordTraceStep, type TraceStep, withTrace } from '../queryTrace';

export type QueryReasonCode =
  | 'local-scope'
  | 'member-hierarchy'
  | 'super-hierarchy'
  | 'qualifier-type'
  | 'global-fallback';

export interface ResolvedTargetInfo {
  context: InvocationContext;
  targets: Entity[];
  reasonCodes: QueryReasonCode[];
  trace: TraceStep[];
}

export interface ResolveTargetOptions {
  line?: number;
  hotContext?: HotContextCache;
  traceLabel?: string;
}

function getDocumentEntities(
  currentUri: string,
  kb: KnowledgeBase,
  hotContext?: HotContextCache
): Entity[] {
  if (hotContext && hotContext.getActiveUri() === currentUri && hotContext.getKbVersion() === kb.version) {
    const cached = hotContext.getActiveEntities();
    if (cached) {
      recordTraceStep('activeEntities:hit', { uri: currentUri, count: cached.length });
      return cached;
    }
  }

  const entities = kb.getEntitiesByUri(currentUri);
  if (hotContext && hotContext.getActiveUri() === currentUri && hotContext.getKbVersion() === kb.version) {
    hotContext.setActiveEntities(entities);
    recordTraceStep('activeEntities:miss', { uri: currentUri, count: entities.length });
  }
  return entities;
}

function getMembersForType(
  typeName: string,
  currentUri: string,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  hotContext?: HotContextCache
): Entity[] {
  const cacheKey = typeName.toLowerCase();
  if (hotContext && hotContext.getActiveUri() === currentUri && hotContext.getKbVersion() === kb.version) {
    const cached = hotContext.getInheritedMembers(cacheKey);
    if (cached) {
      recordTraceStep('members:hit', { typeName, count: cached.length });
      return cached;
    }
  }

  const members = graph.getMembers(typeName);
  if (hotContext && hotContext.getActiveUri() === currentUri && hotContext.getKbVersion() === kb.version) {
    hotContext.setInheritedMembers(cacheKey, members);
    recordTraceStep('members:miss', { typeName, count: members.length });
  }
  return members;
}

export function resolveTargetEntityDetailed(
  context: InvocationContext,
  currentDocumentUri: string,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  options: ResolveTargetOptions = {}
): ResolvedTargetInfo {
  const { result, trace } = withTrace(options.traceLabel ?? 'resolveTargetEntity', () => {
    const { identifier, qualifier } = context;
    const currentUri = normalizeUri(currentDocumentUri);
    recordTraceStep('resolve:start', { identifier, qualifier, line: options.line });

    const documentEntities = getDocumentEntities(currentUri, kb, options.hotContext);
    const currentMainObject = documentEntities.find(
      (entity) => entity.kind === EntityKind.Type
    );

    let possibleTargets: Entity[] = [];
    let reasonCodes: QueryReasonCode[] = [];

    if (qualifier) {
      const varType = resolveQualifierType(qualifier, currentUri, kb, options.line);
      recordTraceStep('qualifier:resolved', { qualifier, varType });
      if (varType) {
        if (varType.toLowerCase() === 'super' && currentMainObject?.baseTypeName) {
          const members = getMembersForType(currentMainObject.baseTypeName, currentUri, kb, graph, options.hotContext);
          possibleTargets = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase());
          possibleTargets = sortAndFilterByDistance(possibleTargets, currentMainObject.baseTypeName, graph);
          if (possibleTargets.length > 0) reasonCodes.push('super-hierarchy');
        } else if (varType.toLowerCase() === 'this' && currentMainObject) {
          const members = getMembersForType(currentMainObject.name, currentUri, kb, graph, options.hotContext);
          possibleTargets = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase());
          possibleTargets = sortAndFilterByDistance(possibleTargets, currentMainObject.name, graph);
          if (possibleTargets.length > 0) reasonCodes.push('member-hierarchy');
        } else {
          const members = getMembersForType(varType, currentUri, kb, graph, options.hotContext);
          possibleTargets = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase());
          possibleTargets = sortAndFilterByDistance(possibleTargets, varType, graph);
          if (possibleTargets.length > 0) reasonCodes.push('qualifier-type');
        }
      }
    } else {
      if (options.line !== undefined) {
        const scope = kb.getScopeAt(currentUri, options.line);
        if (scope) {
          const localMatch = scope.symbols.find((symbol) => symbol.name.toLowerCase() === identifier.toLowerCase());
          if (localMatch) {
            recordTraceStep('targets:local-scope', { scope: scope.id });
            return {
              targets: [localMatch],
              reasonCodes: ['local-scope'] as QueryReasonCode[]
            };
          }
        }
      }

      if (currentMainObject) {
        const members = getMembersForType(currentMainObject.name, currentUri, kb, graph, options.hotContext);
        const memberTargets = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase());
        if (memberTargets.length > 0) {
          possibleTargets = sortAndFilterByDistance(memberTargets, currentMainObject.name, graph);
          reasonCodes.push('member-hierarchy');
          recordTraceStep('targets:member-hierarchy', { count: possibleTargets.length });
        }
      }

      if (possibleTargets.length === 0) {
        possibleTargets = kb.findAllDefinitions(identifier);
        if (possibleTargets.length > 0) {
          reasonCodes.push('global-fallback');
          recordTraceStep('targets:global-fallback', { count: possibleTargets.length });
        }
      }
    }

    return {
      targets: possibleTargets,
      reasonCodes
    };
  });

  return {
    context,
    targets: result.targets,
    reasonCodes: result.reasonCodes,
    trace
  };
}

/**
 * Resuelve un contexto de invocación (identifier + qualifier) para encontrar
 * las entidades exactas a las que apunta.
 * Utiliza el InheritanceGraph para calcular herencia y overrides.
 */
export function resolveTargetEntity(
  context: InvocationContext,
  currentDocumentUri: string,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  line?: number
): Entity[] {
  return resolveTargetEntityDetailed(context, currentDocumentUri, kb, graph, { line }).targets;
}

/**
 * Ordena los targets encontrados por distancia en el árbol de herencia,
 * y devuelve solo los que están a la mínima distancia encontrada (el override más cercano).
 */
export function sortAndFilterByDistance(targets: Entity[], fromType: string, graph: InheritanceGraph): Entity[] {
  if (targets.length <= 1) return targets;

  const withDistance = targets.map(t => ({
    entity: t,
    distance: t.containerName ? graph.getTypeDistance(fromType, t.containerName) : Number.POSITIVE_INFINITY
  }));

  withDistance.sort((a, b) => a.distance - b.distance);

  const minDistance = withDistance[0].distance;
  return withDistance.filter(x => x.distance === minDistance).map(x => x.entity);
}

/**
 * Resuelve un cualificador a su tipo de dato base (e.g. 'super', 'this', o 'n_cst_math').
 * Devuelve 'super' o 'this' directamente si es el caso, para que el llamante maneje el contexto.
 */
export function resolveQualifierType(
  qualifier: string,
  currentDocumentUri: string,
  kb: KnowledgeBase,
  line?: number
): string | undefined {
  const qLower = qualifier.toLowerCase();
  if (qLower === 'super' || qLower === 'this') {
    return qLower;
  }

  const currentUri = normalizeUri(currentDocumentUri);
  let varType: string | undefined;

  if (line !== undefined) {
    const scope = kb.getScopeAt(currentUri, line);
    if (scope) {
      const local = scope.symbols.find(s => s.name.toLowerCase() === qLower);
      if (local) varType = local.datatype;
    }
  }

  if (!varType) {
    const documentEntities = kb.getEntitiesByUri(currentUri);
    const instanceVar = documentEntities.find(
      e => e.kind === EntityKind.Variable && e.name.toLowerCase() === qLower
    );
    if (instanceVar) varType = instanceVar.datatype;
  }

  if (varType) {
    return varType;
  }

  const typeTarget = kb.findDefinition(qLower);
  if (typeTarget && typeTarget.kind === EntityKind.Type) {
    return typeTarget.name;
  }

  return undefined;
}
