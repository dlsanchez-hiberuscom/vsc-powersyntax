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
- **Estado:** Superseded
- **Track:** knowledge / catalog
- **Prioridad:** Media
- **Superseded by:** B366, B367
- **Motivo:** el enriquecimiento del catálogo generated queda absorbido por `B366 — Official Appeon scraper bugfixes and structural enrichment v2` y `B367 — Generated catalog as complete official source v2`.
- **Acción:** no abrir esta spec como trabajo independiente salvo que aparezca una necesidad concreta no cubierta por B366/B367.

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

## B354 — Server runtime orchestration decomposition
- **Estado:** Open
- **Track:** runtime architecture
- **Prioridad:** Alta
- **Depende de:** B267, B274
- **Trazabilidad:** B347
- **Objetivo:** separar orquestación runtime de LSP wiring sin cambiar scheduling/backpressure/memory policies.
- **Razón técnica:** `server.ts` aún administra scheduler, readiness, memory pressure, serving cache, persistence y journals en el mismo archivo de handlers.
- **Criterios de cierre verificables:** policies siguen centralizadas, stats/health/status conservan payloads, build/legacy no entran al hot path y PFC/OrderEntry no muestran loops ni crashes.
- **Docs afectadas:** `docs/architecture.md`, `docs/performance-budget.md`, `docs/testing.md`.
- **Validación esperada:** scheduler/backpressure/memory/runtimeHealth/statusBar tests, performance gate y real-corpus smoke.

---

# L5.1 — Official Generated Catalog / Source-of-truth / Localization

## B366 — Official Appeon scraper bugfixes and structural enrichment v2
- **Estado:** Open
- **Track:** knowledge / generator / official catalog
- **Prioridad:** Alta
- **Depende de:** B357, B365, B339
- **Objetivo:** corregir fallos actuales del scraper oficial de Appeon y extraer la máxima estructura semántica aprovechable desde la documentación oficial: `appliesTo` real, múltiples syntaxes separadas, argumentos estructurados, return values, obsolete/deprecated, event IDs, return codes, usage notes, object metadata, reserved word metadata y enums.
- **Razón técnica:** el generated actual ya extrae nombres, summaries, signatures, appliesTo, ownerTypes y sourceUrl, pero todavía pierde información oficial útil y tiene algunos fallos estructurales. Las páginas oficiales contienen secciones reutilizables como `Description`, `Syntax`, `Argument`, `Return value`, `Usage`, `Event ID`, `Return Values`, `Properties`, `Events` y `Functions`.

### Relación con enumerated datatypes

- B366 prepara infraestructura general de scraping estructural.
- La cobertura oficial completa de `enumerated-types` y `enumerated-values` quedó cerrada en B361 (`specs/375-official-enumerated-datatype-extractor-and-coverage-rail`).
- B366 no debe reabrir B361 ni sustituir su rail específico de enumerados.

### Fallos actuales que debe corregir

1. **`Applies to` contaminado por links internos**
   - Fallo observado: `extractAppliesToLabels()` prioriza `<a>` antes que párrafos/tablas.
   - Riesgo: captura enlaces como `SetItem` en vez del `Applies to` real.
   - Caso obligatorio: `SetItemDate` no debe generar `appliesTo: ["SetItem"]`; si la página oficial indica Web DataWindow server component, no debe clasificarse como DataWindow/DataStore normal.

2. **Múltiples syntaxes concatenadas en una sola firma**
   - Fallo observado: se normaliza todo el `<pre>` antes de dividir líneas.
   - Caso obligatorio: `OLEActivate` debe generar dos signatures separadas, una con `integer column` y otra con `string column`.

3. **Obsolete/deprecated insuficiente**
   - Fallo observado: solo se detecta `obsolete` en el título.
   - Debe detectar también `Obsolete method`, `Obsolete function`, `should not be used`, `will be removed`, `obsolete values`.
   - Debe extraer `obsoleteMessage`, `replacement` y `risk: 'deprecated'`.
   - Caso obligatorio: `SetItemDate` debe marcarse como obsolete y deprecated.

4. **Faltan return values**
   - Fallo observado: no se extrae la sección `Return value`.
   - Casos obligatorios:
     - `ApplyTheme` debe extraer `returnType: "Integer"` y descripción de retorno.
     - `AddItemArray` debe extraer `returnType: "Long"` y descripción de retorno.

5. **Faltan argumentos estructurados**
   - Fallo observado: los parámetros solo viven como texto dentro de `signature.label`.
   - Caso obligatorio: `AddItemArray` debe extraer `ParentItemHandle`, `ParentItemPath` y `Key` con documentación.

6. **Faltan Event IDs**
   - Fallo observado: eventos como `BeginDrag` solo generan firma.
   - Caso obligatorio: `BeginDrag` debe extraer `pbm_lvnbegindrag` para `ListView` y `pbm_tvnbegindrag` para `TreeView`.

7. **Faltan syntax groups en eventos**
   - Fallo observado: se pierden grupos tipo `Syntax 1`, `Syntax 2`, `Syntax 3`.
   - Caso obligatorio: `DragDrop` debe conservar grupos para `ListBox/PictureListBox/ListView/Tab`, `TreeView` y `windows and other controls`.

