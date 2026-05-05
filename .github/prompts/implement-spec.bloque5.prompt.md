# BLOQUE 5 — Semantic Query Foundation & Resolver Ownership

> Objetivo: consolidar una base semántica moderna, modular y mantenible para que futuras mejoras de PowerBuilder/PowerScript no dupliquen resolución en cada feature. Este bloque define owners claros para resolución de símbolos, scope/context, receiver type, callables, inheritance, enum context y adapters semánticos, sin reescribir `KnowledgeBase`, parser, indexador ni catálogo.

---

## Base técnica y patrones aplicados

Este bloque se basa en los hallazgos de `docs/architecture-implementation-map.md`:

- `KnowledgeBase` ya es el backbone semántico global con publicación atómica, `semanticEpoch`, buckets, scopes, dependencias y snapshots.
- `SemanticQueryService` ya es el motor central de resolución de targets, evidence, confidence y ambiguity.
- `queryContext.ts` y `positionContext.ts` construyen contexto posicional, callable activo, tipo activo y policy del consumer.
- `InheritanceGraph` ya es owner natural de ancestros, miembros heredados, closures y descendientes.
- `SystemCatalog` ya es owner único de built-ins, members, events, enums y dominios DataWindow.
- La auditoría detecta duplicidad parcial o alta en:
  - symbol resolution;
  - scope/context resolution;
  - receiver type resolution;
  - callable/function/event resolution;
  - overload/override resolution;
  - inheritance traversal;
  - enum value/type context;
  - DataWindow binding resolution;
  - formatting/presentation visible.
- Las features `hover`, `completion`, `signatureHelp`, `definition`, `references`, `rename`, `diagnostics`, `semanticTokens` y reports consumen varias de estas piezas y todavía mantienen adapters/resolución local en algunos puntos.

Patrones externos aplicados:

- **Query layer incremental:** separar inputs, queries derivadas y resultados cacheables, con invalidación selectiva por cambios de input.
- **No segundo store semántico:** la nueva base debe coordinar queries existentes, no duplicar `KnowledgeBase`.
- **Owner único por responsabilidad:** cada tipo de resolución debe tener un owner claro y providers deben quedar como adapters ligeros.
- **Pure/resolved models antes de presentation:** resolver primero a modelos semánticos neutrales y después proyectar a ViewModels/LSP.
- **Evidence/confidence explícitos:** las resoluciones deben devolver confidence, reason codes y sourceOrigin cuando la certeza no sea alta.
- **Incremental and on-demand:** siguiendo patrones tipo rust-analyzer/Salsa, las features deben pedir lo necesario y reutilizar resultados derivados, no recomputar todo por request.

---

## Dependencia de Bloques previos

Este bloque puede empezar después de los bloques de serving/hot path, pero no debe depender de que todo hover/completion esté terminado.

Dependencias recomendadas:

- `DEVTOOLS-HOTPATH-01` — Observabilidad real de serving interactivo.
- `DEVTOOLS-HOTPATH-02` — Guards no IO/no workspace scan/no full parse.
- `DEVTOOLS-SERVING-03` — ActiveDocumentServingSnapshot read-only, si se va a integrar con contexto activo.
- `DEVTOOLS-SERVING-04` — ViewModel cache key contract, si se van a estabilizar outputs consumidos por ViewModels.

Este bloque NO debe implementar DataWindow fast mode completo. El binding DataWindow debe coordinarse con Bloque 6.

---

## Estado de ítems anteriores

### Superseded / Reestructurado

- `DEVTOOLS-ARCH-01` → se convierte en épica `SEMANTIC-OWNERS-00` y sub-specs `SEMANTIC-OWNER-*`.

### Relacionados pero NO sustituidos aquí

- `DEVTOOLS-DW-01` se ejecutará después como Bloque 6 / DataWindow Fast Mode.
- `PRESENTATION-*` se ejecutará después como Bloque 7 / Presentation & ViewModels.
- `AI-CONTRACT-*` se ejecutará después como Bloque 10 / AI tools y contratos públicos.

---

