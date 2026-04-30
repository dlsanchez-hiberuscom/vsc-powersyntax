/**
 * Hierarchy tree (Spec 060 / B137).
 *
 * @module features/hierarchyTree
 */

export interface HierarchyNode {
  name: string;
  children: HierarchyNode[];
}

export type LookupChildren = (typeName: string) => readonly string[];

const MAX_DEPTH = 32;

export function buildHierarchyTree(
  root: string,
  lookupChildren: LookupChildren
): HierarchyNode {
  const seen = new Set<string>();
  function build(name: string, depth: number): HierarchyNode {
    if (depth >= MAX_DEPTH) return { name, children: [] };
    const key = name.toLowerCase();
    if (seen.has(key)) return { name, children: [] };
    seen.add(key);
    const childNames = lookupChildren(name) ?? [];
    return {
      name,
      children: childNames.map((c) => build(c, depth + 1))
    };
  }
  return build(root, 0);
}
