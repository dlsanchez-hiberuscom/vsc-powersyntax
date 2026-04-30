# Spec 014 — Scheduler de indexación multinivel (B121)

## 1. Motivación

`TaskScheduler` solo distingue dos niveles: `Interactive` y `Background`.
Mientras la indexación recorre el workspace en `Background`, las
dependencias inmediatas del archivo activo (ancestros, owners, tipos
referenciados) se procesan al mismo ritmo que el resto del workspace.
Esto retrasa hover/completion/definition incluso cuando el usuario está
trabajando sobre un punto concreto.

Hace falta un nivel intermedio (`Near`) que:

- se ejecute después de Interactive,
- siempre antes de Background,
- pueda ser preemptado por Interactive,
- pero nunca sea bloqueado/postergado por Background.

## 2. Alcance

- Añadir `TaskPriority.Near = 5` en `runtime/scheduler.ts`.
- Añadir cola dedicada `nearQueue` (FIFO).
- Añadir `enqueueNear(task)` y `cancelAllNear()`.
- Reglas de planificación:
  - `Interactive` cancela cualquier tarea `Near` o `Background` activa.
  - `Near` cancela cualquier `Background` activa, pero respeta
    `Interactive`.
  - `Background` solo se ejecuta cuando no hay `Interactive` ni `Near`
    pendientes ni activas.
- Tests unitarios sobre las nuevas reglas de prioridad.

### Fuera de alcance

- Reescribir el indexador para alimentar Near con dependencias
  reales (ancestros, owners) — eso lo trata B134A en la spec 016.
- Métricas de tiempo por nivel (P1).

## 3. Criterios de aceptación

1. `TaskPriority.Near` existe y `enqueueNear` funciona.
2. Una tarea `Near` cancela una `Background` activa.
3. Una tarea `Interactive` cancela `Near` activa y `Background` activa.
4. `Background` no se ejecuta si `nearQueue` no está vacía.
5. `cancelAllNear` cancela pendientes y activa.
6. Suite completa de tests pasa sin regresiones.

## 4. Documentación afectada

- `docs/architecture.md` (mención del nuevo nivel).
- `docs/current-focus.md` y `docs/backlog.md` (B121 cerrada).
- `docs/roadmap.md`.
