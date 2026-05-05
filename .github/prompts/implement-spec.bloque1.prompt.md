# BLOQUE 1 — DevTools Ultra-Fast Serving & Cache Layer

> Objetivo: construir una capa de serving interactivo ultrarrápida, medible, modular y mantenible para `hover`, `completion`, `signatureHelp`, `definition`, `documentSymbols`, `semanticTokens` y diagnostics incrementales, sin reescribir la arquitectura global ni crear un segundo motor semántico.

---

## Base técnica y patrones aplicados

Este bloque se basa en los hallazgos de `docs/architecture-implementation-map.md`:

- El cliente VS Code ya es fino y el servidor LSP es el runtime principal.
- El hot path interactivo pasa por `featureHandlers.ts`, `ServingCache`, `HotContextCache`, `KnowledgeBase`, `SystemCatalog` y providers como `hover.ts`, `completion.ts` y `signatureHelp.ts`.
- `ServingCache` ya existe, pero es una LRU compartida para varias features.
- Faltan caches específicas de presentación como `HoverViewModel cache` y `CompletionListViewModel cache`.
- `ActiveDocumentServingSnapshot` está solo parcialmente cubierto por `HotContextCache`, `DocumentCache` y `analysisCache`.
- `completionItem/resolve` no existe todavía.
- Falta una separación estable entre `cache-hit`, `cache-miss`, formatter, payload y readiness.

Patrones externos aplicados:

- **Language Server como runtime de análisis:** el trabajo pesado de parsing, AST e indexación debe vivir en el servidor de lenguaje, no en el Extension Host.
- **Completion inicial ligera + resolve diferido:** documentación y detalle caro deben moverse a `completionItem/resolve` cuando sea seguro.
- **Incrementalidad por snapshots/queries:** usar datos derivados cacheados e invalidación selectiva, evitando recomputar todo.
- **Serving layer modular:** handlers como adapters, pipeline común para budget/readiness/metrics/cache/stale guard y providers como builders específicos.

---

## Cadena recomendada — Bloque 1

Orden obligatorio dentro del bloque:

1. `DEVTOOLS-HOTPATH-01` — Observabilidad real de serving interactivo.
2. `DEVTOOLS-HOTPATH-02` — Guards no IO/no workspace scan/no full parse.
3. `DEVTOOLS-HOTPATH-03` — Stale request / cancellation guard.
4. `DEVTOOLS-HOTPATH-04` — LSP payload budget gate.
5. `DEVTOOLS-SERVING-01` — InteractiveServingPipeline modular.
6. `DEVTOOLS-SERVING-02` — ServingCacheRouter con particiones por feature.
7. `DEVTOOLS-SERVING-03` — ActiveDocumentServingSnapshot read-only.
8. `DEVTOOLS-SERVING-04` — ViewModel cache key contract.

---

# FASE A — Medición y guardrails

## DEVTOOLS-HOTPATH-01 — Observabilidad real de serving interactivo

- **Priority:** P1.
- **Status:** Open.
- **Area:** performance, runtime, interactive-serving, observability.
- **Problem:**
  - `hover`, `completion` y `signatureHelp` se perciben lentos, pero falta evidencia estable por feature, `cache-hit`, `cache-miss`, provider, formatter, payload y readiness.
  - El runtime ya tiene journal/stats, pero no expone una lectura suficientemente defendible para separar coste de hit, miss, formatter y payload en las features interactivas principales.
- **Goal:**
  - Medir latencia real del serving interactivo sin introducir coste apreciable en hot path.
- **Acceptance criteria:**
  - Registra, como mínimo: `feature`, `cache-hit/cache-miss`, `totalMs`, `providerMs`, `formatterMs` cuando aplique, `cacheWriteMs`, `payloadBytes`, `locale`, `kbVersion/semanticEpoch`, `budgetMs` y decisión de readiness/degradation.
  - Distingue `hover`, `completion` y `signatureHelp` de forma independiente.
  - No introduce IO, serialización masiva, stringify de objetos grandes ni logging ruidoso en hot path.
  - Los datos son visibles mediante runtime journal/stats, artifact local o comando read-only existente.
  - La instrumentación es read-only y configurable si procede.
  - La documentación canónica queda alineada.
- **Implementation notes:**
  - Preferir mediciones por fase en `featureHandlers.ts` o en una función común de wrapping.
  - No duplicar métricas en cada provider si puede existir un wrapper común.
  - El cálculo de `payloadBytes` debe ser aproximado y barato; no debe forzar stringify profundo de estructuras grandes.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:** ninguna.
