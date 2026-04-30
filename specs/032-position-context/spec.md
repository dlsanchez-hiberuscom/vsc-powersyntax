# Spec 032 — Contexto posicional reutilizable (B054)

## 1. Motivación

Hover, completion, diagnostics y references hoy recalculan ad hoc el
scope/tipo en el cursor. Centralizar `findInnermostCallableAtPosition` y
`findInnermostTypeAtPosition` ahorra duplicación.

## 2. Alcance

- `src/server/knowledge/positionContext.ts`:
  - `findInnermostCallableAtPosition(scopes, line)` → `Scope | null`.
  - `findInnermostTypeAtPosition(facts, line)` → `Entity | null` (tipo cuyo rango contiene la línea — usa `containerName` y heurística por proximidad si no hay rango explícito).
  - `getPositionContext(scopes, facts, line): PositionContext` agrupa ambos.
- Reutiliza `pickInnermost` de spec 030.

## 3. Criterios de aceptación

1. Función anidada bajo un tipo → callable correcto.
2. Línea fuera de cualquier callable → `currentCallable: null`.
3. Tipo principal devuelto cuando línea cae en su rango.
4. Tests cubren los tres.

## 4. Documentación

`docs/architecture.md`, `docs/backlog.md` (B054).
