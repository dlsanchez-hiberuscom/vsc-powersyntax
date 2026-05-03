# Spec 311 - query scope policy v2 (B266)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B266` fijando una policy v2 por consumer semántico para declarar `maxScope`, `budgetMs`, `resultCap`, readiness, confidence, fallback y allowances `staging/generated/external`, sin abrir un segundo motor de serving ni dejar widening implícito a `workspace`.

## 2. Estado real actual

El repo ya dispone de un registro único en `src/server/features/queryScopePolicy.ts` consumido por `featureReadiness`, `referenceSourcePool`, `server.ts` y varios consumers read-only. `references`, `rename` y `CodeLens` ya no caen a `workspace` cuando el consumer queda acotado a `project`, `signatureHelp` entra en el mismo gate de readiness y los caps por defecto de `completion`, `currentObjectContext` e `impactAnalysis` salen del mismo contrato central.

## 3. Objetivo

Formalizar por consumer qué scope puede pedir realmente, qué presupuesto/cap tiene permitido, qué readiness/confidence exige, cómo degrada y si puede usar `staging/generated/external`, de modo que el query engine deje de depender de defaults implícitos o widening técnico sin contrato.

## 4. Alcance

- crear el registro central `queryScopePolicy` para consumers semánticos reales;
- colgar `featureReadiness` del mismo contrato para readiness/confidence/fallback;
- usar la policy en `referenceSourcePool` para `references`/`rename`/`CodeLens` y evitar widening a `workspace` fuera de policy;
- alinear los caps por defecto de `completion`, `currentObjectContext` e `impactAnalysis` con el mismo registro;
- cubrir casos negativos de no materialización global y de report pesado sin routing de proyecto.

## 5. Fuera de alcance

- reescribir `semanticQueryService` para introducir un segundo nivel de policy dentro del motor;
- abrir nuevos consumers o nuevas superficies visibles más allá de la policy del slice actual;
- resolver `B267+` bajo el pretexto de presupuestos por consumer.

## 6. Criterios de aceptación

- AC1. existe un registro único de policy por consumer con `maxScope`, `budgetMs`, `resultCap`, readiness, confidence, fallback y allowances `staging/generated/external`.
- AC2. `references`, `rename` y `CodeLens` ya no widenean a `workspace` cuando el consumer queda en `project` y excluyen `staging/generated` si la policy no los permite.
- AC3. `featureReadiness` y `signatureHelp` reutilizan la misma policy en lugar de mapas locales duplicados.
- AC4. `completion`, `currentObjectContext` e `impactAnalysis` usan el contrato central como fuente de caps por defecto.
- AC5. la validación incluye unit de policy, tests negativos de no materialización global y report pesado, y docs canónicas alineadas con el cierre.

## 7. Documentación afectada

- `docs/architecture.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/queryScopePolicy.test.js out/test/server/unit/referenceSourcePool.test.js out/test/server/unit/featureReadiness.test.js out/test/server/unit/references.test.js out/test/server/unit/rename.test.js out/test/server/unit/codeLensReferences.test.js out/test/server/unit/completion.test.js out/test/server/unit/signatureHelp.test.js out/test/server/unit/currentObjectContext.test.js out/test/server/unit/impactAnalysis.test.js`

## 9. Cierre registrado

- la policy v2 por consumer ya queda centralizada y consumida por readiness, source pool y caps por defecto relevantes;
- los consumers acotados a `project` ya no materializan `workspace` ni `staging/generated` por defecto;
- el siguiente foco canónico del repo pasa a `B267`.