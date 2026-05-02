import { DocumentSymbol } from 'vscode-languageserver/node';
import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import type { SourceOrigin } from '../../shared/sourceOrigin';

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

export type EntityLineageSourceKind = 'document' | 'project' | 'workspace' | 'system';

export type EntityLineageAuthority = 'derived' | 'curated' | 'official' | 'project' | 'workspace' | 'custom';

export type EntityLineagePhase = 'declaration' | 'prototype' | 'implementation';

export type EntityLineageRole = 'prototype' | 'implementation' | 'override' | 'inherited';

export type EntityLineageConfidence = 'direct' | 'inherited' | 'fallback';

export interface EntityLineage {
  sourceKind?: EntityLineageSourceKind;
  sourceOrigin?: SourceOrigin;
  authority?: EntityLineageAuthority;
  phase?: EntityLineagePhase;
  role?: EntityLineageRole;
  inheritedFrom?: string;
  confidence?: EntityLineageConfidence;
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
  /** Tipo/familia del contenedor (type, event, subroutine, file-object, ...). */
  containerKind?: string;
  /** Firma del contenedor callable cuando el símbolo vive dentro de él. */
  containerSignature?: string;
  /** Objeto principal del archivo SR*/
  fileObjectName?: string;
  /** Nombre del tipo base/ancestro (ej. 'window' en `type w_main from window`). Clave para el futuro InheritanceGraph. */
  baseTypeName?: string;
  /** Tipo de dato de la variable (ej. 'integer', 'n_cst_string'). Fundamental para resolución de métodos. */
  datatype?: string;
  /** Parámetros formalmente parseados y normalizados, útil para Signature Help */
  parameters?: { label: string, documentation?: string }[];
  /** Ámbito de la entidad (ej. 'Local', 'Instancia', 'Global', 'Compartida', 'Argumento') */
  scope?: 'Local' | 'Instancia' | 'Global' | 'Compartida' | 'Argumento';
  /** Declarative scope estable para distinguir member/local/parameter/callable/type. */
  declarationScope?: 'type' | 'callable' | 'member' | 'local' | 'parameter';
  /** Nivel de acceso (ej. 'public', 'private', 'protected') */
  access?: string;
  // ---- Modelo enriquecido (Spec 021 / B064) -------------------------------
  /** Naturaleza de la implementación (function/event/subroutine/property/instance-var). */
  implementationKind?: 'function' | 'event' | 'subroutine' | 'property' | 'instance-var' | 'type' | 'on-handler' | 'external-function';
  /** Número de parámetros (cacheado para evitar recorrer `parameters`). */
  parameterCount?: number;
  /** Tipo de retorno (si aplica). */
  returnType?: string;
  /** Alias estable de `containerName` para owner resolution. */
  ownerName?: string;
  /** Indica si el símbolo proviene de una declaración externa. */
  isExternal?: boolean;
  /** Nombre de la librería externa (DLL) cuando aplica. */
  externalLibraryName?: string;
  /** Alias nativo declarado mediante `alias for`, cuando aplica. */
  externalAlias?: string;
  /** Clasificación estable de la dependencia nativa. */
  externalDependencyKind?: 'dll' | 'pbx' | 'unknown';
  /** Marca el símbolo como prototipo (declaración `forward prototypes`) frente a la implementación. */
  isPrototype?: boolean;
  /**
   * Etiqueta legible de la firma derivada (`f_get(int a) returns boolean`),
   * cacheada por `enrichEntity` para uso en hover/signature help. Spec 110.
   */
  signatureLabel?: string;
  /**
   * Etiqueta legible de la naturaleza del símbolo ("function", "event", "variable").
   * Spec 110.
   */
  kindLabel?: string;
  /**
   * Provenance/lineage mínimo del símbolo para distinguir origen,
   * fase de vida, rol de implementación, herencia y fiabilidad base.
   */
  lineage?: EntityLineage;
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
  /** Snapshot semántico canónico del documento, cuando esté disponible. */
  snapshot?: SemanticDocumentSnapshot;
}
