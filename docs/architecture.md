# Architecture — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento define la **arquitectura objetivo** del plugin profesional de PowerBuilder 2025 para Visual Studio Code.

Debe responder a una pregunta concreta:

> ¿Cómo debe estar estructurado el plugin para ofrecer soporte rápido, mantenible, extensible y fiable de PowerBuilder/PowerScript en VS Code?

La arquitectura aquí descrita es normativa para nuevas implementaciones y refactorizaciones. El estado real de cada capa vive en `docs/architecture-status.md`. Las tareas accionables viven en `docs/backlog.md` o en specs bajo `docs/specs/`. El histórico cerrado vive en `docs/done-log.md`.

---

## 2. Principios arquitectónicos

### 2.1. Cliente VS Code ligero

La extensión ejecutada en el Extension Host debe ser una capa fina. Su responsabilidad principal es integrar el plugin con VS Code, arrancar el Language Client, registrar comandos/vistas/configuración y delegar el análisis pesado al servidor LSP.

El cliente no debe:

- parsear proyectos completos;
- resolver símbolos globales;
- ejecutar análisis semántico pesado;
- mantener cachés semánticas complejas;
- duplicar reglas del servidor.

### 2.2. Language Server como núcleo semántico

El Language Server es el owner de:

- parsing PowerScript;
- modelo de workspace PowerBuilder;
- indexación;
- grafo de símbolos;
- resolución semántica;
- diagnósticos;
- providers LSP;
- caches de serving;
- integración controlada con DataWindow, ORCA y PBAutoBuild.

### 2.3. Hot paths sin I/O innecesario

Los providers LSP de uso interactivo deben responder desde snapshots, índices y caches válidas. En condiciones normales, hover, completion, signature help, definition y references no deben escanear todo el workspace ni leer disco de forma no controlada.

### 2.4. Una fachada semántica única

Toda resolución semántica consumida por features LSP debe pasar por una API/fachada común. Esto evita duplicar reglas entre hover, completion, diagnostics, references, semantic tokens y futuras features IA.

### 2.5. PowerBuilder como dominio propio

PowerBuilder no debe modelarse como un lenguaje C-like genérico. La arquitectura debe reconocer explícitamente workspaces/solutions, targets/projects, libraries, objetos PB, scripts, eventos, funciones, variables, estructuras, herencia, DataWindows e integraciones de build.

### 2.6. Caches con contrato explícito

Toda cache debe declarar owner, scope, key, value, lifecycle, invalidación, métricas y fallback. No se permiten caches ad hoc sin contrato ni observabilidad.

### 2.7. Documentación alineada al cambio

Cualquier cambio arquitectónico debe actualizar, como mínimo, la documentación afectada según `docs/constitution.md`.

---

## 3. Vista general de capas

```text
VS Code Extension Host
  └─ Client Layer
      ├─ Activation
      ├─ Commands
      ├─ Views / Status / Progress
      ├─ Configuration
      └─ LanguageClient

Language Server Process
  ├─ LSP Transport & Handlers
  ├─ Request Context
  ├─ Semantic Query Facade
  ├─ Providers
  │   ├─ Hover
  │   ├─ Completion
  │   ├─ Signature Help
  │   ├─ Definition / References
  │   ├─ Document Symbols
  │   ├─ Semantic Tokens
  │   └─ Diagnostics
  ├─ Workspace Model
  ├─ Parser & Indexer
  ├─ Symbol Graph
  ├─ Cache Layer
  ├─ PowerBuilder Domain Model
  ├─ DataWindow Domain
  ├─ External Integrations
  │   ├─ ORCA Adapter
  │   └─ PBAutoBuild Adapter
  └─ Observability / Performance Guards
```

---

## 4. Cliente VS Code

### 4.1. Responsabilidades

El cliente debe encargarse de:

- activación de la extensión;
- lectura inicial de configuración necesaria para arrancar;
- arranque/parada del Language Client;
- registro de comandos VS Code;
- registro de vistas, status bar, progress y mensajes de usuario;
- contribuciones declarativas de `package.json`;
- coordinación ligera con settings/workspace folders.

### 4.2. Composition root

`extension.ts` debe tender a ser un composition root mínimo:

