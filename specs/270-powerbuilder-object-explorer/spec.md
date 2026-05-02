# Spec 270 - PowerBuilder Object Explorer (B214)

**Estado:** cerrada y validada.

## 1. Resumen

Abrir una vista `PowerBuilder Object Explorer` navegable y read-only en el side bar, agrupada por proyecto, librería y tipo de objeto, reutilizando `semanticWorkspaceManifest` y `project model` ya cerrados.

## 2. Estado real actual

`B214` queda `Closed`: el cliente registra la vista `powerbuilderObjectExplorer`, sus filtros `workspace/current-project/current-file` y la acción segura de abrir objeto sin crear un motor semántico paralelo ni consultas por nodo al servidor.

## 3. Objetivo

Permitir que el usuario navegue el workspace PowerBuilder sin depender de rutas físicas, usando una vista persistente y observable sobre contratos read-only ya existentes.

## 4. Alcance

- enriquecer el manifest semántico con metadatos por objeto suficientes para el árbol;
- construir un modelo puro proyecto -> librería -> kind -> objeto con readiness y sourceOrigin;
- registrar una vista de side bar con comandos de foco seguro y apertura de objeto;
- validar con unit del modelo/manifiesto y smoke del foco sobre archivo activo.

## 5. Fuera de alcance

- crear endpoints nuevos o RPCs por nodo para poblar el explorer;
- introducir edición o acciones mutantes desde el árbol;
- resolver todavía el panel dedicado del objeto activo (`B215`).

## 6. Criterios de aceptación

- AC1. Existe una vista `PowerBuilder Object Explorer` visible en el side bar.
- AC2. La vista agrupa por proyecto, librería y kind sin segundo índice local.
- AC3. Los nodos exponen readiness/sourceOrigin y permiten abrir el objeto de forma segura.
- AC4. Existen filtros para proyecto actual y archivo activo.
- AC5. Hay validación unitaria del modelo/manifiesto y smoke del foco sobre el archivo activo.
- AC6. El foco canónico se mueve a `B215`.

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
- `npx mocha --ui tdd out/test/server/unit/objectExplorerModel.test.js out/test/server/unit/semanticWorkspaceManifest.test.js`
- `npm run test:smoke -- --grep "Object Explorer en el archivo activo"`

## 9. Cierre registrado

- `src/shared/publicApi.ts` y `src/server/features/semanticWorkspaceManifest.ts` aportan metadatos por objeto suficientes para la vista;
- `src/client/objectExplorerModel.ts` y `src/client/objectExplorer.ts` componen y sirven el árbol read-only;
- `src/client/extension.ts` y `package.json` registran la vista, menús y comandos visibles.