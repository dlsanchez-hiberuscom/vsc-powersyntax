# Plan — Spec 146 Indexer Progress and Readiness (B134)

## 1. Resumen tecnico

La implementacion debe apoyarse en src/server/workspace/readiness.ts, projectStatus, workspaceIndexer y la futura superficie de estado del indexador para consolidar una fuente unica.

## 2. Estado actual

- readiness.ts ya expresa transiciones basicas.
- projectStatus ya expone parte del estado del workspace.
- Aun no hay un modelo unificado de progreso e indexer readiness.

## 3. Diseno propuesto

- Definir un contrato que separe progreso operativo de readiness semantica.
- Alimentar ese contrato desde discovery, indexador, contexto activo y estado de proyecto.
- Publicar active context ready, project ready y workspace ready sobre la misma fuente.
- Hacer que modo degradado y status consuman este modelo.

## 4. Impacto en rendimiento

- Positivo en observabilidad y decisiones de serving.
- Debe apoyarse en contadores y transiciones ya disponibles para evitar coste extra relevante.

## 5. Riesgos tecnicos

- Duplicar progreso entre varias fuentes.
- No distinguir bien ready semantico de completado operativo.
- Hacer un modelo demasiado rigido para fases futuras.

## 6. Estrategia de validacion

- Tests de transiciones de readiness y progreso.
- Integracion con projectStatus o salida equivalente.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/roadmap.md si se precisa mejor el criterio de salida de Fase A