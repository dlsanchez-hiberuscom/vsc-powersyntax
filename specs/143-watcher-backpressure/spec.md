# Spec 143 — Watcher intake pipeline con backpressure real (B169)

## 1. Resumen

Convertir la entrada de eventos del filesystem en un pipeline controlado con coalescing, backpressure y modo de cambio masivo para evitar tormentas operativas.

## 2. Problema

El servidor ya dispone de debounce para watcher, pero cambios masivos como branch switches, git pull o regeneraciones pueden producir una cola caotica de eventos y trabajo redundante.

## 3. Objetivo

Diseñar un watcher intake pipeline que absorba eventos del filesystem, los agrupe, aplique politicas de backpressure y active un modo especifico para cambios masivos.

## 4. Alcance

- Definir watcherEventCoalescing.
- Definir backpressurePolicy para la cola de intake.
- Introducir massiveChangeMode para oleadas grandes de eventos.
- Integrar la salida con invalidation engine y scheduler.

## 5. Fuera de alcance

- Persistencia de checkpoints.
- Progress model completo.
- Latency governor final.

## 6. Requisitos

- R1. El intake debe absorber altas tasas de eventos sin disparar trabajo redundante incontrolado.
- R2. Debe poder agrupar eventos por URI, proyecto o ventana temporal util.
- R3. massiveChangeMode debe evitar colapsar el runtime durante cambios masivos.
- R4. La politica debe ser observable y compatible con invalidacion selectiva.

## 7. Criterios de aceptacion

- AC1. Existe pipeline explicito de intake con coalescing y backpressure.
- AC2. Un cambio masivo no dispara una explosion de trabajo desordenada.
- AC3. Los tests cubren coalescing y modo masivo en casos base.
- AC4. B169 queda trazada como base de B125 y B155.

## 8. Riesgos y notas

- Un coalescing demasiado agresivo puede perder precision necesaria.
- Un modo masivo mal calibrado puede retrasar demasiado el archivo activo.