# Plan - Spec 242 Feature decision actual confidence (B157/B158)

## 1. Resumen tecnico

Ampliar el contexto y la decisión de readiness para transportar la confidence real de resolución cuando el caller ya la conozca.

## 2. Estado actual

- la decisión ya expone el threshold requerido;
- falta la confidence real del contexto para comparaciones futuras.

## 3. Diseno propuesto

- anadir `resolutionConfidence?` al contexto;
- anadir `actualResolutionConfidence?` a la decisión;
- propagar el valor sin alterar aún la acción final.

## 4. Impacto en el runtime

- prepara decisions explicables basadas en confidence;
- mantiene el cálculo real fuera de `featureReadiness`.

## 5. Riesgos tecnicos

- recalcular confidence dentro del módulo en lugar de solo transportarla;
- olvidar propagarla en alguna rama de decisión.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/featureReadiness"`

## 7. Documentacion a actualizar

- `docs/done-log.md`