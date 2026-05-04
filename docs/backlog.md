# Backlog — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

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

- **Open:** sin slice activa de cierre.
- **Partial:** implementación parcial o primer corte operativo, pero faltan criterios de cierre.
- **Ready for closure:** código y tests básicos existen; falta revisión final, documentación o validación ampliada.
- **Blocked:** no puede avanzar por dependencia, entorno o decisión explícita.
- **Done:** código, tests, documentación y validación cerrados; vive en `done-log.md`, no en backlog activo.
- **Superseded:** ítem absorbido por otra spec activa o cerrada; no debe ejecutarse de forma independiente.

Un ítem `Partial` debe incluir, siempre que sea posible:

```md
**Pendiente exacto:**
- ...
```

---

# 3. L8 — Core Hardening / Bug Hunting / Release Stabilization

## 3.1. Principio general

Durante esta fase, la prioridad no es añadir nuevas capacidades, sino reforzar el core existente:

```txt
- activación real desde VSIX;
- estabilidad del Language Server;
- coherencia API/tools/commands;
- rendimiento en hot paths;
- precisión semántica PowerBuilder;
- fiabilidad DataWindow;
- consistencia generated/manual/localization;
- calidad de reports/analyzers;
- documentación y backlog sin drift;
- utilidad real para agentes IA sin inflar tokens.
```

Regla de ejecución:

```txt
No crear nuevas specs funcionales salvo que la auditoría detecte un bug, riesgo o gap arquitectónico real.
Los hallazgos deben clasificarse como Critical / High / Medium / Low.
Los bugs pequeños y seguros pueden corregirse dentro de la auditoría.
Los cambios grandes deben ir a fix queue o nueva spec justificada.
```

---

## AUDIT-01 — Installed VSIX, activation and runtime startup hardening

- **Estado:** Open
- **Track:** hardening / packaging / activation
- **Prioridad:** Crítica
- **Objetivo:** validar que el plugin instalado desde VSIX real activa correctamente, arranca el Language Server, registra comandos y no falla por dependencias, packaging, rutas o activation events.
- **Cierre:** VSIX real instalable, Extension Host sin errores críticos, Language Server activo, comandos principales visibles y `workspace-check` / `object-check` funcionando bajo demanda.
- **Validación esperada:** `npm run build:test`, `npm run bundle`, `npm run package:vsix`, `npm run verify:vsix-contents`, instalación local del VSIX y revisión de logs.
- **Docs afectadas:** `docs/testing.md`, `docs/developer-workflows.md`, `docs/performance-budget.md`, `README.md`, `docs/current-focus.md`.

---

## AUDIT-02 — Public API, AI tools and command consistency audit

- **Estado:** Open
- **Track:** hardening / public API / AI tooling
- **Prioridad:** Alta
- **Objetivo:** comprobar y corregir la coherencia entre API pública, read-only tool bridge, comandos UI, schemas, command registration, mappings para IA, documentación, duplicidades y posibles fusiones/refactorizaciones internas.
- **Cierre:** mapa funcional alineado `functional tool → API method → command ID → schema → implementation → docs/tests`, sin tools huérfanas, comandos rotos, duplicidades problemáticas ni payloads descontrolados.
- **Validación esperada:** tests de `publicApi`, `toolBridge`, `commandRegistration`, `workspaceCheck`, `objectCheck`, `currentObjectContext`, `safeEditPlan`, `impactAnalysis`, `dependencyGraph`, `dataWindowSqlLineage`.
- **Docs afectadas:** `docs/developer-workflows.md`, `docs/architecture.md`, `docs/ai-orchestrator.md`, `docs/ai-agents-catalog.md`, `docs/ai-orchestration/plugin-tools.md` si existe.

---

## AUDIT-03 — Hot paths, activation and performance budget audit

