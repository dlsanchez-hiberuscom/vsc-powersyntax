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

- **Estado:** Done
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

- **Estado:** Done
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

## AUDIT-02-DERIVED-001 — Eliminar comando huérfano powerbuilder.checkObject

- **Estado:** Done
- **Track:** hardening / public API / AI tooling
- **Prioridad:** Low
- **Origen:** AUDIT-02
- **Tipo:** consolidation
- **Objetivo:** Eliminar el comando redundante `powerbuilder.checkObject` que duplicaba la funcionalidad de `powerbuilder.checkCurrentObject`.
- **Razón técnica:** `powerbuilder.checkObject` estaba registrado en `commandRegistration.ts` apuntando a la misma función `runObjectCheck` que `powerbuilder.checkCurrentObject`. Sin embargo, la definición de la tool de IA `object-check` en `publicApi.ts` utilizaba explícitamente `powerbuilder.checkCurrentObject`, por lo que `powerbuilder.checkObject` se convirtió en un alias inútil (orphan registration).
- **Evidencia encontrada:** Registro duplicado en `src/client/commandRegistration.ts`.
- **Alcance:** Eliminar el registro del comando huérfano en `commandRegistration.ts` y limpiar el test de smoke en `test/smoke/extension.test.ts`.
- **No es una nueva feature porque:** Se trata de una consolidación para limpiar aliases redundantes en la API de comandos.
- **Compatibilidad:** Ninguna, pues ningún cliente UI ni IA utilizaba el comando huérfano.
- **Riesgos:** Ninguno.
- **Plan recomendado:** Ejecutado.
- **Criterios de cierre verificables:** `powerbuilder.checkObject` no aparece en `commandRegistration.ts` ni en los tests.
- **Validación esperada:** `npm run test` exitoso sin comando huérfano.
- **Docs afectadas:** Ninguna.

## AUDIT-02-DERIVED-002 — Consolidar namespace de comandos vscPowerSyntax hacia powerbuilder

- **Estado:** Open
- **Track:** hardening / architecture hygiene
- **Prioridad:** Medium
- **Origen:** AUDIT-02
- **Tipo:** consolidation
- **Objetivo:** Consolidar todos los comandos de extensión bajo un único namespace `powerbuilder.*`, eliminando el nivel de alias redundante actual donde se usan tanto `powerbuilder.*` como `vscPowerSyntax.*`.
- **Razón técnica:** Existe una divergencia en el registro de comandos (en `package.json` y `commandRegistration.ts`) donde la UI utiliza `vscPowerSyntax.*` (ej. `vscPowerSyntax.openCurrentObjectCheck`) mientras que el core, language server y API IA utilizan `powerbuilder.*` (ej. `powerbuilder.checkCurrentObject`). Esta duplicidad y alias innecesarios aumentan la complejidad y el mantenimiento del bridge entre UI, LSP y Tools IA.
- **Evidencia encontrada:** Múltiples comandos registrados con prefijo `vscPowerSyntax.` en `src/client/commandRegistration.ts` y en `package.json`, mientras la API usa internamente `powerbuilder.`.
- **Alcance:** Renombrar gradualmente los comandos en `package.json` y los registradores del cliente para usar exclusivamente el namespace `powerbuilder.*`. Actualizar tests y referencias de documentación.
- **No es una nueva feature porque:** Se trata de una consolidación arquitectónica para unificar nomenclaturas y simplificar la API pública.
- **Compatibilidad:** Romperá temporalmente atajos de teclado o bindings de usuario que dependan del ID exacto `vscPowerSyntax.*`. Requiere mención en release notes.
- **Riesgos:** Riesgo bajo, principalmente atado a UI state y keybindings locales.
- **Plan recomendado:** (1) Identificar todos los comandos `vscPowerSyntax.*`. (2) Renombrarlos en `package.json` a `powerbuilder.*`. (3) Actualizar `commandRegistration.ts` y handlers. (4) Adaptar la test suite de smoke.
- **Criterios de cierre verificables:** Todos los comandos de usuario, UI y AI utilizan únicamente el namespace `powerbuilder.*`.
- **Validación esperada:** `npm run test:smoke` ejecutado exitosamente con los nuevos nombres.
- **Docs afectadas:** `docs/developer-workflows.md`, `README.md`.

## AUDIT-04-DERIVED-001 — Unificar VARIABLE_SCOPE_PRIORITY entre semanticQueryService e InheritanceGraph

