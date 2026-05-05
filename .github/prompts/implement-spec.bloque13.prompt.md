# BLOQUE 13 — Multi-Audit Final, Symbol System & Catalog Localization Roadmap

> Objetivo: ejecutar una macro auditoría final por varias auditorías independientes y encadenadas para dejar el repo completamente alineado después de los Bloques 1–12, incorporando además una auditoría profunda del sistema de símbolos, enrichments, traducciones/localización del system catalog y plan de acción en backlog.
>
> Este bloque **no implementa nuevas features**. Audita, alinea, clasifica, documenta y propone mejoras accionables basadas en evidencia real del código, documentación, catálogos, overlays de localización y tests.

---

## 0. Alcance fusionado

Este bloque fusiona dos necesidades:

1. **Bloque 13 — Multi-Audit Final, Symbol System Audit, Enrichment Catalog & Translation Roadmap**:
   - documentación completa;
   - estructura real del repo;
   - mapa arquitectura-documentación-código;
   - modernización a patrones nuevos;
   - mejoras arquitectónicas;
   - mejoras generales del sistema;
   - backlog/current-focus/done-log/testing/AI/release alignment.
   - sistema actual de símbolos;
   - modelo canónico de símbolo;
   - ownership/sourceOrigin/confidence;
   - consumers LSP;
   - performance/cache/payload;
   - built-in catalog;
   - traducciones/enrichments;
   - DataWindow symbols;
   - semantic tokens;
   - `docs/symbol-system.md`;
   - roadmap de enrichments/localización.

Además incorpora explícitamente el workflow operativo existente de localización del catálogo:

```text
src/server/knowledge/system/localization/es/
buildCatalogConsistencyReport().localization
artifacts/catalog/catalogLocalizationReport.generated.json
artifacts/catalog/catalogLocalizationReport.generated.md
npm run report:catalog-localization
npm run migrate:catalog-localization-target-ids
npm run migrate:catalog-localization-target-ids -- --write
npm run test:unit -- --grep "catalogLocalization|catalogConsistency"
```

---

## 1. Principios obligatorios

```text
1. Auditar documentación y código real, no asumir que todo está implementado.
2. Ejecutar varias auditorías separadas y con evidencia, no una pasada superficial.
3. Auditar primero el plugin actual en busca de legacy interno, deuda, duplicidad y patrones antiguos.
4. No centrar la auditoría en plugin_old. plugin_old solo puede revisarse opcionalmente como archivo histórico de oportunidades.
5. No inventar estado: Active, Done, Partial, Missing, Planned, Superseded o Deprecated deben basarse en evidencia.
6. No afirmar que no queda legacy interno sin búsqueda real en src/**, tests, scripts, docs y prompts.
7. No duplicar documentación: cada tema debe tener una fuente primaria.
8. No tocar technical guide salvo cambios mínimos/factuales necesarios.
9. No reabrir diseño funcional de los bloques salvo incoherencias reales.
10. No implementar features nuevas durante la auditoría.
11. Toda corrección documental debe quedar trazada.
12. Todo hallazgo no corregido debe ir a backlog o sección de follow-up.
13. Toda mejora propuesta debe incluir evidencia, impacto, riesgo, prioridad y validación esperada.
14. No inventar símbolos, firmas ni documentación built-in sin evidencia.
15. No traducir nombres reales de funciones, variables, objetos, columnas, DataObjects ni anchors técnicos.
16. Sí traducir/enriquecer descripciones, categorías, reasonCodes, labels y ayuda contextual.
17. No meter documentación larga en completion initial; usar completion resolve/enrichment lazy.
18. Todo símbolo enriquecido debe tener sourceOrigin, confidence y fallback unknown/ambiguous.
19. El rail localizado solo toca documentación visible y nunca identidad semántica.
20. Al final, ejecutar self-check completo y repetir si quedan contradicciones.
```

---

## 2. Regla estricta de localización del system catalog

El rail localizado **solo toca documentación visible**. Nunca traduce ni modifica identidad semántica.

### 2.1. Artefactos propietarios

```text
Overlays españoles:
src/server/knowledge/system/localization/es/

Audit runtime:
buildCatalogConsistencyReport().localization

Snapshot serializado:
artifacts/catalog/catalogLocalizationReport.generated.json

Resumen humano:
artifacts/catalog/catalogLocalizationReport.generated.md
```

### 2.2. Anchors técnicos que nunca se traducen

No traducir ni modificar:

```text
name
id
lookupKeys
normalizedName
ownerTypes
domain
kind
namespace
invocation
signatures.label
parameterName real
datatypes
enum values
sourceUrl
DataObject real
column names reales
nombres reales de variables, funciones, objetos o controles
```

### 2.3. Campos visibles que sí pueden localizarse/enriquecerse

Sí se pueden traducir/enriquecer:

```text
summary
documentation
usageNotes
obsoleteMessage
returnDocumentation
parameterDocumentation visible
categorías visibles
reasonCodes visibles
labels de UI
ayuda contextual
notas curadas con source: 'manual-curated'
```

### 2.4. Comandos oficiales de localización

```bash
npm run report:catalog-localization
npm run migrate:catalog-localization-target-ids
```

El migrador funciona en modo dry-run por defecto. Para aplicar reemplazos sobre overlays fuente:

```bash
npm run migrate:catalog-localization-target-ids -- --write
```

Validación mínima:

```bash
npm run test:unit -- --grep "catalogLocalization|catalogConsistency"
npm run report:catalog-localization
npm run migrate:catalog-localization-target-ids
```

Si el cambio toca consumers visibles o locale runtime, sumar las validaciones asociadas al bloque/spec correspondiente, por ejemplo `B373` si sigue existiendo como referencia interna del repo.

---

## 3. Suite de auditorías obligatorias

El bloque debe ejecutarse como una suite de auditorías. Cada auditoría debe incluir:

```text
- alcance;
- evidencias revisadas;
- hallazgos;
- cambios aplicados si procede;
- follow-ups/backlog si no se corrige;
- tests/validaciones ejecutadas;
- estado final.
```

Auditorías mínimas:

