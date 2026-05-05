# BLOQUE 9 — Testing, Performance Gates & Regression Safety

> Objetivo: convertir las decisiones arquitectónicas y de rendimiento del plugin en contratos ejecutables. Este bloque refuerza unit tests, integration tests, smoke tests, performance gates, architecture fitness functions, docs drift, hot path guards, payload budgets, cache hit/miss tests, real-corpora validation y CI/local validation lanes.

---

## Base técnica y patrones aplicados

Este bloque se basa en los hallazgos de `docs/architecture-implementation-map.md` y en los bloques anteriores:

- Ya existen scripts y carriles de test como `npm run test:unit`, `npm test`, `npm run test:architecture:rapid`, `npm run test:architecture:metrics`, `npm run test:docs:drift`, `npm run test:performance:gate` y smoke/release lanes si están presentes.
- El proyecto usa Mocha/TDD style y VS Code test CLI o infraestructura compatible.
- Los Bloques 1–8 introducen contratos de serving, cache, ViewModels, SemanticQueryFacade, DataWindowFastContext, boundaries y architecture guards que deben quedar protegidos por tests.
- El riesgo principal no es solo romper una feature, sino reintroducir IO, workspace scan, full parse, payload grande, imports ilegales, duplicidad semántica, stale responses o drift documental.
- Algunas validaciones pueden depender de corpora reales como PFC/STD/workspaces grandes; cuando no estén presentes, debe existir skip honesto y no datos falsos.

Patrones externos aplicados:

- **VS Code extension integration testing:** las pruebas de extensión pueden ejecutarse en Extension Development Host con acceso a la VS Code API, y `@vscode/test-cli` proporciona un runner basado en Mocha y configuración `.vscode-test.js`.
- **CI para extensiones VS Code:** los tests de integración pueden ejecutarse en CI con `@vscode/test-electron`, incluyendo Linux con `xvfb` cuando haga falta.
- **Architecture fitness functions:** las reglas arquitectónicas deben automatizarse como health checks objetivos para detectar drift temprano.
- **Performance budget as contract:** los budgets de latencia, payload, memoria y hot path deben fallar o advertir de forma accionable.
- **Test pyramid pragmática:** unit tests para core, architecture tests para boundaries, integration/smoke para VS Code/LSP, performance gates para regresiones y real-corpora tests para confianza profesional.

---

## Dependencia de Bloques previos

Este bloque acompaña a todos los demás. Puede ejecutarse en paralelo, pero sus specs deben priorizar los contratos ya definidos en Bloques 1–8:

- Bloque 1: hot path, metrics, cache hit/miss, payload, stale guard.
- Bloque 2: HoverViewModel, HoverFastPath, negative cache.
- Bloque 3: Completion initial/resolve, ranking, payload.
- Bloque 4: SignatureHelp/Definition/Symbols/SemanticTokens alignment.
- Bloque 5: SemanticQueryFacade y resolver ownership.
- Bloque 6: DataWindow boundary/fast context.
- Bloque 7: ViewModels/formatters/presentation.
- Bloque 8: boundaries/composition roots/import guards.

---

## Estado de ítems anteriores

### Relacionados / consolidados

- `DEVTOOLS-PERF-07` queda absorbido y ampliado por `TEST-HOTPATH-01`, `TEST-HOTPATH-02` y `TEST-PERF-01`.
- `ARCH-GUARD-01` y `ARCH-GUARD-02` se refuerzan con `TEST-ARCH-01`, `TEST-ARCH-02` y `TEST-ARCH-03`.
- Cualquier spec de bloques anteriores que mencione tests debe enlazar con este bloque cuando requiera infraestructura común.

---

## Cadena recomendada — Bloque 9

Orden recomendado dentro del bloque:

