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

## B320 — DataWindow expression/property official catalog
- **Estado:** Open
- **Track:** knowledge / datawindow
- **Prioridad:** Media
- **Depende de:** B318, B289
- **Objetivo:** integrar funciones de expresiones de DataWindow y propiedades de objetos DW en el catálogo v2.
- **Razón técnica:** DataWindow sigue siendo sublenguaje propio; sus expresiones, propiedades y paths no deben mezclarse con PowerScript normal ni servirse desde scans globales.
- **Criterios de cierre verificables:** dominios `datawindow-expression-functions` y `datawindow-properties` poblados con provenance oficial/curada, namespace `datawindow-expression` o `datawindow`, lookups indexados y consumers limitados a contexto DataWindow defendible.
- **Docs afectadas:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/rules-catalog.md`, `docs/testing.md`.
- **Validación esperada:** tests DataWindow de hover/completion/diagnostics/property paths, negativos fuera de DataWindow y smoke real sobre `.srd`.

## B321 — Generated catalog domain enrichment v2
- **Estado:** Open
- **Track:** knowledge / catalog
- **Prioridad:** Media
- **Depende de:** B319
- **Objetivo:** enriquecer las entradas generadas automáticamente con metadata adicional de lenguaje (introducedIn, risk, etc.).
- **Razón técnica:** los nuevos campos existen, pero el dataset generated todavía no publica metadata uniforme para completado, hover, diagnostics y documentación versionada.
- **Criterios de cierre verificables:** entradas generated con `introducedIn`, `risk`, owners, appliesTo normalizado y provenance auditada; tests de compatibilidad prueban que IDs/kind/domain/namespace existentes se preservan.
- **Docs afectadas:** `docs/architecture.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/testing.md`.
- **Validación esperada:** `catalogV2.test.ts`, `catalogConsistency.test.ts`, tests de compatibilidad de IDs generados y diff del catálogo.

## B327 — DataWindow constants and property path catalog
- **Estado:** Open
- **Track:** knowledge / datawindow
- **Prioridad:** Media-Alta
- **Depende de:** B287, B320
- **Objetivo:** catalogar constantes, property paths y nombres de propiedades DataWindow reutilizables por Describe/Modify/Object.
- **Razón técnica:** hoy existen resolvers seguros de property paths, pero la lista oficial/curada no vive aún como catálogo versionado reusable.
- **Criterios de cierre verificables:** dominios `datawindow-constants` y `datawindow-properties` poblados, separados del parser PowerScript y consumidos solo con contexto DataWindow.
- **Docs afectadas:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/rules-catalog.md`.
- **Validación esperada:** property path tests, negativos dinámicos y smoke `.srd` real.

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
- **Depende de:** B319, B321
- **Objetivo:** publicar una vista/gate de cobertura por dominio, kind, dataset y provenance.
- **Razón técnica:** `buildCatalogConsistencyReport()` ya expone counts, pero `officialCoverage.generated.ts` aún no cubre todos los dominios generados/curados.
- **Criterios de cierre verificables:** reporte reproducible con kindCounts/domainCounts/datasetCounts/provenance, umbrales documentados y fallo claro ante drift.
- **Docs afectadas:** `docs/testing.md`, `docs/performance-budget.md`.
- **Validación esperada:** tests de consistency/gate y artifact de cobertura local.

## B339 — Catalog provenance audit against official Appeon sources
- **Estado:** Open
- **Track:** catalog governance
- **Prioridad:** Media
- **Depende de:** B319, B322, B323, B324, B325
- **Objetivo:** auditar provenance y authority de entradas oficiales, generadas y curadas.
- **Razón técnica:** las slices manuales son útiles, pero la herramienta no debe inventar cobertura oficial ni copiar documentación extensa.
- **Criterios de cierre verificables:** cada dominio declara fuente, authority, versión y límites; entries no oficiales quedan marcadas `curated`.
- **Docs afectadas:** `docs/architecture.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.
- **Validación esperada:** consistency/provenance tests y revisión documental.

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

## B342 — Extract proven symbol heuristics from plugin_old
- **Estado:** Open
- **Track:** plugin_old migration / semantics
- **Prioridad:** Media
- **Depende de:** B281, B283
- **Objetivo:** revisar heurísticas probadas de `plugin_old` sin crear un motor paralelo.
- **Razón técnica:** la auditoría confirmó valor potencial en linked editing, inlay hints, folding, callable counts y edge cases DataWindow; completion scoring y core semántico base ya están absorbidos o superados.
- **Criterios de cierre verificables:** matriz `already implemented / partial / valuable gap / obsolete / unsafe` actualizada, mejoras adaptadas a `KnowledgeBase`/snapshots/query service y tests proporcionales.
- **Docs afectadas:** `docs/plugin-old-migration-opportunities.md`, `docs/testing.md`.
- **Validación esperada:** tests focales de la heurística migrada y architectureImports.

## B344 — DataWindow binding edge cases from plugin_old
- **Estado:** Open
- **Track:** DataWindow / plugin_old migration
- **Prioridad:** Media-Alta
- **Depende de:** B287, B342
- **Objetivo:** extraer casos probados de bindings DataWindow/child/report/dddw desde `plugin_old` como fixtures o reglas nuevas.
- **Razón técnica:** `plugin_old` contiene lógica rica de child links y column occurrences; debe migrarse como conocimiento/test, no como provider cliente acoplado.
- **Criterios de cierre verificables:** fixtures representativos, resolvers actuales extendidos sin parsear DataWindow como PowerScript y degradación honesta para bindings dinámicos.
- **Docs afectadas:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/plugin-old-migration-opportunities.md`.
- **Validación esperada:** DataWindow unit/golden tests y smoke real `.srd`.

