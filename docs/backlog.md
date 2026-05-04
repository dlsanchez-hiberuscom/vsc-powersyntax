# Backlog — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---

## 0. Meta maestra

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Toda spec nueva debe respetar esta meta. Si una mejora aumenta complejidad pero no mejora velocidad percibida, estabilidad, seguridad semántica, entendimiento real de PowerBuilder o utilidad profesional, no debe priorizarse sobre el core.

---

## 1. Cómo debe usar este backlog una IA

- Ejecutar por orden de prioridad global.
- No abrir ítems si sus dependencias no están cerradas, salvo trabajo preparatorio claro.
- Crear sub-specs solo cuando vaya a implementarse el ítem.
- No cerrar si falta código real, tests/validación suficiente, documentación alineada y actualización de roadmap/current-focus si aplica.
- Si un ítem crece demasiado, dividir en sub-specs, no duplicar ítems padre.
- Registrar deuda nueva en **Backlog derivado**.
- Tratar `plugin_old` como guía, dataset y referencia de patrones probados, no como código a portar por inercia.
- Las dependencias hacia ítems `Done` se consideran ya satisfechas y quedan solo como trazabilidad histórica.
- No sacrificar la meta maestra por features secundarias.
- `generated` debe representar la fuente oficial reproducible; `manual/curated` solo debe contener gaps, enrichments, overrides o candidates con política explícita.
- La localización no debe duplicar símbolos ni traducir nombres reales de PowerBuilder. Debe aplicarse como overlay de documentación en consumers, con fallback al texto oficial.

### 1.1. Checklist final para agentes Copilot

Before closing any spec from this document, perform this checklist:

