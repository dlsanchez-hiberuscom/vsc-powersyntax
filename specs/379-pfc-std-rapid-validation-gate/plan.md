# Plan — Spec 379 PFC/STD rapid validation gate

## Phase 1 — Reutilizar la evidencia real existente

- [x] Inventariar las suites smoke/performance ya presentes para PFC Workspace/Solution y STD_FC_OrderEntry.
- [x] Definir un grep controlado que cubra discovery, indexing, serving básico y no crash sin abrir una suite nueva paralela.

## Phase 2 — Publicar el lane reproducible

- [x] Implementar un runner dedicado que detecte corpus locales y ejecute build + smoke/performance focal.
- [x] Publicar el lane como script npm estable para refactors arquitectónicos.
- [x] Persistir un artefacto JSON con availability, steps y resultado final del gate.

## Phase 3 — Cierre canónico

- [x] Ejecutar el gate en el entorno actual y verificar paso real sobre PFC Workspace/Solution y STD_FC_OrderEntry.
- [x] Alinear testing, performance-budget, current-focus, backlog, done-log y `test/corpora/README.md` con el nuevo lane.
- [x] Devolver el foco activo a `B364`, ya sin bloqueo por validación arquitectónica ad hoc.