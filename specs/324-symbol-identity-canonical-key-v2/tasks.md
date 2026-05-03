# Tasks - Spec 324 symbol identity canonical key v2 (B279)

## 1. Preparación

- [x] T1. Identificar el ancla mínima de `B279` en `src/server/knowledge/symbolKey.ts`.
- [x] T2. Fijar el hueco real con tests focales sobre colisión `solution-source` frente a `orca-staging`.

## 2. Implementación

- [x] T3. Endurecer `buildSymbolKey` y mantener `dedupeBySymbolKey` sobre la identidad exacta.
- [x] T4. Introducir `buildConflictFamilyKey` para el agrupado relajado de conflictos cross-project.
- [x] T5. Ajustar `semanticQueryService`, `references` y `rename` para no mezclar surfaces duplicadas cuando la canónica resuelta es la real.
- [x] T6. Propagar `identityKey` a `exportedSymbols`, `semanticWorkspaceManifest`, `dependencyGraph` y candidatos de conflictos cross-project.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar `npx mocha --ui tdd out/test/server/unit/symbolKey.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js`.
- [x] T9. Ejecutar `npx mocha --ui tdd out/test/server/unit/references.test.js out/test/server/unit/rename.test.js`.
- [x] T10. Ejecutar `npx mocha --ui tdd out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/dependencyGraph.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js`.

## 4. Cierre

- [x] T11. Actualizar `docs/architecture.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/testing.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md` y `docs/done-log.md`.
- [x] T12. Sacar `B279` del backlog activo, registrar el cierre en `docs/done-log.md`, mover `docs/current-focus.md` a `B280` y dejar la trazabilidad en `specs/324-symbol-identity-canonical-key-v2`.