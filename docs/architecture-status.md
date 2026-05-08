# Architecture Status — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento resume el **estado real actual** de la arquitectura del plugin frente a la arquitectura objetivo definida en `docs/architecture.md`.

Debe responder a tres preguntas:

1. ¿Qué partes de la arquitectura están correctamente alineadas?
2. ¿Qué partes están parciales, en riesgo o pendientes?
3. ¿Qué acción documental o técnica debe existir para corregir cada desviación?

El diseño objetivo no vive aquí. Si una sección empieza a explicar cómo debe diseñarse una capa en detalle, debe moverse a `docs/architecture.md`, `docs/semantic-design-target.md` o a una spec concreta.

---

## 2. Leyenda de estado

```text
OK        — La capa está alineada con la arquitectura objetivo y no requiere acción inmediata.
Parcial   — La capa existe o está encaminada, pero faltan contratos, separación, tests o documentación.
Riesgo    — Hay solape, deuda, hot path sensible, duplicación o posible impacto en rendimiento/mantenibilidad.
Pendiente — La capa todavía no existe como unidad clara o requiere implementación/refactorización específica.
Congelado — Documento o área que no debe tocarse en esta fase salvo instrucción explícita.
```

---

## 3. Resumen ejecutivo

| Área | Estado | Motivo | Acción |
|---|---:|---|---|
| Constitución documental | OK | `docs/constitution.md` define jerarquía, ownership y reglas de no duplicación. | Mantener como contrato documental. |
| Arquitectura objetivo | OK | `docs/architecture.md` queda como documento canónico de diseño objetivo. | Usarlo como referencia para este status. |
| Diseño semántico objetivo | OK | `docs/semantic-design-target.md` fija el target futuro para snapshot, query result, caches, consumers, plan incremental y backlog arquitectónico. | Usarlo como contrato futuro; este status sólo refleja adopción real. |
| Mapa de implementación | OK | `docs/architecture-implementation-map.md` conserva la evidencia profunda viva; no debe actuar como backlog paralelo. | Mantenerlo sincronizado con owners y runtime real. |
| Done log | OK | `docs/done-log.md` es histórico cerrado y sólo debe corregirse si aparece drift factual. | Mantener un único cierre por hecho validado. |
| Cliente VS Code | Parcial | Debe tender a composition root fino y separar comandos/vistas/lifecycle. | Crear o mantener specs de reducción de `extension.ts`. |
| Language Server | Parcial | Debe tender a composition root fino y delegar handlers/capas. | Crear o mantener specs de reducción de `server.ts`. |
| Request Context | Parcial | Existen `queryContext` y `positionContext`, pero no un contrato transversal homogéneo para todos los consumers. | Formalizar el contrato sobre el slice actual y migrar providers por fases. |
| Semantic Query Facade | Parcial/Riesgo | Hay un slice read-only activo, pero la adopción sigue desigual entre consumers interactivos y surfaces derivadas. | Converger consumer por consumer y documentar excepciones activas. |
| Cache Layer | Parcial | Contratos L0-L3 están estabilizados, pero el target futuro exige un coordinador de invalidación cross-cache, keys estructuradas completas y no-op semantic publish cuando no cambian facts públicos. | Ejecutar `PB-ARCH-P1-CACHE-SEMANTIC-EPOCH-CONTRACT-01` y `PB-ARCH-P1-CROSS-CACHE-INVALIDATION-COORDINATOR-01`. |
| Providers LSP | Parcial | Hover/definition ya tienen slice de facade; completion, signature help, references, diagnostics y semantic tokens conservan excepciones o rutas híbridas. | Seguir el plan incremental de `docs/semantic-design-target.md` y los items `PB-ARCH-*` del backlog. |
| Surfaces read-only / API pública | Parcial | Current Object Context, Diagnostics Explainability, Object Explorer, Impact Analysis, Safe Edit Plan y runtime self-test ya son superficie real del producto. | Tratarlas como proyecciones acotadas con epoch, receipts, caps, redaction y tests. |
| DataWindow Domain | Parcial | DataWindow debe ser subdominio propio, no lógica secundaria mezclada. | Spec de DataWindow model/binding/cache. |
| ORCA/PBAutoBuild | Parcial | Deben permanecer como adapters externos aislados. | Specs de adapters y errores/build diagnostics. |
| Performance | OK/Parcial | Arquitectura Server-Push reactiva, Memoización de Regex O(1), Semantic Tokens Delta y Background Indexing (WorkerPool) activos. | Mantener los budgets de rendimiento y monitorizar latencia de workers. |
| Testing | OK/Parcial | La matriz de lanes ya está alineada, `test:architecture:rapid` incorpora scanner estructural y los P0 de conformance, snapshot readonly y `SemanticQueryResult` ya quedaron cerrados. | Mantener `testing.md` sincronizado y ampliar gates al abrir diagnostics tiered y carriles P1. |
| IA/agentes | Parcial | La documentación IA debe consumir arquitectura/status sin duplicarla. | Alinear bloque IA después de docs core. |

