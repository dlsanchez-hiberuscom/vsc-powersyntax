# Tasks — Spec 373 Runtime, integration and nonvisual PowerBuilder system object datatypes catalog completion

- [x] Consolidar `manual/runtime/` y `manual/integration/` como rails estables por ownership sin reintroducir un archivo monolítico.
- [x] Completar los tipos runtime/nonvisual, integración moderna, PDF, correo, profiling/trazas, reflexión, OLE no visual y objetos de sistema listados en B359.
- [x] Mantener el split de `B358`: `Application` sigue en runtime/system y `OLEControl`/`OLECustomControl` permanecen fuera del rail nonvisual.
- [x] Corregir el casing canónico de tipos runtime/integration relevantes (`Inet`, `RESTClient`, `MailFileDescription`, `MailMessage`).
- [x] Alinear `PB_BUILTIN_TYPES` con los tipos runtime/integration representativos cerrados en B359.
- [x] Añadir validación focal que bloquee la lista completa B359 en `manual-core`, la resolución representativa por categoría y la exclusión del extractor noise.
- [x] Cerrar B359 en spec, backlog, done-log, current-focus y documentación canónica afectada.