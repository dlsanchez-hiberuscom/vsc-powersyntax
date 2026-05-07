# Backlog — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/architecture-implementation-map.md`
- `docs/semantic-design-target.md`
- `docs/semantic-design-assumptions.md`

---

## 0. Meta maestra

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Toda spec, auditoría o mejora nueva debe respetar esta meta. Si una mejora aumenta complejidad pero no mejora velocidad percibida, estabilidad, seguridad semántica, entendimiento real de PowerBuilder o utilidad profesional, no debe priorizarse sobre el core.

---

## 0.1. Decisiones cerradas de diseño semántico

Estas decisiones gobiernan la ejecución del backlog semántico y arquitectónico:

1. `SemanticQueryResult` se implementará primero como **envelope incremental sobre `ResolvedTargetInfo`**, no como reescritura big-bang.
2. `PublishedSemanticSnapshot` será **contrato readonly sobre `KnowledgeBase.publishedState`**, no store paralelo.
3. La invalidación empezará como **contrato event-driven con tests y métricas**, no como mega-módulo coordinador inicial.
4. `ReadOnlyReportCache` queda como nombre histórico/conceptual; el nombre objetivo para implementación futura es `ReadOnlyProjectionCache`.
5. `SemanticEnrichment` es **etapa conceptual**, no módulo obligatorio nuevo.
6. `SemanticQueryFacade` admite excepciones sólo para análisis estructural por documento sin identidad global, sin confidence semántica y con tests/documentación.
7. DataWindow, SQL y Transaction serán **submodelos safe/advisory**, no core semántico fuerte equivalente a PowerScript.
8. `PB-ARCH-*` gobierna contrato/arquitectura/conformance; `PB-SEMANTIC-*` implementa funcionalidad concreta/hardening.

---

## 0.2. Orden de ejecución recomendado

> Este orden prevalece sobre la prioridad individual cuando existan dependencias arquitectónicas.

```txt
00. NO EJECUTAR: PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01 si aparece en docs antiguos; queda absorbido.

01. PB-AUDIT-P0-DOC-ALIGNMENT-01

02. PB-ARCH-P0-SEMANTIC-DESIGN-TARGET-01
03. PB-ARCH-P0-SEMANTIC-CONFORMANCE-TESTS-01

04. PB-ARCH-P0-SEMANTIC-SOURCE-OF-TRUTH-01
05. PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01
06. PB-SEMANTIC-P0-FACADE-CONVERGENCE-01

07. PB-ARCH-P1-CONSUMER-CONVERGENCE-COMPLETION-SIGNATURE-01
08. PB-ARCH-P1-REFERENCES-STRUCTURAL-CONFIRMATION-01
09. PB-SEMANTIC-P1-QUALIFIER-RESOLUTION-01
10. PB-SEMANTIC-P1-EVENT-DISPATCH-01

11. PB-SEMANTIC-P1-CONFIDENCE-CONTRACT-01
12. PB-ARCH-P1-SEMANTIC-TOKENS-EVIDENCE-CONTRACT-01
13. PB-RUNTIME-P1-READONLY-SURFACES-GATES-01
14. PB-ARCH-P1-READONLY-SURFACES-PROJECTIONS-01

15. PB-SEMANTIC-P1-POWERSCRIPT-CONTROL-SLICE-01
16. PB-SEMANTIC-P2-LEGACY-CONTROL-MATRIX-01

17. PB-ARCH-P1-CACHE-SEMANTIC-EPOCH-CONTRACT-01
18. PB-ARCH-P1-CROSS-CACHE-INVALIDATION-COORDINATOR-01

19. PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01
20. PB-SEMANTIC-P1-DATAWINDOW-ADVANCED-SLICE-01

21. PB-SEMANTIC-P1-SQL-TRANSACTION-ANCHORS-01
22. PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01
23. PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01

24. PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01
25. PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01
26. PB-SEMANTIC-P2-BUILD-SOURCE-METADATA-01

27. PB-ARCH-P2-FEATURE-SIMPLIFICATION-AND-DELETION-01

28. CATALOG-GENERATOR-SCHEMA-DRIFT-01
29. CATALOG-MANUAL-BASE-LANGUAGE-POLICY-01
30. CATALOG-MANUAL-EN-MIGRATION
31. PLUGIN-INFRASTRUCTURE-NLS-01
```

---

## 1. Cómo debe usar este backlog una IA

- Ejecutar por orden de prioridad global.
- Ejecutar por el orden de la sección `0.2` cuando existan dependencias arquitectónicas o solapes entre specs.
- No abrir ítems si sus dependencias no están cerradas, salvo trabajo preparatorio claro.
- No ejecutar ítems `Superseded`.
- No ejecutar `PB-SEMANTIC-*` si su `PB-ARCH-*` padre define un contrato todavía abierto, salvo trabajo preparatorio explícito.
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
- Los errores reales capturados en runtime sobre corpus PowerBuilder/PFC tienen prioridad sobre mejoras cosméticas o nuevas features.
- Ningún diagnóstico informativo debe ensuciar el editor por defecto si describe un patrón normal de PowerBuilder y no un problema accionable.
- El lexer/parser debe tokenizar correctamente strings, comentarios y continuaciones antes de ejecutar reglas semánticas, balanceo de paréntesis o resolución de símbolos.
- Un self-test de runtime no puede considerarse suficiente si solo valida snapshots internos. Debe incluir probes funcionales de features interactivas críticas: hover built-in, definition low-confidence, serving cache, view providers y readiness transitions.
- Si `Readiness = ready` e `Indexer = ready`, pero hover/paneles/definition no funcionan, el fallo debe clasificarse como problema de serving/runtime interactivo, no como discovery/indexing salvo evidencia directa.
- Las capacidades opcionales de build/ORCA no deben contaminar el estado de salud del language runtime. Build blocked u ORCA missing deben aparecer como capabilities separadas, no como bloqueo del hover, Object Explorer, Current Context, Diagnostics Explainability o diagnostics.
- Las requests interactivas LSP deben ser deterministas: una request repetida para el mismo provider/URI/posición/documentVersion debe deduplicarse o resolverse desde cache/negative-cache, nunca entrar en spam de scheduler.
- Los built-ins/system functions de PowerScript deben resolverse antes que el workspace index. No deben depender de discovery completo ni de PBAutoBuild/ORCA.
- Las views contribuidas por `package.json` deben registrar siempre su provider durante `activate()`. Los datos pueden degradar; el provider no puede faltar.
- No crear stores semánticos paralelos a `KnowledgeBase.publishedState`.
- No introducir full scans en hot paths de hover, completion, signature help, definition, references, semantic tokens o diagnostics.
- No cachear resultados como verdad: toda cache debe declarar epoch/fingerprint/sourceOrigin/locale/projection cuando aplique.
- Las surfaces read-only grandes deben tener caps, paginación, receipts o truncation explícita.

### 1.1. Checklist final para agentes Copilot

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
13. Validate fixes against the captured PowerBuilder/PFC cases in section 4 before closing parser, diagnostics, hover, discovery, serving-cache or view-provider work.
14. Verify diagnostics severity: real correctness issues may be diagnostics; confidence/context warnings should prefer hover/context panels unless explicitly configured.
15. Verify RuntimeSelfTest has both core checks and functional interactive probes before trusting a green result.
16. Verify hover built-ins such as IsNull/UpperBound/String/Long/MessageBox work without workspace index readiness.
17. Verify contributed views have registered providers and never show VS Code native “no data provider registered”.
18. Verify repeated hover/definition requests are deduplicated or negative-cached.
19. Verify build/ORCA warnings are not used as blockers for interactive language features.
20. Verify no semantic store parallel to KnowledgeBase was introduced.
21. Verify providers do not resolve semantic identity outside SemanticQueryFacade unless exception is documented.
22. Verify cache keys include required epoch/fingerprint/sourceOrigin/locale where applicable.
23. Verify reports/read-only surfaces are capped/paged/receipted.
24. Verify confidence/evidence/reason codes are not hardcoded without evidence.
25. Verify PB-ARCH/PB-SEMANTIC relationship was respected: architecture contract first, functional implementation after.
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

## CATALOG-MANUAL-BASE-LANGUAGE-POLICY-01 — English base language policy for manual/**

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 29.
- **Origen:** CATALOG-MANUAL-LOCALIZATION-AUDIT.
- **Evidencia:** Todo `manual/**` tenía `summary`, `documentation`, `category` en español. Cuando `locale = en`, los consumers (hover, completion, signatureHelp) podían mostrar texto español al usuario si no existía política formal de base EN + overlay ES.
- **Riesgo:** Sin política formalizada, cada migración posterior inventa criterios ad-hoc y puede introducir inconsistencias.
- **Objetivo:** Documentar en `docs/localization.md` la política final de idioma: `manual/**` = inglés canónico; `localization/es/**` = overlay español. Crear checklist de migración reutilizable.
- **Depends on:** Nada.
- **Acceptance criteria:**
  - `docs/localization.md` incluye sección de política manual-base-en.
  - Checklist documentado para migrar un archivo manual.
  - No hay cambios en código.
- **Docs:** `docs/localization.md`.
- **Tests:** N/A (doc-only).

---

## CATALOG-MANUAL-EN-MIGRATION — Per-domain English migration and ES overlay creation

