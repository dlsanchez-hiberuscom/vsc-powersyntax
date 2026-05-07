# Backlog — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/architecture-implementation-map.md`

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
- Los ítems marcados previamente como `Done` por una auditoría pasan a `Open` si una revisión posterior detecta que necesitan verificación, hardening, corrección de criterio o validación real en runtime.
- Los errores reales capturados en runtime sobre corpus PowerBuilder/PFC tienen prioridad sobre mejoras cosméticas o nuevas features.
- Ningún diagnóstico informativo debe ensuciar el editor por defecto si describe un patrón normal de PowerBuilder y no un problema accionable.
- El lexer/parser debe tokenizar correctamente strings, comentarios y continuaciones antes de ejecutar reglas semánticas, balanceo de paréntesis o resolución de símbolos.

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
13. Validate fixes against the captured PowerBuilder/PFC cases in section 4 before closing parser, diagnostics, hover, discovery or view-provider work.
14. Verify diagnostics severity: real correctness issues may be diagnostics; confidence/context warnings should prefer hover/context panels unless explicitly configured.
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
- **Origen:** CATALOG-MANUAL-LOCALIZATION-AUDIT.
- **Evidencia:** Todo `manual/**` tiene `summary`, `documentation`, `category` en español. Cuando `locale = en`, los consumers (hover, completion, signatureHelp) muestran texto español al usuario.
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
- **Origen:** CATALOG-MANUAL-LOCALIZATION-AUDIT.
- **Evidencia:** Auditoría completa en `specs/CATALOG-MANUAL-LOCALIZATION-AUDIT/`.
- **Riesgo:** ~1200+ entries con texto visible español en locale=en.
- **Objetivo:** Paraguas para la migración EN por dominio y creación de overlays ES. Specs individuales: `CATALOG-MANUAL-CORE-TO-EN-01`, `CATALOG-MANUAL-DW-TO-EN-01`, `CATALOG-MANUAL-VISUAL-TO-EN-01`, `CATALOG-MANUAL-RUNTIME-TO-EN-01`, `CATALOG-MANUAL-LANGUAGE-TO-EN-01`, `CATALOG-MANUAL-INTEGRATION-TO-EN-01`, `CATALOG-MANUAL-TOOLING-TO-EN-01` con sus mirrors `CATALOG-LOCALIZATION-ES-MIRROR-*-01`.
- **Depends on:** `CATALOG-MANUAL-CATEGORIES-KEYS-01`, `CATALOG-LOCALIZATION-MIRROR-STRUCTURE-01`.
- **Acceptance criteria:**
  - Todo `manual/**` en inglés canónico.
  - Overlays ES completos para dominios con documentación visible.
  - 0 issues en reporte de localización.
  - locale=en no muestra texto español.
- **Docs:** `docs/localization.md`, spec individual por dominio.
- **Tests:** `npm run test:unit -- --grep "catalogLocalization|catalogConsistency"`, `npm run report:catalog-localization`.

**Status por dominio:**
- [x] runtime (Done: systemGlobals, reflection, profiling, errors, ole, mail)
- [ ] core (English manual base: ok. ES overlays: partial 10% - Audit clean)
- [ ] datawindow (English manual base: ok. ES overlays: partial 70% - Audit clean)
- [ ] visual (English manual base: ok. ES overlays: partial 61% - Audit clean)
- [ ] language (English manual base: ok. ES overlays: partial 71% - Audit clean)
- [ ] integration (English manual base: ok. ES overlays: partial)
- [ ] tooling (English manual base: ok. ES overlays: 100%)


---

## PLUGIN-INFRASTRUCTURE-NLS-01 — Plugin UI and Logic Internationalization (NLS)

- **Estado:** Open.
- **Prioridad:** P1.
- **Origen:** Auditoría de Internacionalización (Conversación c736c88a).
- **Evidencia:** Mezcla de idiomas en `package.json`, notificaciones hardcoded en español en `extension.ts` y mensajes de diagnóstico (linter) no localizables.
- **Objetivo:** Implementar `vscode-nls` para separar los literales de la lógica.
- **Pendiente exacto:**
  - **package.json**: Mover comandos, settings y descripciones a `package.nls.json`.
  - **Client/Server Strings**: Externalizar logs, notificaciones y nombres de canales de salida.
  - **Linter Messages**: Mover los mensajes de error de `diagnostics.ts` y `documentAnalysis.ts` a un catálogo de mensajes localizable.
  - **Metadata Labels**: Traducir etiquetas de análisis como "Argumento", "Instancia", "Resumen", etc.

---

# 4. Backlog derivado — Errores reales capturados en runtime

> Esta sección consolida errores observados en un workspace PowerBuilder 2025/PFC real. Debe tratarse como entrada prioritaria para specs de corrección. Los errores similares están agrupados para que el agente implemente fixes coherentes y no parches aislados.

## PB-RUNTIME-P0-LEXER-STRINGS-01 — Lexer PowerScript correcto para strings, comillas mixtas y paréntesis literales

- **Estado:** Open.
- **Prioridad:** P0.
- **Origen:** errores runtime capturados en corpus PFC/PowerBuilder.
- **Evidencia:** El plugin analiza contenido de strings como si fuera PowerScript real y genera falsos positivos de funciones inexistentes, paréntesis desbalanceados y símbolos no resueltos.
- **Riesgo:** Muy alto. Rompe la confianza en diagnostics y contamina hover/problems con errores falsos masivos.
- **Objetivo:** Corregir el lexer/tokenizer para que strings PowerBuilder se reconozcan antes de balancear paréntesis, resolver símbolos o ejecutar diagnósticos semánticos.
- **Reglas PowerBuilder obligatorias:**
  - Son strings válidos: `"texto"` y `'texto'`.
  - Una comilla simple dentro de `"..."` no cierra el string.
  - Una comilla doble dentro de `'...'` no cierra el string.
  - Paréntesis, puntos, palabras y pseudo-funciones dentro de strings no son sintaxis PowerScript.
- **Casos reales:**

```powerscript
ls_a = "hola ' que tal"
ls_b = 'hola " que tal'
ls_c = "char("
ls_d = "("
ls_e = ")"
```

