# Spec 031 — Symbol dedup robusto (B101)

## 1. Motivación

Hoy `Entity` se identifica por `id` (nombre normalizado). Cuando dos
clases distintas declaran el mismo método con misma firma, las features
pueden mezclarlos. Necesitamos una clave **compuesta** estable.

## 2. Alcance

- `src/server/knowledge/symbolKey.ts`:
  - `buildSymbolKey(e: Entity): string` que combina:
    - `kind`,
    - `containerName` (lowercase) o `''`,
    - `name` (lowercase),
    - `parameterCount ?? -1`.
  - `dedupeBySymbolKey(items: Entity[]): Entity[]` — preserva orden y elige el primer match por clave.

## 3. Criterios de aceptación

1. Dos `of_setdata` en distintos containers → claves distintas.
2. Dos definiciones idénticas en mismo container → una sola tras `dedupe`.
3. Tests cubren ambos.

## 4. Documentación

`docs/architecture.md`, `docs/backlog.md` (B101).
