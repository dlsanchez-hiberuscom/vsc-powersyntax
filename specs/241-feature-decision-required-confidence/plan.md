# Plan - Spec 241 Feature decision required confidence (B157/B158)

## 1. Resumen tecnico

Enriquecer la decisión de readiness con el threshold mínimo de confidence correspondiente al feature.

## 2. Estado actual

- el threshold existe como getter independiente;
- la decisión aún no lo expone de forma autocontenida.

## 3. Diseno propuesto

- anadir `requiredResolutionConfidence` al contrato de decisión;
- poblarlo desde `getRequiredResolutionConfidence(feature)`;
- validarlo en la suite unitaria de `featureReadiness`.

## 4. Impacto en el runtime

- mejora trazabilidad de la policy;
- prepara decisions más ricas sin tocar aún la acción final.

## 5. Riesgos tecnicos

- olvidar poblar el campo en alguna rama de decisión;
- romper la autoconsistencia del contrato.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/featureReadiness"`

## 7. Documentacion a actualizar

- `docs/done-log.md`