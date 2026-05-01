# Plan - Spec 240 Feature confidence sufficiency helper (B157/B158)

## 1. Resumen tecnico

Componer los helpers de orden y threshold para exponer una comprobación booleana de suficiencia de confidence por feature.

## 2. Estado actual

- ya existen comparador y getter de threshold;
- falta una función booleana de consumo directo.

## 3. Diseno propuesto

- exportar `isResolutionConfidenceSufficient(feature, confidence)`;
- implementar la comprobación usando `compareResolutionConfidence()` y `getRequiredResolutionConfidence()`;
- validarla con combinaciones representativas.

## 4. Impacto en el runtime

- prepara la activación posterior de gates de forma declarativa;
- evita lógica booleana repetida en handlers.

## 5. Riesgos tecnicos

- duplicar la comparación en otros sitios;
- introducir una interpretación no inclusiva del threshold.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/featureReadiness"`

## 7. Documentacion a actualizar

- `docs/done-log.md`