import type { ApiCurrentObjectAncestor } from '../../shared/publicApi';
import { resolveByLibraryOrder } from '../knowledge/resolution/libraryOrder';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { Entity, EntityKind } from '../knowledge/types';
import type { WorkspaceState } from '../workspace/workspaceState';

export interface AncestorDescriptorLookup {
  findAllDefinitions(symbolName: string): Entity[];
}

export interface AncestorDescriptorSelectionOptions {
  activeUri?: string | null;
  workspaceState?: WorkspaceState;
}

function selectPreferredTypeEntity(
  name: string,
  kb: AncestorDescriptorLookup,
  options?: AncestorDescriptorSelectionOptions
): Entity | undefined {
  const definitions = kb.findAllDefinitions(name).filter((candidate) => candidate.kind === EntityKind.Type);
  if (definitions.length === 0) {
    return undefined;
  }

  if (!options?.workspaceState) {
    return definitions[0];
  }

  return resolveByLibraryOrder(definitions, {
    activeUri: options.activeUri ?? null,
    state: options.workspaceState,
  })[0];
}

export function resolveAncestorDescriptor(
  name: string,
  kb: AncestorDescriptorLookup,
  systemCatalog?: Pick<SystemCatalog, 'isKnownOwnerType'>,
  options?: AncestorDescriptorSelectionOptions,
): ApiCurrentObjectAncestor {
  const entity = selectPreferredTypeEntity(name, kb, options);

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