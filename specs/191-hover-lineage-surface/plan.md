# Plan - Spec 191 Hover surface de lineage (B172)

## 1. Resumen tecnico

Usar un helper común de formateo de lineage y conectarlo en `hoverFormat.ts` y `hover.ts`.

## 2. Estado actual

- `Entity.lineage` ya existe.
- `winnerLineage` ya existe.
- el catálogo ya dispone de `systemProvenanceToLineage()`.
- hover todavía no muestra esa información.

## 3. Diseno propuesto

- Añadir un resumen compacto con origen, autoridad, fase, rol, herencia y confianza cuando existan.
- Reusar el mismo helper para usuario y sistema.

## 4. Validacion

- npm run test:unit -- --grep "lineage"
- npm run compile
- npm test