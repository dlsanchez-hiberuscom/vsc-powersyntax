# BLOQUE 4 — SignatureHelp, Definition, Symbols & Semantic Tokens Alignment

> Objetivo: alinear `signatureHelp`, `definition`, `references`, `documentSymbols`, `workspaceSymbols`, `semanticTokens` y `CodeLens` con la nueva capa de serving/hot path, evitando que cada feature conserve caminos propios, presupuestos divergentes, payloads no medidos o duplicidades de resolución/formateo.

---

## Base técnica y patrones aplicados

Este bloque se basa en los hallazgos de `docs/architecture-implementation-map.md`:

- `signatureHelp`, `definition`, `references`, `documentSymbols`, `workspaceSymbols`, `semanticTokens` y `CodeLens` viven en `src/server/features/*` y se cablean desde `src/server/handlers/featureHandlers.ts`.
- `signatureHelp` ya usa `ServingCache`, `KnowledgeBase`, `SystemCatalog`, `InheritanceGraph`, `HotContextCache`, `queryScopePolicy` y `dataWindowBindingModel`.
- `definition` usa `ServingCache`, `KnowledgeBase`, `InheritanceGraph`, `SystemCatalog`, `HotContextCache`, `queryContext` y ya resuelve built-ins/DataWindow owner-aware.
- `references` no usa `ServingCache`; trabaja sobre `referenceSourcePool`, `maskedText` y pools acotados por proyecto.
- `documentSymbols` y `semanticTokens` no usan `ServingCache`; reutilizan `analysisCache`/snapshot documental.
- `semanticTokens` recalcula payload por request y no tiene caché final dedicada.
- `documentSymbols` recompone outline desde snapshot y reconciliation; no tiene caché final dedicada.
- `CodeLens` sí tiene `CodeLensResultCache`, pero `codeLensProvider.resolveProvider = false`.
- Hay duplicidad parcial en callable resolution, hierarchy traversal, DataWindow binding y formatting visible.

Patrones externos aplicados:

- **LSP feature alignment:** cada feature debe exponer solo capabilities implementadas y mantener sus respuestas dentro de budgets y contracts LSP.
- **SignatureHelp activo y compacto:** `SignatureHelp` debe devolver una lista de firmas, `activeSignature` y `activeParameter`, evitando recalcular documentación visible en cada miss.
- **Semantic tokens sobre conocimiento semántico:** VS Code usa TextMate para sintaxis y semantic tokens para enriquecer coloreado con información de símbolos resueltos por el language service; por tanto deben apoyarse en snapshots/KnowledgeBase y no en scans globales.
- **Range/full/delta awareness:** semantic tokens pueden tener respuesta completa o delta según capabilities; si no se implementa delta, debe quedar documentado y medido.
- **Navigation payload discipline:** definition suele tener payload bajo; references y workspace/document symbols pueden crecer y necesitan caps, readiness y payload budgets.
- **Adapters ligeros:** cada provider debe ser adapter sobre query/serving layer, no owner semántico nuevo.

---

## Dependencia de Bloques previos

Este bloque asume cerrado o implementado el primer slice del Bloque 1:

- `DEVTOOLS-HOTPATH-01` — Observabilidad real de serving interactivo.
- `DEVTOOLS-HOTPATH-02` — Guards no IO/no workspace scan/no full parse.

Para ejecutar la alineación completa, se recomienda que estén disponibles:

- `DEVTOOLS-SERVING-01` — InteractiveServingPipeline modular.
- `DEVTOOLS-SERVING-02` — ServingCacheRouter con particiones por feature.
- `DEVTOOLS-SERVING-03` — ActiveDocumentServingSnapshot read-only.
- `DEVTOOLS-SERVING-04` — ViewModel cache key contract.

Este bloque NO debe reimplementar Bloques 1, 2 o 3. Debe alinear el resto de features con los contratos ya creados.

---

## Estado de ítems anteriores

### Relacionados pero NO sustituidos completamente

- `DEVTOOLS-PERF-07` queda reforzado por este bloque para `definition`, `references`, `documentSymbols`, `semanticTokens`, `CodeLens` y diagnostics incrementales.
- `DEVTOOLS-ARCH-01` seguirá siendo el bloque padre para consolidar duplicidades de resolvers y formatters; este bloque solo debe reducir duplicidad local cuando sea de bajo riesgo.
- `DEVTOOLS-DW-01` seguirá siendo el bloque específico de DataWindow fast mode; este bloque no debe crear un DataWindow parser ni resolver dinámicos complejos.

