import {
  findApplicableEventsForOwnerType,
  findApplicableMembersForOwnerType,
  findSystemSymbolsByLookupKey,
  listSystemDataWindowEvents,
  listSystemDataWindowFunctions,
  listSystemEvents,
  listSystemGlobalFunctions,
  listSystemObjectEvents,
  listSystemObjectFunctions,
  listSystemStatements,
  listSystemSymbols,
  listSystemSymbolsByDataset,
  listSystemSymbolsByKind,
  listSystemSymbolsByNamespace,
  resolveSystemDataWindowEvent,
  resolveSystemDataWindowFunction,
  resolveSystemDataWindowFunctionForOwner,
  resolveSystemEventForOwner,
  resolveSystemGlobalFunction,
  resolveSystemMemberFunctionForOwner,
  resolveSystemObjectEvent,
  resolveSystemObjectFunction,
  resolveSystemObjectFunctionForOwner,
  // -- Catalog v2: language construct queries --
  listKeywords,
  listReservedWords,
  listDatatypes,
  listSystemTypes,
  listPronouns,
  listOperators,
  listEnumeratedValues,
  listSystemGlobals,
  resolveKeyword,
  resolveReservedWord,
  resolveDatatype,
  resolveSystemGlobal,
  resolvePronoun,
  resolveLanguageSymbol,
} from './services/queryService';
import { isKnownNativeAncestorType } from './nativeAncestors';
import { PB_SYSTEM_SYMBOL_REGISTRY } from './registry/registry';
import {
  PbSystemSymbolDataset,
  PbSystemSymbolDomain,
  PbSystemSymbolEntry,
  PbSystemSymbolKind,
  PbSystemSymbolNamespace
} from './types';

/**
 * Catálogo del sistema PowerBuilder.
 *
 * Fachada delgada sobre el `PB_SYSTEM_SYMBOL_REGISTRY` (manual + generated).
 * Mantiene la API histórica `findSystemSymbol(name)` y añade resolutores
 * sensibles a dominio y owner-type para hover / completion / signature help.
 */
export class SystemCatalog {
  // -- API histórica ---------------------------------------------------

  /** Búsqueda case-insensitive por nombre. Devuelve todas las sobrecargas. */
  findSystemSymbol(name: string): PbSystemSymbolEntry[] {
    return [...findSystemSymbolsByLookupKey(name)];
  }

  /** Conjunto completo de símbolos indexados (autocompletado global). */
  getAllSystemSymbols(): PbSystemSymbolEntry[] {
    return [...listSystemSymbols()];
  }

  // -- Listas por categoría -------------------------------------------

  listGlobalFunctions(): readonly PbSystemSymbolEntry[] { return listSystemGlobalFunctions(); }
  listObjectFunctions(): readonly PbSystemSymbolEntry[] { return listSystemObjectFunctions(); }
  listDataWindowFunctions(): readonly PbSystemSymbolEntry[] { return listSystemDataWindowFunctions(); }
  listObjectEvents(): readonly PbSystemSymbolEntry[] { return listSystemObjectEvents(); }
  listDataWindowEvents(): readonly PbSystemSymbolEntry[] { return listSystemDataWindowEvents(); }
  listEvents(): readonly PbSystemSymbolEntry[] { return listSystemEvents(); }
  listStatements(): readonly PbSystemSymbolEntry[] { return listSystemStatements(); }

  listByNamespace(ns: PbSystemSymbolNamespace): readonly PbSystemSymbolEntry[] {
    return listSystemSymbolsByNamespace(ns);
  }
  listByKind(kind: PbSystemSymbolKind): readonly PbSystemSymbolEntry[] {
    return listSystemSymbolsByKind(kind);
  }
  listByDomain(domain: PbSystemSymbolDomain): readonly PbSystemSymbolEntry[] {
    return PB_SYSTEM_SYMBOL_REGISTRY.indexes.byDomain.get(domain) ?? [];
  }
  listByDataset(dataset: PbSystemSymbolDataset): readonly PbSystemSymbolEntry[] {
    return listSystemSymbolsByDataset(dataset);
  }

