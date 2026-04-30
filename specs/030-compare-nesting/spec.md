# Spec 030 — Compare by nesting (B099)

## 1. Motivación

Cuando varias entidades cubren la misma posición (p.ej. tipo padre y
función dentro), queremos seleccionar la **más anidada**. Helper
reutilizable para hover, definition y futuro `findInnermost*`.

## 2. Alcance

- `src/server/parsing/nesting.ts`:
  - `compareByNesting(a, b)` — compara dos rangos por anidamiento
    (gana el de menor área que contiene la posición).
  - `pickInnermost(items, position)` — elige el ítem cuyo rango es más
    anidado y contiene la posición.
- `Range = { startLine, endLine }`.

## 3. Criterios de aceptación

1. `pickInnermost` con padre 0–10 e hijo 3–5 en pos 4 → devuelve el hijo.
2. Si la posición no está en ningún rango → null.
3. Tests cubren ambos escenarios.

## 4. Documentación

`docs/architecture.md`, `docs/backlog.md` (B099).