- **Risk:** medio; una medición mal implementada puede introducir ruido, sesgo de latencia o payload extra.
- **Exit criteria:**
  - Hay evidencia real de hit/miss y coste por feature.
  - Puede decidirse si el siguiente coste dominante está en cache miss, formatter, payload, readiness o eviction.

---

## DEVTOOLS-HOTPATH-02 — Guards no IO/no workspace scan/no full parse en providers interactivos

- **Priority:** P1.
- **Status:** Open.
- **Area:** testing, performance, interactive-serving, architecture-guards.
- **Problem:**
  - El mapa confirma que los providers interactivos dependen de snapshots y caches calientes, pero faltan guards explícitos que fallen si alguien introduce IO, workspace scan o full parse accidental en hot path.
- **Goal:**
  - Blindar `hover`, `completion`, `signatureHelp`, `definition`, `documentSymbols`, `semanticTokens` y diagnostics incrementales.
- **Acceptance criteria:**
  - Existen tests que validan que, con snapshot/cache caliente, los providers interactivos no hacen IO de filesystem.
  - Existen tests que validan que no se ensancha a workspace scan.
  - Existen tests que validan que no se fuerza full parse cuando `analysisCache`, `DocumentCache` o snapshot ya está caliente.
  - Los tests distinguen explícitamente entre cold path permitido y hot path prohibido.
  - Los tests cubren al menos `hover`, `completion` y `signatureHelp`.
  - Si `documentSymbols`, `semanticTokens` o diagnostics requieren excepciones, quedan documentadas con evidencia.
- **Implementation notes:**
  - Usar spies/mocks sobre filesystem, discovery/workspace scan y `analyzeDocument()` cuando sea viable.
  - Evitar tests frágiles que dependan de tiempos exactos; preferir contratos estructurales y contadores.
  - No bloquear cold path legítimo de apertura/reindexación.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:** `DEVTOOLS-HOTPATH-01`.
- **Risk:** medio; guards demasiado rígidos pueden bloquear refactors seguros o cold paths legítimos.
- **Exit criteria:**
  - El repo falla si una feature interactiva reintroduce IO, workspace scan o full parse en cache caliente.

---

## DEVTOOLS-HOTPATH-03 — Stale request / cancellation guard para serving interactivo

- **Priority:** P2.
- **Status:** Open.
- **Area:** performance, LSP, interactive-serving, cancellation.
- **Problem:**
  - Varias features interactivas no usan cancellation token de forma explícita y pueden completar trabajo obsoleto si cambia documento, posición, locale o `semanticEpoch` durante la request.
- **Goal:**
  - Evitar respuestas stale y escrituras obsoletas en caché.
- **Acceptance criteria:**
  - `hover`, `completion` y `signatureHelp` verifican stale state antes de responder y antes de escribir en caché.
  - Si existe cancellation token accesible desde el handler LSP, se respeta.
  - Si no hay token disponible, existe guard por request sequence, URI, documentVersion, locale y `kbVersion/semanticEpoch`.
  - Un resultado obsoleto no sobrescribe una entrada más nueva de caché.
  - No introduce locks pesados, IO ni esperas bloqueantes.
