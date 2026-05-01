# Plan — Spec 145 Indexer State Surface (B126)

## 1. Resumen tecnico

La implementacion debe apoyarse en workspaceIndexer, scheduler y las superficies ya expuestas por server.ts y features/projectStatus.ts para consolidar un estado operativo unico.

## 2. Estado actual

- server.ts ya expone algunos contadores del scheduler.
- projectStatus y readiness aportan parte de la visibilidad.
- Falta una superficie unificada del indexador como actor operativo.

## 3. Diseno propuesto

- Introducir un IndexerStateSnapshot o contrato equivalente.
- Alimentarlo desde el indexador y el scheduler con datos baratos de mantener.
- Exponer la lectura por una API interna util para projectStatus, logs o comandos.
- Mantener separadas observabilidad operativa y readiness agregado.

## 4. Impacto en rendimiento

- Positivo en depuracion y explicabilidad.
- El coste debe ser minimo y apoyarse en contadores incrementales.

## 5. Riesgos tecnicos

- Mezclar estado del indexador con estado global del workspace.
- Construir el snapshot con operaciones caras cada vez que se consulta.
- Duplicar contadores ya existentes sin fuente unica.

## 6. Estrategia de validacion

- Tests unitarios del snapshot de estado.
- Tests de integracion con projectStatus o salida equivalente.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/architecture.md si se consolida una nueva superficie operativa del runtime