# BLOQUE 3 — Completion Ultra-Fast & Modern LSP Resolve

> Objetivo: convertir `completion` en una feature extremadamente rápida, contextual, estable y moderna, reduciendo payload inicial, adoptando `completionItem/resolve` para detalles caros, cacheando listas finales y consolidando ranking/dedupe sin duplicar semántica.

---

## Base técnica y patrones aplicados

Este bloque se basa en los hallazgos de `docs/architecture-implementation-map.md`:

- `completion` está implementado en `src/server/features/completion.ts` y cableado desde `src/server/handlers/featureHandlers.ts`.
- `completion` usa `ServingCache`, `KnowledgeBase`, `SystemCatalog`, `queryContext`, `queryScopePolicy` y contexto activo.
- `completion` tiene budget aproximado de 50 ms, scope `project` y `resultCap = 200`.
- El servidor no anuncia `completionProvider.resolveProvider`.
- No existe `connection.onCompletionResolve(...)`.
- Toda la información visible de completion se concentra en la primera respuesta.
- No existe `CompletionListViewModel cache` separado.
- La LRU final compartida de `ServingCache` puede mezclar entradas de completion con hover/signatureHelp/definition.
- Ranking, dedupe y materialización de items deben quedar claramente separados de la resolución semántica.

Patrones externos aplicados:

- **Completion inicial ligera:** la respuesta inicial debe contener lo necesario para mostrar, filtrar, ordenar e insertar sin documentación larga.
- **CompletionItem/resolve:** cuando calcular documentación o detalle es caro, LSP permite diferirlo a `completionItem/resolve` cuando el usuario selecciona un ítem.
- **Propiedades estables antes de resolve:** `sortText`, `filterText`, `insertText`, `textEdit` y ranking deben estar ya en la respuesta inicial y no cambiar durante resolve.
- **CompletionListViewModel:** la lista final debe poder cachearse como modelo de presentación/ranking, no como fuente semántica.
- **Ranking determinista:** local, arguments, instance, inherited, globals, built-ins, enums y DataWindow deben ordenarse de forma estable y testeable.
- **Payload budget:** completion es una de las respuestas con mayor riesgo de payload grande; debe medirse y limitarse.

---

## Dependencia de Bloques previos

Este bloque asume cerrado o implementado el primer slice del Bloque 1:

- `DEVTOOLS-HOTPATH-01` — Observabilidad real de serving interactivo.
- `DEVTOOLS-HOTPATH-02` — Guards no IO/no workspace scan/no full parse.

Para ejecutar `DEVTOOLS-COMP-03` con seguridad, se recomienda que estén disponibles:

- `DEVTOOLS-SERVING-01` — InteractiveServingPipeline modular.
- `DEVTOOLS-SERVING-02` — ServingCacheRouter con particiones por feature.
- `DEVTOOLS-SERVING-04` — ViewModel cache key contract.

Para integrar DataWindow completions avanzados de forma segura, este bloque debe coordinarse después con el Bloque 6, pero no debe implementar `DataWindowFastContext` aquí.

---

## Estado de ítems anteriores

Los siguientes ítems quedan absorbidos por este bloque si se incorpora la nueva cadena.

### Superseded

- `DEVTOOLS-PERF-04` → `DEVTOOLS-COMP-01` + `DEVTOOLS-COMP-02`
- `DEVTOOLS-PERF-05` → `DEVTOOLS-COMP-03` + `DEVTOOLS-SERVING-02`

### Relacionados pero NO sustituidos aquí

- `DEVTOOLS-DW-01` se ejecutará después como Bloque 6 / DataWindow Fast Mode.
- `DEVTOOLS-ARCH-01` se ejecutará después como bloque de owners semánticos y formatters.
- `DEVTOOLS-HOTPATH-04` debe aportar payload budget, pero no sustituye este bloque.

---

## Cadena recomendada — Bloque 3

Orden obligatorio dentro del bloque:

1. `DEVTOOLS-COMP-01` — Completion inicial ligera sin cambiar contrato LSP.
2. `DEVTOOLS-COMP-02` — CompletionItem/resolve para documentación y detalle caros.
3. `DEVTOOLS-COMP-03` — CompletionListViewModel cache o partición explícita.
4. `DEVTOOLS-COMP-04` — Completion ranking precomputado y dedupe estable.
5. `DEVTOOLS-COMP-05` — Completion context matrix y payload regression tests.
6. `DEVTOOLS-COMP-06` — Completion resolve observability y stale safety.

---

# FASE A — Reducir payload inicial sin romper UX

## DEVTOOLS-COMP-01 — Completion inicial ligera sin cambiar contrato LSP

