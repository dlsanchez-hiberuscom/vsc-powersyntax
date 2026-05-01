# Spec 190 - Bridge de provenance de sistema a lineage (B172)

## 1. Resumen

Mapear `PbSystemSymbolProvenance` al vocabulario común de `EntityLineage` para que el catálogo de sistema pueda hablar el mismo idioma que los símbolos de usuario.

## 2. Problema

El catálogo de sistema ya modela provenance, pero todavía no existe una conversión explícita al contrato común de lineage que consumen serving y futuras surfaces.

## 3. Objetivo

Introducir un mapper puro de provenance de sistema a lineage.

## 4. Alcance

- Añadir un helper puro en `system/normalization.ts`.
- Cubrirlo con tests unitarios.
- Mantener el bridge pequeño y sin tocar aún hover/API.

## 5. Fuera de alcance

- Exponer lineage en hover.
- Adaptar API pública.
- Reescribir `SystemCatalog`.

## 6. Requisitos

- R1. El bridge debe fijar `sourceKind: 'system'`.
- R2. Debe transportar `authority` al mismo vocabulario de lineage.
- R3. Debe derivar una confianza base razonable.

## 7. Criterios de aceptacion

- AC1. El catálogo de sistema dispone de un bridge explícito a lineage.
- AC2. El test del slice demuestra el mapeo manual/generated/official.
- AC3. Compile y baseline completo quedan en verde.

## 8. Riesgos y notas

- Si el bridge se hace implícito dentro de hover o completion, B172 vuelve a fragmentarse.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md.