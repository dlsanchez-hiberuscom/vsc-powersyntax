# Plan - Spec 239 Feature confidence thresholds (B157/B158)

## 1. Resumen tecnico

Centralizar en `featureReadiness` un mapa de confidence mínima por feature y exponerlo mediante un getter puro.

## 2. Estado actual

- existe el comparador de confidence;
- falta una política explícita de thresholds por feature.

## 3. Diseno propuesto

- anadir un mapa `feature -> confidence requerida`;
- exportar `getRequiredResolutionConfidence(feature)`;
- validarlo con asserts por feature.

## 4. Impacto en el runtime

- prepara la activación posterior de gates por confidence;
- evita thresholds dispersos por handlers.

## 5. Riesgos tecnicos

- fijar thresholds inconsistentes con el comportamiento esperado de cada feature;
- activar decisiones automáticas antes de validar la política.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/featureReadiness"`

## 7. Documentacion a actualizar

- `docs/done-log.md`