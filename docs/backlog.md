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


# L3.5 — Core Hardening v2 / Runtime Reliability

## B264 — Semantic consistency oracle across all read-only surfaces
- **Estado:** Open
- **Track:** core consistency
- **Prioridad:** Muy alta
- **Depende de:** B217, B218, B219, B220, B245, B251, B252, B253, B255
- **Objetivo:** comprobar que todas las surfaces read-only dicen lo mismo sobre el mismo objeto/símbolo.
- **Cierre:** oracle con reason codes que detecta divergencias de `objectName`, `objectKind`, `project`, `library`, `sourceOrigin`, ancestor chain, diagnostics, readiness, confidence y DataObject bindings.
- **Validación esperada:** golden cross-surface sobre PFC, OrderEntry, DataWindow y ORCA staging.
- **Docs afectadas:** `docs/testing.md`, `docs/architecture.md`.

## B265 — Incremental invalidation proof suite
- **Estado:** Open
- **Track:** core invalidation / performance
- **Prioridad:** Muy alta
- **Depende de:** B154, B170, B223, B224, B229, B230
- **Objetivo:** demostrar que cada cambio invalida solo lo necesario.
- **Casos mínimos:** cambio cosmético, prototype, implementation, ancestor, `.srd`, marker `.pbt/.pbproj`, sourceOrigin, ORCA staging, external function y DataObject binding.
- **Cierre:** suite valida snapshots, serving cache, dependency graph, manifest, diagnostics y evita rediscovery global innecesario.
- **Validación esperada:** unit/integration con counters de invalidación y performance incremental.
- **Docs afectadas:** `docs/testing.md`, `docs/performance-budget.md`.

## B266 — Query scope policy v2 and consumer budget declarations
- **Estado:** Open
- **Track:** query engine / budgets
- **Prioridad:** Muy alta
- **Depende de:** B156, B157, B171, B223, B230, B252
- **Objetivo:** formalizar scope y presupuesto por consumidor semántico.
- **Scopes canónicos:** `document`, `active-object`, `library`, `project`, `dependency-neighborhood`, `workspace`, `staging`, `generated`, `external`.
- **Cierre:** cada consumer declara scope máximo, budget, result cap, readiness, confidence, fallback y si permite staging/generated.
- **Validación esperada:** unit de policy, tests negativos de reports pesados y no materialización global.
- **Docs afectadas:** `docs/architecture.md`, `docs/performance-budget.md`.

## B267 — Runtime backpressure policy v2 for competing workloads
- **Estado:** Open
- **Track:** runtime / scheduling
- **Prioridad:** Muy alta
- **Depende de:** B123, B124, B159, B183, B188, B246, B247
- **Objetivo:** definir política global cuando compiten indexación, serving, diagnostics, build, ORCA, reports, support bundles y tools IA.
- **Clases de workload:** interactive, near-context, diagnostics, background-indexing, export-reporting, build, legacy-orca, ai-tooling, maintenance.
- **Cierre:** interactive siempre gana; build/ORCA nunca bloquean LSP; exports grandes se trocean o degradan; health explica throttling.
- **Validación esperada:** scheduler/backpressure tests + stress incremental.
- **Docs afectadas:** `docs/architecture.md`, `docs/performance-budget.md`.

## B268 — Workspace partition isolation and multi-root stress hardening
- **Estado:** Open
- **Track:** workspace / enterprise scale
- **Prioridad:** Alta
- **Depende de:** B141, B224, B255, B256
- **Objetivo:** evitar contaminación entre roots, proyectos, librerías, staging y build profiles.
- **Cierre:** tests multi-root con nombres duplicados, caches particionadas, sourceOrigin por root, build profile por root, ORCA staging por root y Object Explorer sin mezcla.
- **Validación esperada:** smoke/integration multi-root y stress routing.
- **Docs afectadas:** `docs/testing.md`, `docs/developer-workflows.md`.

## B269 — Semantic snapshot schema evolution and compatibility tests
- **Estado:** Open
- **Track:** persistence / API compatibility
- **Prioridad:** Alta
- **Depende de:** B168, B220, B241, B243, B251
- **Objetivo:** asegurar evolución compatible de snapshots semánticos, manifests, bundles y public API payloads.
- **Cierre:** fixtures de versiones anteriores, migración segura o rebuild explícito con reason code.
- **Validación esperada:** schema tests, downgrade/upgrade tests y import/export roundtrip.
- **Docs afectadas:** `docs/architecture.md`, `docs/testing.md`.

