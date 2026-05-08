import {
  findEntriesByDomainAndLookupKey,
  findEntriesByKindAndLookupKey,
  findApplicableEventsForOwnerType,
  findApplicableMembersForOwnerType,
  findSystemSymbolsByLookupKey,
  getSystemCatalogSize,
  isKnownSystemOwnerType,
  listSystemSymbolsByDomain,
  listSystemDataWindowConstants,
  listSystemDataWindowEvents,
  listSystemDataWindowExpressionFunctions,
  listSystemDataWindowFunctions,
  listDataWindowConstantValuesForType,
  listValuesForEnumeratedType,
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
  resolveSystemDataWindowConstant,
  resolveSystemDataWindowExpressionFunction,
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
  listEnumeratedTypes,
  listPronouns,
  listOperators,
  listEnumeratedValues,
  listSystemGlobals,
  PB_LANGUAGE_SYMBOL_RESOLUTION_PRIORITY,
  resolveEnumValueForExpectedType,
  resolveKeyword,
  resolveReservedWord,
  resolveDatatype,
  resolveEnumeratedType,
  resolveEnumeratedValue,
  resolveSystemGlobal,
  resolvePronoun,
  resolveLanguageSymbol,
} from './services/queryService';
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

  /** Recupera un símbolo por su ID único. */
  getSymbolById(id: string): PbSystemSymbolEntry | undefined {
    return listSystemSymbols().find(s => s.id === id);
  }

  // -- Listas por categoría -------------------------------------------

  listGlobalFunctions(): readonly PbSystemSymbolEntry[] { return listSystemGlobalFunctions(); }
  listObjectFunctions(): readonly PbSystemSymbolEntry[] { return listSystemObjectFunctions(); }
  listDataWindowFunctions(): readonly PbSystemSymbolEntry[] { return listSystemDataWindowFunctions(); }
  listDataWindowExpressionFunctions(): readonly PbSystemSymbolEntry[] { return listSystemDataWindowExpressionFunctions(); }
  listDataWindowConstants(): readonly PbSystemSymbolEntry[] { return listSystemDataWindowConstants(); }
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
    return listSystemSymbolsByDomain(domain);
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
  resolveDataWindowExpressionFunction(name: string): PbSystemSymbolEntry | undefined {
    return resolveSystemDataWindowExpressionFunction(name);
  }
  resolveDataWindowConstant(name: string): PbSystemSymbolEntry | undefined {
    return resolveSystemDataWindowConstant(name);
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
    return isKnownSystemOwnerType(name);
  }

  // -- Métricas / introspección ---------------------------------------

  /** Tamaño total del catálogo (manual + generated). */
  size(): number {
    return getSystemCatalogSize();
  }

  // -- Catalog v2: language construct queries --------------------------

  listKeywords(): readonly PbSystemSymbolEntry[] { return listKeywords(); }
  listReservedWords(): readonly PbSystemSymbolEntry[] { return listReservedWords(); }
  listDatatypes(): readonly PbSystemSymbolEntry[] { return listDatatypes(); }
  listSystemTypes(): readonly PbSystemSymbolEntry[] { return listSystemTypes(); }
  listEnumeratedTypes(): readonly PbSystemSymbolEntry[] { return listEnumeratedTypes(); }
  listPronouns(): readonly PbSystemSymbolEntry[] { return listPronouns(); }
  listOperators(): readonly PbSystemSymbolEntry[] { return listOperators(); }
  listEnumeratedValues(): readonly PbSystemSymbolEntry[] { return listEnumeratedValues(); }
  listSystemGlobals(): readonly PbSystemSymbolEntry[] { return listSystemGlobals(); }

  resolveKeyword(name: string): PbSystemSymbolEntry | undefined { return resolveKeyword(name); }
  resolveReservedWord(name: string): PbSystemSymbolEntry | undefined { return resolveReservedWord(name); }
  resolveDatatype(name: string): PbSystemSymbolEntry | undefined { return resolveDatatype(name); }
  resolveEnumeratedType(name: string): PbSystemSymbolEntry | undefined { return resolveEnumeratedType(name); }
  resolveEnumeratedValue(name: string): PbSystemSymbolEntry | undefined { return resolveEnumeratedValue(name); }
  resolveSystemGlobal(name: string): PbSystemSymbolEntry | undefined { return resolveSystemGlobal(name); }
  resolvePronoun(name: string): PbSystemSymbolEntry | undefined { return resolvePronoun(name); }
  resolveLanguageSymbol(name: string): PbSystemSymbolEntry | undefined { return resolveLanguageSymbol(name); }
  listEnumeratedValuesForType(typeName: string): readonly PbSystemSymbolEntry[] { return listValuesForEnumeratedType(typeName); }
  listDataWindowConstantValuesForType(typeName: string): readonly PbSystemSymbolEntry[] {
    return listDataWindowConstantValuesForType(typeName);
  }
  resolveEnumeratedValueForType(valueName: string, typeName: string): PbSystemSymbolEntry | undefined {
    return resolveEnumValueForExpectedType(valueName, typeName);
  }
  findByDomainAndLookupKey(domain: PbSystemSymbolDomain, name: string): readonly PbSystemSymbolEntry[] {
    return findEntriesByDomainAndLookupKey(domain, name);
  }
  findByKindAndLookupKey(kind: PbSystemSymbolKind, name: string): readonly PbSystemSymbolEntry[] {
    return findEntriesByKindAndLookupKey(kind, name);
  }
  getLanguageSymbolResolutionPriority(): readonly PbSystemSymbolKind[] {
    return PB_LANGUAGE_SYMBOL_RESOLUTION_PRIORITY;
  }
}
