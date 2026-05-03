import { Entity, EntityKind } from './types';

const PARAMETER_MODIFIERS = new Set(['readonly', 'ref', 'value']);

export function isCallableEntity(entity: Entity): boolean {
  return entity.kind === EntityKind.Function
    || entity.kind === EntityKind.Subroutine
    || entity.kind === EntityKind.Event;
}

export function normalizeParameterLabel(label: string): string {
  return label
    .split('=')[0]!
    .replace(/\{[^}]*\}/g, '')
    .replace(/\[[^\]]*\]\s*$/g, '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((part) => part.length > 0 && !PARAMETER_MODIFIERS.has(part))
    .join(' ');
}

export function getCallableParameterCount(entity: Entity): number | undefined {
  if (!isCallableEntity(entity)) {
    return undefined;
  }

  if (typeof entity.parameterCount === 'number') {
    return entity.parameterCount;
  }

  if (entity.parameters) {
    return entity.parameters.length;
  }

  const match = entity.signature?.match(/\((.*?)\)/);
  if (!match) {
    return undefined;
  }

  const raw = match[1]?.trim() ?? '';
  if (!raw) {
    return 0;
  }

  return raw.split(',').filter((part) => part.trim().length > 0).length;
}

export function buildCallableSignatureFamilyKey(entity: Entity): string {
  const parameterParts = entity.parameters?.map((parameter) => normalizeParameterLabel(parameter.label))
    ?? [];
  const parameterKey = parameterParts.length > 0
    ? parameterParts.join(',')
    : `arity:${getCallableParameterCount(entity) ?? 'unknown'}`;

  return [
    entity.kind,
    entity.name.trim().toLowerCase(),
    parameterKey,
    (entity.returnType ?? '').trim().toLowerCase(),
  ].join('|');
}

export function buildCallableImplementationKey(entity: Entity): string {
  return [
    (entity.containerName ?? entity.ownerName ?? '').trim().toLowerCase(),
    buildCallableSignatureFamilyKey(entity),
  ].join('|');
}

export function getCallableParameterTypes(entity: Entity): string[] {
  return entity.parameters?.map((parameter) => normalizeParameterLabel(parameter.label).split(/\s+/)[0] ?? '')
    .filter((part) => part.length > 0)
    ?? [];
}