## B346 — Refactor client extension activation and command registration
- **Estado:** Open
- **Track:** architecture / client
- **Prioridad:** Media-Alta
- **Depende de:** B277, B293
- **Objetivo:** reducir `src/client/extension.ts` separando bootstrap, comandos, vistas, build/ORCA, support/export y API construction.
- **Razón técnica:** el archivo sigue siendo grande y mezcla wiring de muchas superficies; el cliente sigue fino, pero la mantenibilidad requiere boundaries explícitos.
- **Criterios de cierre verificables:** command IDs y API pública intactos, activación sin regresión, módulos cliente sin imports de server y smokes de comandos principales verdes.
- **Docs afectadas:** `docs/architecture.md`, `docs/testing.md`, `docs/performance-budget.md`.
- **Validación esperada:** `architectureImports.test.ts`, smoke extension/comandos/status/build/ORCA y budget de activación.

## B353 — Large-file regression guard and architecture metrics
- **Estado:** Open
- **Track:** architecture metrics
- **Prioridad:** Media
- **Depende de:** B346, B347
- **Objetivo:** añadir un guard reproducible de tamaño/responsabilidad/imports para hotspots.
- **Razón técnica:** hoy existe firewall de imports, pero no un inventario ejecutable de line count/responsibility drift para `extension.ts`, `server.ts` y generated/manual catalog slices.
- **Criterios de cierre verificables:** reporte local/CI con thresholds razonables, allowlist para generated/manual catalogs y señal clara ante crecimiento no justificado.
- **Docs afectadas:** `docs/architecture.md`, `docs/testing.md`.
- **Validación esperada:** test/tool de arquitectura y documentación de excepciones.

## B354 — Server runtime orchestration decomposition
- **Estado:** Open
- **Track:** runtime architecture
- **Prioridad:** Alta
- **Depende de:** B347, B267, B274
- **Objetivo:** separar orquestación runtime de LSP wiring sin cambiar scheduling/backpressure/memory policies.
- **Razón técnica:** `server.ts` aún administra scheduler, readiness, memory pressure, serving cache, persistence y journals en el mismo archivo de handlers.
- **Criterios de cierre verificables:** policies siguen centralizadas, stats/health/status conservan payloads, build/legacy no entran al hot path y PFC/OrderEntry no muestran loops ni crashes.
- **Docs afectadas:** `docs/architecture.md`, `docs/performance-budget.md`, `docs/testing.md`.
- **Validación esperada:** scheduler/backpressure/memory/runtimeHealth/statusBar tests, performance gate y real-corpus smoke.

## B356 — PFC/STD rapid validation gate for architecture refactors
- **Estado:** Open
- **Track:** validation / real corpora
- **Prioridad:** Alta
- **Depende de:** B346, B347, B336
- **Objetivo:** convertir la validación rápida PFC/STD en gate documentado para refactors arquitectónicos.
- **Razón técnica:** las suites reales existen y se ejecutan manualmente, pero el cierre de refactors grandes debe exigir explícitamente PFC Workspace/Solution y STD/OrderEntry.
- **Criterios de cierre verificables:** comando/gate rápido con discovery, indexing, serving básico, readiness y evidencia de no crash; skip honesto si faltan corpus.
- **Docs afectadas:** `docs/testing.md`, `docs/performance-budget.md`, `test/corpora/README.md`.
- **Validación esperada:** `npm run test:performance -- --grep "PFC|OrderEntry|STD"` o comando específico equivalente.

## B357 — Manual catalog modularization and slice ownership
- **Estado:** Open
- **Track:** knowledge / catalog architecture
- **Prioridad:** Alta
- **Depende de:** B318, B319
- **Objetivo:** reorganizar `src/server/knowledge/system/manual/` en slices pequeñas, mantenibles y con ownership claro, evitando archivos gigantes y evitando que `registry/datasets.ts` tenga que importar docenas de sub-slices internas.
- **Razón técnica:** el catálogo manual ya mezcla lenguaje, DataWindow, visuales, runtime, generated overrides, owner groups y helpers. Para poder integrar todos los símbolos PowerBuilder de forma profesional, el catálogo debe crecer por slices con agregadores estables.

### Alcance incluido

- Crear estructura modular bajo `manual/`.
- Mantener `manual/common.ts` solo para factories/helpers.
- Crear `manual/sources.ts` para fuentes oficiales/provenance base.
- Mover owner groups fuera de `manual/common.ts`.
- Mantener `manual/index.ts` como agregador estable.
- Mover slices existentes sin cambiar entradas, IDs, `kind`, `domain`, `namespace`, `invocation` ni `ownerTypes`.
- Crear índices por carpeta.
- Asegurar que `registry/datasets.ts` consume agregadores estables, no sub-slices internas.
- Añadir tests de no duplicados y cobertura de slices manuales.

### Estructura objetivo

