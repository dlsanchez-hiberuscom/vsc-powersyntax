# Plan — Spec 147 Formal Degraded Mode (B158)

## 1. Resumen tecnico

La implementacion debe apoyarse en workspace/readiness, projectStatus y las features interactivas principales del servidor, evitando crear una segunda fuente de estado paralela.

## 2. Estado actual

- readiness y projectStatus ya expresan parte del estado del motor.
- Las features todavia no consumen un contrato unificado de degradacion.

## 3. Diseno propuesto

- Definir una enumeracion formal de semantic availability levels.
- Mapear esos niveles desde la fuente unica de progreso y readiness.
- Crear helpers o gates sencillos para que las features consulten el nivel actual.
- Hacer que una primera tanda de features degrade o se bloquee con seguridad.

## 4. Impacto en rendimiento

- Positivo en coherencia y seguridad del producto.
- Coste bajo si el nivel se deriva de estado ya mantenido por el runtime.

## 5. Riesgos tecnicos

- Duplicar decisiones de disponibilidad en cada feature.
- Hacer un contrato demasiado abstracto para el estado real del motor.
- Confundir degradacion segura con silencios opacos para el usuario.

## 6. Estrategia de validacion

- Tests unitarios de mapping readiness → degraded mode.
- Tests de features en varios niveles.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/architecture.md si se formaliza el contrato como parte del serving seguro