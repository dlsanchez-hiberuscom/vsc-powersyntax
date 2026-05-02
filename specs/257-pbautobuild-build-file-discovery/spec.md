# Spec 257 - PBAutoBuild build-file discovery and validation (B182)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar el primer contrato server-side del carril de build moderno descubriendo build files JSON de PBAutoBuild, validando su shape mínimo y vinculándolos al marker PowerBuilder que representan sin ejecutar compilaciones.

## 2. Estado real actual

- `B181` ya detectaba `PBAutoBuild250.exe` de forma read-only en cliente, pero el runtime no sabía todavía qué build files JSON existían ni si representaban un proyecto utilizable.
- `WorkspaceState`, `discovery.ts` y `watchedFileIntake.ts` ya conocían `.pbw/.pbt/.pbproj/.pbsln`, por lo que el punto correcto para `B182` era el servidor/workspace model, no el cliente.
- el cliente solo observaba sources y markers topológicos; los `.json` quedaban fuera del refresh incremental.

## 3. Objetivo

Descubrir build files JSON de PBAutoBuild desde el workspace, clasificarlos como `usable/invalid/ambiguous` y resolver qué marker PowerBuilder representan.

## 4. Alcance

- introducir un parser puro para candidatos JSON de PBAutoBuild;
- resolver referencias a `.pbw/.pbt/.pbproj/.pbsln` contra la topología conocida;
- exponer reason codes explícitos para `missing-build-plan`, `malformed-json`, `missing-project-reference`, `unresolved-project-reference` y `ambiguous-project-reference`;
- refrescar ese catálogo tanto en discovery completo como en watcher incremental;
- publicar un resumen read-only en `showStats` sin abrir runner, logs ni UX de build.

## 5. Fuera de alcance

- ejecutar builds reales;
- parsear logs de PBAutoBuild o publicar Problems Panel;
- abrir comandos, perfiles o status UX específico de build;
- soportar schema completo de Appeon más allá del shape mínimo observable (`BuildPlan` + referencias de proyecto).

## 6. Criterios de aceptacion

- AC1. El servidor descubre build files JSON relevantes sin contaminar el hot path semántico.
- AC2. Cada build file queda clasificado como `usable`, `invalid` o `ambiguous` con reason code estable.
- AC3. Discovery inicial y watcher incremental comparten el mismo contrato read-only.
- AC4. El cliente sigue ligero y solo observa eventos; no clasifica JSON ni ejecuta build.
- AC5. Docs canónicas distinguen ya capability detection (`B181`) de discovery/validation (`B182`).

## 7. Documentacion afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/roadmap.md`
- `docs/testing.md`

## 8. Validacion requerida

- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/pbAutoBuildBuildFiles.test.js out/test/server/unit/workspace.test.js out/test/server/unit/watchedFileIntake.test.js`

## 9. Resultado de cierre

- `src/server/workspace/pbAutoBuildBuildFiles.ts` introduce el parser/clasificador puro de candidatos JSON de PBAutoBuild y el resumen por estado;
- `src/server/workspace/discovery.ts`, `src/server/workspace/workspaceState.ts` y `src/server/workspace/watchedFileIntake.ts` integran discovery inicial, snapshot/read-only y refresh incremental del catálogo;
- `src/client/extension.ts`, `src/server/workspace/watchedFileChangeBridge.ts`, `src/server/server.ts` y `src/shared/publicApi.ts` añaden observación de `.json` y resumen read-only en stats sin abrir runner;
- `test/server/unit/pbAutoBuildBuildFiles.test.ts`, `workspace.test.ts` y `watchedFileIntake.test.ts` fijan parser, integración con topología, snapshot y watcher incremental.