- **Estado:** Partial.
- **Prioridad:** P1.
- **Orden recomendado:** 30.
- **Origen:** CATALOG-MANUAL-LOCALIZATION-AUDIT.
- **Evidencia:** Auditoría completa en `specs/CATALOG-MANUAL-LOCALIZATION-AUDIT/`.
- **Riesgo:** ~1200+ entries con texto visible español en locale=en si la migración/overlay no queda validada y cerrada formalmente.
- **Objetivo:** Paraguas para la migración EN por dominio y creación de overlays ES. Specs individuales: `CATALOG-MANUAL-CORE-TO-EN-01`, `CATALOG-MANUAL-DW-TO-EN-01`, `CATALOG-MANUAL-VISUAL-TO-EN-01`, `CATALOG-MANUAL-RUNTIME-TO-EN-01`, `CATALOG-MANUAL-LANGUAGE-TO-EN-01`, `CATALOG-MANUAL-INTEGRATION-TO-EN-01`, `CATALOG-MANUAL-TOOLING-TO-EN-01` con sus mirrors `CATALOG-LOCALIZATION-ES-MIRROR-*-01`.
- **Depends on:** `CATALOG-MANUAL-BASE-LANGUAGE-POLICY-01`, `CATALOG-MANUAL-CATEGORIES-KEYS-01`, `CATALOG-LOCALIZATION-MIRROR-STRUCTURE-01`.
- **Pendiente exacto:**
  - ejecutar `npm run report:catalog-localization` y confirmar 0 issues;
  - ejecutar tests `catalogLocalization|catalogConsistency`;
  - si todo está verde, mover el cierre real a `docs/done-log.md` y retirar este paraguas del backlog activo o marcarlo `Done` según política del repo.
- **Acceptance criteria:**
  - Todo `manual/**` en inglés canónico.
  - Overlays ES completos para dominios con documentación visible.
  - 0 issues en reporte de localización.
  - `locale=en` no muestra texto español.
- **Docs:** `docs/localization.md`, spec individual por dominio.
- **Tests:** `npm run test:unit -- --grep "catalogLocalization|catalogConsistency"`, `npm run report:catalog-localization`.

**Status por dominio:**
- [x] runtime (Done: systemGlobals, reflection, profiling, errors, ole, mail, system-object-datatypes: 100%)
- [x] core (Done: systemEvents, objectFunctions, globalFunctions)
- [x] datawindow (Done: dataWindowFunctions, dataWindowExpressionFunctions)
- [x] visual (Done: Ribbon, Visual, OLE)
- [x] language (Done: datatypes, enumerations, keywords, operators, pronouns, reservedWords, statements)
- [x] integration (Done: compression, crypto, dotnet, filesystem, http, json, oauth, pdf, rest)
- [x] tooling (Done: PBAutoBuild, ORCA)

---

## PLUGIN-INFRASTRUCTURE-NLS-01 — Plugin UI and Logic Internationalization (NLS)

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 31.
- **Origen:** Auditoría de Internacionalización (Conversación c736c88a).
- **Evidencia:** Mezcla de idiomas en `package.json`, notificaciones hardcoded en español en `extension.ts` y mensajes de diagnóstico (linter) no localizables.
- **Objetivo:** Implementar `vscode-nls` para separar los literales de la lógica.
- **Depends on:** preferible después de `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01` y después de estabilizar reason codes/diagnostics visibles, para evitar mover textos semánticos antes de fijar el contrato.
- **Pendiente exacto:**
  - **package.json**: Mover comandos, settings y descripciones a `package.nls.json`.
  - **Client/Server Strings**: Externalizar logs, notificaciones y nombres de canales de salida.
  - **Linter Messages**: Mover los mensajes de error de `diagnostics.ts` y `documentAnalysis.ts` a un catálogo de mensajes localizable.
  - **Metadata Labels**: Traducir etiquetas de análisis como "Argumento", "Instancia", "Resumen", etc.

---

# 4. Backlog derivado — Errores reales capturados en runtime

> Esta sección consolida errores observados en un workspace PowerBuilder 2025/PFC real. Debe tratarse como entrada prioritaria para specs de corrección. Los errores similares están agrupados para que el agente implemente fixes coherentes y no parches aislados.

---

## 4.1. Backlog derivado — Ultra auditoría semántica PowerBuilder

> Esta sección consolida los hallazgos abiertos de las FASES 1-17 de la ultra auditoría semántica. Cada entrada deja evidencia, riesgo, ejemplo, fuente, validación prevista y notas de performance. Nada dudoso debe quedar solo en el informe.

## PB-AUDIT-P0-DOC-ALIGNMENT-01 — Normalizar owners y lifecycle documental tras la ultra auditoría semántica

- **Estado:** Open.
- **Prioridad:** P0.
- **Orden recomendado:** 01.
- **Confianza:** High.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 12-17 + revisión posterior del plan maestro.
- **Evidencia actualizada:** `PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01` no debe ejecutarse como trabajo activo si ya fue cerrado o absorbido. Queda pendiente verificar que `docs/current-focus.md`, `docs/done-log.md` y `docs/roadmap.md` no mantienen claims contradictorios ni entradas duplicadas, especialmente sobre severity noise y conditional compilation.
- **Ejemplo PowerBuilder:**

```powerscript
lds_test.dataobject = inv_filterattrib.idw_dw.dataobject
this.tabpg_values.dw_values.Retrieve()
```

Los snippets anteriores ya no deberían ensuciar Problems por defecto, pero la documentación activa todavía puede contar historias distintas si current-focus, done-log y roadmap no se normalizan.
- **Fuente:** `docs/backlog.md`, `docs/current-focus.md`, `docs/done-log.md`, `src/server/features/diagnostics.ts`, `test/server/unit/diagnostics.test.ts`.
- **Riesgo:** Crítico. El backlog, el foco activo y el histórico dejan de ser confiables como verdad de estado y favorecen reaperturas o cierres erróneos.
- **Objetivo:** restaurar un único owner por hecho y cerrar contradicciones entre backlog, current-focus, done-log y roadmap.
- **Pendiente exacto:**
  - verificar que `PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01` no aparece como foco activo si ya fue cerrado/absorbido;
  - verificar que `docs/done-log.md` tiene una sola entrada cerrada para el ID si aplica;
  - eliminar claims no soportados sobre conditional compilation o moverlos al owner correcto;
  - cerrar o marcar `Superseded` este item si ya no queda drift real;
  - alinear uso de `Done`, `Superseded`, `Open` y `Partial`.
- **Impacto hot path:** No directo. Doc-only y reporting de estado; no debe introducir runtime nuevo.
- **Depends on:** Nada.
- **Acceptance criteria:**
  - `PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01` deja de figurar como abierto en backlog/current-focus si el cierre técnico sigue validado.
  - `docs/done-log.md` conserva una sola entrada cerrada para el ID y elimina claims no soportados.
  - `docs/backlog.md`, `docs/current-focus.md`, `docs/done-log.md` y `docs/roadmap.md` quedan consistentes en estados y foco.
  - Los gates documentales de conditional compilation quedan o bien explicitados en el owner correcto o bien retirados de los claims que los invocan.
- **Docs:** `docs/backlog.md`, `docs/current-focus.md`, `docs/done-log.md`, `docs/roadmap.md`.
- **Tests:** `npm run test:docs:drift`, `test/server/unit/docsDriftAudit.test.ts`, `test/server/unit/testingMatrixDocs.test.ts`, diagnostics severity unit tests ya existentes.
- **Validación:** revisar estados por ID en los tres docs owner y revalidar que los tests de severidad siguen verdes.

---

## PB-SEMANTIC-P0-FACADE-CONVERGENCE-01 — Convergencia del contrato SemanticQueryFacade entre consumers interactivos

- **Estado:** Open.
- **Prioridad:** P0.
- **Orden recomendado:** 06.
- **Confianza:** High.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 2, 3, 11 y 16.
- **Evidencia:** Hover y Definition ya consumen `semanticQueryFacade`, pero Completion, Signature Help, References y otras surfaces siguen rutas distintas o híbridas. `docs/architecture.md` la presenta como fachada universal, mientras `docs/architecture-implementation-map.md` y el código muestran un slice parcial real.
- **Ejemplo PowerBuilder:**

```powerscript
public function long uf_find(long al_id)
public function long uf_find(string as_code)
```

El mismo símbolo callable debe resolverse con el mismo contrato semántico desde hover, definition, completion y signature help.
- **Fuente:** `src/server/features/hover.ts`, `src/server/features/definition.ts`, `src/server/features/completion.ts`, `src/server/features/signatureHelp.ts`, `src/server/features/references.ts`, `test/server/unit/semanticQueryFacade.test.ts`, `docs/architecture.md`, `docs/architecture-implementation-map.md`.
- **Riesgo:** Crítico. Cada consumer puede divergir en owner, ambiguity, evidence y fallback, generando UX inconsistente y fixes incompletos.
- **Objetivo:** aplicar funcionalmente el contrato común de resolución read-only para surfaces interactivas, con excepciones explícitas y documentadas solo cuando sean inevitables.
- **Pendiente exacto:**
  - fijar la matriz consumer por consumer que debe entrar por la fachada;
  - migrar o encapsular Completion, Signature Help y References hacia la misma capa o documentar claramente las excepciones;
  - unificar exposición de evidence, reason codes y fallback principal.
- **Impacto hot path:** Sí. Debe reutilizar snapshots, query context, hot context y serving cache; prohibido introducir full scans o reparsers por request.
- **Depends on:** `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01`.
- **Acceptance criteria:**
  - hover y definition siguen verdes sin cambio de budgets;
  - al menos completion y signature help usan el mismo contrato o una proyección explícita derivada de él;
  - los consumers migrados comparten semantics para owner, ambiguity y target selection sobre un mismo símbolo;
  - las excepciones restantes quedan documentadas en `docs/architecture-status.md` y `docs/architecture-implementation-map.md`.
- **Docs:** `docs/architecture.md`, `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/testing.md`.
- **Tests:** `test/server/unit/semanticQueryFacade.test.ts`, unit tests de hover/completion/definition/signatureHelp/references, integración LSP para consumers afectados, `test:performance:gate`.
- **Validación:** comparar el mismo foco semántico en varios consumers y comprobar que las decisiones semánticas y budgets siguen alineados.

---

## PB-SEMANTIC-P1-CONFIDENCE-CONTRACT-01 — Calibrar confidence y conflictos cross-surface sin valores fijos no defendibles

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 11.
- **Confianza:** High.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 2, 3, 11, 14 y 16.
- **Evidencia:** `semanticTokens` publica `confidence = high` de forma fija y `Current Object Context` arranca `frameworkKnowledgeConflict` con `resolutionConfidence = high` aunque el foco real no lo haya demostrado. El backlog y current-focus hablan de conservar confidence, pero estas dos surfaces siguen rompiendo el contrato.
- **Ejemplo PowerBuilder:**