---

## Cadena recomendada — Bloque 4

Orden obligatorio dentro del bloque:

1. `DEVTOOLS-LSP-01` — SignatureHelpViewModel cache y callable resolver adapter.
2. `DEVTOOLS-LSP-02` — Definition serving alignment y confidence cache contract.
3. `DEVTOOLS-LSP-03` — References/Rename payload, source pool y no-widening guards.
4. `DEVTOOLS-LSP-04` — DocumentSymbols serving alignment y outline cache decision.
5. `DEVTOOLS-LSP-05` — SemanticTokens serving alignment y cache/delta decision.
6. `DEVTOOLS-LSP-06` — CodeLens serving alignment y resolveProvider decision.
7. `DEVTOOLS-LSP-07` — Feature readiness/budget consistency audit.

---

# FASE A — SignatureHelp y Definition

## DEVTOOLS-LSP-01 — SignatureHelpViewModel cache y callable resolver adapter

- **Priority:** P2.
- **Status:** Open.
- **Area:** signatureHelp, serving-cache, callable-resolution, presentation.
- **Problem:**
  - `signatureHelp` reutiliza jerarquía, catálogo y binding DataWindow, pero no tiene un `SignatureHelpViewModel` explícito ni caché específica de presentación.
  - En cache miss construye `SignatureInformation`, documentación de parámetros y return, y parte del formateo visible puede repetirse.
- **Goal:**
  - Crear un modelo de presentación/cache para signature help y alinearlo con la pipeline de serving sin duplicar callable resolution.
- **Acceptance criteria:**
  - Existe `SignatureHelpViewModel` o equivalente.
  - El modelo contiene signatures, activeSignature, activeParameter, documentation compacta y confidence/reason si aplica.
  - Usa callable resolver compartido o adapter mínimo sobre `SemanticQueryService`, `SystemCatalog`, `InheritanceGraph` y `dataWindowBindingModel`.
  - No contiene verdad semántica global ni duplica KnowledgeBase.
  - Cache hit no hace IO, workspace scan, full parse ni reconstrucción de documentación larga.
  - Invalida por URI, documentVersion, `kbVersion/semanticEpoch`, sourceOrigin, locale y call context.
  - Respeta triggers/retriggers y active parameter de forma estable.
  - DataWindow `Retrieve()` y built-ins se sirven solo cuando el binding/owner es defendible.
- **Implementation notes:**
  - Mantener `signatureHelp.ts` como provider/adaptador, no como owner nuevo de callables.
  - Evitar construir docs largas en cada miss si el callable ya está resuelto.
  - Si Bloque 1 aún no cerró `ActiveDocumentServingSnapshot`, usar contexto actual sin crear store nuevo.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Suggested test coverage:**
  - Firma de función workspace.
  - Firma de event/function heredado.
  - Built-in PowerBuilder con parámetros.
  - DataWindow `Retrieve()` con binding fiable.
  - Active parameter en primer parámetro, parámetro medio y último.
  - Retrigger con coma/paréntesis.
  - No IO/no workspace scan/no full parse en hit.
  - Invalidación por locale y semanticEpoch.
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-HOTPATH-01`
  - `DEVTOOLS-HOTPATH-02`
  - `DEVTOOLS-SERVING-01`
  - `DEVTOOLS-SERVING-04`
- **Risk:** medio-alto; duplicar callable resolution puede romper consistencia con hover/completion/definition.
- **Exit criteria:**
  - SignatureHelp queda alineado con serving layer, cacheable y sin duplicar resolución.

---

## DEVTOOLS-LSP-02 — Definition serving alignment y confidence cache contract

- **Priority:** P2.
- **Status:** Open.
- **Area:** definition, serving-cache, confidence, navigation.
- **Problem:**
  - `definition` ya usa `ServingCache` e incluye `resolutionConfidence`, pero mezcla en el miss path workspace targets, built-ins, owner chains DataWindow y readiness.
  - Necesita alinearse con la pipeline común y con un contrato explícito de confidence/cache.
- **Goal:**
  - Mantener definition rápido y preciso, con cache key/confidence claros, sin duplicar DataWindow/built-in resolution.
- **Acceptance criteria:**
  - Definition usa `InteractiveServingPipeline` o wrapper equivalente para metrics, stale guard, cache hit/miss y payload.
  - La entrada cacheada conserva `resolutionConfidence` y reason mínimo para revalidación.
  - Cache hit revalida readiness/confidence sin recomputar resolución completa.
  - Cache miss no hace IO, workspace scan ni full parse si snapshot está caliente.
  - Built-ins y DataWindow owner chains se resuelven mediante owners existentes, no lógica duplicada nueva.
  - Payload budget permanece bajo y medido.
  - Tests cubren confidence downgrade, stale invalidation y fallback seguro.
- **Implementation notes:**
  - No introducir una `DefinitionViewModel` pesada salvo que aporte métricas/cache claras.
  - Mantener `definition.ts` como provider/adaptador.
  - Si se encuentra duplicidad DataWindow, documentarla para `DEVTOOLS-DW-01` o `DEVTOOLS-ARCH-01`, no resolver todo aquí.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Suggested test coverage:**
  - Definition workspace symbol.
  - Definition inherited member.
  - Definition built-in owner-aware.
  - Definition DataWindow column/property high-confidence.
  - Confidence below threshold blocks/degrades.
  - Cache hit with readiness revalidation.
  - No IO/no workspace scan/no full parse in hit.
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-HOTPATH-01`
  - `DEVTOOLS-HOTPATH-02`
  - `DEVTOOLS-SERVING-01`
