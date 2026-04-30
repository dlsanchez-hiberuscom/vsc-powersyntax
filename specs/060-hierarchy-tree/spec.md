# Spec 060 — Hierarchy tree (B137)

## Motivación
Dato canónico para futura UI de "Hierarchy explorer".

## Alcance
- `src/server/features/hierarchyTree.ts`:
  - `buildHierarchyTree(root, lookupChildren): HierarchyNode`.
  - `HierarchyNode = { name; children: HierarchyNode[] }`.
  - Detección de ciclos.
  - Profundidad máxima por defecto 32.

## Criterios
1. Construye árbol con n hijos.
2. No revisita nodos repetidos.