```powerscript
TriggerEvent(This, "ue_refresh")
dw_parent.DataObject = ls_dynamic_name
```

Un token coloreado o un conflicto de framework no debe aparentar certeza alta cuando la evidencia es dinámica, heredada o advisory.
- **Fuente:** `src/server/features/semanticTokens.ts`, `src/server/features/currentObjectContext.ts`, `test/server/unit/confidenceCalibration.test.ts`, `test/server/unit/currentObjectContext.test.ts`, `test/server/performance/confidenceCalibration.smoke.test.ts`, `docs/backlog.md`.
- **Riesgo:** Alto. La UI y los reportes read-only pueden sobreprometer exactitud y contaminar explainability, AI bundle y troubleshooting.
- **Objetivo:** eliminar confidence hardcoded y publicar confidence, conflicts y reason codes con la misma disciplina en todas las surfaces afectadas.
- **Pendiente exacto:**
  - sustituir valores fijos por evidence real o degradación explícita;
  - alinear `frameworkKnowledgeConflict` con la confidence del query subyacente;
  - revisar cómo semantic tokens publica o omite confidence;
  - alinear read-only reports con la nueva policy.
- **Impacto hot path:** Sí, indirecto. La calibración debe hacerse offline o con thresholds estables; el runtime no puede recalibrar por request.
- **Depends on:** `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01`, `PB-SEMANTIC-P0-FACADE-CONVERGENCE-01`.
- **Acceptance criteria:**
  - ninguna surface auditada fija `high` sin evidence defendible;
  - los conflicts advisory no ocultan la naturaleza derivada de la evidencia;
  - los reportes read-only preservan confidence y risk sin inflarla;
  - la calibración de confidence sigue pasando sus smokes y no rompe budgets.
- **Docs:** `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/testing.md`, `docs/troubleshooting.md`, `docs/current-focus.md` si se vuelve foco activo.
- **Tests:** `test/server/unit/confidenceCalibration.test.ts`, `test/server/unit/currentObjectContext.test.ts`, `test/server/unit/semanticTokens.test.ts`, `test/server/performance/confidenceCalibration.smoke.test.ts`.
- **Validación:** revisar casos high, medium y low sobre el mismo símbolo y comprobar que semantic tokens, object context y reportes reflejan la misma policy.

---

## PB-SEMANTIC-P1-QUALIFIER-RESOLUTION-01 — Matriz explícita de qualifiers y owner semantics para this, parent, super y global scope

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 09.
- **Confianza:** Medium.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 3, 5, 13 y 16.
- **Evidencia:** El resolver cubre `this`, `parent`, `super`, `ancestor` y partes de `type::member`, pero siguen abiertos los casos de `global::`, `ParentWindow()` y qualifiers especiales documentados por la guía y no cubiertos de forma equivalente en runtime.
- **Ejemplo PowerBuilder:**

```powerscript
::gs_value
This.is_value
Parent.uf_save()
Super::uf_save()
ParentWindow().TriggerEvent("cancelrequested")
```

- **Fuente:** `src/server/knowledge/resolution/semanticQueryService.ts`, `src/server/knowledge/resolution/ownerResolver.ts`, `test/server/unit/scopePriority.test.ts`, `test/server/unit/semanticQueryService.test.ts`, `test/server/unit/definition.test.ts`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.
- **Riesgo:** Alto. Definition, references y hover fallan o degradan de forma poco defendible en patrones OOP básicos y qualifiers explícitos.
- **Objetivo:** cerrar la matriz soportada de qualifiers y owner semantics con ejemplos mínimos, degradación honesta y documentación alineada.
- **Pendiente exacto:**
  - fijar soporte explícito para `global::`;
  - decidir y modelar `ParentWindow()` como función y no como pseudo-pronoun;
  - consolidar `type::member` con tests literales;
  - documentar la matriz exacta soportada y degradada.
- **Impacto hot path:** Sí. Debe resolverse desde query context, graph e identity ya indexada; prohibido abrir búsquedas amplias por workspace.
- **Depends on:** `PB-SEMANTIC-P0-FACADE-CONVERGENCE-01` para consumers migrados.
- **Acceptance criteria:**
  - los casos mínimos `::gs_value`, `This.is_value`, `Parent.uf_save()`, `Super::uf_save()` y `ParentWindow()` quedan cubiertos o degradados explícitamente;
  - definition y hover convergen en el mismo target o la misma degradación;
  - la documentación owner deja clara la matriz soportada.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/architecture-status.md`, `docs/testing.md`.
- **Tests:** `test/server/unit/scopePriority.test.ts`, `test/server/unit/semanticQueryService.test.ts`, `test/server/unit/definition.test.ts`, smokes ligeras sobre corpus PFC/OrderEntry si el cambio toca heurística real.
- **Validación:** abrir los cinco ejemplos mínimos en hover y definition y verificar mismo target o misma degradación.

---

## PB-SEMANTIC-P1-EVENT-DISPATCH-01 — Dispatch explícito de EVENT, TriggerEvent, PostEvent y ancestor calls especiales

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 10.
- **Confianza:** Needs official confirmation.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 3, 5, 6, 13 y 16.
- **Evidencia:** Hay soporte útil para `TriggerEvent` y `PostEvent` con literales, pero siguen fuera del runtime actual `EVENT` directo, `AncestorReturnValue`, `ancestorclass::` y el dispatch explícito `DYNAMIC`. La guía los documenta; el código nuevo no los modela como primer nivel.
- **Ejemplo PowerBuilder:**

```powerscript
This.EVENT ue_refresh()
PostEvent(This, "ue_refresh")
TriggerEvent(This, "ue_refresh")
luo_service.DYNAMIC uf_execute(ls_action)
AncestorReturnValue
```

- **Fuente:** `src/server/utils/invocationContext.ts`, `src/server/features/queryContext.ts`, `src/server/features/references.ts`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, legacy reference in `plugin_old` for `AncestorReturnValue`.
- **Riesgo:** Alto. Event dispatch y ancestor calls quedan modelados a medias y pueden romper definition/references/explainability en código real de framework.
- **Objetivo:** decidir el soporte explícito y la degradación oficial para dispatch directo y llamadas especiales, sin inventar semántica no confirmada.
- **Pendiente exacto:**
  - cubrir o degradar `EVENT` directo;
  - decidir soporte para `AncestorReturnValue` y `ancestorclass::` con evidencia oficial adicional;
  - revisar la invocación `DYNAMIC` explícita como dispatch y no solo como keyword de catálogo.
- **Impacto hot path:** Sí, pero debe reutilizar el carril de invocation context y query context; si la evidencia no es defendible, degradar antes de resolver más.
- **Depends on:** `PB-SEMANTIC-P1-QUALIFIER-RESOLUTION-01` para la parte de qualifiers especiales.
- **Acceptance criteria:**
  - existe una matriz clara de soporte/degradación para `EVENT`, `TriggerEvent`, `PostEvent`, `AncestorReturnValue`, `ancestorclass::` y `DYNAMIC` explícito;
  - definition/references no prometen soporte donde solo hay strings dinámicos;
  - los casos con evidencia oficial insuficiente quedan en `Needs official confirmation` y degradan honestamente.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/architecture-status.md`, `docs/testing.md`.
- **Tests:** `test/server/unit/invocationContext.test.ts`, `test/server/unit/definition.test.ts`, `test/server/unit/references.test.ts`, corpus PFC/OrderEntry para ejemplos reales.
- **Validación:** verificar cada caso mínimo con definition/references y revisar que los no soportados no aparentan certeza alta.

---

## PB-SEMANTIC-P1-POWERSCRIPT-CONTROL-SLICE-01 — Cerrar el slice estructural de IF single-line y exception blocks en PowerScript

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 15.
- **Confianza:** Needs official confirmation.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 1, 4, 13, 15 y 16.
- **Evidencia:** El parser/análisis cubre bien comments, strings, splitter y bloques clásicos, pero sigue sin modelar `IF` single-line como forma oficial y deja `TRY/CATCH/FINALLY`, `THROW` y `THROWS` en un estado parcial o solo de catálogo.
- **Ejemplo PowerBuilder:**

```powerscript
IF ll_count > 0 THEN ll_total = 1 ELSE ll_total = 2

TRY
    THROW le_error
CATCH (Exception le_error)
FINALLY
END TRY
```

- **Fuente:** `src/server/parsing/grammar.ts`, `src/server/parsing/controlBlocks.ts`, `src/server/features/diagnostics.ts`, `src/server/features/diagnosticsExtra.ts`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, documentación oficial ya contrastada para `IF` y `THROWS`.
- **Riesgo:** Alto. El runtime puede describir soporte de control flow que el parser estructural aún no representa de forma defendible.
- **Objetivo:** cerrar un slice estructural concreto y testeable para `IF` single-line y exception blocks, sin abrir un “canon” general de todo el lenguaje.
- **Pendiente exacto:**
  - soportar `IF` single-line y su continuación física con `&`;
  - fijar el soporte estructural de `TRY/CATCH/FINALLY`;
  - decidir si `THROW/THROWS` entra como parseo y diagnostics estructural o si queda documentado como partial.
- **Impacto hot path:** Sí, indirecto. Debe convertirse en facts por documento/version; no puede construir CFG pesado por request.
- **Depends on:** Nada.
- **Acceptance criteria:**
  - `IF` single-line deja de caer fuera del modelo estructural;
  - `TRY/CATCH/FINALLY` tiene soporte estructural explícito o degradación documentada;
  - `THROW/THROWS` dejan de existir solo como catálogo si el runtime afirma soporte estructural.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/testing.md`, `docs/architecture-status.md`.
- **Tests:** `test/server/unit/statementSplitter.test.ts`, `test/server/unit/diagnostics.test.ts`, `test/server/unit/diagnosticsExtra.test.ts`, nuevos fixtures unitarios para `IF` single-line y exception blocks.
- **Validación:** correr unit tests del parser/splitter/diagnostics y revisar ejemplos mínimos en document analysis y diagnostics.

---

## PB-SEMANTIC-P2-LEGACY-CONTROL-MATRIX-01 — Confirmar o degradar labels, GOTO, precedencia y compilación condicional integrada

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 16.
- **Confianza:** Needs official confirmation.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 4, 8, 13, 15 y 16.
- **Evidencia:** El repo reconoce keywords y markers, pero no demuestra soporte estructural equivalente para labels, `GOTO`, precedencia expresiva ni compilación condicional integrada al pipeline principal.
- **Ejemplo PowerBuilder:**

```powerscript
goto retry_label
retry_label:

