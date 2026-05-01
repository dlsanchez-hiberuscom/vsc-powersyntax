# Plan — Spec 149 Unified Library Graph (B141)

## 1. Resumen tecnico

La implementacion debe partir de src/server/workspace/projectRegistry.ts, src/server/workspace/topology.ts, src/server/workspace/workspaceState.ts y src/server/knowledge/resolution/libraryOrder.ts.

## 2. Estado actual

- projectRegistry ya modela parte de la pertenencia y del orden por proyecto.
- topology y workspaceState aportan contexto adicional.
- Falta una fuente de verdad unica y explicitamente reutilizada por todo el runtime.

## 3. Diseno propuesto

- Introducir un project model unificado que encapsule targets, librerias, orden y dependencias.
- Hacer que workspaceState sea propietario de esa fuente de verdad.
- Adaptar libraryOrder y otros consumidores cercanos para leer desde el nuevo modelo.
- Preparar el modelo para caches por proyecto y checkpoints.

## 4. Impacto en rendimiento

- Positivo por reducir reconstrucciones y heuristicas duplicadas.
- Riesgo bajo de coste de memoria si el modelo duplica estructuras ya presentes en projectRegistry.

## 5. Riesgos tecnicos

- Reescribir topologia mas alla de lo necesario.
- No definir bien la frontera entre datos descubiertos y datos derivados.
- Dejar consumidores criticos atados a contratos viejos.

## 6. Estrategia de validacion

- Tests del project model y library order.
- Casos de pertenencia de archivo y orden de resolucion.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/architecture.md
- docs/roadmap.md al formalizar el arranque de Fase 2