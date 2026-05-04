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

# L5.2 — Enumerated Catalog / DataWindow Knowledge

# 6. Current execution focus recomendado

## Fase activa 

01. B320 — DataWindow expression/property official catalog
02. B327 — DataWindow constants and property path catalog
03. B342 — Extract proven symbol heuristics from plugin_old
04. B344 — DataWindow binding edge cases from plugin_old
05. B354 — Server runtime orchestration decomposition

## Siguiente fase 

06. B292 — PowerBuilder preprocessor / conditional patterns investigation
07. B301 — Agent context budget enforcement
08. B299 — Agent execution dry-run contract
09. B300 — Agent validation receipt
10. B302 — Agent-safe documentation updater policy
11. B303 — Agent task replay from repro/support bundle

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
