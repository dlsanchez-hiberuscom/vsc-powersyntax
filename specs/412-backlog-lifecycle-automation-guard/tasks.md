# Tasks — Spec 412

## Estado

- done

## Tasks

- [x] Reutilizar el rail `npm run test:docs:drift` para endurecer transiciones `Done/Closed` en backlog y done-log.
- [x] Añadir un test unitario sintético que congele el guard de lifecycle documental.
- [x] Reparar las entradas canónicas modernas del done-log que no cumplían el nuevo contrato de validación/documentación.
- [x] Alinear `docs/spec-driven-development.md`, `docs/testing.md` y los artefactos canónicos de backlog/foco/done-log con el cierre del slice.

## Riesgos residuales registrados

- El guard sigue siendo local/offline; no automatiza escrituras ni mueve ítems entre backlog y done-log por sí mismo.
- El historial previo al bloque moderno del done-log queda fuera de alcance; B317 sólo endurece el lifecycle canónico actual sobre el rail heredado de `B316`.