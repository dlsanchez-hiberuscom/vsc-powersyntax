# BLOQUE 2 — Hover Ultra-Fast & Developer-Useful UX

> Objetivo: convertir `hover` en una feature extremadamente rápida, compacta, estable y realmente útil para desarrolladores PowerBuilder, apoyada en la capa de serving del Bloque 1, sin duplicar semántica ni reabrir un segundo motor de resolución.

---

## Base técnica y patrones aplicados

Este bloque se basa en los hallazgos de `docs/architecture-implementation-map.md`:

- `hover` está implementado en `src/server/features/hover.ts`, con formateo en `src/server/features/hoverFormat.ts` y wiring en `src/server/handlers/featureHandlers.ts`.
- `hover` ya usa `ServingCache` por feature, URI, posición, `kbVersion` y locale.
- `hover` usa `HotContextCache`, `KnowledgeBase`, `SystemCatalog`, `InheritanceGraph`, `semanticQueryService`, `queryContext` y `documentationService`.
- `hover` tiene `queryScopePolicy` con budget de 50 ms, scope `active-object` y `resultCap = 8`.
- En cache hit, el camino ya es rápido.
- En cache miss, `hover` recompone resolución semántica, documentación localizada y Markdown final.
- No existe `HoverViewModel cache` separado.
- No existe `NegativeHoverCache`.
- El formateo visible está parcialmente repartido entre `hover.ts`, `hoverFormat.ts` y `documentationService.ts`.
- El payload risk de `hover` es medio: ya es compacto, pero todavía no hay contrato formal por tipo de símbolo.

Patrones externos aplicados:

- **LSP Hover como respuesta compacta:** el objeto Hover debe devolver contenido y, opcionalmente, un rango; el contenido debe estar preparado para renderizarse sin incluir dumps internos ni estructuras pesadas.
- **VS Code consulta hover bajo demanda:** el editor dispara hover al pasar sobre símbolos; por eso el path debe ser extremadamente barato y cancelable/stale-safe.
- **ViewModel separado de semántica:** el resultado visible debe ser un modelo de presentación derivado, no una fuente semántica nueva.
- **Negative cache segura:** los misses repetidos sobre whitespace, comentarios, strings, keywords o símbolos no resolubles deben evitar recomputación, pero siempre invalidando por documento/epoch/locale.
- **UX por tipo de símbolo:** el hover debe responder rápido a “qué es”, “tipo/firma”, “origen/scope” y “confianza si no es alta”, evitando información interna.

---

## Cadena recomendada — Bloque 2

Orden obligatorio dentro del bloque:

1. `DEVTOOLS-HOVER-01` — Contrato compacto de HoverViewModel por tipo de símbolo.
2. `DEVTOOLS-HOVER-02` — HoverFastPath con cache de HoverViewModel.
3. `DEVTOOLS-HOVER-03` — Negative hover cache segura.
4. `DEVTOOLS-HOVER-04` — Hover UX regression matrix y payload contract.
5. `DEVTOOLS-HOVER-05` — Hover docs/debug hooks sin ruido en hot path.

---

# FASE A — Contrato visible y modelo de presentación

## DEVTOOLS-HOVER-01 — Contrato compacto de HoverViewModel por tipo de símbolo

- **Priority:** P1.
- **Status:** Open.
- **Area:** UX, hover, presentation, serving.
- **Problem:**
  - El hover ya es más compacto que antes, pero no existe un contrato explícito de presentación por tipo de símbolo.
  - El resultado visible se construye entre `hover.ts`, `hoverFormat.ts` y `documentationService.ts`, lo que dificulta cachear presentación final y mantener UX estable.
- **Goal:**
  - Definir `HoverViewModel` o equivalente como modelo de presentación compacto, estable, cacheable y libre de ownership semántico.
