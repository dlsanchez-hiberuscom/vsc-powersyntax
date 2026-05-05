# Backlog — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

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

### 1.1. Checklist final para agentes Copilot

Before closing any spec or audit from this document, perform this checklist:

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


## CALLABLE-01 — Separar cabecera callable e instrucción inicial tras `;`

- **Estado:** Open
- **Prioridad:** P1
- **Tipo:** parser / semantic-range / hover / callable
- **Origen:** problema real observado por usuario
- **Spec:** `specs/CALLABLE-01-callable-header-body-semicolon-split/`

### Síntoma

El hover muestra un `Callable contenedor` contaminado con texto de la primera instrucción ejecutable:

```txt
Callable contenedor: event pfc_values;call super::pfc_values...
```

El callable debería identificarse solo como `event pfc_values`, separando el código posterior al `;` como primera instrucción del cuerpo.

### Impacto

- Hover muestra información incorrecta.
- Contexto semántico de variables locales queda contaminado.
- Puede afectar currentObjectContext, diagnostics, explain-semantic-query y safe-edit-plan.

### Criterios de cierre

- Cabecera callable corta correctamente en `;`.
- Texto posterior a `;` se conserva como primera instrucción ejecutable.
- Hover/local scope muestra callable correcto.
- Tests focales verdes.

### Validación esperada

```bash
npm test -- --grep "callable"
npm test -- --grep "hover"
npm test -- --grep "currentObjectContext"
npm run test:docs:drift
```

---

## DIAG-01 — No marcar cierres de bloque como código inalcanzable

- **Estado:** Open
- **Prioridad:** P1
- **Tipo:** diagnostic / control-flow / false-positive
- **Origen:** problema real observado por usuario
- **Spec:** `specs/DIAG-01-unreachable-structural-block-closures/`

### Síntoma

El diagnóstico `SD11` marca `END IF` como código inalcanzable cuando está precedido por `RETURN`, aunque `END IF` solo cierra el bloque.

### Impacto

- Falso positivo visible.
- Ruido en Problems/hover.
- Reduce confianza en diagnostics.

### Criterios de cierre

- `END IF` después de `RETURN` no genera `SD11`.
- Otros cierres estructurales soportados tampoco generan `SD11`.
- Una instrucción ejecutable real después de `RETURN` sigue generando `SD11`.
- Tests anti-regresión verdes.

### Validación esperada

```bash
npm test -- --grep "unreachable"
npm test -- --grep "diagnostics"
npm run test:docs:drift
```

---

## DW-01 — Resolver funciones nativas DataWindow en descendants custom

- **Estado:** Open
- **Prioridad:** P1
- **Tipo:** semantic / DataWindow / system-catalog / inheritance
- **Origen:** problema real observado por usuario
- **Spec:** `specs/DW-01-datawindow-native-members-custom-inheritance/`

### Síntoma

Una variable declarada como tipo custom `u_dw`, donde `u_dw` hereda de `datawindow`, no recibe soporte semántico completo para funciones nativas DataWindow como `GetColumnName()`.

### Impacto

- Falla hover/completion/signatureHelp/definition sobre métodos nativos DataWindow en controles custom.
- Se pierde soporte en casos PFC/legacy comunes.
- IA/tools reciben contexto incompleto.

### Criterios de cierre

- `u_dw -> datawindow` se reconoce como herencia transitiva.
- `idw_requestor.GetColumnName()` se reconoce como función nativa DataWindow.
- Completion/hover/signatureHelp aplican catálogo DataWindow a descendants custom.
- No hay scans globales en hot path.

### Validación esperada

```bash
npm test -- --grep "datawindow"
npm test -- --grep "hover"
npm test -- --grep "completion"
npm test -- --grep "signatureHelp"
npm run test:docs:drift
```

---

## HOVER-01 — Rediseñar hover compacto por tipo de símbolo

- **Estado:** Open
- **Prioridad:** P1
- **Tipo:** UX / hover / semantic-presentation
- **Origen:** problema real observado por usuario
- **Spec:** `specs/HOVER-01-hover-ux-contract/`

### Síntoma

Hover muestra demasiada metadata interna:

```txt
Origen, Autoridad, Fase, Confianza, Motivo de resolución, Candidatos, Declaration scope, Owner real...
```

El usuario necesita información útil, compacta y accionable.

### Impacto

- UX ruidosa.
- Información útil queda enterrada.
- Metadata interna se confunde con semántica útil.

