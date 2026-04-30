/**
 * Ancestor chain navigation (Spec 059 / B065).
 *
 * @module features/ancestorNav
 */

export type LookupBase = (typeName: string) => string | undefined;

export function getAncestorChain(typeName: string, lookupBase: LookupBase): string[] {
  const chain: string[] = [];
  const seen = new Set<string>();
  let current: string | undefined = typeName;
  while (current && !seen.has(current.toLowerCase())) {
    seen.add(current.toLowerCase());
    const parent = lookupBase(current);
    if (!parent) break;
    if (seen.has(parent.toLowerCase())) break;
    chain.push(parent);
    current = parent;
  }
  return chain;
}