```txt
src/server/knowledge/system/manual/
  common.ts
  sources.ts
  index.ts

  ownerTypes/
    index.ts
    objectOwnerTypes.ts
    visualOwnerTypes.ts
    dataWindowOwnerTypes.ts

  language/
    index.ts
    datatypes.ts
    languageKeywords.ts
    reservedWords.ts
    statements.ts
    operators.ts
    pronouns.ts
    enumerations/
      index.ts
      common.ts
      datawindow.ts
      ui.ts
      windows.ts
      file.ts
      drawing.ts
      print.ts
      dragDrop.ts
      database.ts
      runtime.ts
      pdf.ts
      corpusCandidates.ts

  visual/
    index.ts
    visualObjects.ts
    textControls.ts
    listControls.ts
    drawingControls.ts
    dataControls.ts
    ribbonControls.ts
    oleVisualControls.ts

  runtime/
    index.ts
    systemTypes.ts
    systemGlobals.ts
    errors.ts
    reflection.ts
    ole.ts
    mail.ts
    profiling.ts

  integration/
    index.ts
    json.ts
    http.ts
    rest.ts
    oauth.ts
    pdf.ts
    filesystem.ts
    compression.ts
    crypto.ts
    dotnet.ts

  datawindow/
    index.ts
    dataWindowEvents.ts
    dataWindowFunctions.ts
    dataWindowExpressions.ts
    dataWindowProperties.ts
    dataWindowConstants.ts

  legacy/
    index.ts
    globalFunctions.ts
    objectFunctions.ts
    systemEvents.ts
```

### Required aggregator pattern

`registry/datasets.ts` must consume stable aggregators such as:

```ts
import {
  PB_MANUAL_CORE_DATASET_SLICES,
  PB_MANUAL_CORE_OWNER_TYPE_GROUPS,
} from '../manual';
```

or domain aggregators such as:

```ts
import {
  PB_MANUAL_CORE_LANGUAGE_DATASET_SLICES,
  PB_MANUAL_CORE_VISUAL_DATASET_SLICES,
  PB_MANUAL_CORE_RUNTIME_DATASET_SLICES,
  PB_MANUAL_CORE_INTEGRATION_DATASET_SLICES,
  PB_MANUAL_CORE_DATAWINDOW_DATASET_SLICES,
  PB_MANUAL_CORE_LEGACY_DATASET_SLICES,
} from '../manual';
```

Avoid direct imports such as:

```ts
import { PB_MANUAL_CORE_TEXT_CONTROL_DATATYPES } from '../manual/visual/textControls';
```

### Criterios de cierre verificables

- `manual/` queda organizado por carpetas funcionales.
- `manual/common.ts` no contiene arrays grandes ni owner groups.
- `manual/sources.ts` contiene fuentes/provenance base.
- `manual/ownerTypes/` contiene owner groups.
- `manual/index.ts` exporta agregadores estables.
- `registry/datasets.ts` no importa sub-slices internas una a una.
- No cambia ningún ID existente.
- No cambia ningún `kind`, `domain`, `namespace`, `invocation` u `ownerTypes` existente.
- `catalogConsistency` no detecta duplicados.
- Consumers no dependen de rutas internas frágiles.
- Documentación explica ownership de slices.

### Docs afectadas

- `docs/architecture.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "catalog|systemCatalog|catalogV2|catalogConsistency|ownerTypes|architectureImports"
npm run test:unit -- --grep "completion|hover|signatureHelp"
```

---

## B358 — Visual PowerBuilder system object datatypes catalog completion
- **Estado:** Open
- **Track:** knowledge / visual object catalog
- **Prioridad:** Alta
- **Depende de:** B357, B323, B339, B365
- **Objetivo:** completar e integrar todos los tipos visuales PowerBuilder bajo `manual/visual/`, incluyendo ventanas, controles estándar, controles de texto, listas, dibujo, DataWindow visual, MDI, ActiveX visual y Ribbon.
- **Razón técnica:** los controles y objetos visuales son esenciales para owner resolution, hover, completion, Object Explorer, UI hierarchy y reglas visuales. Deben vivir en slices pequeñas, no en un único `systemObjectDatatypes.ts` gigante.

### Alcance incluido

- Completar:
  - `manual/visual/visualObjects.ts`
  - `manual/visual/textControls.ts`
  - `manual/visual/listControls.ts`
  - `manual/visual/drawingControls.ts`
  - `manual/visual/dataControls.ts`
  - `manual/visual/ribbonControls.ts`
  - `manual/visual/oleVisualControls.ts`
- Integrar en `manual/visual/index.ts`.
- Integrar en el agregador manual estable.
- Añadir tests de resolución para controles clave.
- Completar owner groups visuales si falta cobertura.

### Categorías objetivo

```txt
Objetos visuales
Controles de texto
Controles de lista
Controles de dibujo
Controles de datos/UI
Controles Ribbon
OLE visual
```

### Tipos a incluir o revisar

```txt
Window
MDIClient
UserObject
Menu
MenuCascade
DataWindow
SingleLineEdit
MultiLineEdit
EditMask
RichTextEdit
StaticText
StaticHyperLink
CommandButton
PictureButton
CheckBox
RadioButton
ListBox
PictureListBox
DropDownListBox
DropDownPictureListBox
ListView
ListViewItem
TreeView
TreeViewItem
Tab
TabbedBar
GroupBox
Graph
grAxis
grDispAttr
Picture
PictureHyperLink
Line
Oval
Rectangle
RoundRectangle
HScrollBar
VScrollBar
HProgressBar
VProgressBar
HTrackBar
VTrackBar
DatePicker
MonthCalendar
Animation
InkEdit
InkPicture
WebBrowser
OLEControl
OLECustomControl
RibbonBar
RibbonApplicationButtonItem
RibbonApplicationMenu
RibbonCategoryItem
RibbonCheckBoxItem
RibbonComboBoxItem
RibbonGroupItem
RibbonLargeButtonItem
RibbonMenu
RibbonMenuItem
RibbonPanelItem
RibbonSmallButtonItem
RibbonTabButtonItem
PowerServerLabel
```

### Explicit classification rules

- `Application` is not a visual control. It belongs to runtime/system types.
- `DataWindow` is visual when used as a control, but DataWindow expression functions/properties/constants remain separate specs/domains.
- `DataStore` is nonvisual and belongs to runtime/system types.
- `OLEObject`, `OLEStorage`, `OLEStream`, `OLETxnObject` are nonvisual OLE runtime types, not visual controls.

