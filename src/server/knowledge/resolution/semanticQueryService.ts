import { KnowledgeBase } from '../KnowledgeBase';
import { InheritanceGraph } from './InheritanceGraph';
import { InvocationContext } from '../../utils/invocationContext';
import { Entity, EntityKind } from '../types';
import { normalizeUri } from '../../system/uriUtils';

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
  const { identifier, qualifier } = context;
  const currentUri = normalizeUri(currentDocumentUri);

  const allEntities = kb.getAllEntities();
  const currentMainObject = allEntities.find(
    e => normalizeUri(e.uri) === currentUri && e.kind === EntityKind.Type
  );

  let possibleTargets: Entity[] = [];

  if (qualifier) {
    const qLower = qualifier.toLowerCase();

    if (qLower === 'super') {
      if (currentMainObject && currentMainObject.baseTypeName) {
        const members = graph.getMembers(currentMainObject.baseTypeName);
        possibleTargets = members.filter(m => m.name.toLowerCase() === identifier.toLowerCase());
        possibleTargets = sortAndFilterByDistance(possibleTargets, currentMainObject.baseTypeName, graph);
      }
    } else if (qLower === 'this') {
      if (currentMainObject) {
        const members = graph.getMembers(currentMainObject.name);
        possibleTargets = members.filter(m => m.name.toLowerCase() === identifier.toLowerCase());
        possibleTargets = sortAndFilterByDistance(possibleTargets, currentMainObject.name, graph);
      }
    } else {
      let varType: string | undefined;

      // Intentar resolver como variable local en el scope
      if (line !== undefined) {
        const scope = kb.getScopeAt(currentUri, line);
        if (scope) {
          const local = scope.symbols.find(s => s.name.toLowerCase() === qLower);
          if (local) varType = local.datatype;
        }
      }

      // Fallback: variable de instancia en el mismo archivo
      if (!varType) {
        const instanceVar = allEntities.find(
          e => normalizeUri(e.uri) === currentUri && e.kind === EntityKind.Variable && e.name.toLowerCase() === qLower
        );
        if (instanceVar) varType = instanceVar.datatype;
      }

      if (varType) {
        const members = graph.getMembers(varType);
        possibleTargets = members.filter(m => m.name.toLowerCase() === identifier.toLowerCase());
        possibleTargets = sortAndFilterByDistance(possibleTargets, varType, graph);
      } else {
        const typeTarget = kb.findDefinition(qLower);
        if (typeTarget && typeTarget.kind === EntityKind.Type) {
          const members = graph.getMembers(typeTarget.name);
          possibleTargets = members.filter(m => m.name.toLowerCase() === identifier.toLowerCase());
          possibleTargets = sortAndFilterByDistance(possibleTargets, typeTarget.name, graph);
        }
      }
    }
  } else {
    // 1. Prioridad: Variables Locales en el Scope actual
    if (line !== undefined) {
      const scope = kb.getScopeAt(currentUri, line);
      if (scope) {
        const localMatch = scope.symbols.find(s => s.name.toLowerCase() === identifier.toLowerCase());
        if (localMatch) {
          return [localMatch];
        }
      }
    }

    // 2. Miembros de la clase actual (instancia/herencia)
    if (currentMainObject) {
      const members = graph.getMembers(currentMainObject.name);
      const memberTargets = members.filter(m => m.name.toLowerCase() === identifier.toLowerCase());
      if (memberTargets.length > 0) {
        possibleTargets = sortAndFilterByDistance(memberTargets, currentMainObject.name, graph);
      }
    }

    if (possibleTargets.length === 0) {
      possibleTargets = kb.findAllDefinitions(identifier);
    }
  }

  return possibleTargets;
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
