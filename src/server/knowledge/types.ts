import { DocumentSymbol } from 'vscode-languageserver/node';

/**
 * Representa la naturaleza de una entidad global en PowerBuilder.
 */
export enum EntityKind {
  Function = 'Function',
  Subroutine = 'Subroutine',
  Event = 'Event',
  Variable = 'Variable',
  Type = 'Type'
}

/**
 * Entidad semántica pura (desacoplada del AST o de la UI).
 */
export interface Entity {
  /** Nombre normalizado (minúsculas) para búsquedas */
  id: string;
  /** Nombre original respetando mayúsculas/minúsculas */
  name: string;
  kind: EntityKind;
  /** URI del archivo donde está definida */
  uri: string;
  /** Línea donde está definida (0-indexed) */
  line: number;
  /** Columna donde empieza el nombre (0-indexed) */
  character: number;
  /** Representación del signature (e.g. `(integer a, string b) returns boolean`) */
  signature?: string;
  /** Documentación asociada */
  documentation?: string;
  /** Nombre del contenedor/objeto padre (ej. 'w_main'), útil para Scopes */
  containerName?: string;
}

/**
 * Un hecho semántico extraído de un documento.
 */
export type Fact = Entity; // Por ahora, Fact = Entity. Se expandirá con referencias/relaciones.

/**
 * Estructura para la caché de un documento parseado.
 */
export interface DocumentCacheEntry {
  /** Versión del documento en el LSP, o timestamp/hash si viene de disco */
  version: string | number;
  /** Símbolos estructurales para Outline/Breadcrumbs */
  symbols: DocumentSymbol[];
  /** Entidades semánticas que alimenta la KnowledgeBase */
  facts: Fact[];
}
