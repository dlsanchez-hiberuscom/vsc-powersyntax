# Plan - Spec 193 KB snapshot-first readers (B151)

## 1. Resumen tecnico

Hacer que las lecturas documentales de `KnowledgeBase` prioricen el snapshot publicado cuando exista para reducir `B151` en el boundary mas pequeno y reusable.

## 2. Estado actual

- `SemanticDocumentSnapshot` ya publica `symbols` y `scopes` por documento.
- `KnowledgeBase` seguia mezclando lecturas documentales sobre indices legacy paralelos.
- Faltaba evidencia unitaria focalizada sobre el consumo snapshot-first de ese boundary.

## 3. Diseno propuesto

- Priorizar `documentSnapshots` en `getEntitiesByUri()`.
- Priorizar `documentSnapshots` en `getScopeAt()`.
- Mantener el fallback legacy cuando el documento aun no tenga snapshot publicado.

## 4. Impacto en el runtime

- Reduce duplicidad interna de lectura documental.
- Prepara el cierre posterior de `B151A` en features core sin abrir superficie nueva.

## 5. Riesgos tecnicos

- Romper el fallback legacy en documentos todavia no publicados.
- Desalinear snapshots y readers documentales si la prioridad no es consistente.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/knowledgeBase"`
- `npm run compile`
- `npm run test:unit`

## 7. Documentacion a actualizar

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/roadmap.md`