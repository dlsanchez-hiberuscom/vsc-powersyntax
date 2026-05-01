# Plan — Spec 136 Semantic Diff Engine (B170)

## 1. Resumen tecnico

La base tecnica debe reutilizar src/server/analysis/documentAnalysis.ts, analysisCache.ts y las estructuras parseadas por documentModel, codeMasking, sections y controlBlocks para comparar artefactos ya normalizados.

## 2. Estado actual

- fingerprint y analysisCache ya permiten algunos atajos.
- No existe una salida formal de impacto semantico reusable por invalidacion.

## 3. Diseno propuesto

- Definir una estructura de semantic diff con tipo de cambio, impacto y artefactos afectados.
- Comparar snapshots o piezas documentales canonicas en vez de texto bruto.
- Usar fingerprint y otras huellas rapidas como puerta de entrada al diff detallado.
- Dejar un contrato estable para que B153 y B154 lo consuman despues.

## 4. Impacto en rendimiento

- Debe mejorar la recomputacion global al reducir invalidaciones innecesarias.
- Riesgo de coste extra por comparaciones profundas; se mitiga con fast paths y niveles de impacto.

## 5. Riesgos tecnicos

- No definir bien la taxonomia de impacto.
- Duplicar logica ya presente en caches o parsing.
- Acoplar demasiado el diff a una representacion temporal del snapshot.

## 6. Estrategia de validacion

- Tests unitarios de semantic diff.
- Casos con cambios de comentarios, whitespace, firmas y herencia.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- specs de invalidacion y dependencias inversas que dependan de esta clasificacion