1. `TEST-STRATEGY-01` — Test matrix canónica y lanes oficiales.
2. `TEST-HOTPATH-01` — Hot path harness con snapshot/cache caliente.
3. `TEST-HOTPATH-02` — No IO/no workspace scan/no full parse guards.
4. `TEST-PERF-01` — Performance gate para latency hit/miss y budgets.
5. `TEST-PAYLOAD-01` — Payload budget tests por feature LSP.
6. `TEST-CACHE-01` — Cache hit/miss/eviction/stale regression tests.
7. `TEST-ARCH-01` — Import boundaries y architecture fitness functions.
8. `TEST-ARCH-02` — Composition root growth y hotspot metrics.
9. `TEST-SEMANTIC-01` — Resolver owner regression tests.
10. `TEST-DW-01` — DataWindow boundary/fast mode regression tests.
11. `TEST-PRESENTATION-01` — ViewModel/formatter regression matrix.
12. `TEST-CORPORA-01` — Real corpora validation lane con skips honestos.
13. `TEST-CI-01` — CI/local validation parity.
14. `TEST-DOCS-01` — Docs drift y backlog/current-focus/done-log consistency.

---

# FASE A — Estrategia y hot path harness

## TEST-STRATEGY-01 — Test matrix canónica y lanes oficiales

- **Priority:** P1.
- **Status:** Open.
- **Area:** testing, strategy, docs, CI.
- **Problem:**
  - El backlog contiene muchas specs nuevas con tests esperados, pero falta una matriz canónica que indique qué lane valida qué riesgo.
  - Sin matriz, Copilot/agents pueden ejecutar scripts insuficientes o duplicar validaciones.
- **Goal:**
  - Definir la matriz oficial de test lanes para desarrollo local, CI, performance, arquitectura, docs y release.
- **Acceptance criteria:**
  - `docs/testing.md` define lanes oficiales:
    - unit;
    - integration/LSP;
    - VS Code extension tests;
    - architecture rapid;
    - architecture metrics;
    - docs drift;
    - performance gate;
    - smoke activation;
    - release verify;
    - real corpora optional lane.
  - Cada lane indica comando real de `package.json` o marca `missing` con backlog si no existe.
  - Cada lane documenta cuándo ejecutarse, coste aproximado y qué valida.
  - `docs/backlog.md` y `docs/current-focus.md` referencian la matriz sin duplicarla.
  - Los prompts/agentes deben usar la matriz antes de cerrar specs.
- **Implementation notes:**
  - No inventar scripts; leer `package.json`.
  - Si falta un script necesario, crear backlog o spec concreta.
  - Mantener una tabla de responsabilidad en docs, pero specs detalladas deben vivir en backlog.
- **Tests:**
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/testing.md`
  - `docs/backlog.md`
  - `docs/current-focus.md` si aplica.
- **Dependencies:** ninguna dura.
- **Risk:** bajo.
- **Exit criteria:**
  - Existe una matriz oficial de validación que guía a humanos y agentes.

---

## TEST-HOTPATH-01 — Hot path harness con snapshot/cache caliente

- **Priority:** P1.
- **Status:** Open.
- **Area:** testing, hot-path, performance.
- **Problem:**
  - Las specs de serving/hover/completion/signatureHelp requieren validar comportamiento con documento activo caliente, pero no basta con tests unitarios aislados.
- **Goal:**
  - Crear un harness reusable para simular hot path interactivo con snapshot/cache caliente.
- **Acceptance criteria:**
  - Existe test helper/harness para preparar documento abierto, analysisCache/DocumentCache/HotContextCache/ServingCache según aplique.
  - El harness permite ejecutar `hover`, `completion`, `signatureHelp`, `definition`, `documentSymbols`, `semanticTokens` y diagnostics incrementales en modo hot path.
  - El harness expone contadores/spies para IO, workspace scan, full parse, cache hit/miss, payload y stale discard.
  - El harness permite fixtures pequeñas y corpora opcionales.
  - Tests iniciales cubren al menos hover, completion y signatureHelp.
- **Implementation notes:**
  - Preferir helpers de test puros sobre mocks frágiles.
  - No depender de corpora pesada para tests básicos.
  - Si la arquitectura actual no permite inyectar spies, crear seams mínimos y seguros.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-HOTPATH-01`
  - `DEVTOOLS-HOTPATH-02`
