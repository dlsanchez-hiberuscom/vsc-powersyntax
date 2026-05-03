# Tasks — Spec 370 System catalog query/index hardening v2

- [x] Añadir buckets compuestos readonly en `buildIndexes.ts` para dominio, kind, enum value y owner type por dominio.
- [x] Exponer APIs indexadas desde `queryService.ts` para queries de dominio, kind, owner types y enumerados.
- [x] Endurecer member/event queries owner-scoped para que reutilicen índices específicos cuando el owner type sea conocido.
- [x] Fijar una prioridad explícita para `resolveLanguageSymbol()`.
- [x] Mantener `SystemCatalog.ts` como facade delgada sin acceso directo a `PB_SYSTEM_SYMBOL_REGISTRY.indexes`.
- [x] Añadir tests focales y validar con compilación + suites de catálogo.
- [x] Cerrar B365 en spec, done-log, current-focus y documentación canónica afectada.