#if DEBUG then
    ls_mode = "debug"
#end if
```

- **Fuente:** `src/server/parsing/conditionalCompilationGate.ts`, `src/server/parsing/generatedKeywordLexemes.generated.ts`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `test/server/unit/conditionalCompilationGate.test.ts`.
- **Riesgo:** Medio-alto. El plugin puede aparentar conocimiento de constructs legacy o gated que hoy solo existen como catálogo o detector aislado.
- **Objetivo:** decidir, con evidencia oficial adicional cuando haga falta, qué parte se soporta, qué parte se mantiene gated y qué parte debe degradar como `Needs official confirmation`.
- **Pendiente exacto:**
  - validar oficialmente el scope de conditional compilation antes de prometer integración;
  - decidir si labels/GOTO y precedencia salen de catálogo o pasan a soporte estructural;
  - documentar la matriz resultante y no sobreprometer semántica.
- **Impacto hot path:** Sí, indirecto. Cualquier integración debe ser index-time o por snapshot, no por request.
- **Depends on:** `PB-SEMANTIC-P1-POWERSCRIPT-CONTROL-SLICE-01` para no mezclar el slice estructural ya decidido con el legacy/dudoso.
- **Acceptance criteria:**
  - la documentación owner deja clara la diferencia entre soporte estructural, detector y `Needs official confirmation`;
  - el pipeline principal no afirma soporte de constructs que solo detecta o lista en catálogo;
  - las dudas mínimas quedan trazadas con fuente oficial o con gap explícito.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/architecture-status.md`, `docs/backlog.md`.
- **Tests:** `test/server/unit/conditionalCompilationGate.test.ts`, nuevos tests mínimos solo si el alcance se confirma; `docs:drift` para asegurar que el support matrix quede honesto.
- **Validación:** revisar support matrix final y comprobar que los constructs dudosos degradan o quedan fuera del runtime semántico activo.

---

## PB-SEMANTIC-P1-DATAWINDOW-ADVANCED-SLICE-01 — Extender el slice seguro de DataWindow sin romper budgets ni fronteras de sublenguaje

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 20.
- **Confianza:** Medium.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 3, 7, 10, 14, 15 y 16.
- **Evidencia:** El repo tiene un slice DataWindow fuerte en fast context, bindings literales, `.srd`, property paths seguros y child chains deterministas, pero siguen fuera `Object.column[row]`, `Object.Data.Primary[row,col]`, `Evaluate`, `SyntaxFromSQL -> Create` y gran parte de las operaciones de edición y filas.
- **Ejemplo PowerBuilder:**

```powerscript
ls_name = dw_1.Object.emp_name[1]
ll_value = dw_1.Object.Data.Primary[1, 1]
ls_syntax = SyntaxFromSQL(ls_sql, ls_style, ls_err)
dw_1.Create(ls_syntax, ls_err)
```

- **Fuente:** `src/server/features/dataWindowFastContext.ts`, `src/server/features/dataWindowPropertyPaths.ts`, `src/server/features/dataWindowModel.ts`, `test/server/unit/dataWindowFastContext.test.ts`, `test/server/unit/currentObjectContext.test.ts`, `test/smoke/datawindow-b344.extension.test.ts`, advanced specs 249/283/299.
- **Riesgo:** Alto. El plugin podría confundir cobertura segura actual con soporte total de DataWindow o degradar demasiado poco ante expresiones dinámicas.
- **Objetivo:** ampliar solo el slice defendible, con cache y budgets explícitos, manteniendo la regla de que `.srd` y expresiones DataWindow no son PowerScript normal.
- **Pendiente exacto:**
  - decidir qué property paths y accesos indexados entran en el slice seguro;
  - extender `Evaluate` y `SyntaxFromSQL -> Create` solo si se puede conservar degradación honesta;
  - cubrir operaciones de edición/filas que ya tengan patrón defendible;
  - fijar un gate de performance para el escaneo de diagnostics y property paths avanzadas.
- **Impacto hot path:** Sí. Todo lo pesado debe resolverse en index-time o en modelos cacheables; los casos dinámicos deben degradar por confidence.
- **Depends on:** `PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01`, specs y slices existentes de DataWindow (`249`, `283`, `299`).
- **Acceptance criteria:**
  - el nuevo slice se expresa como whitelist defendible, no como parser DataWindow general;
  - hover/completion/definition/diagnostics sobre los casos añadidos pasan en el fixture correspondiente;
  - los casos dinámicos o ambiguos degradan de forma honesta;
  - el performance gate sigue verde.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/testing.md`, `docs/performance-budget.md`.
- **Tests:** `test/server/unit/dataWindowFastContext.test.ts`, `test/server/unit/currentObjectContext.test.ts`, `test/server/unit/diagnostics.test.ts`, `test/smoke/datawindow-b344.extension.test.ts`, `test:performance:gate`.
- **Validación:** verificar hover/completion/definition/diagnostics en fixtures DataWindow seguros y revalidar budgets del fast context.

---

## PB-SEMANTIC-P1-SQL-TRANSACTION-ANCHORS-01 — Mejorar anchors SQL y binding transaccional sin abrir un parser SQL de hot path

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 21.
- **Confianza:** Medium.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 3, 8, 10, 14, 15 y 16.
- **Evidencia:** El runtime delimita regiones SQL y proyecta transaction targets a nivel de archivo, pero no valida host variables ni statement-level binding, y el binding DataWindow aún es rígido con descendants de `Transaction`.
- **Ejemplo PowerBuilder:**

```powerscript
DECLARE cur_orders CURSOR FOR
SELECT order_id INTO :ll_order_id FROM orders;

n_tr_desc inv_tr
dw_1.SetTransObject(inv_tr)
```

- **Fuente:** `src/server/parsing/sqlRegions.ts`, `src/server/features/embeddedSqlAnchors.ts`, `src/server/features/diagnostics.ts`, `src/server/features/currentObjectContext.ts`, OrderEntry/PFC corpora, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.
- **Riesgo:** Alto. El plugin puede atribuir mal la transacción activa, degradar mal SQL embebido y dejar fuera descendientes reales de `Transaction`.
- **Objetivo:** endurecer el slice de SQL embebido y binding transaccional que ya existe, sin introducir un parser SQL profundo en el editor.
- **Pendiente exacto:**
  - mejorar `transactionTarget` a nivel de statement o binding defendible;
  - cubrir descendientes de `Transaction` en binding semántico;
  - formalizar qué subset de SQL embebido está realmente anclado.
- **Impacto hot path:** Sí, indirecto. Debe reutilizar anchors y facts por documento; prohibido abrir parseo SQL profundo por request.
- **Depends on:** `PB-ARCH-P0-SEMANTIC-SOURCE-OF-TRUTH-01`; coordinar con `PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01`.
- **Acceptance criteria:**
  - el binding transaccional acepta descendientes reales de `Transaction` cuando la evidencia de tipo es suficiente;
  - los anchors SQL distinguen mejor el target transaccional por statement o por binding defendible;
  - la documentación owner deja claro qué subset de SQL embebido está soportado.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/architecture-status.md`, `docs/testing.md`.
- **Tests:** `test/server/unit/sqlRegions.test.ts`, `test/server/unit/diagnostics.test.ts`, `test/server/unit/currentObjectContext.test.ts`, corpus OrderEntry/PFC.
- **Validación:** revalidar anchors y bindings sobre ejemplos de corpus real y comprobar que no aparecen regressions en diagnostics ni explainability.

---

## PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01 — Registrar alcance real de host variables, dynamic SQL 2-4 y SQL de stored procedures

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 23.
- **Confianza:** Needs official confirmation.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 8, 10, 13, 15 y 16.
- **Evidencia:** `dynamicStringReferences` detecta `EXECUTE IMMEDIATE`, `PREPARE` y algunos patrones, pero no existe un carril semántico equivalente para host variables, indicator variables, `DESCRIBE`, `OPEN DYNAMIC`, `EXECUTE DYNAMIC` ni `DECLARE PROCEDURE` con cobertura estructural real.
- **Ejemplo PowerBuilder:**

```powerscript
PREPARE SQLSA FROM :ls_sql
DECLARE dyn_cur DYNAMIC CURSOR FOR SQLSA
EXECUTE IMMEDIATE :ls_stmt
DECLARE proc_order PROCEDURE FOR sp_order
```

- **Fuente:** `src/server/features/dynamicStringReferences.ts`, `src/server/parsing/sqlRegions.ts`, corpus OrderEntry y legacy dump, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, documentación oficial pendiente de ampliación en este frente.
- **Riesgo:** Medio-alto. La guía puede sobredescribir soporte SQL avanzado que hoy solo existe como boundary o strings heurísticos.
- **Objetivo:** dejar trazado y testeable el alcance real de dynamic SQL avanzado y stored procedure SQL, con soporte solo cuando haya evidencia defendible y degradación cuando no.
- **Pendiente exacto:**
  - validar oficialmente el alcance mínimo viable;
  - decidir si host variables e indicator variables entran en validación semántica o quedan como boundary documentado;
  - fijar la matriz `Implemented / Heuristic only / Needs official confirmation` por constructo.
