# Tasks — Spec 371 Catalog provenance audit against official Appeon sources

- [x] Extender `buildCatalogConsistencyReport()` con un audit reutilizable de provenance por dataset y dominio.
- [x] Añadir guards de mismatch entre dataset y `provenance.kind`/`provenance.authority`.
- [x] Auditar metadata obligatoria para entries oficiales y curados (`source`, `sourceUrl`, `version`, `generatedAt` donde aplica).
- [x] Añadir tests focales de provenance para rails mixtos y curados representativos.
- [x] Cerrar B339 en spec, backlog, done-log, current-focus y documentación canónica afectada.