### Criterios de cierre

- Hover normal usa formato compacto por tipo de símbolo.
- Metadata interna queda oculta salvo modo diagnóstico/debug o comando explain.
- Hay contrato documentado para variables, tipos, funciones sistema, funciones usuario, DataWindow, SQL, diagnostics y externos.
- Tests de render/payload actualizados.

### Validación esperada

```bash
npm test -- --grep "hover"
npm run test:docs:drift
```

---

## HOVER-02 — Optimizar hover para cache/hot path y evitar fallback global innecesario

- **Estado:** Open
- **Prioridad:** P1
- **Tipo:** performance / hover / cache / hot-path
- **Origen:** problema real observado por usuario
- **Spec:** `specs/HOVER-02-hover-performance-cache-hotpath/`

### Síntoma

Hover se siente lento y en algunos casos muestra resolución por `global-fallback` para símbolos que deberían resolverse desde contexto activo/cache.

### Impacto

- Mala experiencia interactiva.
- Riesgo de trabajo excesivo en hot path.
- Posible serving cache incompleto o mal usado.

### Criterios de cierre

- Hover reutiliza active document/hot context/serving cache cuando sea posible.
- No hay fallback global innecesario para símbolos locales, miembros o tipos ya indexados.
- Existe test o guard que detecta scans/relecturas globales en hover.
- Latencia de hover queda dentro de presupuesto.

### Validación esperada

```bash
npm test -- --grep "hover"
npm run test:performance:gate
npm run test:docs:drift
```

---

## HOVER-AUDIT-01 — Auditoría final end-to-end de hover

- **Estado:** Open
- **Prioridad:** P1
- **Tipo:** audit / UX / semantic-hover
- **Origen:** cierre transversal de HOVER/CALLABLE/DIAG/DW
- **Spec:** `specs/HOVER-AUDIT-01-hover-end-to-end-acceptance/`

### Objetivo

Validar que el hover final es rápido, compacto, útil y semánticamente correcto en todos los tipos relevantes.

### Criterios de cierre

- Variables locales muestran tipo + scope útil.
- Miembros muestran visibilidad + tipo + owner útil.
- Tipos muestran herencia útil.
- Funciones sistema muestran firma + resumen.
- Funciones usuario muestran firma + owner/herencia.
- DataWindow native functions se resuelven vía descendants custom.
- Diagnostics no muestran falsos positivos conocidos.
- Metadata debug no aparece por defecto.
- Explain/debug conserva trazabilidad avanzada fuera del hover normal.

### Validación esperada

```bash
npm test -- --grep "hover"
npm test -- --grep "definition"
npm test -- --grep "completion"
npm test -- --grep "signatureHelp"
npm test -- --grep "diagnostics"
npm run test:performance:gate
npm run test:docs:drift
```

---

# 4. Current execution focus recomendado

## Cierre inmediato

```txt
completado
```

## Siguiente cadena activa

```txt
completado
```

## Regla de promoción

- No abrir implementación fuera de la cadena activa.
- No abrir trabajo nuevo fuera de la siguiente cadena promovida sin backlog/current-focus/roadmap/specs alineados.
- `AUDIT-DOC` acompaña el cierre, pero no sustituye el orden principal.
- Un ítem `Ready for closure` no pasa a `Done` sin validación ejecutada y entrada de `done-log.md`.

---

# 5. No abrir todavía salvo necesidad real

- Nuevas features visuales pesadas sin guardrails claros y preferencia por Tree View frente a Webview cuando baste.
- Nuevos reports grandes sin caps/paginación/reason codes explícitos en surfaces agent-ready.
- Nuevos carriles ORCA/PBAutoBuild sin pasar por support matrix, troubleshooting y health.
- Automatización write-enabled avanzada sin safe-edit-plan, impact-analysis, receipts y rollback claro.
- Nuevos dominios de catálogo que reabran `ADR-0001` sin regresión objetiva.
- Nuevos parsers DataWindow que traten `.srd` como PowerScript normal.
- Nuevos agentes/skills/prompts que dupliquen reglas ya existentes en `AGENTS.md`, `PROJECT.md` o `docs/ai-orchestration`.

---

# 6. Criterio de salida de la fase de auditorías

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
```

Las auditorías históricas `AUDIT-01..AUDIT-08` quedan como trazabilidad histórica si viven en `done-log.md` o specs cerradas. No deben bloquear la fase activa salvo que una revisión posterior las reabra con evidencia.