- **Impacto hot path:** Sí, indirecto. Toda ampliación debe ser index-time o report-only, nunca parser SQL profundo en request interactiva.
- **Depends on:** `PB-SEMANTIC-P1-SQL-TRANSACTION-ANCHORS-01` para el slice SQL básico.
- **Acceptance criteria:**
  - existe una matriz honesta de soporte para host vars, indicator vars, dynamic SQL 2-4 y stored procedure SQL;
  - lo no soportado degrada y no se presenta como semántica fuerte;
  - cualquier soporte nuevo tiene evidencia oficial o corpus de validación explícita.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/backlog.md`, `docs/testing.md`.
- **Tests:** nuevos unit tests solo para el subset confirmado, corpus legacy/OrderEntry, `docs:drift` para support matrix.
- **Validación:** comparar support matrix documental con el subset realmente cubierto por tests y no prometer más de lo que el runtime ejecuta.

---

## PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01 — Formalizar metadata mínima defendible para interop nativo y PBX/PBNI

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 24.
- **Confianza:** Needs official confirmation.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 3, 9, 10, 15 y 16.
- **Evidencia:** El parser/classifier distingue `external`, `RPCFUNC`, `pbx` y `dll`, pero sigue siendo superficial respecto a `REF`, `longptr`, bitness, marshaling, `PBX_GetDescription` y metadatos PBNI. El producto es prudente, pero varias surfaces documentan más de lo que implementan.
- **Ejemplo PowerBuilder:**

```powerscript
FUNCTION long MessageBoxW (ref string as_text) LIBRARY "user32.dll" ALIAS FOR "MessageBoxW"
```

- **Fuente:** `src/server/parsing/externalFunctions.ts`, `src/server/analysis/documentAnalysis.ts`, `src/server/features/diagnostics.ts`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, PFC/STD corpora nativos.
- **Riesgo:** Medio-alto. La clasificación actual puede ser suficiente para reporting, pero no para semántica “segura” de interop ni para claims más profundos en docs.
- **Objetivo:** fijar una metadata mínima defendible para interop nativo, dejando explícitos los límites de no soporte profundo para ABI, bitness y PBNI metadata.
- **Pendiente exacto:**
  - separar lo que es clasificación de lo que es semántica fuerte;
  - decidir cómo reflejar `REF`, `longptr` y bitness en reportes y diagnostics;
  - dejar `PBX_GetDescription` e interfaces PBNI como `Needs official confirmation` hasta tener evidencia fuerte.
- **Impacto hot path:** No directo. Debe vivir en reporting, checks y docs; no en providers interactivos pesados.
- **Depends on:** Nada; recomendado coordinar con `PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01`.
- **Acceptance criteria:**
  - el runtime distingue claramente metadata nativa mínima frente a no soporte profundo;
  - las surfaces read-only no prometen más de lo que el parser y classifier realmente conocen;
  - la documentación owner deja explícitos límites y riesgos.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/architecture-status.md`, `docs/testing.md`, `docs/troubleshooting.md` si se exponen síntomas concretos.
- **Tests:** `test/server/unit/externalFunctions.test.ts`, `test/server/unit/diagnostics.test.ts`, `test/server/unit/powerBuilderTechnicalDebtReport.test.ts`, `test/server/unit/workspaceCheckReport.test.ts`.
- **Validación:** revisar que external/RPCFUNC/PBX/PBNI aparecen con el nivel de detalle realmente soportado y sin claims implícitos de ABI completo.

---

## PB-SEMANTIC-P2-BUILD-SOURCE-METADATA-01 — Separar artefactos build-only y source model semántico, incluyendo PBD y .pblmeta

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 26.
- **Confianza:** Medium.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 9, 10, 15 y 16.
- **Evidencia:** El repo distingue bien `.pbl` binaria y source origins, pero `PBD` sigue fuera del artifact kind semántico, `.pblmeta` tiene parser mínimo sin integración fuerte, y la documentación mezcla a veces policy de build con source model activo.
- **Ejemplo PowerBuilder:** ejemplo de source exportado afectado por el boundary build/source:

```powerscript
forward
global type n_cst_service from nonvisualobject
end type
```

Ese source exportado debe seguir siendo fuente real, mientras `PBD`, `ORCA staging` y `.pblmeta` se tratan como metadata o artefacto derivado según corresponda.
- **Fuente:** `src/shared/powerbuilderFiles.ts`, `src/shared/sourceOrigin.ts`, `src/server/workspace/pblmeta.ts`, `src/server/build/orcaStagingExport.ts`, `src/server/build/orcaStagingImport.ts`, `src/client/build/orcaDetection.ts`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.
- **Riesgo:** Medio. Usuarios y agentes pueden confundir artefacto compilado, metadata de build y fuente real, reabriendo round-trip unsafe o claims falsos de soporte semántico.
- **Objetivo:** fijar un contrato claro de artefactos build-only frente a fuente semántica editable, incluyendo `PBD`, `.pblmeta` y staging ORCA.
- **Pendiente exacto:**
  - definir la representación visible de `PBD` como build-only;
  - decidir si `.pblmeta` se integra de verdad o se mantiene como parser experimental;
  - alinear reporting y docs con el source model real y sus prioridades de `sourceOrigin`.
- **Impacto hot path:** No. Debe quedarse en discovery, reports, build lanes y docs.
- **Depends on:** Nada.
- **Acceptance criteria:**
  - `sourceOrigin` y artifact kinds distinguen claramente fuente real, staging y artefacto compilado;
  - las docs owner dejan claro qué queda fuera del serving semántico;
  - `.pblmeta` tiene status explícito como integrado o experimental.
- **Docs:** `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/testing.md`.
- **Tests:** `test/server/unit/sourceOrigin.test.ts`, `test/server/unit/pblmeta.test.ts`, ORCA staging tests existentes, `docs:drift`.
- **Validación:** revisar sourceOrigin, ORCA staging y metadata build/source sin reintroducir serving sobre artefactos no fuente.

---

## PB-RUNTIME-P1-READONLY-SURFACES-GATES-01 — Asignar owners, tests y budgets a surfaces read-only y runtime self-test

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 13.
- **Confianza:** High.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 11, 12, 14, 15 y 16.
- **Evidencia:** Current Object Context, Diagnostics Explainability, Object Explorer, health dashboard, workspace/object check y AI bundle ya existen, pero su ownership documental, sus gates de testing y sus budgets de performance siguen incompletos o dispersos.
- **Ejemplo PowerBuilder:**

```powerscript
dw_parent.DataObject = "d_orders"
dw_parent.Retrieve()
```

El mismo contexto semántico debe llegar de forma coherente a hover, diagnostics explainability, current object context y reportes read-only.
- **Fuente:** `src/shared/publicApi.ts`, `src/client/extension.ts`, `src/client/objectExplorerModel.ts`, `src/client/currentObjectContextPanelModel.ts`, `src/client/diagnosticsExplainabilityPanelModel.ts`, `src/client/runtimeSelfTest.ts`, `docs/testing.md`, `docs/performance-budget.md`.
- **Riesgo:** Alto. Las surfaces read-only pueden parecer sanas mientras consumen solo estado derivado, sin oracles ni budgets suficientes.
- **Objetivo:** asignar owners, matrices de prueba y budgets explícitos a las surfaces read-only y al runtime self-test que ya forman parte del producto.
- **Pendiente exacto:**
  - extender la matriz de testing a las surfaces publicadas por la API pública y los paneles read-only;
  - fijar budgets para esas surfaces en `docs/performance-budget.md`;
  - ampliar runtime self-test con probes funcionales donde hoy solo hay builders o estado derivado.
- **Impacto hot path:** No directo en tipeo, pero sí en activación, reportes on-demand y runtime self-test. Debe usar caps, background y gating explícito.
- **Depends on:** `PB-SEMANTIC-P1-CONFIDENCE-CONTRACT-01` para las surfaces que publiquen confidence y riesgo.
- **Acceptance criteria:**
  - cada surface read-only visible tiene owner documental, suites mínimas y budget explícito si corresponde;
  - runtime self-test cubre probes funcionales adicionales cuando la surface lo requiera;
  - docs de testing, troubleshooting y performance reflejan la superficie real del producto.
- **Docs:** `docs/testing.md`, `docs/troubleshooting.md`, `docs/performance-budget.md`, `docs/architecture-status.md`, `docs/current-focus.md` si pasa a foco activo.
- **Tests:** `test/server/unit/publicApi.test.ts`, `test/server/unit/currentObjectContextPanelModel.test.ts`, `test/server/unit/diagnosticsExplainabilityPanelModel.test.ts`, `test/server/unit/objectExplorerModel.test.ts`, `test/server/unit/runtimeSelfTest.test.ts`, `test/server/unit/docsDriftAudit.test.ts`, `test/server/unit/testingMatrixDocs.test.ts`, smoke ligera sobre views/read-only commands.
- **Validación:** ejecutar docs drift, revisar public API/read-only reports y confirmar que self-test y budgets cubren las surfaces ya publicadas.

---

## 4.2. Backlog arquitectónico final — Diseño semántico objetivo

> Esta sección deriva de `docs/semantic-design-target.md` y `docs/semantic-design-assumptions.md`.
> Si un ítem queda cubierto por una entrada previa de este backlog, se mantiene la trazabilidad aquí y se ejecuta en el ítem absorbente.
> `PB-ARCH-*` define contrato/arquitectura/conformance; `PB-SEMANTIC-*` implementa funcionalidad concreta/hardening.

## PB-ARCH-P0-SEMANTIC-DESIGN-TARGET-01 — Congelar contrato objetivo y ownership documental

