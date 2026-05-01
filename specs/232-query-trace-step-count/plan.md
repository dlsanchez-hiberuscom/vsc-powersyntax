# Plan - Spec 232 Query trace step count (B157/B136)

## 1. Resumen tecnico

Enriquecer `TraceSnapshot` con un contador de pasos para inspección ligera de la última traza capturada.

## 2. Estado actual

- el snapshot conserva `label` y `steps`;
- falta un resumen directo del volumen de pasos.

## 3. Diseno propuesto

- anadir `stepCount: number` a `TraceSnapshot`;
- asignarlo desde `steps.length` al cerrar la traza;
- validarlo en la suite unitaria de `queryTrace`.

## 4. Impacto en el runtime

- mejora inspección y diagnóstico rápido;
- evita cálculo repetitivo de cardinalidad en consumidores.

## 5. Riesgos tecnicos

- desalinear el resumen respecto al array real si se mantiene por separado;
- devolver snapshots incoherentes en `getLastTrace()`.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/queryTrace"`

## 7. Documentacion a actualizar

- `docs/done-log.md`