---

## 4. Estado por capa

### 4.1. Cliente VS Code

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, secciones Cliente VS Code y composition root.
- **Evidencia:** el mapa de implementación identifica `extension.ts` como zona sensible y recomienda seguir reduciendo concentración de responsabilidades.
- **Riesgo:** que el cliente acumule lógica de lifecycle, comandos, vistas o coordinación que debería vivir en módulos dedicados.
- **Acción:** mantener `extension.ts` como composition root mínimo y mover lógica específica a módulos de cliente.
- **Documentos afectados:** `docs/backlog.md`, `docs/developer-workflows.md`, `docs/testing.md` si se cambian comandos o flujos.

### 4.2. Language Server

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Language Server.
- **Evidencia:** el mapa de implementación identifica `server.ts` como zona sensible y recomienda reducir concentración.
- **Riesgo:** que handlers, lifecycle, parsing, resolving y formateo queden acoplados al bootstrap del servidor.
- **Acción:** dejar `server.ts` como composition root y registrar handlers mediante módulos especializados.
- **Documentos afectados:** `docs/backlog.md`, `docs/testing.md`, `docs/performance-budget.md`.

### 4.3. Request Context

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Request Context.
- **Evidencia:** `queryContext.ts` y `positionContext.ts` ya alimentan hover, definition y varias surfaces read-only, pero completion, signature help, references, diagnostics y semantic tokens no consumen todavía un contrato transversal único.
- **Riesgo:** paso de parámetros sueltos, dificultad para aplicar cancellation, métricas, settings snapshot y presupuestos de rendimiento homogéneos.
- **Acción:** formalizar un contrato `RequestContext` común sobre el slice actual y migrar providers sin big-bang.
- **Criterio de avance:** hover, completion, signature help, definition, references, diagnostics y semantic tokens deben poder recibir contexto homogéneo.

### 4.4. Workspace Model

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Workspace Model.
- **Riesgo:** mezclar discovery, carga de metadatos, indexación y análisis semántico avanzado en una única fase costosa.
- **Acción:** separar discovery incremental, índices por documento/objeto/library/target y estado global de workspace.
- **Criterio de avance:** apertura de workspace grande sin bloqueo perceptible del editor.

### 4.5. Parser e Indexer

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Parser e indexer.
- **Riesgo:** reparsing excesivo, invalidación amplia o pérdida de utilidad cuando el documento tiene errores mientras se edita.
- **Acción:** reforzar parser tolerante, snapshots por versión de documento e indexación incremental.
- **Documentos afectados:** `docs/testing.md`, `docs/performance-budget.md`.

### 4.6. Symbol Graph

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Symbol Graph.
- **Riesgo:** que los símbolos no tengan identidad estable o que providers mezclen símbolo con presentación final.
- **Acción:** formalizar identidad de símbolo, separación symbol/result/viewmodel y contratos de references/definition.
- **Criterio de avance:** definition/references/semantic tokens deben depender de identidad semántica, no de búsqueda textual salvo fallback.

