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

- **Estado:** Open.
- **Prioridad:** P1.
- **Origen:** health dashboard runtime.
- **Evidencia:** Cache persistida fuera de budget, document cache al 114%, serving cache sin hits y journal creciendo durante navegación.
- **Riesgo:** Alto. Degrada memoria, velocidad y estabilidad; contradice la meta maestra.
- **Objetivo:** Reducir carga de documentos completos, estabilizar keys de cache, aplicar eviction real y compactar journal.
- **Métricas observadas:**

```text
cache persistida fuera de budget (380455762/33554432)
document cache superó su budget estimado
document cache 114%
documents 826
heap 298.5 MiB / 337.0 MiB
serving 0/256 · hit 0% (0/155)
Journal: 50/4755 eventos
Journal: 50/10537 eventos
journal persistido pide compactación
```

- **Acceptance criteria:**
  - No se mantienen 826 documentos completos en memoria salvo justificación explícita y budget aceptado.
  - Document cache tiene eviction real y métricas coherentes.
  - Serving cache se usa en hovers/navegación y reporta hits razonables.
  - Journal compacta automáticamente o expone acción/control claro sin crecimiento descontrolado.
- **Docs:** `docs/performance-budget.md`, `docs/troubleshooting.md`.
- **Tests:** performance/cache tests, journal compaction tests, cache key tests.

---

## PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01 — Reducir ruido de diagnostics informativos normales en PowerBuilder

- **Estado:** Open.
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

## Estado actual recomendado tras integrar errores runtime

```txt
PB-RUNTIME-P0-LEXER-STRINGS-01 — Lexer PowerScript correcto para strings, comillas mixtas y paréntesis literales
```

## Orden recomendado

1. `PB-RUNTIME-P0-LEXER-STRINGS-01`
2. `PB-RUNTIME-P0-DW-STRING-SUBLANGUAGES-01`
3. `PB-RUNTIME-P0-PARSER-INLINE-AFTER-SEMICOLON-01`
4. `PB-RUNTIME-P1-DISCOVERY-INDEXING-REAL-WORKSPACE-01`
5. `PB-RUNTIME-P1-HOVER-SYSTEM-FASTPATH-01`
6. `PB-RUNTIME-P1-VIEW-PROVIDERS-REGISTRATION-01`
7. `PB-RUNTIME-P1-CACHE-MEMORY-JOURNAL-BUDGET-01`
8. `PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01`
9. `PB-RUNTIME-P2-LIFECYCLE-PFC-PATTERNS-01`
10. `PB-RUNTIME-P2-EMPTY-HOOK-RETURN-01`
11. `PB-RUNTIME-P2-BUILD-ORCA-HEALTH-SEPARATION-01`
12. Retomar `CATALOG-LOCALIZATION-DOMAINS-01` cuando los P0/P1 runtime estén controlados o exista decisión explícita.

## Regla de promoción

- No abrir una cadena nueva sin promoción explícita en backlog/current-focus/roadmap/specs.
- Mantener verdes `docs:drift`, `test:performance:gate` y la matriz transversal ya cerrada antes de mover foco a otra fase.
- `AUDIT-DOC` acompaña el cierre, pero no sustituye el orden principal.
- Un ítem `Ready for closure` no pasa a `Done` sin validación ejecutada y entrada de `done-log.md`.
- `SYMBOL-MODEL-01` no se promueve mientras `SYMBOL-I18N-ENRICHMENT-AUDIT-01` siga `Open` o `Partial` con pendiente bloqueante.
- Los errores P0 runtime de parser/lexer tienen preferencia sobre localización/catálogo porque generan falsos positivos masivos y afectan al core semántico.

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
```