```text
activate(context)
  → createClientContainer(context)
  → registerCommands(container)
  → registerViews(container)
  → startLanguageClient(container)

deactivate()
  → dispose container/client resources
```

La lógica de comandos, vistas, status, settings y lifecycle debe estar en módulos separados.

### 4.3. Activación

La activación debe ser lazy y basada en señales reales de PowerBuilder:

- lenguajes PowerScript/PowerBuilder;
- presencia de workspaces/targets/projects/libraries PowerBuilder;
- comandos explícitos del plugin;
- vistas específicas si aplican.

Evitar activación global si no es imprescindible.

---

## 5. Language Server

### 5.1. Responsabilidades

El servidor es responsable de:

- sincronización incremental de documentos;
- modelado de workspace;
- parsing y recuperación tolerante a errores;
- indexación incremental;
- resolución de símbolos;
- construcción de modelos semánticos;
- cálculo de respuestas LSP;
- publicación de diagnósticos;
- gestión de caches;
- medición de latencia y degradación controlada.

### 5.2. Composition root del servidor

`server.ts` debe tender a ser un composition root mínimo:

```text
main()
  → createConnection()
  → createServerContainer(connection)
  → registerLifecycleHandlers(container)
  → registerLspHandlers(container)
  → startDocumentManager(container)
  → connection.listen()
```

No debe contener lógica de parsing, resolución, formateo, indexación ni reglas de negocio.

### 5.3. Registro de handlers

Los handlers LSP deben ser finos:

```text
onHover(params)
  → createRequestContext(params)
  → hoverProvider.provide(context)
  → return LSP response
```

El handler no debe conocer detalles internos de caches, indexación o formatting.

---

## 6. Request Context

Toda request interactiva debe construir un contexto explícito:

```text
RequestContext
  ├─ documentUri
  ├─ documentVersion
  ├─ position/range
  ├─ workspaceId
  ├─ cancellationToken
  ├─ settingsSnapshot
  ├─ activeDocumentSnapshot
  ├─ performanceBudget
  └─ traceId
```

El contexto evita pasar parámetros sueltos entre capas y permite trazabilidad, cancelación y métricas homogéneas.

---

## 7. Workspace Model

### 7.1. Modelo objetivo

El workspace PowerBuilder debe modelar explícitamente:

```text
PowerBuilderWorkspace
  ├─ Solution / Workspace file
  ├─ Targets / Projects
  ├─ Libraries
  ├─ Source files
  ├─ Object catalog
  ├─ Build configuration
  └─ External metadata
```

### 7.2. Formatos soportados

La arquitectura debe permitir soporte progresivo para:

- formatos modernos de PowerBuilder 2025;
- workspaces/solutions;
- targets/projects;
- estructuras legacy PBW/PBT/PBL;
- fuentes exportadas SR*;
- fixtures y corpora de pruebas.

### 7.3. Descubrimiento incremental

El discovery debe ser incremental, cancelable y tolerante a workspaces grandes. Debe evitar bloquear el editor y debe separar:

- detección de estructura;
- carga de metadatos;
- indexación;
- análisis semántico avanzado.

---

## 8. Parser e indexer

### 8.1. Parser tolerante a errores

El parser debe producir resultados útiles aunque el documento esté incompleto o tenga errores. Esto es obligatorio para edición interactiva.

Debe devolver:

- AST o modelo sintáctico parcial;
- rangos estables;
- errores recuperables;
- tokens/símbolos mínimos para features básicas.

### 8.2. Indexación incremental

El indexer debe separar:

- índice por documento;
- índice por objeto PB;
- índice por library/target;
- índice global de workspace;
- dependencias e invalidación.

### 8.3. Contrato de invalidación

Cualquier cambio en fichero, configuración, workspace o library debe invalidar solo lo necesario. Si los file watchers no son fiables, el sistema debe tener fallback por hash, versión de documento o rescan controlado.

---

## 9. Symbol Graph

### 9.1. Objetivo

El Symbol Graph es la representación semántica central para navegación y análisis.

Debe modelar:

- objetos PB;
- herencia;
- funciones;
- eventos;
- variables;
- estructuras;
- DataWindows asociadas;
- referencias;
- built-ins/catalog symbols;
- símbolos procedentes de frameworks o packs.

### 9.2. Identidad estable

