# Tasks — Spec 391 / B354

- [x] Identificar el primer slice extraíble sin tocar policies runtime.
- [x] Extraer la orquestación de persistence/flush del semantic cache fuera de `server.ts`.
- [x] Validar el slice con tests de `servingCacheRuntime` y `cacheStore`.
- [x] Extraer y validar el builder/publisher de runtime progress fuera de `server.ts`.
- [x] Planificar el siguiente corte vecino tras el primer slice verde.
- [x] Extraer y validar los workload runners gestionados (`near-context`, `export-reporting`, `maintenance`) fuera de `server.ts`.
- [x] Extraer y validar los adapters `pbautobuild` y `legacy-orca` sobre el mismo helper de background.
- [x] Revalidar runtime/performance/corpus real y cerrar artefactos canónicos.