- **Estado:** Open
- **Track:** hardening / performance / hot paths
- **Prioridad:** Crítica
- **Objetivo:** detectar operaciones caras o no acotadas en activation, indexing, hover, completion, signatureHelp, diagnostics, semanticTokens, workspace-check, object-check, reports y DataWindow resolvers.
- **Cierre:** sin full scans en hot paths interactivos, consumers sobre índices/facets/caches acotados, tools/reportes con límites/truncado y activation ligera.
- **Validación esperada:** `npm run test:architecture:metrics`, `npm run test:architecture:rapid`, `npm run test:performance:gate`.
- **Docs afectadas:** `docs/performance-budget.md`, `docs/architecture.md`, `docs/testing.md`.

---

## AUDIT-04 — PowerBuilder semantic core correctness audit

- **Estado:** Open
- **Track:** hardening / semantics / PowerBuilder core
- **Prioridad:** Alta
- **Objetivo:** validar que el core semántico modela correctamente símbolos PowerBuilder reales: objetos, funciones, eventos, scopes, prototypes, implementations, inheritance, overrides, dynamic calls, external functions, sourceOrigin, queryTrace y consumers.
- **Cierre:** sin regresiones críticas conocidas en `query-symbols`, `object-check`, `current-object-context`, `safe-edit-plan` y `explain-semantic-query`; `sourceOrigin/confidence/evidence/reasonCodes` preservados donde sean contractuales.
- **Validación esperada:** tests de `KnowledgeBase`, `queryService`, `symbols`, `inheritance`, `override`, `scope`, `currentObjectContext`, `objectCheck`, `dependencyGraph`, `impactAnalysis`, `safeEditPlan`, `queryTrace`, `invocationRisk`, `queryScopePolicy`.
- **Docs afectadas:** `docs/architecture.md`, `docs/developer-workflows.md`, `docs/testing.md`, `docs/performance-budget.md`.

---

## AUDIT-05 — DataWindow reliability and sublanguage boundary audit

- **Estado:** Open
- **Track:** hardening / DataWindow / sublanguage
- **Prioridad:** Alta
- **Objetivo:** validar que DataWindow se mantiene como sublenguaje propio y que bindings, property paths, `Describe/Modify`, SQL lineage, DDDW, child DataWindows y reports degradan honestamente.
- **Cierre:** DataWindow no se parsea como PowerScript normal, enum values no se duplican, paths dinámicos degradan honestamente y no hay falsos positivos masivos en `.srd`.
- **Validación esperada:** tests de `datawindow`, `Describe`, `Modify`, `property`, `sql-lineage`, `DDDW`, `child`, `report`.
- **Docs afectadas:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/rules-catalog.md`, `docs/testing.md`, `docs/architecture.md`.

---

## AUDIT-06 — Catalog generated/manual/localization governance audit

- **Estado:** Open
- **Track:** hardening / catalog governance
- **Prioridad:** Alta
- **Objetivo:** validar cumplimiento de `ADR-0001`, sin reabrir la decisión `generated-primary-with-manual-overlays`.
- **Cierre:** `generated` sigue siendo fuente oficial reproducible, `manual` solo gaps/enrichments/overrides/candidates, `localization` solo overlay documental y sin full-catalog scans en consumers interactivos.
- **Validación esperada:** tests de `catalog`, `generated`, `manual`, `overlay`, `override`, `enrichment`, `gap`, `consistency`, `registry`, `datasets`, `merge`, `duplicates`, `localization`, `provenance`.
- **Docs afectadas:** `docs/architecture.md`, `docs/rules-catalog.md`, `docs/testing.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.

---

## AUDIT-07 — Reports and analyzers quality/noise audit

- **Estado:** Open
- **Track:** hardening / analyzers / reports
- **Prioridad:** Media-Alta
- **Objetivo:** validar que analyzers recientes aportan señales útiles, con reason codes, confidence, redaction y sin ruido/falsos positivos masivos ni payloads excesivos.
- **Cierre:** findings accionables, con severity/category/reason/evidence cuando aplique, sin endpoints/secrets expuestos, sin contenido web externo y sin degradar hot paths.
- **Validación esperada:** tests de `lifecycle`, `external`, `PBNI`, `PBX`, `HTTPClient`, `REST`, `JSON`, `WebBrowser`, `WebView2`, `technicalDebt`, `codeMetrics`.
- **Docs afectadas:** `docs/rules-catalog.md`, `docs/developer-workflows.md`, `docs/testing.md`.