```text
1. Auditoría de legacy/deuda interna del plugin actual.
2. Auditoría opcional de oportunidades históricas de plugin_old.
3. Auditoría documental completa y fuentes de verdad.
4. Ultra auditoría de estructura real del repo.
5. Auditoría del mapa arquitectura-documentación-código.
6. Auditoría de modernización a patrones nuevos.
7. Auditoría del sistema de símbolos.
8. Auditoría de catálogo built-in y enrichments.
9. Auditoría de localización del system catalog.
10. Auditoría de semantic tokens y consumers LSP.
11. Auditoría de mejoras arquitectónicas claras.
12. Auditoría de mejoras generales del sistema.
13. Auditoría de backlog/current-focus/roadmap/done-log.
14. Auditoría de testing/performance/release lanes.
15. Auditoría de AI/prompts/agents/skills/instructions.
16. Auditoría de release/build/ORCA/PBAutoBuild.
17. Auditoría final cross-document de contradicciones.
18. Reporte final con gaps y siguiente slice recomendado.
```

---

## 4. Cadena recomendada — Bloque 13

1. `AUDIT-INTERNAL-LEGACY-00` — Internal legacy/debt bootstrap del plugin actual.
2. `AUDIT-INTERNAL-LEGACY-01` — Legacy/obsolete code scan dentro de `src/**`, tests y scripts.
3. `AUDIT-INTERNAL-LEGACY-02` — Duplicated owners, obsolete patterns y migration-to-modern-patterns audit.
4. `AUDIT-PLUGIN-OLD-OPP-01` — Documento opcional `plugin-old-migration-opportunities.md`.
5. `AUDIT-DOCS-00` — Preparación de auditoría documental y mapa de documentos.
6. `AUDIT-DOCS-01` — Inventario documental y clasificación por fuente de verdad.
7. `AUDIT-DOCS-02` — Alineación completa de documentación con código y bloques 1–12.
8. `AUDIT-ARCH-01` — Ultra auditoría de estructura real del repo.
9. `AUDIT-ARCH-02` — Mapa arquitectura-documentación-código.
10. `AUDIT-MODERNIZATION-01` — Auditoría de modernización a patrones nuevos.
11. `SYMBOL-AUDIT-00` — Inventario del sistema actual de símbolos.
12. `SYMBOL-AUDIT-01` — Symbol model/schema audit.
13. `SYMBOL-AUDIT-02` — Symbol source/ownership audit.
14. `SYMBOL-AUDIT-03` — Cross-feature symbol consumption audit.
15. `SYMBOL-AUDIT-04` — Symbol performance/cache/payload audit.
16. `SYMBOL-AUDIT-05` — Symbol correctness/confidence/sourceOrigin audit.
17. `SYMBOL-CATALOG-01` — Built-in PowerBuilder symbols catalog strategy.
18. `SYMBOL-CATALOG-02` — User/project symbols enrichment strategy.
19. `CATALOG-LOCALIZATION-01` — Catalog localization workflow audit.
20. `CATALOG-LOCALIZATION-02` — Overlay integrity, anchors and targetId/targetKey recovery.
21. `CATALOG-LOCALIZATION-03` — Localization coverage roadmap for `es` rail.
22. `SYMBOL-I18N-01` — Translation/enrichment architecture.
23. `SYMBOL-I18N-02` — Spanish/English terminology and message catalog.
24. `SYMBOL-DW-01` — DataWindow/DataStore/DataWindowChild symbol model.
25. `SYMBOL-PRESENTATION-01` — Symbol ViewModels for hover/completion/signatureHelp.
26. `SYMBOL-SEMANTIC-TOKENS-01` — Semantic tokens taxonomy alignment.
27. `SYMBOL-QUALITY-01` — Regression matrix and fixtures.
28. `AUDIT-IMPROVEMENTS-01` — Propuesta de mejoras arquitectónicas claras.
29. `AUDIT-IMPROVEMENTS-02` — Propuesta de mejoras generales del sistema.
30. `AUDIT-BACKLOG-01` — Normalización de backlog y estados de specs.
31. `SYMBOL-BACKLOG-01` — Backlog action plan for symbols/enrichments/localization.
32. `AUDIT-FOCUS-01` — Current focus, roadmap, done-log y sequencing.
33. `AUDIT-TESTING-01` — Testing/performance/docs drift/release lanes alignment.
34. `AUDIT-AI-01` — AI/prompts/agents/skills/instructions alignment.
35. `AUDIT-RELEASE-01` — Release/build/ORCA/PBAutoBuild docs alignment.
36. `SYMBOL-DOCS-01` — Documentation alignment for symbol/localization system.
37. `AUDIT-CONSISTENCY-01` — Cross-document contradiction pass.
38. `AUDIT-FINAL-01` — Final self-check, report y backlog de gaps.

---

# FASE A — Auditoría de legacy/deuda interna

## AUDIT-INTERNAL-LEGACY-00 — Internal legacy/debt bootstrap del plugin actual

- **Priority:** P1.
- **Status:** Open.
- **Area:** legacy, debt, audit, architecture.
- **Goal:** Determinar factualmente si queda código legacy/deuda estructural dentro del plugin actual.
- **Acceptance criteria:**
  - Revisar `src/**`, `test/**`, `scripts/**`, `.github/**`, `docs/**`, `package.json` y configs relevantes.
  - Buscar indicadores: `old`, `legacy`, `compat`, `deprecated`, `tmp`, `backup`, `v1`, `v2`, `migration`, `adapter-old`, TODO/FIXME/HACK críticos, duplicated implementations, APIs sustituidas por Bloques 1–12, wrappers sin owner y módulos huérfanos.
  - Clasificar resultado como `No internal legacy detected`, `Internal legacy candidates detected`, `Debt only`, `Duplicated/obsolete owners detected` o `Needs deeper audit`.
  - No borrar nada todavía salvo cambios documentales seguros.
- **Tests:** `npm run test:architecture:rapid` y `npm run test:docs:drift` si existen.
- **Docs:** `docs/architecture-status.md`, `docs/backlog.md`, `docs/testing.md`.

---

## AUDIT-INTERNAL-LEGACY-01 — Legacy/obsolete code scan dentro de `src/**`, tests y scripts

