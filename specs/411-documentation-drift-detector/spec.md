# Spec 411 — B316 Documentation drift detector

## Estado

- done

## Relación backlog

- Backlog item: `B316 — Documentation drift detector`

## Objetivo

Detectar drift canónico entre backlog, done-log, specs, roadmap y current-focus con un check local reproducible que no dependa del runtime del producto.

## Resultado de cierre

- `tools/docs-drift-audit.cjs` publica `npm run test:docs:drift` y marca ítems `Done` todavía activos en backlog, duplicados canónicos en `docs/backlog.md`/`docs/done-log.md`, specs sin `spec.md`/`tasks.md` y desalineación entre `docs/current-focus.md` y `docs/roadmap.md`;
- `test/server/unit/docsDriftAudit.test.ts` congela el rail con un caso sintético de drift y exige que el repo actual pase limpio sin errores ni warnings;
- el cierre corrige drift documental real preexistente añadiendo `specs/377-catalog-driven-enum-consumers/tasks.md`, retirando `B329` del backlog activo y eliminando la entrada duplicada de `B361` en `docs/done-log.md`.

## Validación ejecutada

- `npm run test:unit -- --grep "unit/docsDriftAudit"`
- `npm run test:docs:drift`

## Nota de validación

- El audit se limita al drift canónico de backlog/done-log/current-focus/roadmap y a la documentación mínima `spec.md`/`tasks.md`; no intenta normalizar retrospectivamente toda la historia de `plan.md` ni ownership histórico de specs antiguas.

## Fuera de alcance del corte cerrado

- automatizar el movimiento backlog ↔ done-log o el lifecycle `Open/Partial/Done`, que queda para `B317`;
- convertir el audit documental en una feature runtime, API pública o comando de la extensión;
- reconstruir retrospectivamente `plan.md` en todas las specs históricas.