# Tasks - Spec 202 Diagnostics structure snapshot consumer (B151A)

## 1. Preparacion

- [x] T1. Localizar la ruta estructural de `diagnostics` que seguia usando `DocumentAnalysis`.
- [x] T2. Confirmar la validacion estrecha del modulo.

## 2. Implementacion

- [x] T3. Consumir `snapshot.maskedText.lines` en `validateStructure()`.
- [x] T4. Consumir `snapshot.containerModel.sections` para detectar secciones declarativas.
- [x] T5. Mantener las reglas estructurales y ajustar la suite unitaria.

## 3. Validacion

- [x] T6. Ejecutar la validacion estrecha del slice.
- [x] T7. Ejecutar `compile` y la suite unitaria del repositorio.

## 4. Cierre

- [x] T8. Actualizar `done-log` y revisar backlog/foco/roadmap cuando aplique.
- [x] T9. Dejar la slice trazada como reduccion cerrada de `B151A`.