### Fuera de alcance

- PDF object model.
- JSON/HTTP/OAuth.
- Mail/SMTP/MIME.
- Profiling/traces.
- Reflection.
- Error hierarchy.
- DataWindow expressions/properties/constants.

### Criterios de cierre verificables

- All relevant visual types are present or explicitly rejected with reason.
- No duplicate IDs.
- Existing IDs remain unchanged unless a prior breaking spec explicitly authorizes the change.
- Every entry uses `systemObjectDatatype()` or the approved factory for system object datatypes.
- `resolveDatatype()` resolves representative types:
  - `SingleLineEdit`
  - `DataWindow`
  - `MDIClient`
  - `RibbonBar`
  - `RibbonApplicationMenu`
  - `WebBrowser`
  - `OLEControl`
- Completion/hover/signatureHelp do not regress.
- Visual owner groups are complete enough for completion/hover/Object Explorer.

### Docs afectadas

- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/architecture.md`
- `docs/rules-catalog.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "catalog|systemCatalog|catalogV2|catalogConsistency|nativeAncestors|ownerTypes"
npm run test:unit -- --grep "completion|hover|signatureHelp|objectExplorer"
```

---

## B359 — Runtime, integration and nonvisual system object datatypes catalog completion
- **Estado:** Open
- **Track:** knowledge / runtime object catalog
- **Prioridad:** Alta
- **Depende de:** B357, B323, B339, B365
- **Objetivo:** completar e integrar tipos no visuales, runtime, integración moderna, PDF, correo, profiling/trazas, reflexión, OLE no visual, objetos de sistema y errores bajo `manual/runtime/` e `manual/integration/`.
- **Razón técnica:** el runtime moderno de PowerBuilder contiene muchos subsistemas no visuales. Mezclarlos con controles visuales dificulta owner resolution, hover, completion, diagnostics conservadores, modernization reports y future catalog-driven rules.

### Alcance incluido

- Completar:
  - `manual/runtime/systemTypes.ts`
  - `manual/runtime/errors.ts`
  - `manual/runtime/reflection.ts`
  - `manual/runtime/ole.ts`
  - `manual/runtime/mail.ts`
  - `manual/runtime/profiling.ts`
  - `manual/integration/json.ts`
  - `manual/integration/http.ts`
  - `manual/integration/rest.ts`
  - `manual/integration/oauth.ts`
  - `manual/integration/pdf.ts`
  - `manual/integration/filesystem.ts`
  - `manual/integration/compression.ts`
  - `manual/integration/crypto.ts`
  - `manual/integration/dotnet.ts`
- Reclassify `Application` as runtime/system if currently visual.
- Add representative resolution tests.

### Categorías objetivo

```txt
Objetos no visuales
JSON / HTTP / OAuth / REST
PDF
Correo
Profiling y trazas
Objetos de sistema
Reflexión
OLE
Errores
Filesystem
Crypto / compression
.NET interop
```

### Tipos a incluir o revisar

```txt
ADOResultSet
ArrayBounds
Application
BatchDataObjects
ClassDefinition
CoderObject
CompressorObject
ContextInformation
ContextKeyword
CrypterObject
DataStore
DataWindowChild
DotNetAssembly
DotNetObject
DynamicDescriptionArea
DynamicStagingArea
Environment
Error
ErrorLogging
Exception
ExtractorObject
HTTPClient
Inet
InternetResult
JSONGenerator
JSONPackage
JSONParser
MailFileDescription
MailMessage
MailRecipient
MailSession
Message
MimeMessage
MLSync
MLSynchronization
OAuthClient
OAuthRequest
OLEObject
OLEStorage
OLEStream
OLETxnObject
PDFAction
PDFActionJavaScript
PDFActionNamed
PDFActionResetForm
PDFAttachment
PDFColor
PDFContent
PDFContext
PDFDocExtractor
PDFDocument
PDFDocumentProperties
PDFFont
PDFFormField
PDFFormFieldCheckBox
PDFFormFieldComboBox
PDFFormFieldGroup
PDFFormFieldListBox
PDFFormFieldPushButton
PDFFormFieldRadioButton
PDFFormFieldRadioButtonGroup
PDFFormFieldText
PDFImage
PDFImportContent
PDFInvisibleContent
PDFModel
PDFMultilineText
PDFPage
PDFRichText
PDFSecurity
PDFSharedText
PDFTableOfContents
PDFTableOfContentsItem
PDFText
PDFTextBlock
PDFTextLayout
PDFVisibleContent
PDFWatermark
Pipeline
PowerObject
PowerServerResult
ProfileCall
ProfileClass
ProfileLine
ProfileRoutine
Profiling
ResourceResponse
RESTClient
ResultSet
RuntimeError
ScriptDefinition
SimpleTypeDefinition
SMTPClient
SyncParm
Throwable
Timing
TokenRequest
TokenResponse
TraceActivityNode
TraceBeginEnd
TraceError
TraceESQL
TraceFile
TraceGarbageCollect
TraceLine
TraceObject
TraceRoutine
TraceTree
TraceTreeError
TraceTreeESQL
TraceTreeGarbageCollect
TraceTreeLine
TraceTreeNode
TraceTreeObject
TraceTreeRoutine
TraceTreeUser
TraceUser
Transaction
TransactionServer
TypeDefinition
ULSync
VariableCardinalityDefinition
VariableDefinition
WSConnection
```

### OwnerTypes que NO deben añadirse como tipos

```txt
longhandleofbuttonmenuisassociatedwith
longhandleofitem
longindexofmenuitemclicked
longindexofmenuitemmouseison
longindexofsubmenuitemclicked0indicateseventistriggeredbymainmenu
longindexofsubmenuitemmouseison0indicateseventistriggeredbymainmenu
```

These are extractor noise, not PowerBuilder system object datatypes.

### Fuera de alcance

- Visual controls.
- Ribbon visual controls.
- DataWindow expression functions/properties/constants.
- Official generated extraction rail.

### Criterios de cierre verificables

- All relevant runtime/nonvisual/integration types are present or explicitly rejected with reason.
- `Application` is classified as runtime/system.
- No duplicate IDs.
- Existing IDs remain unchanged unless a prior breaking spec explicitly authorizes the change.
- Representative types resolve:
  - `HTTPClient`
  - `JSONParser`
  - `PDFDocument`
  - `PDFPage`
  - `SMTPClient`
  - `MimeMessage`
  - `TraceTreeRoutine`
  - `BatchDataObjects`
  - `ResourceResponse`
  - `DataStore`
  - `Transaction`
- Completion/hover/signatureHelp do not regress.

### Docs afectadas

- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/architecture.md`
- `docs/rules-catalog.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "catalog|systemCatalog|catalogV2|catalogConsistency|nativeAncestors|ownerTypes"
npm run test:unit -- --grep "completion|hover|signatureHelp"
```

