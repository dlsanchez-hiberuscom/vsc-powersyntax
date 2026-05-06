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

# 4. Current execution focus recomendado

## Estado actual

```txt
CATALOG-LOCALIZATION-DOMAINS-01 — Localization coverage by domain
```

## Regla de promoción

- No abrir una cadena nueva sin promoción explícita en backlog/current-focus/roadmap/specs.
- Mantener verdes `docs:drift`, `test:performance:gate` y la matriz transversal ya cerrada antes de mover foco a otra fase.
- `AUDIT-DOC` acompaña el cierre, pero no sustituye el orden principal.
- Un ítem `Ready for closure` no pasa a `Done` sin validación ejecutada y entrada de `done-log.md`.
- `SYMBOL-MODEL-01` no se promueve mientras `SYMBOL-I18N-ENRICHMENT-AUDIT-01` siga `Open` o `Partial` con pendiente bloqueante.

---

# 5. No abrir todavía salvo necesidad real

- Nuevas features visuales pesadas sin guardrails claros y preferencia por Tree View frente a Webview cuando baste.
- Nuevos reports grandes sin caps/paginación/reason codes explícitos en surfaces agent-ready.
- Nuevos carriles ORCA/PBAutoBuild sin pasar por support matrix, troubleshooting y health.
- Automatización write-enabled avanzada sin safe-edit-plan, impact-analysis, receipts y rollback claro.
- Nuevos dominios de catálogo que reabran `ADR-0001` sin regresión objetiva.
- Nuevos parsers DataWindow que traten `.srd` como PowerScript normal.
- Nuevos agentes/skills/prompts que dupliquen reglas ya existentes en `AGENTS.md`, `.github/copilot-instructions.md` o `docs/ai-orchestration.md`.

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
