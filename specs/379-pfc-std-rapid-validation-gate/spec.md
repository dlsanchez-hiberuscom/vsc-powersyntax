# Spec 379: PFC/STD rapid validation gate

## Status

Closed.

## Backlog mapping

- B356 — PFC/STD rapid validation gate for architecture refactors.

## Objective

Convertir la validación real sobre PFC Workspace/Solution y STD_FC_OrderEntry en un gate corto, reproducible y documentado para refactors arquitectónicos, reutilizando las suites existentes con skip honesto cuando falten corpus locales.

## Implemented scope

- `tools/run-architecture-rapid-gate.mjs` compone un lane único que detecta disponibilidad local de `fixtures-local/pfc/2025-Workspace`, `fixtures-local/pfc/2025-Solution` y `fixtures-local/STD_FC_OrderEntry`, recompila cliente/tests y ejecuta las suites smoke/performance reales ya existentes con grep controlado.
- `package.json` publica ese lane como `npm run test:architecture:rapid`.
- El runner escribe evidencia en `artifacts/performance/architecture-rapid-gate.json` y diferencia entre `passed`, `passed-with-skips` y `skipped` para no falsear la ausencia de corpus locales.
- `docs/testing.md`, `docs/performance-budget.md`, `docs/current-focus.md`, `docs/backlog.md`, `docs/done-log.md` y `test/corpora/README.md` quedan alineados con este gate como evidencia canónica previa a cierres como `B364`.

## Out of scope

- Añadir nuevas suites semánticas fuera de las ya existentes para PFC/STD.
- Cambiar budgets numéricos del performance budget o reinterpretar `B364` como parte del gate.
- Abrir source-of-truth del catálogo (`B367-B369`) o métricas de hotspots (`B353`).

## Acceptance evidence

- Existe un comando único y documentado para el gate rápido: `npm run test:architecture:rapid`.
- El gate valida PFC Workspace/Solution en host real de VS Code y OrderEntry/PFC en performance/smoke sin crear suites duplicadas.
- Si faltan corpus locales, el runner informa el skip de forma explícita y deja artefacto JSON en lugar de fallar engañosamente.
- Con corpus presentes, el gate pasa y deja trazabilidad del estado real de discovery, indexing, serving básico y no crash.

## Validation

```bash
npm run test:architecture:rapid
```