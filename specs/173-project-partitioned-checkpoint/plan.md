# Plan - Spec 173 Checkpoint persistente particionado por proyecto (B071A)

## 1. Resumen tecnico

Extender cacheStore para aceptar UnifiedProjectModel, dividir checkpoints por proyecto y recomponer el restore agregado manteniendo una particion de workspace para huérfanos.

## 2. Estado actual

- cacheStore ya conoce workspaceKey, checkpoint, journal y restore seguro.
- El runtime ya construye UnifiedProjectModel antes de abrir el cache store.
- Falta usar ese modelo para materializar persistencia mas fina.

## 3. Diseno propuesto

- Añadir soporte opcional de modelo de proyectos al cache store.
- Introducir un manifest ligero de particiones por proyecto.
- Persistir checkpoint de workspace para huérfanos y checkpoints por proyecto para el resto.
- Restaurar agregando las particiones compatibles sin reabrir serving ni journal.

## 4. Impacto en rendimiento

- Debe reducir recomputacion al preparar reuse mas localizado por proyecto.
- El coste extra de I/O debe quedar acotado al momento de persistencia o restore.

## 5. Riesgos tecnicos

- Desalinear particiones si cambia la topologia de proyectos.
- Acoplar demasiado cacheStore con detalles del runtime.
- Romper compatibilidad del estado persistido existente.

## 6. Estrategia de validacion

- npm run test:unit -- cacheStore
- npm run compile
- npm run test:unit

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md
- docs/roadmap.md