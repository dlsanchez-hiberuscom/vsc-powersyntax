# Spec 044 — Workspace readiness states (B128)

## Motivación
Estados explícitos del workspace para coordinar features y UI:
`idle | discovering | indexing | ready | error`. Permite respuestas
parciales con etiqueta de readiness.

## Alcance
- `src/server/workspace/readiness.ts`:
  - `ReadinessState` union.
  - `createReadinessTracker()` con `getState`, `transition`, `onChange`.
- Tests.

## Criterios
1. Transiciones legales (`idle → discovering → indexing → ready`).
2. Listeners reciben el cambio.
3. Bloquea transición a estado igual.