- **Acceptance criteria:**
  - Existe un contrato `HoverViewModel` o equivalente.
  - El contrato es estrictamente de presentación: no almacena verdad semántica global ni sustituye `KnowledgeBase`, `SemanticQueryService`, `SystemCatalog` o `DataWindowModel`.
  - El contrato define salida visible para, al menos:
    - variable local;
    - argumento;
    - instance/shared/global variable;
    - función/evento;
    - inherited member;
    - built-in PowerBuilder;
    - enumerated value/type;
    - DataWindow/DataStore method;
    - DataWindow column/property;
    - SQL/transaction-related symbol si aplica;
    - dynamic/ambiguous symbol;
    - unknown/unresolved symbol.
  - Cada tipo de hover define:
    - línea principal;
    - tipo/firma si aplica;
    - scope/origen;
    - owner/ancestor si aporta valor;
    - breve documentación útil si existe;
    - confidence/warning solo si no es alta o si hay ambigüedad real.
  - El hover no muestra JSON, dumps internos, rutas largas, metadata de arquitectura interna ni evidence extensa.
  - El contrato contempla `locale` sin duplicar identidad semántica ni traducir nombres reales de PowerBuilder.
  - No aumenta payload ni coste del hot path.
- **Implementation notes:**
  - Crear tipos puros para `HoverViewModel`, `HoverKind`, `HoverConfidence` y bloques visibles.
  - Mantener `hoverFormat.ts` como formatter de `HoverViewModel` a LSP Hover o `MarkupContent`.
  - `documentationService.ts` debe seguir siendo proveedor de texto/documentación, no owner del modelo visible.
  - Evitar meter lógica de resolución en `HoverViewModel`.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid`
- **Suggested test coverage:**
  - Hover de variable local.
  - Hover de argumento.
  - Hover de función/evento con firma.
  - Hover de inherited member.
  - Hover de built-in PowerBuilder.
  - Hover de enumerated value con `!`.
  - Hover de DataWindow/DataStore method.
  - Hover de DataWindow column/property con binding fiable.
  - Hover ambiguous con confidence visible.
  - Unknown/unresolved sin ruido.
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-HOTPATH-01`
  - `DEVTOOLS-HOTPATH-02`
- **Risk:** medio; compactar demasiado puede ocultar información útil, y modelar demasiado puede duplicar semántica.
- **Exit criteria:**
  - El contrato de hover visible está definido, testeado y listo para ser cacheado por `DEVTOOLS-HOVER-02`.

---

## DEVTOOLS-HOVER-04 — Hover UX regression matrix y payload contract

- **Priority:** P2.
- **Status:** Open.
- **Area:** UX, hover, testing, payload.
- **Problem:**
  - Sin una matriz UX, cada mejora de hover puede cambiar el contenido visible de forma accidental.
  - El payload de hover puede crecer al añadir documentación, owner chains o warnings.
- **Goal:**
  - Crear una matriz de regresión visible para hover por tipo de símbolo y un contrato de payload compacto.
- **Acceptance criteria:**
  - Existe una matriz de casos de hover por tipo de símbolo.
  - Cada caso especifica qué bloques son obligatorios, opcionales y prohibidos.
  - Existen tests snapshot o assertions estructurales del contenido visible.
  - Existe un presupuesto de payload para hover documentado en `docs/performance-budget.md`.
  - Se valida que el hover no muestra metadata interna ni evidence larga salvo casos explícitos.
  - Los tests son robustos frente a cambios menores de wording; preferir assertions por bloques/campos sobre snapshots frágiles si es posible.