  // -- Resolutores específicos ----------------------------------------

  resolveGlobalFunction(name: string): PbSystemSymbolEntry | undefined {
    return resolveSystemGlobalFunction(name);
  }
  resolveObjectFunction(name: string): PbSystemSymbolEntry | undefined {
    return resolveSystemObjectFunction(name);
  }
  resolveDataWindowFunction(name: string): PbSystemSymbolEntry | undefined {
    return resolveSystemDataWindowFunction(name);
  }
  resolveObjectEvent(name: string): PbSystemSymbolEntry | undefined {
    return resolveSystemObjectEvent(name);
  }
  resolveDataWindowEvent(name: string): PbSystemSymbolEntry | undefined {
    return resolveSystemDataWindowEvent(name);
  }

  // -- Resolutores sensibles a owner-type -----------------------------

  resolveObjectFunctionForOwner(name: string, ownerTypes: readonly string[]): PbSystemSymbolEntry | undefined {
    return resolveSystemObjectFunctionForOwner(name, ownerTypes);
  }
  resolveDataWindowFunctionForOwner(name: string, ownerTypes: readonly string[]): PbSystemSymbolEntry | undefined {
    return resolveSystemDataWindowFunctionForOwner(name, ownerTypes);
  }
  resolveMemberFunctionForOwner(name: string, ownerTypes: readonly string[]): PbSystemSymbolEntry | undefined {
    return resolveSystemMemberFunctionForOwner(name, ownerTypes);
  }
  resolveEventForOwner(name: string, ownerTypes: readonly string[]): PbSystemSymbolEntry | undefined {
    return resolveSystemEventForOwner(name, ownerTypes);
  }
  listMembersForOwner(ownerTypes: readonly string[]): readonly PbSystemSymbolEntry[] {
    return findApplicableMembersForOwnerType(ownerTypes);
  }
  listEventsForOwner(ownerTypes: readonly string[]): readonly PbSystemSymbolEntry[] {
    return findApplicableEventsForOwnerType(ownerTypes);
  }

  isKnownOwnerType(name: string): boolean {
    const normalizedName = name.trim().toLowerCase();
    return normalizedName.length > 0
      && (PB_SYSTEM_SYMBOL_REGISTRY.indexes.byOwnerType.has(normalizedName)
        || isKnownNativeAncestorType(normalizedName));
  }

  // -- Métricas / introspección ---------------------------------------

  /** Tamaño total del catálogo (manual + generated). */
  size(): number {
    return PB_SYSTEM_SYMBOL_REGISTRY.entries.length;
  }

  // -- Catalog v2: language construct queries --------------------------

  listKeywords(): readonly PbSystemSymbolEntry[] { return listKeywords(); }
  listReservedWords(): readonly PbSystemSymbolEntry[] { return listReservedWords(); }
  listDatatypes(): readonly PbSystemSymbolEntry[] { return listDatatypes(); }
  listSystemTypes(): readonly PbSystemSymbolEntry[] { return listSystemTypes(); }
  listPronouns(): readonly PbSystemSymbolEntry[] { return listPronouns(); }
  listOperators(): readonly PbSystemSymbolEntry[] { return listOperators(); }
  listEnumeratedValues(): readonly PbSystemSymbolEntry[] { return listEnumeratedValues(); }
  listSystemGlobals(): readonly PbSystemSymbolEntry[] { return listSystemGlobals(); }

  resolveKeyword(name: string): PbSystemSymbolEntry | undefined { return resolveKeyword(name); }
  resolveReservedWord(name: string): PbSystemSymbolEntry | undefined { return resolveReservedWord(name); }
  resolveDatatype(name: string): PbSystemSymbolEntry | undefined { return resolveDatatype(name); }
  resolveSystemGlobal(name: string): PbSystemSymbolEntry | undefined { return resolveSystemGlobal(name); }
  resolvePronoun(name: string): PbSystemSymbolEntry | undefined { return resolvePronoun(name); }
  resolveLanguageSymbol(name: string): PbSystemSymbolEntry | undefined { return resolveLanguageSymbol(name); }
}