- **Priority:** P1.
- **Status:** Open.
- **Area:** completion, performance, payload, UX.
- **Problem:**
  - La primera respuesta de completion concentra información visible, detalle, documentación y payload porque todavía no existe `completionItem/resolve`.
  - Esto aumenta riesgo de latencia percibida, serialización grande y evictions en `ServingCache`.
- **Goal:**
  - Reducir payload inicial manteniendo comportamiento actual, ranking, precisión y compatibilidad LSP.
- **Acceptance criteria:**
  - La respuesta inicial conserva, para cada item, las propiedades necesarias para mostrar, filtrar, ordenar e insertar:
    - `label`;
    - `kind`;
    - `sortText`;
    - `filterText` si aplica;
    - `insertText` o `textEdit` si aplica;
    - `data` mínimo y estable si se prepara futuro resolve.
  - Se reduce documentación larga en items donde no sea imprescindible.
  - No se introduce todavía `resolveProvider` ni `onCompletionResolve`.
  - No cambia ranking ni precisión funcional.
  - No se pierden completions de variables locales, argumentos, instance members, inherited members, globals, built-ins, enums o DataWindow high-confidence existentes.
  - Si `DEVTOOLS-HOTPATH-01` está cerrado, se registra payload antes/después.
  - Si `DEVTOOLS-HOTPATH-04` está cerrado, se respeta el budget de payload inicial.
- **Implementation notes:**
  - Preferir documentación corta o `detail` mínimo en la lista inicial.
  - Preparar `CompletionItem.data` solo si no aumenta payload de forma significativa.
  - No adelantar el handler resolve en esta spec.
  - No mover propiedades que VS Code/LSP necesitan antes del resolve.
- **Tests:**
  - `npm run test:unit`
  - `npm test`
  - `npm run test:architecture:rapid`
  - `npm run test:performance:gate`
- **Suggested test coverage:**
  - Orden local > arguments > instance > inherited > globals > built-ins.
  - Completion de enum values con `!`.
  - Completion de built-ins oficiales.
  - Completion de DataWindow/DataStore methods con receiver válido.
  - No duplicados.
  - Payload inicial reducido o dentro de budget.
  - No regresión de insertText/textEdit.
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-HOTPATH-01`
  - `DEVTOOLS-HOTPATH-02`
- **Risk:** medio; aligerar demasiado puede ocultar información útil o romper expectativas de IntelliSense.
- **Exit criteria:**
  - Completion inicial es más ligera, mantiene ranking/precisión y deja preparada la transición a resolve.

---

## DEVTOOLS-COMP-05 — Completion context matrix y payload regression tests

- **Priority:** P2.
- **Status:** Open.
- **Area:** completion, testing, payload, UX.
- **Problem:**
  - Completion tiene muchos contextos PowerBuilder y puede degradarse si ranking, dedupe o payload cambian sin matriz de regresión.
- **Goal:**
  - Crear matriz de regresión para contextos de completion y presupuestos de payload.
- **Acceptance criteria:**
  - Existe una matriz de contextos de completion para:
    - scope local;
    - argumentos;
    - instance variables;
    - functions/events del objeto actual;
    - inherited members;
    - global functions;
    - built-ins;
    - enum values/types;
    - DataWindow/DataStore receiver;
    - unknown/dynamic receiver;
    - string/comment/SQL/DataWindow boundaries cuando aplique.
  - Tests verifican ranking estable y ausencia de duplicados.
  - Tests verifican payload inicial dentro del budget.
  - Tests diferencian completion inicial y futuro resolve.
  - No se introducen snapshots frágiles si pueden usarse assertions estructurales.
- **Implementation notes:**
  - Usar helpers para inspeccionar items por `label`, `kind`, `sortText`, `detail`, `documentation` y payload aproximado.
  - Los tests deben poder ejecutarse sin corpora locales pesados; si requieren corpora, deben tener skip honesto.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/testing.md`
  - `docs/performance-budget.md`
  - `docs/architecture-implementation-map.md`
- **Dependencies:**
  - `DEVTOOLS-COMP-01`
  - `DEVTOOLS-HOTPATH-04`
- **Risk:** medio; tests demasiado rígidos pueden bloquear mejoras legítimas de ranking.
- **Exit criteria:**
  - Completion queda protegido contra regresiones de ranking, dedupe y payload.

---

# FASE B — Resolve diferido moderno

## DEVTOOLS-COMP-02 — CompletionItem/resolve para documentación y detalle caros

- **Priority:** P1.
- **Status:** Open.
- **Area:** completion, LSP, performance, resolve.
- **Problem:**
  - El servidor no anuncia `completionProvider.resolveProvider`.
  - No existe `connection.onCompletionResolve(...)`.
  - La primera respuesta de completion concentra detalle, documentación y payload que podrían diferirse.
- **Goal:**
  - Añadir segunda fase LSP para enriquecer solo el item seleccionado, sin duplicar resolución ni romper propiedades iniciales.