## Cadena recomendada — Bloque 5

Orden obligatorio dentro del bloque:

1. `SEMANTIC-OWNERS-00` — Épica: consolidar owners semánticos sin big-bang refactor.
2. `SEMANTIC-FACADE-01` — Fachada read-only de queries semánticas para features LSP.
3. `SEMANTIC-OWNER-01` — Scope/context resolver owner.
4. `SEMANTIC-OWNER-02` — Symbol resolution owner contract.
5. `SEMANTIC-OWNER-03` — Receiver type resolver owner.
6. `SEMANTIC-OWNER-04` — Callable/function/event resolver owner.
7. `SEMANTIC-OWNER-05` — Inheritance traversal consolidation.
8. `SEMANTIC-OWNER-06` — Enum context resolver owner.
9. `SEMANTIC-OWNER-07` — Resolution result model, confidence y reason codes.
10. `SEMANTIC-OWNER-08` — Provider adapters slim-down.

---

# FASE A — Épica y fachada semántica

## SEMANTIC-OWNERS-00 — Épica: consolidar owners semánticos sin big-bang refactor

- **Priority:** P2.
- **Status:** Open.
- **Area:** architecture, semantics, resolver-ownership.
- **Problem:**
  - La auditoría detecta duplicidad parcial o alta en varios tipos de resolución usados por hover, completion, signatureHelp, definition, references, rename, diagnostics, semanticTokens y reports.
  - Si cada feature sigue resolviendo su propio receiver, callable, enum context o binding, futuras mejoras semánticas tendrán comportamientos divergentes.
- **Goal:**
  - Consolidar owners semánticos claros mediante sub-specs pequeñas y verificables, sin reescribir el core ni abrir un segundo centro de decisión.
- **Acceptance criteria:**
  - Cada responsabilidad duplicada del mapa tiene owner explícito.
  - Providers LSP quedan como adapters ligeros sobre owners compartidos.
  - No se rompe la matriz golden ni la semántica PowerBuilder/DataWindow existente.
  - No se crea un segundo `KnowledgeBase`, parser, catalog, indexer ni graph semántico paralelo.
  - Las sub-specs se ejecutan por slices; no se permite un big-bang refactor.
  - Backlog y docs reflejan qué queda partial y qué ya quedó unificado.
- **Sub-specs:**
  - `SEMANTIC-FACADE-01`
  - `SEMANTIC-OWNER-01`
  - `SEMANTIC-OWNER-02`
  - `SEMANTIC-OWNER-03`
  - `SEMANTIC-OWNER-04`
  - `SEMANTIC-OWNER-05`
  - `SEMANTIC-OWNER-06`
  - `SEMANTIC-OWNER-07`
  - `SEMANTIC-OWNER-08`
- **Tests:**
  - `npm run test:unit`
  - `npm test`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
  - `docs/testing.md`
- **Dependencies:** ninguna dura, pero se recomienda haber cerrado `DEVTOOLS-HOTPATH-01` y `DEVTOOLS-HOTPATH-02`.
- **Risk:** alto; mover resolución sin disciplina puede romper varias surfaces visibles.
- **Exit criteria:**
  - Todas las sub-specs están cerradas, descartadas con justificación o convertidas en backlog específico.

---

## SEMANTIC-FACADE-01 — Fachada read-only de queries semánticas para features LSP

- **Priority:** P1.
- **Status:** Open.
- **Area:** semantics, query-layer, architecture.
- **Problem:**
  - Features como hover, completion, signatureHelp, definition y diagnostics consumen directamente varias fuentes: `KnowledgeBase`, `SemanticQueryService`, `SystemCatalog`, `InheritanceGraph`, `queryContext`, `positionContext`, `HotContextCache` y DataWindow helpers.
  - Esto aumenta acoplamiento y facilita duplicidades.
- **Goal:**
  - Crear una fachada read-only de queries semánticas que coordine owners existentes sin almacenar verdad semántica nueva.