---

## B360 — Enumerated catalog model breaking normalization
- **Estado:** Open
- **Track:** knowledge / language catalog / breaking normalization
- **Prioridad:** Alta
- **Depende de:** B357, B365, B324, B339
- **Objetivo:** normalizar de forma estricta el modelo de enumerados PowerBuilder separando `enumerated-type` y `enumerated-value`, eliminando completamente la representación legacy donde tipos como `SaveAsType!`, `DWBuffer!`, `DWItemStatus!` o `Encoding!` se modelan como entradas canónicas.
- **Razón técnica:** en PowerBuilder, el tipo enumerado y el valor enumerado son conceptos distintos. El tipo se usa como datatype de argumentos/propiedades (`SaveAsType`, `DWBuffer`, `Alignment`, `Encoding`) y los valores terminan con `!` (`Text!`, `Primary!`, `Left!`, `EncodingUTF8!`). Mantener tipos con `!` confunde hover, completion, signatureHelp y diagnostics.
- **Decisión arquitectónica:** breaking change intencionado. No mantener aliases legacy para tipos con `!`.

### Alcance incluido

- Añadir `PbSystemSymbolKind = 'enumerated-type'`.
- Mantener `PbSystemSymbolKind = 'enumerated-value'`.
- Añadir `PbSystemSymbolDomain = 'enumerated-types'`.
- Mantener `PbSystemSymbolDomain = 'enumerated-values'`.
- Eliminar/migrar entradas legacy mal modeladas:
  - `SaveAsType!`
  - `DWBuffer!`
  - `DWItemStatus!`
  - `Encoding!`
  - `WindowType!`
  - `WindowState!`
  - any other enum type ending in `!`.
- Canonical type name must never end in `!`.
- Canonical value name must end in `!`.
- Add enum metadata fields.
- Add explicit query APIs.

### Required metadata fields

```ts
export interface PbSystemSymbolEntryDraft {
    documentation?: string;
    enumValues?: readonly string[];
    enumValueOf?: string;
    enumNumericValue?: number;
    enumValueMeaning?: string;
    allowedOnOwners?: readonly string[];
    allowedOnProperties?: readonly string[];
    allowedInParameters?: readonly string[];
    obsolete?: boolean;
    obsoleteMessage?: string;
    replacement?: string;
}
```

### Required query APIs

```ts
listEnumeratedTypes(): readonly PbSystemSymbolEntry[];
listEnumeratedValues(): readonly PbSystemSymbolEntry[];
resolveEnumeratedType(name: string): PbSystemSymbolEntry | undefined;
resolveEnumeratedValue(name: string): PbSystemSymbolEntry | undefined;
listValuesForEnumeratedType(typeName: string): readonly PbSystemSymbolEntry[];
resolveEnumValueForExpectedType(valueName: string, typeName: string): PbSystemSymbolEntry | undefined;
```

### Strict rules

- `SaveAsType` is type.
- `SaveAsType!` must not exist as type or type alias.
- `Text!`, `CSV!`, `PDF!`, `XLSX!` are values.
- `DWBuffer` is type.
- `Primary!`, `Delete!`, `Filter!` are values.
- `Encoding` is type.
- `EncodingUTF8!` is value.
- PFC/STD cannot define official enum membership.

### Criterios de cierre verificables

- `resolveEnumeratedType('SaveAsType')` resolves.
- `resolveEnumeratedType('SaveAsType!')` does not resolve.
- `resolveEnumeratedValue('Text!')` resolves.
- `resolveEnumeratedType('DWBuffer')` resolves.
- `resolveEnumeratedValue('Primary!')` resolves.
- No `enumerated-type` entry ends with `!`.
- `buildCatalogConsistencyReport()` reports invalid enum type names ending in `!`.
- Old incompatible tests are updated or removed.
- Docs explain the breaking change.

### Docs afectadas

- `docs/architecture.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "catalog|systemCatalog|catalogV2|enumerated|enum"
npm run test:unit -- --grep "completion|hover|semanticTokens|signatureHelp"
```

---

## B361 — Official enumerated datatype extractor and coverage rail
- **Estado:** Open
- **Track:** knowledge / generator / official catalog
- **Prioridad:** Alta
- **Depende de:** B319, B360
- **Objetivo:** crear o extender el rail de generación/auditoría oficial para extraer tipos enumerados, valores enumerados, numeric values, significado breve, obsolescencia y provenance desde documentación oficial Appeon.
- **Razón técnica:** el catálogo manual puede arrancar con curación, pero la herramienta profesional necesita una fuente reproducible y auditada para enum types/values.

