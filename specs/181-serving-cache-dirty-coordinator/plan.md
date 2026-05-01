# Plan - Spec 181 Coordinador dirty para flush de ServingCache (B071B)

## 1. Resumen tecnico

Crear un helper pequeño en cache/server que encapsule `dirty`, `inFlight` y `flushIfDirty()` alrededor de una función async de persistencia.

## 2. Estado actual

- No hay coordinación reusable del estado dirty de ServingCache.
- El runtime solo persiste en un punto de indexación exitosa.

## 3. Diseno propuesto

- Clase pequeña con `markDirty()` y `flushIfDirty()`.
- `flushIfDirty()` itera hasta quedar estable si se vuelve a ensuciar durante el flush.

## 4. Impacto en rendimiento

- Evita flushes innecesarios y prepara coalescing mínimo.

## 5. Riesgos tecnicos

- Errores de concurrencia local si no se limpia bien `inFlight`.

## 6. Estrategia de validacion

- npm run test:unit -- --grep "ServingCacheFlushCoordinator"
- npm run compile
- npm run test:unit

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md