- **Acceptance criteria:**
  - Existe `SemanticQueryFacade`, `SemanticQueryLayer`, `FeatureSemanticContext` o equivalente.
  - La fachada es estrictamente read-only.
  - La fachada no sustituye ni duplica `KnowledgeBase`, `SemanticQueryService`, `SystemCatalog`, `InheritanceGraph` ni DataWindowModel.
  - Expone métodos pequeños y estables para:
    - construir contexto de posición;
    - resolver target symbol;
    - resolver receiver type;
    - resolver callable;
    - consultar inheritance;
    - resolver enum context;
    - consultar built-ins/catalog owner-aware;
    - devolver confidence/evidence/sourceOrigin.
  - `hover`, `definition` y `signatureHelp` pueden consumir la fachada sin cambiar comportamiento visible.
  - `completion` puede preparar migración a la fachada sin romper ranking.
  - No introduce IO, workspace scan ni full parse.
- **Implementation notes:**
  - Debe ser wrapper/adaptador sobre código existente.
  - No introducir caches semánticas nuevas salvo memoización local explícita, versionada y documentada.
  - Mantener APIs pequeñas, orientadas a casos reales de features.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Suggested test coverage:**
  - Facade devuelve mismo target que `semanticQueryService` para símbolo simple.
  - Facade respeta sourceOrigin.
  - Facade devuelve confidence/reason codes.
  - Facade no llama IO/workspace scan.
  - Facade no cambia outputs visibles de hover/definition en fixtures existentes.
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
  - `docs/testing.md`
- **Dependencies:**
  - `DEVTOOLS-HOTPATH-01`
  - `DEVTOOLS-HOTPATH-02`
- **Risk:** alto; una fachada demasiado grande puede convertirse en nuevo monolito semántico.
- **Exit criteria:**
  - Existe una entrada read-only común y documentada para queries semánticas de features LSP.

---

# FASE B — Contexto, símbolo y receiver

## SEMANTIC-OWNER-01 — Scope/context resolver owner

- **Priority:** P2.
- **Status:** Open.
- **Area:** semantics, scope, context.
- **Problem:**
  - El contexto posicional se reparte entre `queryContext.ts`, `positionContext.ts`, `documentAnalysis.ts` y pequeñas recomputaciones en providers.
- **Goal:**
  - Consolidar el owner del scope/context activo para que features no recompongan callable, type, scope o policy por su cuenta.
- **Acceptance criteria:**
  - `queryContext.ts` y `positionContext.ts` quedan documentados como owners de contexto posicional y scope activo.
  - Providers no calculan callable/type activo salvo adapter mínimo.
  - El contexto incluye URI, position, callable, type, scope, sourceOrigin, consumer policy y confidence si aplica.
  - Tests cubren contexto dentro de función, evento, área declarativa, inherited member y fuera de callable.
  - No se añade IO, workspace scan ni parse completo.
- **Implementation notes:**
  - Priorizar extracción de helpers repetidos hacia owner existente.
  - No rediseñar `documentAnalysis.ts`.
  - No introducir otro modelo de snapshot.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
- **Dependencies:** `SEMANTIC-FACADE-01`.
- **Risk:** medio.
- **Exit criteria:**
  - Las features usan un contexto común y no duplican cálculo de scope/callable activo.

---

## SEMANTIC-OWNER-02 — Symbol resolution owner contract

- **Priority:** P2.
- **Status:** Open.
- **Area:** semantics, symbol-resolution.
- **Problem:**
  - `semanticQueryService.ts` es el owner natural, pero `definition.ts`, `queryContext.ts` y algunos providers mantienen lógica complementaria de resolución.
- **Goal:**
  - Definir contrato único para resolución de símbolos usado por features LSP.
- **Acceptance criteria:**
  - `semanticQueryService.ts` queda como owner de target resolution.
  - `SemanticQueryFacade` expone un método estable para resolver símbolo en posición/contexto.
  - El resultado incluye target, kind, sourceOrigin, confidence, reason codes y ambiguity si aplica.
  - Providers no implementan fallback global propio salvo adapter documentado.
  - Tests cubren locals, instance members, inherited members, globals, built-ins, unresolved y ambiguous.
