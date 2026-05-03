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

---

## 2. Estados oficiales

- **Open:** sin slice activa de cierre.
- **Partial:** implementación parcial o primer corte operativo, pero faltan criterios de cierre.
- **Ready for closure:** código y tests básicos existen; falta revisión final, documentación o validación ampliada.
- **Blocked:** no puede avanzar por dependencia, entorno o decisión explícita.
- **Done:** código, tests, documentación y validación cerrados; vive en `done-log.md`, no en backlog activo.

Un ítem `Partial` debe incluir, siempre que sea posible:

```md
**Pendiente exacto:**
- ...
```
---

# 3. Backlog activo


# L2.6 — Semantic Precision v2

## B281 — Override and overload resolution hardening
- **Estado:** Open
- **Track:** PowerBuilder semantics
- **Prioridad:** Alta
- **Depende de:** B173, B209, B210, B279, B280
- **Objetivo:** reforzar resolución entre overloads, overrides, prototypes e implementations.
- **Cierre:** definition/references/hover/signatureHelp distinguen overload/override con evidence y tests negativos.
- **Validación esperada:** PFC/OrderEntry + fixtures sintéticos.
- **Docs afectadas:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.

## B282 — Dynamic invocation risk model v2
- **Estado:** Open
- **Track:** semantic risk
- **Prioridad:** Media-Alta
- **Depende de:** B208, B209, B249, B262
- **Objetivo:** unificar riesgo de llamadas dinámicas, strings, external calls, DataWindow expressions, WebView/HTTP patterns y ORCA staging.
- **Cierre:** `invocationRisk` se propaga de forma uniforme a rename, references, impact, safe edit plan, dependency graph y code actions.
- **Validación esperada:** dynamicStringReferences, DataWindow, SQL y safe edit plan.
- **Docs afectadas:** `docs/rules-catalog.md`, `docs/developer-workflows.md`.

## B283 — Semantic confidence calibration over real corpora
- **Estado:** Open
- **Track:** evidence / validation
- **Prioridad:** Alta
- **Depende de:** B157, B161, B222, B226, B273
- **Objetivo:** calibrar confidence usando PFC, OrderEntry y corpus legacy.
- **Cierre:** baseline de falsos positivos/negativos y thresholds revisados por feature.
- **Validación esperada:** corpus reports + comparison against golden matrix.
- **Docs afectadas:** `docs/testing.md`, `docs/performance-budget.md`.

## B284 — Semantic query explain plan
- **Estado:** Open
- **Track:** query diagnostics
- **Prioridad:** Media-Alta
- **Depende de:** B157, B163, B280
- **Objetivo:** exportar un explain plan legible de una resolución semántica.
- **Cierre:** plan con fases, candidatos, descartes, winner, confidence, sourceOrigin y coste aproximado.
- **Validación esperada:** unit de plan + command/API/tool.
- **Docs afectadas:** `docs/developer-workflows.md`, `docs/architecture.md`.

## B285 — System catalog coverage v2
- **Estado:** Open
- **Track:** PowerBuilder runtime catalog
- **Prioridad:** Media-Alta
- **Depende de:** B112, B205, B225, B248
- **Objetivo:** ampliar catálogo runtime con tipos, eventos, funciones y members frecuentes no cubiertos.
- **Cierre:** catálogo versionado, tests con PFC/OrderEntry y sin hardcode disperso.
- **Validación esperada:** catalog consistency + semantic golden.
- **Docs afectadas:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.

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

