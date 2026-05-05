# BLOQUE 8 — Architectural Modularization, Boundaries & Composition Roots

> Objetivo: reforzar la estructura general del plugin para que siga siendo mantenible, rápido y seguro al crecer. Este bloque reduce riesgo arquitectónico en `extension.ts`, `server.ts`, handlers, client/server/shared boundaries, imports, composition roots, comandos, reports, build rails y documentación operativa, sin hacer un big-bang refactor.

---

## Base técnica y patrones aplicados

Este bloque se basa en los hallazgos de `docs/architecture-implementation-map.md` y los bloques anteriores:

- `src/client/extension.ts` sigue siendo una composition root amplia del cliente VS Code.
- `src/server/server.ts` sigue siendo una composition root amplia del servidor LSP.
- Ya existen extracciones útiles hacia `commandRegistration.ts`, handlers, runtime controllers, cache runtime, build handlers y report handlers.
- El cliente VS Code debe seguir siendo fino y no debe parsear PowerBuilder ni resolver semántica.
- El servidor LSP es el runtime principal de análisis, indexación, KnowledgeBase, caches, serving y features semánticas.
- `src/shared` debe contener contratos compartidos estables, no lógica server/client pesada.
- La auditoría detectó riesgo de ownership concentrado, reviews costosas y mayor probabilidad de romper contratos cruzados si las composition roots siguen creciendo.
- Los bloques 1–7 añaden nuevas piezas (`InteractiveServingPipeline`, ViewModels, SemanticQueryFacade, DataWindowFastContext, formatters) y hacen más importante blindar boundaries.

Patrones externos aplicados:

- **VS Code extension lifecycle:** VS Code recomienda activar extensiones solo cuando sean necesarias, usando activation events específicos para no cargar trabajo antes de tiempo.
- **Extension Host isolation:** VS Code ejecuta extensiones en Extension Host y permite separar procesos como language servers; el cliente debe mantenerse ligero y el trabajo pesado debe vivir en el servidor.
- **LSP client/server boundary:** el Language Client vive en la extensión y el Language Server corre como proceso/servicio separado para análisis costoso y features programáticas.
- **Boundaries y low coupling/high cohesion:** cada módulo debe tener una razón clara para cambiar; boundaries explícitas reducen acoplamiento y facilitan testing y evolución.
- **Architecture fitness functions:** las reglas arquitectónicas importantes deben ser tests/gates ejecutables, no solo convenciones de documentación.

---

## Dependencia de Bloques previos

Este bloque puede ejecutarse de forma incremental durante todo el roadmap, pero se recomienda después de tener al menos definidas las piezas de Bloques 1–7.

Dependencias recomendadas:

- `DEVTOOLS-SERVING-01` — InteractiveServingPipeline modular.
- `SEMANTIC-FACADE-01` — Fachada read-only de queries semánticas.
- `PRESENTATION-01` — Contratos ViewModel comunes.
- `PRESENTATION-02` — Formatters LSP feature-specific.
- `DW-BOUNDARY-01` — Frontera DataWindow.

Este bloque NO debe reimplementar esas piezas. Debe reforzar estructura, ownership, boundaries y composition roots.

---

## Estado de ítems anteriores

### Superseded / Reestructurado

- `IMAP-D2` → se reestructura en:
  - `ARCH-ROOT-01` — Composition roots como wiring mínimo.
  - `ARCH-ROOT-02` — Server composition modules por dominio.
  - `ARCH-ROOT-03` — Client activation y lazy controllers.
  - `ARCH-BOUNDARY-01` — Boundary rules entre client/server/shared.
  - `ARCH-GUARD-01` — Architecture import boundaries reforzados.
  - `ARCH-GUARD-02` — Composition root growth guard.

### Relacionados pero NO sustituidos aquí

- `LEGACY-GUARD-01` se ejecutará en el bloque de legacy/deuda estructural.
- `TEST-ARCH-*` se reforzará en el bloque de testing/performance gates.
- `AI-CONTRACT-*` se ejecutará en el bloque de AI/tools.