- **Priority:** P1.
- **Status:** Open.
- **Area:** legacy, obsolete-code, architecture, cleanup.
- **Goal:** Detectar código obsoleto o candidates de eliminación/migración dentro del plugin actual.
- **Acceptance criteria:**
  - Revisar composition roots (`server.ts`, `extension.ts`), handlers, serving/cache, hover/completion/signatureHelp/definition, semantic query/knowledge, DataWindow, presentation/ViewModels, diagnostics, reports/build/release, AI/prompt tooling y tests/fixtures.
  - Clasificar cada hallazgo como `Keep`, `Modernize`, `Remove candidate`, `Needs spec`, `Duplicated owner`, `Superseded by block/spec` o `False positive`.
  - Para `Modernize`, indicar destino: `ServingPipeline`, `SemanticQueryFacade`, `DataWindowFastContext`, ViewModel/formatter, architecture boundary, test/performance gate, release/build rail o AI read-only contract.
- **Tests:** `npm run compile`, `npm run test:unit`, `npm run test:architecture:rapid`, `npm run test:docs:drift` si existen.
- **Docs:** `docs/architecture-implementation-map.md`, `docs/architecture-status.md`, `docs/backlog.md`.

---

## AUDIT-INTERNAL-LEGACY-02 — Duplicated owners, obsolete patterns y migration-to-modern-patterns audit

- **Priority:** P1.
- **Status:** Open.
- **Area:** architecture, owners, modernization.
- **Goal:** Detectar duplicidades arquitectónicas y proponer migraciones a patrones modernos ya definidos.
- **Acceptance criteria:**
  - Auditar duplicidades en serving/cache/hot path, symbol/callable/receiver resolution, DataWindow binding/context, presentation/formatting, diagnostics messages, feature handlers, build/report/runtime surfaces, AI/context bundles y docs/backlog ownership.
  - Clasificar como `Acceptable adapter`, `Duplicated owner`, `Temporary bridge`, `Obsolete path`, `Migration candidate` o `Needs architecture decision`.
  - Para cada `Migration candidate`, indicar owner moderno destino, impacto, riesgo, tests y prioridad.
- **Tests:** `npm run test:architecture:rapid`, `npm run test:architecture:metrics`, `npm run test:docs:drift` si existen.
- **Docs:** `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/backlog.md`.

---

## AUDIT-PLUGIN-OLD-OPP-01 — Documento opcional `plugin-old-migration-opportunities.md`

- **Priority:** P3.
- **Status:** Open.
- **Area:** historical-reference, migration-opportunities, documentation.
- **Goal:** Crear o actualizar `docs/plugin-old-migration-opportunities.md` con conclusión explícita.
- **Acceptance criteria:**
  - Si existe material histórico revisable, auditarlo solo como referencia de oportunidades, no como fuente obligatoria.
  - El documento debe incluir una conclusión:
    - `No queda nada que portar desde plugin_old. No se han detectado oportunidades útiles de migración.`
    - o `Existen oportunidades puntuales`, listadas con evidence, owner moderno y tests necesarios.
  - Si no existe material histórico, indicar que no hay fuente legacy disponible ni migración pendiente.
  - Dejar claro que el plugin actual no depende de `plugin_old`.
- **Tests:** `npm run test:docs:drift` si existe.
- **Docs:** `docs/plugin-old-migration-opportunities.md`, `docs/architecture-status.md` si aplica.

---

# FASE B — Auditoría documental completa

## AUDIT-DOCS-00 — Preparación de auditoría documental y mapa de documentos

- **Priority:** P1.
- **Status:** Open.
- **Area:** docs, audit, preparation.
- **Goal:** Crear mapa inicial de documentos y alcance de auditoría documental.
- **Acceptance criteria:**
  - Listar documentos bajo `docs/**`, raíz y `.github/**`.
  - Identificar documentos principales: `backlog`, `current-focus`, `roadmap`, `done-log`, `architecture-implementation-map`, `architecture-status`, `testing`, `performance-budget`, `ai-orchestration`, `release`, `developer-workflows`, `troubleshooting`, `symbol-system`, `plugin-old-migration-opportunities`, `AGENTS.md`, `.github/**`.
  - Detectar documentos ausentes, deprecated/merged candidates.
- **Tests:** `npm run test:docs:drift` si existe.

---

## AUDIT-DOCS-01 — Inventario documental y clasificación por fuente de verdad

- **Priority:** P1.
- **Status:** Open.
- **Area:** docs, single-source-of-truth, cleanup.
- **Goal:** Clasificar cada documento por responsabilidad primaria.
- **Acceptance criteria:**
  - Clasificar cada documento como `Canonical source`, `Summary/index`, `Operational guide`, `Reference`, `Generated/derived`, `Deprecated candidate` u `Obsolete/remove candidate`.
  - Definir source of truth para arquitectura, backlog/specs, current focus, testing, performance, AI, release/build, DataWindow technical rules, symbol system, catalog localization, internal legacy/debt y done-log.
  - Sustituir duplicidades por enlaces.
- **Tests:** `npm run test:docs:drift`, `npm run test:architecture:rapid` si aplica.

---

## AUDIT-DOCS-02 — Alineación completa de documentación con código y bloques 1–12

- **Priority:** P1.
- **Status:** Open.
- **Area:** docs, alignment, full-audit.
- **Goal:** Dejar todos los documentos alineados con código real, specs y estado actual.
- **Acceptance criteria:**
  - Revisar y alinear docs principales y `.github/**` AI customizations.
  - No duplicar bloques completos en varios documentos.
  - Promesas no respaldadas por código/tests deben marcarse como `Planned`, `Partial`, `Missing` o moverse a backlog.
  - Integrar referencias a `docs/symbol-system.md` y workflow de localización sin duplicarlo en todas partes.
- **Tests:** `npm run test:docs:drift`, `npm run test:architecture:rapid` si aplica.

---

# FASE C — Arquitectura real y modernización

## AUDIT-ARCH-01 — Ultra auditoría de estructura real del repo

