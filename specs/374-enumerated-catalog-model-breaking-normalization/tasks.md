# Tasks — Spec 374 Enumerated catalog model breaking normalization

- [x] Introducir `enumerated-type` y `enumerated-types` en el contrato del catálogo.
- [x] Añadir metadata específica de enums (`enumValues`, `enumValueOf`, `enumNumericValue`, `enumValueMeaning`, `allowedOn*`).
- [x] Migrar el rail manual de enumeraciones al modelo canónico sin tipos legacy con `!`.
- [x] Publicar query APIs explícitas para tipos y valores enumerados.
- [x] Endurecer consistency/query layer para bloquear `enumerated-type` inválidos y preservar queries indexadas.
- [x] Alinear completion/hover con el nuevo split `enumerated-type` / `enumerated-value`.
- [x] Actualizar tests incompatibles y cerrar la validación focal del slice.
- [x] Alinear documentación viva y registrar el cierre formal en done-log/current-focus/spec.