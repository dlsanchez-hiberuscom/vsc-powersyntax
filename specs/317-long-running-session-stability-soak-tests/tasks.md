# Tasks - Spec 317 long-running session stability soak tests (B275)

## 1. Preparación

- [x] T1. Confirmar que el repo ya tenía runner de performance, soporte de artefactos y piezas reutilizables para una soak localizada.
- [x] T2. Identificar el borde mínimo: `applyWatchedFileEvents`, `DocumentCache`, `KnowledgeBase`, `ServingCache`, support bundle, build matrix y persistencia/resume.

## 2. Implementación

- [x] T3. Crear `test/server/performance/session-stability-soak.perf.test.ts` con reporte final `[soak-report]`.
- [x] T4. Crear `tools/run-session-stability-soak.mjs` y exponer `npm run test:performance:soak`.
- [x] T5. Materializar artefactos JSON/MD en `artifacts/performance/`.
- [x] T6. Alinear docs canónicas y mover el foco a `B276`.

## 3. Validación

- [x] T7. Ejecutar `$env:POWERSYNTAX_SOAK_ITERATIONS='8'; npm run test:performance:soak; Remove-Item Env:POWERSYNTAX_SOAK_ITERATIONS`.
- [x] T8. Confirmar que la suite deja `DocumentCache` y `KnowledgeBase` estables, `ServingCache` en cero y `lastResumeAction = reuse`.

## 4. Cierre

- [x] T9. Sacar `B275` del backlog activo, registrar el cierre en `docs/done-log.md`, mover `docs/current-focus.md` a `B276` y dejar la trazabilidad en `specs/317-long-running-session-stability-soak-tests`.