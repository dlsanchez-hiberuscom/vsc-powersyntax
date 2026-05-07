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
- Un self-test de runtime no puede considerarse suficiente si solo valida snapshots internos. Debe incluir probes funcionales de features interactivas críticas: hover built-in, definition low-confidence, serving cache, view providers y readiness transitions.
- Si `Readiness = ready` e `Indexer = ready`, pero hover/paneles/definition no funcionan, el fallo debe clasificarse como problema de serving/runtime interactivo, no como discovery/indexing salvo evidencia directa.
- Las capacidades opcionales de build/ORCA no deben contaminar el estado de salud del language runtime. Build blocked u ORCA missing deben aparecer como capabilities separadas, no como bloqueo del hover, Object Explorer, Current Context, Diagnostics Explainability o diagnostics.
- Las requests interactivas LSP deben ser deterministas: una request repetida para el mismo provider/URI/posición/documentVersion debe deduplicarse o resolverse desde cache/negative-cache, nunca entrar en spam de scheduler.
- Los built-ins/system functions de PowerScript deben resolverse antes que el workspace index. No deben depender de discovery completo ni de PBAutoBuild/ORCA.
- Las views contribuidas por `package.json` deben registrar siempre su provider durante `activate()`. Los datos pueden degradar; el provider no puede faltar.

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

## Estado 2026-05

- El carril runtime interactivo, hover, serving cache, parser string-safe, discovery real workspace y health build/ORCA quedó cerrado y movido a [done-log.md](done-log.md).
- El siguiente foco activo para este frente queda en `PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01`.

## PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01 — Reducir ruido visual y severidades no accionables sin perder explainability

- **Estado:** Open.
- **Prioridad:** P2.
- **Origen:** feedback runtime tras cerrar el carril interactivo; las advertencias contextuales siguen ensuciando Problems aunque el runtime ya sea funcional.
- **Riesgo:** Medio. El usuario percibe falsos problemas porque warnings de contexto/confianza comparten canal con errores accionables.
- **Objetivo:** reservar Problems para issues accionables y mover ruido contextual a hover, explainability y reportes read-only sin perder reason codes ni confidence.
- **Acceptance criteria:**
  - `dataobject-dynamic` y `transaction-binding-dynamic` no ensucian Problems por defecto.
  - Hover, explainability y reportes read-only conservan confidence, riesgo, source origin y reason codes.
  - La superficie interactiva sigue verde: no se reabre runtime self-test, hover fast path, discovery warm-start ni health separation.
  - Tests y documentación quedan alineados.
- **Docs:** `docs/current-focus.md`, `docs/testing.md`, `docs/troubleshooting.md`, `docs/architecture-status.md` si cambia el contrato visible.
- **Tests:** unit/integration de diagnostics presentation, explainability y publishing en Problems.


---

# 5. Current execution focus recomendado

## Estado actual recomendado tras cerrar el carril runtime interactivo y parser/discovery

```txt
PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01 — Reducir ruido visual y severidades no accionables sin perder explainability
```

## Orden recomendado

### Fase D — P2 polish (calidad de diagnósticos y UX)

1. `PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01`
2. Retomar `CATALOG-MANUAL-EN-MIGRATION` cuando se mantengan verdes la matriz transversal, las smokes runtime y el corpus real OrderEntry/PFC.

**Criterio de salida:**
- Las advertencias `dataobject-dynamic` y `transaction-binding-dynamic` dejan de ensuciar Problems por defecto.
- La explainability conserva confidence, reason codes y riesgos en hover/reportes read-only.
- No se reabre el carril cerrado de runtime interactivo, parser o discovery sin una regresión ejecutable nueva.

## Regla de promoción

- No abrir una cadena nueva sin promoción explícita en backlog/current-focus/roadmap/specs.
- Mantener verdes `docs:drift`, `test:performance:gate` y la matriz transversal ya cerrada antes de mover foco a otra fase.
- `AUDIT-DOC` acompaña el cierre, pero no sustituye el orden principal.
- Un ítem `Ready for closure` no pasa a `Done` sin validación ejecutada y entrada de `done-log.md`.
- `SYMBOL-MODEL-01` no se promueve mientras `SYMBOL-I18N-ENRICHMENT-AUDIT-01` siga `Open` o `Partial` con pendiente bloqueante.
- Los errores P0 runtime de parser/lexer tienen preferencia sobre localización/catálogo porque generan falsos positivos masivos y afectan al core semántico.
- Las specs de cache P0 tienen preferencia sobre features nuevas porque su cascada bloquea toda la capa de serving interactiva.
- Las specs CACHE-P1 pueden ejecutarse en paralelo con PB-RUNTIME-P1 si no hay conflicto de archivos.
- La Fase A0 puede adelantarse a parser/cache cuando el VSIX instalado muestre fallos interactivos reales aunque `Readiness` e `Indexer` estén en `ready`.

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
- Nuevas features de Object Explorer antes de garantizar provider registration, estados degradados y smoke test de activación.
- Nuevas features de hover/completion antes de cerrar fast-path built-in, deduplicación y serving-cache observability.

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
15. Health separa correctamente runtime language, interactive serving, build y ORCA opcional.
16. Document cache tiene LRU con eviction y pin semántico, no supera budget de 48 MiB.
17. Serving cache hit ratio ≥80% durante navegación normal con indexación paralela.
18. Memory pressure no crea doom loop que mate permanentemente el serving cache.
19. Hot path de hover/completion no usa structuredClone defensivo para consumers de solo lectura.
20. RuntimeSelfTest incluye probes funcionales y no puede pasar si hover built-in, view providers o negative cache de definition fallan.
21. Hover sobre `IsNull`, `UpperBound`, `String`, `Long` y `MessageBox` responde desde catálogo system sin depender del workspace index.
22. Las requests repetidas de hover/definition tienen deduplicación y negative cache; no hay spam continuo de scheduler para la misma URI/posición/version.
23. Las métricas de serving cache muestran reason codes para hits, misses, negative hits y non-cacheable results.
24. Los paneles laterales nunca muestran el error nativo de VS Code de provider no registrado; siempre muestran estado propio.
25. Build/ORCA no bloquean ni degradan falsamente el estado del language runtime interactivo.
```
