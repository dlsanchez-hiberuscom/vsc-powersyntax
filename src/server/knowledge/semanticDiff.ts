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
  documentContractsUpdated: string[];
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

const DATAOBJECT_ASSIGN_REGEX = /\b([a-z_][\w$#%]*)\s*\.\s*dataobject\s*=\s*([^;]+)/gi;
const DATAOBJECT_LITERAL_REGEX = /^("|')(.*?)\1$/;
const REPORT_DATAOBJECT_REGEX = /\breport\s*\([^)]*\bdataobject\s*=\s*"([^"]+)"/gi;
const DDDW_NAME_REGEX = /\bdddw\.name\s*=\s*"([^"]+)"/gi;

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
    entity.containerKind ?? '',
    entity.containerSignature ?? '',
    entity.fileObjectName ?? '',
    entity.baseTypeName ?? '',
    entity.datatype ?? '',
    entity.returnType ?? '',
    entity.signature ?? '',
    entity.scope ?? '',
    entity.declarationScope ?? '',
    entity.access ?? '',
    String(entity.parameterCount ?? ''),
    String(entity.isExternal ?? false),
    entity.externalLibraryName ?? '',
    entity.externalAlias ?? '',
    entity.externalDependencyKind ?? '',
    String(entity.isPrototype ?? false),
    entity.lineage?.sourceKind ?? '',
    entity.lineage?.authority ?? '',
    entity.lineage?.phase ?? '',
    entity.lineage?.role ?? '',
    entity.lineage?.inheritedFrom ?? '',
    entity.lineage?.confidence ?? ''
  ].join('|');
}

function normalizeDataObjectLiteral(raw: string | undefined): string | null {
  if (!raw) return null;
  const match = DATAOBJECT_LITERAL_REGEX.exec(raw.trim());
  if (!match) {
    return null;
  }

  return normalizeDependencyKey(match[2]);
}

function collectDataObjectDependencyKeys(snapshot: SemanticDocumentSnapshot): Set<string> {
  const dependencies = new Set<string>();

  for (const statement of snapshot.logicalStatements) {
    DATAOBJECT_ASSIGN_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = DATAOBJECT_ASSIGN_REGEX.exec(statement.text)) !== null) {
      const dependency = normalizeDataObjectLiteral(match[2]);
      if (dependency) {
        dependencies.add(dependency);
      }
    }
  }

  const normalizedText = snapshot.maskedText.lines.join('\n').replace(/~"/g, '"');

  REPORT_DATAOBJECT_REGEX.lastIndex = 0;
  let reportMatch: RegExpExecArray | null;
  while ((reportMatch = REPORT_DATAOBJECT_REGEX.exec(normalizedText)) !== null) {
    const dependency = normalizeDependencyKey(reportMatch[1]);
    if (dependency) {
      dependencies.add(dependency);
    }
  }

  DDDW_NAME_REGEX.lastIndex = 0;
  let dropdownMatch: RegExpExecArray | null;
  while ((dropdownMatch = DDDW_NAME_REGEX.exec(normalizedText)) !== null) {
    const dependency = normalizeDependencyKey(dropdownMatch[1]);
    if (dependency) {
      dependencies.add(dependency);
    }
  }

  return dependencies;
}

function extractBalancedParenthesesContent(text: string, openParen: number): string | null {
  let depth = 0;
  for (let index = openParen; index < text.length; index++) {
    const char = text[index];
    if (char === '(') {
      depth++;
      continue;
    }

    if (char === ')') {
      depth--;
      if (depth === 0) {
        return text.slice(openParen + 1, index);
      }
    }
  }

  return null;
}

function collectDataWindowRetrieveContract(snapshot: SemanticDocumentSnapshot | undefined): string {
  if (!snapshot) {
    return '';
  }

  const normalizedText = snapshot.maskedText.lines.join('\n').replace(/~"/g, '"');
  const byArgumentsClause = /\barguments\s*=\s*\(/i.exec(normalizedText);
  const signatures: string[] = [];
  const seen = new Set<string>();

  if (byArgumentsClause) {
    const openParen = normalizedText.indexOf('(', byArgumentsClause.index);
    const clause = openParen >= 0 ? extractBalancedParenthesesContent(normalizedText, openParen) : null;
    if (clause) {
      const pattern = /\(\s*"([^"]+)"\s*,\s*([A-Za-z_][\w$#%]*)\s*\)/gi;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(clause)) !== null) {
        const signature = `${match[1].trim().toLowerCase()}:${match[2].trim().toLowerCase()}`;
        if (!seen.has(signature)) {
          seen.add(signature);
          signatures.push(signature);
        }
      }
    }
  }

  if (signatures.length === 0) {
    const pattern = /ARG\s*\(([^)]*)\)/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(normalizedText)) !== null) {
      const body = match[1];
      const nameMatch = /NAME\s*=\s*"([^"]+)"/i.exec(body);
      const typeMatch = /TYPE\s*=\s*([A-Za-z_][\w$#%]*)/i.exec(body);
      const name = nameMatch?.[1]?.trim().toLowerCase();
      const type = typeMatch?.[1]?.trim().toLowerCase();
      if (!name || !type) {
        continue;
      }

      const signature = `${name}:${type}`;
      if (!seen.has(signature)) {
        seen.add(signature);
        signatures.push(signature);
      }
    }
  }

  return signatures.sort().join('|');
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

  for (const dependency of collectDataObjectDependencyKeys(snapshot)) {
    if (!exportedIds.has(dependency)) {
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
  const previousDataWindowRetrieveContract = collectDataWindowRetrieveContract(previous);
  const nextDataWindowRetrieveContract = collectDataWindowRetrieveContract(next);

  const exportedIdsAdded: string[] = [];
  const exportedIdsRemoved: string[] = [];
  const exportedIdsUpdated: string[] = [];
  const dependencyKeysAdded: string[] = [];
  const dependencyKeysRemoved: string[] = [];
  const documentContractsUpdated: string[] = [];

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

  if (previousDataWindowRetrieveContract !== nextDataWindowRetrieveContract) {
    documentContractsUpdated.push('datawindow-retrieve-arguments');
  }

  return {
    changed:
      exportedIdsAdded.length > 0
      || exportedIdsRemoved.length > 0
      || exportedIdsUpdated.length > 0
      || dependencyKeysAdded.length > 0
      || dependencyKeysRemoved.length > 0
      || documentContractsUpdated.length > 0,
    fingerprintChanged: (previous?.fingerprint ?? null) !== (next?.fingerprint ?? null),
    exportedIdsAdded,
    exportedIdsRemoved,
    exportedIdsUpdated,
    dependencyKeysAdded,
    dependencyKeysRemoved,
    documentContractsUpdated
  };
}