- **Acceptance criteria:**
  - `lifecycleHandlers.ts` anuncia `completionProvider.resolveProvider = true` solo cuando exista implementación real.
  - `featureHandlers.ts` registra `connection.onCompletionResolve(...)` o equivalente real.
  - La lista inicial no cambia en resolve propiedades necesarias para presentación, filtrado, orden e inserción:
    - `label`;
    - `sortText`;
    - `filterText`;
    - `insertText`;
    - `textEdit`;
    - ranking efectivo.
  - `CompletionItem.data` contiene una key estable, mínima y no pesada.
  - Resolve añade o completa principalmente `detail`, `documentation` y campos permitidos por capabilities.
  - Resolve reutiliza `KnowledgeBase`, `SemanticQueryService`, `SystemCatalog`, `DataWindowModel` y serving context existente.
  - Resolve no hace IO, workspace scan ni full parse.
  - Resolve respeta stale guard, locale, readiness y budgets.
  - Si resolve no puede enriquecer, devuelve el item original sin romper UX.
  - Tests cubren clientes con y sin `resolveSupport` avanzado si aplica.
- **Implementation notes:**
  - Diseñar `CompletionResolveService` o equivalente como adapter ligero.
  - No recalcular toda la lista en resolve.
  - No guardar payload grande dentro de `CompletionItem.data`.
  - Si el item viene sin data o con data stale, devolver el item original con fallback seguro.
  - Mantener compatibilidad con VS Code y LSP estándar.
- **Tests:**
  - `npm run test:unit`
  - `npm test`
  - `npm run test:architecture:rapid`
  - `npm run test:performance:gate`
- **Suggested test coverage:**
  - Resolve de built-in añade documentación.
  - Resolve de function/event añade firma/detalle.
  - Resolve de DataWindow method añade detalle seguro.
  - Resolve con data stale devuelve item original o degradado seguro.
  - Resolve no cambia `sortText`, `filterText`, `insertText` ni `textEdit`.
  - Resolve no hace IO/workspace scan/full parse.
  - Resolve respeta locale.
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-COMP-01`
  - `DEVTOOLS-HOTPATH-03`
  - `DEVTOOLS-HOTPATH-04`
- **Risk:** alto; una fase resolve mal integrada puede duplicar resolución, romper clientes LSP o introducir IO/parse en el segundo pase.
- **Exit criteria:**
  - Completion usa dos fases: lista inicial ligera y resolve seguro para detalle/documentación caros.

---

## DEVTOOLS-COMP-06 — Completion resolve observability y stale safety

- **Priority:** P2.
- **Status:** Open.
- **Area:** completion, observability, stale-safety.
- **Problem:**
  - Una vez añadido resolve, se necesita distinguir latencia y fallos entre completion inicial y completion resolve.
  - Resolve puede ejecutarse sobre items antiguos si cambia documento o KB.
- **Goal:**
  - Hacer visible y seguro el segundo pase de completion.
- **Acceptance criteria:**
  - Runtime stats distinguen `completion-initial` y `completion-resolve`.
  - Métricas incluyen `resolve-hit`, `resolve-miss`, stale discard, fallback original item y payloadBytes.
  - Resolve no escribe caches si el item/data está stale.
  - Si falla resolve, se registra reason resumido sin ruido masivo y se devuelve item seguro.
  - Support bundle/runtime health puede incluir resumen agregado si procede.
- **Implementation notes:**
  - Reutilizar la instrumentación de Bloque 1.
  - No añadir logs por item salvo debug explícito.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/testing.md`
  - `docs/performance-budget.md`
  - `docs/architecture-implementation-map.md`
- **Dependencies:**
  - `DEVTOOLS-COMP-02`
  - `DEVTOOLS-HOTPATH-01`
  - `DEVTOOLS-HOTPATH-03`
- **Risk:** medio; observabilidad excesiva puede añadir coste al segundo pase.
- **Exit criteria:**
  - El resolve es observable, stale-safe y no ruidoso.

---

# FASE C — Cache, ranking y dedupe

## DEVTOOLS-COMP-03 — CompletionListViewModel cache o partición explícita

- **Priority:** P2.
- **Status:** Open.
- **Area:** completion, serving-cache, memory, presentation-cache.
- **Problem:**
  - Completion comparte LRU final con hover/signatureHelp/definition.
  - Listas grandes de completion pueden expulsar entradas calientes de otras features.
  - No existe `CompletionListViewModel cache` ni partición específica defendible.
- **Goal:**
  - Cachear o particionar la lista final de completion de forma estable y compatible con `ServingCacheRouter`.
