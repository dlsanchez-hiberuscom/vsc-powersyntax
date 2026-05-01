# Tasks - Spec 195 Diff-aware invalidation plan (B170/B153/B154)

## 1. Preparacion

- [x] T1. Localizar el punto exacto donde el runtime decide la invalidacion.
- [x] T2. Confirmar la hipotesis y la validacion estrecha del slice.

## 2. Implementacion

- [x] T3. Ajustar `diffSemanticSnapshots()` para ignorar cambios cosmeticos.
- [x] T4. Introducir helpers explicitos de invalidacion snapshot-aware.
- [x] T5. Consumir el plan diff-aware desde `server.ts`.
- [x] T6. Ajustar tests de `semanticDiff` y `semanticInvalidation`.

## 3. Validacion

- [x] T7. Ejecutar la validacion estrecha del slice.
- [x] T8. Ejecutar `compile` y la suite unitaria del repositorio.

## 4. Cierre

- [x] T9. Actualizar `done-log` y revisar backlog/foco/roadmap cuando aplique.
- [x] T10. Dejar `B170`, `B153` y `B154` trazados como cerrados.