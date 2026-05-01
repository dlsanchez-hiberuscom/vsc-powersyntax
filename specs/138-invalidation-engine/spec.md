# Spec 138 — Invalidation engine explicito (B154)

## 1. Resumen

Centralizar la logica de invalidacion del servidor en un motor explicito basado en tipo de cambio, epoch y dependencias semanticas impactadas.

## 2. Problema

Hoy la invalidacion esta repartida entre server.ts, analysisCache, DocumentCache, HotContextCache y ServingCache. Eso dificulta razonar que debe invalidarse, en que orden y con que granularidad.

## 3. Objetivo

Disponer de un invalidation engine que reciba cambios clasificados, construya un plan de invalidacion y produzca un selective reindex plan reutilizable por el scheduler.

## 4. Alcance

- Definir classifyChangeKind apoyado en diff semantico y epoch.
- Definir buildInvalidationPlan como contrato central.
- Emitir selectiveReindexPlan para documentos y artefactos afectados.
- Sustituir invalidaciones dispersas del camino principal por una orquestacion unica.

## 5. Fuera de alcance

- Watcher backpressure.
- Checkpoints persistentes.
- Query cache semantica final.

## 6. Requisitos

- R1. Toda invalidacion relevante debe entrar por un punto central del runtime.
- R2. El plan debe distinguir caches documentales, estado publicado, dependencias impactadas y recomputacion programable.
- R3. Debe integrarse con B153, B166 y B170 sin rehacer logica equivalente en cada feature.
- R4. Debe preservar prioridad del archivo activo y degradacion segura cuando el plan sea incompleto.

## 7. Criterios de aceptacion

- AC1. Existe un invalidation engine unico para el servidor.
- AC2. Las invalidaciones dispersas principales se sustituyen por planes explicitos.
- AC3. Los tests cubren al menos un cambio local, uno cross-file y un caso de no-op.
- AC4. La documentacion liga B154 a este slice.

## 8. Riesgos y notas

- Centralizar no debe convertirse en un cuello de botella.
- El primer corte debe cubrir el camino critico sin intentar cerrar toda la taxonomia de cambios a la vez.