- **Priority:** P1.
- **Status:** Open.
- **Area:** architecture, code-audit, structure.
- **Goal:** Auditar la estructura real del repo y producir mapa factual.
- **Acceptance criteria:**
  - Revisar `src/client/**`, `src/server/**`, `src/shared/**`, features, knowledge, analysis, parsing, DataWindow, runtime, handlers, tests, docs y `.github/**`.
  - Identificar estado real por Bloques 1–12: `Implemented`, `Partial`, `Proposed only`, `Missing`, `Superseded`, `Deprecated`.
  - Detectar hotspots: composition roots grandes, providers con demasiadas responsabilidades, duplicate owners, imports ilegales y capas prometidas no implementadas.
- **Tests:** `npm run test:architecture:rapid`, `npm run test:architecture:metrics` si existen.
- **Docs:** `docs/architecture-implementation-map.md`, `docs/architecture-status.md`.

---

## AUDIT-ARCH-02 — Mapa arquitectura-documentación-código

- **Priority:** P1.
- **Status:** Open.
- **Area:** architecture, traceability, docs.
- **Goal:** Crear o actualizar trazabilidad entre docs, specs, módulos reales y tests.
- **Acceptance criteria:**
  - Para cada capa indicar documento fuente, spec/bloque asociado, módulo real, tests y estado.
  - Cubrir client VS Code, LSP server, handlers, serving/cache, hover, completion, signatureHelp/definition/symbols/tokens, semantic query/owners, DataWindow, presentation/ViewModels, testing/performance gates, AI tooling, build/release, internal legacy/debt, symbol system y catalog localization.
- **Tests:** `npm run test:docs:drift`, `npm run test:architecture:rapid`.

---

## AUDIT-MODERNIZATION-01 — Auditoría de modernización a patrones nuevos

- **Priority:** P1.
- **Status:** Open.
- **Area:** modernization, architecture, migration-patterns.
- **Goal:** Detectar partes funcionales pero no migradas a patrones modernos.
- **Acceptance criteria:**
  - Revisar migraciones pendientes hacia `InteractiveServingPipeline`/`ServingPipeline`, `SemanticQueryFacade`, `DataWindowFastContext`, ViewModels/formatters, boundaries, architecture fitness functions, payload/performance gates, AI read-only contracts, build/release rails y symbol enrichment architecture.
  - Cada migración pendiente incluye origen actual, destino, archivos, beneficio, riesgo, prioridad, tests y follow-up.
- **Tests:** `npm run test:architecture:rapid`, `npm run test:docs:drift` si existen.

---

# FASE D — Sistema de símbolos

## SYMBOL-AUDIT-00 — Inventario del sistema actual de símbolos

- **Priority:** P1.
- **Status:** Open.
- **Area:** symbols, audit, inventory.
- **Goal:** Crear inventario factual del sistema actual de símbolos.
- **Acceptance criteria:**
  - Localizar módulos de símbolos en parser/AST, KnowledgeBase/indexes, semantic resolvers, hover, completion, signatureHelp, definition/references, documentSymbols/workspaceSymbols, semanticTokens, diagnostics, DataWindow, built-in/system catalog y translations/messages.
  - Para cada módulo: responsabilidad, inputs, outputs, owner, consumers, cache, tests y docs.
  - Producir `current-symbol-system-map` en `docs/architecture-implementation-map.md` o `docs/symbol-system.md`.
- **Tests:** `npm run test:architecture:rapid`, `npm run test:docs:drift` si existen.

---

## SYMBOL-AUDIT-01 — Symbol model/schema audit

- **Priority:** P1.
- **Status:** Open.
- **Area:** symbols, schema, semantics.
- **Goal:** Auditar/proponer modelo canónico de símbolo enriquecido.
- **Acceptance criteria:**
  - Auditar metadata: id estable, name original, normalizedName, kind/domain, sourceOrigin, owner/module, URI/range/selectionRange, declaration/usage, scope, type/resolvedType, receiverType, signature, parameters, return type, documentation/enrichment refs, confidence, reasonCodes, stale/version, related symbols, deprecation/status, tags/modifiers.
  - Proponer `CanonicalSymbol` o equivalente si falta.
  - Diferenciar símbolo canónico de ViewModel/presentation.
- **Tests:** `npm run test:unit`, `npm run test:architecture:rapid` si existen.

---

## SYMBOL-AUDIT-02 — Symbol source/ownership audit

- **Priority:** P1.
- **Status:** Open.
- **Area:** symbols, ownership, semantic-query.
- **Goal:** Definir ownership y sourceOrigin para cada familia de símbolos.
- **Acceptance criteria:**
  - Clasificar fuentes: `project-source`, `workspace-index`, `active-document-snapshot`, `built-in-catalog`, `datawindow-model`, `framework-pattern`, `inferred`, `external-tool`, `unknown`.
  - Definir owners: parser/indexer, KnowledgeBase/SemanticQueryFacade, DataWindowFastContext, built-in catalog, presentation/enrichment layer.
  - Detectar owners duplicados y rutas paralelas.
- **Tests:** `npm run test:architecture:rapid`, `npm run test:docs:drift`.

---

## SYMBOL-AUDIT-03 — Cross-feature symbol consumption audit

- **Priority:** P1.
- **Status:** Open.
- **Area:** symbols, LSP, consumers.
- **Goal:** Auditar cómo cada feature usa símbolos y unificar acceso.
- **Acceptance criteria:**
  - Auditar hover, completion initial, completion resolve, signatureHelp, definition, references, documentHighlight, documentSymbols, workspaceSymbols, semanticTokens, diagnostics y AI context bundles.
  - Para cada consumer: qué símbolo necesita, metadata usada, origen, cache, duplicidad, confidence/ambiguous/unknown.
  - Proponer acceso común vía `SemanticQueryFacade`/symbol service si procede.
- **Tests:** `npm run test:unit`, `npm run test:architecture:rapid`, `npm run test:performance:gate` si existe.

---

## SYMBOL-AUDIT-04 — Symbol performance/cache/payload audit

- **Priority:** P1.
- **Status:** Open.
- **Area:** symbols, performance, cache, payload.
- **Goal:** Asegurar que símbolos y enrichments son rápidos y cacheables.
- **Acceptance criteria:**
  - Detectar IO, workspace scan, full parse, recomputación, stringify grande o enrichment pesado en hot path.
  - Proponer caches: active document symbol snapshot, workspace symbol index, built-in catalog cache, enrichment cache, translation bundle cache, negative cache para unknown symbols.
  - Definir payload budgets.
  - Completion initial no carga documentación larga; completion resolve usa enrichment lazy.
