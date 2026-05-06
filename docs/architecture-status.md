# Architecture Status — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento resume el **estado real actual** de la arquitectura del plugin frente a la arquitectura objetivo definida en `docs/architecture.md`.

Debe responder a tres preguntas:

1. ¿Qué partes de la arquitectura están correctamente alineadas?
2. ¿Qué partes están parciales, en riesgo o pendientes?
3. ¿Qué acción documental o técnica debe existir para corregir cada desviación?

El diseño objetivo no vive aquí. Si una sección empieza a explicar cómo debe diseñarse una capa en detalle, debe moverse a `docs/architecture.md` o a una spec concreta.

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
| Mapa de implementación | Congelado | `docs/architecture-implementation-map.md` contiene evidencia profunda y no se normaliza aún. | Consultar, no reescribir. |
| Done log | Congelado | `docs/done-log.md` es histórico cerrado. | No tocar en esta fase. |
| Cliente VS Code | Parcial | Debe tender a composition root fino y separar comandos/vistas/lifecycle. | Crear o mantener specs de reducción de `extension.ts`. |
| Language Server | Parcial | Debe tender a composition root fino y delegar handlers/capas. | Crear o mantener specs de reducción de `server.ts`. |
| Request Context | Pendiente | Debe formalizarse como contrato transversal para providers. | Spec de `RequestContext`. |
| Semantic Query Facade | Riesgo | La resolución semántica debe centralizarse para evitar duplicidades. | Spec de fachada semántica obligatoria. |
| Cache Layer | Riesgo | Hay muchas caches recomendadas; falta contrato común y gobernanza de invalidación. | Spec de cache L0-L3 y contrato común. |
| Providers LSP | Parcial | Hover/completion/signature/definition/references/diagnostics necesitan patrón homogéneo. | Normalizar providers contra fachada/cache. |
| DataWindow Domain | Parcial | DataWindow debe ser subdominio propio, no lógica secundaria mezclada. | Spec de DataWindow model/binding/cache. |
| ORCA/PBAutoBuild | Parcial | Deben permanecer como adapters externos aislados. | Specs de adapters y errores/build diagnostics. |
| Performance | Parcial | Existen budgets, pero deben conectarse a mediciones por provider/cache. | Alinear `performance-budget.md`. |
| Testing | Parcial | Debe cubrir contratos arquitectónicos, caches, semántica e integraciones. | Alinear `testing.md`. |
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

- **Estado:** Pendiente.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Request Context.
- **Riesgo:** paso de parámetros sueltos, dificultad para aplicar cancellation, métricas, settings snapshot y presupuestos de rendimiento homogéneos.
- **Acción:** crear contrato `RequestContext` común para providers LSP.
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

- **Estado:** Riesgo.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Semantic Query Facade.
- **Evidencia:** el mapa de implementación detecta responsabilidades duplicadas alrededor de resolución semántica, scopes, receiver type, callable resolution, inheritance, built-ins y DataWindow binding.
- **Riesgo:** duplicar resolución en hover, completion, diagnostics, references o semantic tokens.
- **Acción:** hacer obligatoria una fachada semántica común para providers y herramientas IA futuras.
- **Criterio de avance:** ningún provider debe reimplementar resolución global fuera de la fachada.

### 4.8. Providers LSP

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Providers LSP.
- **Riesgo:** cada provider puede acabar con su propio flujo de resolución, cache, formatting y fallback.
- **Acción:** normalizar patrón común `Provider → RequestContext → SemanticQueryFacade/CacheLayer → ViewModel → Formatter → LSP response`.

#### Hover

- **Estado:** Parcial/Riesgo.
- **Riesgo:** hover lento o poco útil si calcula desde cero o no distingue sistema/usuario/variable/DataWindow/built-in.
- **Acción:** usar `HoverViewModel` cache y negative hover cache con invalidación segura.

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

- **Estado:** Parcial.
- **Riesgo:** reparsing innecesario o tokens no alineados con symbol graph.
- **Acción:** consumir snapshot/AST/symbol graph/cache.

---

## 5. Estado de Cache Layer

### 5.1. Estado general

- **Estado:** Riesgo.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Cache Layer.
- **Evidencia:** el mapa de implementación contiene muchas referencias a caches y serving caches, además de auditoría de hot path cache hit vs cache miss.
- **Riesgo:** crear caches útiles pero dispersas, sin contrato común, métricas ni invalidación homogénea.
- **Acción:** formalizar contrato común de caches L0-L3.

### 5.2. Caches prioritarias a gobernar

```text
L0 — Request-local cache
L1 — Active document snapshot
L2 — Workspace semantic index
L3 — Persistent metadata cache
```

Caches concretas que deben tener contrato explícito:

- active document snapshot;
- hover view model cache;
- negative hover cache;
- completion list cache;
- completion resolve cache;
- serving final response cache si aplica;
- catalog lookup cache;
- DataWindow model cache;
- diagnostics cache;
- semantic tokens cache;
- workspace index cache.

### 5.3. Acción recomendada

Crear o mantener una spec de cache architecture con:

```text
name
owner
scope
key
value
lifecycle
invalidation triggers
max size / memory policy
metrics
fallback
```

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
- **Documentos afectados:** `docs/backlog.md`, `docs/testing.md`, `docs/performance-budget.md`.

---

## 8. Estado de integraciones externas

### 8.1. ORCA

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Integraciones externas.
- **Riesgo:** acoplar APIs/procesos externos al core semántico.
- **Acción:** mantener ORCA detrás de adapter: locator, session adapter, library reader, exporter y error mapper.
- **Criterio de avance:** ausencia de ORCA debe degradar con seguridad, no romper el servidor.

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

---

## 10. Estado de testing arquitectónico

- **Estado:** Parcial.
- **Arquitectura objetivo:** `docs/architecture.md`, sección Testing arquitectónico.
- **Documento propietario:** `docs/testing.md`.
- **Riesgo:** cerrar refactors arquitectónicos sin pruebas de contrato, performance o regresión.
- **Acción:** asegurar tests para parsing, indexing, cache invalidation, semantic facade, providers, DataWindow y adapters externos.
- **Criterio de avance:** todo cambio de capa debe tener al menos test unitario/contrato; hot paths deben tener smoke/performance cuando aplique.

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
3. **Cache contract:** formalizar niveles L0-L3, invalidación, métricas y fallback.
4. **Hot paths:** asegurar que hover/completion/signature/definition/references/diagnostics/semantic tokens no hacen trabajo pesado innecesario.
5. **DataWindow Domain:** separar modelo DataWindow de PowerScript parser y conectarlo por fachada semántica.
6. **Adapters externos:** aislar ORCA y PBAutoBuild completamente del core semántico.
7. **Testing/performance:** conectar cada refactor a pruebas y budgets.
8. **Docs IA:** evitar que agentes/prompts dupliquen arquitectura o backlog.
