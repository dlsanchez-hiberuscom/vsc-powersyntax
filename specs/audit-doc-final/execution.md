# AUDIT-DOC-FINAL — Execution Checklist

## Objetivo

Ejecutar la auditoría documental final tras integrar los documentos propietarios.

## Checklist

- [ ] Validar `docs/README.md`.
- [ ] Validar `AGENTS.md`.
- [ ] Validar `docs/ai/*`.
- [ ] Validar `docs/catalog/*`.
- [ ] Validar `docs/build/*`.
- [ ] Validar `docs/core/*`.
- [ ] Validar `docs/datawindow/*`.
- [ ] Validar `docs/sql/*`.
- [ ] Validar `docs/runtime/*`.
- [ ] Validar `docs/release/*`.
- [ ] Confirmar que `backlog.md` no contiene histórico cerrado.
- [ ] Confirmar que `done-log.md` no contiene trabajo pendiente.
- [ ] Confirmar que `current-focus.md` no está vacío si hay backlog activo.
- [ ] Ejecutar `npm run test:docs:drift`.
- [ ] Actualizar done-log solo si la auditoría queda cerrada con evidencia.