- **Risk:** medio; un harness mal abstraído puede testear mocks y no comportamiento real.
- **Exit criteria:**
  - Existe infraestructura reusable para validar hot path caliente.

---

## TEST-HOTPATH-02 — No IO/no workspace scan/no full parse guards

- **Priority:** P1.
- **Status:** Open.
- **Area:** testing, hot-path, guards.
- **Problem:**
  - Cualquier refactor puede reintroducir IO, workspace scan o full parse en providers interactivos.
- **Goal:**
  - Convertir la regla no IO/no scan/no full parse en tests ejecutables por feature.
- **Acceptance criteria:**
  - Tests fallan si `hover`, `completion` o `signatureHelp` hacen IO en hot path caliente.
  - Tests fallan si esos providers disparan workspace scan no autorizado.
  - Tests fallan si esos providers fuerzan full parse con snapshot/cache caliente.
  - Definition, documentSymbols, semanticTokens y diagnostics incrementales tienen tests o excepciones documentadas.
  - Cold path permitido queda separado de hot path prohibido.
- **Implementation notes:**
  - Usar spies sobre filesystem/workspace discovery/analyzeDocument si es viable.
  - No bloquear inicialización/cold indexing legítimo.
  - Si una feature necesita excepción, debe tener reason y budget.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/testing.md`
  - `docs/performance-budget.md`
  - `docs/architecture-implementation-map.md`
- **Dependencies:** `TEST-HOTPATH-01`.
- **Risk:** medio; guards demasiado rígidos pueden impedir refactors seguros.
- **Exit criteria:**
  - El repo protege automáticamente el hot path interactivo frente a IO/scan/parse accidental.

---

# FASE B — Performance, payload y caché

## TEST-PERF-01 — Performance gate para latency hit/miss y budgets

- **Priority:** P1.
- **Status:** Open.
- **Area:** performance, latency, gates.
- **Problem:**
  - Las mejoras de rendimiento deben medirse de forma estable y separando cache hit, cache miss, formatter, provider y payload.
- **Goal:**
  - Crear o endurecer `test:performance:gate` para validar latencias y budgets por feature.
- **Acceptance criteria:**
  - Gate mide latencia de `hover`, `completion`, `signatureHelp`, `definition`, `documentSymbols` y `semanticTokens` donde aplique.
  - Distingue `cache-hit`, `cache-miss`, `viewmodel-hit`, `negative-hit`, `resolve-hit/miss` si aplica.
  - Usa fixtures pequeñas y deterministas para CI/local.
  - Usa thresholds documentados y tolerantes a ruido razonable.
  - Si un threshold se supera, el fallo muestra feature, scenario, budget y valor medido.
  - No depende de corpora real obligatoria.
- **Implementation notes:**
  - Evitar assertions de tiempo demasiado estrictas en máquinas variables.
  - Preferir ratios/regression thresholds y contadores estructurales cuando sea posible.
  - Integrar con runtime stats del Bloque 1.
- **Tests:**
  - `npm run test:performance:gate`
  - `npm run test:unit`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/performance-budget.md`
  - `docs/testing.md`
- **Dependencies:**
  - `DEVTOOLS-HOTPATH-01`
  - `TEST-HOTPATH-01`
- **Risk:** medio-alto; gates de tiempo mal calibrados pueden ser flaky.
- **Exit criteria:**
  - Performance gate detecta regresiones accionables sin ser flaky.

---

## TEST-PAYLOAD-01 — Payload budget tests por feature LSP

- **Priority:** P2.
- **Status:** Open.
- **Area:** testing, payload, LSP.
- **Problem:**
  - Payload grande puede degradar latencia LSP aunque el cálculo sea rápido.