- **Implementation notes:**
  - No mover toda la lógica de golpe; empezar por adapter común.
  - Mantener compatibility con existing tests de hover/definition/signatureHelp.
- **Tests:**
  - `npm run test:unit`
  - `npm test`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
- **Dependencies:**
  - `SEMANTIC-FACADE-01`
  - `SEMANTIC-OWNER-01`
- **Risk:** alto.
- **Exit criteria:**
  - Hay contrato único de symbol resolution y providers empiezan a consumirlo sin cambios visibles.

---

## SEMANTIC-OWNER-03 — Receiver type resolver owner

- **Priority:** P2.
- **Status:** Open.
- **Area:** semantics, receiver-resolution, type-resolution.
- **Problem:**
  - Receiver resolution está duplicado o repartido entre `queryContext.ts`, `completion.ts`, `signatureHelp.ts` y `dataWindowBindingModel.ts`.
  - Esto afecta `dw.method`, `object.member`, inherited members, dynamic receivers y DataWindow owners.
- **Goal:**
  - Consolidar receiver type resolution bajo un owner claro y reusable.
- **Acceptance criteria:**
  - Existe contrato `ReceiverTypeResolver` o equivalente, preferiblemente como parte de `SemanticQueryFacade`.
  - El owner resuelve receiver para:
    - `this`/current object;
    - instance variable;
    - local variable;
    - argument;
    - inherited member;
    - DataWindow/DataStore control;
    - dynamic/unknown receiver.
  - DataWindow-specific owner resolution se delega a `dataWindowBindingModel.ts` o futuro Bloque 6, no se duplica aquí.
  - Resultado incluye confidence y reason.
  - Providers `completion`, `signatureHelp`, `hover` y `definition` reducen lógica local de receiver resolution.
  - Tests cubren high-confidence, ambiguous y unknown.
- **Implementation notes:**
  - No implementar DataWindowFastContext completo en esta spec.
  - Coordinar con Bloque 6 para bindings avanzados.
  - Evitar inferencia agresiva de dinámicos.
- **Tests:**
  - `npm run test:unit`
  - `npm test`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
- **Dependencies:** `SEMANTIC-FACADE-01`.
- **Risk:** alto.
- **Exit criteria:**
  - Receiver resolution tiene owner explícito y las features dejan de inferir tipos por su cuenta salvo adapters mínimos.

---

# FASE C — Callables, inheritance y enums

## SEMANTIC-OWNER-04 — Callable/function/event resolver owner

- **Priority:** P2.
- **Status:** Open.
- **Area:** semantics, callable-resolution, signatureHelp.
- **Problem:**
  - Callables se resuelven desde `semanticQueryService.ts`, `signatureHelp.ts`, `diagnostics.ts` y catálogo, con lógica parcial repartida para funciones/eventos, built-ins, overloads y parámetros.
- **Goal:**
  - Consolidar la resolución de functions/events/callables para que hover, completion, signatureHelp, definition y diagnostics usen el mismo criterio.
- **Acceptance criteria:**
  - Existe contrato `CallableResolver` o equivalente.
  - Resuelve functions, events, built-ins, inherited/overridden callables y DataWindow callable high-confidence.
  - Devuelve firma normalizada, parámetros, return, owner, sourceOrigin, confidence y reason.
  - `signatureHelp` usa el contrato como consumer principal.
  - `hover` y `definition` pueden consultar el mismo contrato para callables.
  - No se duplica documentación; documentationService sigue siendo provider de textos.
  - Tests cubren workspace function, event, inherited callable, built-in, overload/ambiguous y DataWindow Retrieve high-confidence.
- **Implementation notes:**
  - No construir `SignatureHelpViewModel` aquí si ya pertenece a Bloque 4.
  - Mantener separación entre resolved callable y presentación visible.
- **Tests:**
  - `npm run test:unit`
  - `npm test`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
- **Dependencies:**
  - `SEMANTIC-FACADE-01`
  - `SEMANTIC-OWNER-03`
