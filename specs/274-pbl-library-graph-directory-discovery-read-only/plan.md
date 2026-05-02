# Plan - Spec 274 PBL library graph and directory discovery read-only (B190)

## 1. Enfoque técnico

Resolver `B190` sobre el modelo de workspace ya existente. El gap real no estaba en ORCA, sino en que el routing/model project solo materializaban `.pbt/.pbproj`; por eso el slice correcto fue sintetizar nodos read-only de librería y exponerlos en el manifest y la UX ya cerrada.

## 2. Pasos

1. Extender `WorkspaceMode` con `pbl-only`.
2. Hacer que el routing y el project model acepten roots `.pbl` como nodos legacy cuando no exista un marker dueño.
3. Publicar `kind: library` en el manifest read-only.
4. Validar workspaces PBL-only en workspace/model/manifest/Object Explorer.
5. Actualizar docs canónicas y mover el foco a `B191`.

## 3. Riesgos

- introducir nodos duplicados para librerías ya declaradas por `.pbt/.pbproj`;
- confundir topología read-only con staging/source exportado futuro;
- degradar el cliente obligándolo a construir un segundo índice local.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/workspace.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/objectExplorerModel.test.js out/test/server/unit/watchedFileIntake.test.js`
- `npm run test:smoke -- --grep "Object Explorer"`

## 5. Resultado ejecutado

1. El plugin distingue `pbl-only` y resuelve proyecto activo sobre una librería legacy.
2. El manifest y el Object Explorer proyectan esa topología sin abrir staging.
3. `B191` pasa a ser el siguiente foco del carril legacy.