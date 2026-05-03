# Plan - Spec 315 workspace partition isolation and multi-root stress hardening (B268)

## 1. Enfoque técnico

Partir del borde más barato: primero comprobar si el routing ya aislaba roots homónimos; al pasar, el bug real apareció en `sourceOrigin`, que seguía usando un `hasSolutionRoots` global. El cierre se completó endureciendo esa inferencia y fijando después las surfaces visibles y persistentes que podían volver a colapsar identidad por label.

## 2. Pasos

1. Confirmar routing multi-root con proyectos/librerías homónimos en `workspace.test.ts`.
2. Fijar el bug raíz de `sourceOrigin` contextual por marker topológico más cercano en `WorkspaceState`.
3. Reutilizar la misma inferencia en watcher e indexador.
4. Añadir coberturas multi-root para manifest, Object Explorer, cache partitions, build profile matrix y ORCA staging.
5. Validar con la batería focal del bloque y mover el foco a `B274`.

## 3. Riesgos

- mantener un `sourceOrigin` global por modo y seguir contaminando roots mixed;
- asumir que labels visibles únicos implican identidad única y colapsar por nombre en Object Explorer, build profile matrix o cache partitions;
- cerrar `B268` como “solo tests” sin fijar el bug raíz del provenance contextual.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/workspace.test.js out/test/server/unit/watchedFileIntake.test.js out/test/server/unit/cacheStore.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/objectExplorerModel.test.js out/test/server/unit/pbAutoBuildProfileMatrix.test.js out/test/server/unit/orcaStagingExport.test.js`

## 5. Resultado ejecutado

1. `WorkspaceState` ya decide `sourceOrigin` por el marker topológico más cercano.
2. watcher e indexador ya reutilizan esa misma inferencia contextual.
3. manifest, Object Explorer, build profiles, ORCA staging y cache partitions ya quedan defendidos frente a duplicados multi-root por URI.