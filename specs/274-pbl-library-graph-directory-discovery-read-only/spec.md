# Spec 274 - PBL library graph and directory discovery read-only (B190)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar el grafo legacy read-only sobre roots `.pbl` ya descubiertos, sin exportar todavía a staging ni tocar PBL binaria: el workspace distingue modo `pbl-only`, sintetiza nodos de librería para el project model y publica esa topología en `semanticWorkspaceManifest` y el Object Explorer.

## 2. Estado real actual

`B190` queda `Closed`: `WorkspaceState` detecta `pbl-only`, `resolveProjectRouting` y `buildUnifiedProjectModel` sintetizan nodos legacy para librerías `.pbl` no cubiertas por `.pbt/.pbproj`, y `semanticWorkspaceManifest`/Object Explorer consumen ese graph read-only para workspaces PBL-only sin modificar PBL ni abrir staging.

## 3. Objetivo

Permitir que un workspace legacy basado en librerías `.pbl` tenga topología visible, proyecto activo resoluble y superficies read-only coherentes antes de abrir export/import ORCA.

## 4. Alcance

- detectar explícitamente el modo `pbl-only` cuando el discovery solo encuentra roots `.pbl`;
- sintetizar nodos legacy de librería en el routing y project model unificado;
- publicar esos nodos en `semanticWorkspaceManifest` para stats, dashboard y Object Explorer;
- validar que el cliente consume el nuevo `kind: library` sin degradación;
- mantener todo el slice estrictamente read-only, sin staging ni operaciones ORCA mutantes.

## 5. Fuera de alcance

- exportar objetos a staging ORCA (`B191`);
- mezclar source real con source exportado (`B192`);
- importar, compilar o regenerar PBL (`B193+`).

## 6. Criterios de aceptación

- AC1. El discovery distingue modo `pbl-only` frente a `unknown`.
- AC2. Un workspace PBL-only obtiene project model activo y routing read-only sin `.pbt/.pbproj`.
- AC3. `semanticWorkspaceManifest` publica proyectos legacy con `kind: library`.
- AC4. Object Explorer y surfaces read-only consumen ese manifest sin romper la UX visible.
- AC5. La validación cubre workspace/model/manifest y una smoke visible del Object Explorer.
- AC6. El foco canónico se mueve a `B191`.

## 7. Documentación afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`
- `docs/roadmap.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/workspace.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/objectExplorerModel.test.js out/test/server/unit/watchedFileIntake.test.js`
- `npm run test:smoke -- --grep "Object Explorer"`

## 9. Cierre registrado

- `src/server/workspace/workspaceState.ts`, `projectRouting.ts`, `projectRegistry.ts` y `unifiedProjectModel.ts` formalizan modo `pbl-only` y nodos legacy de librería en el modelo unificado;
- `src/shared/publicApi.ts` y `src/server/features/semanticWorkspaceManifest.ts` publican `kind: library` en el manifest read-only;
- `test/server/unit/workspace.test.ts`, `semanticWorkspaceManifest.test.ts`, `objectExplorerModel.test.ts`, `watchedFileIntake.test.ts` y la smoke del Object Explorer fijan el comportamiento visible.