import { PB_GENERATED_DATAWINDOW_FUNCTION_OWNER_TYPES, PB_GENERATED_OBJECT_OWNER_TYPES } from './generated/common';
import {
  PB_MANUAL_CORE_DATAWINDOW_EVENT_OWNER_TYPES,
  PB_MANUAL_CORE_DATAWINDOW_FUNCTION_OWNER_TYPES,
  PB_MANUAL_CORE_OBJECT_OWNER_TYPES,
} from './manual/common';
import { normalizeSystemSymbolName } from './normalization';

const NATIVE_TYPE_ALIASES = new Map<string, string>([
  ['datawwindowchild', 'datawindowchild'],
]);

const EXPLICIT_NATIVE_PARENT_TYPES = new Map<string, readonly string[]>([
  ['application', ['powerobject']],
  ['drawobject', ['graphicobject']],
  ['graphicobject', ['powerobject']],
  ['mdiframe', ['window']],
  ['menu', ['powerobject']],
  ['nonvisualobject', ['powerobject']],
  ['olecustomcontrol', ['olecontrol']],
  ['runtimeerror', ['throwable']],
  ['throwable', ['powerobject']],
  ['window', ['powerobject']],
]);

const EXTRA_NATIVE_SYSTEM_TYPES = [
  'classdefinition',
  'datawindowchild',
  'dynamicdescriptionarea',
  'dynamicstagingarea',
  'environment',
  'error',
  'message',
  'oleobject',
  'olecontrol',
  'olestorage',
  'olestream',
  'powerobject',
  'scriptdefinition',
  'structure',
  'typedefinition',
  'typeobject',
  'variabledefinition',
];

function collectKnownNativeSystemTypes(): ReadonlySet<string> {
  const values = new Set<string>();

  const pushValues = (group: readonly string[]): void => {
    for (const value of group) {
      const normalizedValue = normalizeNativeTypeName(value);
      if (normalizedValue) {
        values.add(normalizedValue);
      }
    }
  };

  pushValues(PB_MANUAL_CORE_OBJECT_OWNER_TYPES);
  pushValues(PB_MANUAL_CORE_DATAWINDOW_FUNCTION_OWNER_TYPES);
  pushValues(PB_MANUAL_CORE_DATAWINDOW_EVENT_OWNER_TYPES);
  pushValues(PB_GENERATED_OBJECT_OWNER_TYPES);
  pushValues(PB_GENERATED_DATAWINDOW_FUNCTION_OWNER_TYPES);
  pushValues(EXTRA_NATIVE_SYSTEM_TYPES);

  for (const [typeName, parentTypes] of EXPLICIT_NATIVE_PARENT_TYPES) {
    pushValues([typeName, ...parentTypes]);
  }

  return values;
}

const KNOWN_NATIVE_SYSTEM_TYPES = collectKnownNativeSystemTypes();

export function normalizeNativeTypeName(value?: string): string | undefined {
  const normalizedValue = normalizeSystemSymbolName(value);
  if (!normalizedValue) {
    return undefined;
  }

  return NATIVE_TYPE_ALIASES.get(normalizedValue) ?? normalizedValue;
}

export function isKnownNativeAncestorType(value: string): boolean {
  const normalizedValue = normalizeNativeTypeName(value);
  return normalizedValue !== undefined && KNOWN_NATIVE_SYSTEM_TYPES.has(normalizedValue);
}

function collectNativeAncestorChain(
  typeName: string,
  result: string[],
  seen: Set<string>,
): void {
  const normalizedTypeName = normalizeNativeTypeName(typeName);
  if (!normalizedTypeName || seen.has(normalizedTypeName)) {
    return;
  }

  seen.add(normalizedTypeName);

  const parentTypes = EXPLICIT_NATIVE_PARENT_TYPES.get(normalizedTypeName)
    ?? (KNOWN_NATIVE_SYSTEM_TYPES.has(normalizedTypeName) && normalizedTypeName !== 'powerobject'
      ? ['powerobject']
      : []);

  for (const parentType of parentTypes) {
    const normalizedParentType = normalizeNativeTypeName(parentType);
    if (!normalizedParentType || seen.has(normalizedParentType)) {
      continue;
    }

    result.push(normalizedParentType);
    collectNativeAncestorChain(normalizedParentType, result, seen);
  }
}

export function getNativeAncestorChain(typeName: string): string[] {
  const normalizedTypeName = normalizeNativeTypeName(typeName);
  if (!normalizedTypeName || !KNOWN_NATIVE_SYSTEM_TYPES.has(normalizedTypeName)) {
    return [];
  }

  const result: string[] = [];
  const seen = new Set<string>([normalizedTypeName]);

  const parentTypes = EXPLICIT_NATIVE_PARENT_TYPES.get(normalizedTypeName)
    ?? (normalizedTypeName !== 'powerobject' ? ['powerobject'] : []);

  for (const parentType of parentTypes) {
    const normalizedParentType = normalizeNativeTypeName(parentType);
    if (!normalizedParentType || seen.has(normalizedParentType)) {
      continue;
    }

    result.push(normalizedParentType);
    collectNativeAncestorChain(normalizedParentType, result, seen);
  }

  return result;
}