- **Risk:** alto.
- **Exit criteria:**
  - Callables tienen owner compartido y signatureHelp deja de contener resolución propietaria innecesaria.

---

## SEMANTIC-OWNER-05 — Inheritance traversal consolidation

- **Priority:** P2.
- **Status:** Open.
- **Area:** semantics, inheritance, hierarchy.
- **Problem:**
  - `InheritanceGraph.ts` es el owner natural, pero la auditoría detecta recorridos adicionales en CodeLens, hover lifecycle, hierarchy inspection y algunas features.
- **Goal:**
  - Consolidar traversal de ancestros, descendants, member closure, overrides y inherited members bajo `InheritanceGraph`.
- **Acceptance criteria:**
  - `InheritanceGraph.ts` queda documentado como owner único de traversal.
  - Features no recorren jerarquía manualmente salvo adapter trivial.
  - Existe API común para ancestor chain, inherited members, member closure, overrides y descendants si aplica.
  - Tests cubren ancestor chain, missing ancestor, override, inherited member y descendant lookup.
  - No se introducen queries globales costosas ocultas en APIs locales.
- **Implementation notes:**
  - Evitar refactor masivo de CodeLens/reports en la primera iteración.
  - Si hay consumers con necesidades especiales, documentar adapter específico.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
- **Dependencies:** `SEMANTIC-FACADE-01`.
- **Risk:** medio-alto.
- **Exit criteria:**
  - No quedan recorridos de jerarquía duplicados sin justificación.

---

## SEMANTIC-OWNER-06 — Enum context resolver owner

- **Priority:** P3.
- **Status:** Open.
- **Area:** semantics, enums, catalog.
- **Problem:**
  - Enum value/type lookup y expected enum context están parcialmente repartidos entre `enumeratedContext.ts`, `completion.ts`, `diagnostics.ts`, `semanticTokens.ts` y `SystemCatalog`.
- **Goal:**
  - Consolidar contexto esperado de enums y lookup de values/types en un owner claro.
- **Acceptance criteria:**
  - `enumeratedContext.ts` + `SystemCatalog` quedan como owners documentados.
  - Completion, diagnostics, semanticTokens y hover comparten la misma política de enum value/type.
  - Valores con `!` se tratan consistentemente.
  - DataWindow constants no se mezclan con enum values generales.
  - Tests cubren expected enum type, enum value completion, hover/semantic token enum y diagnostic de enum inválido.
- **Implementation notes:**
  - No mover datasets de catálogo.
  - No cambiar identidad de símbolos ni IDs generated/manual.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
- **Dependencies:**
  - `SEMANTIC-FACADE-01`
- **Risk:** medio.
- **Exit criteria:**
  - Enum context queda consistente entre completion, diagnostics, hover y semanticTokens.

---

# FASE D — Resultado común y adapters ligeros

## SEMANTIC-OWNER-07 — Resolution result model, confidence y reason codes

- **Priority:** P2.
- **Status:** Open.
- **Area:** semantics, result-model, confidence.
- **Problem:**
  - Cada feature puede representar target, confidence, ambiguity, reason y sourceOrigin de forma distinta.
  - Esto dificulta ViewModels, diagnostics, AI context bundles y cache keys.
- **Goal:**
  - Definir modelos comunes de resultado semántico resuelto para features y presentación.
- **Acceptance criteria:**
  - Existen tipos comunes como `ResolvedSymbol`, `ResolvedReceiver`, `ResolvedCallable`, `ResolvedEnumContext` o equivalentes.
  - Cada modelo incluye identity, kind, owner, sourceOrigin, confidence, reasonCodes y ambiguity cuando aplique.
  - Los modelos no contienen Markdown ni payload LSP.
  - ViewModels de Bloques 2/3/4 pueden consumir estos modelos sin consultar internals.
  - Tests cubren serialización/shape mínima y casos high/medium/low/unknown confidence.
- **Implementation notes:**
  - Ubicar en `src/server/knowledge/resolution` o capa shared server-side equivalente.
  - No mover contratos a `src/shared` salvo que el cliente los necesite realmente.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