```powerscript
ls_presentation = "DataWindow (color=" + WHITE + ") " + &
    "Column (background.mode=1 border=0 color=0 edit.displayonly='yes' edit.focusrectangle='no' " + &
    "font.face='MS Sans Serif' font.height='-8' font.weight=400 font.family=2 font.pitch=2 font.charset=0) " + &
    "Text (alignment=0 border=0 color=0 background.mode=1 " + &
    "font.face='MS Sans Serif' font.height='-8' font.weight=400 font.family=2 font.pitch=2 font.charset=0) " + &
    "Style (Header_Bottom_Margin=0 Header_Top_Margin=0 Report='yes')"
```

- **Diagnósticos incorrectos actuales:**
  - `La función 'Column' no se encuentra...`
  - `La función 'Style' no se encuentra...`
  - `Paréntesis desbalanceados en la sentencia.`
  - `La función 'Query' no se encuentra...` cuando `Query` está dentro de un literal de filtro como `"Query (*.txt),*.txt"`.
- **Acceptance criteria:**
  - El lexer devuelve tokens string completos para `"..."` y `'...'`.
  - El balanceo de paréntesis ignora contenido de strings.
  - La resolución semántica ignora tokens internos de strings.
  - No aparecen diagnostics por `Column`, `Style`, `Query`, `char(`, `(` o `)` cuando están dentro de strings.
  - Se añaden fixtures unitarios y smoke tests con los ejemplos anteriores.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/architecture-implementation-map.md`, `docs/testing.md`.
- **Tests:** lexer/parser unit tests, diagnostics fixtures, smoke sobre corpus PFC.

---

## PB-RUNTIME-P0-DW-STRING-SUBLANGUAGES-01 — Frontera segura para Describe/Modify/Evaluate/SyntaxFromSQL

- **Estado:** Open.
- **Prioridad:** P0.
- **Origen:** errores runtime sobre strings DataWindow.
- **Evidencia:** El plugin trata strings de `Describe`, `Modify` y `SyntaxFromSQL` como PowerScript normal.
- **Riesgo:** Alto. DataWindow usa sublenguajes propios y strings con propiedades, puntos, paréntesis, SQL y comillas mixtas.
- **Objetivo:** Establecer frontera semántica segura: no analizar strings DataWindow como PowerScript normal. `Evaluate(...)` puede tener tratamiento específico futuro, pero no debe producir falsos positivos por defecto.
- **Casos reales:**

```powerscript
ll_Height += Integer(idw_Requestor.Describe("Datawindow." + &
            ls_Band[li_Cnt] + ".Height"))
```

```powerscript
CHOOSE CASE Lower ( Left ( idw_Requestor.Describe ( as_column + ".ColType" ) , 5 ) )
CASE "char(" , "char"
```

```powerscript
ls_string_value = lnv_string.of_GlobalReplace(ls_string_value, "(", "", FALSE)
ls_string_value = lnv_string.of_GlobalReplace(ls_string_value, ")", "", FALSE)
```

```powerscript
ls_syntax = inv_filterattrib.idw_dw.itr_object.SyntaxFromSQL(ls_sql, ls_presentation, ls_errbuffer)
```

- **Acceptance criteria:**
  - `Describe(...)`, `Modify(...)` y `SyntaxFromSQL(...)` no disparan resolución PowerScript sobre literales internos.
  - `Evaluate(...)` queda documentado como caso especial: si se analiza, debe ser un modo seguro y explícito, no PowerScript normal.
  - No se reportan paréntesis desbalanceados por `"char("`, `"("`, `")"` ni por propiedades DataWindow.
  - `.srd` y strings DataWindow mantienen frontera clara y no se parsean como PowerScript general.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/architecture-implementation-map.md`.
- **Tests:** fixtures para `Describe`, `Modify`, `SyntaxFromSQL`, `Evaluate` safe-path.

---

## PB-RUNTIME-P0-PARSER-INLINE-AFTER-SEMICOLON-01 — Soporte de código inline después del `;` de función/subrutina

- **Estado:** Open.
- **Prioridad:** P0.
- **Origen:** errores runtime en PFC.
- **Evidencia:** El parser ignora la primera sentencia real cuando aparece detrás del `;` de la firma, provocando falsos `END IF` huérfanos y falsos `missing return`.
- **Riesgo:** Alto. Patrón válido en PowerBuilder; rompe bloques, returns y diagnostics de funciones.
- **Objetivo:** El parser debe partir correctamente la línea de declaración y tratar lo posterior al `;` como primera sentencia del cuerpo si existe.
- **Casos reales:**

```powerscript
public subroutine of_drawnone (datawindow vdw_sort);IF vdw_Sort.Describe('sort_ln1_xyzzy.type') = 'line' THEN
    of_SetSortDWObject("")
    String ls_Modify
    ls_Modify = ' DESTROY sort_ln1_xyzzy DESTROY sort_ln2_xyzzy DESTROY sort_ln3_xyzzy '
    vdw_Sort.Modify(ls_Modify)
END IF
RETURN
end subroutine
```

```powerscript
private function string of_getsortdwobject ();Return(is_sortDWObject)
end function
```

- **Diagnósticos incorrectos actuales:**
  - `Se ha detectado un cierre de bloque 'if' sin una apertura previa compatible.`
  - `La función 'of_getsortdwobject' declara retorno 'string' pero no contiene 'return'.`
- **Variantes mínimas a cubrir:**

```powerscript
public function string of_x();return "x"
end function
```

```powerscript
public subroutine of_x();IF lb_ok THEN
END IF
end subroutine
```

```powerscript
protected function long of_x ();Return(il_value)
end function
```

```powerscript
public subroutine of_x();CHOOSE CASE li_value
CASE 1
END CHOOSE
end subroutine
```

