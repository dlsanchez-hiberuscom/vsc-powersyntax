# Spec 061 — Completion scoring sanity

## Motivación
Smoke test que verifica que `sortByScore` ordena candidatos cercanos
al cursor por encima de candidatos distantes.

## Alcance
- `test/server/unit/completionScoringSanity.test.ts`:
  - Construye candidatos sintéticos y verifica orden.

## Criterios
1. Variable local del propio scope queda antes que símbolo global.