- **Dependencies:**
  - `SEMANTIC-FACADE-01`
  - `SEMANTIC-OWNER-02`
- **Risk:** medio-alto.
- **Exit criteria:**
  - Features pueden compartir resultados semánticos sin inventar modelos propios.

---

## SEMANTIC-OWNER-08 — Provider adapters slim-down

- **Priority:** P2.
- **Status:** Open.
- **Area:** architecture, features, maintainability.
- **Problem:**
  - Providers actuales mezclan routing, readiness, queries, resolución residual, formatting y payload LSP.
  - Aunque Bloques 1-4 reducen parte de esto, falta un cierre arquitectónico para asegurar que providers quedan como adapters ligeros.
- **Goal:**
  - Reducir providers LSP a composición ligera sobre pipeline, semantic facade, owners y ViewModels.
- **Acceptance criteria:**
  - `hover.ts`, `completion.ts`, `signatureHelp.ts`, `definition.ts`, `references.ts`, `rename.ts`, `semanticTokens.ts` y `documentSymbols.ts` tienen responsabilidades documentadas.
  - Ningún provider contiene owner semántico duplicado salvo adapter justificado.
  - Formatting/presentation se delega a ViewModels/formatters específicos.
  - Readiness/budget/cache/stale guard se delega a pipeline/featureHandlers comunes.
  - Tests de architecture/import boundaries o code metrics detectan crecimiento no justificado.
- **Implementation notes:**
  - Ejecutar por slices: primero hover/definition/signatureHelp, luego completion, luego references/rename, luego symbols/tokens.
  - No convertir esta spec en refactor masivo; si crece, dividir en sub-specs por provider.
- **Tests:**
  - `npm run test:unit`
  - `npm test`
  - `npm run test:architecture:rapid`
  - `npm run test:architecture:metrics`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
  - `docs/testing.md`
- **Dependencies:**
  - `SEMANTIC-FACADE-01`
  - `SEMANTIC-OWNER-07`
- **Risk:** alto; slimming providers puede tocar muchas surfaces si no se divide.
- **Exit criteria:**
  - Providers críticos quedan como adapters ligeros o tienen backlog específico para terminar la extracción.

---

## Resultado esperado al cerrar el Bloque 5

Al cerrar este bloque deben cumplirse todas estas condiciones:

```text
1. Existe una fachada read-only de queries semánticas o equivalente.
2. Scope/context resolution tiene owner claro.
3. Symbol resolution tiene contrato común.
4. Receiver type resolution tiene owner explícito.
5. Callable/function/event resolution tiene owner explícito.
6. Inheritance traversal queda consolidado sobre InheritanceGraph.
7. Enum context queda consolidado sobre enumeratedContext/SystemCatalog.
8. Existen modelos comunes de resolved semantic result con confidence/reason/sourceOrigin.
9. Providers LSP quedan como adapters ligeros o tienen sub-spec específica pendiente.
10. No se ha creado un segundo KnowledgeBase, parser, catalog ni indexer.
11. No se ha implementado DataWindowFastContext dentro de este bloque.
12. docs/backlog/testing/architecture-implementation-map/architecture-status quedan alineados.
```

---

## Current focus recomendado si se decide activar este bloque

```markdown
# Current Focus — Semantic Query Foundation & Resolver Ownership

## Scope

- SEMANTIC-OWNERS-00
- SEMANTIC-FACADE-01
- SEMANTIC-OWNER-01
- SEMANTIC-OWNER-02

## Optional within same focus only if previous items are closed

- SEMANTIC-OWNER-03

## Explicitly out of scope

- DataWindowFastContext
- Presentation/ViewModel broad refactor
- AI context bundle redesign
- parser rewrite
- KnowledgeBase rewrite
- catalog schema changes
- completion/hover UX changes not needed by the owner extraction

## Exit criteria

- Semantic query facade exists and is read-only.
- Scope/context and symbol resolution owners are explicit.
- Providers start consuming facade/adapters without visible behavior regression.
- Tests and docs are aligned.
```

--