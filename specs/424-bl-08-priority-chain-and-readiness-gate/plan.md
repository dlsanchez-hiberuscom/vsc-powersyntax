# Plan — Spec 424 / GOV-01

- Gap consolidado: la cadena priorizada y su regla de promoción ya quedaron materializadas, pero faltaba cerrarlas explícitamente una vez absorbidas la cadena inmediata, el bloque derivado y la planificación posterior.
- Resultado del gate: backlog/current-focus/roadmap pasan a usar `BL-04 → BL-05 → BL-06 → BL-07` como continuidad única tras completar `GOV-01`.
- Regla explícita: no abrir código nuevo ni nuevos focos fuera de backlog/roadmap/current-focus/specs, y no mover ítems a done sin validación ejecutada y `done-log`.
- Validación focal: `npm run test:docs:drift`
