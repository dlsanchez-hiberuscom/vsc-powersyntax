# [014] Tasks — Scheduler multinivel (B121)

## Implementación
- [x] T1. Añadir `TaskPriority.Near = 5`.
- [x] T2. Añadir `nearQueue` y `activeNearTask`.
- [x] T3. Implementar `enqueueNear` y `cancelAllNear`.
- [x] T4. Refactorizar `drainBackground` → `drainQueues` con prioridad Near > Background.
- [x] T5. `runInteractive` cancela near + background activos.
- [x] T6. `enqueueNear` cancela background activo.

## Tests
- [x] T7. `Near` se ejecuta antes que `Background`.
- [x] T8. `Near` cancela `Background` activa.
- [x] T9. `Interactive` cancela `Near` activa.
- [x] T10. `cancelAllNear` cancela pendientes y activa.

## Documentación
- [x] T11. Cerrar B121 en `current-focus.md` y `backlog.md`.