### Alcance incluido

- Auditar generadores existentes:
  - `scripts/generate_official_function_catalog.cjs`
  - `script/generate_official_function_catalog.cjs`
  - equivalent scripts.
- Crear extractor específico si no existe rail adecuado.
- Extraer/auditar desde:
  - PowerScript Reference / Enumerated datatypes.
  - DataWindow Reference / DataWindow Constants.
  - Objects and Controls / Property Descriptions and Usage.
- Capturar:
  - enum type;
  - enum values;
  - numeric value when available;
  - compact value meaning;
  - obsolete/deprecated flag;
  - replacement when documented;
  - sourceUrl;
  - provenance;
  - documentation version.

### Minimum official targets

```txt
DataWindow constants:
  AccessibleRole
  Alignment
  Band
  Border
  BorderStyle
  CharSet
  DWBuffer
  DWConflictResolution
  DWItemStatus
  FillPattern
  LineStyle
  RichTextToolbarActivation
  RowFocusInd
  SaveAsType
  SaveMetaData
  SQLPreviewFunction
  SQLPreviewType
  WebPagingMethod

Objects and Controls property datatypes:
  AccessibleRole
  Alignment
  BorderStyle
  FillPattern
  FontCharSet
  FontFamily
  FontPitch
  GraphType
  HighDPIMode
  SecureProtocol
  TextCase
  ToolbarAlignment
  ToolbarStyle
  WindowState
  WindowType

PowerScript Reference:
  Enumerated datatype concept and official constraints.
```

### Anti-invention rule

- Do not generate enums from intuition.
- Do not add `HTTPMethod`, `OAuthGrantType`, `CPUArchitecture`, `TransactionScope`, etc. unless official docs or generated official extraction confirms them.
- If a value appears only in PFC/STD, store as corpus candidate, not official.

### Expected generated outputs

```txt
src/server/knowledge/system/generated/enumeratedTypes.generated.ts
src/server/knowledge/system/generated/enumeratedValues.generated.ts
src/server/knowledge/system/generated/enumeratedCoverage.generated.ts
src/server/knowledge/system/generated/enumeratedProvenance.generated.ts
```

### Criterios de cierre verificables

- Extractor output is deterministic.
- `SaveAsType` includes official known values such as `Excel!`, `Text!`, `CSV!`, `SQLInsert!`, `PSReport!`, `PDF!`, `Excel8!`, `XLSX!`, `XLSB!` where officially documented.
- `DWBuffer` includes `Primary!`, `Delete!`, `Filter!` with numeric values when officially available.
- Obsolete values are flagged when official docs mark them obsolete.
- Coverage report includes `enumerated-types` and `enumerated-values` counts.
- No large official documentation text is copied.

### Docs afectadas

- `docs/architecture.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "generator|enumerated|catalogCoverage|catalogConsistency"
```

---

## B362 — PowerBuilder enumerated datatypes and values catalog completion
- **Estado:** Open
- **Track:** knowledge / language catalog / enumerations
- **Prioridad:** Alta
- **Depende de:** B360, B361, B339
- **Objetivo:** completar el catálogo de tipos enumerados y valores enumerados con entradas oficiales cuando estén disponibles y entradas manual-curated solo con evidencia suficiente.
- **Razón técnica:** el programador debe entender qué está escribiendo. El catálogo debe explicar tanto el tipo (`DWBuffer`) como cada valor (`Primary!`) con significado concreto, numeric value y obsolescencia cuando aplique.

### Structure target

```txt
manual/language/enumerations/
  common.ts
  index.ts
  datawindow.ts
  ui.ts
  windows.ts
  file.ts
  drawing.ts
  print.ts
  dragDrop.ts
  database.ts
  runtime.ts
  pdf.ts
  corpusCandidates.ts
```

### Factory target

```ts
enumeratedType({
    name: 'DWBuffer',
    category: 'DataWindow',
    summary: 'Tipo enumerado para seleccionar el buffer de filas de un DataWindow.',
    documentation: 'Se usa en métodos DataWindow que acceden, mueven o consultan filas en un buffer concreto.',
    enumValues: ['Primary!', 'Delete!', 'Filter!'],
});

enumeratedValue({
    name: 'Primary!',
    category: 'DataWindow',
    summary: 'Buffer principal del DataWindow.',
    documentation: 'Representa las filas activas del DataWindow, es decir, filas que no han sido eliminadas ni filtradas.',
    enumValueOf: 'DWBuffer',
    enumNumericValue: 0,
});
```

### Minimum required enum types

```txt
DataWindow:
  SaveAsType
  DWBuffer
  DWItemStatus
  DWConflictResolution
  SQLPreviewFunction
  SQLPreviewType
  SaveMetaData
  WebPagingMethod

File / encoding:
  Encoding
  FileAccess
  FileMode
  SeekType

UI / controls:
  AccessibleRole
  Alignment
  Border
  BorderStyle
  Pointer
  TextCase
  ToolbarAlignment
  ToolbarStyle

Windows / MDI:
  WindowType
  WindowState
  ArrangeType

Drawing / graphics:
  FillPattern
  LineStyle
  GraphType
  UnitType
  FontCharSet
  FontFamily
  FontPitch

PDF:
  PDFStandard
  PDFPageSize
  PDFOrientation
  PDFFormFieldEvent
```

### Minimum required enum values

