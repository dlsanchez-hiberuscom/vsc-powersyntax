# Tasks - Spec 200 SignatureHelp masked text snapshot consumer (B151A)

## 1. Preparacion

- [x] T1. Localizar la dependencia directa de `signatureHelp` sobre `DocumentAnalysis`.
- [x] T2. Confirmar la validacion estrecha de la feature.

## 2. Implementacion

- [x] T3. Consumir `snapshot.maskedText.lines` en la extraccion del contexto.
- [x] T4. Consumir `snapshot.maskedText.masks` para ignorar strings y comentarios.
- [x] T5. Mantener intacta la resolucion posterior y ajustar la suite unitaria.

## 3. Validacion

- [x] T6. Ejecutar la validacion estrecha del slice.
- [x] T7. Ejecutar `compile` y la suite unitaria del repositorio.

## 4. Cierre

- [x] T8. Actualizar `done-log` y revisar backlog/foco/roadmap cuando aplique.
- [x] T9. Dejar la slice trazada como reduccion cerrada de `B151A`.