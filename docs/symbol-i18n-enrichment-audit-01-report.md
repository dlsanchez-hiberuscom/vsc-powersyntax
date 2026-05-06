# SYMBOL-I18N-ENRICHMENT-AUDIT-01 Report

## 1. Evidencia revisada

- Documentación owner revisada:
  - `docs/backlog.md`
  - `docs/current-focus.md`
  - `docs/roadmap.md`
  - `docs/done-log.md`
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
  - `docs/symbol-system.md`
  - `docs/localization.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
  - `docs/adr/ADR-0001-system-catalog-source-of-truth.md`
- Código real auditado:
  - `src/server/knowledge/system/SystemCatalog.ts`
  - `src/server/knowledge/system/registry/registry.ts`
  - `src/server/knowledge/system/consistency.ts`
  - `src/server/knowledge/system/localization/documentationService.ts`
  - `src/server/knowledge/system/localization/localizationResolver.ts`
  - `src/server/features/completion.ts`
  - `src/server/features/hover.ts`
  - `src/server/features/signatureHelp.ts`
  - `src/server/features/semanticTokens.ts`
  - `src/server/handlers/featureHandlers.ts`
  - `scripts/generate_catalog_localization_report.cjs`
  - `scripts/migrate_catalog_localization_target_ids.cjs`
  - `package.json`

## 2. Estado factual

- `docs/symbol-system.md` es el owner canónico del sistema de símbolos.
- `docs/localization.md` es el owner canónico del workflow de overlays localizados del catálogo.
- `docs/performance-budget.md` mantiene los budgets y guardrails del hot path.
- `docs/testing.md` mantiene la matriz canónica de comandos y lanes reales.
- `ADR-0001` fija `generated official primary + manual curated overlays` como policy contractual del catálogo.
- `SystemCatalog` actúa como fachada delgada del catálogo del sistema sobre índices ya materializados; no crea símbolos localizados ni una fuente paralela.
- `registry.ts` clasifica entradas `manual-core` solapadas como `enrichment` o `gap` mediante `manualOverlay`, sin cambiar identidad de `generated`.
- `documentationService.ts` aplica overlays localizados solo a texto visible (`summary`, `documentation`, `usageNotes`, `obsoleteMessage`, `returnDocumentation`, `parameterDocumentation`) y cae a la documentación base cuando no hay overlay o el locale es `en`.
- `completion.ts` publica una lista inicial ligera y difiere el detalle/documentación a `resolveCompletionItem(...)`.
- `featureHandlers.ts` y la serving layer ya incluyen `locale` en el contexto y en las claves de caché interactivas.
- `semanticTokens.ts` clasifica tokens por identidad y catálogo; no consume texto localizado.

## 3. Cadena identity -> generated -> manual -> localization -> presentation -> LSP payload

Cadena verificada en el repo actual:

```text
symbol identity
  -> buildSymbolKey / SystemCatalog entry id
  -> generated base entry
  -> manualOverlay (gap/enrichment/override/candidate)
  -> localization overlay por targetId/targetKey
  -> documentationService / presentation formatter por locale
  -> payload LSP (hover/completion resolve/signatureHelp)
