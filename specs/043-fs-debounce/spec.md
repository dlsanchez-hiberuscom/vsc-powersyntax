# Spec 043 — File watcher debounce (B127)

## Motivación
Coalescer eventos de fs (`change`/`create`/`delete`) por URI con
ventana configurable para evitar thrash de re-indexación.

## Alcance
- `src/server/system/fileWatcherDebouncer.ts`:
  - `createFileWatcherDebouncer({ delayMs, onFlush })`.
  - Aplica eventos `change|create|delete` por URI; conserva el
    último estado por URI; ejecuta `onFlush(events)` cuando cesan
    los cambios.
- Tests con timers reales cortos.

## Criterios
1. Múltiples eventos sobre la misma URI colapsan al último.
2. Eventos en URIs distintas se entregan agrupados en un solo flush.
3. `dispose()` cancela timers pendientes.
