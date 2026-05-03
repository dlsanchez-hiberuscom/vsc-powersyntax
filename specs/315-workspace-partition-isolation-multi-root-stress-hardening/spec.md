# Spec 315 - workspace partition isolation and multi-root stress hardening (B268)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B268` endureciendo el aislamiento multi-root para que routing, `sourceOrigin`, manifest, Object Explorer, caché persistente, build profiles y ORCA staging no mezclen estado cuando se repiten labels visibles entre roots distintos.

## 2. Estado real actual

El repo ya dispone de `workspace.test.ts`, `watchedFileIntake.test.ts`, `cacheStore.test.ts`, `semanticWorkspaceManifest.test.ts`, `objectExplorerModel.test.ts`, `pbAutoBuildProfileMatrix.test.ts` y `orcaStagingExport.test.ts` cubriendo roots duplicados. `WorkspaceState` decide `sourceOrigin` por el marker topológico más cercano, `watchedFileIntake` e `workspaceIndexer` reutilizan esa misma inferencia contextual y la documentación canónica ya mueve el foco a `B274`.

## 3. Objetivo

Garantizar que el runtime trata cada root/proyecto/librería/build profile/staging como partición independiente por URI real, sin colapsar por labels duplicados ni por un modo global del workspace.

## 4. Alcance

- endurecer `WorkspaceState` para inferir `sourceOrigin` por marker topológico más cercano;
- reutilizar esa inferencia contextual en watcher e indexador;
- fijar tests multi-root para routing, manifest y Object Explorer con proyectos/librerías homónimos;
- fijar tests de caché persistente, build profile matrix y ORCA staging para identidades duplicadas entre roots;
- alinear `docs/testing.md`, `docs/developer-workflows.md`, `docs/architecture.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md` y `docs/done-log.md` con el cierre.

## 5. Fuera de alcance

- abrir nuevas surfaces multi-root o stress perf/soak que pertenecen a `B274+`;
- rehacer `ProjectRouting` o `UnifiedProjectModel` sin una regresión real demostrada;
- tratar roots distintos como equivalentes solo porque comparten `name`, basename de librería o basename de build file.

## 6. Criterios de aceptación

- AC1. `sourceOrigin` contextual no contamina roots workspace con `solution-source` en workspaces mixed.
- AC2. routing, manifest y Object Explorer mantienen separados proyectos/librerías homónimos entre roots distintos.
- AC3. caché persistente, build profiles y ORCA staging preservan identidad por URI completa y no por label.
- AC4. watcher/indexador reutilizan la misma inferencia contextual de `sourceOrigin` que `WorkspaceState`.
- AC5. docs canónicas quedan alineadas y el siguiente foco canónico pasa a `B274`.

## 7. Documentación afectada

- `docs/testing.md`
- `docs/developer-workflows.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/workspace.test.js out/test/server/unit/watchedFileIntake.test.js out/test/server/unit/cacheStore.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/objectExplorerModel.test.js out/test/server/unit/pbAutoBuildProfileMatrix.test.js out/test/server/unit/orcaStagingExport.test.js`

## 9. Cierre registrado

- el runtime ya aísla roots/proyectos/librerías/build profiles/staging por URI real en las surfaces visibles y en persistencia;
- `sourceOrigin` contextual ya sigue el marker topológico más cercano y no un fallback global del modo del workspace;
- el siguiente foco canónico del repo pasa a `B274`.