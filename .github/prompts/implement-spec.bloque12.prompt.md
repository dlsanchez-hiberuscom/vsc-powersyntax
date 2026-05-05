# BLOQUE 12 — Legacy Isolation, Technical Debt & Controlled Cleanup

> Objetivo: cerrar la cadena arquitectónica con una política estricta de aislamiento legacy, limpieza controlada de deuda, retirada de documentos/prompts obsoletos, eliminación de duplicidades, normalización de naming/owners y protección contra regresiones, sin reescrituras masivas ni pérdida de heurísticas útiles provenientes de `plugin_old`.

---

## Base técnica y patrones aplicados

Este bloque se basa en los bloques anteriores y en la situación del proyecto:

- `plugin_old` puede contener heurísticas útiles, casos borde y aprendizajes, pero no debe convertirse en dependencia runtime del plugin actual.
- La arquitectura nueva debe evolucionar por slices y specs cerrables, no mediante big-bang refactor.
- Los documentos Markdown se están reorganizando para evitar duplicación y mantener fuentes únicas de verdad.
- Los bloques 1–11 han introducido nuevas capas y contratos: serving/cache, hover, completion, LSP alignment, semantic owners, DataWindow fast mode, presentation, boundaries, testing, AI y release/build rails.
- Tras introducir nuevos contratos, existe riesgo de dejar referencias antiguas, specs superseded, prompts obsoletos, docs duplicadas, imports accidentales o módulos dead/unused.
- La deuda debe ser gestionada como backlog técnico explícito, con guards, tests y documentación, no como limpieza informal.

Patrones externos aplicados:

- **Strangler Fig incremental:** sustituir piezas legacy de forma gradual, manteniendo la funcionalidad existente y reduciendo el alcance legacy paso a paso.
- **Anti-corruption layer:** aislar subsistemas con semánticas diferentes mediante adapters/fachadas para que lo legacy no contamine el diseño moderno.
- **Architecture fitness functions:** automatizar límites, imports y métricas para evitar que la arquitectura vuelva a degradarse.
- **Deprecation policy:** marcar elementos como `Active`, `Superseded`, `Deprecated`, `Reference-only` o `Removed` antes de borrar.
- **Safe cleanup:** borrar solo cuando existan tests, docs actualizadas y alternativa clara.

---

## Dependencia de Bloques previos

Este bloque es transversal y puede ejecutarse por slices, pero se recomienda después de tener definidos:

- `ARCH-BOUNDARY-01` — Boundary rules entre client/server/shared.
- `ARCH-GUARD-01` — Architecture import boundaries reforzados.
- `TEST-DOCS-01` — Docs drift y backlog/current-focus/done-log consistency.
- `AI-GOV-01` — AI customization map y single source of truth.
- `RELEASE-01` — Release readiness lane y VSIX packaging contract.

Este bloque NO debe hacer refactor semántico amplio. Si durante la limpieza se detecta deuda funcional importante, se debe crear spec nueva y no mezclarla con cleanup.

---

## Estado de ítems anteriores

### Relacionados / consolidados

- `LEGACY-GUARD-01` queda como spec central de este bloque.
- Referencias a `DEVTOOLS-PERF-*`, `IMAP-D*`, `DEVTOOLS-DW-01`, `DEVTOOLS-ARCH-01` o similares deben quedar normalizadas como `Superseded`, `Deprecated` o reubicadas en los bloques nuevos.
- Los prompts antiguos de auditoría/refactor deben migrarse a `.prompt.md` o retirarse si fueron sustituidos.

---

## Cadena recomendada — Bloque 12

Orden recomendado dentro del bloque:

1. `LEGACY-POLICY-01` — Policy oficial de `plugin_old`: reference-only, no runtime.
2. `LEGACY-GUARD-01` — No imports desde `src/**` hacia `plugin_old/**`.
3. `LEGACY-EXTRACT-01` — Extracción segura de heurísticas legacy con evidence y tests.
4. `DEBT-INVENTORY-01` — Inventario de deuda técnica post-bloques.
5. `DEBT-DOCS-01` — Limpieza de documentación duplicada/obsoleta.
6. `DEBT-BACKLOG-01` — Normalización de backlog, superseded/deprecated/active.
7. `DEBT-PROMPTS-01` — Limpieza de prompts, agents, skills e instructions obsoletos.
8. `DEBT-CODE-01` — Dead code, unused exports y orphan modules audit.
9. `DEBT-NAMING-01` — Naming/import/export normalization.
10. `DEBT-CONFIG-01` — Config, scripts y package metadata cleanup.
11. `DEBT-TESTS-01` — Test cleanup: flakes, skips, obsolete fixtures y gaps.
12. `DEBT-RELEASE-01` — Pre-release cleanup checklist y removal receipts.
13. `DEBT-DOCS-DRIFT-01` — Drift guard reforzado para docs/specs/prompts.

