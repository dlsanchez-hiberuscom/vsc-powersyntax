# Spec 017 — Caché de serving para features interactivas (B134B)

## 1. Motivación

Hover, completion, signatureHelp y definition recalculan resultados
incluso para la misma posición/contenido de archivo dentro del mismo
edit. Hace falta una capa de caché específica de **serving** que
memoize por `(feature, uri, position, kbVersion)`.

## 2. Alcance

- Nueva clase `ServingCache<T>` en `src/server/knowledge/ServingCache.ts`.
- LRU acotada (`maxEntries`, configurable, default 256).
- API:
  - `get(key): T | undefined`
  - `set(key, value): void`
  - `invalidate(uriOrAll?): void`
  - `size(): number`
- Función helper `makeKey({ feature, uri, line, character, kbVersion, extra? })`.
- Invalidación granular:
  - Por URI (al cambiar contenido de ese documento).
  - Total (al cambiar versión de KB tras re-índice masivo).

### Fuera de alcance

- Wiring exhaustivo de cada feature (incremental). En esta spec se cablea
  un feature como prueba de concepto (hover) y se documenta el patrón
  para los demás.

## 3. Criterios de aceptación

1. `ServingCache` es genérico y respeta el límite LRU.
2. `invalidate(uri)` borra solo entradas con esa URI.
3. `invalidate()` borra todo.
4. La clave `makeKey` devuelve cadenas estables para datos iguales.
5. Hover usa el caché y devuelve el resultado memoizado en el segundo
   acceso a la misma posición y misma versión de KB.
6. Tests unitarios cubren LRU, invalidación, claves estables.

## 4. Documentación afectada

- `docs/architecture.md` (capa de serving cache).
- `docs/current-focus.md`, `docs/backlog.md` (B134B cerrada).
- `README.md` (mención de caché de serving).