- **Acceptance criteria:**
  - El parser reconoce `IF`, `RETURN`, `CHOOSE CASE` y llamadas cuando aparecen después del `;` de firma.
  - No hay falsos `END IF` huérfanos en los casos anteriores.
  - `Return(...)` inline cuenta para la regla de funciones con retorno.
  - La extracción de firma para hover no se rompe por la sentencia posterior.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/testing.md`.
- **Tests:** parser unit tests, block-balance fixtures, missing-return fixtures.

---

## PB-RUNTIME-P1-DISCOVERY-INDEXING-REAL-WORKSPACE-01 — Discovery/indexación estable en Solution/PBL folders con rutas con espacios

- **Estado:** Open.
- **Prioridad:** P1.
- **Origen:** métricas runtime y falsos símbolos no resueltos.
- **Evidencia:** Workspace real queda en `discovering`, con indexer idle y topología semántica incompleta.
- **Riesgo:** Alto. Afecta resolución de ancestors, Object Explorer, hover, diagnostics y navegación.
- **Objetivo:** Corregir discovery/routing de workspace PowerBuilder 2025 Solution, `.pbproj`, PBL folders y rutas con espacios.
- **Métricas observadas:**

```text
Readiness: discovering · discovery
Resumen proyecto: workspace — descubriendo
Workspace: solution · 826 archivos
Scheduler: near 0 · background 0 · interactiveBusy false
Indexer: idle · 0/0
Workspace semántico: 0 proyectos · 0 librerías · 40 objetos exportados · 3499 tipos
Inheritance: 3499 tipos · 0 raíces
Source origins: pbl-folder-source 826
```

- **Caso real de rutas con espacios:**

```xml
<Library Path="pfc libs/pfcapp.pbl"/>
<Library Path="pfc libs/pfcapsrv.pbl"/>
<Library Path="pfc libs/pfcdwsrv.pbl"/>
```

- **Errores relacionados:**

```powerscript
global type pfc_n_cst_dwsrv_querymode from n_cst_dwsrv
```

```text
El tipo base 'n_cst_dwsrv' no se encuentra en el workspace ni en el catálogo del lenguaje
```

- **Acceptance criteria:**
  - El workspace no queda indefinidamente en `discovering` si no hay trabajo pendiente.
  - Hay transición clara a `ready` o `degraded-ready` con reason codes.
  - `.pbproj` y librerías con espacios se parsean y normalizan correctamente.
  - Se detectan proyectos/librerías cuando existen, o se explica honestamente por qué no.
  - Ancestor resolution usa library search path real y no falla con `n_cst_dwsrv` existente.
  - No se bloquea discovery por ORCA ni PBAutoBuild ausentes.
- **Docs:** `docs/architecture-implementation-map.md`, `docs/troubleshooting.md`, `docs/performance-budget.md`.
- **Tests:** integration fixture con solution/pbproj y `pfc libs/...`; regression test de ancestor resolution.

---

## PB-RUNTIME-P1-HOVER-SYSTEM-FASTPATH-01 — Hover instantáneo para built-ins/system functions y firma limpia

- **Estado:** Open.
- **Prioridad:** P1.
- **Origen:** experiencia runtime y métricas de cache.
- **Evidencia:** Hover se siente muy lento incluso en funciones del sistema como `UpperBound`. Health muestra último query `hover`, serving cache con hit ratio 0%.
- **Riesgo:** Alto. Hover lento destruye la percepción de velocidad del plugin.
- **Objetivo:** Implementar fast path de hover para catálogo system/built-in, sin depender de indexación completa del workspace.
- **Caso real:**

```powerscript
li_maxcols = UpperBound(inv_querymodeinfo)
```

- **Métricas observadas:**

```text
Último query: hover
serving 0/256 · hit 0% (0/155)
analysis 4/256
hot 1/128
```

- **Firma sucia actual:**

```powerscript
public function string of_globalreplace (string as_source, string as_old, string as_new, boolean ab_ignorecase);////////////////////////////////////////////////////
```

- **Firma esperada:**

```powerscript
public function string of_globalreplace (string as_source, string as_old, string as_new, boolean ab_ignorecase);
```

- **Acceptance criteria:**
  - Built-ins/system functions se resuelven desde catálogo precargado/hot cache.
  - Hover de built-ins no espera a discovery completo.
  - Serving cache se usa realmente para hover interactivo y deja de permanecer en `0/256` durante navegación normal.
  - La firma de funciones se corta en el primer `;` y no arrastra separadores/comentarios.
- **Docs:** `docs/performance-budget.md`, `docs/architecture-implementation-map.md`.
- **Tests:** hover unit/integration tests, cache key stability tests, built-in hover fixtures.

---

## PB-RUNTIME-P1-VIEW-PROVIDERS-REGISTRATION-01 — Registrar correctamente Object Explorer, Current Context y Diagnostics Explainability

- **Estado:** Open.
- **Prioridad:** P1.
- **Origen:** runtime UI.
- **Evidencia:** Los paneles laterales muestran que no hay provider registrado incluso después de navegar y generar diagnostics.
- **Riesgo:** Alto. Superficies clave del plugin quedan inutilizadas.
- **Objetivo:** Registrar siempre los TreeDataProviders durante activación de extensión, independientemente de que discovery esté completo.
- **Paneles afectados:**

```text
POWERBUILDER OBJECT EXPLORER
CURRENT OBJECT CONTEXT
DIAGNOSTICS EXPLAINABILITY
```

- **Mensaje actual:**

```text
No hay ningún proveedor de datos registrado que pueda proporcionar datos de la vista.
```

- **Acceptance criteria:**
  - `registerTreeDataProvider` se ejecuta siempre para las vistas contribuidas.
  - Las vistas muestran `loading`, `empty`, `degraded` o `no workspace` propios, nunca el error de VS Code de provider no registrado.
  - `package.json` y activation events están alineados con las vistas.
  - Los providers no dependen de readiness para registrarse; solo los datos dependen de readiness.
- **Docs:** `docs/architecture-implementation-map.md`, `docs/troubleshooting.md`.
- **Tests:** extension activation tests, view registration tests, smoke VS Code test CLI si aplica.

---

## PB-RUNTIME-P1-CACHE-MEMORY-JOURNAL-BUDGET-01 — Corregir budgets de cache/document cache/journal y serving cache

- **Estado:** Superseded.
- **Prioridad:** P1.
- **Origen:** health dashboard runtime.
- **Nota:** Este ítem monolítico ha sido reemplazado por 7 specs granulares derivadas de la auditoría de arquitectura de cache (`CACHE-P0-DOCUMENT-CACHE-LRU-EVICTION-01`, `CACHE-P0-SERVING-KEY-DOCUMENT-EPOCH-01`, `CACHE-P0-MEMORY-PRESSURE-GRADUATED-POLICY-01`, `CACHE-P1-FROZEN-REFS-HOT-PATH-01`, `CACHE-P1-READINESS-DISCOVERY-DEADLOCK-01`, `CACHE-P1-JOURNAL-AUTOCOMPACTION-01`, `CACHE-P1-KB-DEPENDENCY-INVALIDATION-01`). No debe ejecutarse de forma independiente.

---

## CACHE-P0-DOCUMENT-CACHE-LRU-EVICTION-01 — Document cache con LRU, pin semántico y eviction por presión

- **Estado:** Done.
- **Prioridad:** P0.
- **Origen:** Cache architecture audit (H2 — Document Cache Unbounded Retention).
- **Implementado:**
  - `DocumentCache` reescrito con LRU, `maxEntries`, `pin()/unpin()`, `evictUnpinned()`.
  - `documentHandlers.ts` llama `pin()` en `onDidOpen` y `unpin()` en `onDidClose`.
  - `server.ts` inicializa con `new DocumentCache(256)`.
  - 10 tests nuevos (LRU, pin, unpin, eviction, stats) + 8 tests existentes validados.
  - Validado empíricamente (benchmark manual en entorno local) mostrando memory pressure estabilizada en workspaces grandes.
- **Evidencia:** `DocumentCache` es un `Map<string, DocumentCacheEntry>` sin límite de capacidad, sin LRU, sin eviction. A 826 archivos supera el budget de 48 MiB (114%). A 5,000 archivos consumiría ~312 MiB. Esto dispara `memoryPressurePolicy` en modo `error`, que bloquea serving cache writes y crea un doom loop.
- **Riesgo:** Crítico. Es la raíz de la cascada que mata al serving cache y bloquea features interactivas.
- **Patrón moderno:** Tiered LRU con pin semántico (inspirado en TSServer `DocumentRegistry` y pools de base de datos):
  - **Pinned tier:** documentos abiertos en el editor → nunca evictar.
  - **Warm tier:** documentos cerrados usados recientemente → LRU, evictar bajo presión.
  - **Cold tier:** documentos cerrados no usados → candidatos inmediatos a eviction.
- **Archivos afectados:**
  - `src/server/knowledge/DocumentCache.ts` — añadir `maxEntries`, LRU con `Map` insertion order, pin/unpin API.
  - `src/server/handlers/documentHandlers.ts` — llamar `pin(uri)` al abrir, `unpin(uri)` al cerrar.
  - `src/server/server.ts` — configurar capacidad (recomendado: 256 documentos ≈ 16 MiB).
- **Diseño técnico:**
  ```typescript
  // Nuevo constructor
  constructor(maxEntries = 256)
  
  // Pin: documento abierto, no se evicta
  pin(uri: string): void
  unpin(uri: string): void
  
  // Set con eviction automática de unpinned LRU
  set(uri: string, entry: DocumentCacheEntry): void {
    // Si cache llena, evictar el unpinned más antiguo
  }
  ```
- **Acceptance criteria:**
  - `DocumentCache` tiene `maxEntries` configurable.
  - Documentos abiertos se pinean y nunca se evictan.
  - Documentos cerrados siguen política LRU.
  - A 826 archivos el cache no supera 256 entries (≈16 MiB).
  - `getStats()` reporta: `size`, `capacity`, `pinnedCount`, `evictions`.
  - Eviction no rompe `KnowledgeBase` (el KB mantiene su propio índice independiente).
- **Docs:** `docs/performance-budget.md` §5, `docs/architecture.md` cache contract.
- **Tests:** Unit tests de capacidad, pin/unpin, eviction LRU, stats coherentes.

---

## CACHE-P0-SERVING-KEY-DOCUMENT-EPOCH-01 — Cache key con document epoch en lugar de global epoch

- **Estado:** Done.
- **Prioridad:** P0.
- **Origen:** Cache architecture audit (H1 — Serving Cache Key Mismatch).
- **Evidencia:** La clave de ServingCache incluye `kbVersion` y `semanticEpoch` globales. Cada `upsertDocument` durante indexación incrementa el epoch, invalidando 100% de las entradas cached. Hit ratio observado: 0% (0/155 hits).
- **Riesgo:** Crítico. Sin hits de cache, cada hover/completion recalcula desde cero (~50-120ms en lugar de ≤20ms).
- **Patrón moderno:** Per-document epoch versioning (inspirado en Salsa/rust-analyzer y TypeScript `DocumentRegistry`):
  - Cada documento tiene su propio `documentSemanticVersion` (hash o contador).
  - La clave de cache usa el `documentSemanticVersion` del documento activo, no el epoch global.
  - Invalidación ocurre solo cuando el documento específico o sus dependencias cambian.
  - Early cutoff: si un documento cambia pero su snapshot semántico es idéntico, no invalida dependientes.
- **Archivos afectados:**
  - `src/server/serving/cacheKeyContract.ts` — reemplazar `kbVersion` + `semanticEpoch` por `documentSemanticVersion`.
  - `src/server/serving/activeDocumentServingSnapshot.ts` — calcular `documentSemanticVersion` desde el snapshot del documento.
  - `src/server/knowledge/KnowledgeBase.ts` — exponer `getDocumentSemanticVersion(uri): number`.
  - `src/server/handlers/featureHandlers.ts` — pasar `documentSemanticVersion` en lugar de `kbVersion`/`semanticEpoch`.
  - `src/server/knowledge/ServingCache.ts` — actualizar `kbVersionFromKey()` para nueva estructura.
- **Diseño técnico:**
  ```typescript
  // KnowledgeBase: versión por documento
  getDocumentSemanticVersion(uri: string): number {
    const snapshot = this.publishedState.documentSnapshots.get(normalizeUri(uri));
    return snapshot?.semanticVersion ?? 0;
  }
  
  // Cache key: reemplazar epoch global por doc version
  // Antes: kb:42|epoch:500
  // Después: docver:7 (solo la versión del documento activo)
  ```
- **Acceptance criteria:**
  - Hover sobre posición fija en archivo A devuelve cache hit aunque archivo B se indexe.
  - La clave de cache no contiene `semanticEpoch` global.
  - Invalidación solo se dispara por cambios en el documento activo o sus dependencias semánticas.
  - Hit ratio del serving cache ≥80% durante navegación normal con indexación paralela.
  - No hay regresión en stale guard: resultados obsoletos no se sirven.
- **Docs:** `docs/performance-budget.md` §6, `docs/architecture.md` cache contract.
- **Tests:** Unit test: hover misma posición antes/después de indexar archivo no relacionado → cache hit. Test: editar archivo activo → cache miss correcto.

---

## CACHE-P0-MEMORY-PRESSURE-GRADUATED-POLICY-01 — Política de presión graduada que no mate serving cache

- **Estado:** Done.
- **Prioridad:** P0.
- **Origen:** Cache architecture audit (doom loop H2+H1).
- **Implementado:**
  - `memoryPressurePolicy.ts`: warning level ya NO purga serving cache ni bloquea writes. Solicita document cache eviction en su lugar.
  - `DEFERRED_WORKLOADS_ON_WARNING` separado: no difiere `background-indexing` (previene discovery deadlock).
  - `server.ts` `ensureRuntimeMemoryPressureRelief()`: coopera con `requestDocumentCacheEviction`, llama `documentCache.evictUnpinned()`.
  - Test actualizado: `warning solicita eviction de document cache sin matar serving cache`.
- **Pendiente exacto:**
  - Completado. Se validó la integración de \`evictUnpinned\` en \`server.ts\` durante la carga.
- **Evidencia:** `memoryPressurePolicy` establece `allowServingCacheWrites: false` y `purgeServingCache: true` en nivel `warning`. Como el document cache no tiene eviction, una vez que se supera 85% la presión nunca baja y el serving cache queda permanentemente deshabilitado.
- **Riesgo:** Crítico. La combinación document cache sin eviction + pressure policy agresiva crea un doom loop permanente.
- **Patrón moderno:** Política de presión graduada:
  - **Healthy:** todo normal.
  - **Warning:** reducir capacidad de serving cache al 50%, permitir writes pero con backpressure. Solicitar eviction al document cache.
  - **Critical:** purgar serving cache, bloquear writes de serving cache, solicitar eviction agresiva al document cache.
  - **Recovery:** cuando la presión baja, restaurar capacidades progresivamente.
- **Archivos afectados:**
  - `src/server/runtime/memoryPressurePolicy.ts` — añadir nivel `warning` que permite writes reducidos.
  - `src/server/runtime/memoryBudgets.ts` — ajustar umbrales con el nuevo document cache LRU.
  - `src/server/server.ts` — coordinar eviction del document cache cuando se detecte presión.
- **Diseño técnico:**
  ```typescript
  // Warning: reducir pero no matar
  if (report.status === 'warning') {
    return {
      level: 'warning',
      purgeServingCache: false,        // ← NO purgar
      allowServingCacheWrites: true,   // ← SÍ permitir writes
      reducedServingCapacity: 0.5,     // ← Nueva: capacidad al 50%
      requestDocumentCacheEviction: true, // ← Nueva: pedir eviction
      deferredWorkloads: ['ai-tooling'],  // ← Solo diferir lo heavy
    };
  }
  ```
- **Depends on:** `CACHE-P0-DOCUMENT-CACHE-LRU-EVICTION-01`.
- **Acceptance criteria:**
  - En nivel `warning`, serving cache permite writes con capacidad reducida.
  - En nivel `error`, serving cache se purga y bloquea (comportamiento actual preservado).
  - Document cache responde a solicitudes de eviction reduciendo su tamaño.
  - La presión puede recuperarse a `healthy` sin reiniciar el servidor.
  - No hay doom loop: presión → eviction document cache → presión baja → serving cache funcional.
- **Docs:** `docs/performance-budget.md` §5.2, `docs/architecture.md` memory model.
- **Tests:** Integration test: simular presión warning → verificar serving cache funcional. Test: simular presión error → verificar purge.

---

## CACHE-P1-FROZEN-REFS-HOT-PATH-01 — Referencias congeladas para consumers de solo lectura en hot path

- **Estado:** Done.
- **Prioridad:** P1.
- **Origen:** Cache architecture audit (H5 — structuredClone overhead).
- **Evidencia:** `KnowledgeBase` y `DocumentCache` usan `structuredClone` en cada lectura. Un hover típico acumula 2-8ms de clonado puro (5-8 clones por request). Presupuesto hover cache hit: ≤20ms; el clonado consume 10-40% del budget.
- **Riesgo:** Alto. Latencia innecesaria en el hot path más frecuente del plugin.
- **Patrón moderno:** Immutable/Frozen references (inspirado en Immer.js produce/freeze y React frozen state):
  - Los datos publicados en `KnowledgeBase.publishedState` son inmutables una vez publicados.
  - Consumers de solo lectura (hover, completion, definition) reciben referencia frozen.
  - Consumers que necesitan mutar (upsert, batch update) trabajan sobre draft/clone.
  - `Object.freeze()` en modo desarrollo para detectar mutaciones accidentales.
- **Archivos afectados:**
  - `src/server/knowledge/KnowledgeBase.ts` — añadir `findDefinitionReadonly()`, `getEntitiesByUriReadonly()`, `getScopeAtReadonly()` que devuelven referencia directa sin clone.
  - `src/server/knowledge/DocumentCache.ts` — añadir `getReadonly(uri)` y `getSnapshotReadonly(uri)`.
  - `src/server/features/hover.ts` — usar APIs readonly.
  - `src/server/features/definition.ts` — usar APIs readonly.
  - `src/server/features/completion.ts` — usar APIs readonly.
  - `src/server/knowledge/resolution/semanticQueryService.ts` — usar APIs readonly donde no mute.
- **Diseño técnico:**
  ```typescript
  // KnowledgeBase: referencia directa para lectura
  findDefinitionReadonly(symbolName: string): Readonly<Entity> | null {
    const entities = this.publishedState.globalSymbols.get(symbolName.toLowerCase());
    return entities?.[0] ?? null; // Sin clone
  }
  
  // En desarrollo: freeze para detectar mutaciones
  if (process.env.NODE_ENV === 'development') {
    Object.freeze(result);
  }
  ```
- **Acceptance criteria:**
  - Hot paths de hover/completion/definition usan APIs `*Readonly()`.
  - Latencia de hover con cache miss se reduce en ≥2ms medido.
  - No hay mutaciones accidentales de estado compartido (tests de freeze en dev).
  - APIs `get()` con clone se mantienen para consumers que mutan (batch update, export).
  - Benchmark antes/después documentado.
- **Docs:** `docs/performance-budget.md` §7.1, `docs/architecture.md` knowledge layer contract.
- **Tests:** Unit test: llamar `findDefinitionReadonly()` y verificar que es la misma referencia que el estado interno. Test: intentar mutar resultado frozen → error en dev mode.

---

## CACHE-P1-READINESS-DISCOVERY-DEADLOCK-01 — Evitar deadlock de readiness cuando memory pressure difiere discovery

- **Estado:** Done.
- **Prioridad:** P1.
- **Origen:** Cache architecture audit (H3 — Readiness State Machine Hang).
- **Evidencia:** Discovery corre como tarea `background-indexing` que es diferida bajo presión de memoria. Pero discovery debe completar para que `discoveryProgress.current` alcance `discoveryProgress.total`. Si la presión nunca baja (document cache sin eviction), readiness queda en `discovering` permanentemente y los features interactivos se bloquean o degradan.
- **Riesgo:** Alto. Deadlock silencioso que deja el plugin inutilizable.
- **Patrón moderno:** Priority lanes + exemptions (inspirado en schedulers de sistema operativo):
  - Discovery es una tarea one-shot irrecuperable: si no completa, el pipeline no puede avanzar.
  - Clasificar discovery como `critical-initialization`, no como `background-indexing`.
  - Las tareas `critical-initialization` no se difieren por presión de memoria.
  - Añadir timeout de seguridad: si `discovering` durante >30s con scheduler idle, forzar transición.
- **Archivos afectados:**
  - `src/server/handlers/lifecycleHandlers.ts` — cambiar `workload: 'background-indexing'` a `workload: 'critical-initialization'` en la tarea de discovery.
  - `src/server/runtime/backpressurePolicy.ts` — registrar `critical-initialization` como workload no diferible.
  - `src/server/runtime/memoryPressurePolicy.ts` — excluir `critical-initialization` de `DEFERRED_WORKLOADS_ON_PRESSURE`.
  - `src/server/features/progressReadiness.ts` — añadir timeout de seguridad en `deriveReadinessState`.
- **Depends on:** `CACHE-P0-DOCUMENT-CACHE-LRU-EVICTION-01` (resuelve la raíz del problema de presión, pero el deadlock protection es necesario como safety net).
- **Acceptance criteria:**
  - Discovery nunca se difiere por presión de memoria.
  - Si discovery se completa, readiness transiciona a `indexing` o `idle`.
  - Si discovery se atasca >30s con scheduler idle, readiness transiciona a `degraded` con reason code `discovery-timeout`.
  - No hay regresión: discovery sigue siendo cancelable por el usuario.
- **Docs:** `docs/architecture.md` readiness FSM, `docs/performance-budget.md` §4.2.
- **Tests:** Integration test: simular presión alta → verificar que discovery no se difiere. Test: simular discovery atascado → verificar timeout.

---

## CACHE-P1-JOURNAL-AUTOCOMPACTION-01 — Auto-compactación del journal de cache semántica

- **Estado:** Done.
- **Prioridad:** P1.
- **Origen:** Cache architecture audit (H4 — Journal Budget Overrun).
- **Evidencia:** `SemanticCacheStore.appendJournalMutation()` no tiene trigger de compactación. Entre checkpoints (que solo ocurren al final de discovery y al final de indexación), el journal puede acumular miles de mutaciones. En workspace de 826 archivos: journal observado en 4,755 y 10,537 eventos.
- **Riesgo:** Medio. Crecimiento de memoria no acotado en el journal entre checkpoints.
- **Patrón moderno:** Write-ahead log con auto-compaction (inspirado en bases de datos y LSM trees):
  - Threshold: cuando el journal alcanza N mutaciones pendientes, disparar checkpoint asíncrono.
  - Backpressure: no acumular más de 2N mutaciones sin checkpoint.
  - Merge: el checkpoint fusiona mutaciones acumuladas en un snapshot compacto.
- **Archivos afectados:**
  - `src/server/cache/cacheStore.ts` — añadir `maxPendingMutations` con threshold (recomendado: 500).
  - `src/server/cache/semanticCacheRuntimeController.ts` — disparar `persistCheckpoint()` asíncrono al alcanzar threshold.
- **Acceptance criteria:**
  - El journal no excede `maxPendingMutations` (default 500) sin checkpoint.
  - Auto-compaction es asíncrona y no bloquea el hot path.
  - `getStats()` reporta `pendingMutations`, `autoCompactions`.
  - El checkpoint post-compaction es válido y restaurable.
- **Docs:** `docs/architecture.md` persistence layer, `docs/performance-budget.md`.
- **Tests:** Unit test: append 600 mutations con threshold 500 → verificar checkpoint. Test: checkpoint restaura estado correcto.

---

## CACHE-P1-KB-DEPENDENCY-INVALIDATION-01 — Invalidación de serving cache por grafo de dependencias

- **Estado:** Done.
- **Prioridad:** P1.
- **Origen:** Cache architecture audit (complemento de CACHE-P0-SERVING-KEY-DOCUMENT-EPOCH-01).
- **Evidencia:** El `KnowledgeBase` ya mantiene `documentDependencies` y `reverseDependencies`. Pero el serving cache no los usa para invalidación selectiva. Actualmente invalida por URI directo o global.
- **Riesgo:** Medio. Sin invalidación por dependencias, un hover sobre `child_class.inherited_method()` puede servir resultado stale si el ancestro cambió.
- **Patrón moderno:** Dependency-driven invalidation (inspirado en Salsa dependency graph):
  - Cuando un documento `A` cambia, invalidar serving cache de `A` Y de todos los documentos que dependen semánticamente de `A` (via `reverseDependencies`).
  - Early cutoff: si el cambio en `A` no modifica su interface pública (mismos exports), no propagar invalidación a dependientes.
- **Archivos afectados:**
  - `src/server/cache/servingCacheRuntime.ts` — extender `invalidateServingCacheEntries` para aceptar lista de URIs dependientes.
  - `src/server/workspace/watchedFileIntake.ts` — al reindexar un archivo, consultar `KnowledgeBase.getDependentDocumentsForUri()` y propagar invalidación.
  - `src/server/knowledge/semanticDiff.ts` — implementar early cutoff: comparar exports antes/después del cambio.
  - `src/server/handlers/documentHandlers.ts` — propagar invalidación de dependientes al cambiar un documento abierto.
- **Depends on:** `CACHE-P0-SERVING-KEY-DOCUMENT-EPOCH-01` (la clave de cache debe ser per-document para que la invalidación selectiva funcione).
- **Acceptance criteria:**
  - Al cambiar `ancestor.sru`, el serving cache invalida entradas de archivos que dependen de `ancestor`.
  - Early cutoff: si `ancestor.sru` cambia whitespace pero no exporta cambios, no invalida dependientes.
  - La invalidación selectiva es O(dependientes), no O(total entries).
  - No hay regresión: cambios globales siguen invalidando todo.
- **Docs:** `docs/architecture.md` knowledge layer, `docs/performance-budget.md` §6.2.
- **Tests:** Unit test: cambiar ancestro → verificar invalidación de descendientes. Test: cambiar whitespace → verificar no invalidación (early cutoff).

---

## PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01 — Reducir ruido de diagnostics informativos normales en PowerBuilder

- **Estado:** Done.
- **Prioridad:** P2.
- **Origen:** experiencia runtime.
- **Evidencia:** Se muestran diagnostics azules/warnings para patrones comunes y no necesariamente accionables.
- **Riesgo:** Medio. Aunque no rompe el parser, ensucia Problems y resta confianza al plugin.
- **Objetivo:** Mover información contextual a hover/context panels y dejar diagnostics visibles solo para problemas accionables.
- **Casos reales:**

```powerscript
lds_test.dataobject = inv_filterattrib.idw_dw.dataobject
```

```text
La asignación dinámica de DataObject en 'lds_test' impide una navegación fiable hacia un .srd.
vsc-powersyntax(dataobject-dynamic)
```

```powerscript
this.tabpg_values.dw_values.Retrieve()
```

```text
La operación 'dw_values.Retrieve()' usa un transaction object dinámico ('inv_filterattrib.idw_dw.itr_object'); se degrada la confidence semántica.
vsc-powersyntax(transaction-binding-dynamic)
```

- **Acceptance criteria:**
  - `dataobject-dynamic` y `transaction-binding-dynamic` no ensucian Problems por defecto.
  - Hover conserva información útil de riesgo/confidence.
  - Hay configuración documentada si el usuario quiere diagnostics estrictos.
- **Docs:** `docs/troubleshooting.md`, `docs/developer-workflows.md`, `docs/localization.md` si afecta textos visibles.
- **Tests:** diagnostics severity tests, configuration tests.

---

## PB-RUNTIME-P2-LIFECYCLE-PFC-PATTERNS-01 — Reglas lifecycle compatibles con patrones PFC reales

- **Estado:** Open.
- **Prioridad:** P2.
- **Origen:** falsos positivos lifecycle.
- **Evidencia:** El plugin no reconoce correctamente patrones válidos de `create/destroy`, `call super::create` y `TriggerEvent(this, "constructor")`.
- **Riesgo:** Medio. Genera falsos positivos en código PFC común.
- **Objetivo:** Separar reglas de llamada al padre y disparo de hook constructor, reconociendo variantes PowerBuilder/PFC válidas.
- **Casos reales:**

```powerscript
on pfc_n_cst_sortattrib.create
TriggerEvent( this, "constructor" )
end on
```

```powerscript
on pfc_n_cst_dwsrv_resize.create
call super::create
end on