8. **Summaries genéricos en system object datatypes**
   - Fallo observado: summaries como `Official documented PowerBuilder system object/control datatype X`.
   - Caso obligatorio: `PDFDocumentProperties` debe extraer summary específico, `baseType: "PDFModel"` y propiedades principales como `Application`, `Author`, `Keywords`, `Subject`, `Title`.

9. **Reserved words con `*` pierden metadata estructural**
   - Fallo observado: `canBeFunctionName` solo acaba en summary textual.
   - Debe producir `reservedWordCanBeFunctionName: true` e `identifierPolicy: 'allowed-as-function-name'`.

10. **Generated actual mezcla scraping, coverage, rendering y heurísticas**
    - Debe dividirse el script en módulos.
    - El entrypoint debe orquestar; las reglas deben vivir en módulos separados.

### Información máxima a extraer por tipo de página

#### PowerScript functions

Extraer:

```txt
title
canonicalName
description
documentation
appliesTo
ownerTypes
syntaxGroups
signatures
parameters
returnType
returnDocumentation
returnsNullOnNullArgument
usageNotes
limitations
examplesAvailable
seeAlso
obsolete
obsoleteMessage
replacement
risk
sourceUrl
```

#### DataWindow methods

Extraer:

```txt
title
canonicalName
description
appliesTo DataWindow type
ownerTypes
syntaxGroups
signatures
parameters
returnType
returnDocumentation
usageNotes
obsolete
obsoleteMessage
replacement
legacyWebDataWindowFlag
dataWindowContextOnly
seeAlso
sourceUrl
```

#### PowerScript events

Extraer:

```txt
title
eventName
syntaxGroup
syntaxDescription
description
appliesTo
ownerTypes
eventId
eventIds
parameters
eventReturnType
eventReturnCodes
usageNotes
examplesAvailable
seeAlso
obsolete
obsoleteMessage
sourceUrl
```

#### Objects and Controls

Extraer:

```txt
name
description
documentation
category
baseType
derivedFrom
properties
events
functions
inheritedProperties
inheritedFunctions
obsolete
obsoleteMessage
sourceUrl
```

#### Reserved words / keywords

Extraer:

```txt
name
category
summary
reservedWordCanBeFunctionName
identifierPolicy
sourceUrl
```

#### Enumerated datatypes / values

Extraer cuando aplique:

```txt
enumeratedType
enumeratedValues
enumNumericValue
enumValueMeaning
obsolete
obsoleteMessage
replacement
sourceUrl
```

### Modelo de metadata objetivo

```ts
type PbSystemSymbolParameter = {
    name: string;
    type?: string;
    documentation?: string;
    optional?: boolean;
    byRef?: boolean;
};

type PbSystemSymbolSignature = {
    label: string;
    parameters?: readonly PbSystemSymbolParameter[];
    returnType?: string;
};

type PbSystemSymbolEntryDraft = {
    documentation?: string;
    returnType?: string;
    returnDocumentation?: string;
    returnsNullOnNullArgument?: boolean;
    usageNotes?: readonly string[];
    limitations?: readonly string[];
    examplesAvailable?: boolean;
    seeAlso?: readonly string[];

    eventId?: string;
    eventIds?: readonly {
        id: string;
        ownerTypes?: readonly string[];
    }[];
    eventReturnType?: string;
    eventReturnCodes?: readonly {
        value: string;
        meaning: string;
    }[];
    syntaxGroup?: string;
    syntaxDescription?: string;

    baseType?: string;
    properties?: readonly string[];
    functions?: readonly string[];
    events?: readonly string[];

    reservedWordCanBeFunctionName?: boolean;
    identifierPolicy?: 'reserved' | 'allowed-as-function-name' | 'literal' | 'operator';

    enumValues?: readonly string[];
    enumValueOf?: string;
    enumNumericValue?: number;
    enumValueMeaning?: string;
};
```

### Refactor esperado del script

```txt
scripts/catalog/
  generate_official_function_catalog.cjs

  appeon/
    fetch.cjs
    html.cjs
    sections.cjs
    powerScriptFunctions.cjs
    powerScriptEvents.cjs
    powerScriptStatements.cjs
    dataWindowMethods.cjs
    objectsAndControls.cjs
    reservedWords.cjs
    enumeratedDatatypes.cjs

  rules/
    ownerTypeRules.cjs
    datatypeRules.cjs
    keywordRules.cjs
    statementRules.cjs
    obsoleteRules.cjs

  render/
    renderCatalog.cjs
    renderCoverage.cjs
    renderParsingArtifacts.cjs

  coverage/
    coverage.cjs
```

### Criterios de cierre verificables

- `SetItemDate` se marca obsolete/deprecated y no queda como DataWindow/DataStore normal si la fuente indica Web DataWindow server component.
- `OLEActivate` genera signatures separadas.
- `ApplyTheme` incluye return info y usage notes.
- `AddItemArray` incluye parámetros estructurados y return info.
- `BeginDrag` incluye Event IDs.
- `DragDrop` conserva syntax groups.
- `PDFDocumentProperties` incluye summary específico, `baseType` y propiedades.
- Reserved words con `*` tienen metadata estructural.
- El scraper no extrae `appliesTo` desde breadcrumbs, navegación, `See also` ni links auxiliares.
- Hay tests/snapshots de cada caso obligatorio.
- Output determinista.