```txt
SaveAsType:
  Excel!
  Text!
  CSV!
  SYLK!
  WKS!
  WK1!
  DIF!
  dBASE2!
  dBASE3!
  SQLInsert!
  Clipboard!
  PSReport!
  WMF!
  HTMLTable!
  Excel5!
  XML!
  XSLFO!
  PDF!
  Excel8!
  EMF!
  XLSX!
  XLSB!

DWBuffer:
  Primary!
  Delete!
  Filter!

Encoding:
  EncodingANSI!
  EncodingUTF8!
  EncodingUTF16LE!
  EncodingUTF16BE!

Alignment:
  Center!
  Left!
  Right!

WindowState:
  Normal!
  Maximized!
  Minimized!

FileAccess:
  FileRead!
  FileWrite!
  FileReadWrite!

FileMode:
  LineMode!
  StreamMode!
```

### Hover usefulness rules

Each `enumerated-type` must include:

```txt
summary
longer documentation
enumValues
source/provenance
```

Each `enumerated-value` must include:

```txt
summary
longer documentation
enumValueOf
enumNumericValue when available
obsolete/obsoleteMessage/replacement when applicable
source/provenance
```

### PFC/STD rule

- PFC, STD/OrderEntry and public PB repositories provide real-world usage and fixtures.
- They do not define official enum membership.
- Unknown values found in corpus become `corpusCandidates` or backlog items unless official source confirms them.

### Criterios de cierre verificables

- Each `enumerated-value` has `enumValueOf`.
- Each `enumerated-type` has `enumValues`.
- No orphan values.
- No empty enum types unless explicitly justified.
- Obsolete values are marked when official source says so.
- `listValuesForEnumeratedType('SaveAsType')` returns official values.
- `listValuesForEnumeratedType('DWBuffer')` returns `Primary!`, `Delete!`, `Filter!`.
- `resolveEnumeratedValue('Primary!')` indicates `enumValueOf: 'DWBuffer'`.
- Hover can be built from catalog metadata without extra hardcoding.

### Docs afectadas

- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md`
- `docs/testing.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "enumerated|enum|catalog|systemCatalog"
```

---

## B363 — Catalog-driven enum hover, completion, signatureHelp and diagnostics
- **Estado:** Open
- **Track:** language services / catalog consumers
- **Prioridad:** Alta
- **Depende de:** B360, B362, B365
- **Objetivo:** integrar el modelo correcto de enumerated types/values en hover, completion, signatureHelp, semanticTokens y diagnostics conservadores, priorizando utilidad real para programadores PowerBuilder.
- **Razón técnica:** el usuario debe entender exactamente qué significa `CSV!`, `Primary!`, `EncodingUTF8!` o `Right!`, y completion/signatureHelp deben sugerir valores válidos cuando el tipo esperado sea inequívoco.

### Alcance incluido

- Hover para `enumerated-type`.
- Hover para `enumerated-value`.
- Completion de valores cuando el tipo esperado es inequívoco.
- SignatureHelp enriquecido con valores enumerados.
- Semantic tokens para valores terminados en `!`.
- Diagnostics conservadores para valor incorrecto con confidence alta.

### Example code targets

```powerscript
dw_1.SaveAs("x.csv", CSV!, true, EncodingUTF8!)
dw_1.RowsMove(1, 1, Primary!, dw_2, 1, Primary!)
dw_1.SetItemStatus(1, "name", Primary!, DataModified!)
mle_1.Alignment = Right!
```

### Expected hover over type

```md
### DWBuffer

Tipo enumerado PowerBuilder.

Selecciona el buffer de filas de un DataWindow sobre el que opera un método.

**Valores conocidos:**
- `Primary!` — buffer principal.
- `Delete!` — buffer de filas eliminadas.
- `Filter!` — buffer de filas filtradas.
```

### Expected hover over value

```md
### Primary!

Valor enumerado de `DWBuffer`.

Buffer principal del DataWindow.

Representa las filas activas que no han sido eliminadas ni filtradas.

**Valor numérico:** `0`
```

### Safety rules

- Do not diagnose if expected type is ambiguous.
- Do not diagnose dynamic calls.
- Do not diagnose values coming from variables, strings or expressions.
- Do not diagnose outside typed contexts.
- Do not perform full catalog lookup per token.
- Use indexes/caches by lookupKey and `enumValueOf`.

### Criterios de cierre verificables

- Hover over `SaveAsType` shows enum type documentation.
- Hover over `CSV!` shows value of `SaveAsType` and meaning.
- Hover over `Primary!` shows value of `DWBuffer` and meaning.
- Completion in `DWBuffer` parameter suggests `Primary!`, `Delete!`, `Filter!`.
- Completion in `Encoding` parameter suggests `EncodingANSI!`, `EncodingUTF8!`, `EncodingUTF16LE!`, `EncodingUTF16BE!`.
- SignatureHelp shows known values for enum parameters.
- Semantic tokens classify enum values without degrading performance.
- Diagnostics only report incompatible enum values when the expected type is unequivocal.

### Docs afectadas

- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md`
- `docs/testing.md`
- `docs/performance-budget.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "completion|hover|signatureHelp|semanticTokens|diagnostics|enumerated|enum"
npm run test:unit -- --grep "catalog|systemCatalog|catalogV2"
```

---

## B364 — Enum catalog real-corpus validation against PFC, STD and public PB repositories
- **Estado:** Open
- **Track:** validation / real corpora / catalog
- **Prioridad:** Alta
- **Depende de:** B362, B363, B336
- **Objetivo:** validar el catálogo de enumerated types/values contra corpus reales PowerBuilder, incluyendo PFC 2025, STD/OrderEntry y otros repositorios públicos PowerBuilder, para detectar gaps, falsos positivos y patrones reales de uso.
- **Razón técnica:** el catálogo debe ser útil en código real. PFC y STD/OrderEntry son corpus grandes y actuales para comprobar indexación, hover, completion, diagnostics y ausencia de ruido masivo.

