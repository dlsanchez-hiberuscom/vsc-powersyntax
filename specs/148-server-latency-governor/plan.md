# Plan — Spec 148 Server Latency Governor (B159)

## 1. Resumen tecnico

La base tecnica debe apoyarse en src/server/runtime/scheduler.ts, runtime/cancellation.ts, runtime/timing.ts, server.ts y las superficies de degraded mode y estado del indexador.

## 2. Estado actual

- El runtime ya cuenta con scheduler, timing, budgets y preempcion parcial.
- Falta una capa de decision que convierta presion interactiva en politica operativa global.

## 3. Diseno propuesto

- Medir presion interactiva con senales simples: colas, tiempos recientes y ocupacion interactiva.
- Definir un governor con estados como normal, presion alta y proteccion estricta.
- Hacer que el scheduler adapte cuanto trabajo de fondo corre en cada estado.
- Coordinar la respuesta con degraded mode cuando falte base para mantener latencia.

## 4. Impacto en rendimiento

- Positivo en consistencia de latencia visible.
- Riesgo de ralentizar la convergencia global si se sobrerregula.

## 5. Riesgos tecnicos

- Medir mal la presion real.
- Acoplar el governor a demasiadas heuristicas opacas.
- Generar oscilaciones rapidas entre estados si no hay historesis minima.

## 6. Estrategia de validacion

- Tests del governor con escenarios de cola y presion.
- Integracion con scheduler y consultas interactivas.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/performance-budget.md si se fijan umbrales operativos
- docs/roadmap.md si se concreta mejor el criterio de salida de latencia protegida