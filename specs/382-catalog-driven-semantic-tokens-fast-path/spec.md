# Spec 382: Catalog-driven semantic tokens fast path

## Status

Closed.

## Backlog mapping

- B329 — Catalog-driven semantic tokens integration.

## Objective

Consumir metadata del catálogo en semantic tokens para clasificar símbolos seguros del runtime sin depender siempre de la resolución semántica general ni introducir scans caros por token.

## Implemented scope

- `src/server/features/semanticTokens.ts` añade un fast path catalog-driven para `keywords`, `reserved-words`, `datatypes`, `enumerated-types`, `system-globals`, `pronouns` y `global-functions` mediante resolutores directos de `SystemCatalog`.
- El fast path se ejecuta antes de `resolveTargetEntity(...)` cuando no hay qualifier, evitando trabajo semántico más caro para tokens del lenguaje y del default library que ya tienen identidad estable en el catálogo.
- La leyenda de semantic tokens añade `keyword` y mantiene `enumMember` para valores con sufijo `!`, con modifiers compatibles (`defaultLibrary`, `global`) para símbolos del runtime.
- `test/server/unit/semanticTokens.test.ts` fija la nueva clasificación catalog-driven con `IF`, `IsValid`, `SQLCA` y `This`, y `test/server/unit/hotPathAllocationBudget.test.ts` sigue verde para asegurar que el hot path no deriva a serializaciones o clones de catálogo completos.

## Out of scope

- Añadir inferencia owner-aware profunda para member methods/events con qualifier dinámico.
- Reabrir la semántica catalog-driven de hover/completion/signatureHelp/diagnostics ya cerrada en `B363`.
- Tocar generated/manual source-of-truth, scraping oficial o localización (`B366-B375`).

## Acceptance evidence

- Semantic tokens clasifica símbolos seguros del catálogo sin pasar por lookup semántico caro cuando no hace falta.
- La leyenda y la suite unitaria cubren keywords, global functions, system globals, pronouns y enum values.
- El guard `hotPathAllocationBudget` sigue verde tras ampliar la clasificación.
- Backlog/current-focus/done-log/testing/performance-budget quedan alineados con el cierre.

## Validation

```bash
npm run test:unit -- --grep "Semantic Tokens"
npm run test:unit -- --grep hotPathAllocationBudget
```