```

Lectura factual:

- La identidad semántica no cambia por locale.
- `generated` sigue siendo la base reproducible y oficial.
- `manual-core` funciona como overlay curado gobernado, no como catálogo paralelo de identidad.
- `localization` resuelve overlays documentales por `targetId` o `targetKey` sobre la entry canónica.
- El texto localizado se proyecta en consumers visibles; no se publican símbolos duplicados por idioma.

## 4. Hallazgos

### Critical/High

- No detectado todavía en la auditoría estática previa a validación runtime.

### Medium

- Existe drift documental/operativo entre backlog y foco activo: `docs/backlog.md` reabre `SYMBOL-I18N-ENRICHMENT-AUDIT-01`, mientras `docs/current-focus.md` sigue promoviendo `SYMBOL-MODEL-01` y `docs/done-log.md` mantiene cerrado el bloque macro anterior. Este estado debe reconciliarse al cerrar la auditoría.
- La cobertura `es` sigue siendo deliberadamente mínima: `overlayCount=3`, `targetKeyCount=3`, `reviewedCount=3`, `targetIdCount=0`, toda ella en `global-functions` (`3/285`, ratio `0.0105`). El runtime está sano, pero el roadmap de dominios sigue abierto y justifica los slices del Bloque 2.
- El repositorio documenta localización presentation-only y overlays curados, pero aún no tiene un artefacto owner específico para esta auditoría; este reporte cubre ese hueco.

### Low

- `registry.ts` conserva wording histórico (`until B369 defines final adoption policy`) en el reason de algunos overlays manuales; no rompe runtime, pero conviene revisar su vigencia dentro de la cadena documental actual.

## 5. Gaps de documentación

- Falta alinear `docs/current-focus.md` con la reapertura explícita de `SYMBOL-I18N-ENRICHMENT-AUDIT-01` durante este bloque.
- Falta registrar en `docs/done-log.md` el cierre real de esta auditoría solo si las validaciones obligatorias terminan verdes o justificadas.
- Falta enlazar este reporte desde backlog/done-log al cerrar el bloque para dejar evidencia canónica del audit trail.

## 6. Gaps de código/arquitectura

- No se detecta todavía un gap crítico de runtime en la separación identity/generated/manual/localization/presentation.
- La capa de enrichment manual-curated de entradas generated sigue siendo una policy/documentation surface más que un contrato formalizado de schema y authoring; eso queda como follow-up del Bloque 2.

## 7. Gaps de performance

- No se detecta en la lectura estática un full scan por request interactiva para localización/enrichment.
- La validación runtime confirmó budgets verdes en `hover`, `completion`, `signatureHelp`, `definition`, `documentSymbols` y `semanticTokens`.

## 8. Gaps de testing

- No se detectan gaps inmediatos de testing para el cierre de la auditoría; los carriles focales y transversales ejecutados quedaron verdes.

## 9. Validaciones ejecutadas

- `npm run test:unit -- --grep "catalogLocalization|catalogConsistency|documentationService|completion|hover|signatureHelp"`
  - `114 passing (940ms)`.
- `npm run report:catalog-localization`
  - `locales: es`.
  - `incompleteOverlays: 0`.
  - `invalidParameterTargets: 0`.
  - `recoveredTargetIds: 0`.
  - `orphanOverlays: 0`.
- `npm run migrate:catalog-localization-target-ids`
  - `No hay targetIds recuperados por targetKey. No hace falta migracion.`
- `npm run test:docs:drift`
  - `passed`.
  - `currentFocusId: SYMBOL-I18N-ENRICHMENT-AUDIT-01` durante el cierre de la auditoría.
- `npm run test:architecture:rapid`
  - smoke `3 passing`.
  - performance `7 passing`.
  - gate passed.
- `npm run test:performance:gate`
  - `4 passing`.
  - budgets interactivos y de workspace masivo dentro de objetivo.

## 10. Validaciones no ejecutadas y motivo

- Ninguna dentro del carril obligatorio de esta spec.

## 11. Backlog derivado recomendado

- La cola derivada ya existe en `docs/backlog.md` para `SYMBOL-MODEL-01`, `SYMBOL-GENERATED-ENRICHMENT-LAYER-01`, `SYMBOL-GENERATED-ENRICHMENT-SCHEMA-01`, `SYMBOL-GENERATED-ENRICHMENT-AUTHORING-01`, `SYMBOL-CATALOG-BUILTINS-ENRICH-P1`, `SYMBOL-CATALOG-DW-ENRICH-P1`, `SYMBOL-CATALOG-ENUMS-ENRICH-P2`, `SYMBOL-CATALOG-DATATYPES-ENRICH-P2`, `SYMBOL-CATALOG-STATEMENTS-ENRICH-P2`, `CATALOG-LOCALIZATION-ES-01`, `CATALOG-LOCALIZATION-DOMAINS-01`, `SYMBOL-I18N-TERMS-01`, `SYMBOL-PERF-01`, `SYMBOL-PRESENTATION-01`, `SYMBOL-QUALITY-01`, `SYMBOL-DW-01`, `SYMBOL-TOKENS-01`, `SYMBOL-DOCS-EXAMPLES-01` y `SYMBOL-FRAMEWORKS-01`.
- La validación runtime no abrió blockers P1 adicionales; la cola actual basta para la continuación ordenada del Bloque 2.

## 12. Siguiente slice recomendado

- El siguiente slice recomendado es `SYMBOL-MODEL-01`, seguido por `SYMBOL-GENERATED-ENRICHMENT-LAYER-01` y `SYMBOL-GENERATED-ENRICHMENT-SCHEMA-01`.