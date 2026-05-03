# Plan - Spec 300 cross project symbol conflict analyzer (B255)

## 1. Enfoque técnico

Reutilizar la base ya cerrada de query/evidence/routing. El slice se divide en dos partes locales: primero alinear la ambigüedad real del query engine y `queryContext`, y después proyectar una feature read-only server-side que agrupe por `buildSymbolKey` y enriquezca cada conflicto con proyecto, librería y `sourceOrigin` preferido.

## 2. Pasos

1. Añadir un probe unitario que confirme que el fallback global cross-project devolvía varios winners sin marcar ambigüedad.
2. Corregir `semanticQueryService` y `queryContext` para reflejar cualquier resolución con múltiples winners.
3. Implementar `crossProjectSymbolConflicts` reutilizando `KnowledgeBase`, `WorkspaceState` y prioridad de `sourceOrigin`.
4. Exponer la surface por API pública, tool bridge, LSP y comando Markdown.
5. Alinear tests contractuales/smoke y mover el foco documental a `B256`.

## 3. Riesgos

- sobrerreportar staging ORCA como conflicto real frente a source canónico;
- agrupar por nombre plano y mezclar símbolos que solo parecen homónimos;
- dejar desalineadas las nociones de ambigüedad entre query trace, `queryContext` y la nueva feature.

## 4. Validación

- `npm run build:test`
- unit focal sobre `semanticQueryService`, `queryContext`, `crossProjectSymbolConflicts` y contrato público
- smoke de activación con API/comando read-only nuevos

## 5. Resultado ejecutado

1. La ambigüedad cross-project queda explícita en query trace y `queryContext`.
2. El analizador B255 agrupa por `buildSymbolKey`, colapsa staging en la misma ubicación y proyecta evidence exportable.
3. El foco canónico del repo pasa a `B256`.
