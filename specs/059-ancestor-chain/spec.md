# Spec 059 — Ancestor chain navigation (B065)

## Motivación
Resolver cadena de herencia para navegación de scripts ancestrales y
para futuro semantic resolver de `super::`.

## Alcance
- `src/server/features/ancestorNav.ts`:
  - `getAncestorChain(typeName, lookupBase): string[]`.
  - `lookupBase(name) → baseName | undefined`.
  - Detecta ciclos.
- `src/server/features/hierarchyInspection.ts`:
  - compone ancestro inmediato, cadena completa, árbol de descendencia y overrides heredados del tipo activo.
- `src/server/server.ts` y `src/client/extension.ts`:
  - exponen un comando visible para inspeccionar la jerarquía activa del editor.

## Criterios
1. Cadena correcta hasta `undefined`.
2. Ciclo no genera bucle infinito.
3. La inspección activa devuelve ancestro inmediato, árbol y overrides heredados sin duplicar lógica semántica.
