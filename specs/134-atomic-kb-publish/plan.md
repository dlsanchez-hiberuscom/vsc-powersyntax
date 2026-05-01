# Plan — Spec 134 Atomic KB Publish (B165)

## 1. Resumen tecnico

La implementacion debe pivotar sobre src/server/knowledge/KnowledgeBase.ts y el wiring de src/server/server.ts, con impacto tambien en ServingCache y en los servicios que hoy leen conocimiento compartido en caliente.

## 2. Estado actual

- KnowledgeBase ya centraliza parte del conocimiento del runtime.
- server.ts coordina indexacion, invalidacion y serving interactivo.
- No existe una barrera clara entre estado en construccion y estado publicado.

## 3. Diseno propuesto

- Introducir una representacion stagedSemanticState que agrupe snapshot publicado, indices derivados y metadatos minimos.
- Construir el nuevo estado fuera de la ruta visible y hacer un swap atomico al final.
- Encapsular la politica de rollback cuando el nuevo estado no supera validaciones internas.
- Exponer solo el estado publicado a features y caches interactivas.

## 4. Impacto en rendimiento

- Positivo en coherencia y debugging.
- Riesgo moderado de picos de memoria durante el doble buffering.
- Debe minimizarse la duracion de staging visible para el archivo activo.

## 5. Riesgos tecnicos

- Acoplar demasiado staging con implementaciones actuales de caches.
- Introducir locks logicos o pasos sincronizados que penalicen latencia.
- No delimitar bien que datos pertenecen al publish atomico y cuales no.

## 6. Estrategia de validacion

- Tests unitarios del publish swap y rollback.
- Tests de integracion sobre una actualizacion de documento con queries concurrentes.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/architecture.md para reforzar la regla de atomicidad cuando el diseno quede cerrado