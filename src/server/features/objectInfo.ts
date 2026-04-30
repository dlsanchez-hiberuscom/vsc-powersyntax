/**
 * Object info (Spec 051 / B106).
 *
 * Calcula los datos canónicos del objeto activo para alimentar al
 * comando `powerbuilder.objectInfo`.
 *
 * @module features/objectInfo
 */

import { parseSrContainer } from '../parsing/srContainerParser';
import { scanSections } from '../parsing/sectionMachine';
import type { SectionKind } from '../model/types';

export interface ObjectInfoInput {
  uri: string;
  content: string;
  line?: number;
  library?: string;
  project?: string;
}

export interface ObjectInfo {
  uri: string;
  globalType?: string;
  baseType?: string;
  sectionKind?: SectionKind;
  library?: string;
  project?: string;
}

export function buildObjectInfo(input: ObjectInfoInput): ObjectInfo {
  const container = parseSrContainer(input.content);
  let sectionKind: SectionKind | undefined;
  if (typeof input.line === 'number') {
    const sections = scanSections(input.content.split(/\r?\n/));
    const hit = sections.find((s) => input.line! >= s.startLine && input.line! <= s.endLine);
    sectionKind = hit?.kind;
  }
  return {
    uri: input.uri,
    globalType: container.globalType?.name,
    baseType: container.globalType?.baseType,
    sectionKind,
    library: input.library,
    project: input.project
  };
}
