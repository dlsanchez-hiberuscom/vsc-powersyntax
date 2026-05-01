# Spec 224 - Confidence scorer v1 (B157)

## 1. Resumen

Calcular una confidence general de resolución a partir del winner path ya estabilizado en `ResolvedTargetInfo`.

## 2. Problema

Tras `Specs 219-223`, el query engine ya expone ganador, pool, descartes y ambigüedad, pero todavía no deriva una confidence compacta que sirva de base a slices posteriores.

## 3. Objetivo

Introducir un scorer v1, pequeño y puro, que derive `confidence` general del resultado detallado.

## 4. Alcance

- modelar `confidence` en `ResolvedTargetInfo`;
- derivarla desde `reasonCode`, lineage, misses y ambigüedad;
- cubrir los buckets alto, medio y bajo con tests unitarios focalizados.

## 5. Fuera de alcance

- gates por feature;
- exposición pública en API o stats;
- cambios de comportamiento en providers.

## 6. Requisitos

- R1. El scorer debe ser puro y basado en información ya disponible.
- R2. No puede cambiar la selección de `targets`.
- R3. La validación debe ser ejecutable y centrada en `semanticQueryService`.

## 7. Criterios de aceptacion

- AC1. `ResolvedTargetInfo` expone `confidence`.
- AC2. La confidence distingue al menos `high`, `medium` y `low`.
- AC3. La suite unitaria focalizada cubre rutas alta, media y baja.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- Esta slice solo define una confidence general, no la política final por feature.
- Documentacion a revisar: `docs/done-log.md`.