---

# FASE A — Legacy isolation

## LEGACY-POLICY-01 — Policy oficial de `plugin_old`: reference-only, no runtime

- **Priority:** P1.
- **Status:** Open.
- **Area:** legacy, architecture, policy.
- **Problem:**
  - `plugin_old` puede contener heurísticas útiles, pero importar código legacy directamente puede contaminar la arquitectura moderna, duplicar owners y romper boundaries.
- **Goal:**
  - Definir `plugin_old` como fuente de referencia, no como runtime dependency.
- **Acceptance criteria:**
  - `plugin_old` queda documentado como `reference-only`.
  - Se permite leer `plugin_old` para extraer heurísticas, edge cases o test scenarios.
  - Se prohíben imports runtime desde `src/**` hacia `plugin_old/**`.
  - Se prohíbe copiar código legacy sin adaptar a los contratos modernos.
  - Cualquier heurística extraída debe tener spec, tests y documentación afectada.
  - Docs explican cómo usar `plugin_old` en auditorías sin portarlo ciegamente.
- **Implementation notes:**
  - No borrar `plugin_old` en esta spec.
  - Añadir policy en architecture docs y AI instructions si aplica.
  - Mantener wording claro: `reference-only`, `not runtime`.
- **Tests:**
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
  - `docs/testing.md`
  - `.github/copilot-instructions.md` si aplica.
- **Dependencies:** ninguna dura.
- **Risk:** bajo-medio.
- **Exit criteria:**
  - Nadie puede interpretar `plugin_old` como dependencia runtime permitida.

---

## LEGACY-GUARD-01 — No imports desde `src/**` hacia `plugin_old/**`

- **Priority:** P1.
- **Status:** Open.
- **Area:** legacy, architecture, import-guard.
- **Problem:**
  - Aunque la policy exista, un import accidental desde `src/**` a `plugin_old/**` puede colarse en una PR/refactor.
- **Goal:**
  - Convertir la frontera legacy en guard ejecutable.
- **Acceptance criteria:**
  - Existe test/fitness function que falla ante imports desde `src/**` hacia `plugin_old/**`.
  - El guard cubre imports estáticos y, si es viable, patterns de dynamic import/require.
  - El mensaje de fallo explica que `plugin_old` es reference-only.
  - Si existe allowlist temporal, debe estar vacía o documentada con fecha de retirada.
  - CI/local lanes incluyen este guard en architecture rapid.
- **Implementation notes:**
  - Reutilizar `architectureImports.test.ts` o test equivalente.
  - No bloquear tests o scripts que leen `plugin_old` como fixtures/reference si están explícitamente permitidos y documentados.
- **Tests:**
  - `npm run test:architecture:rapid`
  - `npm run test:architecture:metrics`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/testing.md`
  - `docs/architecture-status.md`
- **Dependencies:** `LEGACY-POLICY-01`.
- **Risk:** bajo.
- **Exit criteria:**
  - El repo falla automáticamente si runtime actual importa `plugin_old`.

---

## LEGACY-EXTRACT-01 — Extracción segura de heurísticas legacy con evidence y tests

- **Priority:** P2.
- **Status:** Open.
- **Area:** legacy, migration, heuristics, tests.
- **Problem:**
  - Algunas heurísticas de `plugin_old` pueden ser valiosas, pero copiarlas sin adaptación puede reintroducir deuda, APIs antiguas o comportamiento inconsistente.
- **Goal:**
  - Definir un proceso seguro para extraer heurísticas legacy sin portar código ciegamente.
- **Acceptance criteria:**
  - Toda extracción desde `plugin_old` requiere:
    - descripción de la heurística;
    - evidence/caso borde que resuelve;
    - owner moderno destino;
    - tests nuevos o actualizados;
    - docs afectadas;
    - nota de no-copy/no-runtime import.
  - El código resultante usa contratos modernos: SemanticQueryFacade, DataWindowFastContext, ViewModels, ServingPipeline, etc. cuando aplique.
  - No se aceptan ports grandes sin spec dedicada.
  - Cada extracción queda trazada en done-log o technical note si se cierra.
- **Implementation notes:**
  - Priorizar heurísticas para PowerBuilder edge cases, DataWindow, PFC/STD patterns y performance.
  - Evitar adaptar bugs o workarounds sin evidencia.
- **Tests:**
  - `npm run test:unit`
  - `npm test`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/technical-notes.md` si existe.
  - `docs/architecture-implementation-map.md`
  - `docs/done-log.md`
