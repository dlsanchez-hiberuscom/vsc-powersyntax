# Spec 259 - PBAutoBuild command runner out-of-process (B183)

## 1. Resumen

Abrir la primera pieza ejecutable del carril moderno de build lanzando PBAutoBuild desde un proceso hijo controlado por el servidor LSP, sin bloquear Extension Host ni reutilizar tareas genéricas del workspace.

## 2. Estado real actual

`B183` queda `Closed`: el cliente ya dispara comandos reales de PBAutoBuild desde VS Code, el servidor selecciona un build file utilizable y controla un proceso hijo cancelable con timeout, y `showStats`/runtime journal exponen el estado mínimo del runner.

## 3. Objetivo

Ejecutar un build file JSON utilizable de PBAutoBuild desde VS Code con un runner server-side out-of-process, cancelable y observable.

## 4. Alcance

- introducir un runner puro server-side para PBAutoBuild;
- seleccionar build files usables desde el catálogo read-only del servidor, con preferencia por el proyecto activo cuando sea determinista;
- exponer comandos mínimos run/cancel vía `workspace/executeCommand`;
- publicar estado mínimo del runner en stats/runtime journal y proyectarlo en el cliente;
- añadir tests focalizados del runner, la selección y la proyección visible básica.

## 5. Fuera de alcance

- parsear logs a diagnósticos o Problems Panel (`B184`);
- cerrar UX final de profiles/commands/history (`B185`);
- unificar health final del build moderno (`B187`);
- persistir historial o último target más allá del estado transitorio en memoria.

## 6. Criterios de aceptación

- AC1. Existe un runner server-side que lanza `PBAutoBuild250.exe` con build file JSON y no usa tareas genéricas de VS Code como ejecución real.
- AC2. El runner selecciona de forma segura un build file utilizable, prefiriendo el proyecto activo cuando hay múltiples candidatos.
- AC3. La ejecución puede cancelarse y tiene timeout explícito para no quedar colgada indefinidamente.
- AC4. `showStats`/runtime journal y el cliente exponen estado mínimo del build en curso o del último intento.
- AC5. Tests focales cubren selección, ejecución exitosa, cancelación y timeout.

## 7. Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/developer-workflows.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildRunner.test.js out/test/server/unit/statusBarPresentation.test.js`

## 9. Cierre registrado

- `src/server/build/pbAutoBuildRunner.ts` introduce el runner out-of-process, la selección segura del build file utilizable y el estado transitorio del build moderno;
- `src/server/server.ts` expone `powerbuilder.runPbAutoBuild` y `powerbuilder.cancelPbAutoBuild`, añade el snapshot del runner a `showStats` y registra eventos en `runtimeJournal`;
- `src/client/extension.ts`, `src/client/statusBarPresentation.ts` y `package.json` sustituyen la acción genérica de build por comandos reales run/cancel y proyectan el estado mínimo del runner en status/tooltip;
- `test/server/unit/pbAutoBuildRunner.test.ts`, `statusBarPresentation.test.ts` y `test/smoke/extension.test.ts` fijan selección, éxito, cancelación, timeout y registro visible de comandos.