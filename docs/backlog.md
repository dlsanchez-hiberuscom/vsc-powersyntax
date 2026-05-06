# Backlog — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/architecture-implementation-map.md`

---

## 0. Meta maestra

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Toda spec, auditoría o mejora nueva debe respetar esta meta. Si una mejora aumenta complejidad pero no mejora velocidad percibida, estabilidad, seguridad semántica, entendimiento real de PowerBuilder o utilidad profesional, no debe priorizarse sobre el core.

---

## 1. Cómo debe usar este backlog una IA

- Ejecutar por orden de prioridad global.
- No abrir ítems si sus dependencias no están cerradas, salvo trabajo preparatorio claro.
- Crear sub-specs solo cuando vaya a implementarse el ítem.
- No cerrar si falta código real, tests/validación suficiente, documentación alineada y actualización de roadmap/current-focus si aplica.
- Si un ítem crece demasiado, dividir en sub-specs; no duplicar ítems padre.
- Registrar deuda nueva en **Backlog derivado**.
- Tratar `plugin_old` como guía, dataset y referencia de patrones probados, no como código a portar por inercia.
- Las dependencias hacia ítems `Done` se consideran ya satisfechas y quedan solo como trazabilidad histórica.
- No sacrificar la meta maestra por features secundarias.
- `generated` debe representar la fuente oficial reproducible; `manual/curated` solo debe contener gaps, enrichments, overrides o candidates con política explícita.
- La localización no debe duplicar símbolos ni traducir nombres reales de PowerBuilder. Debe aplicarse como overlay de documentación en consumers, con fallback al texto oficial.
- Durante la fase de auditorías, no añadir nuevas features salvo que una auditoría detecte un bug, riesgo o gap arquitectónico real.
- Los hallazgos de auditoría que no se corrijan dentro de la auditoría deben ir a **Backlog derivado**, con evidencia, riesgo, plan y validación.
- Los ítems marcados previamente como `Done` por una auditoría pasan a `Open` si una revisión posterior detecta que necesitan verificación, hardening, corrección de criterio o validación real en runtime.

### 1.1. Checklist final para agentes Copilot

Before closing any spec or audit from this document, perform this checklist:

```txt
1. Re-read changed code.
2. Verify no generated/manual ID changed unless the spec explicitly authorizes a breaking change.
3. Verify no full-catalog scans were introduced in hot paths.
4. Verify registry/datasets imports remain stable and not slice-exploded.
5. Verify manual/common.ts contains factories/helpers only.
6. Verify consistency report catches new structural errors.
7. Verify docs/backlog/current-focus/roadmap are aligned.
8. Verify tests are green.
9. Verify done-log is updated only for fully closed specs/audits.
10. If real corpora are required but absent, document honest skip paths and do not fake results.
11. If a finding is not fixed, register it in Backlog derivado with evidence and validation criteria.
12. Do not create new feature specs unless the audit proves a real architectural or correctness need.
```

---

## 2. Estados oficiales

- **Open:** pendiente real de auditoría, corrección, revisión o validación.
- **Partial:** implementación parcial o primer corte operativo, pero faltan criterios de cierre.
- **Blocked:** no puede avanzar por dependencia, entorno o decisión explícita.
- **Done:** código, tests, documentación y validación cerrados; vive en `done-log.md`, no en backlog activo.
- **Superseded:** ítem absorbido por otra spec activa o cerrada; no debe ejecutarse de forma independiente.

Un ítem `Partial` debe incluir, siempre que sea posible:

```md
**Pendiente exacto:**
- ...
```

---

# 3. Backlog actual

## SYMBOL-MODEL-01 — Canonical symbol model and facade contract

- **Estado:** Open.
- **Prioridad:** P1.
- **Origen:** Bloque 13 / `SYMBOL-BACKLOG-01`.
- **Acceptance criteria:** definir contrato `CanonicalSymbol` documental o runtime mínimo, sourceOrigin/confidence/reasonCodes comunes, relación con `buildSymbolKey`, y mapa de consumidores que deben entrar por `SemanticQueryFacade` o owners existentes.
- **Docs:** [docs/symbol-system.md](symbol-system.md), [docs/architecture-implementation-map.md](architecture-implementation-map.md).
- **Tests:** `npm run test:unit`, `npm run test:architecture:rapid`, `npm run test:docs:drift`.

## SYMBOL-PERF-01 — Symbol enrichment cache and payload budgets

- **Estado:** Open.
- **Prioridad:** P1.
- **Origen:** Bloque 13 / `SYMBOL-AUDIT-04`.
- **Acceptance criteria:** proteger completion initial compacto, enrichment lazy en resolve/hover, cache por locale, negative cache para unknown/ambiguous y receipts para reports grandes.
- **Docs:** [docs/symbol-system.md](symbol-system.md), [docs/performance-budget.md](performance-budget.md), [docs/testing.md](testing.md).
- **Tests:** `npm run test:performance:gate`, `npm run test:architecture:rapid`, `npm run test:unit`.