- **Dependencies:**
  - `LEGACY-POLICY-01`
  - `LEGACY-GUARD-01`
- **Risk:** medio-alto.
- **Exit criteria:**
  - Existe una vía segura para aprovechar legacy sin contaminar runtime.

---

# FASE B — Inventario y normalización de deuda

## DEBT-INVENTORY-01 — Inventario de deuda técnica post-bloques

- **Priority:** P2.
- **Status:** Open.
- **Area:** debt, architecture, inventory.
- **Problem:**
  - Tras crear bloques 1–11, quedarán specs antiguas, docs parciales, módulos duplicados y tareas no categorizadas.
- **Goal:**
  - Crear inventario único de deuda técnica con prioridad, owner y decisión.
- **Acceptance criteria:**
  - Existe inventario de deuda con categorías:
    - architecture;
    - performance;
    - semantics;
    - DataWindow;
    - presentation;
    - testing;
    - docs;
    - AI;
    - build/release;
    - legacy.
  - Cada ítem tiene status: `Active`, `Backlog`, `Superseded`, `Deprecated`, `Blocked`, `Reference-only` o `Remove candidate`.
  - No se mantienen ítems duplicados sin relación explícita.
  - Los ítems de alto riesgo se convierten en specs; los menores se agrupan.
  - Docs indican dónde vive el inventario para no duplicarlo.
- **Implementation notes:**
  - No resolver toda la deuda en esta spec; inventariar y normalizar.
  - Evitar listas enormes sin prioridad.
- **Tests:**
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/backlog.md`
  - `docs/architecture-status.md`
  - `docs/current-focus.md` si aplica.
- **Dependencies:** ninguna dura.
- **Risk:** bajo-medio.
- **Exit criteria:**
  - Deuda técnica queda visible, categorizada y accionable.

---

## DEBT-DOCS-01 — Limpieza de documentación duplicada/obsoleta

- **Priority:** P1.
- **Status:** Open.
- **Area:** docs, cleanup, drift.
- **Problem:**
  - La documentación puede contener duplicación entre architecture map, status, backlog, current-focus, testing, AI docs, release docs y technical guide.
- **Goal:**
  - Normalizar documentación para que cada tema tenga una fuente primaria y el resto enlace.
- **Acceptance criteria:**
  - Se define source of truth para:
    - arquitectura actual;
    - estado de arquitectura;
    - backlog/specs;
    - current focus;
    - testing matrix;
    - performance budget;
    - AI orchestration;
    - release/build;
    - technical PowerBuilder guide.
  - Se eliminan o sustituyen duplicaciones claras por enlaces.
  - Referencias obsoletas a specs antiguas quedan marcadas como superseded/deprecated o retiradas.
  - No se modifica `technical guide` si está fuera de alcance explícito, salvo referencias mínimas necesarias.
  - `test:docs:drift` queda verde o con TODOs claros.
- **Implementation notes:**
  - No borrar contenido técnico único sin migrarlo.
  - Hacer cambios por batches pequeños.
  - Mantener `docs/architecture-implementation-map.md` como snapshot factual, no como backlog duplicado.
- **Tests:**
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
  - `docs/backlog.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
  - `docs/ai-orchestration.md`
  - `docs/release.md`
- **Dependencies:** `DEBT-INVENTORY-01` recomendado.
- **Risk:** medio; borrar duplicación sin migrar puede perder conocimiento.
- **Exit criteria:**
  - Docs quedan normalizadas, enlazadas y sin duplicaciones relevantes.

---

## DEBT-BACKLOG-01 — Normalización de backlog, superseded/deprecated/active

- **Priority:** P1.
- **Status:** Open.
- **Area:** backlog, process, cleanup.
- **Problem:**
  - Tras crear bloques nuevos, el backlog puede contener ítems antiguos activos que ahora están superseded o divididos.