- **Goal:**
  - Validar budgets de payload para respuestas LSP críticas.
- **Acceptance criteria:**
  - Tests miden payload aproximado para:
    - hover;
    - completion initial;
    - completion resolve;
    - signatureHelp;
    - references;
    - documentSymbols;
    - semanticTokens;
    - diagnostics si aplica.
  - Completion initial y completion resolve tienen budgets separados.
  - Tests evitan stringify profundo en hot path productivo; la medición puede ser test-only si es necesario.
  - Failures muestran feature, scenario, budget y payload estimado.
  - `docs/performance-budget.md` queda alineado.
- **Implementation notes:**
  - Para producción, usar estimación barata; para tests, se puede serializar controladamente.
  - No validar payload con snapshots completos si basta con tamaño/estructura.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/performance-budget.md`
  - `docs/testing.md`
- **Dependencies:**
  - `DEVTOOLS-HOTPATH-04`
  - `PRESENTATION-03`
- **Risk:** medio.
- **Exit criteria:**
  - Payload LSP queda presupuestado y testeado por feature.

---

## TEST-CACHE-01 — Cache hit/miss/eviction/stale regression tests

- **Priority:** P1.
- **Status:** Open.
- **Area:** testing, cache, serving.
- **Problem:**
  - ServingCache, ViewModel caches, negative cache, CompletionListViewModel cache y ActiveDocumentServingSnapshot requieren tests de hit/miss/invalidation/eviction/stale.
- **Goal:**
  - Crear matriz de regresión de cachés interactivas.
- **Acceptance criteria:**
  - Tests cubren `ServingCache` hit/miss/eviction por feature.
  - Tests cubren `HoverViewModel cache` si existe.
  - Tests cubren `NegativeHoverCache` si existe.
  - Tests cubren `CompletionListViewModel cache` si existe.
  - Tests cubren invalidación por URI, documentVersion, `semanticEpoch/kbVersion`, sourceOrigin, locale y pressure policy.
  - Tests cubren stale write prevention.
  - Tests verifican que completion no expulsa hover caliente indiscriminadamente si existe partition/router.
- **Implementation notes:**
  - Mantener test data pequeña.
  - Separar tests de cache unitarios de tests integrados hot path.
  - Evitar acoplar tests a implementación interna cuando haya contrato público suficiente.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/testing.md`
  - `docs/performance-budget.md`
  - `docs/architecture-implementation-map.md`
- **Dependencies:**
  - `DEVTOOLS-SERVING-02`
  - `DEVTOOLS-SERVING-04`
- **Risk:** medio.
- **Exit criteria:**
  - Caches críticas tienen regresión de hit/miss/invalidation/eviction/stale.

---

# FASE C — Arquitectura y semántica

## TEST-ARCH-01 — Import boundaries y architecture fitness functions

- **Priority:** P1.
- **Status:** Open.
- **Area:** architecture, fitness-functions, imports.
- **Problem:**
  - Boundaries arquitectónicas deben ejecutarse como tests, no solo documentarse.
- **Goal:**
  - Consolidar fitness functions de imports, layers y ownership.
- **Acceptance criteria:**
  - Tests cubren boundaries client/server/shared.
  - Tests cubren no imports `src/**` → `plugin_old/**` o enlazan al bloque legacy si se ejecuta allí.
  - Tests cubren que presentation no importa parser/KnowledgeBase directamente.
  - Tests cubren que DataWindow no usa parser PowerScript general.
  - Tests cubren que providers no importan internals de otros providers cuando exista owner/facade.
  - Allowlist de excepciones existe, es mínima y documentada.
- **Implementation notes:**
  - Reutilizar architecture import test existente si lo hay.
  - Evitar reglas que dependan de naming frágil si hay alternativa por path/layer.
