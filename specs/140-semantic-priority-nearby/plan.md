# Plan — Spec 140 Semantic Priority Nearby (B122)

## 1. Resumen tecnico

La implementacion debe apoyarse en src/server/runtime/scheduler.ts y src/server/indexer/workspaceIndexer.ts, alimentandose de src/server/workspace/projectRegistry.ts, src/server/knowledge/resolution/InheritanceGraph.ts y del futuro grafo inverso.

## 2. Estado actual

- El scheduler ya distingue trabajo interactivo y de fondo.
- El proyecto tiene piezas de topologia y herencia reutilizables.
- Falta una politica explicita de prioridad semantica cercana.

## 3. Diseno propuesto

- Definir una puntuacion o ranking de cercania semantica reutilizable.
- Alimentar esa puntuacion con activo, ancestros, owner/type proximity y contexto de proyecto.
- Integrar el ranking en el indexador y en la cola near del scheduler.
- Mantener una cuota minima de progreso global para evitar starvation.

## 4. Impacto en rendimiento

- Positivo en latencia percibida del archivo activo.
- Riesgo bajo si el ranking se calcula sobre relaciones ya conocidas y no abre consultas costosas por item.

## 5. Riesgos tecnicos

- Acoplar demasiado la prioridad a datos aun no disponibles en todos los casos.
- Recalcular prioridades de forma demasiado cara.
- Romper fairness entre trabajo cercano y global.

## 6. Estrategia de validacion

- Tests del scheduler o indexador con orden esperado.
- Casos con herencia, proyecto activo y archivo no relacionado.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/architecture.md si se formaliza una cola semantica cercana en runtime