### Docs afectadas

- `docs/architecture.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/testing.md`
- `docs/rules-catalog.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "generator|scraper|official|catalog|provenance"
npm run test:unit -- --grep "ApplyTheme|AddItemArray|SetItemDate|OLEActivate|BeginDrag|DragDrop|PDFDocumentProperties|reserved"
```

---

## B370 — Generated catalog regression fixtures and extraction quality gate
- **Estado:** Open
- **Track:** knowledge / generator / regression gate
- **Prioridad:** Alta
- **Depende de:** B366
- **Relacionada con:** B367
- **Objetivo:** crear una suite de fixtures/snapshots que proteja el scraper oficial frente a regresiones de extracción, cambios HTML de Appeon y errores de heurística.
- **Razón técnica:** cuando el generated se convierta en fuente oficial primaria o semi-primaria, cualquier bug del scraper puede contaminar hover, completion, diagnostics y owner resolution. Necesitamos fixtures estables por página representativa.

### Fixtures obligatorios

```txt
PowerScript functions:
  ApplyTheme_func.html
  additemarray_func.html

DataWindow methods:
  dwmeth_SetItemDate.html
  dwmeth_OLEActivate.html

Events:
  beginDrag_event.html
  dragDrop_event.html

Objects and Controls:
  PDFDocumentProperties_object.html

Language:
  xREF_80481_Reserved_words.html
```

### Qué debe validar cada fixture

```txt
ApplyTheme:
  returnType
  returnDocumentation
  usageNotes
  limitations

AddItemArray:
  signatures separadas
  parameters
  returnType

SetItemDate:
  obsolete
  deprecated risk
  Web DataWindow classification
  no appliesTo contaminado con SetItem

OLEActivate:
  two signatures

BeginDrag:
  syntax groups
  event IDs
  ownerTypes

DragDrop:
  three syntax groups
  event IDs
  owner mappings

PDFDocumentProperties:
  summary específico
  baseType
  properties

Reserved words:
  asterisk metadata
  identifierPolicy
```

### Criterios de cierre verificables

- Fixtures HTML oficiales guardados en tests o snapshots permitidos.
- Tests no dependen de red.
- Se compara extractor output contra expected compact JSON.
- Si cambia HTML oficial, el diff es revisable.
- El gate falla si reaparece un fallo conocido.
- El gate forma parte de `build:test` o de un comando generator CI/local documentado.

### Docs afectadas

- `docs/testing.md`
- `docs/architecture.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "scraper|generator|fixture|official|regression"
```

---

## B367 — Generated catalog as complete official source v2
- **Estado:** Open
- **Track:** knowledge / generated catalog / source of truth
- **Prioridad:** Alta
- **Depende de:** B366, B370, B365
- **Objetivo:** cambiar el generated oficial para que represente el catálogo oficial completo extraído de Appeon, no solo el delta no cubierto por `manual-core`.
- **Razón técnica:** el script actual usa `manual-core` como cobertura previa y omite entradas oficiales ya cubiertas manualmente. Para decidir generated vs manual curated, primero necesitamos un generated oficial completo, medible y comparable.

### Fallo actual a corregir

El script actual usa manual como filtro:

```ts
const manualEntries = listSystemSymbolsByDataset('manual-core');
const globalCoverage = buildCoverageMap(manualGlobalEntries, 'global-functions');

if (globalCoverage.has(coverageKey)) {
    continue;
}
```

Esto convierte `generated.generated.ts` en un dataset de huecos, no en una fuente oficial completa.

### Decisión objetivo

Separar:

```txt
generated official complete catalog
manual curated gaps/enrichments/overrides
coverage report
runtime merged registry
```

### Alcance incluido

- Añadir modo `complete`.
- Mantener modo `gap-fill` solo si se necesita transición.
- Por defecto, el modo futuro debe ser `complete`.
- Generar todo lo oficial extraíble:
  - global functions
  - object functions
  - DataWindow functions
  - system events
  - statements
  - keywords
  - reserved words
  - datatypes
  - system object datatypes
  - enumerated types/values si B361/B366 lo permite.
- Hacer que `officialCoverage.generated.ts` sea reporte comparativo, no filtro de generación.
- Añadir `generatedCompleteness.generated.ts`.

### Salidas esperadas

```txt
generated.generated.ts
ownerTypes.generated.ts
provenance.generated.ts
officialCoverage.generated.ts
generatedCompleteness.generated.ts
```

### Criterios de cierre verificables

- El generated incluye entradas oficiales aunque exista manual equivalente.
- El coverage no decide qué se genera.
- Hay modo `complete`.
- Hay diff/snapshot de generated completo.
- Registry no devuelve duplicados en runtime gracias a merge policy o query dedupe explícita.
- Docs explican diferencia entre generated official, manual curated y merged registry.

### Docs afectadas

- `docs/architecture.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/testing.md`
- `docs/rules-catalog.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "generator|generated|officialCoverage|catalogConsistency"
npm run test:unit -- --grep "registry|datasets|merge|duplicates"
```

---

