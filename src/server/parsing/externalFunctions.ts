/**
 * External function declaration parser (Spec 039 / B073).
 *
 * Reconoce `function|subroutine ... library "x.dll" [alias for "Real"]`.
 *
 * @module parsing/externalFunctions
 */

import { PB_IDENTIFIER_SOURCE, TYPE_REFERENCE_SOURCE } from './grammar';

export interface ExternalFunctionDecl {
  kind: 'function' | 'subroutine';
  returnType?: string;
  name: string;
  externalCallableKind: 'library' | 'rpcfunc';
  library?: string;
  alias?: string;
}

export type ExternalDependencyKind = 'dll' | 'pbx' | 'unknown';

export function classifyExternalLibrary(library: string): ExternalDependencyKind {
  const normalized = library.trim().toLowerCase();
  if (normalized.endsWith('.dll')) {
    return 'dll';
  }

  if (normalized.endsWith('.pbx')) {
    return 'pbx';
  }

  return 'unknown';
}

// access: public/private/protected (opcional). Function returnType name(args). library "x" [alias for "Real"].
const RE_FN = new RegExp(
  `^\\s*(?:public|private|protected)?\\s*function\\s+(${TYPE_REFERENCE_SOURCE})\\s+(${PB_IDENTIFIER_SOURCE})\\s*\\([^)]*\\)\\s+library\\s+"([^"]+)"(?:\\s+alias\\s+for\\s+"([^"]+)")?`,
  'i'
);
const RE_SUB = new RegExp(
  `^\\s*(?:public|private|protected)?\\s*subroutine\\s+(${PB_IDENTIFIER_SOURCE})\\s*\\([^)]*\\)\\s+library\\s+"([^"]+)"(?:\\s+alias\\s+for\\s+"([^"]+)")?`,
  'i'
);
const RE_FN_RPCFUNC = new RegExp(
  `^\\s*(?:public|private|protected)?\\s*function\\s+(${TYPE_REFERENCE_SOURCE})\\s+(${PB_IDENTIFIER_SOURCE})\\s*\\([^)]*\\)\\s+rpcfunc(?:\\s+alias\\s+for\\s+"([^"]+)")?`,
  'i'
);
const RE_SUB_RPCFUNC = new RegExp(
  `^\\s*(?:public|private|protected)?\\s*subroutine\\s+(${PB_IDENTIFIER_SOURCE})\\s*\\([^)]*\\)\\s+rpcfunc(?:\\s+alias\\s+for\\s+"([^"]+)")?`,
  'i'
);

export function parseExternalFunction(line: string): ExternalFunctionDecl | null {
  let m = RE_FN.exec(line);
  if (m) {
    return {
      kind: 'function',
      returnType: m[1],
      name: m[2],
      externalCallableKind: 'library',
      library: m[3],
      alias: m[4]
    };
  }
  m = RE_SUB.exec(line);
  if (m) {
    return {
      kind: 'subroutine',
      name: m[1],
      externalCallableKind: 'library',
      library: m[2],
      alias: m[3]
    };
  }
  m = RE_FN_RPCFUNC.exec(line);
  if (m) {
    return {
      kind: 'function',
      returnType: m[1],
      name: m[2],
      externalCallableKind: 'rpcfunc',
      alias: m[3]
    };
  }
  m = RE_SUB_RPCFUNC.exec(line);
  if (m) {
    return {
      kind: 'subroutine',
      name: m[1],
      externalCallableKind: 'rpcfunc',
      alias: m[2]
    };
  }
  return null;
}
