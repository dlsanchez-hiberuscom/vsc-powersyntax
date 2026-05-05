# ADR-0001 — System Catalog Source of Truth

## Status

Accepted.

## Date

2026-05-04

## Context

`B367` dejó el rail oficial del catálogo en modo `complete`, con `generatedCompleteness.generated.ts` y `missingCount = 0` en todos los dominios oficiales medidos.

`B368` dejó explícita la gobernanza manual: `manualOverlay` clasifica `gap`, `enrichment`, `override` y `candidate`, `catalogConsistency` bloquea overlaps manual/generated sin policy y `queryService.ts` aplica una merge policy provisional sobre el hot path.

`B369` debía decidir, con métricas reales, si el source-of-truth del catálogo debía quedar como `generated official primary`, `manual curated primary` o `hybrid by domain`.

## Options considered

### 1. generated official primary

Usar `generated` como base de serving y considerar `manual` únicamente como overlays curados (`gap`, `enrichment`, `override`, `candidate`) o como fallback temporal en dominios sin rail oficial.

### 2. manual curated primary

Mantener `manual-core` como base y usar `generated` solo como fuente comparativa o de enriquecimiento puntual.

### 3. hybrid by domain

Tomar una decisión distinta por dominio, permitiendo que algunos dominios sigan siendo manual-primary aunque exista rail oficial generado.

## Evidence

Las métricas reales publicadas por `buildCatalogConsistencyReport().adoption` en `main` son:

- `officialCount = 6601`
- `generatedCount = 2146`
- `manualCount = 1039`
- `duplicateCount = 695`
- `gapCount = 343`
- `overrideCount = 1`
- `enrichmentCount = 695`
- `candidateCount = 0`
- `scraperErrorCount = 0`
- `maintenanceCost = 2079`

Calidad comparativa observada en el summary global:

- `generated.signatureQuality = 1542/1542 = 1.00`
- `manual.signatureQuality = 650/650 = 1.00`
- `generated.appliesToQuality = 1261/1810 = 0.6967`
- `manual.appliesToQuality = 475/891 = 0.5331`
- `generated.ownerTypesQuality = 1261/1472 = 0.8567`
- `manual.ownerTypesQuality = 465/681 = 0.6828`
- `generated.eventIdCoverage = 183/187 = 0.9786`
- `manual.eventIdCoverage = 0/57 = 0.0000`
- `generated.returnTypeCoverage = 1228/1542 = 0.7964`
- `manual.returnTypeCoverage = 0/650 = 0.0000`
- `generated.parameterDocsCoverage = 2224/2302 = 0.9661`
- `manual.parameterDocsCoverage = 25/25 = 1.0000`
- `generated.hoverUsefulness = 2146/2146 = 1.00`
- `manual.hoverUsefulness = 1039/1039 = 1.00`
- `generated.signatureHelpUsefulness = 1407/1542 = 0.9125`
- `manual.signatureHelpUsefulness = 14/650 = 0.0215`

Hallazgos estructurales relevantes:

- `officialDomainsWithGaps = []`
- `manualGeneratedOverlapsWithoutOverlay = []`
- dominios sin rail oficial generado hoy: `datawindow-events`, `operators`, `pronouns`, `system-globals`
- ejemplo representativo de official domain con overlays: `datatypes` publica `24/24` oficiales, `18` enrichments y `1` gap manual
- ejemplo representativo de override: `datawindow-functions` conserva `1` override manual explícito (`Clipboard`) sobre base generated

## Decision

Se adopta la política `generated official primary + manual curated gaps/enrichments/overrides`, con la siguiente traducción operativa:

- en dominios con rail oficial medido por `generatedCompleteness`, `generated` es la base primaria del catálogo runtime;
- `manual-core` deja de competir como source-of-truth alternativo y pasa a expresarse mediante `gap`, `enrichment`, `override` o `candidate`;
- los dominios sin rail oficial generado siguen siendo `manual-primary` hasta que exista extractor oficial defendible;
- la merge policy ya materializada en `queryService.ts` queda ratificada como baseline contractual: `override` manual gana, `enrichment` se fusiona sobre base `generated` y `candidate` no entra en el hot path.

Esta decisión se considera una adopción `generated-primary-with-manual-overlays`, no un `manual-primary` y tampoco un `hybrid by domain` abierto sin reglas. La única excepción admitida son los dominios sin rail oficial hoy existente.

## Consequences

- La evolución futura del catálogo debe priorizar ampliar o corregir `generated` antes que duplicar entries manuales en dominios oficiales.
- Toda entrada manual que conviva con `generated` debe declarar o recibir `manualOverlay`.
- `catalogConsistency` y `catalogAdoptionDecision` se convierten en gates de gobernanza del source-of-truth.
- Los consumers de hover/completion/signatureHelp pueden tratar `generated` como base contractual en dominios oficiales sin reabrir comparaciones ad hoc por feature.
- `B371-B375` deben construir localización encima de la entry resuelta y su overlay, no duplicando símbolos por idioma.

## Migration plan

1. Mantener `generatedCompleteness` como gate obligatorio del rail oficial.
2. Mantener la clasificación `gap/enrichment/override/candidate` como único carril válido para curación manual en dominios oficiales.
3. Seguir moviendo curación técnica desde competencia silenciosa a overlays explícitos cuando aparezcan nuevos casos.
4. Tratar los dominios `datawindow-events`, `operators`, `pronouns` y `system-globals` como manual-primary mientras no exista rail oficial equivalente.
5. Reabrir decisión solo si aparece regresión real de completitud, `scraperErrorCount > 0` o dominios oficiales donde la calidad generated deje de sostener el serving contractual.

## Rollback plan

Si el rail oficial deja de mantener `missingCount = 0`, si reaparecen scraper errors estructurales o si una batería comparativa demuestra que `generated` degrada serving en un dominio oficial concreto, la política puede degradarse temporalmente a `hybrid-by-domain` reabriendo `B369` con métricas nuevas y sin volver al orden físico implícito del registry.
