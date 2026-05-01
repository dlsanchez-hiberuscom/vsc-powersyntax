# Spec 216 - KB snapshot pass observability (B152A)

## 1. Resumen

Exponer en `KnowledgeBase.getStats()` el reparto de snapshots publicados por `pass` y `readiness`.

## 2. Problema

El pipeline structural/enriched ya existía y se publicaba, pero la observabilidad agregada de la KB no distinguía cuánto del conocimiento estaba todavía en `structural-only` frente a `nearby-semantic-ready`.

## 3. Objetivo

Hacer visible ese reparto en la fuente principal de estadísticas del runtime.

## 4. Alcance

- contar snapshots structural/enriched;
- contar snapshots structural-only/nearby-semantic-ready;
- cubrirlo con test unitario de `KnowledgeBase`.

## 5. Fuera de alcance

- UI dedicada de progreso por pass;
- cambiar aún el contrato del indexador.

## 6. Requisitos

- R1. Las estadísticas deben derivarse del estado publicado real.
- R2. Deben distinguir `pass` y `readiness`.

## 7. Criterios de aceptacion

- AC1. `getStats()` expone el reparto de snapshots por pass y readiness.
- AC2. Hay test unitario que cubre ambos estados.

## 8. Riesgos y notas

- Esta slice mejora observabilidad de `B152A`, pero no sustituye un modelo de progreso dedicado del indexador.