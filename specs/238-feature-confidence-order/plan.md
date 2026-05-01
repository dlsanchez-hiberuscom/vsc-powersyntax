# Plan - Spec 238 Feature confidence order helper (B157/B158)

## 1. Resumen tecnico

Anadir a `featureReadiness` un comparador pequeño que permita ordenar la confidence de resolución en sentido ascendente.

## 2. Estado actual

- existe `QueryResolutionConfidence`;
- falta un helper compartido para compararla en la capa de gating.

## 3. Diseno propuesto

- anadir un mapa de orden `low/medium/high`;
- exportar `compareResolutionConfidence(left, right)`;
- validarlo con casos representativos.

## 4. Impacto en el runtime

- prepara la base para thresholds por feature;
- evita duplicación de comparadores.

## 5. Riesgos tecnicos

- dispersar el orden en varios módulos;
- introducir helpers que luego no se reutilicen.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/featureReadiness"`

## 7. Documentacion a actualizar

- `docs/done-log.md`