# Spec 324 - symbol identity canonical key v2 (B279)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B279` endureciendo la identidad canónica exacta de símbolo, separando la única clave de familia relajada permitida para conflictos cross-project y propagando `identityKey` a las surfaces visibles que todavía podían depender demasiado del nombre.

## 2. Estado real actual

El repo ya disponía de un `buildSymbolKey` demasiado débil en `src/server/knowledge/symbolKey.ts`, basado en `kind/owner/name/arity`, que colapsaba `solution-source` y `orca-staging`, no distinguía bien objetos homónimos y contaminaba `references`/`rename` cuando la resolución semántica o el barrido textual tocaban duplicados del mismo símbolo en surfaces distintas. `crossProjectSymbolConflicts` necesitaba además seguir agrupando familias homónimas entre proyectos sin reutilizar esa identidad exacta.

## 3. Objetivo

Publicar una identidad canónica exacta y estable para símbolos semánticos del runtime, reutilizada por el query engine, `references`, `rename`, manifest, dependency graph, API symbols y reportes, sin reintroducir comparaciones solo por nombre ni una segunda identidad paralela.

## 4. Alcance

- endurecer `buildSymbolKey` con señal exacta suficiente (`uri`, posición, `fileObjectName`, `container/owner`, `kind`, `signature`, `sourceOrigin`, `implementationKind`, `declarationScope`);
- introducir `buildConflictFamilyKey` como única clave relajada permitida para agrupar conflictos cross-project/cross-library;
- ajustar `semanticQueryService`, `references`, `rename` y `crossProjectSymbolConflicts` para respetar la separación entre identidad exacta y familia;
- publicar `identityKey` canónica en `exportedSymbols`, `semanticWorkspaceManifest`, `dependencyGraph` y candidatos de conflictos cross-project;
- alinear `docs/architecture.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/testing.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md` y `docs/done-log.md` con el cierre y el paso a `B280`.

## 5. Fuera de alcance

- abrir `B280` o `B281` dentro de esta spec;
- introducir un segundo modelo de ambigüedad o otro serializador semántico paralelo;
- rediseñar IDs internos de nodos que no representen símbolos resolubles.

## 6. Criterios de aceptación

- AC1. `buildSymbolKey` distingue `solution-source` frente a `orca-staging`, objetos homónimos y ubicaciones distintas sin depender solo del nombre visible.
- AC2. `crossProjectSymbolConflicts` sigue agrupando por familia semántica y colapsa staging de la misma ubicación sin perder separación exacta por candidato.
- AC3. `references` y `rename` no arrastran ocurrencias ni edits de `orca-staging` cuando la familia canónica resuelta es la real.
- AC4. `semanticWorkspaceManifest`, `dependencyGraph`, `exportedSymbols` y candidatos de conflictos publican `identityKey` reutilizando la misma serialización central.
- AC5. docs canónicas quedan alineadas y el siguiente foco del repo pasa a `B280`.

## 7. Documentación afectada

- `docs/architecture.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/symbolKey.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js`
- `npx mocha --ui tdd out/test/server/unit/references.test.js out/test/server/unit/rename.test.js`
- `npx mocha --ui tdd out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/dependencyGraph.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js`

## 9. Cierre registrado

- `src/server/knowledge/symbolKey.ts` publica ya identidad exacta y family key relajada sin volver a comparaciones por nombre plano;
- `src/server/knowledge/resolution/semanticQueryService.ts`, `references.ts`, `rename.ts` y `crossProjectSymbolConflicts.ts` separan ya familia exacta, preferencia por source real y colapso controlado de staging;
- `src/server/features/workspaceSymbols.ts`, `semanticWorkspaceManifest.ts`, `dependencyGraph.ts`, `crossProjectSymbolConflicts.ts` y `src/shared/publicApi.ts` exponen `identityKey` canónica en las surfaces visibles relevantes;
- el siguiente foco canónico del repo pasa a `B280`.