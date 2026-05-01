# Plan - Spec 230 Query trace phase field (B157/B136)

## 1. Resumen tecnico

Enriquecer la traza con una `phase` derivada del nombre del paso cuando este siga el patrón `fase:detalle`.

## 2. Estado actual

- la traza ya conserva orden, detalle y timestamp;
- falta una lectura agregable de la fase principal de cada paso.

## 3. Diseno propuesto

- anadir `phase?: string` a `TraceStep`;
- derivarla en `recordTraceStep()`;
- validarla con nombres con y sin prefijo.

## 4. Impacto en el runtime

- mejora inspección ligera y agrupación futura de pasos;
- mantiene la compatibilidad con nombres existentes.

## 5. Riesgos tecnicos

- derivar una fase no deseada en nombres que no usen el patrón canónico;
- introducir acoplamiento prematuro a una taxonomía rígida.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/queryTrace"`

## 7. Documentacion a actualizar

- `docs/done-log.md`