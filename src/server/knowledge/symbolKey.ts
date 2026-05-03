/**
 * Symbol key (Spec 031 / B101).
 *
 * Deriva una clave estable que distingue símbolos homónimos en distintos
 * contenedores y/o con distinta aridad.
 *
 * @module knowledge/symbolKey
 */

import type { Entity } from './types';
import { normalizeUri } from '../system/uriUtils';

function normalizeSegment(value: unknown): string {
  const text = typeof value === 'string'
    ? value.trim()
    : value == null
      ? ''
      : String(value);
  return text ? text.replace(/\s+/g, ' ').toLowerCase() : '';
}

function buildSignatureSegment(entity: Entity): string {
  const signature = normalizeSegment(entity.signature ?? entity.signatureLabel);
  if (signature) {
    return signature;
  }

  const parameters = entity.parameters?.map((parameter) => normalizeSegment(parameter.label)).filter(Boolean) ?? [];
  const returnType = normalizeSegment(entity.returnType);
  if (parameters.length > 0 || returnType) {
    return `(${parameters.join(',')})${returnType ? `=>${returnType}` : ''}`;
  }

  if (typeof entity.parameterCount === 'number') {
    return `arity:${entity.parameterCount}`;
  }

  return '';
}

function buildKey(parts: Record<string, string>): string {
  return Object.entries(parts)
    .map(([label, value]) => `${label}:${value}`)
    .join('|');
}

export function buildSymbolKey(e: Entity): string {
  return buildKey({
    uri: normalizeSegment(e.uri ? normalizeUri(e.uri) : ''),
    line: normalizeSegment(e.line),
    character: normalizeSegment(e.character),
    fileObjectName: normalizeSegment(e.fileObjectName),
    container: normalizeSegment(e.ownerName ?? e.containerName),
    kind: normalizeSegment(e.kind),
    name: normalizeSegment(e.name),
    signature: buildSignatureSegment(e),
    sourceOrigin: normalizeSegment(e.lineage?.sourceOrigin),
    implementationKind: normalizeSegment(e.implementationKind),
    declarationScope: normalizeSegment(e.declarationScope ?? e.scope),
  });
}

export function buildConflictFamilyKey(e: Entity): string {
  return buildKey({
    fileObjectName: normalizeSegment(e.fileObjectName),
    container: normalizeSegment(e.ownerName ?? e.containerName),
    kind: normalizeSegment(e.kind),
    name: normalizeSegment(e.name),
    signature: buildSignatureSegment(e),
    implementationKind: normalizeSegment(e.implementationKind),
    declarationScope: normalizeSegment(e.declarationScope ?? e.scope),
  });
}

export function dedupeBySymbolKey<T extends Entity>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const k = buildSymbolKey(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}
