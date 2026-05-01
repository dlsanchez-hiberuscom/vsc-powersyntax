# Plan - Spec 176 Snapshot persistente de ServingCache en cacheStore (B071B)

## 1. Resumen tecnico

Añadir a cacheStore un archivo versionado para snapshots de ServingCache y exponer métodos load/persist que trabajen con ServingCacheEntry genérico.

## 2. Estado actual

- ServingCache ya sabe exportar y restaurar entradas en memoria.
- cacheStore solo persiste checkpoint, journal y sus particiones por proyecto.

## 3. Diseno propuesto

- Introducir un archivo dedicado de snapshot de serving.
- Persistir schemaVersion, createdAt y entries.
- Cargar snapshot válido o devolver array vacío si falta o es inválido.

## 4. Impacto en rendimiento

- Debe ser neutro fuera de los puntos explícitos de persistencia o restore.
- El formato debe ser lo bastante ligero como para no penalizar reaperturas.

## 5. Riesgos tecnicos

- Formato demasiado rígido para futuras features.
- Mezclar fallos de snapshot con fallos del checkpoint semántico principal.

## 6. Estrategia de validacion

- npm run test:unit -- --grep "persistServingCacheSnapshot"
- npm run compile
- npm run test:unit

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md