---

## Cadena recomendada — Bloque 8

Orden obligatorio dentro del bloque:

1. `ARCH-BOUNDARY-01` — Boundary rules entre client/server/shared.
2. `ARCH-ROOT-01` — Composition roots como wiring mínimo.
3. `ARCH-ROOT-02` — Server composition modules por dominio.
4. `ARCH-ROOT-03` — Client activation, lazy controllers y UI boundaries.
5. `ARCH-HANDLERS-01` — Handlers como adapters, services como owners.
6. `ARCH-MODULE-01` — Feature module ownership y public surface policy.
7. `ARCH-MODULE-02` — Build/report/runtime handlers sin semántica duplicada.
8. `ARCH-SHARED-01` — Shared contracts minimalistas y estables.
9. `ARCH-GUARD-01` — Architecture import boundaries reforzados.
10. `ARCH-GUARD-02` — Composition root growth guard.
11. `ARCH-DOCS-01` — Architecture map/status/backlog alignment.

---

# FASE A — Boundaries principales

## ARCH-BOUNDARY-01 — Boundary rules entre client/server/shared

- **Priority:** P1.
- **Status:** Open.
- **Area:** architecture, boundaries, imports.
- **Problem:**
  - Para crecer de forma segura, las fronteras `src/client`, `src/server` y `src/shared` deben ser explícitas y testeables.
  - El cliente debe seguir ligero; el servidor debe concentrar semántica; `shared` no debe convertirse en dumping ground.
- **Goal:**
  - Definir y blindar reglas de import/responsabilidad entre client, server y shared.
- **Acceptance criteria:**
  - `src/client/**` no importa `src/server/parsing`, `src/server/analysis`, `src/server/knowledge`, `src/server/features` ni runtime semántico.
  - `src/shared/**` no importa `src/client/**` ni `src/server/**`.
  - `src/server/**` puede importar `src/shared/**`, pero no debe depender de UI/client controllers.
  - `src/client/**` solo consume VS Code API, LanguageClient, command registration, UI controllers, support bundle y public API contracts.
  - Contratos compartidos son tipos/protocolos estables, no servicios con IO, VS Code API o KnowledgeBase.
  - Existe test/guard de arquitectura que falla ante imports prohibidos.
  - Docs reflejan boundaries y excepciones justificadas.
