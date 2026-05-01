# Plan - Spec 225 QueryContext confidence surface (B157)

## 1. Resumen tecnico

Propagar la confidence calculada por `semanticQueryService` a `DocumentQueryContext` como campo de conveniencia, sin recalcular nada.

## 2. Estado actual

- `DocumentQueryContext` ya guarda `resolvedTargets` completos;
- los consumers deben entrar manualmente a `resolvedTargets?.confidence`.

## 3. Diseno propuesto

- anadir `resolutionConfidence?: QueryResolutionConfidence` al contexto;
- poblarla desde `resolvedTargets?.confidence`;
- cubrirla con un test unitario nuevo de `queryContext`.

## 4. Impacto en el runtime

- simplifica el consumo inmediato de confidence;
- mantiene la fuente de verdad en el query engine.

## 5. Riesgos tecnicos

- introducir una segunda fuente de verdad si se recalcula localmente;
- olvidar degradar a `undefined` cuando no haya contexto.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/queryContext"`

## 7. Documentacion a actualizar

- `docs/done-log.md`