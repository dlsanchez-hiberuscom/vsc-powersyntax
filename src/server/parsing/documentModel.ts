/**
 * Document model (Spec 056 / B135).
 *
 * Combina los parsers de bajo nivel en un único modelo consumido por
 * features. Evita que cada feature recorra el documento por su cuenta.
 *
 * @module parsing/documentModel
 */

import { splitStatements, type LogicalStatement } from './statementSplitter';
import { scanSections } from './sectionMachine';
import { parseSrContainer, type SrContainer } from './srContainerParser';
import type { SectionRange } from '../model/types';

export interface DocumentModel {
  statements: LogicalStatement[];
  sections: SectionRange[];
  container: SrContainer;
}

export function buildDocumentModel(content: string): DocumentModel {
  const statements = splitStatements(content);
  const sections = scanSections(content.split(/\r?\n/));
  const container = parseSrContainer(content);
  return { statements, sections, container };
}