- **Implementation notes:**
  - Ampliar `architectureImports.test.ts` si existe.
  - No mover código masivamente en esta spec salvo imports triviales y seguros.
  - Si aparece una excepción legítima, documentarla con owner y reason.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:architecture:metrics`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
  - `docs/testing.md`
- **Dependencies:** ninguna dura.
- **Risk:** medio; reglas demasiado estrictas pueden bloquear adapters legítimos.
- **Exit criteria:**
  - Las fronteras client/server/shared quedan codificadas como tests y documentadas.

---

## ARCH-SHARED-01 — Shared contracts minimalistas y estables

- **Priority:** P2.
- **Status:** Open.
- **Area:** architecture, shared, contracts.
- **Problem:**
  - `src/shared` puede crecer con contratos útiles, pero también puede convertirse en un contenedor de lógica que acople cliente y servidor.
- **Goal:**
  - Definir política de `shared`: contratos, IDs, protocols y tipos puros; no lógica pesada.
- **Acceptance criteria:**
  - `src/shared` queda documentado como capa de contratos estables.
  - Permitido en `shared`:
    - IDs públicos;
    - protocol types;
    - sourceOrigin contract;
    - formatter/public API protocol si aplica;
    - tipos serializables usados por client/server.
  - Prohibido en `shared`:
    - VS Code API directa;
    - filesystem/IO;
    - parser;
    - KnowledgeBase;
    - SystemCatalog runtime;
    - DataWindow model runtime;
    - services con estado.
  - Tests/import guards verifican prohibiciones.
  - Se documenta criterio para mover algo a shared.
- **Implementation notes:**
  - No migrar tipos por estética; solo mover si hay consumidor real client/server.
  - Evitar circular dependencies.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
- **Dependencies:** `ARCH-BOUNDARY-01`.
- **Risk:** bajo-medio.
- **Exit criteria:**
  - `shared` queda como contrato minimalista y testeado.

---

# FASE B — Composition roots

## ARCH-ROOT-01 — Composition roots como wiring mínimo

- **Priority:** P1.
- **Status:** Open.
- **Area:** architecture, composition-root, maintainability.
- **Problem:**
  - `src/client/extension.ts` y `src/server/server.ts` siguen siendo archivos grandes y puntos de decisión amplios.
  - Son composition roots necesarias, pero no deben seguir acumulando lógica nueva.
- **Goal:**
  - Convertir composition roots en wiring mínimo y desplazar responsabilidades a modules/controllers/services con ownership claro.
- **Acceptance criteria:**
  - `extension.ts` y `server.ts` quedan documentados como composition roots.
  - No contienen lógica semántica, parsing, formatting, business rules ni build/report internals.
  - Nuevas capacidades se registran mediante modules específicos, no añadiendo bloques grandes inline.
  - Existe growth guard o métricas de tamaño/complejidad para detectar crecimiento no justificado.
  - Si se extrae código, se hace por slices pequeños y con tests verdes.
- **Implementation notes:**
  - No hacer big-bang split.
  - Empezar por extraer wiring repetitivo o registradores por dominio.
  - Mantener nombres y exports estables cuando sea posible.
- **Tests:**
  - `npm run test:architecture:metrics`
  - `npm run test:architecture:rapid`
  - `npm run test:unit`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
  - `docs/testing.md`
- **Dependencies:** `ARCH-BOUNDARY-01`.
- **Risk:** medio-alto; extraer wiring puede romper activación o initialize LSP si se hace sin slices.
- **Exit criteria:**
  - Composition roots quedan como wiring y futuras expansiones tienen destino modular claro.

---

## ARCH-ROOT-02 — Server composition modules por dominio

- **Priority:** P2.
- **Status:** Open.
- **Area:** architecture, server, composition.
- **Problem:**
  - `server.ts` compone connection, documents, caches, runtime, handlers, build runners, reports, watcher intake y KnowledgeBase.
  - Aunque parte está extraída, sigue existiendo concentración de wiring.
- **Goal:**
  - Separar composición server-side por dominios sin alterar comportamiento.
- **Acceptance criteria:**
  - Existen modules/factories de composición para dominios como:
    - LSP lifecycle/document handlers;
    - feature handlers;
    - runtime/cache/journal/health;
    - workspace discovery/indexing/watchers;
    - build/ORCA/PBAutoBuild rails;
    - reports/tools;
    - AI/public API tools si existen.
  - `server.ts` mantiene el orden de initialize/discovery/indexing actual.
  - No se duplican singletons ni caches.
  - No cambia protocol capabilities salvo spec explícita.
  - Smoke/integration siguen verdes.
- **Implementation notes:**
  - Extraer solo wiring y creation functions.
  - Evitar mover lógica interna de handlers en esta spec.
  - Mantener dependencias explícitas en interfaces/params.
- **Tests:**
  - `npm run test:unit`
  - `npm test`
  - `npm run test:architecture:rapid`
  - `npm run test:architecture:metrics`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
- **Dependencies:**
  - `ARCH-ROOT-01`
- **Risk:** alto; composición server mal extraída puede romper startup/indexing.
- **Exit criteria:**
  - Server composition queda dividida por dominio y `server.ts` solo orquesta wiring.

---

## ARCH-ROOT-03 — Client activation, lazy controllers y UI boundaries

- **Priority:** P2.
- **Status:** Open.
- **Area:** architecture, client, activation, UX.
- **Problem:**
  - `extension.ts` concentra activación, LanguageClient, API pública, lazy controllers, status, panels y commands.
  - VS Code recomienda activation lazy y específica; el cliente debe mantener coste bajo.
- **Goal:**
  - Reforzar activación ligera, lazy controllers y fronteras UI/client.
- **Acceptance criteria:**
  - Activación usa eventos específicos y no eager activation innecesaria.
  - Controllers de Object Explorer, Current Object Context, Diagnostics Explainability, status y support bundle permanecen lazy cuando proceda.
  - `extension.ts` delega command registration, UI controllers y public API export a modules específicos.
  - Cliente no parsea PowerBuilder ni resuelve semántica.
  - Workspace Trust / Restricted Mode queda documentado si aplica a build/ORCA/external runners.
  - Smoke de activación y runtime self-test siguen verdes.
- **Implementation notes:**
  - Revisar `package.json activationEvents` antes de tocar código.
  - No crear Webviews nuevas si Tree View o command suffice.
  - No mover server-side logic al cliente.
- **Tests:**
  - `npm run test:smoke`
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
  - `docs/developer-workflows.md` si aplica.
- **Dependencies:**
  - `ARCH-BOUNDARY-01`
  - `ARCH-ROOT-01`
- **Risk:** medio; cambios de activación pueden impedir que el plugin arranque o registre comandos.
- **Exit criteria:**
  - Cliente mantiene activación ligera, lazy controllers y boundaries limpias.

---

# FASE C — Handlers, modules y ownership

## ARCH-HANDLERS-01 — Handlers como adapters, services como owners

- **Priority:** P2.
- **Status:** Open.
- **Area:** architecture, handlers, services.
- **Problem:**
  - Handlers LSP y command handlers pueden acumular policy, routing, serving, métricas, resolución y formatting.
  - Con los bloques nuevos, handlers deben quedar como adapters sobre services/pipelines.
- **Goal:**
  - Definir y aplicar regla: handlers enrutan y adaptan; services poseen lógica real.
- **Acceptance criteria:**
  - `lifecycleHandlers`, `documentHandlers`, `featureHandlers`, `buildCommandHandlers`, `reportCommandHandlers` y `runtimeCommandHandlers` tienen responsabilidades documentadas.
  - Handlers no contienen lógica semántica profunda ni formatting complejo.
  - Feature handlers delegan serving/cache/metrics a pipeline común cuando exista.
  - Build/report/runtime handlers delegan lógica a services/runners propios.
  - Tests/metrics detectan crecimiento no justificado.
- **Implementation notes:**
  - No extraer todo en un paso.
  - Empezar por featureHandlers si Bloque 1 ya introdujo pipeline.
  - Mantener request/response contracts estables.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:architecture:metrics`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
