# Plan — Spec 141 Work Budget and Yielding (B123)

## 1. Resumen tecnico

La implementacion debe concentrarse en src/server/runtime/scheduler.ts, src/server/runtime/fairScheduler.ts, src/server/indexer/workspaceIndexer.ts y cualquier orquestacion larga del servidor como diagnosticScheduler.

## 2. Estado actual

- El proyecto ya introdujo tiempo de slice en work anteriores, pero no hay una politica transversal cerrada sobre todo el runtime.
- Existen colas y scheduler suficientes para introducir yielding cooperativo real.

## 3. Diseno propuesto

- Definir budgets por tiempo o por unidades procesadas.
- Instrumentar el indexador para que ceda al agotarse el budget.
- Propagar el contrato a otras tareas largas del runtime.
- Exponer contadores o trazas basicas para observar yield y reanudacion.

## 4. Impacto en rendimiento

- Positivo en latencia percibida y reparto de CPU.
- Riesgo de overhead si se cede con demasiada frecuencia.

## 5. Riesgos tecnicos

- Medir mal el coste real del trabajo.
- Introducir yields en puntos no reanudables facilmente.
- Duplicar logica de budgets entre indexador y scheduler.

## 6. Estrategia de validacion

- Tests unitarios del scheduler con yields.
- Tests del indexador reanudando trabajo por budget.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/performance-budget.md si se fijan umbrales concretos