Cada símbolo debe tener un identificador estable que no dependa solo del texto visible.

```text
symbolId = workspaceId + objectName + kind + signature + sourceRange
```

### 9.3. Separación entre símbolo y presentación

El símbolo no debe contener Markdown de hover, ranking de completion ni textos de diagnóstico finales. Esos formatos pertenecen a providers/formatters.

---

## 10. Semantic Query Facade

### 10.1. Responsabilidad

La `SemanticQueryFacade` debe ser el punto de entrada común para consultas semánticas.

```text
resolveSymbolAt(document, position)
resolveScope(document, position)
resolveReceiverType(expression, context)
resolveCallableAt(document, position)
resolveDefinition(symbol)
findReferences(symbol)
resolveBuiltIn(name, context)
resolveDataWindowBinding(reference, context)
```

### 10.2. Consumidores

Deben consumir esta fachada:

- hover;
- completion;
- signature help;
- definition;
- references;
- document symbols;
- semantic tokens;
- diagnostics;
- herramientas IA futuras.

### 10.3. Regla anti-duplicación

Ningún provider debe reimplementar su propio resolver global si la consulta pertenece a la fachada semántica.

---

## 11. Providers LSP

### 11.1. Patrón común

Cada provider debe seguir este patrón:

```text
Provider
  → RequestContext
  → SemanticQueryFacade / CacheLayer
  → Domain model
  → ViewModel/Result model
  → Formatter
  → LSP response
```

### 11.2. Hover

Hover debe informar de forma útil según el tipo de elemento:

- función de sistema;
- función/evento de usuario;
- variable local/instancia/global;
- objeto PowerBuilder;
- DataWindow;
- columna/control DataWindow;
- enumerado/built-in;
- símbolo desconocido con fallback seguro.

Hover no debe construir toda la información desde cero si existe `HoverViewModel` cache válido.

### 11.3. Completion

Completion debe separar generación de candidatos, ranking, filtrado por contexto, resolve bajo demanda y formatting final.

### 11.4. Signature Help

Signature Help debe apoyarse en resolución de callable y overloads. No debe depender solo de regex locales.

### 11.5. Definition y References

Definition y References deben usar identidades de símbolo estables. No deben hacer búsqueda textual global salvo fallback explícito y presupuestado.

### 11.6. Diagnostics

Diagnostics debe separar diagnósticos sintácticos, semánticos, de proyecto/workspace, de DataWindow y de build externo. Cada diagnóstico debe tener código, severidad, rango, fuente y, si aplica, datos relacionados.

### 11.7. Semantic Tokens

Semantic Tokens debe consumir AST/symbol graph/cache. No debe parsear de nuevo si el documento ya tiene snapshot válido.

---

## 12. Cache Layer

### 12.1. Niveles de cache

```text
L0 — Request-local cache
L1 — Active document snapshot
L2 — Workspace semantic index
L3 — Persistent metadata cache
```

### 12.2. Contrato obligatorio

Toda cache debe documentar:

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

### 12.3. Caches recomendadas

- active document snapshot;
- hover view model cache;
- negative hover cache;
- completion list cache;
- completion resolve cache;
- catalog lookup cache;
- DataWindow model cache;
- diagnostics cache;
- semantic tokens cache;
- workspace index cache;
- persistent metadata cache.

### 12.4. Regla de seguridad

Una cache nunca debe devolver información si no puede demostrar compatibilidad con versión del documento, versión del workspace/index, configuración activa, catálogo/built-ins cargados e invalidación pendiente.

---

## 13. PowerBuilder Domain Model

### 13.1. Entidades principales

```text
PBWorkspace
PBTarget
PBLibrary
PBObject
PBApplication
PBWindow
PBUserObject
PBMenu
PBFunction
PBEvent
PBVariable
PBStructure
PBDataWindowReference
```

### 13.2. Reglas semánticas propias

La arquitectura debe permitir modelar herencia PowerBuilder, eventos y funciones, scopes y shadowing, variables de instancia/locales/globales/shared, llamadas dinámicas cuando sea posible, resolución parcial y frameworks conocidos mediante packs o catálogos.

### 13.3. Built-ins y catálogo del sistema

Los símbolos del sistema deben proceder de catálogos versionados y auditables. El código no debe tener listas hardcoded dispersas de funciones, tipos, enums o statements.