## B368 — Manual curated overlays, gaps and overrides policy
- **Estado:** Open
- **Track:** knowledge / manual curated governance
- **Prioridad:** Alta
- **Depende de:** B357, B367, B339
- **Objetivo:** redefinir `manual/` para que no compita silenciosamente con `generated`, sino que actúe como capa explícita de gaps, enrichments, overrides y candidates.
- **Razón técnica:** si generated pasa a ser el catálogo oficial completo, manual debe aportar curación humana donde la extracción oficial no llega o necesita corrección.

### Estructura objetivo

```txt
manual/
  curated/
    gaps/
      globalFunctions.ts
      objectFunctions.ts
      dataWindowFunctions.ts
      systemEvents.ts
      dataWindowEvents.ts
      systemObjectDatatypes.ts

    enrichments/
      generatedFunctionEnrichments.ts
      generatedEventEnrichments.ts
      generatedDatatypeEnrichments.ts
      generatedStatementEnrichments.ts

    overrides/
      generatedFunctionOverrides.ts
      generatedEventOverrides.ts
      generatedOwnerTypeOverrides.ts
      generatedDatatypeOverrides.ts

    candidates/
      corpusCandidates.ts
      pluginOldCandidates.ts
```

### Definiciones

```txt
gap:
  Símbolo no cubierto por generated oficial.

enrichment:
  Metadata adicional sobre generated sin cambiar identidad base.

override:
  Corrección explícita de generated.

candidate:
  Hallazgo no oficial procedente de PFC/STD/plugin_old/corpus.
```

### Evidencia ya disponible desde B364

- `B364` dejó familias corpus-driven que no deben promocionarse automáticamente y que deben aterrizar como `gap` o `candidate` con evidencia explícita: `contemporarymenu!`, `contemporarytoolbar!`, `HourGlass!`, `OK!`, `Information!`, `Exclamation!`, `ansi!`, `swiss!`, `Exclude!`.
- Los cuatro casos `out-of-context` detectados en PFC (`stylebox!`, `stylelowered!`, `styleraised!`, `styleshadowbox!`) deben servir como fixtures negativos compactos cuando `B370` abra el gate de extracción/regresión.

### Metadata obligatoria

```ts
type ManualCuratedOverlay = {
    targetId?: string;
    targetKey?: {
        domain: string;
        kind: string;
        namespace: string;
        invocation: string;
        name: string;
        ownerTypes?: readonly string[];
    };
    mode: 'gap' | 'enrichment' | 'override' | 'candidate';
    reason: string;
    evidence: readonly string[];
    sourceUrl?: string;
    reviewedBy?: string;
};
```

### Separación respecto a localización

- `manual/curated/` contiene curación técnica: gaps, enrichments, overrides y candidates.
- `localization/es/` contiene traducción y presentación en español.
- No guardar traducciones españolas dentro de `manual/curated/` salvo que sean explicaciones técnicas curadas no derivadas directamente del texto oficial.

### Criterios de cierre verificables

- Manual gaps no duplican generated.
- Enrichments se fusionan, no crean entradas competidoras.
- Overrides declaran razón y evidencia.
- Candidates no entran en hot path.
- Consistency falla ante duplicados manual/generated sin política.
- Registry merge policy queda documentada y testeada.

### Docs afectadas

- `docs/architecture.md`
- `docs/rules-catalog.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "catalog|manual|curated|overlay|override|enrichment|gap|consistency"
npm run test:unit -- --grep "registry|datasets|merge"
```

---

## B375 — Generated localization compatibility with regenerated catalog IDs
- **Estado:** Open
- **Track:** localization / generated compatibility / catalog governance
- **Prioridad:** Media-Alta
- **Depende de:** B371, B367
- **Objetivo:** garantizar que los overlays de localización sobreviven a regeneraciones del catálogo o fallan con mensajes claros cuando cambian IDs o claves de destino.
- **Razón técnica:** si la localización se enlaza por `entry.id`, una mejora del generated puede cambiar IDs si cambian domain/kind/namespace/invocation/name/ownerTypes. El sistema debe detectar esos cambios y ofrecer una ruta de migración segura.

### Alcance incluido

- Añadir test/snapshot de IDs localizados.
- Añadir reporte de overlays rotos tras regenerar generated.
- Soportar `targetKey` como fallback si `targetId` cambia pero la identidad semántica sigue siendo localizable.
- Añadir script opcional de migración de localization IDs.
- Documentar cuándo usar `targetId` y cuándo usar `targetKey`.

### Reglas recomendadas

```txt
targetId:
  usar cuando el ID es estable y la entry ya está consolidada.

targetKey:
  usar cuando la entry procede de generated en evolución o puede cambiar ownerTypes.

Ambos:
  targetId preferido; targetKey fallback de recuperación.
```

### Criterios de cierre verificables

- Una regeneración de generated no rompe silenciosamente localizaciones.
- Overlays sin destino válido fallan en consistency o aparecen en reporte claro.
- Existe fixture de ID cambiado que demuestra recuperación por targetKey.
- Existe documentación de migración.
- No hay coste en hot path por resolver migraciones; la resolución se preindexa.

### Docs afectadas