- **Tests:** `npm run test:performance:gate`, `npm run test:architecture:rapid` si existen.

---

## SYMBOL-AUDIT-05 — Symbol correctness/confidence/sourceOrigin audit

- **Priority:** P1.
- **Status:** Open.
- **Area:** symbols, correctness, confidence.
- **Goal:** Definir reglas de confidence y fallback para símbolos.
- **Acceptance criteria:**
  - Estados: `high-confidence`, `medium-confidence`, `low-confidence`, `ambiguous`, `unknown`, `stale`, `synthetic`, `inferred`.
  - Cada output enriquecido explica sourceOrigin y reasonCodes.
  - Hover/completion/signatureHelp no presentan guesses como hechos.
  - Diagnostics diferencian unknown real vs unresolved por falta de índice.
- **Tests:** `npm run test:unit`, `npm run test:docs:drift`.

---

# FASE E — Catálogo built-in, enrichments y localización

## SYMBOL-CATALOG-01 — Built-in PowerBuilder symbols catalog strategy

- **Priority:** P1.
- **Status:** Open.
- **Area:** symbols, built-ins, catalog.
- **Goal:** Diseñar estrategia de catálogo built-in PowerBuilder enriquecido.
- **Acceptance criteria:**
  - Estructura para built-ins: function name, aliases/case variants, category, kind, signatures, parameters, return type, short/long description, examples optional, availability/version, tags, source/reference, translation keys.
  - Catálogo read-only en runtime.
  - Carga sin penalizar hot path.
  - No inventar firmas sin evidencia.
- **Tests:** `npm run test:unit`, `npm run test:docs:drift`.
- **Docs:** `docs/symbol-system.md`, `docs/backlog.md`.

---

## SYMBOL-CATALOG-02 — User/project symbols enrichment strategy

- **Priority:** P1.
- **Status:** Open.
- **Area:** symbols, project-symbols, enrichments.
- **Goal:** Definir enrichments seguros para símbolos de usuario.
- **Acceptance criteria:**
  - Enrichments para functions/events, variables, instance/shared/global variables, parameters, objects/windows/userobjects, controls, structures, DataWindow bindings, transactions y framework patterns.
  - Distinguir declarados, inferidos, importados del workspace index, derivados de comentarios/docblocks y unknown.
  - Definir consumo en hover/completion/definition/signatureHelp.
- **Tests:** `npm run test:unit`, `npm run test:architecture:rapid`.

---

## CATALOG-LOCALIZATION-01 — Catalog localization workflow audit

- **Priority:** P1.
- **Status:** Open.
- **Area:** catalog, localization, workflow, audit.
- **Goal:** Auditar y alinear el workflow de localización documental del system catalog.
- **Acceptance criteria:**
  - Validar que existen o documentar ausencia de:
    - `src/server/knowledge/system/localization/es/`;
    - `buildCatalogConsistencyReport().localization`;
    - `artifacts/catalog/catalogLocalizationReport.generated.json`;
    - `artifacts/catalog/catalogLocalizationReport.generated.md`;
    - `npm run report:catalog-localization`;
    - `npm run migrate:catalog-localization-target-ids`.
  - Ejecutar comandos reales si existen.
  - Verificar que el reporte incluye conteos por locale, cobertura por dominio, overlays incompletos, invalidParameterTargets, recoveredTargetIds y orphanOverlays.
  - Documentar cualquier gap en backlog.
- **Tests:**
  ```bash
  npm run test:unit -- --grep "catalogLocalization|catalogConsistency"
  npm run report:catalog-localization
  npm run migrate:catalog-localization-target-ids
  ```
- **Docs:** `docs/symbol-system.md`, `docs/catalog-localization-workflow.md` si se crea, `docs/testing.md`, `docs/backlog.md`.

---

## CATALOG-LOCALIZATION-02 — Overlay integrity, anchors and targetId/targetKey recovery

- **Priority:** P1.
- **Status:** Open.
- **Area:** catalog, localization, anchors, migration.
- **Goal:** Verificar integridad de overlays, anchors técnicos y recuperación por `targetKey`.
- **Acceptance criteria:**
  - Confirmar que overlays no traducen anchors técnicos.
  - Revisar `missingFields`, `invalidParameterTargets`, `recoveredTargetIds`, `orphanOverlays`.
  - Verificar uso correcto de `targetId`, `targetKey` o ambos:
    - `targetId` para entries consolidadas y estables;
    - `targetKey` para generated o buckets cuyo ID pueda moverse;
    - ambos para drift explícito y recuperación automática.
  - Si hay `recoveredTargetIds`, ejecutar migrador dry-run y documentar si procede `--write`.
  - Solo permitir `reviewed: true` cuando no haya incomplete, invalidParameterTarget, recoveredTargetId pendiente ni orphan.
- **Tests:**
  ```bash
  npm run test:unit -- --grep "catalogLocalization|catalogConsistency"
  npm run report:catalog-localization
  npm run migrate:catalog-localization-target-ids
  ```
- **Docs:** `docs/catalog-localization-workflow.md`, `docs/symbol-system.md`, `docs/backlog.md`.

---

## CATALOG-LOCALIZATION-03 — Localization coverage roadmap for `es` rail

- **Priority:** P2.
- **Status:** Open.
- **Area:** catalog, localization, roadmap.
- **Goal:** Crear roadmap de cobertura incremental para localización española del system catalog.
- **Acceptance criteria:**
  - Usar orden recomendado:
    1. Functions/events más usados y visibles.
    2. DataWindow core.
    3. System object datatypes principales.
    4. Enumerated types/values.
    5. Statements y reserved words.
    6. Resto generated.
  - Definir backlog por dominio con métricas de cobertura (`localizedTargetCount`, `reviewedTargetCount`, ratios sobre targets canónicos).
  - Mantener guía de estilo:
    - traducir significado, no símbolos;
    - nombres reales en inglés/original;
    - español técnico claro, breve y estable;
    - no inventar comportamiento no respaldado;
    - `source: 'manual-curated'` para explicación curada;
    - mantener `sourceUrl` oficial;
    - priorizar `summary`, `documentation`, `returnDocumentation` y parámetros ya documentados;
    - si base tiene `usageNotes`, no marcar reviewed sin nota equivalente o decisión explícita.
