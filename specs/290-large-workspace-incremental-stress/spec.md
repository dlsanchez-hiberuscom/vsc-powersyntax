# Spec 290 - Large workspace incremental indexing stress suite (B247)

**Estado:** cerrada y validada.

## 1. Resumen

Cubrir con una suite de stress incremental el comportamiento del indexador sobre workspaces grandes, forzando rafagas moderadas y masivas de cambios para detectar degradaciones del pipeline incremental y su coordinacion de caches.

## 2. Estado real actual

`B247` queda `Closed`: `test/server/performance/large-workspace-incremental.perf.test.ts` sintetiza workspaces grandes, aplica rafagas incremental/massive y mide convergencia del pipeline; el gate de `B246` ya incorpora esta suite en la validacion automatica.

## 3. Objetivo

Endurecer el carril incremental sobre workspaces grandes antes de release y antes de abrir automatizacion write-enabled mas ambiciosa.

## 4. Alcance

- sembrar workspaces sinteticos grandes y reproducibles;
- disparar eventos watched en rafagas moderadas y masivas;
- medir tiempos de convergencia sobre indexado incremental;
- integrar la suite en el gate de performance ya cerrado.

## 5. Fuera de alcance

- optimizacion algoritimica completa del indexador;
- benchmarks de memoria detallados;
- nuevas rutas funcionales fuera del scheduler/indexer/cache actuales.

## 6. Criterios de aceptacion

- AC1. Existe una suite de stress incremental para workspaces grandes.
- AC2. La suite cubre tanto rafagas moderadas como cambios masivos.
- AC3. Los resultados se integran en el gate de rendimiento de CI/local.
- AC4. El stress suite no introduce una segunda fuente de verdad sobre el runtime.

## 7. Documentacion afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/performance-budget.md`
- `docs/testing.md`

## 8. Validacion requerida

- `node ./node_modules/@vscode/test-cli/out/bin.mjs --label performance --grep "performance/large-workspace-incremental"`
- `npm run test:performance:gate`

## 9. Cierre registrado

- `test/server/performance/large-workspace-incremental.perf.test.ts` fija el caso grande incremental.
- `tools/run-performance-budget-gate.mjs` ya lo incluye en el carril de budget.
- la suite refuerza scheduler, caches y degradacion del pipeline incremental real.
