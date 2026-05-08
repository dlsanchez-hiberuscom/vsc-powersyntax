import { Entity, EntityKind } from '../types';
import { PbSystemSymbolEntry } from './types';
import { systemProvenanceToLineage } from './normalization';

/**
 * Convierte una entrada del catálogo de sistema (PbSystemSymbolEntry) a la entidad semántica unificada (Entity).
 * Esto permite que el motor de resolución trate símbolos del sistema y del workspace de forma homogénea.
 */
export function systemSymbolToEntity(entry: PbSystemSymbolEntry): Entity {
  return {
    id: entry.normalizedName,
    name: entry.name,
    kind: mapSystemKindToEntityKind(entry.kind),
    uri: `catalog:${entry.id}`,
    line: 0,
    character: 0,
    signature: entry.signatures?.[0]?.label,
    documentation: entry.summary,
    containerName: entry.normalizedOwnerTypes?.[0],
    containerKind: entry.normalizedOwnerTypes && entry.normalizedOwnerTypes.length > 0 ? 'system-object' : undefined,
    datatype: entry.returnType,
    parameters: entry.signatures?.[0]?.parameters?.map(p => ({
      label: p.label,
      documentation: p.documentation
    })),
    scope: entry.invocation === 'global' ? 'Global' : 'Instancia',
    declarationScope: entry.kind === 'callable' || entry.kind === 'event' ? 'callable' : (entry.kind === 'system-type' || entry.kind === 'enumerated-type' || entry.kind === 'datatype' ? 'type' : 'member'),
    lineage: systemProvenanceToLineage(entry.provenance),
    implementationKind: entry.kind === 'callable' ? 'function' : (entry.kind === 'event' ? 'event' : (entry.kind === 'property' || entry.kind === 'constant' ? 'instance-var' : undefined)),
    returnType: entry.returnType,
    parameterCount: entry.signatures?.[0]?.parameters?.length,
  };
}

function mapSystemKindToEntityKind(kind: string): EntityKind {
  switch (kind) {
    case 'callable':
      return EntityKind.Function;
    case 'event':
      return EntityKind.Event;
    case 'datatype':
    case 'system-type':
    case 'enumerated-type':
      return EntityKind.Type;
    case 'system-global':
    case 'property':
    case 'constant':
    case 'enumerated-value':
      return EntityKind.Variable;
    default:
      return EntityKind.Variable;
  }
}
