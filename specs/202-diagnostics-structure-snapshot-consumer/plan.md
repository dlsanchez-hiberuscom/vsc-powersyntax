# Plan - Spec 202 Diagnostics structure snapshot consumer (B151A)

## 1. Resumen tecnico

Hacer snapshot-first la validacion estructural de diagnosticos para que `validateStructure()` trabaje sobre el texto enmascarado y las secciones publicadas por el snapshot.

## 2. Estado actual

- La ruta estructural de diagnosticos seguia leyendo `lines` y `sections` desde `DocumentAnalysis`.
- El snapshot canonico ya publicaba esa informacion en `maskedText` y `containerModel.sections`.

## 3. Diseno propuesto

- Usar `snapshot.maskedText.lines` en `validateStructure()`.
- Usar `snapshot.containerModel.sections` para detectar secciones declarativas.
- Mantener intactas las reglas estructurales existentes.

## 4. Impacto en el runtime

- Reduce otra slice de `B151A` dentro de `diagnostics`.
- Mantiene la validacion estructural sobre el contrato ya publicado.

## 5. Riesgos tecnicos

- Romper offsets o longitud de linea en la validacion estructural.
- Cambiar reglas existentes al mover solo la fuente de datos.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/diagnostics"`
- `npm run compile`
- `npm run test:unit`

## 7. Documentacion a actualizar

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/roadmap.md`