## B270 — Persistent cache corruption/fuzz recovery suite
- **Estado:** Open
- **Track:** persistence reliability
- **Prioridad:** Alta
- **Depende de:** B155, B167, B168, B259
- **Objetivo:** probar recuperación ante corrupción realista de caché.
- **Casos:** JSON truncado, schema desconocido, journal parcial, checkpoint incompleto, serving snapshot corrupto, workspaceKey mismatch, partition missing y stale sourceOrigin.
- **Cierre:** no crash, rebuild limpio, health warning y sin estado medio expuesto.
- **Validación esperada:** fuzz corpus de payloads persistentes y tests de restore.
- **Docs afectadas:** `docs/testing.md`, `docs/performance-budget.md`.

## B271 — Core telemetry-free observability contract
- **Estado:** Open
- **Track:** observability / privacy
- **Prioridad:** Media-Alta
- **Depende de:** B163, B176, B241, B258
- **Objetivo:** formalizar observabilidad local sin telemetría externa.
- **Cierre:** contrato versionado para readiness, indexing, cache, memory, latency, build, ORCA, diagnostics, query trace, support bundle y health.
- **Validación esperada:** public API contract tests y redaction tests.
- **Docs afectadas:** `README.md`, `docs/architecture.md`, `docs/developer-workflows.md`.

## B272 — PowerBuilder parser resilience fuzzing
- **Estado:** Open
- **Track:** parser hardening
- **Prioridad:** Alta
- **Depende de:** B089, B092, B095, B113, B205
- **Objetivo:** fuzzing controlado de parser/masking/splitter sobre casos PowerBuilder raros.
- **Casos:** comentarios anidados, strings raros, continuaciones `&`, SQL embebido, external functions, prototypes incompletos, eventos, `try/catch/finally`, labels y EOF incompleto.
- **Cierre:** no crash, no scopes corruptos, diagnostics razonables y sin bloqueo.
- **Validación esperada:** fuzz determinista + corpus regression.
- **Docs afectadas:** `docs/testing.md`.

## B273 — Cross-surface golden contract matrix
- **Estado:** Open
- **Track:** regression / product quality
- **Prioridad:** Muy alta
- **Depende de:** B161, B222, B264
- **Objetivo:** congelar outputs visibles de features sobre fixtures clave.
- **Surfaces:** documentSymbols, workspaceSymbols, hover, definition, references, rename eligibility, diagnostics, semantic tokens, currentObjectContext, impactAnalysis, safeEditPlan, manifest, dependencyGraph, DataWindow lineage y support bundle.
- **Cierre:** matriz golden estable con actualización explícita cuando cambie contrato.
- **Validación esperada:** golden suite cross-feature.
- **Docs afectadas:** `docs/testing.md`.

## B274 — Memory pressure adaptive degradation
- **Estado:** Open
- **Track:** runtime memory / graceful degradation
- **Prioridad:** Alta
- **Depende de:** B070, B159, B259, B267
- **Objetivo:** actuar automáticamente bajo presión de memoria.
- **Cierre:** limpiar serving cache, reducir payloads, aplazar background, limitar reports pesados y mantener hover/completion activos.
- **Validación esperada:** unit de policy + stress con thresholds artificiales.
- **Docs afectadas:** `docs/performance-budget.md`, `docs/architecture.md`.

## B275 — Long-running session stability soak tests
- **Estado:** Open
- **Track:** reliability / soak testing
- **Prioridad:** Alta
- **Depende de:** B247, B259, B267, B274
- **Objetivo:** simular sesiones largas para detectar fugas, handles huérfanos o readiness roto.
- **Debe simular:** apertura/cierre de archivos, cambios incrementales, watcher bursts, diagnostics, hover/completion, build snapshot, support bundle, cache flush y workspace resume.
- **Cierre:** sin crecimiento no acotado, sin readiness roto, sin caches huérfanas.
- **Validación esperada:** soak local opt-in y reporte JSON/MD.
- **Docs afectadas:** `docs/testing.md`, `docs/performance-budget.md`.

## B276 — Hot path allocation budget and regression guard
- **Estado:** Open
- **Track:** performance / allocation
- **Prioridad:** Alta
- **Depende de:** B159, B223, B230, B246
- **Objetivo:** controlar allocations en hot path interactivo.
- **Hot paths:** hover, completion, definition, references, documentSymbols, diagnostics rápidos y queryContext.
- **Cierre:** guard detecta materialización de KB completa, clones grandes, split/remask global y JSON stringify en hot path.
- **Validación esperada:** performance guard local/CI con tolerancias.
- **Docs afectadas:** `docs/performance-budget.md`, `docs/testing.md`.

