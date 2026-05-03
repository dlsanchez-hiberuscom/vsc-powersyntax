# Plan - Spec 316 memory pressure adaptive degradation (B274)

## 1. Enfoque técnico

Partir del borde más falsable: verificar si el reporte de memoria ya gobernaba algo. La comprobación local mostró que `buildRuntimeMemoryReport(...)` solo alimentaba `showStats`, así que el trabajo real era convertir esa señal en policy ejecutable y cablearla en el runtime sin tocar el carril interactivo.

## 2. Pasos

1. Crear una policy pura de presión de memoria con thresholds artificiales, deferrals y caps.
2. Validar esa policy aislada con unit tests antes de tocar `server.ts`.
3. Cablear la policy en el gate de background, en `ServingCache` y en los comandos de reports pesados.
4. Revalidar compile + suites focales de budgets/runtime health/reporting.
5. Cerrar docs canónicas y mover el foco a `B275`.

## 3. Riesgos

- dejar la memoria como una señal solo observada en stats/health sin efecto operativo real;
- resolver presión de memoria apagando `hover`/`completion` o degradando el archivo activo;
- reabrir el scheduler de `B267` en vez de reutilizar su gate de admisión.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/memoryPressurePolicy.test.js out/test/server/unit/memoryBudgets.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js out/test/server/unit/workspaceMigrationAssistant.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js`

## 5. Resultado ejecutado

1. `memoryPressurePolicy.ts` fija la policy única y testeada.
2. `server.ts` ya purga `ServingCache`, pausa writes, difiere workloads no críticos y cap a reports pesados.
3. backlog/focus/roadmap/done-log ya dejan `B274` cerrada y mueven el foco a `B275`.