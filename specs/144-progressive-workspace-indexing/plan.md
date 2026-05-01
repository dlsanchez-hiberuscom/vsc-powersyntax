# Plan — Spec 144 Progressive Workspace Indexing (B125)

## 1. Resumen tecnico

La implementacion debe centrarse en src/server/indexer/workspaceIndexer.ts y coordinarse con runtime/scheduler, workspace/readiness y el futuro modelo de estado del indexador.

## 2. Estado actual

- workspaceIndexer existe como superficie principal de indexacion.
- El proyecto ya tiene readiness y status parcial, pero no una convergencia progresiva formal del workspace completo.

## 3. Diseno propuesto

- Modelar estados por unidad indexable dentro del workspace.
- Hacer que el indexador procese esas unidades por oleadas pequenas y reanudables.
- Integrar priorizacion semantica, budgets, preempcion y watcher intake.
- Exponer el estado necesario para observabilidad y readiness agregados.

## 4. Impacto en rendimiento

- Positivo en interactividad y visibilidad del progreso.
- Riesgo de complejidad si el modelo de estado no se mantiene compacto.

## 5. Riesgos tecnicos

- Duplicar estado entre indexador, readiness y projectStatus.
- No definir bien cuando una unidad pasa a ready.
- Hacer depender la convergencia de demasiadas colas distintas.

## 6. Estrategia de validacion

- Tests de workspaceIndexer con estados progresivos.
- Casos de interrupcion y reanudacion.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/roadmap.md si la definicion operativa de workspace ready se precisa mas