# Plan - Spec 243 Feature confidence gating (B157/B158)

## 1. Resumen tecnico

Activar dentro de `decideFeatureReadiness()` la comprobación de confidence insuficiente cuando el caller aporta `actualResolutionConfidence`.

## 2. Estado actual

- el contexto y la decisión ya transportan la confidence real;
- falta usarla para ajustar la acción final.

## 3. Diseno propuesto

- aplicar el gating solo tras superar el readiness semántico base;
- reutilizar `isResolutionConfidenceSufficient()` y `fallbackAction`;
- validarlo con casos de block y allow.

## 4. Impacto en el runtime

- deja lista la decisión para integraciones posteriores en handlers;
- mantiene una única policy de fallback por feature.

## 5. Riesgos tecnicos

- mezclar mal las prioridades entre readiness, latencia y confidence;
- introducir regressions en features con threshold bajo.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/featureReadiness"`

## 7. Documentacion a actualizar

- `docs/done-log.md`