## SYMBOL-PRESENTATION-01 — Symbol ViewModels for LSP consumers

- **Estado:** Open.
- **Prioridad:** P1.
- **Origen:** Bloque 13 / `SYMBOL-PRESENTATION-01`.
- **Acceptance criteria:** consolidar ViewModels para hover/completion/signatureHelp/diagnostics/semanticTokens sin mover resolución semántica a presentation y manteniendo i18n/payload budget.
- **Docs:** [docs/symbol-system.md](symbol-system.md), [docs/architecture-status.md](architecture-status.md).
- **Tests:** `npm run test:unit`, `npm run test:performance:gate` si cambia hot path.

## SYMBOL-CATALOG-01 — Built-in catalog enrichment foundation

- **Estado:** Open.
- **Prioridad:** P1.
- **Origen:** Bloque 13 / `SYMBOL-CATALOG-01` y `SYMBOL-CATALOG-02`.
- **Acceptance criteria:** documentar y, si procede, materializar schema de enrichment para built-ins y user/project symbols sin cambiar IDs/domains/kinds ni inventar firmas.
- **Docs:** [docs/symbol-system.md](symbol-system.md), [docs/localization.md](localization.md), [docs/adr/ADR-0001-system-catalog-source-of-truth.md](adr/ADR-0001-system-catalog-source-of-truth.md).
- **Tests:** `npm run test:unit -- --grep "catalogV2|catalogConsistency|catalogAdoptionDecision|catalogProvenanceAudit|systemCatalogQueryHardening"`, `npm run test:docs:drift`.

## CATALOG-LOCALIZATION-ES-01 — Spanish localization anchors and coverage slices

- **Estado:** Open.
- **Prioridad:** P1.
- **Origen:** Bloque 13 / `CATALOG-LOCALIZATION-01..03`.
- **Acceptance criteria:** aumentar cobertura `es` por dominio usando `targetId`/`targetKey` correctos, `reviewed: true` sólo sin incomplete/invalid/recovered/orphan, y reporte antes/después.
- **Docs:** [docs/localization.md](localization.md), [docs/symbol-system.md](symbol-system.md).
- **Tests:** `npm run test:unit -- --grep "catalogLocalization|catalogConsistency"`, `npm run report:catalog-localization`, `npm run migrate:catalog-localization-target-ids`, `npm run test:docs:drift`.

## SYMBOL-QUALITY-01 — Symbol and i18n regression matrix

- **Estado:** Open.
- **Prioridad:** P1.
- **Origen:** Bloque 13 / `SYMBOL-QUALITY-01`.
- **Acceptance criteria:** fixtures para built-in, user function, event, local/instance/shared/global variables, parameter, inherited, ambiguous, unknown, DataWindow column/property, overlay localized y completion resolve enrichment.
- **Docs:** [docs/symbol-system.md](symbol-system.md), [docs/testing.md](testing.md).
- **Tests:** `npm run test:unit`, `npm test`, `npm run test:performance:gate`, `npm run test:docs:drift` según alcance.

## SYMBOL-I18N-TERMS-01 — Spanish/English terminology catalog

- **Estado:** Open.
- **Prioridad:** P2.
- **Origen:** Bloque 13 / `SYMBOL-I18N-02`.
- **Acceptance criteria:** glosario estable para function, event, variable, parameter, return value, DataWindow, DataStore, DataWindowChild, transaction, ancestor, override, scope, source origin, confidence, deprecated, inferred, ambiguous y unknown.
- **Docs:** [docs/symbol-system.md](symbol-system.md), [docs/localization.md](localization.md).
- **Tests:** `npm run test:unit`, `npm run test:docs:drift` cuando se materialice en presentation.

## SYMBOL-DW-01 — DataWindow symbol enrichment model

- **Estado:** Open.
- **Prioridad:** P2.
- **Origen:** Bloque 13 / `SYMBOL-DW-01`.
- **Acceptance criteria:** definir enrichments de DataWindow control, DataStore variable, DataWindowChild, DataObject literal, column, computed field, property path, buffer y binding dynamic/unknown sobre `DataWindowFastContext`.
- **Docs:** [docs/symbol-system.md](symbol-system.md), [docs/architecture-status.md](architecture-status.md).
- **Tests:** `npm run test:unit -- --grep "dataWindow"`, `npm run test:architecture:rapid`.

## SYMBOL-TOKENS-01 — Semantic tokens taxonomy contract

