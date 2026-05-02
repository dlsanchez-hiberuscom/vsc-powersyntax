export type SectionKind = 'forward' | 'prototypes' | 'variables';

export interface SectionRange {
  kind: SectionKind;
  startLine: number;
  endLine: number;
}

export interface TextPosition {
  line: number;
  character: number;
}

export interface TextRange {
  start: TextPosition;
  end: TextPosition;
}

export enum InternalDocumentSymbolKind {
  Namespace = 'namespace',
  Variable = 'variable',
  Function = 'function',
  Event = 'event',
  Class = 'class',
  Object = 'object',
  Field = 'field',
  String = 'string',
}

export interface InternalDocumentSymbol {
  name: string;
  kind: InternalDocumentSymbolKind;
  detail?: string;
  range: TextRange;
  selectionRange: TextRange;
  children: InternalDocumentSymbol[];
}

export type BlockKind =
  | 'forward'
  | 'prototypes'
  | 'variables'
  | 'type'
  | 'function'
  | 'subroutine'
  | 'event'
  | 'if'
  | 'for'
  | 'do'
  | 'choose-case'
  | 'try';

export interface SymbolFact {
  name: string;
  kind: 'type' | 'function' | 'subroutine' | 'event' | 'section' | 'variable';
  detail?: string;
  declarationOnly?: boolean;
  containerName?: string;
  containerKind?: string;
  containerSignature?: string;
  fileObjectName?: string;
  declarationScope?: 'type' | 'callable' | 'member' | 'local' | 'parameter';
  baseTypeName?: string;
  datatype?: string;
  parameters?: { label: string, documentation?: string }[];
  scope?: 'Local' | 'Instancia' | 'Global' | 'Compartida' | 'Argumento';
  access?: string;
  returnType?: string;
  isExternal?: boolean;
  externalLibraryName?: string;
  externalAlias?: string;
  externalDependencyKind?: 'dll' | 'pbx' | 'unknown';
  line: number;
  startCharacter: number;
  endCharacter: number;
}

export interface TypeMatch {
  name: string;
  ancestor: string;
  container?: string;
}

export interface FunctionLikeMatch {
  kind: 'function' | 'subroutine';
  returnType?: string;
  name: string;
}

export interface EventLikeMatch {
  name: string;
  detail: string;
  ownerName?: string;
  qualifiedOwnerName?: string;
}