- `docs/rules-catalog.md`
- `docs/testing.md`
- `docs/architecture.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "localization|generated|ids|compatibility|consistency"
```

---

# L5.2 — Enumerated Catalog / DataWindow Knowledge

## B378 — AI PowerBuilder context pack and token budget contract
- **Estado:** Open
- **Track:** AI supportability / developer workflow / context budget
- **Prioridad:** Alta
- **Depende de:** B301, B365
- **Relacionada con:** B376, B377
- **Objetivo:** crear un context pack compacto, estable y versionado para que una IA pueda programar en PowerBuilder respetando arquitectura, estilo, validación y reglas del proyecto sin cargar documentación masiva.
- **Razón técnica:** la IA funciona mejor con contexto breve, estable y accionable que con documentos extensos repetidos en cada tarea. Un context pack reduce tokens, evita drift y estandariza cómo los agentes deben trabajar con PowerBuilder y con este plugin.

### Alcance incluido

- Crear documento compacto:

```txt
docs/ai-context/powerbuilder-plugin-context.md
```

- Opcionalmente añadir versión reducida o referencia desde:

```txt
AGENTS.md
.github/copilot-instructions.md
```

- Incluir solo información estable y de alto valor:
  - arquitectura general del plugin;
  - reglas PowerBuilder del proyecto;
  - reglas de SQL y DataWindow;
  - rutas importantes;
  - comandos de validación;
  - herramientas read-only disponibles;
  - flujo recomendado para tareas IA;
  - qué no hacer;
  - specs activas actuales;
  - reglas de documentación.

### Contenido mínimo requerido

```md
# AI context — PowerBuilder plugin

## Mission
## Architecture boundaries
## PowerBuilder coding rules
## SQL formatting rules
## DataWindow rules
## Catalog/generated/manual/localization rules
## Validation commands and tools
## Recommended AI workflow
## Do not do
## Active focus
## Documentation ownership
```

### Reglas estrictas

- El context pack no debe duplicar documentación larga.
- El context pack debe enlazar a documentos propietarios cuando haga falta detalle.
- El context pack debe caber en un prompt pequeño.
- El context pack no debe incluir generated/manual catalog completo.
- El context pack debe mantenerse actualizado cuando cambien arquitectura, reglas de validación o foco activo.
- Si hay conflicto entre context pack y documentación propietaria, la documentación propietaria gana y debe corregirse el context pack.

### Criterios de cierre verificables

- Existe `docs/ai-context/powerbuilder-plugin-context.md`.
- El documento incluye reglas PowerBuilder críticas.
- El documento incluye comandos/tools recomendadas para IA.
- El documento referencia `workspace-check` y `object-check` cuando B376/B377 estén disponibles.
- El documento indica que no se debe cargar generated/manual completo en prompts.
- El documento enlaza a docs propietarias en vez de duplicarlas.
- Tests/checks documentales detectan si el archivo desaparece o queda sin referencias.

### Docs afectadas

- `docs/ai-strategy.md`
- `docs/ai-orchestrator.md`
- `docs/developer-workflows.md`
- `docs/spec-driven-development.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `AGENTS.md` si existe.

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "docs|ai-context|context-budget|documentation"
```

---

## B379 — Explain diagnostic tool and suggested safe fix contract
- **Estado:** Open
- **Track:** diagnostics / AI supportability / safe fixes
- **Prioridad:** Alta
- **Depende de:** B376, B377, B365
- **Objetivo:** añadir una tool/API read-only para explicar un diagnostic concreto con contexto mínimo, reason code, evidencia, scope, riesgo y posible fix seguro si existe.
- **Razón técnica:** para ahorrar tokens, una IA no debería necesitar leer archivos completos para entender un error. Debe poder pedir explicación estructurada de un diagnostic concreto y recibir solo la evidencia necesaria para decidir una corrección segura.

### Alcance incluido

- Añadir read-only tool:

```ts
| 'explain-diagnostic'
```

- Añadir comando:

```txt
PowerBuilder: Explain Diagnostic at Cursor
powerbuilder.explainDiagnostic
```

- Añadir método público:

```ts
explainDiagnostic(request: ApiExplainDiagnosticRequest): Promise<ApiExplainDiagnosticReport>;
```

- Integrar con diagnostics existentes, current-object-context y safe-edit-plan cuando aplique.
- No aplicar fixes automáticamente.
- No modificar archivos.

### Descriptor de tool

```ts
{
  name: 'explain-diagnostic',
  description: 'Explica un diagnostic PowerBuilder concreto con evidencia mínima, reason code, scope y posible fix seguro si existe.',
  command: 'powerbuilder.explainDiagnostic',
  requestSchema: 'ApiExplainDiagnosticRequest',
  responseSchema: 'ApiExplainDiagnosticReport',
  usesActiveEditorFallback: true,
}
```

### Request

```ts
export interface ApiExplainDiagnosticRequest {
  uri?: string;
  line?: number;
  character?: number;
  code?: string;
  diagnosticIndex?: number;
  includeObjectContext?: boolean;
  includeSafeFixPlan?: boolean;
  maxEvidence?: number;
  maxExcerptLines?: number;
}
```

### Report

