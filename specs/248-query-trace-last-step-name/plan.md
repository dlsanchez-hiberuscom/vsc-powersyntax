# Plan - Spec 248 Query trace last step name (B157/B136)

## 1. Resumen tecnico

Añadir al snapshot un resumen del nombre del último paso emitido durante la captura.

## 2. Estado actual

- el snapshot ya conserva `steps` y varios resúmenes;
- falta un acceso directo al último evento observado.

## 3. Diseno propuesto

- anadir `lastStepName?: string` a `TraceSnapshot`;
- poblarla desde el último elemento de `active.steps` al cerrar la traza;
- validarla en la suite unitaria de `queryTrace`.

## 4. Impacto en el runtime

- mejora la inspección rápida del estado final de la traza;
- evita cálculos repetitivos en consumidores.

## 5. Riesgos tecnicos

- derivar mal el valor cuando no existan pasos;
- romper la consistencia entre resumen y array real.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/queryTrace"`

## 7. Documentacion a actualizar

- `docs/done-log.md`