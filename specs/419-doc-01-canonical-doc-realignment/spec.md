# Spec 419 — DOC-01 Canonical docs realignment

## Estado

- done

## Relación backlog

- Backlog item: `DOC-01 — Realineación canónica de backlog, foco y continuidad`

## Objetivo

Reanclar backlog, current-focus y roadmap a una misma cadena activa canónica usando los IDs pedidos por el usuario y manteniendo verde la auditoría documental.

## Alcance del corte

- ampliar el guard `docs-drift` para IDs canónicos no `B###`;
- reescribir backlog/current-focus/roadmap con la cadena activa explícita;
- evitar cierres falsos en done-log mientras el trabajo siga vivo.

## Validación mínima esperada

- `npx mocha --ui tdd out/test/server/unit/docsDriftAudit.test.js out/test/server/unit/docsLifecycleGuard.test.js`
- `npm run test:docs:drift`

## Fuera de alcance

- mover ítems a done-log sin evidencia;
- inventar trabajo fuera de la cadena activa.

## Cierre registrado

- `tools/docs-drift-audit.cjs` y sus tests aceptan ya IDs canónicos no `B###`, evitando que la cadena pedida por el usuario quede fuera del guard documental;
- `docs/backlog.md`, `docs/current-focus.md` y `docs/roadmap.md` quedaron reanclados a la misma continuidad viva y pueden promover el foco siguiente sin reintroducir deriva;
- la validación documental focal quedó verde con `findings: 0`, confirmando coherencia canónica antes de pasar el relevo a `DOC-02`.

## Validación ejecutada

- `npx mocha --ui tdd out/test/server/unit/docsDriftAudit.test.js out/test/server/unit/docsLifecycleGuard.test.js`
- `npm run test:docs:drift`
