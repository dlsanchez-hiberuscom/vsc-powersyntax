# Plan — Spec 376 Enumerated catalog completion and curated gap closure

## Phase 1 — Cerrar gaps de metadata útil

- [x] Conservar documentación oficial en property variants sin valores nominales, como `SecureProtocol`.
- [x] Completar `documentation` en tipos manual-core de UI/archivo que ya estaban publicados en runtime.

## Phase 2 — Gap curado mínimo restante

- [x] Detectar el hueco mínimo del backlog B362 que seguía ausente en runtime (`SeekType`).
- [x] Publicar `SeekType` como enum manual-curated de archivo con miembros canónicos respaldados por evidencia de corpus real.

## Phase 3 — Guardrails y cierre canónico

- [x] Fijar tests focales para `SecureProtocol`, documentación manual-core, merge de `FillPattern` y `SeekType`.
- [x] Validar generator, compile, unit tests focales y snapshot runtime del `SystemCatalog` ya compilado.
- [x] Sacar B362 del foco activo y mover el foco documental a B363.