### 4.7. Semantic Query Facade

- **Estado:** Parcial/Riesgo.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Semantic Query Facade.
- **Evidencia:** el facade ya publica policy efectiva (`sourceOriginPolicy`, `budgetMs`, `resultCap`), `source` y degradación base para timeout/dynamic, y `rename` dejó de depender de `ResolvedTargetInfo` crudo en su preflight principal; aun así completion, signature help, references, diagnostics, semantic tokens y varias surfaces read-only siguen apoyándose en rutas paralelas o híbridas para scopes, receiver type, callable resolution, inheritance, built-ins o DataWindow binding.
- **Riesgo:** duplicar resolución en hover, completion, diagnostics, references o semantic tokens.
- **Acción:** converger consumer por consumer hacia una fachada semántica común y documentar explícitamente cada excepción mientras exista.
- **Criterio de avance:** ningún provider o surface read-only relevante debe reimplementar resolución global fuera de la fachada sin owner, evidencia y justificación de la excepción.

### 4.8. Providers LSP

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Providers LSP.
- **Riesgo:** cada provider puede acabar con su propio flujo de resolución, cache, formatting y fallback.
- **Acción:** normalizar patrón común `Provider → RequestContext → SemanticQueryFacade/CacheLayer → ViewModel → Formatter → LSP response`.

#### Hover

- **Estado:** Parcial/Riesgo.
- **Riesgo:** hover lento o poco útil si calcula desde cero o no distingue sistema/usuario/variable/DataWindow/built-in.
- **Acción:** usar `HoverViewModel` cache y negative hover cache con invalidación segura.
- **Estado validado 2026-05:** el fast path de catálogo system ya responde built-ins antes de depender del workspace readiness, con serving cache observable y negative cache explícita para misses repetidos.

#### Completion

- **Estado:** Parcial.
- **Riesgo:** ranking y resolve acoplados a generación inicial de candidatos.
- **Acción:** separar generación, ranking, filtrado, resolve bajo demanda y formatting.

#### Signature Help

- **Estado:** Parcial.
- **Riesgo:** dependencia excesiva de regex locales.
- **Acción:** apoyarse en callable resolution y overload/override resolution.

#### Definition / References

- **Estado:** Parcial.
- **Riesgo:** búsqueda textual global como camino principal.
- **Acción:** usar identidades de símbolo estables y fallback textual solo si está presupuestado.

#### Diagnostics

- **Estado:** Parcial.
- **Riesgo:** mezclar diagnósticos sintácticos, semánticos, DataWindow y build externo sin fuente clara.
- **Acción:** separar engines/fuentes y usar modelos de diagnóstico con código/severidad/rango/fuente.

#### Semantic Tokens

- **Estado:** Parcial/Riesgo.
- **Riesgo:** reparsing innecesario, tokens no alineados con symbol graph o publication de confidence no convergida con el resto de consumers.
- **Acción:** consumir snapshot/AST/symbol graph/cache y alinear el contrato de confidence con `queryContext` y las demás surfaces read-only.

Las surfaces read-only ya publicadas, como Current Object Context, Diagnostics Explainability, Object Explorer, Impact Analysis y Safe Edit Plan, deben seguir el mismo contrato de confidence, source origin, reason codes y degradación honesta aunque no sean providers LSP clásicos.

### 4.9. Rendimiento Interactivo (Performance)

- **Estado:** OK/Parcial.
- **Arquitectura objetivo:** `docs/performance-budget.md`.
- **Evidencia:** 
  - La UI de VS Code está completamente desacoplada de eventos pesados de File System. Ahora opera en un flujo puro **Server-Push Reactivo** gobernado por el `semanticEpoch`.
  - Las herramientas de validación estructural (expresiones regulares) utilizan **Memoización O(1)** vinculada al `SemanticDocumentSnapshot`, eliminando bloqueos de UI (jitter) durante pulsaciones rápidas.
  - La canalización de respuestas interactivas cuenta con **Optimistic Snapshots (Stale-While-Revalidate)**, devolviendo respuestas antiguas inmediatamente mientras el AST se reconstruye en background (evitando timeouts o que el hover de LSP se bloquee).
  - La sincronización de pintado de sintaxis utiliza `semanticTokens/full/delta` para emitir deltas fraccionales usando caches de `SemanticTokensBuilder`, reduciendo la saturación de JSON-RPC.
  - **Background Indexing (WorkerPool)**: El I/O pesado y el parseo estructural/enriquecido inicial se han movido a `worker_threads` (paralelizados en batches de 5), eliminando el bloqueo del hilo principal durante la indexación en frío.