- **Estado:** Partial.
- **Prioridad:** P0.
- **Orden recomendado:** 02.
- **Origen:** Plan maestro de diseño semántico.
- **Problema:** el diseño objetivo nuevo vive en documentos de auditoría y todavía no está enlazado como contrato operativo desde los owner docs.
- **Objetivo:** fijar `docs/semantic-design-target.md` como owner del target futuro y declarar su relación con architecture/status/map/backlog.
- **Fuente de verdad afectada:** documentación de arquitectura y estado.
- **Consumers afectados:** agentes, maintainers, reviewers y backlog planning.
- **Caches afectadas:** ninguna runtime.
- **Riesgo actual:** alto; la auditoría puede quedar como informe aislado y no como dirección ejecutable.
- **Diseño objetivo:** target futuro, estado real y backlog viven separados y enlazados, con un solo owner por fact.
- **Plan incremental:** cerrar FASE 12, actualizar owner docs en FASE 11, añadir checks de drift si aplica.
- **Notas de performance:** no debe introducir runtime; protege la meta de discovery/indexing rápido desde docs.
- **Escala 5000+ archivos:** aplica como criterio documental obligatorio.
- **Pendiente exacto:**
  - validar que `docs/semantic-design-target.md` está enlazado desde todos los owner docs;
  - ejecutar `npm run test:docs:drift`;
  - ejecutar `npm run test:architecture:rapid`;
  - actualizar `docs/done-log.md` si se decide cerrar formalmente.
- **Acceptance criteria:** el target está enlazado desde docs owner; status distingue estado real vs futuro; no hay claims duplicados.
- **Docs:** `docs/semantic-design-target.md`, `docs/architecture.md`, `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/current-focus.md`.
- **Tests:** `npm run test:docs:drift`, `npm run test:architecture:rapid`.
- **Validación:** revisión de enlaces/owners y `get_errors` sobre docs tocados.

																							

				   
					
												 
																																									  
																														
																																	
																														 
																												 
																																  
																														
																											 
																														
																					
																																								
																									 
																														  
																														 

## PB-ARCH-P0-SEMANTIC-CONFORMANCE-TESTS-01 — Crear gates de conformidad semántica cross-surface

- **Estado:** Open.
- **Prioridad:** P0.
- **Orden recomendado:** 03.
- **Origen:** Plan maestro de diseño semántico.
- **Depends on:** `PB-ARCH-P0-SEMANTIC-DESIGN-TARGET-01`.
- **Problema:** las reglas del target no tienen todavía una batería obligatoria que falle si un consumer reintroduce verdad paralela o full scans.
- **Objetivo:** añadir tests de conformidad para source-of-truth, query contract, cache keys, confidence/evidence y read-only projections.
- **Fuente de verdad afectada:** contratos de KnowledgeBase, SemanticQueryResult, caches y public API.
- **Consumers afectados:** providers LSP, diagnostics, reports, panels, AI bundles.
- **Caches afectadas:** todas las caches de serving/projection y persistence metadata.
- **Riesgo actual:** alto; sin gates, el diseño se erosiona por cambios locales.
- **Diseño objetivo:** tests rápidos detectan layering drift, payload drift, confidence drift y hot-path full scans.
- **Plan incremental:** empezar con arquitectura/docs; añadir golden cross-surface; extender a DataWindow/SQL/native cuando se publiquen submodelos.
- **Notas de performance:** los tests deben medir budgets sin depender de fixtures privadas obligatorias.
- **Escala 5000+ archivos:** incluir corpus sintético o fixtures públicas suficientes para fan-out/caps.
- **Acceptance criteria:** fallan si un provider resuelve fuera de facade sin excepción, si cache key omite epoch/fingerprint/sourceOrigin o si report materializa listas sin cap.
- **Docs:** `docs/testing.md`, `docs/performance-budget.md`, `docs/architecture-status.md`.
- **Tests:** `test:architecture:rapid`, `test:architecture:metrics`, `test:performance:gate`, unit golden por consumer.
- **Validación:** ejecutar gates rápidos y documentar skips honestos para corpus local opcional.

## PB-ARCH-P0-SEMANTIC-SOURCE-OF-TRUTH-01 — Publicar una sola verdad semántica versionada

- **Estado:** Open.
- **Prioridad:** P0.
- **Orden recomendado:** 04.
- **Origen:** Plan maestro de diseño semántico.
- **Depends on:** `PB-ARCH-P0-SEMANTIC-CONFORMANCE-TESTS-01`.
- **Problema:** `KnowledgeBase.publishedState` es la verdad actual, pero algunos consumers y DTOs pueden reconstruir semántica o identidad fuera del contrato común.
- **Objetivo:** declarar y validar que `PublishedSemanticSnapshot` es contrato sobre `KnowledgeBase`, no store paralelo.
- **Fuente de verdad afectada:** `KnowledgeBase`, `SemanticDocumentSnapshot`, ProjectModel/source origin y SystemCatalog references.
- **Consumers afectados:** todos los providers LSP, reports, Object Explorer, Current Object Context, AI/support bundles.
- **Caches afectadas:** DocumentCache, ServingCache, HotContextCache, Presentation/negative y report projections.
- **Riesgo actual:** crítico; múltiples verdades generan confidence drift, stale payloads y comportamiento distinto por surface.
- **Diseño objetivo:** inputs/facts/enrichment publican en snapshot atómico; consumers sólo leen slices/proyecciones.
- **Plan incremental:** inventariar writes/reads, añadir conformance tests, migrar consumers por etapas 2-9.
- **Notas de performance:** prohibir clones/listas completas en hot path; preferir índices por URI/name/kind/container.
- **Escala 5000+ archivos:** sí; exige queries acotadas y fan-out por dependencias.
- **Acceptance criteria:** no hay provider/report que declare una verdad semántica alternativa sin owner; snapshot expone epoch/readiness/evidence suficientes.
- **Docs:** `docs/semantic-design-target.md`, `docs/symbol-system.md`, `docs/architecture-status.md`.
- **Tests:** KnowledgeBase publish/restore, semantic snapshot tests, architecture rapid gate, cross-surface golden matrix.
- **Validación:** comparar un mismo foco semántico en hover/definition/completion/reports y confirmar identidad común.

## PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01 — Formalizar SemanticQueryResult detrás de la facade

- **Estado:** Open.
- **Prioridad:** P0.
- **Orden recomendado:** 05.
- **Origen:** Plan maestro de diseño semántico.
- **Depends on:** `PB-ARCH-P0-SEMANTIC-SOURCE-OF-TRUTH-01`.
- **Problema:** `ResolvedTargetInfo` ya contiene evidence/confidence, pero el envelope común por consumer/cacheability/degraded state no es contrato único.
- **Objetivo:** definir `SemanticQueryResult` como respuesta semántica común y adaptar consumers gradualmente.
- **Fuente de verdad afectada:** `SemanticQueryService`, `SemanticQueryFacade`, query policies y reason codes.
- **Consumers afectados:** hover, definition, completion, signature help, references, diagnostics, current context, explainability.
- **Caches afectadas:** ServingCache, HotContextCache, Presentation/negative.
- **Riesgo actual:** crítico; cada consumer puede filtrar candidates, confidence y fallback de forma distinta.
- **Diseño objetivo:** facade devuelve target, alternatives, evidence, reasons, degraded state y cacheability por policy.
- **Plan incremental:** adaptar facade sin romper `ResolvedTargetInfo`; migrar completion/signature/references; bloquear excepciones sin owner.
- **Notas de performance:** evidence/alternatives deben caparse por consumerProjection y serializarse sólo si se piden.
- **Escala 5000+ archivos:** candidates siempre acotados por scope/project/library/dependencies.
- **Acceptance criteria:** el mismo foco resuelve con el mismo target/owner/confidence en hover, definition y al menos completion/signature; fallbacks llevan reason.
- **Docs:** `docs/semantic-design-target.md`, `docs/symbol-system.md`, `docs/testing.md`.
- **Tests:** semanticQueryFacade, query service, hover/definition/completion/signature golden, payload budget.
- **Validación:** cross-surface matrix sobre overloads, inheritance, DataWindow safe slice y system catalog.

## PB-ARCH-P1-CONSUMER-CONVERGENCE-COMPLETION-SIGNATURE-01 — Migrar completion y signature help a proyecciones comunes

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 07.
- **Origen:** Plan maestro de diseño semántico.
- **Depends on:** `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01`, `PB-SEMANTIC-P0-FACADE-CONVERGENCE-01`.
- **Problema:** completion y signature help todavía combinan queryContext, system catalog y DataWindow adapters con reglas propias.
- **Objetivo:** convertirlas en projections de `SemanticQueryResult` sin perder ranking, resolve ni retrieve signatures.
- **Fuente de verdad afectada:** query result, SystemCatalog, DataWindowSubmodel seguro.
- **Consumers afectados:** completion, completion resolve, signatureHelp.
- **Caches afectadas:** ServingCache, PresentationCache, stale guard, HotContextCache.
- **Riesgo actual:** alto; completion puede mostrar candidates con confidence/owner distinto a hover/definition.
- **Diseño objetivo:** initial completion ligero; resolve enriquecido; signature overloads con evidence y degraded reason.
- **Plan incremental:** primero callable/receiver/enum context; luego DataWindow retrieve; después cleanup de helpers duplicados.
- **Notas de performance:** mantener budget interactivo de 50 ms y result caps.
- **Escala 5000+ archivos:** no usar `getAllEntities()` sin filtro; pool por scope/project/catalog.
- **Acceptance criteria:** completions y signatures comparten target selection con facade; low confidence se degrada; performance gate verde.
- **Docs:** `docs/architecture-status.md`, `docs/testing.md`, `docs/performance-budget.md`.
- **Tests:** completion, completion resolve, signature help, DataWindow retrieve signature, cross-surface golden matrix.
- **Validación:** comparar same-focus hover/definition/completion/signature en fixtures con overload y DataWindow.