## B277 — Core module dependency firewall
- **Estado:** Open
- **Track:** architecture guardrails
- **Prioridad:** Muy alta
- **Depende de:** B228
- **Objetivo:** impedir dependencias indebidas entre capas.
- **Reglas:** core/knowledge/parsing no importa VS Code/LSP; runtime no importa UI; features no importan cliente; client no importa dominio servidor; shared/contracts no importa entidades internas mutables; build/ORCA no toca hot path semántico.
- **Cierre:** test automático tipo `architectureImports` con allowlist mínima.
- **Validación esperada:** unit architectureImports y CI gate.
- **Docs afectadas:** `docs/architecture.md`.

## B278 — Core maintenance command pack
- **Estado:** Open
- **Track:** operability / maintenance
- **Prioridad:** Media
- **Depende de:** B258, B259, B271
- **Objetivo:** comandos seguros para inspeccionar y mantener el core.
- **Comandos:** clear semantic cache, export health report, export support bundle, show memory budgets, show indexing state, show project routing, show sourceOrigin conflicts, rebuild workspace index y validate persistent cache.
- **Cierre:** comandos read-only o confirmables, documentados y validados.
- **Validación esperada:** smoke commands + unit de command models.
- **Docs afectadas:** `README.md`, `docs/developer-workflows.md`.

---

# L2.6 — Semantic Precision v2

## B279 — Symbol identity canonical key v2
- **Estado:** Open
- **Track:** semantic identity
- **Prioridad:** Muy alta
- **Depende de:** B206, B204, B172, B255
- **Objetivo:** endurecer la clave canónica de identidad de símbolos.
- **Debe considerar:** project, library, object, container, kind, signature, sourceOrigin, implementationKind, declarationScope y fileObjectName.
- **Cierre:** todas las surfaces consumen identidad estable y no comparan solo por nombre.
- **Validación esperada:** cross-project conflicts, references, rename, manifest y dependency graph.
- **Docs afectadas:** `docs/architecture.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.

## B280 — Ambiguity model v2 for query engine
- **Estado:** Open
- **Track:** query engine / evidence
- **Prioridad:** Alta
- **Depende de:** B157, B171, B255, B279
- **Objetivo:** diferenciar ambigüedad real, homónimos seguros, fallback global, sourceOrigin conflict y conflictos cross-project.
- **Cierre:** reason codes canónicos y confidence ajustada para cada tipo de ambigüedad.
- **Validación esperada:** semanticQueryService, queryContext, hover, definition, references y rename.
- **Docs afectadas:** `docs/rules-catalog.md`, `docs/testing.md`.

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

---

# 6. Current execution focus recomendado

## Fase activa — Core Hardening v2 / Runtime Reliability

1. B264 — Semantic consistency oracle across all read-only surfaces
2. B265 — Incremental invalidation proof suite
3. B266 — Query scope policy v2 and consumer budget declarations
4. B267 — Runtime backpressure policy v2 for competing workloads
5. B277 — Core module dependency firewall
6. B273 — Cross-surface golden contract matrix
7. B274 — Memory pressure adaptive degradation
8. B275 — Long-running session stability soak tests
9. B276 — Hot path allocation budget and regression guard
10. B270 — Persistent cache corruption/fuzz recovery suite

## No abrir todavía salvo necesidad real

- Automatización write-enabled avanzada sin `B263`, `B299` y `B300`.
- Nuevas features visuales pesadas sin `B266`, `B267` y preferencia por Tree View frente a Webview cuando baste.
- Nuevos reports grandes sin `B274`, `B276` y `B301`.
- Nuevos carriles ORCA/PBAutoBuild sin pasar por support matrix, troubleshooting y health.

---

# 7. Backlog derivado

- Mantener `L3.5 — Core Hardening v2 / Runtime Reliability` como fase activa actual tras cerrar `B263` en `specs/308-agent-ready-task-execution-contracts`.
- Añadir `L3.5 — Core Hardening v2 / Runtime Reliability` como bloque prioritario posterior.
- Mantener DataWindow como sublenguaje propio y evitar cualquier parser DataWindow como PowerScript normal.
- Mantener ORCA fuera del hot path y detrás de policy/feature flags cuando implique write-enabled o packaging.
- Formalizar en docs la matriz de soporte final tras `B293`.
- Añadir checks de drift documental tras `B316-B317` para evitar backlog/done-log desalineados.
