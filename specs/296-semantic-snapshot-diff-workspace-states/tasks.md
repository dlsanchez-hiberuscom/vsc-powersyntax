# Tasks - Spec 296 semantic snapshot diff workspace states (B251)

## 1. Preparación

- [x] T1. Confirmar que el snapshot exportado ya contiene manifest, símbolos, diagnósticos y health suficientes para un diff defendible.
- [x] T2. Identificar el owning abstraction del slice en `src/client/semanticWorkspaceSnapshot.ts` y `src/shared/publicApi.ts`.

## 2. Implementación

- [x] T3. Publicar el contrato `ApiSemanticWorkspaceSnapshotDiff` y el método `diffSemanticWorkspaceSnapshots()`.
- [x] T4. Exponer el tool read-only `semantic-snapshot-diff` en el bridge público.
- [x] T5. Implementar el cálculo read-only de diffs sobre snapshots serializados.
- [x] T6. Alinear la documentación viva y mover el foco canónico del repo.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar `npx mocha --ui tdd out/test/server/unit/semanticWorkspaceSnapshot.test.js out/test/server/unit/publicApi.test.js`.
- [x] T9. Ejecutar `npm run test:smoke -- --grep "la extensión se activa"`.

## 4. Cierre

- [x] T10. Mover `B251` a `docs/done-log.md` y dejar `B252` como foco siguiente.
