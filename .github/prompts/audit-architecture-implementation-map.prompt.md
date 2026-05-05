# HARD FOLLOW-UP — Auditoría Parte 2 del Architecture Implementation Map

Actúa como **arquitecto senior de VS Code extensions, LSP, TypeScript, PowerBuilder/PowerScript, performance de language servers y documentación técnica**.

## OBJETIVO

Completar y endurecer la **Parte 2** de la auditoría arquitectónica ya iniciada.

Ya existe:

```text
docs/architecture-implementation-map.md
```

Ese documento es una buena base, pero está demasiado agregado en módulos críticos. Debes completarlo con análisis real de código, especialmente en:

- módulos LSP interactivos;
- caches;
- hot paths;
- duplicidades de resolvers;
- completion sin resolve provider;
- riesgos reales de payload, formatter y cache miss;
- backlog accionable para migración incremental.

NO rehagas el documento desde cero.
NO borres secciones útiles existentes.
Amplía, corrige y completa lo que falta.

---

# REGLAS DURAS

- NO preguntes.
- NO pares hasta terminar.
- NO hagas refactor grande.
- NO inventes arquitectura.
- NO describas arquitectura ideal como implementada.
- NO cambies código productivo salvo correcciones menores, seguras y justificadas.
- Usa código real.
- Usa nombres reales de archivos, clases, funciones, handlers y servicios.
- Si algo no existe, márcalo como `missing`.
- Si algo existe parcialmente, márcalo como `partial`.
- Si no puedes verificar algo, márcalo como `unknown` y explica qué falta.
- No dejes hallazgos solo dentro del mapa: si implican trabajo real, actualiza `docs/backlog.md`.
- No cambies `docs/current-focus.md` salvo que la auditoría pase explícitamente a foco activo.
- No dupliques contenido entre documentos.
- Ejecuta validación real al final.

---

# FASE 1 — Revisar el mapa actual y detectar gaps

Lee completo:

```text
docs/architecture-implementation-map.md
```

Identifica qué partes ya están bien y qué partes están incompletas.

Debes comprobar si el documento actual cubre con suficiente detalle:

- inventario módulo por módulo;
- estado `implemented / partial / missing / unknown`;
- entry points reales;
- cache hit path;
- cache miss path;
- IO/workspace scan/parse en hot path;
- payload risk;
- cancellation token usage;
- tests existentes y faltantes;
- duplicidades reales entre features;
- backlog real derivado.

No escribas un resumen superficial. Completa el documento.

---

# FASE 2 — Expandir inventario por módulo crítico

Añade o amplía fichas individuales en `docs/architecture-implementation-map.md` para estos módulos.

## Módulos LSP/features

- Hover
- Completion
- Completion Resolve
- Signature Help
- Diagnostics
- Definition
- References
- Rename
- Document Symbols
- Workspace Symbols
- Semantic Tokens
- CodeLens, si existe

## Handlers y lifecycle

- FeatureHandlers
- DocumentHandlers
- LifecycleHandlers
- BuildCommandHandlers
- RuntimeCommandHandlers
- ReportCommandHandlers

## Indexación, parsing y análisis

- WorkspaceIndexer
- Workspace discovery
- Watched file intake/bridge
- DocumentModel
- SectionMachine
- StatementSplitter
- SR container parser
- DocumentAnalysis
- AnalysisCache
- DiagnosticScheduler

## Knowledge, query y caches

- KnowledgeBase
- DocumentCache
- HotContextCache
- ServingCache
- SemanticQueryService
- PositionContext
- InheritanceGraph
- QueryScopePolicy
- ServingReadiness / FeatureReadiness

## Catálogo y PowerBuilder system knowledge

- SystemCatalog
- generated catalog
- manual overlays
- localization overlays
- PowerBuilder built-ins
- enumerated values/types
- DataWindow built-ins

## DataWindow

- DataWindow model
- DataWindow binding model
- DataWindow column access
- DataWindow property paths
- DataWindow safe mode
- DataWindow SQL lineage

## Runtime/build/testing

- Scheduler
- Backpressure policy
- Memory budgets / memory pressure policy
- Runtime journal / runtime health
- Cache persistence/checkpoint/journal
- PBAutoBuild runner/parser/problems
- ORCA runner/staging import/export
- package/release scripts
- VSIX verification
- CI workflows, si existen
- Testing infrastructure

