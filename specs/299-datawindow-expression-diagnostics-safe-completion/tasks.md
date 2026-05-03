# Tasks - Spec 299 datawindow expression diagnostics safe completion (B254)

## 1. Preparación

- [x] T1. Confirmar que `completion` aborta en strings antes de reutilizar el backbone DataWindow ya existente.
- [x] T2. Identificar `dataWindowPropertyPaths` como owning abstraction del slice.

## 2. Implementación

- [x] T3. Implementar completion segura para property paths DataWindow reconocibles.
- [x] T4. Implementar diagnostics conservadores para rutas DataWindow completas no resolubles.
- [x] T5. Fijar el contrato en unit/golden y estabilizar suites vecinas con URIs repetidas.
- [x] T6. Alinear la documentación viva y mover el foco canónico del repo.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar la validación focal de completion/diagnostics/golden DataWindow.
- [x] T9. Ejecutar el barrido estrecho de surfaces DataWindow vecinas.

## 4. Cierre

- [x] T10. Mover `B254` a `docs/done-log.md` y dejar `B255` como foco siguiente.