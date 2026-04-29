export type SectionKind = 'forward' | 'prototypes' | 'variables';

export interface SectionRange {
  kind: SectionKind;
  startLine: number;
  endLine: number;
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
  baseTypeName?: string;
  datatype?: string;
  parameters?: { label: string, documentation?: string }[];
  scope?: 'Local' | 'Instancia' | 'Global' | 'Compartida' | 'Argumento';
  access?: string;
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
}