- **Tests:**
  - `npm run test:architecture:rapid`
  - `npm run test:architecture:metrics`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/testing.md`
  - `docs/architecture-status.md`
  - `docs/architecture-implementation-map.md`
- **Dependencies:**
  - `ARCH-BOUNDARY-01`
  - `ARCH-GUARD-01`
- **Risk:** medio.
- **Exit criteria:**
  - Las reglas arquitectónicas críticas tienen feedback automático.

---

## TEST-ARCH-02 — Composition root growth y hotspot metrics

- **Priority:** P2.
- **Status:** Open.
- **Area:** architecture, metrics, maintainability.
- **Problem:**
  - `extension.ts`, `server.ts`, `featureHandlers.ts` y otros hotspots pueden volver a crecer sin control.
- **Goal:**
  - Monitorizar crecimiento, complejidad, import count y concentración de ownership.
- **Acceptance criteria:**
  - Metrics report incluye tamaño, import count, dependency fan-in/fan-out o indicadores equivalentes para hotspots.
  - Hotspots iniciales incluyen `extension.ts`, `server.ts`, `featureHandlers.ts`, `completion.ts`, `hover.ts`, `signatureHelp.ts`, `definition.ts`, DataWindow modules y diagnostics.
  - Los thresholds son documentados y ajustables.
  - El reporte distingue fail/warn/info según severidad.
  - Docs explican cómo actuar ante cada warning.
- **Implementation notes:**
  - Reutilizar `test:architecture:metrics` si existe.
  - No bloquear por tamaño absoluto sin contexto; usar trends o thresholds razonables.
- **Tests:**
  - `npm run test:architecture:metrics`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/testing.md`
  - `docs/architecture-status.md`
- **Dependencies:**
  - `ARCH-GUARD-02`
- **Risk:** bajo-medio.
- **Exit criteria:**
  - Hotspots arquitectónicos quedan monitorizados con salida accionable.

---

## TEST-SEMANTIC-01 — Resolver owner regression tests

- **Priority:** P2.
- **Status:** Open.
- **Area:** testing, semantics, resolver-ownership.
- **Problem:**
  - Al consolidar owners semánticos, se necesita demostrar que hover/completion/signatureHelp/definition/diagnostics siguen resolviendo igual o mejor.
- **Goal:**
  - Crear matriz de regresión para owners semánticos y consumers.
- **Acceptance criteria:**
  - Tests cubren scope/context, symbol resolution, receiver type, callable resolution, inheritance traversal, enum context y confidence/reason codes.
  - Tests cubren al menos un consumer visible por owner.
  - Tests verifican que providers consumen owner/facade y no fallback duplicado cuando aplique.
  - Tests cubren high-confidence, ambiguous, unknown y sourceOrigin restrictions.
- **Implementation notes:**
  - Separar tests de owner puro y tests de feature consumer.
  - Mantener fixtures realistas pero pequeñas.