- **Estado:** Done
- **Track:** hardening / semantics / scope resolution
- **Prioridad:** Critical
- **Origen:** AUDIT-04
- **Tipo:** bugfix
- **Objetivo:** Extraer una única tabla canonical de prioridad de scopes de variables y corregirla según semántica PowerBuilder real.
- **Razón técnica:** `semanticQueryService.ts` define `Local=0, Compartida=1, Global=2, Instancia=3, Argumento=4`. `InheritanceGraph.ts` define `Compartida=0, Global=1, Instancia=2, Argumento=3, Local=4`. Ambas son inconsistentes entre sí y ninguna refleja PowerBuilder real (`Local=0, Argumento=0, Compartida=1, Global=2, Instancia=3`).
- **Evidencia encontrada:** `semanticQueryService.ts:60-66` vs `InheritanceGraph.ts:16-22`. Resolución de variables con mismo nombre pero distinto scope puede producir winner diferente entre hover (usa queryService) y currentObjectContext/completion (usa InheritanceGraph.getMemberClosure).
- **Alcance:** Nuevo módulo `knowledge/scopePriority.ts` con tabla única. Actualizar ambos archivos para importar desde allí.
- **No es una nueva feature porque:** Corrige un bug de resolución semántica incorrecta.
- **Compatibilidad:** Puede cambiar el winner de resolución en edge cases donde coexisten variables Local e Instancia con el mismo nombre.
- **Riesgos:** Regresión en tests que asuman el orden incorrecto actual.
- **Plan recomendado:** (1) Crear `scopePriority.ts` con orden PB correcto. (2) Sustituir tablas locales. (3) Añadir test negativo cruzado. (4) Ejecutar suite completa.
- **Criterios de cierre verificables:** Una sola tabla de prioridad usada por ambos módulos. Orden correcto (Appeon): `Local=0, Argumento=0, Compartida=1, Global=2, Instancia=3`. Test negativo que valide el orden.
- **Validación esperada:** `npm run test:unit`, tests de `semanticQueryService`, `inheritanceGraph`, `currentObjectContext`, `completion`, `hover`.
- **Docs afectadas:** `docs/architecture.md` (si se documenta el contrato de scope priority).

---

## AUDIT-04-DERIVED-002 — Consolidar getDocumentEntities duplicado entre semanticQueryService y queryContext

- **Estado:** Open
- **Track:** hardening / architecture hygiene
- **Prioridad:** High
- **Origen:** AUDIT-04
- **Tipo:** consolidation
- **Objetivo:** Eliminar la duplicación de `getDocumentEntities` entre `semanticQueryService.ts` y `queryContext.ts`.
- **Razón técnica:** Dos implementaciones con la misma lógica de caching vía `HotContextCache`. La versión de `queryContext.ts` no registra pasos de trace, la de `semanticQueryService.ts` sí. Viola constitución §3 (no duplicar lógica semántica entre features).
- **Evidencia encontrada:** `semanticQueryService.ts:181-200` y `queryContext.ts:40-57`.
- **Alcance:** Extraer a helper compartido o reutilizar la versión de `semanticQueryService.ts` en `queryContext.ts`.
- **No es una nueva feature porque:** Consolida lógica duplicada existente.
- **Compatibilidad:** Sin cambios funcionales.
- **Riesgos:** Bajo — ambas implementaciones son funcionalmente idénticas salvo trace.
- **Plan recomendado:** (1) Exportar `getDocumentEntities` desde `semanticQueryService.ts`. (2) Importar en `queryContext.ts`. (3) Eliminar copia local.
- **Criterios de cierre verificables:** Solo una implementación de `getDocumentEntities` en el codebase. Trace steps registrados en ambos flujos.
- **Validación esperada:** `npm run test:unit`, tests de `queryContext`, `semanticQueryService`, `hover`, `definition`.
- **Docs afectadas:** Ninguna directa.

---

## AUDIT-04-DERIVED-003 — Optimizar InheritanceGraph.getMemberClosure para evitar getAllEntities()

