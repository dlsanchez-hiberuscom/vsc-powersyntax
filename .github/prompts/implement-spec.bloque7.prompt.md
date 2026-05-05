# BLOQUE 7 — Presentation, ViewModels & UX Contracts

> Objetivo: separar de forma estricta la resolución semántica de la presentación visible en LSP, creando contratos de ViewModel y formatters consistentes para `hover`, `completion`, `signatureHelp`, `definition`, diagnostics, semantic tokens y AI/context bundles, sin duplicar semántica ni generar payloads excesivos.

---

## Base técnica y patrones aplicados

Este bloque se basa en los hallazgos de `docs/architecture-implementation-map.md` y los bloques anteriores:

- `hover` ya tiene formateo visible repartido entre `hover.ts`, `hoverFormat.ts` y `documentationService.ts`.
- `completion` mezcla ranking, materialización, detail/documentation y payload inicial hasta que exista `completionItem/resolve`.
- `signatureHelp` genera `SignatureInformation`, documentación de parámetros y presentación desde el provider.
- `diagnostics` formatea mensajes y reason codes de forma feature-specific.
- `semanticTokens` clasifica símbolos para presentación visual, pero debe seguir consumiendo resolución/catálogo, no duplicarlos.
- AI/context bundles pueden necesitar modelos explicables, pero no deben saltarse la query layer ni generar su propia resolución.
- Los Bloques 1–6 crean la base de serving, hot path, HoverViewModel, CompletionListViewModel, SignatureHelpViewModel, SemanticQueryFacade y DataWindowFastContext.

Patrones externos aplicados:

- **Presentation Model / ViewModel:** separar estado y comportamiento de presentación de la lógica de dominio permite testabilidad, mantenibilidad y reutilización.
- **LSP payload discipline:** LSP transporta objetos JSON-RPC; las respuestas visibles deben estar compactas, estables y ajustadas al capability del cliente.
- **No presentation in semantic owners:** `KnowledgeBase`, `SemanticQueryService`, `SystemCatalog`, `DataWindowModel` e `InheritanceGraph` no deben producir Markdown, strings finales o payload LSP.
- **One resolved model, many projections:** un resultado semántico resuelto puede proyectarse a Hover, Completion, SignatureHelp, Diagnostic, SemanticToken o AI context sin volver a resolver.
- **Localization overlay:** locale/documentation overlay debe aplicarse en capa de presentación, no cambiar identidad de símbolos ni duplicar catálogo.

---

## Dependencia de Bloques previos

Este bloque depende conceptualmente de:

- `DEVTOOLS-HOVER-01` — Contrato compacto de HoverViewModel.
- `DEVTOOLS-COMP-01/02` — Completion inicial ligera y resolve.
- `DEVTOOLS-LSP-01` — SignatureHelpViewModel.
- `SEMANTIC-OWNER-07` — Resolution result model, confidence y reason codes.
- `DW-FAST-01` — DataWindowFastContext high-confidence, si aplica DataWindow.

Si las dependencias no están cerradas, este bloque debe limitarse a contratos y tests de presentación, sin reabrir semántica.

---

## Estado de ítems anteriores

### Relacionados pero NO sustituidos completamente

- `DEVTOOLS-HOVER-01` queda reforzado por `PRESENTATION-01` y `PRESENTATION-02`.
- `DEVTOOLS-COMP-03` queda reforzado por `PRESENTATION-01` y `PRESENTATION-03`.
- `DEVTOOLS-ARCH-01` queda parcialmente cubierto en la parte de formatting/presentation, pero sigue existiendo para owners semánticos.
- `AI-CONTRACT-*` se ejecutará después como Bloque 10, usando estos contratos de presentación/read models.

---

## Cadena recomendada — Bloque 7

Orden obligatorio dentro del bloque:

1. `PRESENTATION-01` — Contratos ViewModel comunes para features LSP.
2. `PRESENTATION-02` — Formatters LSP feature-specific sobre ViewModels.
3. `PRESENTATION-03` — Payload policy y compact rendering contract.
4. `PRESENTATION-04` — Localization/documentation overlay sin duplicar símbolos.
5. `PRESENTATION-05` — Diagnostics message model y reason-code formatting.
6. `PRESENTATION-06` — AI-readable presentation models sin acceso a internals.
7. `PRESENTATION-07` — Presentation regression matrix y snapshot policy.
8. `PRESENTATION-08` — Presentation ownership guard y provider slim-down.

---

# FASE A — Contratos ViewModel y formatters

## PRESENTATION-01 — Contratos ViewModel comunes para features LSP

