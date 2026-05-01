# Plan - Spec 233 Query trace timing summary (B157/B136)

## 1. Resumen tecnico

Capturar timestamps de inicio y cierre en `withTrace()` y derivar una duración sencilla en milisegundos para el snapshot final.

## 2. Estado actual

- `queryTrace` ya conserva nombre, detalle, orden y conteo;
- falta un resumen temporal para diagnosticar coste de captura.

## 3. Diseno propuesto

- anadir `startedAt`, `endedAt` y `durationMs` a `TraceSnapshot`;
- capturar inicio en la activación de la traza y cierre al terminar;
- validarlo en la suite unitaria de `queryTrace`.

## 4. Impacto en el runtime

- mejora inspección diagnóstica ligera;
- no cambia el contrato de emisión de pasos.

## 5. Riesgos tecnicos

- incoherencia temporal si el cálculo se reparte fuera de `withTrace()`;
- sobreinstrumentación innecesaria del hot path.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/queryTrace"`

## 7. Documentacion a actualizar

- `docs/done-log.md`