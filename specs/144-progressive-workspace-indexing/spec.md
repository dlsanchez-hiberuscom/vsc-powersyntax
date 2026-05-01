# Spec 144 — Indexacion progresiva del workspace completo (B125)

## 1. Resumen

Hacer que todo el workspace entre en el pipeline con estados conocidos y converja progresivamente hacia ready sin bloquear ni perder prioridad del contexto activo.

## 2. Problema

El proyecto ya indexa y sirve capacidades, pero falta un modelo operativo explicito para recorrer el workspace completo de forma progresiva, observable y compatible con priorizacion semantica, yielding y watcher intake.

## 3. Objetivo

Definir la indexacion progresiva del workspace como pipeline controlado por estados, con convergencia observable y preparacion para readiness agregado y checkpoints.

## 4. Alcance

- Introducir estados explicitos por archivo o unidad indexable.
- Hacer que el indexador recorra el workspace de forma progresiva y reanudable.
- Integrar prioridad del archivo activo, cercania semantica, yielding y backpressure.
- Dejar la base para progreso, readiness y checkpoints.

## 5. Fuera de alcance

- Checkpoints persistentes.
- Modelo final de progreso agregado.
- Governor de latencia final.

## 6. Requisitos

- R1. Cada archivo relevante del workspace debe tener estado explicito dentro del pipeline.
- R2. El archivo activo y su contexto cercano deben adelantarse al resto.
- R3. El pipeline debe poder converger progresivamente sin bloquear consultas interactivas.
- R4. Debe integrarse con watcher intake, budgets y preempcion.

## 7. Criterios de aceptacion

- AC1. workspaceIndexer recorre el workspace con estados conocidos.
- AC2. El sistema converge hacia workspace ready sin monopolizar el runtime.
- AC3. Los tests cubren progresion del estado y prioridad del contexto activo.
- AC4. B125 queda trazada como base directa de B126, B134 y B155.

## 8. Riesgos y notas

- Sin estados claros, la progresion sera dificil de observar y depurar.
- Un pipeline muy fino puede complicar demasiado la orquestacion si no se apoya en contratos simples.