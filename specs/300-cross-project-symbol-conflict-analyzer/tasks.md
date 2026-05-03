# Tasks - Spec 300 cross project symbol conflict analyzer (B255)

## 1. Preparación

- [x] T1. Confirmar con un test semilla que el fallback global cross-project devolvía múltiples winners sin marcar ambigüedad.
- [x] T2. Identificar `KnowledgeBase` + `buildSymbolKey` + `WorkspaceState` como owning abstraction del slice.

## 2. Implementación

- [x] T3. Corregir `semanticQueryService` y `queryContext` para reflejar ambigüedad cross-project real.
- [x] T4. Implementar `crossProjectSymbolConflicts` como feature read-only con ranking/evidence y colapso de staging.
- [x] T5. Exponer la surface por API pública v2.7.0, tool bridge, LSP y comando Markdown.
- [x] T6. Alinear la documentación viva y mover el foco canónico del repo.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar la validación focal de unit sobre query/feature/contrato.
- [x] T9. Ejecutar la smoke de activación de la extensión.

## 4. Cierre

- [x] T10. Mover `B255` a `docs/done-log.md`, sacar el ítem del backlog activo y dejar `B256` como siguiente foco natural.