- **Dependencies:**
  - `ARCH-ROOT-01`
  - `DEVTOOLS-SERVING-01` recomendado.
- **Risk:** medio-alto.
- **Exit criteria:**
  - Handlers críticos quedan como adapters o tienen sub-specs claras para terminar la extracción.

---

## ARCH-MODULE-01 — Feature module ownership y public surface policy

- **Priority:** P2.
- **Status:** Open.
- **Area:** architecture, features, module-ownership.
- **Problem:**
  - `src/server/features` contiene providers, policies, reports, DataWindow helpers y planning tools.
  - Sin public surface policy, módulos pueden importar internals de otros modules o duplicar owners.
- **Goal:**
  - Definir ownership y superficie pública por feature/module.
- **Acceptance criteria:**
  - Cada feature/module crítico tiene owner documentado:
    - hover;
    - completion;
    - signatureHelp;
    - definition/references/rename;
    - documentSymbols/workspaceSymbols;
    - semanticTokens;
    - diagnostics;
    - DataWindow;
    - reports/planning.
  - Cada módulo define qué exports son públicos para otros módulos y qué internals no deben importarse.
  - Imports cruzados entre features están prohibidos salvo through shared service/facade/adapter.
  - Tests/import guards detectan imports directos no permitidos si hay tooling.