- **Estado:** Open
- **Track:** hardening / performance
- **Prioridad:** High
- **Origen:** AUDIT-04
- **Tipo:** performance-hardening
- **Objetivo:** Eliminar el escaneo O(N) de todas las entidades del workspace en `getMemberClosure` y `getDirectDescendants`.
- **Razón técnica:** `getMemberClosure` llama a `kb.getAllEntities()` que itera sobre todos los global symbols del workspace. Se invoca desde hover, completion, currentObjectContext e impactAnalysis. Con workspaces de 500+ archivos PB, puede exceder el budget de 50ms.
- **Evidencia encontrada:** `InheritanceGraph.ts:196` y `InheritanceGraph.ts:272`.
- **Alcance:** Usar `kb.getEntitiesByUri()` por cada URI de la jerarquía, o añadir un índice `entitiesByContainerName` en KnowledgeBase.
- **No es una nueva feature porque:** Optimiza un hot path existente.
- **Compatibilidad:** Sin cambios funcionales, solo rendimiento.
- **Riesgos:** Medio — el índice adicional consume memoria; validar con test de performance.
- **Plan recomendado:** (1) Evaluar si `entitiesByContainerName` Map es viable. (2) Si no, iterar `entitiesByUri` solo para URIs en la jerarquía conocida. (3) Benchmark con suite de performance.
- **Criterios de cierre verificables:** `getMemberClosure` no llama a `getAllEntities()`. Performance test no regresa.
- **Validación esperada:** `npm run test:unit`, `npm run test:performance`, tests de `inheritanceGraph`, `currentObjectContext`.
- **Docs afectadas:** `docs/performance-budget.md`.

---

## AUDIT-04-DERIVED-004 — Corregir o documentar parent qualifier resolution

- **Estado:** Done
- **Track:** hardening / semantics / PowerBuilder correctness
- **Prioridad:** Medium
- **Origen:** AUDIT-04
- **Tipo:** bugfix
- **Objetivo:** Resolver la confusión semántica donde `parent` se resuelve como `containerName` (owner lógico del método) en vez del visual container del control como define PowerBuilder.
- **Razón técnica:** En PowerBuilder, `parent` es el **visual container** (la ventana que contiene un control). `containerName` en Entity se usa para el owner lógico (e.g., `w_main` como containerName de `of_setdata`).
- **Evidencia encontrada:** `semanticQueryService.ts:807` y `semanticQueryService.ts:1032-1033`.
- **Alcance:** Implementada resolución de `Parent` hacia `containerName`.
- **No es una nueva feature porque:** Corrige una resolución semántica incorrecta.
- **Compatibilidad:** Alineado con el comportamiento esperado para controles.
- **Riesgos:** Ninguno.
- **Plan recomendado:** Ejecutado.
- **Criterios de cierre verificables:** Comment explícito en código + tests unitarios de resolución `Parent.`.
- **Validación esperada:** Tests de `semanticQueryService`.
- **Docs afectadas:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.

---

## AUDIT-04-DERIVED-005 — Aplicar sourceOrigin filtering en todos los consumers

- **Estado:** Open
- **Track:** hardening / contract enforcement
- **Prioridad:** Medium
- **Origen:** AUDIT-04
- **Tipo:** governance
- **Objetivo:** Aplicar `isSourceOriginAllowedForConsumer` en todos los consumers semánticos, no solo en `referenceSourcePool`.
- **Razón técnica:** `queryScopePolicy` declara `allowStaging: false, allowGenerated: false` para la mayoría de consumers, pero solo `referenceSourcePool` aplica el filtro. Hover, definition, completion y signatureHelp muestran entidades de `orca-staging` o `generated` sin restricción.
- **Evidencia encontrada:** `isSourceOriginAllowedForConsumer` solo se llama desde `referenceSourcePool.ts:82`.
- **Alcance:** Aplicar el filtro en `queryContext.ts` o en `resolveTargetEntityDetailed` como post-filtro.
- **No es una nueva feature porque:** Hace cumplir un contrato declarado existente.
- **Compatibilidad:** Puede ocultar entidades en hover/definition que antes se mostraban.
- **Riesgos:** Medio — puede afectar UX si el usuario trabaja con sources staging/generated.
- **Plan recomendado:** (1) Añadir filtro post-resolution en `queryContext`. (2) Respetar `allowStaging`/`allowGenerated`/`allowExternal`. (3) Test que valide filtrado.
- **Criterios de cierre verificables:** Entidades con `sourceOrigin: 'orca-staging'` no aparecen en hover cuando `allowStaging: false`. Test unitario que lo valide.
- **Validación esperada:** Tests de `queryScopePolicy`, `queryContext`, `hover`, `definition`, `completion`.
- **Docs afectadas:** `docs/architecture.md`.

---

## AUDIT-04-DERIVED-006 — Instrumentar budgetMs con observabilidad en queryTrace

