# Spec 148 — Gobernador de latencia del servidor (B159)

## 1. Resumen

Introducir un latency governor explicito que proteja la latencia interactiva bajo presion alta del scheduler, del indexador y del watcher.

## 2. Problema

Budgets, yielding y preempcion reducen bloqueo, pero todavia falta una politica superior que observe la presion del servidor y adapte cuanto trabajo de fondo puede ejecutarse sin degradar las consultas interactivas.

## 3. Objetivo

Definir reglas explicitas para limitar, retrasar o degradar trabajo de fondo cuando la latencia interactiva se acerque a umbrales no aceptables.

## 4. Alcance

- Definir metricas y umbrales operativos de latencia.
- Integrar esas metricas con scheduler, preempcion y modo degradado.
- Permitir throttling o aplazamiento de trabajo de fondo bajo presion.
- Mantener observable el motivo de la regulacion.

## 5. Fuera de alcance

- Optimizaciones internas de cada feature.
- Persistencia de metricas historicas.
- Telemetria externa avanzada.

## 6. Requisitos

- R1. El runtime debe poder detectar presion interactiva alta.
- R2. Debe existir una politica explicita de proteccion de latencia para trabajo de fondo.
- R3. La regulacion debe coordinarse con budgets, yielding, preempcion y degraded mode.
- R4. El usuario debe recibir una experiencia consistente incluso bajo carga alta del workspace.

## 7. Criterios de aceptacion

- AC1. Existe un latency governor reusable por el runtime.
- AC2. Bajo presion alta se reduce o reprograma trabajo de fondo en favor de consultas interactivas.
- AC3. Los tests cubren al menos un escenario de presion y proteccion efectiva.
- AC4. B159 queda trazada como cierre natural del bloque de latencia de Fase A.

## 8. Riesgos y notas

- Umbrales demasiado conservadores podrian ralentizar innecesariamente el progreso global.
- Umbrales demasiado laxos no protegeran la experiencia interactiva.