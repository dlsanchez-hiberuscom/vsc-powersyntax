# Tasks — Spec 429 / BL-03

- [x] Ampliar la lista de statements SQL embebidos detectados por `findSqlRegions()`.
- [x] Evitar falsos positivos sobre llamadas normales como `open()` o `rollback()`.
- [x] Cubrir la nueva detección en `sqlRegions` y `currentObjectContext` antes de cerrar el backlog canónico.