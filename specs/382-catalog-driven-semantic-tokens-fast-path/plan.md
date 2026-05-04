# Plan — Spec 382 Catalog-driven semantic tokens fast path

## Phase 1 — Encontrar el fast path seguro

- [x] Confirmar que `semanticTokens.ts` solo usaba `SystemCatalog` para `enumMember` con sufijo `!`.
- [x] Identificar resolutores directos de `SystemCatalog` reutilizables para lenguaje y default library sin owner inference cara.

## Phase 2 — Integrar la clasificación ligera

- [x] Añadir la categoría `keyword` y el fast path para keywords, reserved words, datatypes, enumerated types, system globals, pronouns y global functions.
- [x] Mantener el fallback semántico existente para símbolos de usuario o casos con qualifier.

## Phase 3 — Validar y cerrar

- [x] Fijar el comportamiento nuevo en `semanticTokens.test.ts`.
- [x] Revalidar la suite completa de semantic tokens y `hotPathAllocationBudget`.
- [x] Alinear artefactos canónicos y mover el foco al siguiente desbloqueador real (`B366`).