# [016] Tasks — Hot Context Cache (B134A)

## Implementación
- [x] T1. Crear `src/server/knowledge/HotContextCache.ts`.
- [x] T2. Instanciar en `server.ts`.
- [x] T3. Invalidar en `onDidChangeContent` y `onDidClose`.

## Tests
- [x] T4. `setActive` con misma URI/versión no invalida.
- [x] T5. Cambio de URI o versión invalida.
- [x] T6. `invalidateForUri(activeUri)` y `invalidateForUri(otra)`.

## Documentación
- [x] T7. Cerrar B134A en `current-focus.md` y `backlog.md`.