Para cada ficha usa este formato obligatorio:

```markdown
### <Nombre del módulo>

Qué es:

- Explicación breve en español.

Archivos reales:

- `...`

Entry points:

- `...`

Responsabilidades reales:

- ...

No debe hacer:

- ...

Consumidores:

- ...

Dependencias:

- ...

Caches usadas:

- ...

Modelo de invalidación:

- ...

Hot path:

- sí / no / parcial

IO / workspace scan / parse:

- ...

Cancellation token:

- usado / no usado / no aplica / unknown

Payload risk:

- bajo / medio / alto / no aplica

Tests existentes:

- ...

Tests faltantes:

- ...

Duplicidades:

- ...

Riesgos:

- ...

Acción recomendada:

- ...

Estado:

- implemented / partial / missing / unknown
```

---

# FASE 3 — Estado explícito de caches recomendadas

Añade una sección específica en `docs/architecture-implementation-map.md` llamada:

```markdown
## Estado explícito de caches de serving recomendadas
```

Documenta, con estado y evidencia real:

```text
HoverViewModel cache
CompletionListViewModel cache
ActiveDocumentServingSnapshot
Negative hover cache
Completion resolve cache
ServingCache final response cache
HotContextCache active document cache
Catalog lookup cache
DataWindow model cache
Diagnostics cache
Semantic tokens cache
```

Para cada una usa:

```markdown
### <Nombre de cache>

Estado:

- implemented / partial / missing / unknown

Qué debería cachear:

- ...

Qué existe hoy:

- ...

Evidencia en código:

- `...`

Impacto:

- ...

Acción recomendada:

- ...
```

Punto crítico:

- Si `ServingCache` cachea resultados de feature pero no existe una cache específica de presentación final tipo `HoverViewModel`, dilo claramente.
- Si `HotContextCache` cubre parte de `ActiveDocumentServingSnapshot` pero no todo, márcalo como `partial`.
- Si `Completion Resolve` no está anunciado en capabilities, marca `Completion resolve cache` como `missing` o `not applicable until resolveProvider exists`.

---

# FASE 4 — Auditoría real de hot path con cache hit y cache miss

Añade o amplía una sección:

```markdown
## Hot path audit — cache hit vs cache miss
```

Analiza obligatoriamente:

- Hover
- Completion
- Signature Help
- Definition
- References
- Diagnostics incrementales
- Semantic Tokens
- Document Symbols

Para Hover, Completion y SignatureHelp el detalle debe ser mayor.

Usa este formato:

```markdown
### <Feature>

Cache hit path:

```text
request
  -> ...
  -> cached response
```

Cache miss path:

```text
request
  -> ...
  -> provider
  -> resolver/query/catalog/formatter
  -> cache write
  -> response
```

IO en hot path:

- sí/no/unknown + evidencia

Workspace scan en hot path:

- sí/no/unknown + evidencia

Full parse en hot path:

- sí/no/unknown + evidencia

Formatter cost risk:

- bajo/medio/alto + motivo

Payload risk:

- bajo/medio/alto + motivo

Cancellation/stale request handling:

- ...

Tests existentes:

- ...

Tests faltantes:

- ...

Riesgo principal:

- ...

Acción recomendada:

- ...
```

Para Completion, debes destacar explícitamente si:

- no existe `completionItem/resolve`;
- toda la documentación/detalle se envía en la respuesta inicial;
- existe riesgo de payload grande;
- existe ranking/dedupe repetido;
- se puede migrar incrementalmente a `resolveProvider`.

Para Hover, debes destacar explícitamente si:

- se cachea la respuesta final o solo datos semánticos;
- hay formatter Markdown caro en cache miss;
- hay hover compacto o demasiado informativo;
- existe negative hover cache o no.

---

# FASE 5 — Auditoría real de duplicidades

Añade o amplía una sección:

```markdown
## Auditoría de responsabilidades duplicadas
```

No basta con decir “hay ServingCache”.

Revisa código real y documenta si estas responsabilidades están duplicadas entre features:

- symbol resolution;
- scope/context resolution;
- receiver type resolution;
- callable/function/event resolution;
- overload/override resolution;
- inheritance resolution;
- DataWindow binding resolution;
- catalog/built-in lookup;
- enum value/type lookup;
- hover formatting;
- completion formatting/ranking;
- signature formatting;
- diagnostics message formatting;
- AI explain/context formatting.

