# Plan - Spec 226 QueryContext primary reason code (B157)

## 1. Resumen tecnico

Propagar el `reasonCode` principal del query engine a `DocumentQueryContext` como surface de lectura rápida.

## 2. Estado actual

- `DocumentQueryContext` ya transporta `resolvedTargets` completos;
- el access pattern actual para el motivo principal es indirecto y repetitivo.

## 3. Diseno propuesto

- anadir `primaryResolutionReasonCode?: QueryReasonCode`;
- poblarla desde `resolvedTargets?.reasonCodes[0]`;
- validarla en la suite unitaria de `queryContext`.

## 4. Impacto en el runtime

- simplifica consumers de reason codes;
- evita acceso estructural repetitivo en capas superiores.

## 5. Riesgos tecnicos

- desalinear la surface si se recalcula localmente;
- olvidar degradar a `undefined` sin contexto.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/queryContext"`

## 7. Documentacion a actualizar

- `docs/done-log.md`