- **Implementation notes:**
  - Añadir test helpers para inspeccionar `HoverViewModel` antes del render LSP.
  - Si se usa Markdown, limitar bloques y evitar tablas grandes.
  - El presupuesto debe diferenciar hover normal de hover ambiguous/warning.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/testing.md`
  - `docs/performance-budget.md`
  - `docs/architecture-implementation-map.md`
- **Dependencies:**
  - `DEVTOOLS-HOVER-01`
  - `DEVTOOLS-HOTPATH-04`
- **Risk:** medio; tests demasiado rígidos pueden frenar mejoras UX legítimas.
- **Exit criteria:**
  - Cambios accidentales de contenido/payload de hover quedan detectados por tests o gates.

---

# FASE B — Fast path y cache de presentación

## DEVTOOLS-HOVER-02 — HoverFastPath con cache de HoverViewModel

- **Priority:** P1.
- **Status:** Open.
- **Area:** performance, hover, serving-cache, presentation-cache.
- **Problem:**
  - `hover` ya usa `ServingCache`, pero en cache miss recompone resolución, documentación y Markdown final.
  - No existe una cache explícita de `HoverViewModel`, por lo que no hay separación limpia entre resolución semántica y presentación cacheable.
- **Goal:**
  - Servir hover caliente desde un modelo de presentación final compacto sin duplicar semántica.
- **Acceptance criteria:**
  - Existe `HoverFastPath` o equivalente integrado con `InteractiveServingPipeline`.
  - Existe cache explícita de `HoverViewModel` o equivalente defendible.
  - El cache hit devuelve hover sin IO, sin workspace scan, sin full parse y sin reformat pesado.
  - El cache miss reutiliza `SemanticQueryService`, `KnowledgeBase`, `SystemCatalog`, `InheritanceGraph`, `HotContextCache` y `ActiveDocumentServingSnapshot` si existe.
  - No crea un segundo motor semántico ni copia semántica global.
  - La key incluye como mínimo URI, documentVersion cuando aplique, `kbVersion/semanticEpoch`, sourceOrigin, locale, feature, position/range o symbol id.
  - La invalidación cubre cambio de URI, cambio de documento, cambio de KB/epoch, cambio de locale y pressure policy.
  - El resultado visible respeta el contrato de `DEVTOOLS-HOVER-01`.
  - La instrumentación de `DEVTOOLS-HOTPATH-01` distingue hit de `ServingCache`, hit de `HoverViewModel cache`, miss y formatter cost.
- **Implementation notes:**
  - Diseñar como capa encima de la resolución actual, no como reimplementación.
  - Mantener `ServingCache` como cache LSP final o integrarlo mediante `ServingCacheRouter` si Bloque 1 ya lo cerró.
  - Evitar que `HoverViewModel cache` duplique payload LSP completo si `ServingCache` ya guarda la response final; decidir y documentar si cachea ViewModel, response final o ambas con política de admission.
  - No implementar `NegativeHoverCache` en esta spec salvo preparación de keys.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Suggested test coverage:**
  - Cache hit de HoverViewModel.
  - Cache miss con generación de ViewModel.
  - Invalidación por documentVersion.
  - Invalidación por `semanticEpoch`.
  - Invalidación por locale.
  - No stale hover tras cambio de documento.
  - No IO/no workspace scan/no full parse en hit.
  - Formatter no se ejecuta en hit si el ViewModel/render final está cacheado.
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-HOVER-01`
  - `DEVTOOLS-SERVING-01`
  - `DEVTOOLS-SERVING-04`
  - `DEVTOOLS-HOTPATH-01`
  - `DEVTOOLS-HOTPATH-02`
- **Risk:** medio-alto; una key incompleta puede servir hovers stale y una cache mal diseñada puede duplicar memoria sin mejorar latencia.
- **Exit criteria:**
  - Hover caliente es servido desde una ruta de presentación cacheada, medible y sin recomputación semántica innecesaria.

---

## DEVTOOLS-HOVER-05 — Hover docs/debug hooks sin ruido en hot path

- **Priority:** P3.
- **Status:** Open.
- **Area:** hover, observability, developer-experience.
- **Problem:**
  - Al optimizar hover, puede ser difícil diagnosticar por qué un hover fue cache hit, cache miss, ambiguous, unknown o degraded.
  - Añadir logs directos al hot path puede introducir ruido o coste.
- **Goal:**
  - Proporcionar observabilidad read-only para hover sin logging ruidoso ni coste apreciable.
- **Acceptance criteria:**
  - Existe una forma read-only de inspeccionar el último estado de hover o sus métricas agregadas mediante runtime journal/stats ya existentes.
  - No hay logs por request en consola salvo modo debug explícito.
  - La información incluye reason simple: `cache-hit`, `viewmodel-hit`, `miss`, `negative-hit`, `stale-discarded`, `readiness-degraded`, `unknown`.
  - La información no expone payload completo, contenido sensible ni dumps semánticos grandes.
  - El support bundle o runtime health puede incluir resumen agregado si procede.
