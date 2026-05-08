import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';

const snapshotCache = new WeakMap<SemanticDocumentSnapshot, Map<RegExp, Map<string, RegExpExecArray[]>>>();

/**
 * PB-PERF-P2-REGEX-MEMOIZATION-01:
 * Evalúa o recupera los resultados cacheados de una expresión regular sobre un string,
 * atando el caché al ciclo de vida del SemanticDocumentSnapshot (WeakMap).
 * 
 * Garantiza O(1) en re-evaluaciones repetitivas de las mismas líneas en llamadas de UI (Hover, Tokens).
 */
export function execMemoized(
  snapshot: SemanticDocumentSnapshot,
  regex: RegExp,
  text: string
): RegExpExecArray[] {
  let regexMap = snapshotCache.get(snapshot);
  if (!regexMap) {
    regexMap = new Map();
    snapshotCache.set(snapshot, regexMap);
  }

  let textMap = regexMap.get(regex);
  if (!textMap) {
    textMap = new Map();
    regexMap.set(regex, textMap);
  }

  let matches = textMap.get(text);
  if (matches) {
    return matches;
  }

  matches = [];
  regex.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match);
    if (!regex.global) {
      break;
    }
  }

  textMap.set(text, matches);
  return matches;
}
