# Plan — Spec 143 Watcher Backpressure (B169)

## 1. Resumen tecnico

La implementacion debe apoyarse en src/server/system/fileWatcherDebouncer.ts, el wiring de watchers en server.ts y la conexion con invalidation engine y scheduler del runtime.

## 2. Estado actual

- Existe debounce de watcher.
- Todavia no hay una politica de intake mas completa con backpressure real y modo masivo.

## 3. Diseno propuesto

- Separar watcher debounce de watcher intake pipeline.
- Agrupar eventos por clave relevante y ventana temporal.
- Aplicar una politica de backpressure que priorice activo y reduzca ruido acumulado.
- Entrar en massiveChangeMode cuando el volumen supere un umbral o patron conocido.

## 4. Impacto en rendimiento

- Positivo bajo cambios masivos y repos grandes.
- Debe minimizar trabajo redundante y proteger la latencia interactiva.

## 5. Riesgos tecnicos

- Solapar responsabilidades con el invalidation engine.
- No diferenciar bien eventos pequenos frente a oleadas masivas.
- Introducir retrasos excesivos en cambios simples.

## 6. Estrategia de validacion

- Tests unitarios del intake pipeline.
- Casos de burst pequeño y burst masivo.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/architecture.md si se formaliza la capa intake de watchers