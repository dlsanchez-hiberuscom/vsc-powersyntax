# Spec 038 — Eventos ON object.event (B104)

## 1. Motivación

Reconocer bloques `on <object>.<event>` para asociar el evento al
objeto contenedor en hover/symbols.

## 2. Alcance

- `src/server/parsing/onEventParser.ts`:
  - `parseOnEvents(content): OnEvent[]` con `{owner, event, line}`.
  - Regex: `/^\s*on\s+([\w$#%-]+)\.([\w$#%-]+)\b/i`.
- Tests.

## 3. Criterios de aceptación

1. Detecta `on w_main.create`.
2. Devuelve owner y event correctos.
3. Ignora línea en comentario.

## 4. Documentación

`docs/architecture.md`, `docs/backlog.md` (B104).