- **Acceptance criteria:**
  - Existe `CompletionListViewModel cache` o partición explícita de completion en `ServingCacheRouter`.
  - La cache almacena modelo de presentación/ranking, no verdad semántica.
  - Invalida por URI, documentVersion, `kbVersion/semanticEpoch`, sourceOrigin, locale, trigger kind, trigger character y prefix/context key.
  - Pressure policy no expulsa indiscriminadamente hover/signatureHelp por listas grandes.
  - Tests cubren hit, miss, eviction, pressure y stale invalidation.
  - La cache no duplica payload LSP completo si `ServingCache` ya guarda la response final, salvo decisión documentada y medida.
  - Compatible con completion resolve: initial list y resolved item tienen contratos separados.
- **Implementation notes:**
  - Preferir integración con `ServingCacheRouter` del Bloque 1.
  - El `CompletionListViewModel` debe poder materializar `CompletionItem[]` ligeros.
  - No almacenar documentación larga en el list cache si ahora vive en resolve.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:docs:drift`
- **Suggested test coverage:**
  - Cache hit por mismo context key.
  - Miss por cambio de prefix/trigger.
  - Invalidación por documentVersion.
  - Invalidación por semanticEpoch.
  - Eviction por pressure policy.
  - Completion cache no expulsa hover caliente de forma indiscriminada.
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `DEVTOOLS-COMP-02`
  - `DEVTOOLS-SERVING-02`
  - `DEVTOOLS-SERVING-04`
- **Risk:** medio-alto; una segunda caché mal diseñada puede fragmentar memoria o duplicar payload.
- **Exit criteria:**
  - Completion tiene cache/partición propia y medible sin perjudicar otras features interactivas.

---

## DEVTOOLS-COMP-04 — Completion ranking precomputado y dedupe estable

- **Priority:** P2.
- **Status:** Open.
- **Area:** completion, ranking, dedupe, performance.
- **Problem:**
  - Ranking y dedupe pueden repetirse por request o divergir entre contexts si no quedan materializados en el ViewModel.
- **Goal:**
  - Precomputar ranking, `sortText` y dedupe por contexto de completion.
- **Acceptance criteria:**
  - Ranking contextual queda definido y testeado para:
    - local variables;
    - arguments;
    - instance variables;
    - current object methods/events;
    - inherited members;
    - global functions;
    - built-ins;
    - enum values/types;
    - DataWindow/DataStore methods/properties high-confidence.
  - Dedupe ocurre antes de materializar payload LSP.
  - `sortText` no requiere recomputación cara por request.
  - El ranking no depende de orden accidental de Maps/objects.
  - Built-ins no desplazan símbolos locales relevantes.
  - Items ambiguos o low-confidence se colocan de forma conservadora y marcada si aplica.
- **Implementation notes:**
  - Definir `CompletionRankGroup` o equivalente.
  - Evitar ordenar con comparadores complejos en cada request si puede precomputarse.
  - La política debe ser estable entre cache hit/miss.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/testing.md`
  - `docs/performance-budget.md`
  - `docs/architecture-implementation-map.md`
- **Dependencies:**
  - `DEVTOOLS-COMP-03`
- **Risk:** medio; ranking mal calibrado puede degradar UX aunque sea rápido.
- **Exit criteria:**
  - Completion devuelve una lista estable, deduplicada y ordenada por relevancia PowerBuilder real.

---

## Resultado esperado al cerrar el Bloque 3

Al cerrar este bloque deben cumplirse todas estas condiciones:

```text
1. Completion inicial es ligera y mantiene ranking/precisión.
2. completionItem/resolve existe, está anunciado solo con implementación real y no rompe propiedades iniciales.
3. Detail/documentation caros se mueven al resolve cuando procede.
4. CompletionItem.data es mínimo, estable y stale-safe.
5. CompletionListViewModel cache o partición explícita está implementada y medida.
6. Ranking y dedupe son estables, testeados y precomputables por contexto.
7. Payload inicial y payload de resolve tienen budgets separados.
8. Completion no hace IO, workspace scan ni full parse en hot path caliente.
9. Resolve no hace IO, workspace scan ni full parse.
10. docs/backlog/testing/performance-budget/architecture-implementation-map quedan alineados.
```

---

## Current focus recomendado si se decide activar este bloque

```markdown
# Current Focus — Completion Ultra-Fast & Modern LSP Resolve

## Scope

- DEVTOOLS-COMP-01
- DEVTOOLS-COMP-02

## Optional within same focus only if previous items are closed

- DEVTOOLS-COMP-05
- DEVTOOLS-COMP-06

## Explicitly out of scope

- CompletionListViewModel cache final
- ServingCacheRouter redesign si no está cerrado el Bloque 1
- DataWindowFastContext
- broad resolver consolidation
- new parser or DataWindow parser changes

## Exit criteria

- Completion inicial ligera.
- completionItem/resolve implementado y anunciado correctamente.
- Resolve no cambia sort/filter/insert/textEdit ni ranking.
- Payload y tests alineados.
```

---