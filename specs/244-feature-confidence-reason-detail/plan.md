# Plan - Spec 244 Feature confidence reason detail (B157/B158)

## 1. Resumen tecnico

Refinar el mensaje de la decisión cuando la confidence es insuficiente para que incluya el valor actual y el threshold exigido.

## 2. Estado actual

- el gating por confidence ya funciona;
- el mensaje asociado todavía no explica el desajuste concreto.

## 3. Diseno propuesto

- reutilizar `actualResolutionConfidence` y `requiredResolutionConfidence`;
- componer un mensaje más específico en la rama de insufficiency;
- validarlo con un assert explícito.

## 4. Impacto en el runtime

- mejora la observabilidad de la decisión;
- no altera la acción final.

## 5. Riesgos tecnicos

- introducir inconsistencias entre mensaje y decisión;
- tocar ramas que no corresponden a insufficiency.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/featureReadiness"`

## 7. Documentacion a actualizar

- `docs/done-log.md`