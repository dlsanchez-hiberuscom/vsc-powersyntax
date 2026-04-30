# Spec 041 — SQL embebido (B090)

## 1. Motivación

Detectar regiones SQL embebido (`SELECT/UPDATE/INSERT/DELETE` que
terminan con `;`) para excluirlas del análisis PowerScript y permitir
features futuros (highlight/tooltip).

## 2. Alcance

- `src/server/parsing/sqlRegions.ts` con `findSqlRegions(content)`:
  - Devuelve `Range`s `{startLine, endLine}`.
  - Reconoce líneas iniciales con palabra clave SQL y termina al hallar `;`.
- Tests.

## 3. Criterios de aceptación

1. SELECT ... ; multi-línea detectado.
2. UPDATE/INSERT/DELETE detectados.
3. Línea sin SQL no genera región.

## 4. Documentación

`docs/architecture.md`, `docs/backlog.md` (B090).