- **Risk:** medio; tocar definition puede romper navegación básica y DataWindow owner-aware.
- **Exit criteria:**
  - Definition queda alineado con serving common path y mantiene confianza/navegación estable.

---

# FASE B — References, Rename y CodeLens

## DEVTOOLS-LSP-03 — References/Rename payload, source pool y no-widening guards

- **Priority:** P2.
- **Status:** Open.
- **Area:** references, rename, payload, source-pool, guards.
- **Problem:**
  - `references` y `rename` no usan `ServingCache`; trabajan sobre `referenceSourcePool`, `maskedText` y pool acotado por proyecto.
  - El payload puede crecer y el mayor riesgo es ensanchar accidentalmente a workspace global o source origins no permitidos.
- **Goal:**
  - Endurecer source pool, payload caps y guards de no-widening para references y rename.
- **Acceptance criteria:**
  - Tests fallan si references/rename se ensanchan de project pool a workspace sin policy explícita.
  - Tests verifican que no hay IO innecesario fuera del source pool autorizado.
  - Payload budget documentado para references y WorkspaceEdit de rename.
  - Result caps y reason codes quedan visibles.
  - Rename sigue bloqueando built-ins, dynamic/external/ambiguous y sourceOrigin no defendible.
  - References y rename comparten owner/adapters de matching y source pool sin duplicidad nueva.
  - No se introduce caching final si no hay evidencia de beneficio; si se decide no cachear, queda documentado.
- **Implementation notes:**
  - Preferir guards sobre refactor semántico grande.
  - No convertir references en feature cacheada sin medir primero.
  - Mantener `referenceSourcePool.ts` como owner de pool/caps.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Suggested test coverage:**
  - Project pool normal.
  - Generated/staging/external no permitido.
  - Result cap aplicado.
  - Rename safe symbol.
  - Rename blocked built-in.
  - Rename blocked dynamic/ambiguous.
  - No workspace widening.
  - Payload/WorkspaceEdit cap.
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-HOTPATH-01`
  - `DEVTOOLS-HOTPATH-02`
  - `DEVTOOLS-HOTPATH-04`
- **Risk:** medio-alto; guards demasiado estrictos pueden bloquear referencias válidas y demasiado laxos pueden disparar coste/payload.
- **Exit criteria:**
  - References/Rename quedan acotados, medidos y sin riesgo de widening accidental.

---

## DEVTOOLS-LSP-06 — CodeLens serving alignment y resolveProvider decision

- **Priority:** P3.
- **Status:** Open.
- **Area:** codelens, serving-cache, references, payload.
- **Problem:**
  - `CodeLens` usa `CodeLensResultCache`, pero `codeLensProvider.resolveProvider = false`, por lo que prepara el payload upfront.
  - Parte del coste depende de references y jerarquía.
- **Goal:**
  - Alinear CodeLens con la serving layer y decidir explícitamente si debe permanecer sin resolve o adoptar `codeLens/resolve` en el futuro.
- **Acceptance criteria:**
  - Se documenta si `resolveProvider = false` sigue siendo la decisión correcta.
  - CodeLensResultCache mantiene invalidación por URI/KB/readiness documentada.
  - Tests cubren hit/miss del cache de CodeLens y no widening hacia workspace.
  - Payload de CodeLens queda medido y dentro de budget.
  - Si se decide añadir resolve en el futuro, se crea backlog separado; no se implementa aquí salvo decisión explícita.
- **Implementation notes:**
  - No mezclar con refactor de references.
  - Mantener CodeLens como feature parcial/no-hot salvo evidencia de impacto.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-LSP-03`
