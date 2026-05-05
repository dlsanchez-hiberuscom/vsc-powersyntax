# Spec 424 — GOV-01 Priority chain and readiness gate

## Estado

- done

## Relación backlog

- Backlog item: `GOV-01 — Gate de prioridad y readiness antes de abrir nuevo código`

## Objetivo

Mantener explícita la regla de promoción canónica tras cerrar la cadena `VSIX-01 → DOC-01 → DOC-02 → BL-01 → BL-02 → BL-03 → BL-08` y la secuencia posterior `SYM-01 → LOC-01 → CAT-01 → GOV-01`, evitando que el repositorio abra trabajo fuera de ella sin actualización canónica.

## Resultado esperado

- cadena priorizada visible en backlog/current-focus/roadmap;
- regla de promoción explícita;
- gate de continuidad antes de abrir código nuevo.

## Validación mínima esperada

- `npm run test:docs:drift`

## Fuera de alcance

- reemplazar la cadena por prioridades implícitas;
- abrir implementación fuera del orden canónico sin pasar por docs/specs.

## Cierre registrado

- la cadena inmediata `VSIX-01 → AUDIT-VSIX → DOC-01 → DOC-02 → AUDIT-DOC` y el bloque derivado `BL-01 → BL-02 → BL-03 → BL-08` ya quedaron cerrados con evidencia real y fuera del backlog activo;
- la secuencia posterior `SYM-01 → LOC-01 → CAT-01 → GOV-01` quedó absorbida con specs, done-log y `docs-drift` en verde, sin colisión entre IDs heredados `BL-*` y planes `SYM/LOC/CAT/GOV`;
- la regla de promoción queda fijada: no abrir código nuevo fuera de backlog/roadmap/current-focus/specs, y el siguiente frente canónico pasa a ser `BL-04 → BL-05 → BL-06 → BL-07`.

## Validación ejecutada

- `npm run test:docs:drift`
