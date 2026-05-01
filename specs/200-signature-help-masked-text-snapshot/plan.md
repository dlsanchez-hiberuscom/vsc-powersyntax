# Plan - Spec 200 SignatureHelp masked text snapshot consumer (B151A)

## 1. Resumen tecnico

Mover `signatureHelp` para que extraiga el contexto de invocacion desde `snapshot.maskedText` en lugar de leer directamente `DocumentAnalysis`.

## 2. Estado actual

- `signatureHelp` seguia escaneando `lines`, `strippedLines` y `masks` desde `DocumentAnalysis`.
- El snapshot publicado ya contenia la vista textual enmascarada necesaria.

## 3. Diseno propuesto

- Usar `snapshot.maskedText.lines` en la busqueda hacia atras del `(` activo.
- Usar `snapshot.maskedText.masks` para ignorar strings y comentarios.
- Mantener intacta la resolucion posterior contra `SystemCatalog` y `KnowledgeBase`.

## 4. Impacto en el runtime

- Reduce otra frontera textual residual de `B151A`.
- Mantiene estable la resolucion semantica posterior.

## 5. Riesgos tecnicos

- Perder offsets o calculo correcto de `activeParameter`.
- Cambiar accidentalmente ranking o seleccion de firmas.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/signatureHelp"`
- `npm run compile`
- `npm run test:unit`

## 7. Documentacion a actualizar

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/roadmap.md`