- **Implementation notes:**
  - Mantener el guard en la pipeline común, no replicarlo por provider.
  - Si LSP cancellation no está disponible en todos los handlers, usar `staleGuard` interno con epoch/version.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/performance-budget.md`
  - `docs/testing.md`
- **Dependencies:** `DEVTOOLS-HOTPATH-01`.
- **Risk:** medio; un stale guard demasiado agresivo puede descartar resultados válidos o reducir hit ratio.
- **Exit criteria:**
  - Cambios rápidos de documento/KB no dejan respuestas stale ni entradas obsoletas en caches interactivas.

---

## DEVTOOLS-HOTPATH-04 — LSP payload budget gate

- **Priority:** P2.
- **Status:** Open.
- **Area:** performance, payload, LSP, serialization.
- **Problem:**
  - La latencia percibida no depende solo del cálculo; también depende del tamaño del payload serializado en respuestas LSP.
  - `completion` tiene `resultCap = 200` y hoy no tiene `completionItem/resolve`, lo que eleva el riesgo de payload inicial grande.
- **Goal:**
  - Medir y limitar payloads de `hover`, `completion`, `signatureHelp`, `references`, `semanticTokens` y `documentSymbols`.
- **Acceptance criteria:**
  - Se registra `payloadBytes` aproximado por feature.
  - Existen thresholds documentados por feature.
  - `completion` inicial y futuro `completionItem/resolve` tienen budgets separados.
  - `references` y `semanticTokens` mantienen caps visibles y defendibles.
  - Tests o gates fallan ante payloads descontrolados en escenarios representativos.
  - No se introduce stringify profundo en hot path para medir tamaño.
- **Implementation notes:**
  - Para medición, preferir estimaciones baratas por campos principales o serialización controlada bajo flag/test.
  - El gate debe ser suficientemente flexible para corpora ausentes y skips honestos.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
- **Docs:**
  - `docs/performance-budget.md`
  - `docs/testing.md`
  - `docs/architecture-implementation-map.md`
- **Dependencies:** `DEVTOOLS-HOTPATH-01`.
- **Risk:** medio; un threshold mal calibrado puede ocultar problemas reales o fallar con fixtures válidas.
- **Exit criteria:**
  - Hay budget documentado y verificable de payload para features interactivas críticas.

---

# FASE B — Capa base de serving ultrarrápido

## DEVTOOLS-SERVING-01 — InteractiveServingPipeline modular

- **Priority:** P1.
- **Status:** Open.
- **Area:** architecture, serving, performance, maintainability.
- **Problem:**
  - El flujo interactivo está repartido entre handlers, `ServingCache`, providers, readiness y formatters.
  - `featureHandlers.ts` concentra policy wiring, hit/miss, métricas y llamadas a providers.
- **Goal:**
  - Crear una pipeline común, modular y ligera para features interactivas.
- **Acceptance criteria:**
  - Existe `InteractiveServingPipeline` o equivalente.
  - Centraliza budget, readiness, stale guard, metrics, cache lookup/write y result metadata.
  - No contiene lógica semántica específica de `hover`, `completion` o `signatureHelp`.
  - Providers quedan como builders/adapters específicos.
  - El cambio es incremental y mantiene compatibilidad con handlers existentes.
  - No crea un segundo motor semántico ni un segundo KnowledgeBase.
  - Permite registrar fases y payload sin duplicar código por feature.
- **Implementation notes:**
  - Diseñar como wrapper común alrededor de los providers existentes.
  - Mantener el routing LSP actual; no hacer big-bang refactor de `featureHandlers.ts`.
  - La pipeline debe permitir feature-specific extra keys y feature-specific admission policy.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:performance:gate`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-HOTPATH-01`
  - `DEVTOOLS-HOTPATH-02`
- **Risk:** alto; una pipeline mal diseñada puede convertirse en una nueva composition root o duplicar lógica semántica.
- **Exit criteria:**
  - `hover`, `completion` y `signatureHelp` pueden pasar por la pipeline común sin cambiar su semántica visible.

---

## DEVTOOLS-SERVING-02 — ServingCacheRouter con particiones por feature

- **Priority:** P2.
- **Status:** Open.
- **Area:** serving-cache, memory, performance, pressure-policy.
- **Problem:**
  - `ServingCache` es una LRU compartida. Listas grandes de `completion` pueden expulsar entradas calientes de `hover`, `signatureHelp` o `definition`.
- **Goal:**
  - Evitar evictions cruzadas dañinas mediante partición por feature, weighted admission, caps por feature o política equivalente.
- **Acceptance criteria:**
  - Existe `ServingCacheRouter`, partición por feature o política equivalente.
  - Runtime stats muestran hit, miss y eviction por feature.
  - Pressure policy puede purgar selectivamente por feature o por clase de entrada.
  - La política protege `hover` y `signatureHelp` frente a listas grandes de `completion`.
  - Se documenta explícitamente si se eligió partición, weighted admission, caps por feature o LRU única reforzada.
  - No duplica payload ni aumenta memoria sin control.
- **Implementation notes:**
  - No eliminar `ServingCache` actual si se puede envolver.
  - Preferir wrapper/router incremental sobre rewrite completo.
  - Mantener compatibilidad con persistencia de serving cache si aplica.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/performance-budget.md`
  - `docs/testing.md`
- **Dependencies:**
  - `DEVTOOLS-HOTPATH-01`
  - `DEVTOOLS-SERVING-01`
- **Risk:** medio-alto; particionar mal puede fragmentar memoria o reducir hit ratio global.
- **Exit criteria:**
  - Hay evidencia de eviction/hit/miss por feature y una política clara para proteger entradas calientes.

---

## DEVTOOLS-SERVING-03 — ActiveDocumentServingSnapshot read-only

- **Priority:** P2.
- **Status:** Open.
- **Area:** architecture, performance, active-document, semantic-query.
- **Problem:**
  - El contexto interactivo del documento activo está repartido entre `analysisCache`, `DocumentCache`, `HotContextCache` y `ServingCache`.
  - Varias features recomponen partes del mismo contexto activo.
- **Goal:**
  - Crear una fachada read-only de contexto interactivo del documento activo sin duplicar semántica.
