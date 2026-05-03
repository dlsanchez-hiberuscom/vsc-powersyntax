# Plan - Spec 317 long-running session stability soak tests (B275)

## 1. Enfoque técnico

Partir del borde más falsable: comprobar si el repo ya tenía infraestructura suficiente para una soak realista. La lectura local mostró que `large-workspace-incremental.perf.test.ts`, `run-performance-budget-gate.mjs`, support bundle, build profile matrix, cache store y `applyWatchedFileEvents` ya daban la base; el trabajo útil era componer un harness opt-in pequeño y reutilizable, no abrir un framework nuevo.

## 2. Pasos

1. Añadir una suite `performance/session-stability-soak` que use el runtime real y emita un reporte final estructurado.
2. Exponer un runner dedicado que compile, ejecute solo esa suite y escriba artefactos JSON/MD.
3. Validar end-to-end el runner con un número reducido de iteraciones para confirmar extracción de reporte y cierre limpio.
4. Cerrar docs canónicas y mover el foco a `B276`.

## 3. Riesgos

- construir un soak aislado del runtime real y que no detecte deriva útil;
- dejar la evidencia solo en consola sin artefacto persistido ni fallo explícito cuando falte el reporte;
- convertir `B275` en una plataforma de benchmarking general en vez de un guard opt-in localizado.

## 4. Validación

- `$env:POWERSYNTAX_SOAK_ITERATIONS='8'; npm run test:performance:soak; Remove-Item Env:POWERSYNTAX_SOAK_ITERATIONS`

## 5. Resultado ejecutado

1. `session-stability-soak.perf.test.ts` fija la sesión larga sintética con resume, support bundle y build snapshot.
2. `run-session-stability-soak.mjs` serializa la evidencia en `artifacts/performance/session-stability-soak.json` y `.md`.
3. backlog/focus/roadmap/done-log ya dejan `B275` cerrada y mueven el foco a `B276`.