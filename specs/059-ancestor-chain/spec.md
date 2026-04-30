# Spec 059 — Ancestor chain navigation (B065)

## Motivación
Resolver cadena de herencia para navegación de scripts ancestrales y
para futuro semantic resolver de `super::`.

## Alcance
- `src/server/features/ancestorNav.ts`:
  - `getAncestorChain(typeName, lookupBase): string[]`.
  - `lookupBase(name) → baseName | undefined`.
  - Detecta ciclos.

## Criterios
1. Cadena correcta hasta `undefined`.
2. Ciclo no genera bucle infinito.