- **Tests:** `npm run report:catalog-localization`, `npm run test:docs:drift`.
- **Docs:** `docs/catalog-localization-workflow.md`, `docs/backlog.md`, `docs/current-focus.md` si se activa.

---

## SYMBOL-I18N-01 — Translation/enrichment architecture

- **Priority:** P1.
- **Status:** Open.
- **Area:** symbols, i18n, enrichment, presentation.
- **Goal:** Definir arquitectura de traducciones y enrichments para símbolos.
- **Acceptance criteria:**
  - Separar symbol identity, enrichment metadata, localized presentation y LSP payload.
  - Traducciones por keys, no strings duplicadas en providers.
  - Fallback de idioma.
  - Traducir descripciones, categorías, reasonCodes, labels y help snippets.
  - No traducir nombres reales, anchors técnicos, datatypes, enum values ni código.
  - Evitar cargar bundles completos en hot path.
- **Tests:** `npm run test:unit`, `npm run test:performance:gate` si existe.

---

## SYMBOL-I18N-02 — Spanish/English terminology and message catalog

- **Priority:** P2.
- **Status:** Open.
- **Area:** symbols, i18n, terminology.
- **Goal:** Crear glosario y catálogo inicial español/inglés para enrichments.
- **Acceptance criteria:**
  - Terminología para function, event, variable, parameter, return value, DataWindow, DataStore, DataWindowChild, transaction, ancestor, override, scope, source origin, confidence, deprecated, inferred, ambiguous, unknown.
  - Glosario en presentation layer, no hardcoded en providers.
  - Keys estables y tests de fallback.
- **Tests:** `npm run test:unit`, `npm run test:docs:drift`.

---

# FASE F — DataWindow, presentation y semantic tokens

## SYMBOL-DW-01 — DataWindow/DataStore/DataWindowChild symbol model

- **Priority:** P1.
- **Status:** Open.
- **Area:** symbols, datawindow, semantics.
- **Goal:** Definir modelo de símbolos DataWindow alineado con DataWindowFastContext.
- **Acceptance criteria:**
  - Modelar DataWindow control, DataStore variable, DataWindowChild, DataObject literal, column, computed field, property path, buffer, Describe/Modify parseable, unknown/dynamic binding.
  - Cada símbolo DW tiene confidence/sourceOrigin.
  - Hover/completion/definition/diagnostics consumen el modelo sin parsear `.srd` como PowerScript general.
- **Tests:** `npm run test:unit`, `npm run test:architecture:rapid`.

---

## SYMBOL-PRESENTATION-01 — Symbol ViewModels for hover/completion/signatureHelp

- **Priority:** P1.
- **Status:** Open.
- **Area:** symbols, presentation, UX.
- **Goal:** Crear ViewModels reutilizables para presentar símbolos.
- **Acceptance criteria:**
  - Proponer `SymbolHoverViewModel`, `SymbolCompletionViewModel`, `SymbolSignatureViewModel`, `SymbolDiagnosticViewModel`, `SymbolSemanticTokenViewModel` si aplica.
  - Providers no duplican Markdown/rendering.
  - Completion initial compacto; resolve detallado y lazy.
  - Respeta i18n y payload budget.
- **Tests:** `npm run test:unit`, `npm run test:performance:gate` si existe.

---

## SYMBOL-SEMANTIC-TOKENS-01 — Semantic tokens taxonomy alignment

- **Priority:** P2.
- **Status:** Open.
- **Area:** symbols, semantic-tokens, UX.
- **Goal:** Diseñar mapeo de símbolos PowerBuilder a semantic token types/modifiers.
- **Acceptance criteria:**
  - Mapping para class/object/userobject/window, function, event, method/external function, variables, parameter, property/control, DataWindow/DataStore/DataWindowChild, DataWindow column/property, enum/constant, deprecated/readonly/static/declaration/modification si aplica.
  - Decidir tipos estándar VS Code vs custom token types.
  - Tests de rangos y modifiers.
- **Tests:** `npm run test:unit`, `npm run test:performance:gate` si existe.

---

# FASE G — Mejoras, backlog, testing y cierre

## SYMBOL-QUALITY-01 — Regression matrix and fixtures

- **Priority:** P1.
- **Status:** Open.
- **Area:** symbols, testing, quality.
- **Goal:** Crear matriz de tests para símbolos, enrichments e i18n.
- **Acceptance criteria:**
  - Fixtures para function system, function user, event, local variable, instance variable, parameter, object/control, DataWindow/DataStore/DataWindowChild, DataObject/column, ambiguous, unknown, inherited, dynamic, built-in translation/enrichment, completion resolve enrichment.
  - Tests verifican sourceOrigin/confidence/reasonCodes, i18n fallback y payload budget.
- **Tests:** `npm run test:unit`, `npm test`, `npm run test:performance:gate`, `npm run test:docs:drift` si existen.

---

## AUDIT-IMPROVEMENTS-01 — Propuesta de mejoras arquitectónicas claras

- **Priority:** P1.
- **Status:** Open.
- **Area:** architecture, recommendations, roadmap.
- **Goal:** Proponer mejoras arquitectónicas claras, priorizadas y con evidencia.
- **Acceptance criteria:**
  - Cada mejora incluye título, evidencia, módulos afectados, problema, impacto, riesgo, prioridad, tests y spec recomendado.
  - Cubrir composition roots, boundaries, serving/cache, semantic owners, DataWindow, presentation, testing/fitness functions, build/release rails, AI contracts/prompts, symbol system y catalog localization si aplica.
- **Tests:** `npm run test:docs:drift`, `npm run test:architecture:rapid` si aplica.

---

## AUDIT-IMPROVEMENTS-02 — Propuesta de mejoras generales del sistema