on pfc_n_cst_dwsrv_resize.destroy
call super::destroy
end on
```

- **Acceptance criteria:**
  - Reconocer como válidos: `call super::create`, `call super::destroy`, `super::create`, `super::destroy`.
  - Reconocer como válido: `TriggerEvent(this, "constructor")` con espacios/case-insensitive razonables.
  - No exigir siempre ambos patrones simultáneamente.
  - La regla debe explicar con reason code qué patrón falta realmente si hay problema real.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/troubleshooting.md`.
- **Tests:** lifecycle diagnostics fixtures PFC.

---

## PB-RUNTIME-P2-EMPTY-HOOK-RETURN-01 — Funciones vacías con retorno como hooks de herencia

- **Estado:** Open.
- **Prioridad:** P2.
- **Origen:** falsos positivos SD13.
- **Evidencia:** Funciones vacías con tipo de retorno se usan como hooks/template methods para hijos, pero el plugin exige `return`.
- **Riesgo:** Medio. Genera ruido en PFC/arquitecturas heredadas.
- **Objetivo:** No marcar como error/warning fuerte funciones vacías con retorno cuando no contienen código ejecutable.
- **Casos reales:**

```powerscript
protected function long of_getcolorlinebackground ()
end function

protected function long of_getcolorlineprimary ()
end function

protected function long of_getcolorlinesecondary ()
end function
```

