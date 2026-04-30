# Plan — 014 Scheduler multinivel (B121)

## Cambios en `src/server/runtime/scheduler.ts`

1. Ampliar `TaskPriority`:
   ```ts
   export enum TaskPriority {
     Interactive = 0,
     Near = 5,
     Background = 10
   }
   ```
2. Añadir campos:
   - `nearQueue: QueuedTask[]`
   - `activeNearTask: QueuedTask | null`
3. API nueva:
   - `enqueueNear<T>(task): Promise<T>`
   - `cancelAllNear(): void`
   - getter `pendingNearCount`
4. Política de cancelación:
   - `runInteractive` cancela `activeNearTask` y `activeBackgroundTask`.
   - `enqueueNear` cancela solo `activeBackgroundTask` si existe.
5. Política de drenaje (`drainQueues`):
   - Si hay `Interactive` activa → no drenar.
   - Si hay near task pendiente y no hay near task activa → ejecutarla.
   - Si no hay near task pendiente y no hay near activa y no hay
     background activa y hay background pendiente → ejecutarla.
6. `shutdown` cancela todo.

## Tests en `test/server/unit/scheduler.test.ts`

- `Near` se ejecuta antes que `Background`.
- `Near` cancela `Background` activa.
- `Interactive` cancela `Near` activa.
- `Background` espera mientras `nearQueue` tenga tareas.
- `cancelAllNear` cancela pendientes y activa.
