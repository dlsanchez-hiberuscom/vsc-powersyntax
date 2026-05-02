import type { ApiCurrentObjectAncestor } from '../../shared/publicApi';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { Entity, EntityKind } from '../knowledge/types';

export interface AncestorDescriptorLookup {
  findAllDefinitions(symbolName: string): Entity[];
}

export function resolveAncestorDescriptor(
  name: string,
  kb: AncestorDescriptorLookup,
  systemCatalog?: Pick<SystemCatalog, 'isKnownOwnerType'>
): ApiCurrentObjectAncestor {
  const entity = kb.findAllDefinitions(name).find((candidate) => candidate.kind === EntityKind.Type);

  if (entity) {
    return {
      name,
      uri: entity.uri,
      ...(entity.lineage?.sourceOrigin ? { sourceOrigin: entity.lineage.sourceOrigin } : {}),
    };
  }

  if (systemCatalog?.isKnownOwnerType(name)) {
    return {
      name,
      isSystemType: true,
    };
  }

  return { name };
}