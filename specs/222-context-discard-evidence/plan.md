# Plan - Spec 222 Motivos de descarte por contexto (B157)

## 1. Resumen tecnico

Conservar los misses de qualifier dentro de `resolveTargetEntityDetailed()` y proyectarlos a `evidence` como descartes contextuales pequeños.

## 2. Estado actual

- el runtime conoce si un qualifier no resuelve a tipo;
- también sabe cuando el tipo resuelto no aporta miembros compatibles;
- esos misses aún no se exponen de forma estructurada.

## 3. Diseno propuesto

- añadir una variante `discarded-context` a `QueryEvidenceEntry`;
- registrar misses de `qualifier-unresolved` y `qualifier-no-match`;
- mantener el contrato local a `semanticQueryService`.

## 4. Impacto en el runtime

- mejora explicabilidad en casos negativos del winner path;
- prepara slices posteriores de confidence sin abrir aún providers.

## 5. Riesgos tecnicos

- generar evidence negativa en rutas que sí acaban encontrando ganador;
- mezclar misses de qualifier con descartes de distancia sin una frontera clara.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/semanticQueryService"`

## 7. Documentacion a actualizar

- `docs/done-log.md`