---

## AUDIT-08 — Documentation, backlog and AI readiness drift audit

- **Estado:** Open
- **Track:** hardening / docs governance / AI readiness
- **Prioridad:** Alta
- **Objetivo:** detectar drift entre backlog, done-log, specs, current-focus, roadmap, docs técnicas, public API docs y guía de agentes IA.
- **Cierre:** backlog activo solo contiene trabajo realmente pendiente, done-log refleja specs cerradas, current-focus está actualizado, docs no duplican decisiones largas y guías IA usan progressive disclosure.
- **Validación esperada:** tests documentales si existen; si no existen, informe manual con fix queue y propuesta de automatización posterior.
- **Docs afectadas:** `docs/backlog.md`, `docs/done-log.md`, `docs/current-focus.md`, `docs/spec-driven-development.md`, `docs/ai-orchestrator.md`, `docs/ai-agents-catalog.md`, `docs/developer-workflows.md`, `README.md`.

---

# 4. Current execution focus recomendado

## Fase activa — Core Hardening Audits



## Siguiente fase



---

# 5. No abrir todavía salvo necesidad real

- Nuevas features visuales pesadas sin guardrails claros y preferencia por Tree View frente a Webview cuando baste.
- Nuevos reports grandes sin caps/paginación/reason codes explícitos en surfaces agent-ready.
- Nuevos carriles ORCA/PBAutoBuild sin pasar por support matrix, troubleshooting y health.
- Automatización write-enabled avanzada sin safe-edit-plan, impact-analysis, receipts y rollback claro.
- Nuevos dominios de catálogo que reabran `ADR-0001` sin regresión objetiva.
- Nuevos parsers DataWindow que traten `.srd` como PowerScript normal.

---

# 6. Backlog derivado

Durante las auditorías, registrar aquí únicamente hallazgos reales que no se corrijan dentro de la propia auditoría.

Formato recomendado:

```md
## AUDIT-XX-DERIVED — <título>
- **Estado:** Open
- **Track:** hardening / ...
- **Prioridad:** Critical | High | Medium | Low
- **Origen:** AUDIT-XX
- **Tipo:** bugfix | refactor | consolidation | test-hardening | performance-hardening | docs-alignment | governance
- **Objetivo:**
- **Razón técnica:**
- **Evidencia encontrada:**
- **Alcance:**
- **No es una nueva feature porque:**
- **Compatibilidad:**
- **Riesgos:**
- **Plan recomendado:**
- **Criterios de cierre verificables:**
- **Validación esperada:**
- **Docs afectadas:**
```

## 6.1. Reglas permanentes del backlog derivado

- Mantener DataWindow como sublenguaje propio y evitar cualquier parser DataWindow como PowerScript normal.
- Mantener ORCA fuera del hot path y detrás de policy/feature flags cuando implique write-enabled o packaging.
- Mantener la política de localización como overlay de documentación, nunca como duplicación de entries por idioma.
- Mantener `generated` como source-of-truth oficial según `ADR-0001`.
- Mantener `manual` solo como gaps/enrichments/overrides/candidates.
- Mantener `candidate` fuera del hot path.
- Mantener framework knowledge packs por debajo del source real del workspace.
- Mantener tools IA con payloads acotados, `reasonCodes`, `confidence`, `available/reason` y truncado honesto cuando aplique.

---

# 7. Criterio de salida de la fase de auditorías

La fase de auditorías podrá considerarse cerrada cuando:

```txt
1. AUDIT-01..AUDIT-08 estén Done o explícitamente cerradas con no-action decisions.
2. No queden Critical/High sin plan.
3. El VSIX instalado active correctamente.
4. API/tools/commands estén alineados.
5. Hot paths respeten performance budget.
6. Core semántico PowerBuilder no tenga bugs críticos conocidos.
7. DataWindow mantenga frontera clara.
8. Catálogo cumpla ADR-0001.
9. Reports/analyzers no generen ruido masivo ni payloads excesivos.
10. Docs/backlog/current-focus/done-log estén alineados.
```