```ts
export interface ApiExplainDiagnosticReport {
  schemaVersion: '1.0.0';
  generatedAt: string;
  apiVersion: string;

  available: boolean;
  reason?: string;

  diagnostic?: {
    code?: string;
    message: string;
    severity: 'error' | 'warning' | 'info' | 'hint';
    uri: string;
    line: number;
    character: number;
  };

  explanation?: {
    summary: string;
    reasonCode?: string;
    area:
      | 'parser'
      | 'semantic'
      | 'catalog'
      | 'datawindow'
      | 'sql'
      | 'lifecycle'
      | 'unused'
      | 'shadowing'
      | 'unknown';
    confidence: 'high' | 'medium' | 'low';
    whyItMatters?: string;
  };

  evidence: Array<{
    kind: 'source-excerpt' | 'symbol' | 'scope' | 'catalog' | 'datawindow' | 'dependency' | 'rule';
    label: string;
    detail?: string;
    uri?: string;
    line?: number;
    character?: number;
  }>;

  safeFix?: {
    available: boolean;
    kind?:
      | 'remove-declaration'
      | 'rename-symbol'
      | 'add-reference'
      | 'adjust-signature'
      | 'replace-enum-value'
      | 'update-datatype'
      | 'manual-review';
    confidence?: 'high' | 'medium' | 'low';
    blocked?: boolean;
    blockedReasons?: string[];
    planSummary?: string;
  };

  recommendedActions: string[];
}
```

### Reglas estrictas

- Read-only.
- No aplicar cambios.
- No generar edits directamente salvo que se integren como safe-edit-plan read-only.
- No leer todo el workspace si el diagnostic está en un documento ya indexado.
- Usar active editor fallback solo si no se pasa `uri`.
- Si hay varios diagnostics en la posición, devolver el más cercano o razón clara de ambigüedad.
- Respetar `maxEvidence` y `maxExcerptLines`.
- Marcar `confidence` baja cuando la explicación dependa de heurísticas.

### Casos mínimos

```txt
unused-variable
shadowing
unresolved-symbol
ambiguous-call
obsolete-symbol
enum-value-not-valid-for-expected-type
datawindow-binding-unresolved
dynamic-sql-risk
parser-error-near-token
```

### Criterios de cierre verificables

- `ApiReadOnlyToolName` incluye `explain-diagnostic`.
- `READ_ONLY_TOOL_DESCRIPTORS` incluye `explain-diagnostic`.
- `VscPowerSyntaxApi` expone `explainDiagnostic`.
- El contrato público incluye schemas nuevos.
- El comando `powerbuilder.explainDiagnostic` existe.
- Explica diagnostics de variable no usada con evidencia mínima.
- Explica unresolved symbol con scope/candidates si existen.
- Explica enum value incompatible si B360-B363 están implementadas.
- No modifica archivos.
- Tests cubren diagnostic inexistente, diagnóstico único, múltiples diagnostics en posición y truncado.

### Docs afectadas

- `docs/developer-workflows.md`
- `docs/ai-orchestrator.md`
- `docs/testing.md`
- `docs/rules-catalog.md`
- `docs/backlog.md`
- `docs/current-focus.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "explain-diagnostic|diagnostics|safeFix|publicApi|readOnlyTool"
```

---

## B380 — Explain system symbol and catalog lookup tool for AI
- **Estado:** Open
- **Track:** catalog / AI supportability / hover-signatureHelp
- **Prioridad:** Alta
- **Depende de:** B367, B368, B371, B365
- **Relacionada con:** B335, B376
- **Objetivo:** añadir una tool/API read-only para explicar un símbolo del catálogo PowerBuilder sin pasar generated/manual completos al prompt.
- **Razón técnica:** una IA necesita saber qué significa un símbolo PowerBuilder, qué signatures tiene, qué ownerTypes aplican, si está obsoleto, de dónde viene y cómo se documenta en español si existe. Pasar el catálogo completo consume demasiados tokens y aumenta el riesgo de errores.

### Alcance incluido

- Añadir read-only tool:

```ts
| 'explain-system-symbol'
```

- Añadir comando opcional:

```txt
PowerBuilder: Explain System Symbol
powerbuilder.explainSystemSymbol
```

- Añadir método público:

```ts
explainSystemSymbol(request: ApiExplainSystemSymbolRequest): Promise<ApiExplainSystemSymbolReport>;
```

- Resolver símbolos desde catálogo merged runtime:
  - generated official;
  - manual curated gaps/enrichments/overrides;
  - localization/es si se solicita;
  - enums cuando existan;
  - ownerTypes si aplica.

### Descriptor de tool

```ts
{
  name: 'explain-system-symbol',
  description: 'Explica un símbolo del catálogo PowerBuilder con signatures, ownerTypes, provenance, localización y warnings sin cargar el catálogo completo.',
  command: 'powerbuilder.explainSystemSymbol',
  requestSchema: 'ApiExplainSystemSymbolRequest',
  responseSchema: 'ApiExplainSystemSymbolReport',
  usesActiveEditorFallback: true,
}
```

### Request