### Alcance incluido

- Localizar corpus disponibles:
  - `fixtures-local/pfc/2025-Workspace`
  - `fixtures-local/pfc/2025-Solution`
  - `fixtures-local/STD_FC_OrderEntry`
  - equivalent repository helper paths.
- Ejecutar smoke/indexing/performance tests.
- Extraer uso real de valores terminados en `!`.
- Comparar valores usados contra catálogo.
- Clasificar:
  - official known value;
  - curated known value;
  - unconfirmed candidate;
  - textual false positive;
  - out-of-context value.
- Crear fixtures sintéticos solo para gaps confirmados.

### Validation rules

- PFC and STD/OrderEntry are validation corpora, not official sources.
- Do not add unknown values to official catalog without source.
- If corpora are unavailable, perform honest skip and document expected paths.

### Criterios de cierre verificables

- PFC indexes without crash if available.
- STD/OrderEntry indexes without crash if available.
- Enum usage report includes:
  - total detected `!` values;
  - cataloged values;
  - unknown values;
  - candidates;
  - false positives.
- No unknown values are added without source.
- Real gaps become backlog or fixtures.
- Completion/hover/diagnostics do not create massive noise in PFC/STD.
- Performance budget does not regress.

### Comandos esperados

```bash
npm run build:test
npm run test:performance -- --grep "PFC|OrderEntry|STD"
npm run test:unit -- --grep "enumerated|enum|catalog"
```

### Docs afectadas

- `docs/testing.md`
- `docs/performance-budget.md`
- `test/corpora/README.md`
- `test/results/003-real-corpora-baseline.md` if baseline is updated

### Validación esperada

```bash
npm run test:performance -- --grep "PFC|OrderEntry|STD"
npm run test:unit -- --grep "enumerated|enum|catalog"
```

---

## B365 — System catalog query/index hardening v2
- **Estado:** Open
- **Track:** knowledge / catalog performance / query architecture
- **Prioridad:** Alta
- **Depende de:** B357
- **Objetivo:** reforzar `buildIndexes.ts`, `queryService.ts` y `SystemCatalog.ts` para evitar filtros y combinaciones costosas conforme crecen manual/generated/enumerated/visual/runtime catalog slices.
- **Razón técnica:** el query service ya usa `byLookupKey` y `byDomain`, pero owner-context queries todavía pueden combinar listas grandes, `resolveLanguageSymbol()` depende del orden de slices y futuras enum queries necesitan índices específicos.

### Alcance incluido

- Añadir índices compuestos cuando aporten valor:
  - `byDomainAndLookupKey`
  - `byKindAndLookupKey`
  - `byEnumValueOf`
  - `byOwnerTypeAndDomain` or equivalent if needed
- Refactorizar `findEntriesInDomain()` para usar índice compuesto.
- Refactorizar enum queries para no hacer scans de dominio.
- Refactorizar owner-context queries para aprovechar `byOwnerType`/composite index.
- Mover accesos directos a `PB_SYSTEM_SYMBOL_REGISTRY.indexes` desde `SystemCatalog.ts` hacia `queryService.ts`.
- Definir prioridad explícita para `resolveLanguageSymbol()`.
- Congelar o tratar como readonly buckets de índices si es viable.
- Mantener registry creation cheap and deterministic.

### Suggested query priority for `resolveLanguageSymbol()`

```txt
reserved-word
keyword
pronoun
datatype
system-type
system-global
enumerated-type
enumerated-value
operator
property
constant
```

The final order can differ if tests prove a better PowerBuilder user experience, but it must be explicit and documented.

### Required query APIs

```ts
listSystemSymbolsByDomain(domain): readonly PbSystemSymbolEntry[];
isKnownSystemOwnerType(name): boolean;
findEntriesByDomainAndLookupKey(domain, name): readonly PbSystemSymbolEntry[];
findEntriesByKindAndLookupKey(kind, name): readonly PbSystemSymbolEntry[];
listValuesForEnumeratedType(typeName): readonly PbSystemSymbolEntry[];
resolveEnumValueForExpectedType(valueName, typeName): PbSystemSymbolEntry | undefined;
resolveLanguageSymbol(name, options?): PbSystemSymbolEntry | undefined;
```

### Performance rules

- No full catalog scan in hover/completion/signatureHelp/semanticTokens/diagnostics.
- Owner-specific member completion must not concatenate all object/datawindow functions when specific owner types are available.
- Enum value resolution by expected type must use index lookup.
- `SystemCatalog` remains facade; heavy logic stays in `queryService`/indexes.

### Criterios de cierre verificables

- `findEntriesInDomain()` uses `byDomainAndLookupKey` or equivalent.
- Enum queries use `byEnumValueOf` or equivalent.
- Owner-context member queries use owner indexes where possible.
- `resolveLanguageSymbol()` has explicit documented priority.
- `SystemCatalog.ts` no longer directly accesses registry indexes except justified exceptional cases.
- Index buckets are treated as readonly and not mutated by consumers.
- Tests cover index/query behavior.
- Performance/hot-path tests remain green.

### Docs afectadas

- `docs/architecture.md`
- `docs/performance-budget.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "catalog|systemCatalog|queryService|indexes|catalogConsistency"
npm run test:unit -- --grep "completion|hover|signatureHelp|semanticTokens|diagnostics"
npm run test:unit -- --grep "hotPath|performance|allocation"
```

---

# Final checklist for Copilot agents

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