- **Estado:** Open
- **Track:** hardening / performance / observability
- **Prioridad:** Medium
- **Origen:** AUDIT-04
- **Tipo:** performance-hardening
- **Objetivo:** Hacer que `budgetMs` sea observable, emitiendo un trace step `budget:exceeded` cuando la resolución supera el budget declarado del consumer.
- **Razón técnica:** `budgetMs` se declara en `queryScopePolicy` para cada consumer (hover=50ms, definition=50ms, references=150ms, etc.) pero nunca se mide ni se aplica en runtime. `withTrace` ya captura timestamps que permiten calcular duración.
- **Evidencia encontrada:** `budgetMs` en `queryScopePolicy.ts` sin ninguna referencia de enforcement en el codebase fuera de tests de `catalogCorpusValidation`.
- **Alcance:** Añadir medición de duración post-`withTrace` y emitir trace step si excede. No bloquear, solo observar.
- **No es una nueva feature porque:** Instrumenta un contrato de performance existente.
- **Compatibilidad:** Sin cambios funcionales; solo observabilidad.
- **Riesgos:** Bajo — solo añade un trace step condicional.
- **Plan recomendado:** (1) En `resolveTargetEntityDetailed`, comparar `trace.durationMs` con el budget del consumer. (2) Emitir `budget:exceeded` con detalle. (3) Test unitario.
- **Criterios de cierre verificables:** Trace step `budget:exceeded` emitido cuando la duración supera `budgetMs`. Test que lo valide.
- **Validación esperada:** Tests de `queryTrace`, `semanticQueryService`.
- **Docs afectadas:** `docs/performance-budget.md`.

---

## AUDIT-04-DERIVED-007 — Pasar HotContextCache a resolveQualifierType

- **Estado:** Open
- **Track:** hardening / performance
- **Prioridad:** Low
- **Origen:** AUDIT-04
- **Tipo:** performance-hardening
- **Objetivo:** Evitar un `structuredClone` redundante en `resolveQualifierType` reutilizando entidades cacheadas del `HotContextCache`.
- **Razón técnica:** `resolveQualifierType` llama a `kb.getEntitiesByUri(currentUri)` directamente sin consultar `HotContextCache`, generando un clone completo de las entidades del documento activo en cada invocación qualified.
- **Evidencia encontrada:** `semanticQueryService.ts:1048`.
- **Alcance:** Añadir parámetro `hotContext?: HotContextCache` a `resolveQualifierType` y reutilizar `getDocumentEntities`.
- **No es una nueva feature porque:** Optimiza un hot path existente.
- **Compatibilidad:** Cambio de firma; callers deben pasar el parámetro opcional.
- **Riesgos:** Bajo — cambio mecánico con backward compatibility (parámetro opcional).
- **Plan recomendado:** (1) Añadir parámetro opcional. (2) Usar `getDocumentEntities` en vez de `kb.getEntitiesByUri`. (3) Actualizar callers.
- **Criterios de cierre verificables:** `resolveQualifierType` no llama a `kb.getEntitiesByUri` directamente cuando `hotContext` está disponible.
- **Validación esperada:** Tests de `semanticQueryService`, `queryContext`, `hover`.
- **Docs afectadas:** Ninguna directa.

---

## AUDIT-04-DERIVED-008 — Reforzar tests de invocationRiskModel

- **Estado:** Open
- **Track:** hardening / test coverage
- **Prioridad:** Medium
- **Origen:** AUDIT-04
- **Tipo:** test-hardening
- **Objetivo:** Ampliar la cobertura de tests de `invocationRiskModel` que actualmente tiene solo 0.8KB de tests.
- **Razón técnica:** `invocationRiskModel` es consumido por `impactAnalysis`, `dependencyGraph` y `safeEditPlan`. Es un módulo crítico para la seguridad de refactorizaciones. 0.8KB de tests es insuficiente para un módulo con 5 funciones exportadas y lógica combinatoria.
- **Evidencia encontrada:** `invocationRiskModel.test.ts` = 843 bytes vs. `impactAnalysis.test.ts` = 8.4KB.
- **Alcance:** Añadir tests para: `combineInvocationRisk` con todos los pares de riesgo, `sourceOriginRisk` con todas las source origins, `dynamicStringRisk` con clasificaciones variadas, `buildInvocationRiskSummary` con combinaciones de dynamic strings + DataWindow + evidence.
- **No es una nueva feature porque:** Refuerza tests de código existente.
- **Compatibilidad:** Solo tests; sin cambios de producto.
- **Riesgos:** Ninguno.
- **Plan recomendado:** (1) Añadir suite exhaustiva de `combineInvocationRisk`. (2) Añadir suite de `sourceOriginRisk`. (3) Añadir suite de `buildInvocationRiskSummary` con combinaciones. (4) Validar.
- **Criterios de cierre verificables:** Test file > 3KB. Cobertura de todos los risk levels y source origins.
- **Validación esperada:** `npm run test:unit -- --grep invocationRiskModel`.
- **Docs afectadas:** `docs/testing.md`.

---