- **Priority:** P1.
- **Status:** Open.
- **Area:** presentation, viewmodel, LSP, architecture.
- **Problem:**
  - Cada feature puede proyectar símbolos, callables, DataWindow info, confidence y documentation de forma distinta.
  - Sin contratos comunes, hover/completion/signatureHelp/diagnostics/AI pueden mostrar datos inconsistentes.
- **Goal:**
  - Definir una familia de ViewModels de presentación que consuman modelos semánticos resueltos sin hacer resolución propia.
- **Acceptance criteria:**
  - Existen contratos o tipos equivalentes para:
    - `HoverViewModel`;
    - `CompletionListViewModel`;
    - `CompletionResolveViewModel`;
    - `SignatureHelpViewModel`;
    - `DefinitionViewModel` si aporta valor;
    - `DiagnosticMessageViewModel`;
    - `SemanticTokenViewModel` o classification model si aplica;
    - `AiContextViewModel` o read model si aplica.
  - Todos los ViewModels consumen `ResolvedSymbol`, `ResolvedReceiver`, `ResolvedCallable`, `ResolvedEnumContext`, `DataWindowFastContext` o modelos equivalentes.
  - Ningún ViewModel consulta directamente `KnowledgeBase`, parser, indexer, filesystem o workspace discovery.
  - Ningún ViewModel almacena verdad semántica global.
  - ViewModels incluyen confidence/reason/sourceOrigin solo cuando aporta valor al consumer.
  - Tests verifican que ViewModels son puros, serializables/inspeccionables y libres de IO.
- **Implementation notes:**
  - Ubicar ViewModels en una capa server-side de presentation, no en `src/shared` salvo necesidad real del cliente.
  - Evitar que ViewModels sean clases con dependencias pesadas; preferir estructuras inmutables/POJOs y builders explícitos.
  - No meter Markdown final dentro del modelo salvo decisión justificada; preferir bloques estructurados.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
  - `docs/testing.md`
- **Dependencies:**
  - `SEMANTIC-OWNER-07`
  - `DEVTOOLS-HOVER-01`
  - `DEVTOOLS-COMP-01`
  - `DEVTOOLS-LSP-01`
- **Risk:** medio-alto; ViewModels demasiado ricos pueden convertirse en otro modelo semántico.
- **Exit criteria:**
  - Existe una capa de ViewModels común y documentada, separada de resolución y de LSP formatting.

---

## PRESENTATION-02 — Formatters LSP feature-specific sobre ViewModels

- **Priority:** P1.
- **Status:** Open.
- **Area:** presentation, formatting, LSP.
- **Problem:**
  - El formateo visible está repartido entre providers y servicios auxiliares, con riesgo de duplicar Markdown, details, documentation y warnings.
- **Goal:**
  - Consolidar formatters finales de LSP que conviertan ViewModels en respuestas LSP compactas y estables.
- **Acceptance criteria:**
  - Existen formatters explícitos para:
    - Hover → `LSP Hover` / `MarkupContent`;
    - Completion initial → `CompletionItem[]` / `CompletionList`;
    - Completion resolve → enriched `CompletionItem`;
    - SignatureHelp → `SignatureHelp`;
    - Diagnostics → `Diagnostic` message/details;
    - SemanticTokens → token classification/payload si aplica.
  - Formatters no hacen resolución semántica.
  - Formatters no hacen IO, workspace scan ni full parse.
  - Formatters no consultan `KnowledgeBase` directamente salvo excepción documentada.
  - Markdown/plaintext se elige según capabilities/feature contract cuando aplique.
  - Tests verifican salida compacta y estable.