- **Priority:** P2.
- **Status:** Open.
- **Area:** system-improvement, DX, reliability.
- **Goal:** Proponer mejoras generales de calidad, DX, observabilidad, release, docs, testing y UX.
- **Acceptance criteria:**
  - Cada mejora incluye evidencia, impacto, coste relativo, riesgo, prioridad y validación esperada.
  - Cubrir developer workflow, test reliability, performance observability, docs discoverability, release readiness, troubleshooting, AI workflow, support bundles, user-facing UX, catalog reports y localization workflow.
- **Tests:** `npm run test:docs:drift` si se modifican docs.

---

## AUDIT-BACKLOG-01 — Normalización de backlog y estados de specs

- **Priority:** P1.
- **Status:** Open.
- **Area:** backlog, specs, process.
- **Goal:** Dejar backlog limpio y trazable.
- **Acceptance criteria:**
  - Specs antiguas en `Active`, `Done`, `Partial`, `Superseded by <id>`, `Deprecated`, `Blocked`, `Removed with reason`.
  - Specs duplicadas fusionadas o enlazadas.
  - Mejoras arquitectónicas, modernización, symbols, localization y mejoras de sistema aceptadas quedan como follow-up backlog.
- **Tests:** `npm run test:docs:drift`.

---

## SYMBOL-BACKLOG-01 — Backlog action plan for symbols/enrichments/localization

- **Priority:** P1.
- **Status:** Open.
- **Area:** backlog, symbols, localization, roadmap.
- **Goal:** Crear plan de acción en backlog para símbolos, enrichments, traducciones y localización del catálogo.
- **Acceptance criteria:**
  - Crear specs/follow-ups por prioridad:
    - P1 symbol model/facade;
    - P1 performance/cache/payload;
    - P1 hover/completion/signatureHelp Symbol ViewModels;
    - P1 built-in catalog foundation;
    - P1 catalog localization audit/anchors/recovery;
    - P1 regression matrix;
    - P2 Spanish/English translations;
    - P2 DataWindow symbol enrichments;
    - P2 semantic tokens mapping;
    - P2 localization coverage by domain;
    - P3 examples/tutorial docs;
    - P3 framework-specific enrichments PFC/STD.
  - Cada backlog item incluye acceptance criteria, docs y tests.
  - Definir primer slice recomendado y fuera de alcance.
- **Tests:** `npm run test:docs:drift`.

---

## AUDIT-FOCUS-01 — Current focus, roadmap, done-log y sequencing

- **Priority:** P1.
- **Status:** Open.
- **Area:** current-focus, roadmap, done-log, planning.
- **Goal:** Alinear sequencing operativo con estado real.
- **Acceptance criteria:**
  - `current-focus` contiene solo specs activas y ejecutables.
  - Roadmap indica siguiente slice real.
  - Done-log solo contiene specs cerradas con evidencia.
  - Blockers, deuda, symbols, localization y mejoras van a backlog, no a focus activo si no se ejecutan ya.
- **Tests:** `npm run test:docs:drift`.

---

## AUDIT-TESTING-01 — Testing/performance/docs drift/release lanes alignment

- **Priority:** P1.
- **Status:** Open.
- **Area:** testing, performance, release, docs.
- **Goal:** Alinear testing docs, performance budget, catalog localization commands y release lanes con scripts reales.
- **Acceptance criteria:**
  - Leer `package.json`.
  - No inventar comandos.
  - Alinear `docs/testing.md`, `performance-budget`, `release`, catalog localization workflow y symbol regression tests con comandos reales o `missing/planned`.
- **Tests:** comandos reales disponibles, incluyendo si existen:
  ```bash
  npm run compile
  npm run test:unit
  npm test
  npm run test:architecture:rapid
  npm run test:docs:drift
  npm run test:performance:gate
  npm run report:catalog-localization
  npm run migrate:catalog-localization-target-ids
  ```

---

## AUDIT-AI-01 — AI/prompts/agents/skills/instructions alignment

- **Priority:** P1.
- **Status:** Open.
- **Area:** AI, prompts, agents, instructions, docs.
- **Goal:** Dejar la capa AI lean, coherente y orientada a uso real.
- **Acceptance criteria:**
  - `.github/copilot-instructions.md` solo reglas always-on críticas.
  - `.github/instructions/*.instructions.md` reglas por dominio/path.
  - `.github/prompts/*.prompt.md` tareas repetibles con fases y self-check.
  - `.github/agents/*.agent.md` sin duplicar instrucciones globales ni prompts largos.
  - AI prompts relacionados con símbolos/localización deben respetar anchors técnicos y no inventar firmas.
- **Tests:** `npm run test:docs:drift`.

---

## AUDIT-RELEASE-01 — Release/build/ORCA/PBAutoBuild docs alignment

- **Priority:** P2.
- **Status:** Open.
- **Area:** release, build, ORCA, PBAutoBuild, docs.
- **Goal:** Alinear release/build docs con código y scripts reales.
- **Acceptance criteria:**
  - Revisar módulos reales para VSIX/package/release.
  - Revisar runners reales para PBAutoBuild/ORCA.
  - Lo no implementado queda `Planned`, no `Active`.
  - PBAutoBuild/ORCA fuera del hot path.
- **Tests:** `npm run test:docs:drift`, `npm run test:architecture:rapid`.

---

## SYMBOL-DOCS-01 — Documentation alignment for symbol/localization system

- **Priority:** P1.
- **Status:** Open.
- **Area:** docs, symbols, localization, alignment.
- **Goal:** Crear o actualizar documentación específica sin duplicar arquitectura general.
- **Acceptance criteria:**
  - Crear/actualizar `docs/symbol-system.md` con modelo canónico, sources, owners, consumers, confidence/sourceOrigin, i18n/enrichments, DataWindow, semantic tokens, testing strategy y backlog roadmap.
  - Crear/actualizar `docs/catalog-localization-workflow.md` o integrar el workflow en `docs/symbol-system.md` si se decide, evitando duplicidad.
  - `architecture-implementation-map` enlaza, no duplica.
  - `testing.md` enlaza regression matrix y comandos de localización.
  - `performance-budget.md` enlaza payload/cache budgets.
  - `backlog.md` contiene specs resumidas.
- **Tests:** `npm run test:docs:drift`.

---

