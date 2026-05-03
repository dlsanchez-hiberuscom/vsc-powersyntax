# Tasks - Spec 309 semantic consistency oracle (B264)

## 1. Preparación

- [x] T1. Confirmar las surfaces read-only dueñas del drift: `currentObjectContext`, `semanticWorkspaceManifest`, `dependencyGraph`, diagnostics, `dataWindowSqlLineage` y `crossProjectSymbolConflicts`.
- [x] T2. Encontrar el primer borde falsable: `currentObjectContext.objectInfo.objectKind` no debía seguir publicando `EntityKind.Type`.

## 2. Implementación

- [x] T3. Compartir la inferencia de `objectKind` por URI entre currentObjectContext y manifest.
- [x] T4. Añadir el oracle interno cross-surface con reason codes explícitos.
- [x] T5. Hacer el oracle honesto ante manifest truncado por budget.
- [x] T6. Añadir smoke real sobre PFC Solution y OrderEntry.
- [x] T7. Alinear docs canónicas y mover el foco a `B265`.

## 3. Validación

- [x] T8. Ejecutar `npm run build:test`.
- [x] T9. Ejecutar `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/semanticConsistencyOracle.test.js`.
- [x] T10. Ejecutar `npx mocha --ui tdd out/test/server/performance/semanticConsistencyOracle.smoke.test.js`.

## 4. Cierre

- [x] T11. Sacar `B264` del backlog activo, registrar el cierre en `docs/done-log.md` y dejar `B265` como foco siguiente.