- **Implementation notes:**
  - No crear index barrels indiscriminados si aumentan ciclos.
  - Preferir explicit imports desde owners/services.
- **Tests:**
  - `npm run test:architecture:rapid`
  - `npm run test:architecture:metrics`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
- **Dependencies:** `ARCH-BOUNDARY-01`.
- **Risk:** medio.
- **Exit criteria:**
  - Features tienen ownership y public surface policy clara.

---

## ARCH-MODULE-02 — Build/report/runtime handlers sin semántica duplicada

- **Priority:** P3.
- **Status:** Open.
- **Area:** architecture, build, reports, runtime.
- **Problem:**
  - Build, reports y runtime handlers pueden necesitar datos semánticos, pero no deben duplicar query logic o acceder a internals arbitrarios.
- **Goal:**
  - Alinear build/report/runtime surfaces con query/public contracts.
- **Acceptance criteria:**
  - Reports consumen public/query contracts y no internals de parser/KnowledgeBase salvo owner documentado.
  - Build/ORCA/PBAutoBuild rails no entran en hot path ni modifican semántica interactiva.
  - Runtime health/journal consume métricas, no fuerza recomputación semántica.
  - SafeEdit/ImpactAnalysis/Reports quedan como consumers read-only salvo flows write-enabled explícitos.
  - Docs reflejan boundaries.
- **Implementation notes:**
  - No refactorizar build rails si no hay duplicidad real.
  - Priorizar documentation/guards.
