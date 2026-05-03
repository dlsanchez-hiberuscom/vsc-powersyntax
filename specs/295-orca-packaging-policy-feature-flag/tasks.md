# Tasks - Spec 295 ORCA packaging policy behind feature flag (B195)

## 1. Preparación

- [x] T1. Confirmar que no existe ya un rail parcial de packaging ORCA ni un feature flag previo en la superficie actual.
- [x] T2. Identificar la abstraction dueña para fijar la policy (`ApiOrcaCapabilitySnapshot`).

## 2. Implementación

- [x] T3. Publicar `packagingPolicy` en la capability ORCA.
- [x] T4. Proyectar la policy en status/stats/dashboard sin abrir comandos nuevos.
- [x] T5. Alinear la documentación viva y el foco canónico del repo.

## 3. Validación

- [x] T6. Ejecutar `npm run build:test`.
- [x] T7. Ejecutar unit focal sobre ORCA/status/dashboard.
- [x] T8. Ejecutar smoke `ORCA legacy`.

## 4. Cierre

- [x] T9. Mover `B195` a `docs/done-log.md` y dejar `B251` como foco siguiente.
