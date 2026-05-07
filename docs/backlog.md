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
28. PLUGIN-INFRASTRUCTURE-NLS-01

31. PB-PERF-P1-DATAWINDOW-REGEX-SCAN-01
32. PB-PERF-P2-REGEX-MEMOIZATION-01
33. PB-PERF-P2-LAZY-DIAGNOSTICS-01
34. PB-PERF-P2-CATALOG-DICTIONARIES-01
35. PB-PERF-P2-REACTIVE-EXPLORER-01
36. PB-PERF-P2-OPTIMISTIC-SNAPSHOTS-01
37. PB-PERF-P2-SEMANTIC-TOKENS-DELTA-01
38. PB-PERF-P2-BACKGROUND-INDEXING-01
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


## PB-PERF-P1-DATAWINDOW-REGEX-SCAN-01 — Eliminar escaneo de DataWindows carácter por carácter

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 31.
- **Origen:** Auditoría de Performance de Hot Path.
- **Evidencia:** `inspectFirstDataWindowPropertyOnLine` en `diagnostics.ts` itera sobre `lineText.length` ejecutando lógica densa por cada carácter. Esto degrada brutalmente el performance interactivo (`O(N)` por cada línea parseada en cada tipeo).
- **Objetivo:** Pre-filtrar las líneas usando un regex simple (ej. `/\b(?:Object|GetChild|Describe|Modify)\b/i`) y solo evaluar en los índices donde hay coincidencia real, eliminando el chequeo redundante del 99% de los caracteres.
- **Depends on:** Nada. Es un Quick-Win.
- **Acceptance criteria:**
  - El escaneo de propiedades de DataWindow no ejecuta un bucle per-carácter indiscriminado.
  - El linter baja drásticamente su tiempo de procesamiento en líneas largas.

---

## PB-PERF-P2-REGEX-MEMOIZATION-01 — Cacheo Estructural de Expresiones y Líneas

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 32.
- **Origen:** Auditoría de Performance de Hot Path.
- **Evidencia:** Features como `diagnostics.ts` y `semanticTokens.ts` lanzan decenas de RegExp (`DATAOBJECT_ASSIGN_REGEX`, `TRANSACTION_BIND_CALL_REGEX`, etc.) repetidamente sobre líneas inmutadas durante la escritura.
- **Objetivo:** Enriquecer el `SemanticDocumentSnapshot` o fast-context para memorizar las firmas léxicas (o resultados RegExp) por línea/scope.
- **Depends on:** Nada.
- **Acceptance criteria:**
  - Las líneas no modificadas no re-corren RegExp pesadas en cada iteración del LS.

---

## PB-PERF-P2-LAZY-DIAGNOSTICS-01 — Lazy Evaluation (Linter por Fases)

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 33.
- **Origen:** Auditoría de Performance de Hot Path.
- **Evidencia:** Todos los diagnósticos (sintaxis rápida + comprobación de variables/catálogo) se ejecutan sincrónicamente en un solo pase bloqueante.
- **Objetivo:** Separar reglas en dos tiers. Tier 1 (Syntactic): inmediato. Tier 2 (Semantic): corre asíncrono o con `debounce` de `~300ms`.
- **Depends on:** Nada.
- **Acceptance criteria:**
  - Diagnósticos semánticos profundos no traban el main thread al escribir fluidamente.

---

## PB-PERF-P2-CATALOG-DICTIONARIES-01 — Estructura O(1) en el SystemCatalog

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 34.
- **Origen:** Auditoría de Performance de Hot Path.
- **Evidencia:** Búsquedas calientes como `resolveDataWindowFunctionForOwner` atraviesan Arrays con `.find` en tiempo de validación semántica.
- **Objetivo:** Mapear registros calientes del catálogo (DataWindow functions, Global functions) en Diccionarios (`Map<string, Entry>`) para lograr acceso `O(1)`.
- **Depends on:** Nada.
- **Acceptance criteria:**
  - Búsquedas de resolución semántica clave en `SystemCatalog` ya no iteran sobre arrays largos.

---

## PB-PERF-P2-REACTIVE-EXPLORER-01 — UI Reactiva Guiada por Servidor (Server-Push)

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 35.
- **Origen:** Auditoría de Arquitectura de UI y Velocidad Percibida.
- **Evidencia:** El cliente (VS Code) lanza peticiones de carga pesada guiado por eventos del cliente (`onDidSaveTextDocument`), ignorando si realmente hubo mutación de conocimiento.
- **Objetivo:** Implementar notificaciones `Server->Client` (`powerbuilder/catalogUpdated`) atadas a los `SemanticEpoch`. El servidor emitirá el evento solo cuando la `KnowledgeBase` sufra mutación real de entidades. El cliente eliminará sus listeners heurísticos y se volverá 100% reactivo.
- **Depends on:** `PB-ARCH-P1-CACHE-SEMANTIC-EPOCH-CONTRACT-01` (completado).
- **Acceptance criteria:**
  - El cliente ya no hace *pull* arbitrario en los `onSave`.
  - El *Object Explorer* y el *Current Object Context* se actualizan solo cuando el servidor emite el evento de mutación de epoch.

---

