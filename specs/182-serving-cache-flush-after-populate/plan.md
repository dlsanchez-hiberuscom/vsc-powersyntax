# Plan - Spec 182 Flush tras poblar ServingCache (B071B)

## 1. Resumen tecnico

Crear un helper runtime para poblar ServingCache y avisar al coordinador dirty, luego reutilizarlo desde hover, definition, signatureHelp y completion.

## 2. Estado actual

- `ServingCacheFlushCoordinator` existe.
- Los handlers interactivos todavía llaman `servingCache.set(...)` directamente.

## 3. Diseno propuesto

- Helper pequeño con `cache.set`, `markDirty` y `flushIfDirty`.
- Instancia única del coordinador en `server.ts`.

## 4. Impacto en rendimiento

- Mejora la frescura de la snapshot persistente con coalescing básico.

## 5. Riesgos tecnicos

- Si el helper no se usa en todos los call sites, la persistencia quedará inconsistente.

## 6. Estrategia de validacion

- npm run test:unit -- --grep "cacheServingResult"
- npm run compile
- npm run test:unit

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md