## B287 — DataWindow model canonicalization v2
- **Estado:** Open
- **Track:** DataWindow core
- **Prioridad:** Alta
- **Depende de:** B041, B042, B081, B253, B254
- **Objetivo:** consolidar un modelo canónico único de DataWindow consumido por hover, definition, completion, diagnostics, lineage, metrics y reports.
- **Cierre:** ninguna feature DataWindow parsea por su cuenta estructuras ya disponibles.
- **Validación esperada:** architectureImports + DataWindow golden tests.
- **Docs afectadas:** `docs/architecture.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.

## B288 — DataWindow SQL parser safe subset v2
- **Estado:** Open
- **Track:** DataWindow SQL
- **Prioridad:** Alta
- **Depende de:** B253, B287
- **Objetivo:** mejorar parsing seguro de SQL DataWindow sin abrir motor SQL completo.
- **Cierre:** soporta select aliases, joins simples, where básico, args y degradación para SQL complejo.
- **Validación esperada:** `.srd` reales + synthetic fixtures.
- **Docs afectadas:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.

## B289 — DataWindow expression safe evaluator metadata
- **Estado:** Open
- **Track:** DataWindow expressions
- **Prioridad:** Media-Alta
- **Depende de:** B254, B287
- **Objetivo:** modelar metadatos de expresiones sin evaluarlas.
- **Cierre:** diagnostics/completion entienden dependencias de columnas/controles sin ejecutar ni fingir valores.
- **Validación esperada:** DataWindow expression fixtures y negative tests.
- **Docs afectadas:** `docs/rules-catalog.md`.

## B290 — DataStore/DataWindow behavioral catalog v2
- **Estado:** Open
- **Track:** PB catalog
- **Prioridad:** Media
- **Depende de:** B211, B212, B253, B254
- **Objetivo:** ampliar catálogo contextual de DataStore/DataWindow.
- **Cierre:** Retrieve/Update/SetTrans/GetChild/Describe/Modify tienen firmas, riesgos y docs coherentes.
- **Validación esperada:** hover/signatureHelp/completion/diagnostics.
- **Docs afectadas:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.

## B291 — Embedded SQL semantic anchors
- **Estado:** Open
- **Track:** embedded SQL
- **Prioridad:** Media-Alta
- **Depende de:** B090, B211, B260, B261
- **Objetivo:** anclar SQL embebido a transactions, diagnostics, metrics y reports de forma explicable.
- **Cierre:** SQL regions aparecen en context packs, metrics, debt report y support bundle con confidence.
- **Validación esperada:** sqlRegions, diagnostics, metrics y support bundle.
- **Docs afectadas:** `docs/rules-catalog.md`, `docs/developer-workflows.md`.

## B292 — PowerBuilder preprocessor / conditional patterns investigation
- **Estado:** Open
- **Track:** parser research
- **Prioridad:** Media
- **Depende de:** B272
- **Objetivo:** investigar patrones condicionales/preprocesador si aparecen en corpus reales.
- **Cierre:** decisión documentada: soporte, degradación o descarte explícito.
- **Validación esperada:** research + fixtures si aplica.
- **Docs afectadas:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.

---

# L4.7 — Enterprise Supportability / Operability

## B293 — Workspace support matrix finalization
- **Estado:** Open
- **Track:** product support matrix
- **Prioridad:** Alta
- **Depende de:** B256, B257, B258
- **Objetivo:** cerrar matriz oficial de soporte.
- **Debe cubrir:** PowerBuilder 2025 Workspace, Solution, target `.pbt`, PBL-only legacy, source plain-text, staging ORCA, DataWindow `.srd`, PBAutoBuild y PowerServer/PowerClient build files.
- **Cierre:** docs y health report reflejan soporte/limitaciones por modo.
- **Validación esperada:** docs audit + health matrix tests.
- **Docs afectadas:** `README.md`, `docs/developer-workflows.md`, `docs/architecture.md`.

## B294 — Enterprise configuration policy
- **Estado:** Open
- **Track:** configuration governance
- **Prioridad:** Media
- **Depende de:** B244, B293
- **Objetivo:** perfiles corporativos y settings gobernables.
- **Cierre:** perfiles `fast`, `balanced`, `deep-analysis`, `legacy-orca`, `ci-support` y `support-safe`.
- **Validación esperada:** settings governance + smoke config.
- **Docs afectadas:** `README.md`, `docs/developer-workflows.md`.

## B295 — Support bundle redaction policy
- **Estado:** Open
- **Track:** privacy / supportability
- **Prioridad:** Alta
- **Depende de:** B258, B271
- **Objetivo:** política explícita de redacción para bundles.
- **Cierre:** paths, snippets, diagnostics, settings y manifests se sanitizan según perfil.
- **Validación esperada:** redaction tests y snapshot sanitized.
- **Docs afectadas:** `docs/developer-workflows.md`, `docs/testing.md`.

## B296 — Enterprise health score
- **Estado:** Open
- **Track:** health / reporting
- **Prioridad:** Media
- **Depende de:** B176, B216, B257, B258, B293
- **Objetivo:** score agregado de salud del workspace.
- **Cierre:** score explicable por readiness, diagnostics, build, ORCA, cache, sourceOrigin, performance y support matrix.
- **Validación esperada:** health model tests + dashboard projection.
- **Docs afectadas:** `docs/developer-workflows.md`.

## B297 — Runtime self-test command
- **Estado:** Open
- **Track:** support / validation
- **Prioridad:** Media-Alta
- **Depende de:** B258, B271, B278
- **Objetivo:** comando para ejecutar self-test rápido del runtime.
- **Cierre:** valida API, LSP, cache, project model, diagnostics, build snapshot, ORCA snapshot y devuelve reporte.
- **Validación esperada:** smoke command + unit self-test model.
- **Docs afectadas:** `README.md`, `docs/testing.md`.

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

## B301 — Agent context budget enforcement
- **Estado:** Open
- **Track:** AI tooling / performance
- **Prioridad:** Media-Alta
- **Depende de:** B242, B263, B266
- **Objetivo:** limitar payloads y contexto para agentes.
- **Cierre:** tools/API aplican límites, resumen, paginación y reason codes por truncado.
- **Validación esperada:** tool bridge tests + large workspace payload caps.
- **Docs afectadas:** `docs/ai-strategy.md`, `docs/architecture.md`.

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

## B304 — PowerServer project awareness read-only
- **Estado:** Open
- **Track:** PowerServer / project model
- **Prioridad:** Media-Alta
- **Depende de:** B182, B257, B293
- **Objetivo:** reconocer de forma read-only proyectos PowerServer, build JSON y ServerAPIs relacionados sin intentar compilar ni desplegar.
- **Cierre:** manifest/build matrix reflejan PowerServer project hints, paths y readiness sin abrir execution rail nuevo.
- **Validación esperada:** fixtures de build JSON PowerServer y docs.
- **Docs afectadas:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/developer-workflows.md`.

