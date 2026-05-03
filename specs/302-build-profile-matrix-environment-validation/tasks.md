# Tasks - Spec 302 build profile matrix and environment validation (B257)

## 1. Preparación

- [x] T1. Confirmar con tests semilla que el builder prioriza el último profile y refleja tooling ausente.
- [x] T2. Identificar inventory completo + capability detection + build health como owning abstraction del slice.

## 2. Implementación

- [x] T3. Implementar `pbAutoBuildProfileMatrix` como builder read-only sobre inventory, tooling y health.
- [x] T4. Exponer la surface por API pública v2.9.0, tool bridge y comando Markdown.
- [x] T5. Añadir acceso visible desde el status report sin abrir otro rail de ejecución.
- [x] T6. Alinear la documentación viva y mover el foco canónico del repo.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar la validación focal de unit sobre feature y contrato público.
- [x] T9. Ejecutar la smoke de activación de la extensión.

## 4. Cierre

- [x] T10. Mover `B257` a `docs/done-log.md`, sacar el ítem del backlog activo y dejar `B258` como siguiente foco natural.