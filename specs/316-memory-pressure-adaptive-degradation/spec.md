# Spec 316 - memory pressure adaptive degradation (B274)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B274` convirtiendo el reporte unificado de budgets de memoria en una policy runtime ejecutable: aliviar `ServingCache`, aplazar carriles de background no críticos, capar reports read-only pesados y mantener vivo el carril interactivo.

## 2. Estado real actual

El repo ya dispone de `src/server/runtime/memoryPressurePolicy.ts` y de wiring en `src/server/server.ts` para aplicar esa policy en el gate de background, en los writes del serving cache y en los comandos read-only pesados. `memoryPressurePolicy.test.ts`, `memoryBudgets.test.ts`, `runtimeHealth.test.ts`, `semanticWorkspaceManifest.test.ts`, `crossProjectSymbolConflicts.test.ts`, `workspaceMigrationAssistant.test.ts`, `powerBuilderCodeMetrics.test.ts` y `powerBuilderTechnicalDebtReport.test.ts` cubren el cierre con thresholds artificiales.

## 3. Objetivo

Actuar automáticamente bajo presión de memoria sin degradar el archivo activo: purgar caché interactiva reciclable, suspender trabajo no crítico y limitar payloads grandes antes de romper `hover`/`completion`/`near-context`.

## 4. Alcance

- introducir una policy explícita de presión de memoria sobre el reporte unificado por capa;
- purgar `ServingCache` y omitir nuevas escrituras mientras la presión siga activa;
- aplazar `background-indexing`, `maintenance` y `ai-tooling` bajo presión;
- capar `semanticWorkspaceManifest`, `crossProjectSymbolConflicts`, `workspaceMigrationAssistant`, `codeMetrics` y `technicalDebtReport`;
- alinear `docs/performance-budget.md`, `docs/architecture.md`, `docs/testing.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md` y `docs/done-log.md` con el cierre.

## 5. Fuera de alcance

- convertir budgets de memoria en un sistema de GC propio del runtime;
- apagar `hover`, `completion`, `definition`, `signatureHelp` o `near-context` por un warning genérico;
- abrir soak testing o guards de allocations que pertenecen a `B275` y `B276`.

## 6. Criterios de aceptación

- AC1. existe una policy explícita y testeada que decide purge/skip/defer/caps a partir del reporte de memoria.
- AC2. `ServingCache` se purga y deja de crecer bajo presión sin bloquear el carril interactivo.
- AC3. `background-indexing`, `maintenance` y `ai-tooling` se aplazan bajo presión de memoria.
- AC4. los reports read-only pesados quedan capados defensivamente bajo presión.
- AC5. docs canónicas quedan alineadas y el siguiente foco canónico pasa a `B275`.

## 7. Documentación afectada

- `docs/performance-budget.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/memoryPressurePolicy.test.js out/test/server/unit/memoryBudgets.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js out/test/server/unit/workspaceMigrationAssistant.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js`

## 9. Cierre registrado

- la presión de memoria ya no es un warning pasivo en stats: gobierna purge/skip/defer/caps desde una policy explícita;
- `hover`, `completion`, `definition` y `signatureHelp` siguen vivos aunque se alivie memoria;
- el siguiente foco canónico del repo pasa a `B275`.