## B305 — PowerClient project awareness read-only
- **Estado:** Open
- **Track:** PowerClient / project model
- **Prioridad:** Media
- **Depende de:** B182, B257, B293
- **Objetivo:** reconocer proyectos PowerClient y sus build files sin mezclar con C/S o PowerServer.
- **Cierre:** build matrix y health distinguen C/S, PowerClient y PowerServer.
- **Validación esperada:** PBAutoBuild JSON fixtures.
- **Docs afectadas:** `docs/developer-workflows.md`.

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

## B318 — PowerBuilder Language Knowledge Catalog v2
- **Estado:** Done
- **Track:** knowledge / catalog
- **Prioridad:** Alta
- **Objetivo:** evolucionar el catálogo de callable/event/statement a un modelo de lenguaje completo.
- **Cierre:** soporte para keywords, datatypes, pronouns, operators, system globals y enumerated values con metadata rica e integración en hover/completion.
- **Validación:** suite `catalogV2.test.ts` + green en 742 tests.
- **Docs afectadas:** `docs/architecture.md`, `docs/testing.md`, `specs/318-powerbuilder-language-knowledge-catalog-v2/`.

## B319 — Restore official catalog generator and coverage v2
- **Estado:** Open
- **Track:** knowledge / generator
- **Prioridad:** Media
- **Depende de:** B318
- **Objetivo:** recrear el script de generación de catálogo, hoy fuera del repo, para automatizar la extracción de símbolos oficiales.
- **Cierre:** script `generate_official_function_catalog.cjs` restaurado y alineado con el modelo v2; reporte de cobertura real generado.
- **Validación:** el script genera `generated.generated.ts` válido y consistente.
- **Docs afectadas:** `docs/architecture.md`.

