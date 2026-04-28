# [002] Tasks — Consolidación del runtime y observabilidad base

## 1. Objetivo

Trocear la consolidación del runtime en tareas pequeñas, ordenadas por dependencia y revisables.

---

## 2. Tasks

### Instrumentación y métricas (B003 + B007)

- [x] **T1.** Crear `src/server/runtime/timing.ts` con utilidades `measureMs`, `measureMsAsync`, `formatTiming` y `FirstInvocationTracker`.
- [x] **T2.** Añadir timestamps de activación en `src/client/extension.ts` (inicio activate, pre-start, post-start) y registrar en output channel.
- [x] **T3.** Añadir timestamps en `src/server/server.ts` (onInitialize, onInitialized, primer handler de cada tipo).
- [x] **T4.** Instrumentar handlers de Document Symbols, Hover y publishDiagnostics con `measureMs`.

### Scheduler y priorización (B004 + B005)

- [x] **T5.** Crear `src/server/runtime/cancellation.ts` con `CancellationToken`, `CancellationSource` y `CancellationToken_None`.
- [x] **T6.** Crear `src/server/runtime/scheduler.ts` con scheduler mínimo de dos prioridades (Interactive/Background).
- [x] **T7.** Integrar el debounce de diagnósticos existente como primera tarea schedulable.
- [x] **T8.** Rastrear documento activo en el servidor y marcar peticiones del archivo activo como Interactive.

### Ciclo de vida del servidor (B008)

- [x] **T9.** Añadir comando `vscPowerSyntax.restartServer` en el cliente y registrar en `package.json`.
- [x] **T10.** Envolver handlers del servidor en try/catch para errores no fatales.
- [x] **T11.** Verificar que un restart del servidor limpia correctamente caché y timers.

### Tests y validación (B003 + B010)

- [x] **T12.** Crear unit tests para `timing.ts`.
- [x] **T13.** Crear unit tests para `cancellation.ts`.
- [x] **T14.** Crear unit tests para `scheduler.ts` (priorización, cancelación).
- [x] **T15.** Crear al menos un smoke test que verifique activación de la extensión.
- [x] **T16.** Crear al menos un performance test que mida Document Symbols sobre fixture.
- [x] **T17.** Documentar la primera medición real de baseline en un archivo de resultados.

### Documentación (B009)

- [x] **T18.** Actualizar `docs/current-focus.md` con el progreso de esta spec.
- [x] **T19.** Actualizar `docs/backlog.md` marcando el estado de B003–B008.
- [x] **T20.** Verificar alineación de toda la documentación canónica afectada.

---

## 3. Orden recomendado

```text
Bloque 1 — Infraestructura runtime: ✅ COMPLETADO
  T1 → T5 → T6

Bloque 2 — Instrumentación: ✅ COMPLETADO
  T2, T3, T4

Bloque 3 — Integración: ✅ COMPLETADO
  T7, T8

Bloque 4 — Ciclo de vida: ✅ COMPLETADO
  T9, T10, T11

Bloque 5 — Tests: ✅ COMPLETADO
  T12, T13, T14, T15, T16, T17

Bloque 6 — Documentación: PENDIENTE
  T18, T19, T20
```

---

## 4. Notas de implementación

### Archivos creados

- `src/server/runtime/timing.ts` — utilidades `measureMs`, `measureMsAsync`, `formatTiming`, `FirstInvocationTracker`
- `src/server/runtime/cancellation.ts` — `CancellationToken`, `CancellationSource`, `CancellationToken_None`, `createCancellationSource`
- `src/server/runtime/scheduler.ts` — `TaskScheduler` con `Interactive`/`Background` priorities, cancelación cooperativa
- `tsconfig.json` — raíz con project references (necesario para `tsc -b`)

### Archivos modificados

- `src/client/extension.ts` — timestamps de activación + comando restart
- `src/server/server.ts` — instrumentación + try/catch + scheduler + FirstInvocationTracker
- `package.json` — comando `vscPowerSyntax.restartServer`

### Estado de compilación

✅ `npm run compile` pasa sin errores.

---

## 5. Definición de Done del slice

Este slice estará terminado cuando:

- existen utilidades de timing y cancellation en `src/server/runtime/`,
- el scheduler prioriza peticiones Interactive sobre Background,
- el output channel muestra tiempos de activación,
- los handlers registran tiempos de ejecución,
- el comando de restart funciona,
- existen tests para timing, cancellation y scheduler,
- existe al menos un performance test verificando presupuestos,
- la primera medición de baseline está documentada,
- y la documentación canónica refleja el estado real.