```txt
1. Re-read changed code.
2. Verify no generated/manual ID changed unless the spec explicitly authorizes a breaking change.
3. Verify no full-catalog scans were introduced in hot paths.
4. Verify registry/datasets imports remain stable and not slice-exploded.
5. Verify manual/common.ts contains factories/helpers only.
6. Verify consistency report catches new structural errors.
7. Verify docs/backlog/current-focus/roadmap are aligned.
8. Verify tests are green.
9. Verify done-log is updated only for fully closed specs.
10. If real corpora are required but absent, document honest skip paths and do not fake results.
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

# 3. Backlog activo

---

# L2.6 — Semantic Precision v2

## B284 — Semantic query explain plan
- **Estado:** Open
- **Track:** query diagnostics
- **Prioridad:** Media-Alta
- **Depende de:** B157, B163, B280
- **Objetivo:** exportar un explain plan legible de una resolución semántica.
- **Cierre:** plan con fases, candidatos, descartes, winner, confidence, sourceOrigin y coste aproximado.
- **Validación esperada:** unit de plan + command/API/tool.
- **Docs afectadas:** `docs/developer-workflows.md`, `docs/architecture.md`.

## B286 — Framework knowledge pack conflict policy
- **Estado:** Open
- **Track:** knowledge packs / governance
- **Prioridad:** Media
- **Depende de:** B248, B255, B279
- **Objetivo:** definir cómo conviven knowledge packs con símbolos reales del workspace.
- **Cierre:** source real gana, packs degradan, evidence visible y configuración clara.
- **Validación esperada:** PFC/OrderEntry + cross-project conflicts.
- **Docs afectadas:** `docs/architecture.md`, `docs/developer-workflows.md`.

---

# L4.6 — PowerBuilder / DataWindow Advanced Reliability

# L4.7 — Enterprise Supportability / Operability

## B298 — Extension upgrade compatibility checker
- **Estado:** Open
- **Track:** upgrade / compatibility
- **Prioridad:** Media
- **Depende de:** B269, B294
- **Objetivo:** detectar problemas al actualizar versión de extensión.
- **Cierre:** revisa cache schema, settings antiguas, snapshots, API version, workspace artifacts y recomienda acciones.
- **Validación esperada:** fixtures de versiones antiguas + migration warnings.
- **Docs afectadas:** `docs/architecture.md`, `docs/developer-workflows.md`.

---

# L4.8 — Agent Automation Safety / Governance

## B299 — Agent execution dry-run contract
- **Estado:** Open
- **Track:** AI automation safety
- **Prioridad:** Alta
- **Depende de:** B263, B249, B262
- **Objetivo:** exigir dry-run previo para tareas IA write-enabled.
- **Cierre:** contrato con plan, impacto, archivos, tests, docs y bloqueos antes de tocar código.
- **Validación esperada:** dry-run schema + tool bridge.
- **Docs afectadas:** `docs/ai-orchestrator.md`, `docs/spec-driven-development.md`.

## B300 — Agent validation receipt
- **Estado:** Open
- **Track:** SDD / AI governance
- **Prioridad:** Alta
- **Depende de:** B263, B299
- **Objetivo:** generar recibo de validación tras ejecutar una tarea.
- **Cierre:** incluye comandos, resultados, docs tocadas, specs afectadas, riesgos y next focus.
- **Validación esperada:** receipt schema + docs updater workflow.
- **Docs afectadas:** `docs/spec-driven-development.md`, `docs/ai-orchestrator.md`.

## B302 — Agent-safe documentation updater policy
- **Estado:** Open
- **Track:** docs automation
- **Prioridad:** Media
- **Depende de:** B201, B233, B263
- **Objetivo:** evitar que agentes dupliquen docs o actualicen documentos no propietarios.
- **Cierre:** policy de ownership aplicada en prompts/tools y auditada por checks documentales.
- **Validación esperada:** docs audit + prompt tests si existen.
- **Docs afectadas:** `docs/ai-orchestrator.md`, `docs/ai-agents-catalog.md`, `docs/spec-driven-development.md`.

## B303 — Agent task replay from repro/support bundle
- **Estado:** Open
- **Track:** AI supportability
- **Prioridad:** Media
- **Depende de:** B175, B258, B263, B299
- **Objetivo:** permitir que un agente reproduzca una incidencia usando support/repro bundle.
- **Cierre:** replay read-only con comandos sugeridos, contexto mínimo y sin requerir repo completo.
- **Validación esperada:** replay contract + sample bundle.
- **Docs afectadas:** `docs/developer-workflows.md`, `docs/ai-orchestrator.md`.

---

# L7 — Modern PowerBuilder ecosystem intelligence

## B306 — HTTPClient/REST/JSON usage analyzer
- **Estado:** Open
- **Track:** modern PB APIs / modernization
- **Prioridad:** Media
- **Depende de:** B260, B261, B282
- **Objetivo:** detectar usos de HTTPClient, REST/JSON y patrones de integración moderna para metrics/debt report.
- **Cierre:** reporta endpoints/patrones sin exponer secretos y con redaction por defecto.
- **Validación esperada:** fixtures PowerScript con HTTPClient/JSONParser.
- **Docs afectadas:** `docs/rules-catalog.md`, `docs/developer-workflows.md`.

## B307 — WebBrowser/WebView2 usage analyzer
- **Estado:** Open
- **Track:** modern UI / modernization
- **Prioridad:** Media
- **Depende de:** B260, B261, B282
- **Objetivo:** detectar patrones WebBrowser/WebView2 relevantes en código PowerBuilder y clasificarlos como modernización/interop.
- **Cierre:** metrics/debt report refleja riesgos de interop, navegación, scripting y dependencias externas sin analizar contenido web.
- **Validación esperada:** fixtures y report snapshots.
- **Docs afectadas:** `docs/developer-workflows.md`, `docs/rules-catalog.md`.

## B308 — PBNI/PBX dependency insight v2
- **Estado:** Open
- **Track:** native dependencies
- **Prioridad:** Media-Alta
- **Depende de:** B207, B260, B261
- **Objetivo:** profundizar en dependencias PBX/PBNI/DLL externas para reports, health y support bundle.
- **Cierre:** external dependencies report distingue dll/pbx/unknown, alias, consumers, riesgo y build/ORCA impact.
- **Validación esperada:** externalFunctions tests + report tests.
- **Docs afectadas:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.

## B309 — Source control artifact awareness
- **Estado:** Open
- **Track:** workspace hygiene / source control
- **Prioridad:** Media
- **Depende de:** B256, B293
- **Objetivo:** reconocer artefactos Git/SVN/SCC relevantes para evitar indexar ruido y mejorar migration assistant.
- **Cierre:** discovery/workspace assistant explican qué se ignora, qué afecta build y qué debe versionarse.
- **Validación esperada:** fixtures con `.git`, SVN folders y export artifacts.
- **Docs afectadas:** `docs/developer-workflows.md`.

## B310 — Object lifecycle risk report v2
- **Estado:** Open
- **Track:** PowerBuilder lifecycle / diagnostics
- **Prioridad:** Media
- **Depende de:** B213, B260, B261
- **Objetivo:** elevar lifecycle create/destroy/constructor/destructor a reportes de riesgo y modernization.
- **Cierre:** reporta objetos con missing-super, missing-trigger, unresolved hooks y riesgo por ancestor flow.
- **Validación esperada:** diagnostics + metrics/debt report.
- **Docs afectadas:** `docs/rules-catalog.md`.

## B311 — Transaction and DataWindow update flow analyzer
- **Estado:** Open
- **Track:** transaction semantics / reports
- **Prioridad:** Media-Alta
- **Depende de:** B211, B212, B253, B260, B261
- **Objetivo:** analizar flujos `SetTransObject/SetTrans/Retrieve/Update` y DataWindow update readiness.
- **Cierre:** metrics/debt report identifica DataWindows sin transaction clara, bindings dinámicos y retrieve/update inconsistentes.
- **Validación esperada:** diagnostics + report tests.
- **Docs afectadas:** `docs/rules-catalog.md`, `docs/developer-workflows.md`.

## B312 — SQL dynamic risk taxonomy v2
- **Estado:** Open
- **Track:** SQL / risk model
- **Prioridad:** Media-Alta
- **Depende de:** B090, B208, B211, B291
- **Objetivo:** clasificar riesgo de SQL embebido/dinámico para diagnostics, debt report y safe edit plan.
- **Cierre:** taxonomy con reason codes y confidence; no intenta parsear SQL dinámico no defendible.
- **Validación esperada:** sqlRegions, dynamicStringReferences y reports.
- **Docs afectadas:** `docs/rules-catalog.md`.

## B313 — Workspace artifact cleanup advisor
- **Estado:** Open
- **Track:** workspace hygiene / supportability
- **Prioridad:** Baja-Media
- **Depende de:** B256, B258, B293
- **Objetivo:** sugerir limpieza no destructiva de artefactos locales, staging, logs y caches del workspace.
- **Cierre:** advisor read-only con comandos manuales y sin borrar por defecto.
- **Validación esperada:** workspace assistant/support bundle tests.
- **Docs afectadas:** `docs/developer-workflows.md`.

## B314 — Build/ORCA failure classification v2
- **Estado:** Open
- **Track:** build / troubleshooting
- **Prioridad:** Media
- **Depende de:** B184, B187, B197, B198, B257
- **Objetivo:** clasificar fallos de build/ORCA para troubleshooting y support bundle.
- **Cierre:** reason codes comunes para missing tool, invalid env, compile errors, stale staging, source conflict y packaging disabled.
- **Validación esperada:** build log parser, ORCA runner, support bundle.
- **Docs afectadas:** `docs/developer-workflows.md`, `docs/rules-catalog.md`.

## B315 — Extension package self-verification v2
- **Estado:** Open
- **Track:** release / package quality
- **Prioridad:** Media
- **Depende de:** B250, B297, B298
- **Objetivo:** reforzar verificación del VSIX empaquetado con self-test y smoke de instalación.
- **Cierre:** release verify ejecuta activation, commands, LSP handshake, settings defaults y API descriptor desde VSIX.
- **Validación esperada:** package:vsix + release:verify.
- **Docs afectadas:** `docs/testing.md`, `README.md`.

## B316 — Documentation drift detector
- **Estado:** Open
- **Track:** docs governance / SDD
- **Prioridad:** Media-Alta
- **Depende de:** B201, B233, B302
- **Objetivo:** detectar drift entre backlog, done-log, specs, roadmap, current-focus y código visible.
- **Cierre:** check local que marca items Done activos, specs sin docs, docs duplicadas y foco inconsistente.
- **Validación esperada:** docs audit command/test.
- **Docs afectadas:** `docs/spec-driven-development.md`, `docs/ai-orchestrator.md`.

## B317 — Backlog lifecycle automation guard
- **Estado:** Open
- **Track:** SDD / backlog governance
- **Prioridad:** Media
- **Depende de:** B316
- **Objetivo:** proteger transiciones Open/Partial/Done y movimiento backlog ↔ done-log.
- **Cierre:** guard valida que todo Done tenga entrada done-log, validación, docs y que no permanezca en backlog activo.
- **Validación esperada:** docs lifecycle tests.
- **Docs afectadas:** `docs/spec-driven-development.md`, `docs/backlog.md`, `docs/done-log.md`.

## B321 — Generated catalog domain enrichment v2
- **Estado:** Superseded
- **Track:** knowledge / catalog
- **Prioridad:** Media
- **Superseded by:** B366, B367
- **Motivo:** el enriquecimiento del catálogo generated queda absorbido por `B366 — Official Appeon scraper bugfixes and structural enrichment v2` y `B367 — Generated catalog as complete official source v2`.
- **Acción:** no abrir esta spec como trabajo independiente salvo que aparezca una necesidad concreta no cubierta por B366/B367.

## B329 — Catalog-driven semantic tokens integration
- **Estado:** Open
- **Track:** semantic tokens / catalog
- **Prioridad:** Media
- **Depende de:** B318, B324
- **Objetivo:** consumir metadata del catálogo para tokens seguros sin lookup caro por token.
- **Razón técnica:** semantic tokens existe, pero la auditoría no confirmó integración catalog-driven completa; cualquier ampliación debe usar caché/bounds y preservar tokens actuales.
- **Criterios de cierre verificables:** categorías nuevas testeadas, modifiers compatibles y ausencia de full catalog scans por token.
- **Docs afectadas:** `docs/testing.md`, `docs/performance-budget.md`.
- **Validación esperada:** `semanticTokens.test.ts`, `hotPathAllocationBudget.test.ts`, performance focal si aumenta clasificación.

## B335 — Catalog coverage dashboard and consistency gate
- **Estado:** Open
- **Track:** catalog governance
- **Prioridad:** Media
- **Depende de:** B367, B339
- **Objetivo:** publicar una vista/gate de cobertura por dominio, kind, dataset y provenance.
- **Razón técnica:** `buildCatalogConsistencyReport()` ya expone counts y audit reproducible de provenance/authority por dominio, pero `officialCoverage.generated.ts` debe alinearse con el nuevo generated oficial completo y con la política generated/manual.
- **Criterios de cierre verificables:** reporte reproducible con kindCounts/domainCounts/datasetCounts/provenance, umbrales documentados y fallo claro ante drift.
- **Docs afectadas:** `docs/testing.md`, `docs/performance-budget.md`.
- **Validación esperada:** tests de consistency/gate y artifact de cobertura local.

## B340 — ORCA/PBAutoBuild tooling vocabulary catalog
- **Estado:** Open
- **Track:** tooling catalog
- **Prioridad:** Baja-Media
- **Depende de:** B293, B319
- **Objetivo:** modelar vocabulario de tooling PowerBuilder fuera del hot path semántico.
- **Razón técnica:** `powerbuilder-tooling` existe como namespace, pero ORCA/PBAutoBuild no deben contaminar resolución PowerScript ni DataWindow.
- **Criterios de cierre verificables:** dominio `tooling-symbols` poblado solo para docs/health/build surfaces, sin consumo por query semántica interactiva.
- **Docs afectadas:** `docs/developer-workflows.md`, `docs/architecture.md`.
- **Validación esperada:** tests de build/ORCA surfaces y architectureImports.

# 6. Current execution focus recomendado

## Fase activa 

01. B299 — Agent execution dry-run contract
02. B300 — Agent validation receipt
03. B302 — Agent-safe documentation updater policy
04. B303 — Agent task replay from repro/support bundle
05. B311 — Transaction and DataWindow update flow analyzer
06. B312 — SQL dynamic risk taxonomy v2
07. B310 — Object lifecycle risk report v2
08. B308 — PBNI/PBX dependency insight v2
09. B306 — HTTPClient/REST/JSON usage analyzer
10. B307 — WebBrowser/WebView2 usage analyzer

## Siguiente fase 

- Sin cola separada por ahora: el orden recomendado inmediato queda ya concentrado en la lista de `Fase activa` tras el cierre de `B327`.


## No abrir todavía salvo necesidad real

- Automatización write-enabled avanzada sin `B263`, `B299` y `B300`.
- Nuevas features visuales pesadas sin guardrails claros y preferencia por Tree View frente a Webview cuando baste.
- Nuevos reports grandes sin `B276` o sin caps/paginación/reason codes explícitos en surfaces agent-ready.
- Nuevos carriles ORCA/PBAutoBuild sin pasar por support matrix, troubleshooting y health.

---

# 7. Backlog derivado

- Mantener `B321` como absorbida por `B366/B367`; no ejecutarla como spec independiente salvo necesidad nueva demostrada.
- Si `B358/B359` vuelven al backlog, reformularlas como classification/enrichment/gaps sobre generated, no como duplicación de system object datatypes.
- Mantener DataWindow como sublenguaje propio y evitar cualquier parser DataWindow como PowerScript normal.
- Mantener ORCA fuera del hot path y detrás de policy/feature flags cuando implique write-enabled o packaging.
- Formalizar en docs la matriz de soporte final tras `B293`.
- Mantener la política de localización como overlay de documentación, nunca como duplicación de entries por idioma.
