# Spec 217 - Indexer pass publication counters (B152A)

## 1. Resumen

Exponer en `getIndexerStatus()` cuántos documentos han sido publicados en el pase `structural` y en el pase `enriched`.

## 2. Problema

La KB ya distinguía snapshots structural/enriched, pero el estado del indexador no hacía visible cuántos documentos había publicado efectivamente en cada pase durante una corrida.

## 3. Objetivo

Completar la observabilidad del pipeline de dos fases desde el propio indexador.

## 4. Alcance

- añadir contadores de publicación por pass al estado del indexador;
- actualizarlos al publicar structural batch y al promover enriched;
- cubrirlos con tests existentes de `workspaceIndexer`.

## 5. Fuera de alcance

- progreso fino por documento en UI;
- cambios de contrato del notification payload.

## 6. Requisitos

- R1. El estado debe indicar cuántos documentos se publicaron estructuralmente.
- R2. El estado debe indicar cuántos ya fueron promovidos a enriched.

## 7. Criterios de aceptacion

- AC1. `getIndexerStatus()` expone `structuralPublished` y `enrichedPublished`.
- AC2. Los tests de transición structural->enriched verifican ambos contadores.

## 8. Riesgos y notas

- Esta slice es de observabilidad; no altera el orden ni el coste del pipeline.