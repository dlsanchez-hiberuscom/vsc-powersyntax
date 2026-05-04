# Spec 380: Enum real-corpus validation

## Status

Closed.

## Backlog mapping

- B364 — Enum catalog real-corpus validation against PFC, STD and public PB repositories.

## Objective

Validar el consumo real del catálogo enumerado sobre PFC Solution, STD_FC_OrderEntry y legacy PBL dump, separando valores catalogados, unknown, falsos positivos textuales y casos fuera de contexto sin promover nuevos valores al catálogo.

## Implemented scope

- `src/server/features/catalogCorpusValidation.ts` publica `collectEnumCatalogCorpusUsageObservations()` y `buildEnumCatalogCorpusUsageReport()` para escanear valores con `!` sobre texto enmascarado y clasificarlos como `official-known`, `curated-known`, `candidate`, `false-positive`, `out-of-context` o `unknown`.
- `test/server/unit/catalogCorpusValidation.test.ts` cubre el resumen agregado y la clasificación sintética de valores con `!` en contexts conocidos, candidatos, texto no ejecutable y mismatches de contexto.
- `test/server/performance/enumCatalogCorpusValidation.smoke.test.ts` indexa PFC Solution, STD_FC_OrderEntry y legacy PBL dump y construye un reporte corpus-driven reproducible con breakdown por corpus.
- La evidencia real observada queda trazada en `13068` ocurrencias con `!`: `1554` catalogadas (`724` oficiales, `830` curadas), `5296` unknown, `6214` false positives, `4` out-of-context y `0` candidates.
- No se añadieron unknowns al catálogo; las familias detectadas (`contemporarymenu!`, `contemporarytoolbar!`, `HourGlass!`, `OK!`, `Information!`, `Exclamation!`, `ansi!`, `swiss!`, `Exclude!`) quedan encaminadas a `B368/B370`.

## Out of scope

- Promover valores observados en PFC/STD/public corpora al catálogo oficial o manual-curated sin fuente oficial defendible.
- Cerrar `B367-B370` o abrir localización a partir de la evidencia de `B364`.
- Añadir nuevos corpus al repo o reemplazar el gate arquitectónico de `B356`.

## Acceptance evidence

- Existe un reporte corpus-driven reproducible con breakdown por corpus y categorías para valores con `!`.
- PFC Solution, STD_FC_OrderEntry y legacy PBL dump se escanean sin crash y sin reintroducir un hot path costoso sobre diagnostics por archivo.
- La evidencia deja explícitos los gaps reales y el ruido textual sin promocionarlos al catálogo.
- Los artefactos canónicos (`testing`, `performance-budget`, `baseline`, `backlog`, `current-focus`, `done-log`) quedan alineados con el cierre.

## Validation

```bash
npm run test:unit -- --grep "catalogCorpusValidation"
npm run test:performance -- --grep "enumCatalogCorpusValidation|PFC/OrderEntry/legacy"
npm run test:unit -- --grep "enumerated|enum|catalog"
npm run test:performance -- --grep "PFC|OrderEntry|STD"
```