- **Acceptance criteria:**
  - Existe `ActiveDocumentServingSnapshot` o equivalente.
  - Es estrictamente read-only.
  - No copia, no reinterpreta y no publica verdad semántica global.
  - Se apoya en `DocumentCache`, `analysisCache`, `HotContextCache`, `KnowledgeBase`, `SystemCatalog` y `DataWindowModel`.
  - Expone token/scope/symbol/receiver/binding/hot members como vistas derivadas.
  - Invalida por URI, documentVersion, sourceOrigin, locale cuando aplique y `kbVersion/semanticEpoch`.
  - Documenta explícitamente qué cubre y qué no cubre.
  - No bloquea futuras mejoras de DataWindowFastContext ni ViewModel caches.
- **Implementation notes:**
  - Debe ser facade/composición, no store nuevo.
  - Evitar duplicar mapas de símbolos globales.
  - Si un dato no está listo, devolver `unknown/partial` en vez de forzar recomputación cara.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-HOTPATH-01`
  - `DEVTOOLS-HOTPATH-02`
  - `DEVTOOLS-SERVING-01`
- **Risk:** alto; si se convierte en un segundo store semántico, romperá la fuente única de verdad e invalidación fina.
- **Exit criteria:**
  - Las features interactivas tienen una vista común del activo sin ownership semántico nuevo.

---

## DEVTOOLS-SERVING-04 — ViewModel cache key contract

- **Priority:** P2.
- **Status:** Open.
- **Area:** architecture, cache, invalidation, presentation.
- **Problem:**
  - Las futuras caches de presentación (`HoverViewModel`, `CompletionListViewModel`, `SignatureHelpViewModel`, negative cache) pueden divergir si cada feature define keys e invalidación por su cuenta.
- **Goal:**
  - Definir contrato común de keys e invalidación para caches de presentación y serving interactivo.
- **Acceptance criteria:**
  - Existe contrato común para keys de ViewModel caches y negative caches.
  - El contrato incluye, como mínimo: URI, documentVersion, `kbVersion/semanticEpoch`, sourceOrigin, locale, feature, position/range/context y trigger/prefix cuando aplique.
  - Documenta qué campos son obligatorios y cuáles son feature-specific.
  - Documenta cómo interactúa con `ServingCacheRouter` y `ActiveDocumentServingSnapshot`.
  - Tests cubren invalidación por documento, epoch, locale, sourceOrigin y pressure.
  - El contrato evita stale hovers/completions tras cambios rápidos.
- **Implementation notes:**
  - Crear tipos/helpers compartidos antes de implementar caches concretas de Bloque 2/3.
  - No adelantar implementación completa de `HoverViewModel cache` ni `CompletionListViewModel cache` en esta spec salvo lo mínimo para validar el contrato.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-SERVING-01`
  - `DEVTOOLS-SERVING-02`
  - `DEVTOOLS-SERVING-03`
- **Risk:** medio; key incompleta produce stale results y key demasiado granular reduce hit ratio.
- **Exit criteria:**
  - Hay un contrato de keys listo para Bloque 2 Hover y Bloque 3 Completion.

---

## Resultado esperado al cerrar el Bloque 1

Al cerrar este bloque deben cumplirse todas estas condiciones:

```text
1. Hover/completion/signatureHelp tienen métricas reales por hit/miss.
2. El hot path tiene guards no IO/no workspace scan/no full parse.
3. Hay stale/cancellation guard para evitar respuestas obsoletas.
4. Hay payload budget gate inicial para features LSP interactivas.
5. Existe una pipeline común de serving interactivo o equivalente.
6. ServingCache queda protegido contra evictions cruzadas dañinas.
7. Existe ActiveDocumentServingSnapshot read-only o contrato equivalente.
8. Existe contrato común de cache keys para ViewModel caches.
9. No se ha creado un segundo KnowledgeBase ni un segundo motor semántico.
10. docs/backlog/current-focus/testing/performance-budget quedan alineados.
11. Tests y gates ejecutables quedan verdes o con skips honestos documentados.
```

---

## Current focus recomendado si se decide activar este bloque

```markdown
# Current Focus — DevTools Ultra-Fast Serving Foundation

## Scope

- DEVTOOLS-HOTPATH-01
- DEVTOOLS-HOTPATH-02

## Explicitly out of scope for this first slice

- HoverFastPath
- HoverViewModel cache final
- Negative hover cache
- completionItem/resolve
- CompletionListViewModel cache
- DataWindowFastContext
- resolver consolidation

## Exit criteria

- Latencia interactiva observable por hit/miss.
- Guards no IO/no workspace scan/no full parse operativos.
- Docs y performance budget alineados.
```
---
