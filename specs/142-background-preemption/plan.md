# Plan — Spec 142 Background Preemption (B124)

## 1. Resumen tecnico

La base tecnica es src/server/runtime/cancellation.ts, src/server/runtime/scheduler.ts, src/server/server.ts y las tareas largas del indexador o diagnosticos que hoy trabajan en background.

## 2. Estado actual

- El proyecto ya tiene runtime/cancellation y scheduler.
- Aun falta convertir esa base en un contrato de preempcion observable y aplicado al trabajo de fondo principal.

## 3. Diseno propuesto

- Hacer que tareas de fondo revisen el estado de cancelacion en puntos de control seguros.
- Permitir que el scheduler marque una tarea como preempted al llegar trabajo interactivo de mas prioridad.
- Reencolar la tarea con estado reanudable minimo.
- Registrar motivos de cancelacion y reentrada para observabilidad basica.

## 4. Impacto en rendimiento

- Positivo en latencia interactiva bajo carga.
- Riesgo de overhead por demasiados puntos de control si se aplican sin criterio.

## 5. Riesgos tecnicos

- No encontrar puntos de corte seguros en todas las tareas largas.
- Reanudar con informacion insuficiente.
- Cancelar trabajo que deberia completar una publicacion atomica ya iniciada.

## 6. Estrategia de validacion

- Tests del scheduler con preempcion.
- Tests de cancelacion cooperativa del indexador.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/architecture.md si se formaliza la preempcion como parte del runtime oficial