- **Estado:** Open.
- **Prioridad:** P2.
- **Origen:** Bloque 13 / `SYMBOL-SEMANTIC-TOKENS-01`.
- **Acceptance criteria:** mapping explícito de símbolos PowerBuilder a token types/modifiers VS Code, decisión sobre custom tokens y pruebas de rangos/modifiers.
- **Docs:** [docs/symbol-system.md](symbol-system.md), posible ADR si se añaden token types nuevos.
- **Tests:** `npm run test:unit -- --grep "semanticTokens"`, `npm run test:performance:gate` si cambia hot path.

## CATALOG-LOCALIZATION-DOMAINS-01 — Localization coverage by domain

- **Estado:** Open.
- **Prioridad:** P2.
- **Origen:** Bloque 13 / roadmap de cobertura `es`.
- **Acceptance criteria:** slices de cobertura por `global-functions`, DataWindow core, system object datatypes, enumerated types/values, statements/reserved words y resto generated, con métricas antes/después.
- **Docs:** [docs/localization.md](localization.md), [docs/symbol-system.md](symbol-system.md).
- **Tests:** `npm run report:catalog-localization`, `npm run migrate:catalog-localization-target-ids`, `npm run test:docs:drift`.

## SYMBOL-DOCS-EXAMPLES-01 — Symbol and localization examples

- **Estado:** Open.
- **Prioridad:** P3.
- **Origen:** Bloque 13 / `AUDIT-IMPROVEMENTS-02`.
- **Acceptance criteria:** ejemplos breves de authoring de overlays, interpreting confidence/sourceOrigin y reading symbol payloads sin copiar catálogos generados completos.
- **Docs:** [docs/symbol-system.md](symbol-system.md), [docs/localization.md](localization.md), [docs/ai-context/powerbuilder-plugin-context.md](ai-context/powerbuilder-plugin-context.md).
- **Tests:** `npm run test:docs:drift`.

## SYMBOL-FRAMEWORKS-01 — Framework-specific symbol enrichments

- **Estado:** Open.
- **Prioridad:** P3.
- **Origen:** Bloque 13 / `SYMBOL-BACKLOG-01`.
- **Acceptance criteria:** enrichments PFC/STD sólo advisory, nunca autoridad sobre símbolo real; deben declarar source, confidence, tests y fallback.
- **Docs:** [docs/symbol-system.md](symbol-system.md), [docs/architecture-status.md](architecture-status.md).
- **Tests:** `npm run test:unit`, corpus/smoke gated si usa fixtures locales.

---

# 4. Current execution focus recomendado

## Estado actual

```txt
SYMBOL-MODEL-01 — Canonical symbol model and facade contract
```

## Regla de promoción

- No abrir una cadena nueva sin promoción explícita en backlog/current-focus/roadmap/specs.
- Mantener verdes `docs:drift`, `test:performance:gate` y la matriz transversal ya cerrada antes de mover foco a otra fase.
- `AUDIT-DOC` acompaña el cierre, pero no sustituye el orden principal.
- Un ítem `Ready for closure` no pasa a `Done` sin validación ejecutada y entrada de `done-log.md`.

---

# 5. No abrir todavía salvo necesidad real

- Nuevas features visuales pesadas sin guardrails claros y preferencia por Tree View frente a Webview cuando baste.
- Nuevos reports grandes sin caps/paginación/reason codes explícitos en surfaces agent-ready.
- Nuevos carriles ORCA/PBAutoBuild sin pasar por support matrix, troubleshooting y health.
- Automatización write-enabled avanzada sin safe-edit-plan, impact-analysis, receipts y rollback claro.
- Nuevos dominios de catálogo que reabran `ADR-0001` sin regresión objetiva.
- Nuevos parsers DataWindow que traten `.srd` como PowerScript normal.
- Nuevos agentes/skills/prompts que dupliquen reglas ya existentes en `AGENTS.md`, `.github/copilot-instructions.md` o `docs/ai-orchestration.md`.

---

# 6. Criterio de salida de la fase de auditorías

La fase de auditorías podrá considerarse cerrada cuando:

```txt
1. No queden auditorías activas P0/P1 sin plan, spec o decisión explícita.
2. No queden Critical/High sin plan.
3. El VSIX instalado active correctamente.
4. API/tools/commands estén alineados.
5. Hot paths respeten performance budget.
6. Core semántico PowerBuilder no tenga bugs críticos conocidos.
7. Project routing .pbproj/PBL y ancestor resolution funcionen en workspace real.
8. DataWindow mantenga frontera clara.
9. Catálogo cumpla ADR-0001 y B335 no reporte métricas falsas.
10. Reports/analyzers no generen ruido masivo ni payloads excesivos.
11. Docs/backlog/current-focus/done-log estén alineados.
```

Las auditorías históricas `AUDIT-01..AUDIT-08` quedan como trazabilidad histórica si viven en `done-log.md` o specs cerradas. No deben bloquear la fase activa salvo que una revisión posterior las reabra con evidencia.