- **Implementation notes:**
  - Reutilizar `hoverFormat.ts` como punto de partida, pero convertirlo en formatter sobre `HoverViewModel`.
  - Para completion, separar initial formatter de resolve formatter.
  - Para diagnostics, separar reason codes de wording visible.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/performance-budget.md`
- **Dependencies:**
  - `PRESENTATION-01`
- **Risk:** medio; mover formateo puede cambiar UX visible si no hay matriz de regresión.
- **Exit criteria:**
  - Providers dejan de formatear manualmente payloads LSP complejos y delegan en formatters feature-specific.

---

# FASE B — Payload, localization y diagnostics

## PRESENTATION-03 — Payload policy y compact rendering contract

- **Priority:** P2.
- **Status:** Open.
- **Area:** performance, payload, UX, presentation.
- **Problem:**
  - Hover, completion, signatureHelp, diagnostics y AI/context bundles pueden crecer en payload al añadir documentación, evidence, warnings y owner chains.
- **Goal:**
  - Definir política común de rendering compacto y budgets de payload por feature.
- **Acceptance criteria:**
  - Existe policy de payload por feature:
    - hover;
    - completion initial;
    - completion resolve;
    - signatureHelp;
    - diagnostics;
    - references/rename si aplica;
    - semanticTokens/documentSymbols si aplica;
    - AI/context bundles si aplica.
  - La policy define bloques permitidos, opcionales y prohibidos.
  - Evidence larga, rutas internas, JSON y dumps quedan prohibidos en UI normal.
  - Hay modo/debug/support bundle separado para evidencia extendida si procede.
  - Tests o gates validan payloadBytes aproximados.
- **Implementation notes:**
  - No duplicar `docs/performance-budget.md`; este backlog debe actualizarlo, no reemplazarlo.
  - Las reglas de payload deben ser accionables, no solo descriptivas.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:performance:gate`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/performance-budget.md`
  - `docs/testing.md`
  - `docs/architecture-implementation-map.md`
- **Dependencies:**
  - `DEVTOOLS-HOTPATH-04`
  - `PRESENTATION-01`
- **Risk:** medio.
- **Exit criteria:**
  - Payload visible queda presupuestado y verificado por feature.

---

## PRESENTATION-04 — Localization/documentation overlay sin duplicar símbolos

- **Priority:** P2.
- **Status:** Open.
- **Area:** localization, documentation, catalog, presentation.
- **Problem:**
  - El catálogo usa `generated`, `manual` y `localization`, pero la localización/documentación no debe duplicar símbolos ni traducir nombres reales de PowerBuilder.
  - Consumers pueden aplicar documentation/locale de forma distinta.
- **Goal:**
  - Centralizar overlay de documentación/localización en capa de presentación, manteniendo identidad semántica estable.
- **Acceptance criteria:**
  - La identidad de símbolos, built-ins, enums y DataWindow members no cambia por locale.
  - La localización solo afecta texto/documentación visible.
  - Fallback a documentación oficial/manual queda definido.
  - ViewModels pueden transportar locale/documentation blocks sin duplicar catálogo.
  - Formatters aplican overlay de forma consistente en hover, completion resolve y signatureHelp.
  - Tests cubren locale disponible, fallback y no traducción de nombres reales.
- **Implementation notes:**
  - No mover datos entre `generated/manual/localization`.
  - No crear IDs nuevos por idioma.
  - DocumentationService puede actuar como provider de textos, no como owner semántico.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/testing.md`
  - `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` si aplica.
- **Dependencies:**
  - `PRESENTATION-01`
  - `PRESENTATION-02`
- **Risk:** medio; localización mal aplicada puede duplicar catálogo o cambiar identidad semántica.
- **Exit criteria:**
  - Documentation/locale overlay es consistente y no altera símbolos.

---

## PRESENTATION-05 — Diagnostics message model y reason-code formatting

- **Priority:** P2.
- **Status:** Open.
- **Area:** diagnostics, presentation, reason-codes.
- **Problem:**
  - Diagnostics puede mezclar detección, reason codes, severity, wording y ayuda visible.
  - Si cada regla formatea mensajes por su cuenta, el ruido y la inconsistencia aumentan.
- **Goal:**
  - Separar diagnóstico semántico de mensaje visible mediante un modelo común de diagnostic presentation.
- **Acceptance criteria:**
  - Existe `DiagnosticMessageViewModel` o equivalente.
  - El modelo incluye code, severity, primary message, reason codes, confidence y optional help.
  - El wording visible se genera en formatter, no en resolver semántico profundo.
  - Diagnostics ruidosos o low-confidence se degradan o se ocultan según policy.
  - Tests cubren mensajes estables, confidence, sourceOrigin y no duplicación de ruido.
- **Implementation notes:**
  - No reescribir diagnostics engine entero.
  - Empezar por reglas que ya usan reason/confidence.
  - Separar mensaje corto de explanation extendida para panels/support bundles.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/testing.md`
  - `docs/architecture-implementation-map.md`
- **Dependencies:**
  - `SEMANTIC-OWNER-07`
  - `PRESENTATION-01`
- **Risk:** medio-alto; tocar diagnostics puede cambiar ruido visible.
- **Exit criteria:**
  - Diagnostics separa reason/model de wording visible.

---

# FASE C — AI-readable models y regresión de presentación

## PRESENTATION-06 — AI-readable presentation models sin acceso a internals

- **Priority:** P3.
- **Status:** Open.
- **Area:** AI, presentation, public-contracts.
- **Problem:**
  - AI tools/context bundles pueden necesitar información explicable, pero no deben acceder a internals semánticos ni formatear su propia versión de cada feature.
- **Goal:**
  - Definir modelos de presentación/read models aptos para AI, derivados de contratos públicos/read-only.
- **Acceptance criteria:**
  - AI/context bundles consumen ViewModels o read models públicos, no internals de `KnowledgeBase`/parser.
  - El modelo AI incluye confidence, evidence resumida y sourceOrigin cuando aplique.
  - No incluye payload UI excesivo ni dumps internos.
  - No permite mutación del core.
  - Tests verifican read-only y no bypass de query layer.
- **Implementation notes:**
  - No implementar herramientas IA nuevas aquí.
  - Solo preparar contratos de lectura si ya existen consumidores.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/ai/*` si existe documento aplicable.