- **Risk:** medio; adelantar resolveProvider sin necesidad puede complicar una feature que ya funciona.
- **Exit criteria:**
  - CodeLens queda medido, documentado y sin decisión implícita pendiente.

---

# FASE C — Symbols y Semantic Tokens

## DEVTOOLS-LSP-04 — DocumentSymbols serving alignment y outline cache decision

- **Priority:** P2.
- **Status:** Open.
- **Area:** documentSymbols, outline, serving, performance.
- **Problem:**
  - `documentSymbols` reutiliza snapshot/document analysis, pero no tiene cache final de outline.
  - Puede estar bien no cachear, pero la decisión debe estar medida y documentada.
- **Goal:**
  - Alinear document symbols con hot path guards y decidir si requiere cache final o basta con snapshot caliente.
- **Acceptance criteria:**
  - Tests verifican no IO, no workspace scan y no full parse cuando el snapshot está caliente.
  - Se mide coste de documentSymbols con snapshot caliente.
  - Se documenta decisión: cache final de outline vs no-cache por coste bajo.
  - Si se implementa cache, invalida por URI, documentVersion, sourceOrigin y `semanticEpoch`.
  - Si no se implementa cache, queda justificado con evidencia de performance.
  - Reconciliation report sigue funcionando y no se mezcla con payload LSP principal si no aporta valor al usuario.
- **Implementation notes:**
  - No introducir cache por defecto si el coste medido es bajo.
  - Evitar duplicar snapshot documental.
  - Mantener `.srd` safe mode separado y documentado.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Suggested test coverage:**
  - Outline de objeto PowerBuilder.
  - Outline de DataWindow safe mode.
  - Snapshot caliente sin full parse.
  - Cambio de documento invalida/recalcula.
  - Payload/cap si aplica.
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-HOTPATH-01`
  - `DEVTOOLS-HOTPATH-02`
- **Risk:** medio; cachear outline sin necesidad puede duplicar memoria, pero no cachear puede repetir trabajo evitable.
- **Exit criteria:**
  - DocumentSymbols tiene decisión explícita, medida y protegida por tests.

---

## DEVTOOLS-LSP-05 — SemanticTokens serving alignment y cache/delta decision

- **Priority:** P2.
- **Status:** Open.
- **Area:** semanticTokens, highlighting, serving, payload.
- **Problem:**
  - `semanticTokens` recalcula payload por request y no tiene cache final dedicada.
  - Semantic tokens pueden tener payload medio/alto y dependen del snapshot semántico y catálogo.
- **Goal:**
  - Alinear semantic tokens con hot path guards, payload budgets y decidir cache final o delta/full strategy.
- **Acceptance criteria:**
  - Tests verifican no IO, no workspace scan y no full parse cuando snapshot está caliente.
  - Se mide coste y payload de semantic tokens con snapshot caliente.
  - Se documenta si se mantiene respuesta full sin cache, full con cache, range tokens o delta strategy.
  - Si se implementa cache, invalida por URI, documentVersion, sourceOrigin, locale si aplica y `semanticEpoch`.
  - Si no se implementa cache, queda justificado por coste medido.
  - Token legend y clasificación quedan documentadas y estables.
  - Built-ins/enums se clasifican mediante `SystemCatalog`, no hardcodes nuevos.
  - Payload budget queda en `docs/performance-budget.md`.
- **Implementation notes:**
  - No implementar delta si el cliente/capabilities o infraestructura actual no lo justifican.
  - Preferir cache full por snapshot antes que delta compleja si el coste/payload lo aconseja.
  - No duplicar clasificación de enums/built-ins fuera del owner existente.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Suggested test coverage:**
  - Tokens de variable local/argumento/function/event.
  - Tokens built-in owner-aware.
  - Tokens enum values/types.
  - Snapshot caliente sin full parse.
  - Payload budget.
  - Invalidation por documentVersion/semanticEpoch.
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-HOTPATH-01`
  - `DEVTOOLS-HOTPATH-02`
  - `DEVTOOLS-HOTPATH-04`
