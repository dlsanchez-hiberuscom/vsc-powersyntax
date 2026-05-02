# Spec 289 - Performance regression budget gate in CI (B246)

**Estado:** cerrada y validada.

## 1. Resumen

Introducir un gate determinista de presupuesto de rendimiento en CI para que cambios de latencia critica no puedan cerrar en falso solo porque falten corpus locales opcionales o porque los tests de performance no se ejecuten de forma repetible.

## 2. Estado real actual

`B246` queda `Closed`: `tools/run-performance-budget-gate.mjs` ejecuta y resume el gate de rendimiento, `test/server/performance/ci-budget-gate.perf.test.ts` fija presupuestos sobre corpus publico/sintetico y `.github/workflows/performance-budget-gate.yml` lo publica en CI con artefacto versionado.

## 3. Objetivo

Blindar la regresion de rendimiento con evidencia repetible antes de seguir ampliando stress suites y cerrar release readiness.

## 4. Alcance

- ejecutar budgets deterministas sobre corpus publico y sintetico;
- publicar metrica resumida y artefacto JSON para CI/local;
- evitar dependencias en corpus privados u opcionales para quedar en verde;
- mantener el gate fuera del hot path del usuario final.

## 5. Fuera de alcance

- tuning fino de todos los budgets del producto;
- bundling o optimizacion estructural del extension package;
- reemplazo de suites de performance exploratorias existentes.

## 6. Criterios de aceptacion

- AC1. Existe un gate de rendimiento ejecutable en local y CI.
- AC2. El gate usa corpus determinista disponible en el repo y pruebas sinteticas equivalentes.
- AC3. El resultado deja evidencia serializada y legible para troubleshooting.
- AC4. El gate bloquea regresiones de presupuestos base antes de release.

## 7. Documentacion afectada

- `README.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/performance-budget.md`
- `docs/testing.md`

## 8. Validacion requerida

- `npm run test:performance:gate`

## 9. Cierre registrado

- `test/server/performance/ci-budget-gate.perf.test.ts` fija presupuestos deterministas.
- `tools/run-performance-budget-gate.mjs` ejecuta, resume y serializa resultados.
- `.github/workflows/performance-budget-gate.yml` deja el gate disponible en CI.
