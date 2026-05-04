# Tasks — Spec 391 / B354

- [x] Identificar el primer slice extraíble sin tocar policies runtime.
- [x] Extraer la orquestación de persistence/flush del semantic cache fuera de `server.ts`.
- [x] Validar el slice con tests de `servingCacheRuntime` y `cacheStore`.
- [x] Extraer y validar el builder/publisher de runtime progress fuera de `server.ts`.
- [x] Planificar el siguiente corte vecino tras el primer slice verde.