---

## 14. DataWindow Domain

### 14.1. DataWindow como subdominio propio

DataWindow debe tener modelo propio, separado del parser principal de PowerScript.

```text
DataWindowSourceExtractor
  → DataWindowParser
  → DataWindowModel
  → DataWindowSqlModel
  → DataWindowBindingResolver
  → DataWindowSemanticProvider
```

### 14.2. Integración con PowerScript

La integración debe permitir detectar referencias a DataWindows desde objetos PB, resolver columnas/controles cuando sea posible, enriquecer hover/completion/diagnostics, relacionar errores DataWindow con código consumidor y cachear modelos DataWindow de forma independiente.

### 14.3. Separación de responsabilidades

El parser PowerScript no debe absorber la complejidad interna de DataWindow. Ambos dominios comparten símbolos, rangos, diagnósticos y fachada semántica, pero mantienen modelos separados.

---

## 15. Integraciones externas

### 15.1. Principio general

ORCA, PBAutoBuild y herramientas externas deben estar aisladas mediante adapters. El core semántico no debe depender directamente de procesos externos ni APIs de sistema.

### 15.2. ORCA Adapter

```text
OrcaLocator
OrcaSessionAdapter
OrcaLibraryReader
OrcaObjectExporter
OrcaErrorMapper
```

### 15.3. PBAutoBuild Adapter

```text
PBAutoBuildLocator
PBAutoBuildCommandBuilder
PBAutoBuildRunner
BuildOutputParser
BuildDiagnosticsMapper
```

---

## 16. Observabilidad y rendimiento

Los límites concretos viven en `docs/performance-budget.md`. Arquitectónicamente, toda feature interactiva debe medir latencia total, cache hit/miss, fallback usado, tamaño de respuesta, cancelaciones y errores recuperables.

Si una feature no puede resolver información completa dentro del presupuesto, debe devolver una respuesta parcial útil antes que bloquear el editor.

---

## 17. Testing arquitectónico

La estrategia completa vive en `docs/testing.md`, pero la arquitectura exige pruebas para parsing tolerante, indexación incremental, invalidación de caches, resolución semántica, hover/completion/signature, diagnostics, DataWindow, ORCA/PBAutoBuild adapters, performance smoke tests y fixtures reales.

Toda capa nueva debe diseñarse para ser testeable sin arrancar VS Code completo salvo en pruebas E2E específicas.

---

## 18. IA y consumo por agentes

La arquitectura debe ser consumible por agentes IA sin obligarlos a leer todo el repositorio.

- La arquitectura objetivo vive aquí.
- El contexto compacto vive en `docs/ai-context/powerbuilder-plugin-context.md`.
- La estrategia IA vive en `docs/ai-strategy.md`.
- La orquestación vive en `docs/ai-orchestration.md`.
- Los prompts viven o se indexan en `docs/prompts/`.
- Los agentes no deben duplicar arquitectura en sus propios documentos.

---

## 19. Reglas de evolución

### 19.1. Añadir una nueva feature LSP

1. definir provider fino;
2. reutilizar `RequestContext`;
3. consumir `SemanticQueryFacade`;
4. usar caches existentes o crear una con contrato;
5. añadir tests;
6. actualizar `architecture-status.md`, `backlog.md`/specs y documentación afectada.

### 19.2. Añadir una nueva cache

1. justificar hot path o coste evitado;
2. definir contrato completo;
3. declarar invalidación;
4. añadir métricas;
5. añadir tests de hit/miss/invalidation;
6. documentar relación con `performance-budget.md`.

### 19.3. Añadir una integración externa

1. crear adapter aislado;
2. no acoplar el core semántico al proceso/herramienta;
3. soportar ausencia de herramienta;
4. mapear errores a modelos internos;
5. añadir tests con fake/mocks;
6. documentar workflows si afecta al usuario.

---

## 20. Límites explícitos

Este documento no debe usarse para:

- listar todas las tareas pendientes;
- guardar histórico de cierres;
- copiar auditorías completas;
- mantener estado granular por spec;
- describir cada test concreto;
- almacenar prompts operativos largos;
- duplicar el mapa de implementación.

Si aparece ese contenido, debe moverse al documento propietario según `docs/constitution.md`.