- **Tests:**
  - `npm run test:unit`
  - `npm test`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/testing.md`
  - `docs/architecture-implementation-map.md`
- **Dependencies:**
  - `SEMANTIC-FACADE-01`
  - `SEMANTIC-OWNER-07`
- **Risk:** medio-alto.
- **Exit criteria:**
  - Owner consolidation queda protegida por regressions semánticas.

---

## TEST-DW-01 — DataWindow boundary/fast mode regression tests

- **Priority:** P1.
- **Status:** Open.
- **Area:** testing, datawindow, boundary.
- **Problem:**
  - DataWindow fast mode y boundary son zonas de alto riesgo por falsos positivos, dinámicos y `.srd`.
- **Goal:**
  - Proteger DataWindow boundary, binding, fast context y adapters con tests específicos.
- **Acceptance criteria:**
  - Tests verifican que `.srd` no se parsea como PowerScript genérico.
  - Tests cubren DataWindow, DataStore, DataWindowChild.
  - Tests cubren DataObject literal, dynamic/unknown binding, columns, property paths, buffers y Describe/Modify policy.
  - Tests cubren hover/completion/definition/signatureHelp adapters si existen.
  - Tests cubren no IO/no scan/no full parse en hot path.
- **Implementation notes:**
  - Reutilizar fixtures pequeñas y específicas.
  - No simular datos como reales si se necesitan corpora.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/testing.md`
  - `docs/architecture-implementation-map.md`
  - `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- **Dependencies:**
  - `DW-BOUNDARY-01`
  - `DW-FAST-01`
  - `DW-FAST-02`
- **Risk:** medio.
- **Exit criteria:**
  - DataWindow queda cubierto por regresión específica y frontera ejecutable.

---

# FASE D — Presentación, corpora, CI y docs

## TEST-PRESENTATION-01 — ViewModel/formatter regression matrix

- **Priority:** P2.
- **Status:** Open.
- **Area:** testing, presentation, UX.
- **Problem:**
  - ViewModels/formatters pueden cambiar UX visible sin romper semántica.
- **Goal:**
  - Proteger presentation contracts mediante assertions estructurales y snapshot policy.
- **Acceptance criteria:**
  - Tests cubren HoverViewModel, CompletionListViewModel, CompletionResolveViewModel, SignatureHelpViewModel y DiagnosticMessageViewModel.
  - Tests validan bloques esenciales, no snapshots frágiles de Markdown completo salvo casos justificados.
  - Tests validan locale/fallback y no traducción de nombres reales.
  - Tests validan compact rendering y payload budget.
- **Implementation notes:**
  - Separar model tests y LSP formatter tests.
  - Mantener snapshots bajo control y con reason para updates.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `PRESENTATION-01`
  - `PRESENTATION-02`
  - `PRESENTATION-07`
- **Risk:** medio.
- **Exit criteria:**
  - UX/presentation contracts quedan protegidos por tests mantenibles.

---

## TEST-CORPORA-01 — Real corpora validation lane con skips honestos

- **Priority:** P2.
- **Status:** Open.
- **Area:** testing, real-corpora, validation.
- **Problem:**
  - El plugin debe funcionar con corpora reales PowerBuilder, pero no todos los entornos tendrán PFC/STD/workspaces grandes disponibles.
- **Goal:**
  - Crear lane opcional para validar corpora reales con skips honestos y sin datos simulados falsos.
- **Acceptance criteria:**
  - Existe documentación para configurar corpora reales locales.
  - Tests detectan ausencia de corpora y hacen skip explícito con motivo.
  - No se inventan resultados ni métricas falsas.
  - Lane valida discovery/indexing, ancestors, DataWindow, catalog, hover/completion básicos y performance smoke.
  - Results o artifacts quedan resumidos de forma accionable.
- **Implementation notes:**
  - No hacer corpora obligatoria en CI básica.
  - Si se usa corpus externo, no commitear código propietario.
  - Mantener fixtures mini dentro del repo para tests deterministas.
- **Tests:**
  - `npm run test:real-corpora` si existe o crear backlog para script.
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/testing.md`
  - `docs/developer-workflows.md`
  - `docs/performance-budget.md`
- **Dependencies:** ninguna dura.
- **Risk:** medio.
- **Exit criteria:**
  - Existe lane real-corpora opcional, honesta y reproducible localmente.

---

## TEST-CI-01 — CI/local validation parity

- **Priority:** P2.
- **Status:** Open.
- **Area:** CI, testing, validation.
- **Problem:**
  - Los comandos locales y CI pueden divergir, dejando gaps entre validación de agentes y validación real.
- **Goal:**
  - Alinear los scripts locales recomendados con los jobs CI existentes o documentar la ausencia de CI.
- **Acceptance criteria:**
  - `package.json` lista scripts canónicos y docs explican equivalencia local/CI.
  - CI ejecuta al menos compile, unit, architecture rapid, docs drift y smoke/release según disponibilidad.
  - Si CI no existe, backlog documenta decisión y plan mínimo.
  - Linux headless VS Code tests usan configuración apropiada si aplica.
  - Failure output es accionable para agentes.