## PB-ARCH-P1-REFERENCES-STRUCTURAL-CONFIRMATION-01 — Confirmar references por identidad y pools acotados

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 08.
- **Origen:** Plan maestro de diseño semántico.
- **Depends on:** `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01`.
- **Problema:** references/rename pueden depender de textual fallback o pools amplios si la identidad/fan-out no está confirmada.
- **Objetivo:** asegurar references estructurales sobre identity key común, dependency neighborhood y truncation explícita.
- **Fuente de verdad afectada:** SymbolModel, dependency indexes, query result target identity.
- **Consumers afectados:** references, rename, impact analysis, safe edit plan.
- **Caches afectadas:** KB indexes, future reference source pool, ServingCache si se sirve interactivo.
- **Riesgo actual:** alto; full scan o target mismatch en workspace grande rompe UX y confianza.
- **Diseño objetivo:** references usa target confirmado; textual fallback sólo bajo policy, cap y reason.
- **Plan incremental:** alinear definition/references target; añadir pools por project/library/dependencies; exponer truncation.
- **Notas de performance:** presupuesto interactivo y cancelación; report mode paginado.
- **Escala 5000+ archivos:** obligatorio usar pools y caps, nunca scan global por defecto.
- **Acceptance criteria:** references y definition coinciden en target; rename no procede con ambiguity no resuelta; reports declaran truncation.
- **Docs:** `docs/testing.md`, `docs/performance-budget.md`, `docs/architecture-status.md`.
- **Tests:** references, rename, impact analysis, performance gate, PFC/OrderEntry opcional.
- **Validación:** ejecutar fixtures con herencia, overloads, events y sourceOrigin filters.

## PB-ARCH-P1-SEMANTIC-TOKENS-EVIDENCE-CONTRACT-01 — Separar tokens visuales y evidencia semántica

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 12.
- **Origen:** Plan maestro de diseño semántico.
- **Depends on:** `PB-SEMANTIC-P1-CONFIDENCE-CONTRACT-01`.
- **Problema:** semantic tokens puede publicar confidence fija o ser interpretado por reports/AI como verdad semántica fuerte.
- **Objetivo:** distinguir token estructural, token resuelto y token advisory con confidence/evidence sólo cuando exista.
- **Fuente de verdad afectada:** DocumentFacts, SymbolModel, ConfidenceEvidenceModel.
- **Consumers afectados:** semantic tokens, themes, AI/read-only reports que consuman token metadata.
- **Caches afectadas:** document snapshot/fingerprint y LSP semantic token delta.
- **Riesgo actual:** medio-alto; colorización puede inflar certeza y romper hot path si resuelve deep por token.
- **Diseño objetivo:** tokenización rápida por documento; resolución semántica sólo para casos acotados y evidence explícita.
- **Plan incremental:** calibrar confidence; actualizar tests; adaptar reports a no tratar color como evidencia de resolución.
- **Notas de performance:** no resolver candidates globales por token; usar snapshots y símbolos locales.
- **Escala 5000+ archivos:** sí, por documento abierto.
- **Acceptance criteria:** no queda confidence `high` hardcoded para token semántico sin evidence; legend y ranges siguen estables.
- **Docs:** `docs/symbol-system.md`, `docs/testing.md`, `docs/architecture-status.md`.
- **Tests:** semantic tokens unit, confidence calibration, performance allocation.
- **Validación:** comparar tokens estructurales/resueltos en fixtures con unknown/dynamic symbols.

## PB-ARCH-P1-CACHE-SEMANTIC-EPOCH-CONTRACT-01 — Separar semanticEpoch, kbVersion y documentFingerprint

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 17.
- **Origen:** Plan maestro de diseño semántico.
- **Depends on:** `PB-ARCH-P0-SEMANTIC-SOURCE-OF-TRUTH-01`, `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01`.
- **Problema:** cambios de epoch global pueden invalidar demasiado y changes textuales sin diff público pueden forzar flush innecesario.
- **Objetivo:** formalizar relación entre semanticEpoch, kbVersion, documentVersion, documentFingerprint y sourceOrigin en todas las caches.
- **Fuente de verdad afectada:** KnowledgeBase publish path, DocumentFacts, cache key contract.
- **Consumers afectados:** hover, completion, signature help, definition, references, read-only reports.
- **Caches afectadas:** DocumentCache, ServingCache, HotContextCache, Presentation/negative, report projections, persistence checkpoint.
- **Riesgo actual:** alto; stale o over-invalidation degrada UX en workspaces grandes.
- **Diseño objetivo:** fingerprint protege payloads de documento; epoch protege verdad publicada; no-op semantic publish evita epoch si facts públicos no cambian.
- **Plan incremental:** auditar keys; migrar legacy serving keys; añadir diff público por URI; validar persistence restore.
- **Notas de performance:** selective invalidation, no workspace-wide flush por edición textual local sin cambio semántico.
- **Escala 5000+ archivos:** crítico para evitar cascadas.
- **Acceptance criteria:** cache keys incluyen discriminadores obligatorios; no-op edits no limpian todo; stale guard detecta mismatch real.
- **Docs:** `docs/performance-budget.md`, `docs/architecture-status.md`, `docs/semantic-design-target.md`.
- **Tests:** cache key contract, stale guard, ServingCache TTL/invalidation, persistence restore, performance gate.
- **Validación:** simular edición textual sin cambio semántico y edición con cambio de symbol/dependency.

## PB-ARCH-P1-CROSS-CACHE-INVALIDATION-COORDINATOR-01 — Coordinar eventos de invalidación entre caches y KB

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 18.
- **Origen:** Plan maestro de diseño semántico.
- **Depends on:** `PB-ARCH-P1-CACHE-SEMANTIC-EPOCH-CONTRACT-01`.
- **Problema:** invalidaciones por URI, epoch, sourceOrigin, locale, ProjectModel y submodelos están repartidas entre caches y handlers.
- **Objetivo:** definir un coordinador o contrato event-driven para `DocumentChanged`, `DocumentFactsChanged`, `ProjectModelChanged`, `LibraryOrderChanged`, `DataWindowFactsChanged`, `SqlAnchorsChanged`, `KnowledgeBasePublished` y `SemanticEpochAdvanced`.
- **Fuente de verdad afectada:** events de workspace/document analysis y publish KB.
- **Consumers afectados:** providers LSP, diagnostics, reports, status/health.
- **Caches afectadas:** todas las caches runtime y read-only projections.
- **Riesgo actual:** alto; invalidar de más rompe performance, invalidar de menos produce stale output.
- **Diseño objetivo:** cada event declara scope, affected URI/project/submodel, cache classes y metrics.
- **Plan incremental:** documentar event map; instrumentar metrics; migrar caches una por una; añadir memory pressure hooks.
- **Notas de performance:** selective invalidation y backpressure; no sync full scan en handler de evento.
- **Escala 5000+ archivos:** obligatorio para fan-out controlado.
- **Acceptance criteria:** cada cache tiene invalidation path probado; eventos de ProjectModel/LibraryOrder no borran DocumentCache si no cambian facts.
- **Docs:** `docs/performance-budget.md`, `docs/troubleshooting.md`, `docs/architecture-status.md`.
- **Tests:** invalidation unit tests, integration edit/publish tests, performance gate, runtime stats checks.
- **Validación:** escenarios de cambio de texto, cambio de DataWindow, cambio de library order y restore checkpoint.

## PB-ARCH-P1-READONLY-SURFACES-PROJECTIONS-01 — Unificar reports, panels y bundles como proyecciones acotadas

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 14.
- **Origen:** Plan maestro de diseño semántico.
- **Depends on:** `PB-RUNTIME-P1-READONLY-SURFACES-GATES-01`, `PB-SEMANTIC-P1-CONFIDENCE-CONTRACT-01`.
- **Problema:** Object Explorer, Current Object Context, explainability, health, code metrics, technical debt, migration assistant, workspace check y support/AI bundles repiten facts y budgets.
- **Objetivo:** convertir todas las surfaces read-only en projections con owner, caps, receipts, redaction y epoch.
- **Fuente de verdad afectada:** PublishedSemanticSnapshot, diagnostics snapshot, runtime stats y public API DTOs.
- **Consumers afectados:** developer UI, support, AI agents, release/readiness checks.
- **Caches afectadas:** ReadOnlyReportCache target, report workload lane, support bundle materialization, PresentationCache if view-model.
- **Riesgo actual:** alto; surfaces pueden divergir o materializar payloads enormes.
- **Diseño objetivo:** cada report/panel declara fuente, epoch, limits, truncation y degraded reason; no recalcula semántica en cliente.
- **Plan incremental:** public API receipts; panel model parity; report limits; support/AI bundle redaction; cleanup de builders duplicados.
- **Notas de performance:** report lane/background, pagination y token budgets.
- **Escala 5000+ archivos:** parcial hasta que todo tenga page tokens/caps.
- **Acceptance criteria:** no surface grande devuelve listas completas sin cap; AI bundle incluye receipts; panels comparten DTO source.
- **Docs:** `docs/testing.md`, `docs/troubleshooting.md`, `docs/performance-budget.md`, `docs/architecture-status.md`.
- **Tests:** public API, object explorer/current context/diagnostics explainability models, support bundle, docs drift.
- **Validación:** generar workspace check/support bundle con caps y comprobar generatedFromCache/truncation/redaction.

## PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01 — Publicar DataWindowSubmodel advisory y seguro

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 19.
- **Origen:** Plan maestro de diseño semántico.
- **Depends on:** `PB-ARCH-P0-SEMANTIC-SOURCE-OF-TRUTH-01`, `PB-ARCH-P1-CACHE-SEMANTIC-EPOCH-CONTRACT-01`.
- **Problema:** DataWindow support está repartido entre model, binding, fast context, property paths, column access, legacy safe mode y diagnostics.
- **Objetivo:** publicar o referenciar un DataWindowSubmodel por documento/DataObject con confidence/evidence y boundary claro.
- **Fuente de verdad afectada:** DataWindow source, DocumentFacts, SourceOriginModel y KnowledgeBase submodel references.
- **Consumers afectados:** hover, completion, definition, signature help, diagnostics, current object context, AI reports.
- **Caches afectadas:** DocumentCache, ServingCache, HotContextCache, DataWindow fast context/report projections.
- **Riesgo actual:** alto; carriles legacy/moderno pueden divergir y heurística dinámica puede sobreprometer.
- **Diseño objetivo:** slice seguro interactivo; casos dinámicos/advisory con reason; deep lineage report-only.
- **Plan incremental:** definir schema submodel; migrar adapters; cubrir `.srd` symbols sin legacy owner; añadir parity tests; retirar fallback cuando proceda.
- **Notas de performance:** no parsear todas las DataWindows por request; cache/fingerprint por DataObject.
- **Escala 5000+ archivos:** parcial; requiere indexing/background y caps.
- **Acceptance criteria:** DataWindow bindings seguros comparten evidence; dynamic DataObject degrada; legacy fallback tiene retirement plan.
- **Docs:** DataWindow owner docs, `docs/testing.md`, `docs/performance-budget.md`, `docs/architecture-status.md`.
- **Tests:** dataWindowModel, dataWindowFastContext, currentObjectContext, diagnostics, DataWindow smoke, performance gate.
- **Validación:** fixtures `.srd`, binding literal, retrieve args, property paths y dynamic DataObject.

## PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01 — Formalizar SqlAnchorSubmodel y TransactionSubmodel advisory

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 22.
- **Origen:** Plan maestro de diseño semántico.
- **Depends on:** `PB-SEMANTIC-P1-SQL-TRANSACTION-ANCHORS-01`.
- **Problema:** SQL regions, DataWindow SQL lineage, dynamic strings y transaction binding están dispersos y parcialmente heurísticos.
- **Objetivo:** agrupar SQL/transaction evidence en submodelos advisory versionados por document fingerprint/epoch.
- **Fuente de verdad afectada:** DocumentFacts, SqlAnchorSubmodel, TransactionSubmodel, DataWindowSubmodel.
- **Consumers afectados:** diagnostics, current object context, technical debt, safe edit/impact, AI reports.
- **Caches afectadas:** DocumentCache, report projections, diagnostics cache.
- **Riesgo actual:** alto; SQL runtime/dynamic puede parecer validado cuando sólo hay anchors parciales.
- **Diseño objetivo:** anchors ligeros interactivos; dynamic/deep SQL report-only; host vars/transaction confidence explícita.
- **Plan incremental:** harden SQL region boundaries; map transaction target evidence; integrate reports; document unsupported dynamic SQL.
- **Notas de performance:** prohibido parser SQL profundo en request interactiva.
- **Escala 5000+ archivos:** viable sólo por documento/report caps.
- **Acceptance criteria:** SQL anchors declaran confidence/reason; transaction binding acepta sólo evidence defendible; dynamic SQL no bloquea providers.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/testing.md`, `docs/troubleshooting.md`.
- **Tests:** sqlRegions, embeddedSqlAnchors, diagnostics transaction, currentObjectContext, technical debt report.
- **Validación:** corpus con embedded SQL, SetTransObject descendants y dynamic SQL degraded.

## PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01 — Definir ExternalNativeSubmodel sin prometer ABI completo

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 25.
- **Origen:** Plan maestro de diseño semántico.
- **Depends on:** `PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01`.
- **Problema:** el runtime clasifica external/RPCFUNC/dll/pbx, pero PBNI/ABI/bitness/marshaling no están soportados como semántica fuerte.
- **Objetivo:** formalizar metadata nativa mínima con source, risk, confidence y unsupported boundaries.
- **Fuente de verdad afectada:** external function declarations, Entity metadata, ExternalNativeSubmodel.
- **Consumers afectados:** hover, signature help, diagnostics, technical debt, migration assistant, AI/support reports.
- **Caches afectadas:** KnowledgeBase entity indexes, report projections.
- **Riesgo actual:** medio-alto; docs o reports pueden sobreprometer soporte nativo profundo.
- **Diseño objetivo:** external metadata se usa para clasificación/riesgo, no validación ABI; unknown se conserva como unknown.
- **Plan incremental:** mapear campos actuales; añadir confidence/reason; revisar docs; tests para limits.
- **Notas de performance:** no requiere análisis externo en hot path.
- **Escala 5000+ archivos:** sí; metadata por declaración.
- **Acceptance criteria:** reports distinguen dll/pbx/rpcfunc/unknown; PBNI/ABI quedan needs-confirmation/unsupported salvo evidencia.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/architecture-status.md`, `docs/testing.md`.
- **Tests:** externalFunctions, diagnostics, technical debt report, workspace check report.
- **Validación:** fixtures con LIBRARY, ALIAS FOR, RPCFUNC, PBX-like names y unknown libraries.

## PB-ARCH-P2-FEATURE-SIMPLIFICATION-AND-DELETION-01 — Retirar duplicados, legacy runtime y docs redundantes tras parity

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 27.
- **Origen:** Plan maestro de diseño semántico.
- **Depends on:** todos los P0/P1 de query, consumers, caches, read-only y submodelos afectados.
- **Problema:** rutas duplicadas, fallbacks legacy, report builders solapados y docs con owners difusos permanecerán hasta que las etapas previas tengan parity.
- **Objetivo:** eliminar o fusionar código/documentación duplicada sin romper API pública ni compatibilidad útil.
- **Fuente de verdad afectada:** none directly; elimina proyecciones o fallbacks que ya no son owner.
- **Consumers afectados:** all migrated providers, DataWindow adapters, read-only panels/reports, AI/support bundles.
- **Caches afectadas:** caches sólo si se retiran key paths legacy o report cache projections.
- **Riesgo actual:** medio; la duplicidad prolongada confunde mantenimiento y puede reabrir bugs ya resueltos.
- **Diseño objetivo:** cada feature tiene un owner; fallback legacy tiene fecha/criterio de retiro; docs no duplican estado.
- **Plan incremental:** después de parity tests, retirar una ruta por PR/spec; mantener changelog si afecta surface pública.
- **Notas de performance:** cleanup no debe borrar fast paths ni obligar a análisis profundo.
- **Escala 5000+ archivos:** mejora mantenibilidad y reduce riesgo de full scans accidentales.
- **Acceptance criteria:** no quedan `legacy` runtime paths sin owner; report builders comunes están fusionados; docs owner pasan drift checks.
- **Docs:** `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/technical-debt-inventory.md`, `docs/backlog.md`, `docs/current-focus.md`.
- **Tests:** migrated feature suites, architecture import tests, docs drift, smoke views/commands.
- **Validación:** grep de rutas retiradas, tests de parity y revisión manual de comandos/API afectada.

---

## CATALOG-GENERATOR-SCHEMA-DRIFT-01 — Reconciliación de discrepancias entre Catálogo Generado y Documentación Oficial (Web)

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 28.
- **Origen:** Auditoría de Localización (Fase 6G).
- **Evidencia:** Funciones como `GetItemString` muestran 3 sintaxis en la web oficial, pero el catálogo `generated.generated.ts` solo genera 1 firma. Además, múltiples funciones tienen parámetros en la etiqueta (`label`) que no existen en el metadato `parameters` del catálogo.
- **Riesgo:** Alto. Los overlays de localización fallan (`invalid-parameter-target`) al intentar documentar parámetros que el catálogo no contiene en metadato, resultando en documentación incompleta o errónea para el usuario final en el LSP.
- **Funciones Identificadas con Drift:**
  - **Missing Signatures:** `GetItemString`, `GetItemNumber`, `GetItemDecimal`, `GetItemBoolean`, `GetItemDate`, `GetItemDateTime`, `GetItemTime`.
  - **Missing Parameter Metadata:**
    - `Compress`: falta `dest` y `format`.
    - `Submit`: falta `dwObject` en Sig 1 y `format`.
    - `Retrieve`: falta `urlName`, `data` y `tokenrequest`.
    - `SetRequestHeader`: falta `headerValue` y `replace`.
    - `SymmetricEncrypt/Decrypt`: falta `key`, `operationmode`, `iv` y `padding`.
- **Objetivo:** Investigar y corregir el script de generación del catálogo para capturar todas las firmas y parámetros documentados. Mientras tanto, la política de localización debe ser “seguir el metadato del catálogo, no la etiqueta”.
- **Depends on:** Nada, pero debe ejecutarse antes de nuevas ampliaciones de overlays/localización si éstas dependen de parámetros ausentes en `generated.generated.ts`.
- **Acceptance criteria:**
  - Script de generación de catálogo actualizado para extraer parámetros de todas las firmas.
  - Re-generación de `generated.generated.ts` con metadatos completos.
  - Validación de que los overlays de localización ahora pueden incluir todos los parámetros sin errores de integridad.
  - La política de overlay documenta que, hasta corregir el generador, la localización sigue el metadato del catálogo y no la etiqueta textual.
  - El fix no introduce full-catalog scans en hot paths ni cambia IDs públicos salvo decisión explícita.
- **Docs:** `docs/architecture.md`, `docs/localization.md`.
- **Tests:** `npm run report:catalog-localization` debe permitir documentar estos parámetros tras el fix.

---

# 5. Ownership note

Este backlog sólo mantiene trabajo accionable: estado, prioridad, evidencia, dependencias, docs afectadas, tests y validación.

- El foco activo vive en `docs/current-focus.md`.
- Las prioridades macro y el orden por fases viven en `docs/roadmap.md`.
- El histórico de cierres vive en `docs/done-log.md`.
- El diseño objetivo vive en `docs/semantic-design-target.md`.
- El razonamiento/supuestos vive en `docs/semantic-design-assumptions.md`.
- El orden recomendado de ejecución vive en este backlog y puede reflejarse resumido en `docs/roadmap.md`.
- Los criterios operativos de auditoría viven en el prompt/flujo de auditoría y en la validación ejecutable, no en este backlog.

---

# 6. Validación tras aplicar este backlog

Ejecutar:

```bash
npm run test:docs:drift
npm run test:architecture:rapid
```

Si el repo tiene tests específicos de docs/backlog:

```bash
npm run test:architecture:metrics
```

Validar manualmente:

```txt
- No hay IDs duplicados con estados contradictorios.
- No hay PB-SEMANTIC ejecutable antes de su PB-ARCH padre si el padre define contrato abierto.
- PB-ARCH-P0-SEMANTIC-DESIGN-TARGET-01 queda Partial o Done según validación real.
- CATALOG-MANUAL-EN-MIGRATION queda Partial con pendiente de validación o Done con done-log.
- CATALOG-GENERATOR-SCHEMA-DRIFT-01 queda antes de nuevas ampliaciones de overlays si afecta parámetros del catálogo.
```