- **Tests:**
  - `npm run test:unit`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/developer-workflows.md`
  - `docs/testing.md`
- **Dependencies:**
  - `SEMANTIC-FACADE-01` recomendado.
- **Risk:** medio.
- **Exit criteria:**
  - Build/report/runtime surfaces no duplican semántica ni contaminan hot path.

---

# FASE D — Fitness functions y documentación viva

## ARCH-GUARD-01 — Architecture import boundaries reforzados

- **Priority:** P1.
- **Status:** Open.
- **Area:** architecture, tests, import-boundaries.
- **Problem:**
  - Las reglas de arquitectura no deben depender solo de reviews o documentación.
  - El repo ya tiene tests de arquitectura, pero los nuevos bloques requieren más guards.
- **Goal:**
  - Convertir boundaries críticas en fitness functions ejecutables.
- **Acceptance criteria:**
  - Tests verifican client/server/shared boundaries.
  - Tests verifican no imports desde `src/**` a `plugin_old/**` o crean backlog si se delega al bloque legacy.
  - Tests verifican que providers no importan internals de otros providers cuando exista service/facade común.
  - Tests verifican que presentation no importa parser/KnowledgeBase directamente salvo excepciones documentadas.
  - Tests verifican que DataWindow boundary no entra en parser PowerScript genérico.
  - Docs explican cada guard y cómo actualizarlo cuando una excepción sea legítima.
- **Implementation notes:**
  - Integrar con `architectureImports.test.ts` o crear suite equivalente.
  - Evitar reglas imposibles de mantener.
  - Permitir allowlist explícita y revisada.
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
  - `ARCH-MODULE-01`
- **Risk:** medio; guards demasiado estrictos pueden bloquear cambios legítimos.
- **Exit criteria:**
  - Boundaries críticas quedan automatizadas como tests/gates.

---

## ARCH-GUARD-02 — Composition root growth guard

- **Priority:** P2.
- **Status:** Open.
- **Area:** architecture, metrics, maintainability.
- **Problem:**
  - `extension.ts` y `server.ts` pueden volver a crecer después de las extracciones.
- **Goal:**
  - Crear un guard objetivo para detectar crecimiento no justificado de composition roots.
- **Acceptance criteria:**
  - Existe métrica o test que monitoriza tamaño/complejidad/import count de `extension.ts` y `server.ts`.
  - El guard permite tolerancia razonable y exceptions documentadas.
  - Si una composition root crece por encima del budget, la validación falla o reporta warning accionable según policy.
  - Docs explican cómo extraer a modules/registrars/factories.
- **Implementation notes:**
  - Reutilizar `test:architecture:metrics` si ya existe.
  - No usar líneas exactas como única métrica si genera ruido; combinar con import count/complexity/hotspot report.
- **Tests:**
  - `npm run test:architecture:metrics`
  - `npm run test:architecture:rapid`
  - `npm run test:docs:drift`
- **Docs:**
  - `docs/testing.md`
  - `docs/architecture-status.md`
- **Dependencies:** `ARCH-ROOT-01`.
- **Risk:** bajo-medio.
- **Exit criteria:**
  - Growth de composition roots queda monitorizado y accionable.

---

## ARCH-DOCS-01 — Architecture map/status/backlog alignment

- **Priority:** P2.
- **Status:** Open.
- **Area:** docs, architecture, backlog.
- **Problem:**
  - Al crear bloques, specs y módulos nuevos, `architecture-implementation-map.md`, `architecture-status.md`, `backlog.md`, `testing.md` y `current-focus.md` pueden divergir.
- **Goal:**
  - Mantener documentación arquitectónica alineada sin duplicar contenido.
- **Acceptance criteria:**
  - `docs/architecture-implementation-map.md` refleja módulos y owners reales tras refactors.
  - `docs/architecture-status.md` resume estado, no duplica mapa entero.
  - `docs/backlog.md` referencia bloques/specs activos sin copiar contenido excesivo si se decide dividir archivos.
  - `docs/testing.md` refleja nuevas fitness functions y gates.
  - `docs/current-focus.md` solo se actualiza si un bloque se promueve explícitamente.
  - `npm run test:docs:drift` queda verde o falla con causa documentada.
- **Implementation notes:**
  - No duplicar specs completas en varios docs.
  - Si los bloques viven como archivos separados, backlog debe enlazarlos claramente.
- **Tests:**
  - `npm run test:docs:drift`
  - `npm run test:architecture:rapid`
- **Docs:**
  - `docs/architecture-implementation-map.md`
  - `docs/architecture-status.md`
  - `docs/backlog.md`
  - `docs/testing.md`
  - `docs/current-focus.md` si aplica.
- **Dependencies:** puede acompañar a cualquier spec del bloque.
- **Risk:** bajo.
- **Exit criteria:**
  - Documentación queda alineada y sin duplicación innecesaria.

---

## Resultado esperado al cerrar el Bloque 8

Al cerrar este bloque deben cumplirse todas estas condiciones:

```text
1. Boundaries client/server/shared están definidas, documentadas y testeadas.
2. `src/shared` queda limitado a contratos estables y tipos puros.
3. `extension.ts` y `server.ts` quedan como composition roots de wiring mínimo.
4. Server composition está organizada por dominios.
5. Client activation sigue lazy, ligera y sin semántica.
6. Handlers actúan como adapters y services como owners.
7. Feature modules tienen ownership y public surface policy.
8. Build/report/runtime surfaces no duplican semántica ni contaminan hot path.
9. Architecture fitness functions protegen imports, boundaries y crecimiento de roots.
10. Docs/backlog/testing/architecture-map/status quedan alineados.
```

---

## Current focus recomendado si se decide activar este bloque

```markdown
# Current Focus — Architectural Modularization & Boundaries

## Scope

- ARCH-BOUNDARY-01
- ARCH-ROOT-01
- ARCH-GUARD-01

## Optional within same focus only if previous items are closed

- ARCH-ROOT-02
- ARCH-ROOT-03
- ARCH-GUARD-02

## Explicitly out of scope

- Big-bang refactor of extension.ts/server.ts
- Semantic owner redesign
- DataWindowFastContext
- New UI/Webviews
- Build/ORCA/PBAutoBuild feature expansion
- AI tools redesign

## Exit criteria

- Boundaries client/server/shared are executable tests.
- Composition roots are documented as wiring-only.
- New module destinations are clear.
- Docs and architecture gates are aligned.
```

---