- **Riesgo:** La sobrecarga de creación de workers y la transferencia de contenido grande via `postMessage` puede impactar en sistemas con pocos recursos.
- **Acción:** Monitorizar latencias en CI y ajustar el `BATCH_SIZE` si es necesario.

---

## 5. Estado de Cache Layer

### 5.1. Estado general

- **Estado:** OK.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Cache Layer.
- **Evidencia:** Las 7 specs de la auditoría P0/P1 se han completado. El modelo está alineado.
- **Riesgo:** Bajo. El sistema ahora soporta workspaces masivos usando `memoryPressurePolicy` y LRU document cache.
- **Acción:** Mantener los budgets de memoria documentados e instrumentar caídas de latencia para futuras optimizaciones.

### 5.2. Caches gobernadas exitosamente

```text
L0 — Request-local cache (eliminado/congelado refs en hot path)
L1 — Active document snapshot (DocumentCache con Tiered LRU)
L2 — Workspace semantic index (ServingCache con Invalidación Selectiva)
L3 — Persistent metadata cache (SemanticCacheStore particionado, compresión asíncrona)
```

Caches concretas que ahora tienen contrato explícito en `ServingCache` o `DocumentCache`:

- active document snapshot (pinned vs LRU warm/cold);
- hover / negative hover cache;
- completion / negative completion cache;
- signature help / definition cache;
- diagnostic refresh buffers.

### 5.3. Acción recomendada

Avanzar hacia la estabilización de los providers interactivos (Fase 6C/P2) asumiendo que la infraestructura de caché subyacente es confiable y O(1)/O(dependents) en invalidación.

---

## 6. Estado de PowerBuilder Domain Model

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, sección PowerBuilder Domain Model.
- **Riesgo:** tratar PowerBuilder como lenguaje genérico y perder semántica propia de workspaces, targets, libraries, objetos, eventos, funciones, herencia y DataWindows.
- **Acción:** reforzar modelo de dominio PB y catálogos de built-ins versionados.
- **Criterio de avance:** providers y diagnostics deben consultar modelos PB, no heurísticas aisladas.

---

## 7. Estado de DataWindow Domain

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, sección DataWindow Domain.
- **Evidencia:** el mapa de implementación contiene secciones específicas para DataWindow model, binding model, fast context, column access, property paths, safe mode y SQL lineage.
- **Riesgo:** mezclar lógica DataWindow dentro del parser PowerScript o resolverla solo con heurísticas locales.
- **Acción:** tratar DataWindow como subdominio propio con extractor, parser, modelo, SQL model, binding resolver y semantic provider.
- **Estado validado 2026-05:** diagnostics y estructura ya toman `Describe(...)`, `Modify(...)` y `SyntaxFromSQL(...)` como frontera de sublenguaje; sus strings no se reinterpretan como PowerScript general.
- **Documentos afectados:** `docs/backlog.md`, `docs/testing.md`, `docs/performance-budget.md`.

---

## 8. Estado de integraciones externas

### 8.1. ORCA

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Integraciones externas.
- **Riesgo:** acoplar APIs/procesos externos al core semántico.
- **Acción:** mantener ORCA detrás de adapter: locator, session adapter, library reader, exporter y error mapper.
- **Criterio de avance:** ausencia de ORCA debe degradar con seguridad, no romper el servidor.
- **Estado validado 2026-05:** runtime health y dashboards ya separan capacidad ORCA/build del serving interactivo; su ausencia no debe bloquear hover, views ni diagnostics.

