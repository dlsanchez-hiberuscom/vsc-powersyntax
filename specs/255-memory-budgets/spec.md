# Spec 255 - Memory budgets de caché e índice (B070)

**Estado:** cerrada y validada.

## 1. Resumen

Definir, medir y vigilar budgets explícitos de memoria para cachés e índice del runtime, reutilizando las métricas ya existentes y exponiendo una surface unificada en stats/health.

## 2. Estado real actual

- El runtime ya publica capacidades parciales por capa (`analysis`, `serving`, `hotContext`, `codeLens`) y tamaños contables de `KnowledgeBase`/`DocumentCache`.
- `runtimeHealth` hoy solo vigila ratios de capacidad e hit ratio, no budgets de memoria unificados.
- No existe todavía un snapshot explícito de memoria por capa con estimates, budgets y estado agregado.

## 3. Objetivo

Publicar budgets de memoria por capa, estimates operativos y vigilancia estructurada del runtime sin introducir telemetría invasiva ni trabajo pesado en el hot path.

## 4. Alcance

- introducir un reporte unificado de memoria para cachés e índice;
- definir budgets explícitos por capa y estado agregado;
- integrar ese reporte en `showStats`, `runtimeHealth` y surfaces visibles del status;
- añadir tests focalizados del cálculo y de las señales health/visible.

## 5. Fuera de alcance

- reescribir las políticas de eviction de todas las cachés;
- imponer límites duros de memoria a `KnowledgeBase` o `DocumentCache`;
- añadir telemetría remota o profiling profundo del heap.

## 6. Criterios de aceptacion

- AC1. Existe un reporte explícito de budgets de memoria por capa.
- AC2. `showStats` y `runtimeHealth` vigilan esos budgets.
- AC3. El usuario puede ver el estado agregado en surfaces visibles sin abrir herramientas externas.
- AC4. Docs canónicas reflejan budgets definidos, medidos y vigilados.

## 7. Documentacion afectada

- `docs/performance-budget.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`

## 8. Validacion requerida

- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/memoryBudgets.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/statusBarPresentation.test.js`

## 9. Resultado de cierre

- `src/server/runtime/memoryBudgets.ts` define budgets y estimates por capa con estado agregado y métricas del proceso;
- `showStats`, `runtimeHealth` y el status visible del cliente consumen ese reporte y vigilan los budgets sin profiling invasivo;
- la validación ejecutada fue `npm run build:test ; npx mocha --ui tdd out/test/server/unit/memoryBudgets.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/statusBarPresentation.test.js`.