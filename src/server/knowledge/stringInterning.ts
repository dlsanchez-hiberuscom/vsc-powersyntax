import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import type { InternalDocumentSymbol } from '../model/types';
import type { DocumentCacheEntry, Entity, EntityLineage, Scope } from './types';
import type { InternString } from './ManagedStringInterner';

export function internDocumentCacheEntry(
  entry: DocumentCacheEntry,
  intern: InternString
): DocumentCacheEntry {
  return {
    ...entry,
    version: typeof entry.version === 'string' ? intern(entry.version) : entry.version,
    symbols: entry.symbols.map((symbol) => internDocumentSymbol(symbol, intern)),
    facts: entry.facts.map((fact) => internEntity(fact, intern)),
    scopes: internScopes(entry.scopes, intern),
    ...(entry.snapshot ? { snapshot: internSemanticSnapshot(entry.snapshot, intern) } : {}),
  };
}

export function internEntity(entity: Entity, intern: InternString): Entity {
  return {
    ...entity,
    id: intern(entity.id),
    name: intern(entity.name),
    kind: intern(entity.kind) as Entity['kind'],
    uri: intern(entity.uri),
    ...(entity.signature !== undefined ? { signature: intern(entity.signature) } : {}),
    ...(entity.documentation !== undefined ? { documentation: intern(entity.documentation) } : {}),
    ...(entity.containerName !== undefined ? { containerName: intern(entity.containerName) } : {}),
    ...(entity.containerSignature !== undefined ? { containerSignature: intern(entity.containerSignature) } : {}),
    ...(entity.fileObjectName !== undefined ? { fileObjectName: intern(entity.fileObjectName) } : {}),
    ...(entity.baseTypeName !== undefined ? { baseTypeName: intern(entity.baseTypeName) } : {}),
    ...(entity.datatype !== undefined ? { datatype: intern(entity.datatype) } : {}),
    ...(entity.parameters ? {
      parameters: entity.parameters.map((parameter) => ({
        label: intern(parameter.label),
        ...(parameter.documentation !== undefined ? { documentation: intern(parameter.documentation) } : {}),
      }))
    } : {}),
    ...(entity.scope !== undefined ? { scope: intern(entity.scope) as Entity['scope'] } : {}),
    ...(entity.declarationScope !== undefined ? { declarationScope: intern(entity.declarationScope) as Entity['declarationScope'] } : {}),
    ...(entity.access !== undefined ? { access: intern(entity.access) } : {}),
    ...(entity.containerKind !== undefined ? { containerKind: intern(entity.containerKind) } : {}),
    ...(entity.implementationKind !== undefined ? { implementationKind: intern(entity.implementationKind) as Entity['implementationKind'] } : {}),
    ...(entity.returnType !== undefined ? { returnType: intern(entity.returnType) } : {}),
    ...(entity.ownerName !== undefined ? { ownerName: intern(entity.ownerName) } : {}),
    ...(entity.externalLibraryName !== undefined ? { externalLibraryName: intern(entity.externalLibraryName) } : {}),
    ...(entity.externalAlias !== undefined ? { externalAlias: intern(entity.externalAlias) } : {}),
    ...(entity.externalDependencyKind !== undefined ? { externalDependencyKind: intern(entity.externalDependencyKind) as Entity['externalDependencyKind'] } : {}),
    ...(entity.signatureLabel !== undefined ? { signatureLabel: intern(entity.signatureLabel) } : {}),
    ...(entity.kindLabel !== undefined ? { kindLabel: intern(entity.kindLabel) } : {}),
    ...(entity.lineage ? { lineage: internLineage(entity.lineage, intern) } : {}),
  };
}

export function internScopes(scopes: Scope[], intern: InternString): Scope[] {
  const seen = new Map<Scope, Scope>();
  return scopes.map((scope) => internScope(scope, intern, seen));
}

export function internSemanticSnapshot(
  snapshot: SemanticDocumentSnapshot,
  intern: InternString
): SemanticDocumentSnapshot {
  const interned = structuredClone(snapshot);
  interned.uri = intern(interned.uri);
  interned.identity = intern(interned.identity);
  interned.pass = intern(interned.pass) as SemanticDocumentSnapshot['pass'];
  interned.readiness = intern(interned.readiness) as SemanticDocumentSnapshot['readiness'];
  interned.containerModel = {
    sections: interned.containerModel.sections,
    typeBlocks: interned.containerModel.typeBlocks.map((block) => ({
      ...block,
      name: intern(block.name),
      container: internOptional(block.container, intern),
    })),
  };
  interned.symbols = interned.symbols.map((symbol) => internEntity(symbol, intern));
  interned.scopes = internScopes(interned.scopes, intern);
  interned.logicalStatements = interned.logicalStatements.map((statement) => ({
    ...statement,
    text: 'text' in statement && typeof statement.text === 'string'
      ? intern(statement.text)
      : statement.text,
  }));
  interned.maskedText = {
    lines: interned.maskedText.lines,
    masks: interned.maskedText.masks,
  };
  return interned;
}

function internDocumentSymbol(symbol: InternalDocumentSymbol, intern: InternString): InternalDocumentSymbol {
  return {
    ...symbol,
    name: intern(symbol.name),
    detail: internOptional(symbol.detail, intern),
    children: symbol.children?.map((child) => internDocumentSymbol(child, intern)),
  };
}

function internScope(scope: Scope, intern: InternString, seen: Map<Scope, Scope>): Scope {
  const existing = seen.get(scope);
  if (existing) {
    return existing;
  }

  const cloned: Scope = {
    ...scope,
    id: intern(scope.id),
    kind: intern(scope.kind) as Scope['kind'],
    uri: intern(scope.uri),
    symbols: scope.symbols.map((symbol) => internEntity(symbol, intern)),
    children: [],
  };
  seen.set(scope, cloned);

  cloned.parent = scope.parent ? internScope(scope.parent, intern, seen) : undefined;
  cloned.children = scope.children.map((child) => internScope(child, intern, seen));
  return cloned;
}

function internOptional<T extends string | undefined>(value: T, intern: InternString): T {
  if (value === undefined) {
    return value;
  }
  return intern(value) as T;
}

function internLineage(lineage: EntityLineage, intern: InternString): EntityLineage {
  return {
    ...(lineage.sourceKind !== undefined ? { sourceKind: intern(lineage.sourceKind) } : {}),
    ...(lineage.sourceOrigin !== undefined ? { sourceOrigin: intern(lineage.sourceOrigin) as EntityLineage['sourceOrigin'] } : {}),
    ...(lineage.authority !== undefined ? { authority: intern(lineage.authority) } : {}),
    ...(lineage.phase !== undefined ? { phase: intern(lineage.phase) } : {}),
    ...(lineage.role !== undefined ? { role: intern(lineage.role) } : {}),
    ...(lineage.inheritedFrom !== undefined ? { inheritedFrom: intern(lineage.inheritedFrom) } : {}),
    ...(lineage.confidence !== undefined ? { confidence: intern(lineage.confidence) } : {}),
  };
}