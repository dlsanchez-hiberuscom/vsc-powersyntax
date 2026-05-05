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
- **Ready for closure:** código y tests básicos existen; falta revisión final, documentación o validación ampliada.
- **Blocked:** no puede avanzar por dependencia, entorno o decisión explícita.
- **Done:** código, tests, documentación y validación cerrados; vive en `done-log.md`, no en backlog activo.
- **Superseded:** ítem absorbido por otra spec activa o cerrada; no debe ejecutarse de forma independiente.

Un ítem `Partial` debe incluir, siempre que sea posible:

```md
**Pendiente exacto:**
- ...
```

### 2.1. Evidencia requerida para `Ready for closure`

Un ítem solo puede estar en `Ready for closure` si incluye evidencia de validación ejecutada o referencia explícita al artefacto donde vive esa evidencia.

Si solo lista `Validación esperada`, debe permanecer en `Open`.

Formato recomendado:

```md
**Validación ejecutada:**
- `comando`: OK/FAIL/SKIPPED
- evidencia: ruta, log, artefacto o resumen
```

### 2.2. Regla de ejecución inmediata

La cadena obligatoria pedida por el usuario sigue siendo:

```txt
VSIX-01 → AUDIT-VSIX → DOC-01 → DOC-02 → AUDIT-DOC
```

Estado actual de esa cadena:

- `VSIX-01`: cerrada con evidencia real en `docs/done-log.md`.
- `AUDIT-VSIX`: cerrada con evidencia real en `docs/done-log.md`.
- `DOC-01`: cerrada con evidencia real en `docs/done-log.md`.
- `DOC-02`: cerrada con evidencia real en `docs/done-log.md`.
- `AUDIT-DOC`: cerrada con evidencia real en `docs/done-log.md`.
- Siguiente bloque promovible: `BL-01 → BL-02 → BL-03 → BL-08`.

Mientras la cadena activa restante no esté cerrada con evidencia real, ningún agente debe avanzar a trabajo de symbols, localización, catálogo o nuevas mejoras.

Orden obligatorio de cierre inmediato:

```txt
VSIX-01 → AUDIT-VSIX → DOC-01 → DOC-02 → AUDIT-DOC
```

Solo cuando esa cadena esté `Done` o explícitamente cerrada con evidencia, se podrá promover el siguiente bloque:

```txt
BL-01 → BL-02 → BL-03 → BL-08
```

Después, si procede, se podrá promover la planificación posterior:

```txt
SYM-01 → LOC-01 → CAT-01 → GOV-01
completado
```

No se debe saltar de `Ready for closure` a `Done` sin validación ejecutada y documentada.

---

# 3. Backlog actual

## 3.1. Cierre inmediato P0/P1
## 3.2. Backlog derivado de auditoría PowerBuilder 0-54

Estos ítems proceden de la auditoría read-only contra la guía PowerBuilder 0-54. No sustituyen a los planes `SYM/LOC/CAT/GOV`. Representan gaps reales detectados.

Sin ítems activos en este bloque derivado.

---

## 3.3. Planificación posterior de symbols, localización, catálogo y governance

Estos ítems no sustituyen al backlog derivado de auditoría. No deben promoverse hasta cerrar o absorber la cadena inmediata y los P1 derivados de auditoría.

---

# 4. Current execution focus recomendado

## Cierre inmediato

```txt
completado
```

## Siguiente cadena P1 derivada de auditoría PowerBuilder 0-54

```txt
completado
```

## Planificación posterior P1/P2

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