## AUDIT-CONSISTENCY-01 — Cross-document contradiction pass

- **Priority:** P1.
- **Status:** Open.
- **Area:** docs, consistency, QA.
- **Goal:** Ejecutar pasada final de contradicciones.
- **Acceptance criteria:**
  - Revisar contradicciones sobre legacy/deuda interna, mapa de arquitectura, modernizaciones, símbolos, localización, anchors técnicos, mejoras propuestas, estados de specs, current focus, done-log, testing commands, DataWindow policy, AI instructions, release/build status y backlog asociado.
  - Corregir o documentar gaps.
- **Tests:** `npm run test:docs:drift`, `npm run test:architecture:rapid` si existe.

---

## AUDIT-FINAL-01 — Final self-check, report y backlog de gaps

- **Priority:** P1.
- **Status:** Open.
- **Area:** audit, closure, reporting.
- **Goal:** Cerrar con reporte final, gaps y siguiente slice.
- **Acceptance criteria:**
  - Reporte final incluye:
    - estado factual de legacy/deuda interna;
    - resultado de ultra auditoría documental;
    - resultado de mapa de arquitectura;
    - estado del sistema de símbolos;
    - estado del workflow de localización del catálogo;
    - modernizaciones pendientes;
    - mejoras arquitectónicas propuestas;
    - mejoras generales del sistema propuestas;
    - documentos revisados/modificados;
    - código revisado;
    - tests ejecutados/no ejecutados;
    - specs normalizadas;
    - contradicciones corregidas;
    - gaps pendientes;
    - próximo slice recomendado.
  - Todo gap queda en backlog o `Follow-up required`.
  - Repetir self-check si queda contradicción no justificada.
- **Tests:** todos los scripts reales aplicables.

---

## Resultado esperado al cerrar el Bloque 13+14

```text
1. El estado de legacy/deuda interna del plugin actual queda verificado.
2. Toda la documentación relevante queda inventariada, clasificada y alineada.
3. Cada tema tiene una fuente primaria de verdad.
4. La arquitectura documentada coincide con la estructura real del repo.
5. Existe o se actualiza el mapa arquitectura-documentación-código.
6. Cada bloque 1–12 tiene estado factual: Implemented/Partial/Planned/Missing/Superseded.
7. Hay auditoría específica de modernización a patrones nuevos.
8. El sistema actual de símbolos queda inventariado y documentado.
9. Existe propuesta de modelo canónico de símbolo.
10. Built-ins, user symbols, DataWindow symbols e inferred symbols tienen ownership/sourceOrigin.
11. Consumers LSP de símbolos quedan mapeados.
12. Se define estrategia de performance/cache/payload para símbolos enriquecidos.
13. Se define confidence/sourceOrigin/reasonCodes para evitar falsos positivos.
14. Se define estrategia de catálogo built-in PowerBuilder.
15. Se define estrategia de enrichments para símbolos de usuario/proyecto.
16. Se define arquitectura de traducciones/enrichments español/inglés.
17. Se audita y documenta el workflow de localización del system catalog.
18. Se validan overlays, anchors técnicos, targetId/targetKey y recoveredTargetIds.
19. Existe roadmap de cobertura para el rail es.
20. DataWindow tiene modelo de símbolo explícito o backlog claro.
21. Semantic tokens tienen taxonomía alineada con símbolos.
22. Existe regression matrix para símbolos/enrichments/i18n/localization.
23. Hay propuestas claras de mejoras arquitectónicas y generales con evidencia.
24. Backlog, current-focus y done-log no se contradicen.
25. Testing/performance/release docs usan scripts reales o marcan gaps como planned/missing.
26. AI instructions/prompts/agents/skills quedan lean y sin duplicación crítica.
27. No quedan promesas documentales sin respaldo o backlog asociado.
28. Hay reporte final con tests ejecutados, gaps y siguiente slice recomendado.
```

---

## Current focus recomendado si se decide activar este bloque

```markdown
# Current Focus — Multi-Audit Final + Symbols & Catalog Localization

## Scope

- AUDIT-INTERNAL-LEGACY-00
- AUDIT-INTERNAL-LEGACY-01
- AUDIT-INTERNAL-LEGACY-02
- AUDIT-DOCS-00
- AUDIT-DOCS-01
- AUDIT-DOCS-02
- AUDIT-ARCH-01
- AUDIT-ARCH-02
- AUDIT-MODERNIZATION-01
- SYMBOL-AUDIT-00
- SYMBOL-AUDIT-01
- SYMBOL-AUDIT-02
- SYMBOL-AUDIT-03
- SYMBOL-AUDIT-04
- SYMBOL-AUDIT-05
- CATALOG-LOCALIZATION-01
- CATALOG-LOCALIZATION-02
- CATALOG-LOCALIZATION-03
- SYMBOL-BACKLOG-01
- SYMBOL-DOCS-01
- AUDIT-CONSISTENCY-01
- AUDIT-FINAL-01
- AUDIT-PLUGIN-OLD-OPP-01
- SYMBOL-CATALOG-01
- SYMBOL-I18N-01
- SYMBOL-PRESENTATION-01
- SYMBOL-SEMANTIC-TOKENS-01
- AUDIT-RELEASE-01

## Explicitly out of scope

- Implementing new features.
- Full built-in catalog completion.
- Full translation of all PowerBuilder functions.
- Large semantic resolver rewrite.
- Big-bang DataWindow model rewrite.
- Changing hot path without performance gate.
- Guessing undocumented signatures.
- Translating technical anchors.
- Publishing VSIX/Marketplace.
- Treating plugin_old as active source or runtime dependency.
```

---

## First recommended implementation slice after audit

```text
1. Canonical symbol model proposal.
2. Symbol sourceOrigin/confidence contract.
3. Symbol consumers map.
4. Built-in catalog schema foundation.
5. Catalog localization workflow alignment.
6. Overlay anchor validation and targetId/targetKey recovery plan.
7. SymbolHoverViewModel compact enrichment.
8. Completion resolve enrichment for built-ins.
9. Spanish/English glossary keys foundation.
10. Regression fixtures for function system/user function/local variable/DataWindow column/unknown/catalog overlay.
```

---