### 8.2. PBAutoBuild

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Integraciones externas.
- **Riesgo:** ejecutar builds de forma bloqueante o mezclar salida de build con diagnostics internos sin mapping claro.
- **Acción:** mantener PBAutoBuild detrás de adapter: locator, command builder, runner, output parser y diagnostics mapper.
- **Criterio de avance:** build diagnostics deben mapearse a fuente, rango y severidad cuando sea posible.

---

## 9. Estado de rendimiento y observabilidad

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Observabilidad y rendimiento.
- **Documento propietario de budgets:** `docs/performance-budget.md`.
- **Riesgo:** definir arquitectura de caches sin medir hit/miss, latencia, fallback y regresiones.
- **Acción:** alinear performance budget con providers y cache layer.
- **Criterio de avance:** cada hot path debe tener presupuesto, métrica y fallback controlado.
- **Estado validado 2026-05:** el runtime interactivo ya quedó reanclado a fingerprint por documento, loop guard single-flight y negative cache observable para misses de hover/definition; el self-test read-only ahora ejecuta probes funcionales reales y usa snapshots ligeros para no bloquear el comando.

---

## 10. Estado de testing arquitectónico

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Testing arquitectónico.
- **Documento propietario:** `docs/testing.md`.
- **Riesgo:** cerrar refactors arquitectónicos sin pruebas de contrato, performance o regresión.
- **Acción:** asegurar tests para parsing, indexing, cache invalidation, semantic facade, providers, DataWindow y adapters externos.
- **Criterio de avance:** todo cambio de capa debe tener al menos test unitario/contrato; hot paths deben tener smoke/performance cuando aplique.
- **Estado validado 2026-05:** la smoke de activación vuelve a medir solo `activate()` + handshake mínimo; los barridos read-only largos se trocean por superficie y el carril de snapshots usa fixture importado/diff para seguir siendo smoke en lugar de export E2E pesado.
- **Estado validado 2026-05 (conformance):** `npm run test:architecture:rapid` ejecuta `tools/architecture-conformance-scanner.mjs` antes de smoke/performance, guarda `artifacts/performance/architecture-conformance-report.json` y bloquea bypasses del facade, ciclos de imports, contratos de cache incompletos, stores paralelos y full scans en hot paths críticos mediante fixtures negativos dedicados.

---

## 11. Estado de documentación IA/agentes

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, sección IA y consumo por agentes.
- **Riesgo:** que docs IA dupliquen arquitectura, backlog o roadmap.
- **Acción:** mantener docs IA como consumidores de arquitectura/status, no como fuentes paralelas.
- **Documentos afectados:** `docs/ai-strategy.md`, `docs/ai-orchestration.md`, `docs/ai/README.md`, `docs/ai/agent-skill-routing.md`, `docs/ai/lean-token-policy.md`, `docs/ai-context/powerbuilder-plugin-context.md`, `docs/prompts/README.md`.

---

## 12. Desviaciones prioritarias

Las desviaciones que deben tener prioridad de normalización o spec son:

1. **Composition roots:** reducir concentración en `extension.ts` y `server.ts`.
2. **SemanticQueryFacade:** centralizar resolución semántica para evitar duplicidad.
3. **RequestContext y confidence contract:** homogeneizar contexto, confidence y degradación entre consumers y surfaces read-only.
4. **Hot paths:** asegurar que hover/completion/signature/definition/references/diagnostics/semantic tokens no hacen trabajo pesado innecesario.
5. **Surfaces read-only / API pública:** asignar owners, tests y budgets explícitos.
6. **DataWindow Domain:** separar modelo DataWindow de PowerScript parser y conectarlo por fachada semántica.
7. **Adapters externos:** aislar ORCA y PBAutoBuild completamente del core semántico.
8. **Testing/performance:** conectar cada refactor a pruebas y budgets.
9. **Docs IA:** evitar que agentes/prompts dupliquen arquitectura o backlog.