## AUDIT-06-DERIVED-001 — Fix coverage bug en B335 candidateHotPathViolations

- **Estado:** Open
- **Track:** hardening / catalog governance
- **Prioridad:** High
- **Origen:** AUDIT-06
- **Tipo:** test-hardening
- **Objetivo:** Corregir el gate B335 que reporta 0 `candidateHotPathViolations` de manera silente al estar contando sobre la lista ya filtrada por `applyCatalogMergePolicy`.
- **Razón técnica:** `listCatalogPolicyResolvedEntriesForAudit()` invoca a `applyCatalogMergePolicy()`, la cual excluye activamente a los `candidates`. Como resultado, `filter((entry) => entry.manualOverlay?.mode === 'candidate').length` siempre será 0, invalidando el propósito de la validación.
- **Evidencia encontrada:** `src/server/knowledge/system/services/queryService.ts` y `src/server/features/workspaceCheckCatalogSummary.ts`.
- **Alcance:** Modificar la consulta del gate B335 para cruzar las entradas resueltas con `PB_SYSTEM_SYMBOL_REGISTRY` y validar que ningún ID de origen `candidate` haya logrado permear el hot path.
- **No es una nueva feature porque:** Refuerza una métrica de auditoría ya declarada.
- **Compatibilidad:** Ninguna.
- **Riesgos:** Ninguno.
- **Plan recomendado:** Auditar la lista de salida cruzando con `PB_SYSTEM_SYMBOL_REGISTRY`.
- **Criterios de cierre verificables:** Un test explícito falla si se inyecta artificialmente un candidate en la lista resuelta.
- **Validación esperada:** `npm run report:catalog-consistency`.
- **Docs afectadas:** Ninguna directa.

## AUDIT-06-DERIVED-002 — Mejorar detección de officialCoverage stale (verifier CI)

- **Estado:** Open
- **Track:** hardening / catalog governance
- **Prioridad:** Medium
- **Origen:** AUDIT-06
- **Tipo:** test-hardening
- **Objetivo:** Añadir un script o verifier en CI que haga fallar el build si el `officialCoverage` reporta datos stale o desalineados con el dataset `generated` actual.
- **Razón técnica:** La detección de drift ya ocurre en `workspaceCheckCatalogSummary.ts`, pero requiere una capa automatizada en CI para prevenir commits con reportes desactualizados.
- **Evidencia encontrada:** Métrica `buildOfficialCoverageDriftDomains` computada pero sin strict CI gate.
- **Alcance:** Añadir un check en `package.json` (`verify:catalog-coverage`) e integrarlo en la pipeline de CI.
- **No es una nueva feature porque:** Mejora la gobernanza existente de `ADR-0001`.
- **Compatibilidad:** Estricta compatibilidad interna.
- **Riesgos:** Falsos positivos si el generador cambia sin actualizar el coverage.
- **Plan recomendado:** (1) Crear script `tools/verify-catalog-coverage.mjs`. (2) Ejecutarlo en pre-build.
- **Criterios de cierre verificables:** El CI falla si hay drift de coverage.
- **Validación esperada:** CI pipeline en verde.
- **Docs afectadas:** `docs/testing.md`.

## AUDIT-06-DERIVED-003 — Reporte explícito de dominios temporales manual-primary

- **Estado:** Open
- **Track:** hardening / catalog governance
- **Prioridad:** Low
- **Origen:** AUDIT-06
- **Tipo:** governance
- **Objetivo:** Refinar el `catalog-consistency report` para destacar explícitamente cuáles dominios operan como `manual-primary` temporalmente.
- **Razón técnica:** Dominios como `datawindow-events` carecen de rail oficial generado. `B335` lo permite, pero deberían emitirse como "Deuda técnica / Temporary" explícita en el reporte de auditoría.
- **Evidencia encontrada:** El reporte actual incluye `compliance.manualPrimaryDomains.join(', ')` en el JSON subyacente, pero la salida markdown y de consola no alerta visiblemente sobre esta provisionalidad.
- **Alcance:** Mejorar el output de `generate_catalog_consistency_report.cjs`.
- **No es una nueva feature porque:** Modifica un console log / markdown format.
- **Compatibilidad:** Ninguna.
- **Riesgos:** Ninguno.
- **Plan recomendado:** Añadir un warning en el reporte cuando `manualPrimaryDomains` tenga longitud > 0.
- **Criterios de cierre verificables:** El comando `npm run report:catalog-consistency` imprime un warning explícito.
- **Validación esperada:** Ejecución de `npm run report:catalog-consistency`.
- **Docs afectadas:** Ninguna directa.

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