Para cada responsabilidad usa:

```markdown
### <Responsabilidad>

Qué es:

- Explicación breve.

Implementaciones encontradas:

- `...`

Owner esperado:

- ...

Duplicidad real:

- sí / no / parcial / unknown

Riesgo:

- bajo / medio / alto

Acción recomendada:

- ...

Backlog:

- crear / actualizar / no aplica
```

---

# FASE 6 — Backlog real, no solo notas dentro del mapa

Actualiza `docs/backlog.md` con hallazgos reales.

No dejes el trabajo pendiente solo como “backlog derivado no promovido” dentro del mapa.

Crea o actualiza entradas concretas, si no existen ya, para:

```text
DEVTOOLS-PERF-01 — Instrumentar latencia real hover/completion/signatureHelp
DEVTOOLS-PERF-02 — HoverFastPath + HoverViewModel cache
DEVTOOLS-PERF-03 — Negative hover cache
DEVTOOLS-PERF-04 — Completion lightweight + completion resolve
DEVTOOLS-PERF-05 — CompletionListViewModel cache
DEVTOOLS-PERF-06 — ActiveDocumentServingSnapshot
DEVTOOLS-PERF-07 — Tests no IO/no workspace scan/no full parse en providers interactivos
DEVTOOLS-ARCH-01 — Auditar/unificar duplicidades de resolvers
DEVTOOLS-DW-01 — DataWindow fast mode para hot path interactivo
DEVTOOLS-UX-01 — Hover compacto por tipo de símbolo
```

Reglas:

- Usa el formato real del backlog existente.
- No dupliques entradas existentes.
- Si ya existen entradas equivalentes, actualízalas.
- Si un hallazgo está ya cubierto por otro backlog, enlázalo o referencia su ID.
- No cambies prioridades arbitrariamente si el backlog ya tiene criterio claro.
- Si una mejora no debe promoverse todavía, déjala Open pero no la pongas en current-focus.

Cada entrada debe incluir al menos:

- Priority
- Status
- Area
- Problem
- Goal
- Acceptance criteria
- Tests
- Docs
- Dependencies
- Risk

---

# FASE 7 — Actualizar documentación relacionada

Actualiza solo si aplica:

```text
docs/architecture-status.md
docs/testing.md
docs/performance-budget.md
docs/current-focus.md
```

Reglas:

- `architecture-status.md`: reflejar que el mapa se ha completado con Parte 2 si procede.
- `testing.md`: añadir gaps de tests si son relevantes y no están ya cubiertos.
- `performance-budget.md`: añadir métricas o criterios si faltan para hover/completion/signatureHelp.
- `current-focus.md`: NO cambiar salvo decisión explícita de promover esta auditoría a foco activo.
- No duplicar contenido.

---

# FASE 8 — Validación

Ejecuta scripts reales de `package.json`.

Obligatorio intentar:

```bash
npm run compile
npm test
npm run test:unit
npm run test:architecture:rapid
npm run test:docs:drift
```

Si existen y aplican, ejecuta también:

```bash
npm run test:performance
npm run test:performance:gate
npm run release:verify
```

No inventes scripts.
Si un script no existe, indícalo.
Si un script falla, documenta:

- comando;
- error resumido;
- causa probable;
- si está relacionado con esta auditoría;
- acción recomendada o backlog.

---

# RESULTADO FINAL OBLIGATORIO

Entrega resumen final con:

1. Cambios realizados en `docs/architecture-implementation-map.md`.
2. Módulos ampliados.
3. Estado explícito de caches recomendadas.
4. Hot paths revisados con cache hit/cache miss.
5. Duplicidades reales encontradas.
6. Backlog creado o actualizado.
7. Docs relacionadas actualizadas.
8. Validación ejecutada.
9. Scripts inexistentes o fallidos.
10. Riesgos restantes.
11. Próximo paso recomendado.

NO finalices si falta cualquiera de estos puntos:

- Hover ampliado.
- Completion ampliado.
- Completion Resolve documentado como implemented / partial / missing / unknown.
- SignatureHelp ampliado.
- Caches recomendadas documentadas con estado explícito.
- Hot paths documentados con cache hit/cache miss.
- Duplicidades reales auditadas.
- `docs/backlog.md` actualizado si hay hallazgos.
- Validación ejecutada o justificada.