- **Acceptance criteria:**
  - Una función con retorno y cuerpo vacío no se marca como error por falta de `return`.
  - Si la función tiene código ejecutable y rutas sin return, la regla sigue funcionando.
  - Si se quiere reportar, debe ser hint opcional y no warning por defecto.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/troubleshooting.md`.
- **Tests:** missing-return fixtures con cuerpo vacío, cuerpo con código y return inline.

---

## PB-RUNTIME-P2-BUILD-ORCA-HEALTH-SEPARATION-01 — Separar health interactivo de build/ORCA opcional

- **Estado:** Open.
- **Prioridad:** P2.
- **Origen:** health dashboard runtime.
- **Evidencia:** Health marca build blocked y ORCA missing aunque el usuario está en flujo interactivo de lenguaje.
- **Riesgo:** Medio. Puede hacer parecer roto el language server cuando solo faltan capabilities opcionales.
- **Objetivo:** Separar claramente language/indexing health, build health y ORCA/package health.
- **Métricas observadas:**

```text
Build health: bloqueado · sin build files PBAutoBuild detectados
PBAutoBuild 25.0 / 2025 disponible · candidatos por defecto
ORCA no detectado
```

- **Acceptance criteria:**
  - Falta de build files no bloquea readiness semántica ni Object Explorer.
  - ORCA missing se reporta como capability opcional ausente, no como error crítico del runtime language server.
  - El dashboard muestra dimensiones separadas y accionables.
- **Docs:** `docs/troubleshooting.md`, `docs/architecture-implementation-map.md`, `docs/performance-budget.md`.
- **Tests:** health model tests.

---

# 5. Current execution focus recomendado

## Estado actual recomendado tras integrar errores runtime y auditoría de cache

```txt
PB-RUNTIME-P0-LEXER-STRINGS-01 — Lexer PowerScript correcto para strings, comillas mixtas y paréntesis literales
```

## Orden recomendado

### Fase A — Parser/Lexer P0 (correciones de falsos positivos masivos)

1. `PB-RUNTIME-P0-LEXER-STRINGS-01`
2. `PB-RUNTIME-P0-DW-STRING-SUBLANGUAGES-01`
3. `PB-RUNTIME-P0-PARSER-INLINE-AFTER-SEMICOLON-01`

### Fase B — Cache P0 (cadena de dependencias crítica para rendimiento)

> Los tres specs forman una cadena: sin eviction de document cache, la presión de memoria mata permanentemente el serving cache, y sin cache key per-document el hit ratio será 0%.

4. `CACHE-P0-DOCUMENT-CACHE-LRU-EVICTION-01` (desbloquea #5 y #6)
5. `CACHE-P0-MEMORY-PRESSURE-GRADUATED-POLICY-01` (desbloquea serving cache)
6. `CACHE-P0-SERVING-KEY-DOCUMENT-EPOCH-01` (hit ratio: 0% → ≥80%)

### Fase C — P1 runtime + cache (estabilidad y rendimiento profesional)

7. `PB-RUNTIME-P1-DISCOVERY-INDEXING-REAL-WORKSPACE-01`
8. `PB-RUNTIME-P1-HOVER-SYSTEM-FASTPATH-01`
9. `CACHE-P1-FROZEN-REFS-HOT-PATH-01` (reducción de latencia -2-8ms hover)
10. `CACHE-P1-READINESS-DISCOVERY-DEADLOCK-01` (safety net readiness)
11. `PB-RUNTIME-P1-VIEW-PROVIDERS-REGISTRATION-01`
12. `CACHE-P1-KB-DEPENDENCY-INVALIDATION-01` (invalidación selectiva Salsa-style)
13. `CACHE-P1-JOURNAL-AUTOCOMPACTION-01` (higiene de persistencia)

### Fase D — P2 polish (calidad de diagnósticos y UX)

14. `PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01`
15. `PB-RUNTIME-P2-LIFECYCLE-PFC-PATTERNS-01`
16. `PB-RUNTIME-P2-EMPTY-HOOK-RETURN-01`
17. `PB-RUNTIME-P2-BUILD-ORCA-HEALTH-SEPARATION-01`
18. Retomar `CATALOG-MANUAL-EN-MIGRATION` cuando los P0/P1 runtime estén controlados.

## Regla de promoción

- No abrir una cadena nueva sin promoción explícita en backlog/current-focus/roadmap/specs.
- Mantener verdes `docs:drift`, `test:performance:gate` y la matriz transversal ya cerrada antes de mover foco a otra fase.
- `AUDIT-DOC` acompaña el cierre, pero no sustituye el orden principal.
- Un ítem `Ready for closure` no pasa a `Done` sin validación ejecutada y entrada de `done-log.md`.
- `SYMBOL-MODEL-01` no se promueve mientras `SYMBOL-I18N-ENRICHMENT-AUDIT-01` siga `Open` o `Partial` con pendiente bloqueante.
- Los errores P0 runtime de parser/lexer tienen preferencia sobre localización/catálogo porque generan falsos positivos masivos y afectan al core semántico.
- Las specs de cache P0 tienen preferencia sobre features nuevas porque su cascada bloquea toda la capa de serving interactiva.
- Las specs CACHE-P1 pueden ejecutarse en paralelo con PB-RUNTIME-P1 si no hay conflicto de archivos.

---

# 6. No abrir todavía salvo necesidad real

- Nuevas features visuales pesadas sin guardrails claros y preferencia por Tree View frente a Webview cuando baste.
- Nuevos reports grandes sin caps/paginación/reason codes explícitos en surfaces agent-ready.
- Nuevos carriles ORCA/PBAutoBuild sin pasar por support matrix, troubleshooting y health.
- Automatización write-enabled avanzada sin safe-edit-plan, impact-analysis, receipts y rollback claro.
- Nuevos dominios de catálogo que reabran `ADR-0001` sin regresión objetiva.
- Nuevos parsers DataWindow que traten `.srd` como PowerScript normal.
- Nuevos agentes/skills/prompts que dupliquen reglas ya existentes en `AGENTS.md`, `.github/copilot-instructions.md` o `docs/ai-orchestration.md`.
- Nuevas reglas de diagnostics informativas hasta reducir primero el ruido actual de `dataobject-dynamic`, `transaction-binding-dynamic`, lifecycle y empty hooks.

---

# 7. Criterio de salida de la fase de auditorías

La fase de auditorías podrá considerarse cerrada cuando:

```txt
1. No queden auditorías activas P0/P1 sin plan, spec o decisión explícita.
2. No queden Critical/High sin plan.
3. El VSIX instalado active correctamente.
4. API/tools/commands estén alineados.
5. Hot paths respeten performance budget.
6. Core semántico PowerBuilder no tenga bugs críticos conocidos.
7. Project routing .pbproj/PBL y ancestor resolution funcionen en workspace real.
8. DataWindow mantenga frontera clara.
9. Catálogo cumpla ADR-0001 y B335 no reporte métricas falsas.
10. Reports/analyzers no generen ruido masivo ni payloads excesivos.
11. Docs/backlog/current-focus/done-log estén alineados.
12. Lexer/parser ignoran correctamente contenido de strings y soportan código inline tras `;`.
13. Hover de built-ins/system functions es rápido y no depende de discovery completo.
14. Object Explorer, Current Object Context y Diagnostics Explainability registran providers y degradan con estados propios.
15. Health separa correctamente runtime language, build y ORCA opcional.
16. Document cache tiene LRU con eviction y pin semántico, no supera budget de 48 MiB.
17. Serving cache hit ratio ≥80% durante navegación normal con indexación paralela.
18. Memory pressure no crea doom loop que mate permanentemente el serving cache.
19. Hot path de hover/completion no usa structuredClone defensivo para consumers de solo lectura.
```