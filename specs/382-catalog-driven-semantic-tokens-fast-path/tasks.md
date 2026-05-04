# Tasks — Spec 382 Catalog-driven semantic tokens fast path

- [x] Añadir un fast path catalog-driven en `src/server/features/semanticTokens.ts`.
- [x] Introducir el token type `keyword` sin romper `enumMember` ni modifiers existentes.
- [x] Cubrir la nueva clasificación con un test unitario focal para `IF`, `IsValid`, `SQLCA` y `This`.
- [x] Revalidar `Semantic Tokens` y `hotPathAllocationBudget`.
- [x] Sacar `B329` del backlog activo y mover el foco a `B366` por bloqueo real de la cadena generated/localization.