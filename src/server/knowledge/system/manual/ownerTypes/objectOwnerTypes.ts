import {
  EVENT_CAPABLE_OBJECT_TYPES,
  FOCUSABLE_OBJECT_TYPES,
  INPUT_OBJECT_TYPES,
  REDRAWABLE_OBJECT_TYPES,
  TEXT_OBJECT_TYPES,
  VISUAL_OBJECT_TYPES,
} from './visualOwnerTypes';

function mergeUniqueValues(...valueGroups: readonly (readonly string[])[]): string[] {
  const values = new Set<string>();

  for (const valueGroup of valueGroups) {
    for (const value of valueGroup) {
      values.add(value);
    }
  }

  return Array.from(values);
}

const OBJECT_OWNER_TYPES = mergeUniqueValues(
  FOCUSABLE_OBJECT_TYPES,
  VISUAL_OBJECT_TYPES,
  TEXT_OBJECT_TYPES,
  INPUT_OBJECT_TYPES,
  EVENT_CAPABLE_OBJECT_TYPES,
  REDRAWABLE_OBJECT_TYPES,
);

export const PB_MANUAL_CORE_OBJECT_OWNER_TYPES: readonly string[] = OBJECT_OWNER_TYPES;
export const PB_MANUAL_CORE_OBJECT_FUNCTION_OWNER_TYPES: readonly string[] = OBJECT_OWNER_TYPES;