# Plan - Spec 231 Query trace action field (B157/B136)

## 1. Resumen tecnico

Enriquecer la traza con una `action` derivada del sufijo del nombre compuesto cuando este siga el patrón `fase:accion`.

## 2. Estado actual

- la traza ya conserva `phase` y `name`;
- falta una lectura directa de la acción específica del paso.

## 3. Diseno propuesto

- anadir `action?: string` a `TraceStep`;
- derivarla en `recordTraceStep()`;
- validarla con nombres con y sin sufijo compuesto.

## 4. Impacto en el runtime

- facilita agregaciones e inspección de acciones sin parseo externo;
- mantiene compatibilidad con pasos existentes.

## 5. Riesgos tecnicos

- asumir un patrón más rígido del que hoy garantiza el runtime;
- duplicar parseo fuera de `queryTrace` en lugar de centralizarlo.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/queryTrace"`

## 7. Documentacion a actualizar

- `docs/done-log.md`