- **Risk:** medio-alto; semantic tokens pueden generar mucho payload y una cache/delta mal diseñada puede aumentar complejidad sin beneficio.
- **Exit criteria:**
  - SemanticTokens tiene decisión explícita sobre cache/delta/full, con tests y budget.

---

# FASE D — Consistencia transversal

## DEVTOOLS-LSP-07 — Feature readiness/budget consistency audit

- **Priority:** P2.
- **Status:** Open.
- **Area:** readiness, queryScopePolicy, budgets, LSP-features.
- **Problem:**
  - Las features críticas tienen budgets y readiness, pero al introducir pipeline/caches nuevas puede aparecer drift entre `hover`, `completion`, `signatureHelp`, `definition`, `references`, `documentSymbols`, `semanticTokens` y diagnostics.
- **Goal:**
  - Asegurar que todas las features LSP críticas usan readiness, budgets, metrics, stale guard y payload policy de forma coherente.
- **Acceptance criteria:**
  - `queryScopePolicy.ts` refleja budgets/caps actuales y no hay hardcodes divergentes en providers.
  - `featureReadiness.ts` y `servingReadiness.ts` cubren las features críticas o documentan excepciones.
  - Runtime stats distinguen al menos `hover`, `completion`, `completion-resolve`, `signatureHelp`, `definition`, `references`, `documentSymbols`, `semanticTokens` y diagnostics incrementales si aplica.
  - Cada feature tiene decisión documentada sobre cache final, no-cache o cache especializada.
  - Tests de architecture/readiness fallan si una feature nueva evita policy común sin justificación.
  - Docs no prometen más de lo verificado.
- **Implementation notes:**
  - Esta spec debe ser auditoría/corrección ligera, no refactor amplio.
  - Si encuentra duplicidad semántica profunda, debe actualizar `DEVTOOLS-ARCH-01`, no resolverla aquí.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
  - `npm run test:performance:gate`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-LSP-01`
  - `DEVTOOLS-LSP-02`
  - `DEVTOOLS-LSP-03`
  - `DEVTOOLS-LSP-04`
  - `DEVTOOLS-LSP-05`
- **Risk:** medio; una auditoría transversal puede crecer demasiado si intenta resolver todos los hallazgos.
- **Exit criteria:**
  - Todas las features LSP críticas quedan alineadas con los contratos de serving/performance, o tienen excepción documentada.

---

## Resultado esperado al cerrar el Bloque 4

Al cerrar este bloque deben cumplirse todas estas condiciones:

```text
1. SignatureHelp usa ViewModel/cache o decisión equivalente y no duplica callable resolution.
2. Definition queda alineado con serving pipeline y conserva confidence/reason cache contract.
3. References/Rename tienen guards explícitos de no widening y payload caps.
4. DocumentSymbols tiene decisión medida de cache/no-cache y tests de snapshot caliente.
5. SemanticTokens tiene decisión medida de cache/full/delta y payload budget.
6. CodeLens tiene decisión documentada sobre resolveProvider y cache actual.
7. Todas las features críticas pasan por readiness/budget/metrics/stale guard o documentan excepción.
8. No se ha creado un segundo KnowledgeBase ni un segundo motor semántico.
9. No se ha creado parser nuevo ni se ha tratado DataWindow como PowerScript genérico.
10. docs/backlog/testing/performance-budget/architecture-implementation-map quedan alineados.
```

---

## Current focus recomendado si se decide activar este bloque

```markdown
# Current Focus — LSP Feature Serving Alignment

## Scope

- DEVTOOLS-LSP-01
- DEVTOOLS-LSP-02

## Optional within same focus only if previous items are closed

- DEVTOOLS-LSP-03
- DEVTOOLS-LSP-04
- DEVTOOLS-LSP-05

## Explicitly out of scope

- completionItem/resolve
- HoverFastPath
- DataWindowFastContext
- broad resolver consolidation
- new parser or DataWindow parser changes
- semantic tokens delta unless explicitly justified
- CodeLens resolveProvider unless explicitly justified

## Exit criteria

- SignatureHelp and Definition aligned with serving pipeline.
- Hot path remains no IO/no workspace scan/no full parse.
- Cache/no-cache decisions documented for Symbols and SemanticTokens.
- Payload and readiness policies aligned.
```

---