## B320 — DataWindow expression/property official catalog
- **Estado:** Open
- **Track:** knowledge / datawindow
- **Prioridad:** Media
- **Depende de:** B318, B289
- **Objetivo:** integrar funciones de expresiones de DataWindow y propiedades de objetos DW en el catálogo v2.
- **Cierre:** dominios `datawindow-expression-functions` y `datawindow-properties` poblados con metadata oficial.
- **Validación:** hover/completion funcional sobre expresiones DW complejas.
- **Docs afectadas:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.

## B321 — Generated catalog domain enrichment v2
- **Estado:** Open
- **Track:** knowledge / catalog
- **Prioridad:** Media
- **Depende de:** B319
- **Objetivo:** enriquecer las entradas generadas automáticamente con metadata adicional de lenguaje (introducedIn, risk, etc.).
- **Cierre:** el catálogo generado aprovecha los nuevos campos de `PbSystemSymbolEntryDraft`.
- **Validación:** sanity tests de metadata enriquecida.

---

# 6. Current execution focus recomendado

## Fase activa — Semantic Precision v2

1. B281 — Override and overload resolution hardening
2. mantenimiento verde del carril architecture/runtime/contract ya cerrado en `specs/325-ambiguity-model-v2-query-engine`, `specs/324-symbol-identity-canonical-key-v2`, `specs/323-core-maintenance-command-pack`, `specs/322-powerbuilder-parser-resilience-fuzzing`, `specs/321-telemetry-free-observability-contract`, `specs/320-semantic-snapshot-schema-evolution-compatibility`, `specs/319-persistent-cache-corruption-fuzz-recovery-suite`, `specs/318-hot-path-allocation-budget-and-regression-guard`, `specs/317-long-running-session-stability-soak-tests`, `specs/316-memory-pressure-adaptive-degradation`, `specs/315-workspace-partition-isolation-multi-root-stress-hardening`, `specs/314-cross-surface-golden-contract-matrix`, `specs/313-core-module-dependency-firewall` y `specs/312-runtime-backpressure-policy-v2`

## No abrir todavía salvo necesidad real

- Automatización write-enabled avanzada sin `B263`, `B299` y `B300`.
- Nuevas features visuales pesadas sin guardrails claros y preferencia por Tree View frente a Webview cuando baste.
- Nuevos reports grandes sin `B276` y `B301`.
- Nuevos carriles ORCA/PBAutoBuild sin pasar por support matrix, troubleshooting y health.

---

# 7. Backlog derivado

- Mantener `L2.6 — Semantic Precision v2` como fase activa actual tras cerrar `B280` en `specs/325-ambiguity-model-v2-query-engine`.
- Añadir `L3.5 — Core Hardening v2 / Runtime Reliability` como bloque prioritario posterior.
- Mantener `B281` como foco canónico inmediato con `B280` ya cerrada como modelo v2 de ambigüedad sobre `specs/325-ambiguity-model-v2-query-engine`, `B279` ya cerrada como identidad canónica exacta sobre `specs/324-symbol-identity-canonical-key-v2`, `B278` como pack de comandos de mantenimiento sobre `specs/323-core-maintenance-command-pack`, `B272` como suite determinista de resiliencia del parser, `B271` como contrato versionado de observabilidad local sin telemetría externa, `B269` como guard de compatibilidad para snapshots/manifests/support bundles/payloads públicos versionados, `B270` como suite de recuperación limpia ante persistencia dañada, `B276` como guard estructural de allocations en hot path, `B275` como soak guard de sesiones largas, `B274` como policy de degradación por memoria, `B268` como guard multi-root, `B273` como matriz visible y `B277` como guardrail previo del bloque.
- Mantener DataWindow como sublenguaje propio y evitar cualquier parser DataWindow como PowerScript normal.
- Mantener ORCA fuera del hot path y detrás de policy/feature flags cuando implique write-enabled o packaging.
- Formalizar en docs la matriz de soporte final tras `B293`.
- Añadir checks de drift documental tras `B316-B317` para evitar backlog/done-log desalineados.
