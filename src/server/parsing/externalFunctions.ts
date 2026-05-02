/**
 * External function declaration parser (Spec 039 / B073).
 *
 * Reconoce `function|subroutine ... library "x.dll" [alias for "Real"]`.
 *
 * @module parsing/externalFunctions
 */

export interface ExternalFunctionDecl {
  kind: 'function' | 'subroutine';
  returnType?: string;
  name: string;
  library: string;
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
const RE_FN = /^\s*(?:public|private|protected)?\s*function\s+([A-Za-z_][\w$#%-]*)\s+([A-Za-z_][\w$#%-]*)\s*\([^)]*\)\s+library\s+"([^"]+)"(?:\s+alias\s+for\s+"([^"]+)")?/i;
const RE_SUB = /^\s*(?:public|private|protected)?\s*subroutine\s+([A-Za-z_][\w$#%-]*)\s*\([^)]*\)\s+library\s+"([^"]+)"(?:\s+alias\s+for\s+"([^"]+)")?/i;

export function parseExternalFunction(line: string): ExternalFunctionDecl | null {
  let m = RE_FN.exec(line);
  if (m) {
    return {
      kind: 'function',
      returnType: m[1],
      name: m[2],
      library: m[3],
      alias: m[4]
    };
  }
  m = RE_SUB.exec(line);
  if (m) {
    return {
      kind: 'subroutine',
      name: m[1],
      library: m[2],
      alias: m[3]
    };
  }
  return null;
}
