# Plan - Spec 246 Query trace phase summary (B157/B136)

## 1. Resumen tecnico

Agregar al snapshot una lista ordenada de fases únicas derivada de los `TraceStep.phase` ya disponibles.

## 2. Estado actual

- la fase ya existe por paso;
- falta un resumen agregado a nivel snapshot.

## 3. Diseno propuesto

- anadir `phases: string[]` a `TraceSnapshot`;
- derivarlo al cerrar la traza;
- validarlo con una traza que repita fases.

## 4. Impacto en el runtime

- mejora la inspección diagnóstica rápida;
- evita agregación repetitiva en consumidores.

## 5. Riesgos tecnicos

- perder el orden de primera aparición;
- volver a derivar desde `name` en lugar de `phase`.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/queryTrace"`

## 7. Documentacion a actualizar

- `docs/done-log.md`