```ts
export interface ApiExplainSystemSymbolRequest {
  name?: string;
  uri?: string;
  line?: number;
  character?: number;
  ownerType?: string;
  domain?: string;
  kind?: string;
  locale?: 'en' | 'es';
  includeSignatures?: boolean;
  includeParameters?: boolean;
  includeEnumValues?: boolean;
  includeProvenance?: boolean;
  includeConflicts?: boolean;
  maxCandidates?: number;
  maxSignatures?: number;
  maxEnumValues?: number;
}
```

### Report

```ts
export interface ApiExplainSystemSymbolReport {
  schemaVersion: '1.0.0';
  generatedAt: string;
  apiVersion: string;

  available: boolean;
  reason?: string;
  query: ApiExplainSystemSymbolRequest;

  resolution: {
    state: 'resolved' | 'ambiguous' | 'unresolved';
    candidateCount: number;
    selectedId?: string;
    confidence: 'high' | 'medium' | 'low';
  };

  symbol?: {
    id?: string;
    name: string;
    normalizedName?: string;
    domain?: string;
    kind?: string;
    category?: string;
    ownerTypes?: readonly string[];
    appliesTo?: readonly string[];
    summary?: string;
    documentation?: string;
    obsolete?: boolean;
    obsoleteMessage?: string;
    replacement?: string;
    risk?: string;
    sourceUrl?: string;
    authority?: 'official' | 'curated' | 'generated' | 'project' | 'workspace' | 'custom';
  };

  signatures?: Array<{
    label: string;
    returnType?: string;
    parameters?: Array<{
      name: string;
      type?: string;
      documentation?: string;
    }>;
  }>;

  enumInfo?: {
    enumValueOf?: string;
    enumValues?: readonly string[];
    enumNumericValue?: number;
    enumValueMeaning?: string;
  };

  candidates?: Array<{
    id?: string;
    name: string;
    domain?: string;
    kind?: string;
    ownerTypes?: readonly string[];
    summary?: string;
    sourceUrl?: string;
  }>;

  findings: Array<{
    code: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    detail?: string;
  }>;

  recommendedActions: string[];
}
```

### Reglas estrictas

- No devolver catálogos completos.
- Respetar `maxCandidates`, `maxSignatures` y `maxEnumValues`.
- Usar locale español solo para textos de presentación, nunca para nombres reales del lenguaje.
- No traducir signatures, datatypes, enum values ni function names.
- Si hay ambigüedad, devolver candidates compactos y no elegir con confidence alta.
- No hacer full-catalog scans en hot path; usar índices existentes.
- Si se usa active editor fallback, resolver símbolo bajo cursor con contexto.

### Casos mínimos

```txt
ApplyTheme
AddItemArray
SetItemDate
OLEActivate
BeginDrag
JSONParser
HTTPClient
RESTClient
DWBuffer
Primary!
SaveAsType
CSV!
EncodingUTF8!
```

### Criterios de cierre verificables

- `ApiReadOnlyToolName` incluye `explain-system-symbol`.
- `READ_ONLY_TOOL_DESCRIPTORS` incluye `explain-system-symbol`.
- `VscPowerSyntaxApi` expone `explainSystemSymbol`.
- El contrato público incluye schemas nuevos.
- La tool resuelve símbolos generated/manual merged sin duplicar results.
- La tool devuelve documentación española si existe overlay y `locale: 'es'`.
- La tool cae a texto oficial si no existe localización.
- La tool respeta límites de candidates/signatures/enumValues.
- Tests cubren símbolo resuelto, símbolo ambiguo, símbolo inexistente, enum type, enum value y fallback de idioma.

### Docs afectadas

- `docs/developer-workflows.md`
- `docs/ai-orchestrator.md`
- `docs/rules-catalog.md`
- `docs/testing.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "explain-system-symbol|catalog|localization|publicApi|readOnlyTool"
```

---

## B381 — AI task context bundle orchestration tool
- **Estado:** Open
- **Track:** AI supportability / context orchestration / token budget
- **Prioridad:** Media-Alta
- **Depende de:** B376, B377, B379, B380
- **Objetivo:** añadir una tool/API read-only que genere un paquete compacto de contexto para una tarea IA concreta, combinando object-check, current-object-context, safe-edit-plan, dependency-graph y explain diagnostics/symbols según límites de tokens.
- **Razón técnica:** aunque existen tools focales, una IA sigue necesitando orquestar varias llamadas para preparar una tarea. Un bundle compacto evita repetir contexto, reduce tokens y estandariza la entrada antes de modificar código.

### Alcance incluido

- Añadir read-only tool:

```ts
| 'ai-task-context-bundle'
```

- Añadir método público:

```ts
getAiTaskContextBundle(request: ApiAiTaskContextBundleRequest): Promise<ApiAiTaskContextBundle>;
```

- Añadir comando opcional:

```txt
PowerBuilder: Export AI Task Context Bundle
powerbuilder.exportAiTaskContextBundle
```

### Request

```ts
export type ApiAiTaskIntent =
  | 'bug-fix'
  | 'refactor'
  | 'add-feature'
  | 'diagnose'
  | 'catalog-work'
  | 'documentation-update'
  | 'unknown';

export interface ApiAiTaskContextBundleRequest {
  intent?: ApiAiTaskIntent;
  uri?: string;
  objectName?: string;
  line?: number;
  character?: number;
  includeWorkspaceCheck?: boolean;
  includeObjectCheck?: boolean;
  includeSafeEditPlan?: boolean;
  includeDependencyGraph?: boolean;
  includeDiagnosticsExplanation?: boolean;
  includeSystemSymbolExplanations?: boolean;
  maxTokensHint?: number;
  maxDiagnostics?: number;
  maxSymbols?: number;
  maxFiles?: number;
}
```

