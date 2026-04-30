# Spec 035 — Completion scoring (B061)

## 1. Motivación

Un scoring estable de candidatos de completion priorizando locals,
miembros, distancia de herencia y owner context.

## 2. Alcance

- `src/server/features/completionScoring.ts`:
  - `scoreCandidate(candidate, ctx): number` — menor = mejor.
  - Factores:
    - Local en scope actual: 0.
    - Miembro del tipo actual: 1.
    - Heredado (distancia n): `2 + n`.
    - Global: 100.
    - Penalización por visibilidad incompatible (Infinity).
  - `sortByScore(candidates, ctx): Entity[]`.

## 3. Criterios de aceptación

1. Local gana a miembro a global.
2. Miembro propio gana a heredado.
3. Privado de otro owner descartado.
4. Tests cubren los tres.

## 4. Documentación

`docs/architecture.md`, `docs/backlog.md` (B061).
