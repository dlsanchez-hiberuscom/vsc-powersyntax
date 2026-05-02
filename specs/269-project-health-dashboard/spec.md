# Spec 269 - Project Health Dashboard (B216)

**Estado:** cerrada y validada.

## 1. Resumen

Abrir un dashboard read-only de salud del proyecto desde la status bar, reutilizando `powerbuilder.showStats`, `semanticWorkspaceManifest`, el health report del runtime y el snapshot de build moderno ya cerrados.

## 2. Estado real actual

`B216` queda `Closed`: el cliente expone `vscPowerSyntax.openProjectHealthDashboard`, enlazado desde el menú/tooltip de estado, y compone una vista markdown del estado del workspace sin crear un segundo motor de health o topology.

## 3. Objetivo

Dar al usuario una vista operativa única para entender si el proyecto está sano y qué acción tomar sin abrir consola, output ni múltiples reports técnicos separados.

## 4. Alcance

- crear un builder puro del dashboard read-only;
- consumir stats/runtime health, manifest semántico y build health ya existentes;
- registrar un comando visible y enlazarlo desde la status bar;
- validar con unit del builder y smoke del comando cliente.

## 5. Fuera de alcance

- abrir un nuevo endpoint o pipeline server-side para calcular health;
- introducir mutación o acciones write-enabled desde el dashboard;
- resolver ORCA legacy antes de que exista su carril específico.

## 6. Criterios de aceptación

- AC1. Existe un comando visible para abrir el dashboard de salud del proyecto.
- AC2. El dashboard se compone únicamente sobre surfaces read-only ya cerradas.
- AC3. La vista expone readiness, indexación, cachés/persistencia, diagnósticos, build health y degradación honesta de ORCA.
- AC4. Hay validación unitaria del builder y smoke del comando visible.
- AC5. El foco canónico se mueve a `B214`.

## 7. Documentación afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`
- `docs/roadmap.md`
- `docs/testing.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/projectHealthDashboard.test.js out/test/server/unit/statusBarPresentation.test.js`
- `npm run test:smoke -- --grep "dashboard de salud del proyecto"`

## 9. Cierre registrado

- `src/client/projectHealthDashboard.ts` compone el dashboard read-only;
- `src/client/extension.ts`, `src/client/statusBarPresentation.ts` y `package.json` lo integran en el cliente visible;
- `test/server/unit/projectHealthDashboard.test.ts` y `test/smoke/extension.test.ts` fijan el contrato funcional.