### Bundle

```ts
export interface ApiAiTaskContextBundle {
  schemaVersion: '1.0.0';
  generatedAt: string;
  apiVersion: string;

  available: boolean;
  reason?: string;

  intent: ApiAiTaskIntent;
  tokenBudget: {
    maxTokensHint?: number;
    estimatedTokens?: number;
    truncated: boolean;
  };

  focus: {
    uri?: string;
    objectName?: string;
    line?: number;
    character?: number;
  };

  summary: string;
  rules: string[];
  context: {
    workspaceCheck?: ApiWorkspaceCheckReport;
    objectCheck?: ApiObjectCheckReport;
    currentObjectContext?: ApiCurrentObjectContext;
    safeEditPlan?: ApiSafeEditPlan;
    dependencyGraph?: ApiPowerBuilderDependencyGraph;
    diagnosticExplanations?: ApiExplainDiagnosticReport[];
    systemSymbolExplanations?: ApiExplainSystemSymbolReport[];
  };

  recommendedWorkflow: string[];
  validationCommands: string[];
  docsToReview: string[];
  omissions: string[];
}
```

### Reglas estrictas

- Read-only.
- No modificar archivos.
- No ejecutar ORCA/build.
- No incluir código completo salvo excerpts pequeños necesarios.
- No incluir generated/manual completo.
- Respetar `maxTokensHint` de forma conservadora.
- Registrar en `omissions` todo lo omitido por límite.
- Preferir summaries y reports estructurados sobre texto largo.
- Usar active editor fallback solo si no se pasa foco explícito.

### Criterios de cierre verificables

- `ApiReadOnlyToolName` incluye `ai-task-context-bundle`.
- `READ_ONLY_TOOL_DESCRIPTORS` incluye `ai-task-context-bundle`.
- `VscPowerSyntaxApi` expone `getAiTaskContextBundle`.
- El contrato público incluye schemas nuevos.
- El bundle puede generarse para active editor.
- El bundle puede generarse para `uri/objectName` explícito.
- El bundle respeta límites y marca truncado.
- El bundle no incluye catálogos completos.
- Tests cubren intent `bug-fix`, `refactor`, `catalog-work`, foco ausente y truncado.

### Docs afectadas

- `docs/ai-orchestrator.md`
- `docs/ai-strategy.md`
- `docs/developer-workflows.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "ai-task-context-bundle|context-budget|publicApi|readOnlyTool"
```

---

# 6. Current execution focus recomendado

## Fase activa 

01. B374 — Spanish catalog localization authoring workflow and coverage gate
02. B375 — Generated localization compatibility with regenerated catalog IDs
03. B378 — AI PowerBuilder context pack and token budget contract
04. B379 — Explain diagnostic tool and suggested safe fix contract
05. B380 — Explain system symbol and catalog lookup tool for AI

## Siguiente fase 

01. B378 — AI PowerBuilder context pack and token budget contract
02. B379 — Explain diagnostic tool and suggested safe fix contract
03. B380 — Explain system symbol and catalog lookup tool for AI
04. B381 — AI task context bundle orchestration 
05. B320 — DataWindow expression/property official catalog
06. B327 — DataWindow constants and property path catalog
07. B342 — Extract proven symbol heuristics from plugin_old
08. B344 — DataWindow binding edge cases from plugin_old
09. B354 — Server runtime orchestration decomposition
10. B292 — PowerBuilder preprocessor / conditional patterns investigation
11. B301 — Agent context budget enforcement
12. B299 — Agent execution dry-run contract
13. B300 — Agent validation receipt
14. B302 — Agent-safe documentation updater policy
15. B303 — Agent task replay from repro/support bundle

## No abrir todavía salvo necesidad real

- Automatización write-enabled avanzada sin `B263`, `B299` y `B300`.
- Nuevas features visuales pesadas sin guardrails claros y preferencia por Tree View frente a Webview cuando baste.
- Nuevos reports grandes sin `B276` y `B301`.
- Nuevos carriles ORCA/PBAutoBuild sin pasar por support matrix, troubleshooting y health.

---

# 7. Backlog derivado

- Mantener `B321` como absorbida por `B366/B367`; no ejecutarla como spec independiente salvo necesidad nueva demostrada.
- Si `B358/B359` vuelven al backlog, reformularlas como classification/enrichment/gaps sobre generated, no como duplicación de system object datatypes.
- Mantener DataWindow como sublenguaje propio y evitar cualquier parser DataWindow como PowerScript normal.
- Mantener ORCA fuera del hot path y detrás de policy/feature flags cuando implique write-enabled o packaging.
- Formalizar en docs la matriz de soporte final tras `B293`.
- Añadir checks de drift documental tras `B316-B317` para evitar backlog/done-log desalineados.
- Mantener la política de localización como overlay de documentación, nunca como duplicación de entries por idioma.
