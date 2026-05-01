# Plan - Spec 247 Query trace action summary (B157/B136)

## 1. Resumen tecnico

Agregar al snapshot una lista ordenada de acciones únicas derivada de los `TraceStep.action` ya disponibles.

## 2. Estado actual

- la acción ya existe por paso;
- falta un resumen agregado a nivel snapshot.

## 3. Diseno propuesto

- anadir `actions: string[]` a `TraceSnapshot`;
- derivarlo al cerrar la traza;
- validarlo con una traza que repita acciones.

## 4. Impacto en el runtime

- mejora la inspección diagnóstica rápida;
- evita agregación repetitiva en consumidores.

## 5. Riesgos tecnicos

- perder el orden de primera aparición;
- volver a derivar desde `name` en lugar de `action`.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/queryTrace"`

## 7. Documentacion a actualizar

- `docs/done-log.md`