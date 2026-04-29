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
  /** Nombre del tipo base/ancestro (ej. 'window' en `type w_main from window`). Clave para el futuro InheritanceGraph. */
  baseTypeName?: string;
  /** Tipo de dato de la variable (ej. 'integer', 'n_cst_string'). Fundamental para resolución de métodos. */
  datatype?: string;
  /** Parámetros formalmente parseados y normalizados, útil para Signature Help */
  parameters?: { label: string, documentation?: string }[];
  /** Ámbito de la entidad (ej. 'Local', 'Instancia', 'Global', 'Compartida', 'Argumento') */
  scope?: 'Local' | 'Instancia' | 'Global' | 'Compartida' | 'Argumento';
  /** Nivel de acceso (ej. 'public', 'private', 'protected') */
  access?: string;
}

/**
 * Un hecho semántico extraído de un documento.
 */
export type Fact = Entity; // Por ahora, Fact = Entity. Se expandirá con referencias/relaciones.

/**
 * Tipos de ámbitos (Scopes).
 */
export enum ScopeKind {
  Global = 'Global',
  Type = 'Type',
  Function = 'Function',
  Event = 'Event',
  Block = 'Block'
}

/**
 * Representa un ámbito léxico en el que viven variables locales.
 */
export interface Scope {
  id: string; // Ej: 'w_main', 'w_main.of_setdata'
  kind: ScopeKind;
  uri: string;
  startLine: number;
  endLine: number;
  parent?: Scope;
  children: Scope[];
  /** Entidades (normalmente variables) definidas localmente en este scope */
  symbols: Entity[];
}

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
  /** Árbol de scopes para resolución de variables locales */
  scopes: Scope[];
}
