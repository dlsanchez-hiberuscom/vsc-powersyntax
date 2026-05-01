# Plan - Spec 154 Bootstrap de storage persistente desde el cliente (B071)

## 1. Resumen tecnico

Propagar cacheStorageUri desde el cliente VS Code hasta la inicializacion del servidor para que el runtime pueda elegir una raiz estable de persistencia.

## 2. Estado actual

- El repositorio ya tenia la base inmediata sobre la que se apoya esta slice.
- Faltaba cerrar la parte especifica descrita por esta spec para convertirla en capacidad operativa real.

## 3. Diseno propuesto

- Implementar la capacidad principal de la slice con el menor acoplamiento posible.
- Reutilizar infraestructura ya existente en runtime, caches, knowledge o server segun corresponda.
- Mantener la validacion en el slice mas cercano al comportamiento afectado.

## 4. Impacto en rendimiento

- Debe ser neutro o positivo para la ruta interactiva o de persistencia afectada.
- Si existe coste extra, debe quedar acotado y justificado por una mejora clara de reuse, observabilidad o seguridad.

## 5. Riesgos tecnicos

- Mezclar demasiado wiring con logica de dominio.
- Dejar comportamiento parcialmente implementado sin validacion ejecutable.
- Desalinear codigo y documentos canonicamente vigentes.

## 6. Estrategia de validacion

- npm run compile
- npm run test:unit
- npm test

## 7. Documentacion a actualizar

- docs/architecture.md, docs/current-focus.md, docs/done-log.md
