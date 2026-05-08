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
46. PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01
47. PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01
48. PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01
```

---

## 1. Cómo debe usar este backlog una IA

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
- No introducir full scans in hot paths de hover, completion, signature help, definition, references, semantic tokens o diagnostics.
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


---

# 4. Backlog arquitectónico y semántico

## 4.1. Backlog arquitectónico final — Diseño semántico objetivo

> Esta sección deriva de docs/semantic-design-target.md y docs/semantic-design-assumptions.md.

---

## PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01 — DataWindow Submodel Publication
- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 46.
- **Objetivo:** Publicar el submodelo DataWindow (columns, retrieve args, expressions) como parte del snapshot semántico y la fachada.

---

## PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01 — SQL Anchors Submodel
- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 47.
- **Objetivo:** Implementar el submodelo de anchors SQL para host variables y lineage de statements.

---

## PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01 — Native Metadata Submodel
- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 48.
- **Objetivo:** Clasificar y exponer metadatos de funciones externas y tipos nativos con riesgo de invocación explícito.
