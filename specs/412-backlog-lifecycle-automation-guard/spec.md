# Spec 412 — B317 Backlog lifecycle automation guard

## Estado

- done

## Relación backlog

- Backlog item: `B317 — Backlog lifecycle automation guard`

## Objetivo

Proteger transiciones `Open/Partial/Done` y el movimiento backlog ↔ done-log reutilizando el audit documental ya publicado, sin abrir un segundo checker ni rehacer la historia completa del repo.

## Resultado de cierre

- `tools/docs-drift-audit.cjs` endurece `npm run test:docs:drift` para rechazar estados `Done/Closed` todavía presentes en backlog y entradas canónicas modernas del done-log sin `**Validación registrada:**` o `**Documentación alineada:**`;
- `test/server/unit/docsLifecycleGuard.test.ts` congela el nuevo guard de lifecycle documental sobre un caso sintético mínimo;
- el cierre completa el formato canónico de las entradas `B358`, `B359`, `B360`, `B361`, `B362` y `B363` en `docs/done-log.md`, dejando el rail moderno de cierre limpio sobre el repo real.

## Validación ejecutada

- `npm run test:unit -- --grep "unit/docsLifecycleGuard"`
- `npm run test:docs:drift`

## Nota de validación

- El guard se apoya deliberadamente en el rail de `B316` y solo endurece el lifecycle canónico actual; no intenta reestructurar retrospectivamente entradas históricas previas al bloque moderno del done-log.

## Fuera de alcance del corte cerrado

- automatizar cambios de backlog o done-log fuera del audit local ya existente;
- convertir el guard documental en feature runtime, comando de extensión o API pública;
- reescribir retrospectivamente el histórico completo del done-log anterior al bloque moderno.