## PB-PERF-P2-OPTIMISTIC-SNAPSHOTS-01 — Generación Asíncrona de Snapshots (Stale-While-Revalidate)

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 36.
- **Origen:** Auditoría de Arquitectura de UI y Velocidad Percibida.
- **Evidencia:** Las llamadas a `Hover` y `Completion` se bloquean forzando una reconstrucción síncrona completa del AST si el documento está modificado (sucio).
- **Objetivo:** El parser construirá los `SemanticDocumentSnapshot` en un worker o *chunking asíncrono*. Las features interactivas utilizarán siempre la última versión estable (stale) + un parche léxico instantáneo de la línea activa, respondiendo siempre en `< 10ms`.
- **Depends on:** Nada.
- **Acceptance criteria:**
  - `Hover` y `Completion` nunca esperan más de 10ms, incluso si el archivo entero no ha terminado de re-indexarse.

---

## PB-PERF-P2-SEMANTIC-TOKENS-DELTA-01 — Tokenización Incremental (Edits)

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 37.
- **Origen:** Auditoría de Arquitectura de UI y Velocidad Percibida.
- **Evidencia:** `semanticTokens.ts` reevalúa y envía el array completo de tokens para todo el documento en cada recálculo, colapsando archivos grandes.
- **Objetivo:** Implementar soporte LSP para `textDocument/semanticTokens/full/delta`. El servidor solo calculará y enviará al cliente las diferencias matemáticas de los tokens que mutaron.
- **Depends on:** Nada.
- **Acceptance criteria:**
  - El cliente de VS Code negocia y consume deltas de tokens en lugar del documento completo.

---

## PB-PERF-P2-BACKGROUND-INDEXING-01 — Indexación de Workspace No Bloqueante (Chunking)

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 38.
- **Origen:** Auditoría de Arquitectura de UI y Velocidad Percibida.
- **Evidencia:** La inicialización de la extensión traba el hilo principal leyendo masivamente el workspace antes de reportar "Ready".
- **Objetivo:** Mover el descubrimiento de archivos (Fixtures, PBLs, SRUs) a colas fraccionadas con `setImmediate`. El LS arranca interactivo al instante con características base, y reporta el progreso incrementalmente.
- **Depends on:** Nada.
- **Acceptance criteria:**
  - El LSP no excede presupuestos de 50ms por *tick* del event loop durante el arranque.

# 4. Backlog derivado — Errores reales capturados en runtime

> Esta sección consolida errores observados en un workspace PowerBuilder 2025/PFC real. Debe tratarse como entrada prioritaria para specs de corrección. Los errores similares están agrupados para que el agente implemente fixes coherentes y no parches aislados.

---


## 4.0. Backlog derivado — Calidad y consistencia del catálogo oficial

> Hallazgos detectados durante la generación del catálogo oficial PB 2025 y auditoría de la web de Appeon.

### CATALOG-OFFICIAL-DOC-INACCURACIES-01 — Corregir ejemplos y metadatos mal formados en la web de Appeon

- **Estado:** Done.
- **Prioridad:** P2.
- **Evidencia:** 
  - Ejemplos de código en la web oficial (ej. `GetItemString`) aparecen sin saltos de línea o mal formateados en el HTML fuente de la página de referencia, lo que ensucia los snippets generados.
  - URL de ejemplo: `https://docs.appeon.com/pb2025/powerscript_reference/getitemstring_func.html`
  - Inconsistencias en "Applies to": Algunas funciones (ej. `GetItemString`) aparecen en la referencia de PowerScript aplicando solo a `JSONParser`, omitiendo su uso clásico en `DataWindow` que reside en otra referencia.
- **Objetivo:** Implementar heurísticas en los parsers para restaurar el formato de los ejemplos (ej. inyectar saltos de línea tras declaraciones o puntos y coma) y asegurar que el catálogo final combina correctamente las definiciones de múltiples fuentes.
- **Implementación:** 
  - Se ha añadido `extractSectionCodeBlocks` y `fixBrokenExample` en `utils.cjs` para preservar y reconstruir el formato de los ejemplos.
  - Se ha modificado `processor.cjs` para consolidar entradas por nombre (eliminando `ownerTypes` de la clave de mezcla), permitiendo que `GetItemString` combine `JSONParser` y `DataWindow` en una sola entrada con múltiples owners.
- **Acceptance criteria:**
  - Los snippets de `GetItemString` en el catálogo generado son legibles y tienen saltos de línea. (Done)
  - El catálogo consolidado muestra todos los owners válidos para funciones sobrecargadas cross-reference. (Done)
- **Validación:** Dry run completado con éxito procesando >2000 páginas y consolidando símbolos.

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
  - `docs/done-log.md` conserva una sola entrada cerrada para el ID y devuelve claims no soportados.
  - `docs/backlog.md`, `docs/current-focus.md`, `docs/done-log.md` y `docs/roadmap.md` quedan consistentes en estados y foco.
  - Los gates documentales de conditional compilation quedan o bien explicitados en el owner correcto o bien retirados de los claims que los invocan.
- **Docs:** `docs/backlog.md`, `docs/current-focus.md`, `docs/done-log.md`, `docs/roadmap.md`.
- **Tests:** `npm run test:docs:drift`, `test/server/unit/docsDriftAudit.test.ts`, `test/server/unit/testingMatrixDocs.test.ts`, diagnostics severity unit tests ya existentes.
- **Validación:** revisar estados por ID en los tres docs owner y revalidar que los tests de severidad siguen verdes.

---


## 4.2. Backlog arquitectónico final — Diseño semántico objetivo

> Esta sección deriva de `docs/semantic-design-target.md` y `docs/semantic-design-assumptions.md`.
> Si un ítem queda cubierto por una entrada previa de este backlog, se mantiene la trazabilidad aquí y se ejecuta en el ítem absorbente.
> `PB-ARCH-*` define contrato/arquitectura/conformance; `PB-SEMANTIC-*` implementa funcionalidad concreta/hardening.
