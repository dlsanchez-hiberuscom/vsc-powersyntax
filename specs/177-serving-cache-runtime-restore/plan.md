# Plan - Spec 177 Restore y persist de ServingCache en runtime (B071B)

## 1. Resumen tecnico

Crear un helper pequeño entre ServingCache y SemanticCacheStore, cubrirlo con tests unitarios y usarlo en server.ts al restaurar estado y al persistir en readiness estable.

## 2. Estado actual

- ServingCache ya exporta/restaura entradas.
- cacheStore ya persiste snapshots de serving.
- server.ts todavía ignora esa capacidad.

## 3. Diseno propuesto

- Nuevo helper con funciones restoreServingCacheSnapshot() y persistServingCacheSnapshot().
- Wiring en startup tras la restauración compatible de cacheStore.
- Wiring en el punto donde ya se persiste checkpoint estable.

## 4. Impacto en rendimiento

- Debe reducir trabajo repetido tras reapertura para queries ya servidas.
- El coste añadido debe limitarse a startup y persistencia estable.

## 5. Riesgos tecnicos

- Restaurar snapshot en un momento demasiado temprano o tardío.
- Persistir entries no serializables sin filtro previo.

## 6. Estrategia de validacion

- npm run test:unit -- --grep "servingCachePersistence"
- npm run compile
- npm run test:unit
- npm test

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md