- **Implementation notes:**
  - No inventar workflows si el repo aún no los quiere; documentar estado real.
  - Si se añade CI, hacerlo mínimo y seguro.
- **Tests:**
  - `npm run compile`
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
  - `npm test` si aplica.
- **Docs:**
  - `docs/testing.md`
  - `docs/developer-workflows.md`
  - `docs/architecture-status.md`
- **Dependencies:** `TEST-STRATEGY-01`.
- **Risk:** medio.
- **Exit criteria:**
  - Validación local y CI quedan alineadas o la brecha queda documentada con plan.

---

## TEST-DOCS-01 — Docs drift y backlog/current-focus/done-log consistency

- **Priority:** P1.
- **Status:** Open.
- **Area:** docs, drift, process.
- **Problem:**
  - El proyecto depende de documentación arquitectónica y backlog para coordinar humanos/agentes; drift documental puede causar implementaciones erróneas.
- **Goal:**
  - Endurecer validación documental entre backlog, current-focus, roadmap, done-log, architecture map/status y testing docs.
- **Acceptance criteria:**
  - `test:docs:drift` verifica referencias a specs existentes, estados, current-focus y done-log donde sea viable.
  - Specs `Done` tienen entrada en done-log.
  - Backlog no contiene ítems activos duplicados o superseded sin referencia.
  - Current-focus no promueve specs inexistentes o cerradas.
  - Architecture map/status no contradicen backlog activo.
  - Si una verificación no puede automatizarse, docs indican checklist manual.
- **Implementation notes:**
  - Mantener validación incremental; no intentar parsear Markdown con heurísticas demasiado frágiles.
  - Empezar por IDs, estados y referencias cruzadas.
- **Tests:**
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/testing.md`
  - `docs/backlog.md`
  - `docs/current-focus.md`
  - `docs/done-log.md`
  - `docs/architecture-status.md`
- **Dependencies:** ninguna dura.
- **Risk:** bajo-medio.
- **Exit criteria:**
  - Drift documental crítico queda detectado automáticamente o por checklist explícito.

---

## Resultado esperado al cerrar el Bloque 9

Al cerrar este bloque deben cumplirse todas estas condiciones:

```text
1. Existe matriz oficial de test lanes y comandos reales.
2. Hot path tiene harness reusable con snapshot/cache caliente.
3. No IO/no workspace scan/no full parse queda cubierto por guards ejecutables.
4. Performance gate mide latency hit/miss y budgets sin ser flaky.
5. Payload budgets se validan por feature LSP.
6. Caches críticas tienen tests de hit/miss/eviction/stale/invalidation.
7. Architecture fitness functions protegen imports, boundaries y ownership.
8. Hotspots y composition roots tienen métricas accionables.
9. Resolver owners, DataWindow y presentation tienen regression matrices.
10. Real corpora lane existe o queda documentado con skips honestos.
11. CI/local validation parity queda alineado o documentado.
12. Docs drift cubre backlog/current-focus/done-log/architecture/testing.
```

---

## Current focus recomendado si se decide activar este bloque

```markdown
# Current Focus — Testing, Performance Gates & Regression Safety

## Scope

- TEST-STRATEGY-01
- TEST-HOTPATH-01
- TEST-HOTPATH-02
- TEST-PERF-01
- TEST-DOCS-01

## Optional within same focus only if previous items are closed

- TEST-PAYLOAD-01
- TEST-CACHE-01
- TEST-ARCH-01

## Explicitly out of scope

- Large semantic refactor
- DataWindowFastContext implementation
- New features
- New AI tools
- CI publishing automation unless explicitly requested
- Real corpora as mandatory CI dependency

## Exit criteria

- Test matrix exists.
- Hot path guards are executable.
- Performance/payload/cache gates are defined or planned.
- Docs drift protects backlog/current-focus/done-log.
```

---
