# Spec 136 — Semantic diff engine (B170)

## 1. Resumen

Clasificar el impacto semantico real de un cambio documental para que la invalidacion y la reindexacion no dependan solo de que el archivo haya cambiado.

## 2. Problema

El pipeline actual puede distinguir cambios por URI o fingerprint, pero no dispone de un motor dedicado para separar cambios inocuos, estructurales y semanticamente relevantes con granularidad suficiente.

## 3. Objetivo

Crear un semantic diff engine que compare snapshots o resultados documentales y produzca una clasificacion de impacto util para invalidacion, reindexacion y fast paths de no-semantic-change.

## 4. Alcance

- Definir classifyDocumentSemanticDiff y diffImpactLevel.
- Introducir un fast path para cambios sin impacto semantico relevante.
- Conectar el diff al pipeline de analisis documental y a la futura invalidacion centralizada.

## 5. Fuera de alcance

- Motor de invalidacion completo.
- Dependencias semanticas inversas.
- Politicas de backpressure del watcher.

## 6. Requisitos

- R1. El diff debe comparar snapshots o artefactos documentales canonicos, no texto bruto aislado.
- R2. Debe distinguir, al menos, no semantic change, cambio local seguro y cambio con impacto semantico ampliado.
- R3. Debe ser barato en los casos comunes para no penalizar la latencia del archivo activo.
- R4. Debe reutilizar piezas existentes de documentAnalysis, parsing y fingerprinting.

## 7. Criterios de aceptacion

- AC1. Existe una clasificacion semantica documentada y consumible por invalidacion.
- AC2. El fast path evita recomputacion ampliada cuando el cambio no altera la semantica relevante.
- AC3. Los tests cubren cambios de comentarios, cambios de formato y cambios de simbolos/firma.
- AC4. B170 queda enlazada con B153 y B154 como dependencia real.

## 8. Riesgos y notas

- Un diff demasiado profundo puede costar casi lo mismo que recomputar todo.
- Un diff demasiado superficial provocara falsos negativos y serviria resultados incorrectos.