- **Goal:**
  - Normalizar backlog para que no existan rutas paralelas contradictorias.
- **Acceptance criteria:**
  - Cada spec antigua relacionada con bloques 1–12 queda en uno de estos estados:
    - Active;
    - Superseded by `<new-id>`;
    - Deprecated;
    - Done;
    - Removed with reason.
  - Las specs nuevas tienen IDs consistentes y sin duplicados.
  - Current focus solo apunta a specs activas.
  - Done-log no se usa para ítems no cerrados.
  - Backlog no copia documentos completos si los bloques viven como archivos separados.
- **Implementation notes:**
  - Mantener trazabilidad de decisiones.
  - No cerrar specs por conveniencia; solo si acceptance criteria están cumplidos.
- **Tests:**
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/backlog.md`
  - `docs/current-focus.md`
  - `docs/done-log.md`
- **Dependencies:**
  - `DEBT-INVENTORY-01`
- **Risk:** medio.
- **Exit criteria:**
  - Backlog queda coherente y sin duplicidad de rutas.

---

## DEBT-PROMPTS-01 — Limpieza de prompts, agents, skills e instructions obsoletos

- **Priority:** P2.
- **Status:** Open.
- **Area:** AI, prompts, cleanup.
- **Problem:**
  - Prompts, agents, skills e instructions pueden quedar duplicados o desalineados después del Bloque 10.
- **Goal:**
  - Retirar o normalizar personalizaciones AI obsoletas.
- **Acceptance criteria:**
  - Prompts ejecutables usan `.prompt.md`.
  - Prompts obsoletos quedan `Deprecated` o se eliminan con replacement claro.
  - Agents duplicados se consolidan.
  - Skills no usadas quedan retiradas o marcadas como planned.
  - Instructions always-on no duplican prompts largos.
  - Docs AI contienen catálogo breve y actualizado.
- **Implementation notes:**
  - No borrar prompt histórico si aún no hay replacement equivalente.
  - Mantener compatibilidad con herramientas que lean `AGENTS.md`.
- **Tests:**
  - `npm run test:docs:drift`
- **Docs:**
  - `.github/prompts/*`
  - `.github/agents/*`
  - `.github/skills/*`
  - `.github/copilot-instructions.md`
  - `AGENTS.md`
  - `docs/ai-orchestration.md`
- **Dependencies:**
  - `AI-GOV-01`
  - `AI-DOCS-01`
- **Risk:** bajo-medio.
- **Exit criteria:**
  - Personalizaciones AI quedan lean, actuales y no duplicadas.

---

# FASE C — Limpieza de código, tests y configuración

## DEBT-CODE-01 — Dead code, unused exports y orphan modules audit

- **Priority:** P2.
- **Status:** Open.
- **Area:** code, cleanup, architecture.
- **Problem:**
  - Al extraer capas nuevas pueden quedar exports no usados, módulos huérfanos o código muerto.
- **Goal:**
  - Auditar y retirar código muerto de forma segura.
- **Acceptance criteria:**
  - Se detectan unused exports, orphan modules, dead branches y helpers sin consumers.
  - Cada removal tiene evidencia: no consumers, tests verdes y docs actualizadas si aplica.
  - No se borra código solo porque parezca antiguo si hay referencias dinámicas legítimas.
  - Se preservan fixtures/test helpers necesarios.
  - Si se detecta deuda grande, se crea spec separada.
- **Implementation notes:**
  - Usar tooling existente si existe; si no, empezar manualmente con reports pequeños.
  - Evitar borrar adapters legacy aún necesarios para compatibilidad.
- **Tests:**
  - `npm run compile`
  - `npm run test:unit`
  - `npm test`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/done-log.md` si se cierra una limpieza relevante.
- **Dependencies:**
  - `DEBT-INVENTORY-01`
- **Risk:** medio-alto.
- **Exit criteria:**
  - Código muerto relevante queda retirado o documentado como intentionally kept.

---

## DEBT-NAMING-01 — Naming/import/export normalization

- **Priority:** P3.
- **Status:** Open.
- **Area:** code, naming, maintainability.
- **Problem:**
  - Tras varios refactors pueden quedar nombres inconsistentes para services, adapters, ViewModels, facades y caches.
- **Goal:**
  - Normalizar naming e imports/exports sin cambiar comportamiento.
- **Acceptance criteria:**
  - Naming de services/adapters/ViewModels/facades sigue convenciones documentadas.
  - Exports públicos están claros; internals no se exportan innecesariamente.
  - No se crean barrel files que introduzcan ciclos.
  - Imports son explícitos y respetan boundaries.
  - Tests y compile quedan verdes.
- **Implementation notes:**
  - Hacer en batches pequeños.
  - Evitar renames grandes si no aportan claridad objetiva.
  - No mezclar con cambios semánticos.
- **Tests:**
  - `npm run compile`
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-status.md`
  - `docs/architecture-implementation-map.md`
- **Dependencies:**
  - `ARCH-MODULE-01`
  - `PRESENTATION-01` si afecta ViewModels.
- **Risk:** medio.
- **Exit criteria:**
  - Naming e imports quedan consistentes sin cambios funcionales.

---

## DEBT-CONFIG-01 — Config, scripts y package metadata cleanup

- **Priority:** P2.
- **Status:** Open.
- **Area:** config, scripts, package, cleanup.
- **Problem:**
  - Scripts de `package.json`, configs de test/build, VS Code settings y release metadata pueden quedar obsoletos o duplicados.
- **Goal:**
  - Normalizar configuración y scripts para que coincidan con test matrix, release lanes y docs.
- **Acceptance criteria:**
  - `package.json` scripts coinciden con `docs/testing.md` y `docs/release.md`.
  - Scripts obsoletos se retiran o marcan deprecated.
  - Configs de VS Code test, TypeScript, lint/test y packaging están documentadas.
  - package metadata para VSIX es coherente.
  - No se introducen scripts que publiquen o ejecuten externos sin guardrails.
- **Implementation notes:**
  - Leer scripts reales antes de documentar.
  - No añadir dependencias nuevas sin necesidad.
- **Tests:**
  - `npm run compile`
  - `npm run test:unit`
  - `npm run test:docs:drift`
  - release readiness lane si existe.
- **Docs:**
  - `docs/testing.md`
  - `docs/release.md`
  - `docs/developer-workflows.md`
- **Dependencies:**
  - `TEST-STRATEGY-01`
  - `RELEASE-01`
- **Risk:** medio.
- **Exit criteria:**
  - Scripts/configs reflejan la realidad y no contradicen docs.

---

## DEBT-TESTS-01 — Test cleanup: flakes, skips, obsolete fixtures y gaps

- **Priority:** P2.
- **Status:** Open.
- **Area:** testing, cleanup, reliability.
- **Problem:**
  - Tests pueden acumular skips obsoletos, fixtures antiguas, snapshots frágiles o flakes tolerados.
- **Goal:**
  - Limpiar deuda de tests sin reducir cobertura real.
- **Acceptance criteria:**
  - Skips tienen reason y owner.
  - Skips obsoletos se eliminan o se convierten en tests activos.
  - Fixtures obsoletas se retiran si no tienen consumers.
  - Snapshots frágiles se sustituyen por assertions estructurales cuando proceda.
  - Flaky tests se categorizan: fixed, quarantined with reason, or backlog.
  - Coverage gaps críticos se convierten en specs o tests.
- **Implementation notes:**
  - No borrar tests que cubren edge cases sin reemplazo.
  - Mantener corpora real opcional con skips honestos.
- **Tests:**
  - `npm run test:unit`
  - `npm test`
  - `npm run test:performance:gate`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/testing.md`
  - `docs/done-log.md` si aplica.
- **Dependencies:**
  - `TEST-STRATEGY-01`
- **Risk:** medio.
- **Exit criteria:**
  - Suite de tests queda más fiable, con skips justificados y sin fixtures muertas relevantes.

---

# FASE D — Pre-release cleanup y drift reforzado

## DEBT-RELEASE-01 — Pre-release cleanup checklist y removal receipts

- **Priority:** P2.
- **Status:** Open.
- **Area:** release, cleanup, governance.
- **Problem:**
  - Antes de empaquetar o publicar, se necesita evidencia de que la limpieza no dejó docs/código/config en estado inconsistente.
- **Goal:**
  - Definir checklist de limpieza previa a release y receipts de removals importantes.
- **Acceptance criteria:**
  - Checklist cubre:
    - backlog active/superseded coherente;
    - docs drift verde;
    - no imports legacy;
    - no TODO crítico sin backlog;
    - scripts release correctos;
    - no secrets/logs accidentalmente incluidos;
    - VSIX package contents sanity check.
  - Removals relevantes tienen receipt: qué se borró, por qué, tests ejecutados y rollback si aplica.
  - Checklist se enlaza desde release docs.
- **Implementation notes:**
  - No bloquear release por TODOs menores si están en backlog y no afectan usuario.
  - Mantener checklist corto y accionable.
- **Tests:**
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid`
  - release readiness lane.
- **Docs:**
  - `docs/release.md`
  - `docs/testing.md`
  - `docs/done-log.md`
- **Dependencies:**
  - `RELEASE-01`
  - `DEBT-BACKLOG-01`
- **Risk:** bajo-medio.
- **Exit criteria:**
  - Pre-release cleanup queda trazable y seguro.

---

## DEBT-DOCS-DRIFT-01 — Drift guard reforzado para docs/specs/prompts

- **Priority:** P1.
- **Status:** Open.
- **Area:** docs, drift, guards.
- **Problem:**
  - Con muchos bloques/specs/prompts/agents, `test:docs:drift` debe cubrir más que links básicos.
- **Goal:**
  - Reforzar drift guard para detectar inconsistencias críticas entre docs, specs, prompts, agents y backlog.
- **Acceptance criteria:**
  - Drift guard valida IDs de specs activas/superseded/deprecated cuando sea viable.
  - Drift guard valida que prompt files referenciados existen.
  - Drift guard valida que agents/skills referenciados existen o están marcados planned.
  - Drift guard valida que current-focus no apunta a specs removed/deprecated/done incorrectamente.
  - Drift guard valida que done-log referencia specs realmente cerradas.
  - Validaciones frágiles quedan como checklist manual documentado.
- **Implementation notes:**
  - Empezar por checks de IDs y existencia de archivos.
  - Evitar parseos Markdown demasiado frágiles.
  - Mantener mensajes de error accionables.
- **Tests:**
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/testing.md`
  - `docs/backlog.md`
  - `docs/current-focus.md`
  - `docs/done-log.md`
  - `docs/ai-orchestration.md`
- **Dependencies:**
  - `TEST-DOCS-01`
  - `AI-GOV-01`
- **Risk:** medio.
- **Exit criteria:**
  - Drift documental crítico queda más automatizado y accionable.

---

## Resultado esperado al cerrar el Bloque 12

Al cerrar este bloque deben cumplirse todas estas condiciones:

```text
1. `plugin_old` queda declarado reference-only y no runtime.
2. Imports desde `src/**` hacia `plugin_old/**` quedan bloqueados por guard.
3. Heurísticas legacy solo se extraen con evidence, owner moderno, tests y docs.
4. Existe inventario único de deuda técnica categorizada.
5. Docs quedan normalizadas con fuentes únicas de verdad y enlaces cruzados.
6. Backlog queda limpio: Active/Superseded/Deprecated/Done/Removed coherentes.
7. Prompts/agents/skills/instructions obsoletos quedan retirados o normalizados.
8. Dead code, unused exports y orphan modules quedan auditados y tratados.
9. Naming/import/export/config/scripts quedan coherentes con la arquitectura actual.
10. Tests quedan limpios de skips/flakes/fixtures obsoletas sin pérdida de cobertura.
11. Pre-release cleanup checklist y removal receipts quedan definidos.
12. Docs drift queda reforzado para specs/prompts/agents/backlog/current-focus/done-log.
```

---

## Current focus recomendado si se decide activar este bloque

```markdown
# Current Focus — Legacy Isolation, Technical Debt & Controlled Cleanup

## Scope

- LEGACY-POLICY-01
- LEGACY-GUARD-01
- DEBT-INVENTORY-01
- DEBT-DOCS-01
- DEBT-BACKLOG-01
- DEBT-DOCS-DRIFT-01

## Optional within same focus only if previous items are closed

- LEGACY-EXTRACT-01
- DEBT-PROMPTS-01
- DEBT-CODE-01
- DEBT-CONFIG-01

## Explicitly out of scope

- Big-bang refactor
- Parser rewrite
- KnowledgeBase rewrite
- DataWindow model rewrite
- Runtime imports from plugin_old
- Blind copy/paste from plugin_old
- Marketplace publish
- New feature implementation

## Exit criteria

- plugin_old is reference-only and guarded.
- Debt inventory exists.
- Backlog and docs are normalized.
- Docs drift covers critical references.
- No runtime architecture changes beyond safe guards/cleanup.
```

---