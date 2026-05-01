# Spec 186 - Población inicial de lineage desde análisis (B172)

## 1. Resumen

Poblar `lineage` en las entidades semánticas generadas por `analyzeDocument`, distinguiendo origen documental, prototype frente a implementation e información básica de herencia.

## 2. Problema

El contrato `EntityLineage` ya existe, pero todavía no hay ningún productor real que lo rellene.

## 3. Objetivo

Hacer que `mapToSemanticFacts` produzca un lineage inicial útil y coherente para las entidades del documento.

## 4. Alcance

- Poner `sourceKind: 'document'` y `authority: 'derived'`.
- Distinguir `phase` y `role` para prototype vs implementation.
- Propagar `baseTypeName` a `inheritedFrom` cuando aplique.

## 5. Fuera de alcance

- Normalización derivada en `enrichEntity`.
- Query/service lineage.
- Hover o API pública.

## 6. Requisitos

- R1. Los prototypes deben reflejarse como `phase: 'prototype'` y `role: 'prototype'`.
- R2. Las implementaciones deben reflejarse como `phase: 'implementation'` y `role: 'implementation'` cuando aplique.
- R3. Las entidades producidas deben llevar `sourceKind: 'document'`, `authority: 'derived'` y `confidence: 'direct'`.

## 7. Criterios de aceptacion

- AC1. `analyzeDocument` emite semanticFacts con lineage básico útil.
- AC2. Prototype, implementation y herencia documental quedan trazados.
- AC3. Compile y baseline completo quedan en verde.

## 8. Riesgos y notas

- Si parser y enrichEntity repiten reglas distintas, B172 se fragmenta.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md.