- **Dependencies:**
  - `PRESENTATION-01`
  - `SEMANTIC-FACADE-01`
- **Risk:** medio.
- **Exit criteria:**
  - IA puede consumir presentación/read models sin saltarse contratos públicos.

---

## PRESENTATION-07 — Presentation regression matrix y snapshot policy

- **Priority:** P2.
- **Status:** Open.
- **Area:** testing, presentation, regression.
- **Problem:**
  - Cambios en ViewModels/formatters pueden modificar UX visible sin que los tests lo detecten.
- **Goal:**
  - Crear una matriz de regresión de presentación y una política de snapshots/structural assertions.
- **Acceptance criteria:**
  - Existe matriz de casos para hover, completion initial, completion resolve, signatureHelp y diagnostics.
  - Los tests validan bloques/campos esenciales sin ser frágiles ante wording menor.
  - Snapshots se usan solo donde aporten valor y sean estables.
  - Cada cambio intencional de UX actualiza test, docs y reason.
  - Payload regressions se cubren vía `PRESENTATION-03`/performance budget.
- **Implementation notes:**
  - Preferir assertions estructurales sobre snapshots de Markdown completo.
  - Separar tests de modelo y tests de formatter LSP.
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
- **Risk:** medio.
- **Exit criteria:**
  - UX visible queda protegida por tests mantenibles.

---

## PRESENTATION-08 — Presentation ownership guard y provider slim-down

- **Priority:** P2.
- **Status:** Open.
- **Area:** architecture, presentation, providers.
- **Problem:**
  - Aunque existan ViewModels/formatters, providers pueden seguir acumulando formatting, Markdown y payload logic.
- **Goal:**
  - Blindar ownership de presentación y reducir providers a adapters sobre ViewModel builders y formatters.
- **Acceptance criteria:**
  - Providers no construyen Markdown complejo directamente.
  - Providers no mezclan resolution + presentation + LSP payload salvo adapter trivial.
  - Tests/architecture guard detectan nuevos formatters ad hoc en providers críticos cuando exista patrón común.
  - `hover.ts`, `completion.ts`, `signatureHelp.ts`, `definition.ts`, diagnostics y semanticTokens tienen responsabilidades documentadas.
  - Excepciones quedan documentadas con reason.
- **Implementation notes:**
  - No mover todo en una sola PR/spec si crece demasiado.
  - Dividir por feature si toca muchos archivos.
- **Tests:**
  - `npm run test:architecture:rapid`
  - `npm run test:architecture:metrics`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
  - `docs/testing.md`
- **Dependencies:**
  - `PRESENTATION-01`
  - `PRESENTATION-02`
- **Risk:** medio-alto.
- **Exit criteria:**
  - Ownership de presentación queda claro y los providers dejan de crecer como formatters ad hoc.

---

## Resultado esperado al cerrar el Bloque 7

Al cerrar este bloque deben cumplirse todas estas condiciones:

```text
1. Existen contratos ViewModel comunes para features LSP críticas.
2. Los formatters LSP son feature-specific y trabajan sobre ViewModels.
3. Los owners semánticos no producen Markdown ni payload LSP.
4. Payload visible tiene policy compacta y budgets por feature.
5. Locale/documentation overlay no cambia identidad de símbolos ni duplica catálogo.
6. Diagnostics separa reason/model de wording visible.
7. AI/read models consumen contratos read-only y no internals.
8. Hay matriz de regresión de presentación mantenible.
9. Providers críticos no acumulan formatting/presentation ad hoc.
10. docs/backlog/testing/performance-budget/architecture-implementation-map quedan alineados.
```

---

## Current focus recomendado si se decide activar este bloque

```markdown
# Current Focus — Presentation, ViewModels & UX Contracts

## Scope

- PRESENTATION-01
- PRESENTATION-02
- PRESENTATION-03

## Optional within same focus only if previous items are closed

- PRESENTATION-04
- PRESENTATION-07

## Explicitly out of scope

- New semantic resolvers
- KnowledgeBase rewrite
- DataWindowFastContext implementation
- New AI tools
- Broad provider refactor beyond formatter extraction
- UX redesign not backed by tests/payload budgets

## Exit criteria

- ViewModel contracts exist and are presentation-only.
- LSP formatters consume ViewModels.
- Payload policy is documented and tested.
- Providers do not own complex formatting.
```

---