- **Implementation notes:**
  - Preferir contadores y últimos eventos resumidos frente a trazas por request.
  - No crear una UI nueva; reutilizar runtime stats/journal si existen.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/testing.md`
  - `docs/architecture-implementation-map.md`
- **Dependencies:**
  - `DEVTOOLS-HOTPATH-01`
  - `DEVTOOLS-HOVER-02`
- **Risk:** bajo-medio; observabilidad excesiva puede contaminar hot path o soporte.
- **Exit criteria:**
  - El comportamiento de hover optimizado se puede diagnosticar sin logs ruidosos.

---

# FASE C — Negative cache segura

## DEVTOOLS-HOVER-03 — Negative hover cache segura

- **Priority:** P2.
- **Status:** Open.
- **Area:** performance, hover, negative-cache.
- **Problem:**
  - Los misses defendibles de hover en whitespace, comentarios, strings, keywords, separadores o símbolos no resolubles pueden recomputarse repetidamente.
  - No existe `NegativeHoverCache`.
- **Goal:**
  - Cachear resultados negativos seguros para evitar recomputación sin ocultar resultados válidos tras cambios.
- **Acceptance criteria:**
  - Existe `NegativeHoverCache` o equivalente.
  - Cubre al menos whitespace, comentarios, strings, keywords, separadores y unresolved defendible.
  - La key incluye URI, documentVersion, `kbVersion/semanticEpoch`, sourceOrigin, locale y position/range.
  - Se invalida por cambio de documento, URI, KB/epoch, sourceOrigin y locale.
  - No tapa resultados válidos posteriores tras cambios del documento o de la KB.
  - No guarda negativos para casos de baja confianza que podrían resolverse con una dependencia semántica ya en progreso, salvo que el estado sea claramente stale/versionado.
  - La instrumentación distingue `negative-hit` de `normal-miss`.
  - Tests cubren misses repetidos y rematerialización tras cambio.
- **Implementation notes:**
  - Mantener TTL corto o invalidación estricta por version/epoch.
  - No cachear negative results si la causa fue readiness temporal o background indexing no listo, salvo que la key incluya readiness state y sea seguro.
  - Preferir negativos por token/range, no solo por posición cruda, para evitar inconsistencias al mover cursor dentro del mismo token.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:docs:drift`
- **Suggested test coverage:**
  - Repetir hover sobre whitespace usa negative cache.
  - Repetir hover sobre comentario usa negative cache.
  - Repetir hover sobre string literal usa negative cache.
  - Cambio de documento invalida negative cache.
  - Cambio de KB/epoch invalida negative cache.
  - Un símbolo que aparece tras editar deja de ser negative.
  - Readiness temporal no crea negative permanente.
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-HOVER-02`
  - `DEVTOOLS-HOTPATH-03`
  - `DEVTOOLS-SERVING-04`
- **Risk:** medio; una negative cache demasiado agresiva puede ocultar hovers válidos tras cambios pequeños.
- **Exit criteria:**
  - Hover evita recomputar misses seguros y mantiene corrección tras cambios.

---

## Resultado esperado al cerrar el Bloque 2

Al cerrar este bloque deben cumplirse todas estas condiciones:

```text
1. Existe un contrato HoverViewModel claro, compacto y testeado.
2. Hover visible está definido por tipo de símbolo.
3. Hover no muestra JSON, dumps internos, rutas largas ni metadata irrelevante.
4. HoverFastPath sirve hits sin IO, workspace scan, full parse ni formatter caro.
5. HoverViewModel cache o equivalente está integrado con la serving layer.
6. NegativeHoverCache evita misses repetidos seguros.
7. La instrumentación distingue cache-hit, viewmodel-hit, miss, negative-hit y stale-discarded.
8. La invalidación cubre URI, documentVersion, semanticEpoch/kbVersion, sourceOrigin y locale.
9. Los tests cubren UX, payload, hit/miss, negative cache y stale safety.
10. docs/backlog/testing/performance-budget/architecture-implementation-map quedan alineados.
```

---

## Current focus recomendado si se decide activar este bloque

```markdown
# Current Focus — Hover Ultra-Fast & Developer-Useful UX

## Scope

- DEVTOOLS-HOVER-01
- DEVTOOLS-HOVER-02

## Optional within same focus only if previous items are closed

- DEVTOOLS-HOVER-03

## Explicitly out of scope

- completionItem/resolve
- CompletionListViewModel cache
- ActiveDocumentServingSnapshot global redesign
- DataWindowFastContext
- resolver consolidation broad refactor
- new parser or DataWindow parser changes

## Exit criteria

- HoverViewModel contract implemented and tested.
- HoverFastPath uses cache of presentation or equivalent.
- Hot path remains no IO/no workspace scan/no full parse.
- Hover payload and UX contract documented.
```

---