import { Location, Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { getInvocationContext } from '../utils/invocationContext';
import { Entity, EntityKind } from '../knowledge/types';
import { normalizeUri } from '../system/uriUtils';

export function provideDefinition(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  graph: InheritanceGraph
): Location | Location[] | null {
  const lines = document.getText().split(/\r?\n/);
  const context = getInvocationContext(lines, position);

  if (!context) return null;

  const { identifier, qualifier } = context;
  const currentUri = normalizeUri(document.uri);

  // Determinar el objeto principal de este archivo (la primera clase/tipo que definimos aquí)
  // Esto es necesario para resolver 'this', 'super' y llamadas implícitas.
  const allEntities = kb.getAllEntities();
  const currentMainObject = allEntities.find(
    e => normalizeUri(e.uri) === currentUri && e.kind === EntityKind.Type
  );

  let possibleTargets: Entity[] = [];

  if (qualifier) {
    const qLower = qualifier.toLowerCase();

    if (qLower === 'super') {
      // 1. super::identifier
      if (currentMainObject && currentMainObject.baseTypeName) {
        const members = graph.getMembers(currentMainObject.baseTypeName);
        possibleTargets = members.filter(m => m.name.toLowerCase() === identifier.toLowerCase());
        
        // Si usamos super, queremos SOLO la implementación del ancestro, no la local si existe.
        // getTypeDistance nos ayudará: ordenamos por distancia desde el ancestro.
        possibleTargets = sortAndFilterByDistance(possibleTargets, currentMainObject.baseTypeName, graph);
      }
    } else if (qLower === 'this') {
      // 2. this.identifier
      if (currentMainObject) {
        const members = graph.getMembers(currentMainObject.name);
        possibleTargets = members.filter(m => m.name.toLowerCase() === identifier.toLowerCase());
        possibleTargets = sortAndFilterByDistance(possibleTargets, currentMainObject.name, graph);
      }
    } else {
      // 3. variable.identifier (e.g., lnv_service.of_init)
      // Buscamos la variable en el archivo actual
      const localVars = allEntities.filter(
        e => normalizeUri(e.uri) === currentUri && e.kind === EntityKind.Variable && e.name.toLowerCase() === qLower
      );

      if (localVars.length > 0) {
        const varType = localVars[0].datatype;
        if (varType) {
          const members = graph.getMembers(varType);
          possibleTargets = members.filter(m => m.name.toLowerCase() === identifier.toLowerCase());
          possibleTargets = sortAndFilterByDistance(possibleTargets, varType, graph);
        }
      } else {
        // 4. estático (e.g., w_main.of_init)
        // El cualificador podría ser un tipo directamente
        const typeTarget = kb.findDefinition(qLower);
        if (typeTarget && typeTarget.kind === EntityKind.Type) {
          const members = graph.getMembers(typeTarget.name);
          possibleTargets = members.filter(m => m.name.toLowerCase() === identifier.toLowerCase());
          possibleTargets = sortAndFilterByDistance(possibleTargets, typeTarget.name, graph);
        }
      }
    }
  } else {
    // Sin cualificador
    // Primero, miramos si es un miembro del objeto actual (implícito 'this')
    if (currentMainObject) {
      const members = graph.getMembers(currentMainObject.name);
      const memberTargets = members.filter(m => m.name.toLowerCase() === identifier.toLowerCase());
      if (memberTargets.length > 0) {
        possibleTargets = sortAndFilterByDistance(memberTargets, currentMainObject.name, graph);
      }
    }

    // Si no encontramos nada en la jerarquía, buscamos globalmente
    if (possibleTargets.length === 0) {
      possibleTargets = kb.findAllDefinitions(identifier);
    }
  }

  if (possibleTargets.length === 0) return null;

  const locations = possibleTargets.map(entity =>
    Location.create(
      entity.uri,
      {
        start: Position.create(entity.line, entity.character),
        end: Position.create(entity.line, entity.character + entity.name.length)
      }
    )
  );

  return locations.length === 1 ? locations[0] : locations;
}

/**
 * Ordena los targets encontrados por distancia en el árbol de herencia,
 * y devuelve solo los que están a la mínima distancia encontrada (el override más cercano).
 */
function sortAndFilterByDistance(targets: Entity[], fromType: string, graph: InheritanceGraph): Entity[] {
  if (targets.length <= 1) return targets;

  // Anotamos distancias
  const withDistance = targets.map(t => ({
    entity: t,
    distance: t.containerName ? graph.getTypeDistance(fromType, t.containerName) : Number.POSITIVE_INFINITY
  }));

  // Ordenamos de menor a mayor distancia
  withDistance.sort((a, b) => a.distance - b.distance);

  // Solo nos quedamos con el "nivel" más cercano
  const minDistance = withDistance[0].distance;
  return withDistance.filter(x => x.distance === minDistance).map(x => x.entity);
}

