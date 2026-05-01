# Plan - Spec 228 QueryContext target count (B157)

## 1. Resumen tecnico

Proyectar la cardinalidad de `targets` del query engine a `DocumentQueryContext` como surface escalar directa.

## 2. Estado actual

- el detalle completo ya incluye `targets`;
- falta una lectura rápida de su cardinalidad para consumers inmediatos.

## 3. Diseno propuesto

- anadir `resolutionTargetCount: number`;
- poblarla desde `resolvedTargets?.targets.length ?? 0`;
- validarla sobre caso simple, caso ambiguo y caso sin contexto.

## 4. Impacto en el runtime

- simplifica lógica consumidora que solo necesita cardinalidad;
- evita acceso repetitivo a la structure detallada.

## 5. Riesgos tecnicos

- introducir desalineación si el valor se recalcula de otro modo;
- no degradar a cero fuera de contexto.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/queryContext"`

## 7. Documentacion a actualizar

- `docs/done-log.md`