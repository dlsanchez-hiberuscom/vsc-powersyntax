import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import type { Entity } from './types';

export interface SemanticSnapshotDiff {
  changed: boolean;
  fingerprintChanged: boolean;
  exportedIdsAdded: string[];
  exportedIdsRemoved: string[];
  exportedIdsUpdated: string[];
  dependencyKeysAdded: string[];
  dependencyKeysRemoved: string[];
}

const BUILTIN_DEPENDENCIES = new Set([
  'any',
  'blob',
  'boolean',
  'byte',
  'char',
  'date',
  'datetime',
  'decimal',
  'double',
  'function_object',
  'graph',
  'integer',
  'long',
  'longlong',
  'menu',
  'nonvisualobject',
  'pbobject',
  'powerobject',
  'real',
  'string',
  'structure',
  'time',
  'transaction',
  'uinteger',
  'ulong',
  'userobject',
  'window'
]);

function normalizeDependencyKey(raw: string | undefined): string | null {
  if (!raw) return null;
  const normalized = raw.trim().replace(/\[\]$/, '').toLowerCase();
  if (!normalized || BUILTIN_DEPENDENCIES.has(normalized)) {
    return null;
  }
  return normalized;
}

function serializeEntity(entity: Entity): string {
  return [
    entity.kind,
    entity.name,
    entity.containerName ?? '',
    entity.baseTypeName ?? '',
    entity.datatype ?? '',
    entity.returnType ?? '',
    entity.signature ?? '',
    entity.scope ?? '',
    entity.access ?? '',
    String(entity.parameterCount ?? ''),
    String(entity.isExternal ?? false),
    String(entity.isPrototype ?? false)
  ].join('|');
}

function buildExportSignatureIndex(snapshot: SemanticDocumentSnapshot | undefined): Map<string, string> {
  const index = new Map<string, string>();
  if (!snapshot) return index;

  const grouped = new Map<string, string[]>();
  for (const symbol of snapshot.symbols) {
    const bucket = grouped.get(symbol.id) ?? [];
    bucket.push(serializeEntity(symbol));
    grouped.set(symbol.id, bucket);
  }

  for (const [id, signatures] of grouped.entries()) {
    index.set(id, signatures.sort().join('||'));
  }
  return index;
}

export function collectSnapshotDependencyKeys(snapshot: SemanticDocumentSnapshot | undefined): string[] {
  if (!snapshot) return [];

  const exportedIds = new Set(snapshot.symbols.map((symbol) => symbol.id));
  const dependencies = new Set<string>();

  for (const symbol of snapshot.symbols) {
    for (const candidate of [
      symbol.containerName,
      symbol.ownerName,
      symbol.baseTypeName,
      symbol.datatype,
      symbol.returnType
    ]) {
      const dependency = normalizeDependencyKey(candidate);
      if (!dependency || exportedIds.has(dependency)) continue;
      dependencies.add(dependency);
    }
  }

  return [...dependencies].sort();
}

export function diffSemanticSnapshots(
  previous: SemanticDocumentSnapshot | undefined,
  next: SemanticDocumentSnapshot | undefined
): SemanticSnapshotDiff {
  const previousExports = buildExportSignatureIndex(previous);
  const nextExports = buildExportSignatureIndex(next);
  const previousDependencies = new Set(collectSnapshotDependencyKeys(previous));
  const nextDependencies = new Set(collectSnapshotDependencyKeys(next));

  const exportedIdsAdded: string[] = [];
  const exportedIdsRemoved: string[] = [];
  const exportedIdsUpdated: string[] = [];
  const dependencyKeysAdded: string[] = [];
  const dependencyKeysRemoved: string[] = [];

  for (const [id, signature] of nextExports.entries()) {
    const previousSignature = previousExports.get(id);
    if (previousSignature === undefined) {
      exportedIdsAdded.push(id);
    } else if (previousSignature !== signature) {
      exportedIdsUpdated.push(id);
    }
  }

  for (const id of previousExports.keys()) {
    if (!nextExports.has(id)) {
      exportedIdsRemoved.push(id);
    }
  }

  for (const dependency of nextDependencies) {
    if (!previousDependencies.has(dependency)) {
      dependencyKeysAdded.push(dependency);
    }
  }

  for (const dependency of previousDependencies) {
    if (!nextDependencies.has(dependency)) {
      dependencyKeysRemoved.push(dependency);
    }
  }

  return {
    changed:
      (previous?.identity ?? null) !== (next?.identity ?? null)
      || exportedIdsAdded.length > 0
      || exportedIdsRemoved.length > 0
      || exportedIdsUpdated.length > 0
      || dependencyKeysAdded.length > 0
      || dependencyKeysRemoved.length > 0,
    fingerprintChanged: (previous?.fingerprint ?? null) !== (next?.fingerprint ?? null),
    exportedIdsAdded,
    exportedIdsRemoved,
    exportedIdsUpdated,
    dependencyKeysAdded,
    dependencyKeysRemoved
  };
}