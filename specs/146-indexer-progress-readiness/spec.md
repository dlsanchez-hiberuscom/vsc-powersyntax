# Spec 146 — Modelo de progreso y readiness del indexador (B134)

## 1. Resumen

Definir una fuente unica de verdad para progreso y readiness del indexador, separando claramente avance operativo y disponibilidad semantica.

## 2. Problema

El proyecto ya tiene readiness y status parciales, pero falta un modelo consolidado que explique discovery, indexing, contexto activo listo, proyecto listo y workspace listo con semantica uniforme.

## 3. Objetivo

Crear un modelo de progreso y readiness del indexador que pueda alimentar UI, logs, decisiones de degradacion y futuros checkpoints.

## 4. Alcance

- Unificar porcentajes o estados de discovery e indexing.
- Modelar active context ready, project ready y workspace ready.
- Distinguir progreso operativo de readiness semantica.
- Conectar esta fuente con project status y modo degradado.

## 5. Fuera de alcance

- UI final definitiva.
- Checkpoints persistentes.
- Health checker completo.

## 6. Requisitos

- R1. Debe existir una unica fuente de verdad para progreso y readiness del indexador.
- R2. Debe distinguir porcentaje de trabajo de nivel de disponibilidad semantica.
- R3. Debe modelar al menos active context ready, project ready y workspace ready.
- R4. Debe alimentar decisiones de degradacion segura de features.

## 7. Criterios de aceptacion

- AC1. Existe un modelo unificado de progreso y readiness.
- AC2. projectStatus o superficie equivalente lo consume.
- AC3. Los tests cubren transiciones base de readiness y progreso.
- AC4. B134 queda trazada como dependencia directa de B158.

## 8. Riesgos y notas

- Mezclar porcentaje y readiness en una sola senal puede confundir a consumidores.
- El modelo debe ser simple de explicar y estable en el tiempo.