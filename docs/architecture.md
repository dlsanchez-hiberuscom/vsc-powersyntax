# Architecture.md — PowerBuilder VS Code Plugin

## 1. Objetivo

Definir la arquitectura base del plugin profesional de **PowerBuilder 2025 para Visual Studio Code**.

La arquitectura debe garantizar:

- carga rápida;
- activación perezosa;
- impacto mínimo en el Extension Host;
- descubrimiento e indexación muy rápidos sin bloquear;
- base semántica reutilizable;
- escalabilidad en workspaces grandes, mixtos y legacy;
- mantenibilidad a largo plazo;
- evolución incremental sin rehacer el núcleo;
- integración futura con automatización/IA mediante contratos públicos, no mediante acoplamiento al core.

---

## 2. Meta maestra

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Toda decisión arquitectónica debe proteger simultáneamente:

1. descubrimiento rápido;
2. indexación progresiva no bloqueante;
3. prioridad real al archivo activo;
4. latencia interactiva baja;
5. persistencia útil entre sesiones;
6. estado observable del motor;
7. semántica fuerte sin sacrificar tiempo hasta valor;
8. degradación segura cuando no exista contexto suficiente.

---

## 3. Principios arquitectónicos

### 3.1 Cliente mínimo real

El cliente de VS Code debe encargarse solo de:

- activación mínima;
- lifecycle del cliente LSP;
- bridge con servidor;
- comandos ligeros;
- configuración;
- estado visible básico;
- exportación de API pública mínima y versionada;
- UX ligera bajo demanda.

El cliente **no** debe contener análisis profundo ni semántica del lenguaje.

### 3.2 Servidor como runtime principal del conocimiento

El servidor LSP es responsable de:

- parseo;
- indexación;
- snapshots;
- semántica;
- resolución;
- diagnósticos;
- navegación;
- serving de capacidades de lenguaje;
- scheduling, readiness, observabilidad y backpressure.

### 3.3 Core agnóstico del editor

El core no debe depender directamente de:

- VS Code;
- LSP;
- JSON-RPC;
- DTOs externos;
- herramientas de IA concretas.

Toda integración externa debe resolverse en adaptadores de borde.

### 3.4 Fuente única de verdad semántica

La arquitectura debe converger a una base común donde:

- la sintaxis se representa una sola vez;
- símbolos y scopes se construyen una sola vez;
- la resolución se centraliza;
- las features consumen consultas compartidas;
- ninguna feature reconstruye semántica por su cuenta;
- la identidad exacta de símbolo se serializa una sola vez mediante `buildSymbolKey`;
- la única agregación relajada permitida es `buildConflictFamilyKey` para conflictos cross-project/cross-library.

### 3.5 Atomicidad del estado semántico

El sistema no debe exponer estados semánticos a medias.

Los cambios relevantes del conocimiento compartido deben publicarse:

- de forma coherente y atómica; o
- con degradación explícita, observable y segura.

### 3.6 Incrementalidad fina

El sistema debe recalcular solo lo necesario.

La invalidación debe ser:

- fina;
- explícita;
- cancelable;
- basada en impacto semántico real siempre que sea posible.

### 3.7 Persistencia robusta

La caché y la persistencia deben diseñarse con:

- versionado;
- invalidación clara;
- recuperación segura;
- estrategia explícita de reanudación;
- journaling cuando aplique.

Política oficial:

```text
migrate cuando la compatibilidad es estructuralmente segura;
rebuild cuando no lo es.
```

### 3.8 Explicabilidad y observabilidad

El motor debe poder exponer:

- qué está haciendo;
- qué parte del workspace está lista;
- qué caché está reutilizando;
- qué workload está diferido, preempted o degradado;
- por qué una query devolvió un resultado;
- por qué una feature degrada o bloquea una operación.

### 3.9 Source origin como principio arquitectónico

Toda entidad semántica debe poder expresar, cuando aplique, el origen de su fuente:

```text
solution-source
workspace-ws_objects
pbl-folder-source
orca-staging
pbl-dump-source
generated
unknown
```

Reglas:

- source real gana a staging;
- staging ORCA no equivale a source canónico;
- source generado no debe alimentar rename/import sin validación;
- operaciones peligrosas requieren `sourceOrigin` confiable.

### 3.10 Readiness, evidence y confidence como contrato transversal

Las features no deciden localmente si un resultado es seguro.

El sistema debe exponer contratos compartidos para:

- readiness;
- evidence;
- reason codes;
- confidence;
- degradación;
- bloqueo de operaciones peligrosas.

Deben consumir esos contratos:

- hover;
- completion;
- definition;
- references;
- rename;
- CodeLens;
- code actions;
- diagnostics;
- API pública;
- tools futuros;
- integraciones IA.

---

## 4. Invariantes arquitectónicos no negociables

- El cliente nunca parsea PowerBuilder.
- El cliente nunca reconstruye semántica.
- Las features nunca escanean el workspace completo en hot path.
- `.srd` nunca se parsea como PowerScript.
- `.pbl`/`.pbd` binarios nunca se tratan como source editable.
- `orca-staging` nunca gana a source real.
- `generated` nunca habilita operaciones write-enabled sin validación.
- `rename` y `code actions` requieren `sourceOrigin` confiable.
- `DYNAMIC`, external functions, PBX y strings DataWindow degradan confidence.
- Todo rail costoso declara budget, cancellation, readiness y observability.
- Todo cambio arquitectónico relevante actualiza documentación canónica.

---

## 5. Vista de alto nivel

```text
VS Code UI
  └─ Cliente ligero
      ├─ bootstrap mínimo
      ├─ commands ligeros
      ├─ estado visible
      ├─ API pública mínima/versionada
      ├─ UX read-only bajo demanda
      └─ bridge LSP

Language Server Process
  ├─ runtime/
  ├─ core/
  │   ├─ domain/
  │   ├─ application/
  │   └─ ports/
  ├─ workspace/
  ├─ parsing/
  ├─ knowledge/
  ├─ diagnostics/
  ├─ features/
  ├─ ux/
  ├─ adapters/
  └─ platform/
```

---

## 6. Capas principales

### 6.1 `client/`

Cliente mínimo de VS Code.

Responsabilidades:

- activación;
- wiring LSP;
- comandos ligeros;
- configuración;
- status visible;
- controllers UX bajo demanda;
- exportación de API pública mínima y versionada.

Prohibido:

- parseo PowerBuilder;
- semántica profunda;
- scans del workspace;
- lógica duplicada del servidor.

### 6.2 `runtime/`

Orquestación operativa del servidor.

Responsabilidades:

- scheduler;
- prioridades;
- yielding;
- cancelación;
- preempción;
- invalidación;
- backpressure;
- latency governor;
- warm resume;
- progreso;
- readiness;
- memory policy;
- runtime journal;
- health/status.

### 6.3 `core/domain/`

Conceptos canónicos:

- símbolos;
- scopes;
- tipos;
- referencias;
- dependencias;
- herencia;
- `sourceOrigin`;
- evidence;
- confidence;
- contratos internos.

### 6.4 `core/application/`

Casos de uso internos:

- analizar documento;
- actualizar conocimiento;
- resolver símbolos;
- calcular definition/references;
- preparar snapshots;
- servir consultas compartidas.

### 6.5 `core/ports/`

Puertos hacia infraestructura:

- filesystem;
- caché;
- persistencia;
- logging;
- reloj;
- observabilidad.

### 6.6 `workspace/`

Modelo y estrategia del workspace/proyecto:

- discovery;
- roots;
- project modes;
- markers;
- watch/scan;
- exclusiones;
- project context;
- `UnifiedProjectModel`;
- routing de source origin.

### 6.7 `parsing/`

Conversión de archivos PowerBuilder en estructuras sintácticas reutilizables.

Reglas:

- testeable sin VS Code;
- separado de semántica rica;
- no depende de transporte;
- comparte grammar/matchers canónicos;
- no parsea DataWindow como PowerScript.

### 6.8 `knowledge/`

Backbone semántico compartido:

- snapshots;
- symbols;
- binding;
- resolution;
- index;
- queries;
- publish atómico;
- semantic epochs;
- dependencias inversas;
- lineage;
- knowledge incremental;
- query policies.

### 6.9 `diagnostics/`

Reglas diagnósticas apoyadas en servicios comunes.

Regla: `diagnostics/` no reconstruye resolver, binder ni semántica local.

### 6.10 `features/`

Adaptadores finos para capacidades LSP:

- hover;
- completion;
- definition;
- references;
- rename;
- document symbols;
- workspace symbols;
- signature help;
- semantic tokens;
- diagnostics;
- code actions;
- linked editing;
- formatter.

Regla: consumen queries/servicios del core/knowledge y readiness/evidence/confidence.

### 6.11 `ux/`

Superficies visibles de producto:

- PowerBuilder Object Explorer;
- Current Object Context Panel;
- Project Health Dashboard;
- Diagnostics Explainability Panel;
- status contextual;
- comandos de inspección;
- vistas de diagnóstico/export.

Regla: `ux/` consume contratos públicos, LSP o API estable del servidor. No reconstruye semántica.

### 6.12 `adapters/`

Implementaciones de borde:

- filesystem;
- cache;
- logging;
- LSP;
- API local;
- JSON-RPC/tool bridge;
- ORCA;
- PBAutoBuild;
- futuras integraciones MCP/tools.

### 6.13 `platform/`

Primitivas técnicas compartidas:

- observability;
- performance;
- persistence;
- hashing;
- text;
- cancellation;
- ids;
- collections;
- safe serialization.

### 6.14 `shared/`

Separación conceptual:

- `shared/contracts/` → DTOs y mensajes compartidos;
- `shared/kernel/` → primitivas neutras.

Regla: los contratos no exponen directamente entidades internas mutables del dominio.

---

## 7. Estado explícito del sistema

### 7.1 Estado caliente del documento

- snapshot del documento activo;
- símbolos locales;
- scopes locales;
- contexto posicional;
- diagnostics rápidos;
- datos inmediatos de serving;
- cache interactiva acotada.

### 7.2 Estado semántico del workspace

- símbolos exportados;
- relaciones de herencia;
- dependencias;
- topología de proyecto;
- índices globales;
- readiness del proyecto/workspace;
- source origin contextual;
- conflict families.

### 7.3 Estado persistente

- fingerprints;
- metadata de caché;
- checkpoints;
- schema version;
- journals;
- resúmenes reutilizables;
- cleanup/retention policy.

### 7.4 Estado de origen y confianza

- `sourceOrigin`;
- evidence;
- reason codes;
- confidence;
- readiness mínima;
- degradación;
- bloqueo por feature.

---

## 8. Hot path vs cold path

### 8.1 Hot path interactivo

Permitido:

- active document snapshot;
- queries acotadas;
- serving cache;
- lookup O(1) de catálogo;
- readiness gates;
- cancellation;
- bounded candidate pools;
- reuse de líneas y masked text ya publicados.

Prohibido:

- workspace scan;
- full catalog clone;
- `JSON.stringify` masivo;
- reread global de archivos;
- reparsing global de DataWindow por feature;
- ORCA execution;
- PBAutoBuild execution;
- exports pesados;
- support bundles;
- reports no acotados.

### 8.2 Cold/background path

Permitido con budget y observabilidad:

- indexing de workspace;
- reports;
- cache cleanup;
- persistence compaction;
- catalog consistency reports;
- build discovery;
- ORCA/PBAutoBuild capability checks;
- exports offline;
- support bundles.

---

## 9. Modelo write-enabled seguro

Toda operación que escriba debe pasar por:

1. `sourceOrigin` confiable;
2. readiness mínima;
3. impact analysis;
4. safe edit plan;
5. preflight;
6. backup/ledger si toca PBL/staging;
7. validation receipt;
8. actualización documental si cambia arquitectura/spec/backlog.

Reglas:

- write-enabled no se ejecuta desde heurísticas locales de feature;
- staging ORCA requiere fingerprint compatible;
- generated source no habilita escritura directa;
- operaciones peligrosas se bloquean cuando confidence es insuficiente.

---

## 10. Estrategia de carga

### 10.1 Arranque en frío

El arranque debe hacer prácticamente cero trabajo pesado.

### 10.2 Primer archivo PowerBuilder

Orden:

1. activar cliente;
2. levantar servidor;
3. analizar primero el archivo activo;
4. publicar contexto útil del documento activo;
5. enriquecer dependencias inmediatas;
6. diferir trabajo global.

### 10.3 Indexación del workspace

Prioridad:

1. documento activo;
2. dependencias inmediatas;
3. contexto cercano;
4. resto del proyecto;
5. resto del workspace.

Siempre progresiva, cancelable, observable y no bloqueante.

---

## 11. Reglas de dependencia

- `client/*` no depende del core del servidor.
- `features/*` depende de consultas/servicios públicos del core/knowledge, no de estructuras crudas dispersas.
- `diagnostics/*` no reconstruye resolver o binder.
- `adapters/*` implementa puertos; no define dominio.
- `shared/contracts/*` no importa `core/domain/*`.
- `runtime/*` coordina ejecución; no contiene reglas semánticas profundas.
- `knowledge/*` puede depender de `core/domain` y `core/application`, pero no de UI ni de cliente VS Code.
- `ux/*` no accede a `core/domain/*` directamente.
- `features/*` y `ux/*` respetan readiness/evidence/confidence.
- `adapters/api-*` exponen contratos versionados, nunca entidades mutables internas.
- Las integraciones IA consumen API pública/tools/context packs, no dominio interno.

---

## 12. Guardrails arquitectónicos

Deben existir tests o scripts para proteger:

- firewall de imports entre capas;
- budgets de hotspots principales;
- ausencia de scans completos en hot path;
- ausencia de clones globales de catálogo en serving;
- ausencia de `JSON.stringify` pesado en features interactivas;
- separación PowerScript/DataWindow;
- source origin y confidence gates;
- query policy por consumer;
- backpressure policy por workload;
- compatibilidad de contratos públicos versionados;
- snapshots/fixtures de generadores críticos.

---

## 13. Fuente normativa PowerBuilder

La interpretación del lenguaje, objetos, DataWindow, SQL, ORCA, PBNI/PBX, Workspace/Solution y runtime se rige por la guía técnica canónica del lenguaje:

```text
docs/powerbuilder-2025-vscode-plugin-technical-guide.md
```

`Architecture.md` no redefine PowerBuilder. Solo define cómo el plugin implementa soporte sobre esa semántica.

---

## 14. Documentación viva

Toda decisión relevante sobre arquitectura debe actualizar, cuando aplique:

- `README.md`;
- `docs/architecture.md`;
- `docs/architecture-status.md`;
- `docs/roadmap.md`;
- `docs/backlog.md`;
- `docs/current-focus.md`;
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`;
- specs afectadas.

La documentación debe distinguir siempre entre:

- implementado;
- parcial;
- objetivo;
- experimental;
- deprecated.

---

## 15. Documentos relacionados

- `docs/architecture-status.md` — estado implementado actual y guardrails vigentes.
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` — semántica PowerBuilder y reglas de interpretación.
- `docs/catalog/catalog-localization-workflow.md` — workflow de overlays y authoring documental del catálogo.
- `docs/ai/ai-integration-architecture.md` — orquestación de tools, context bundles y surfaces IA.
- `docs/ai/ai-agents-catalog.md` — catálogo operativo de agentes IA del repositorio.
- `docs/build/README.md` — build, packaging, VSIX, PBAutoBuild y ORCA.
- `docs/current-focus.md` — foco actual.
- `docs/backlog.md` — trabajo pendiente.
- `docs/done-log.md` — historial cerrado.
- `docs/roadmap.md` — dirección de producto.

---

## 16. Resumen final

La arquitectura debe converger a:

1. cliente mínimo;
2. servidor como runtime principal;
3. core agnóstico;
4. knowledge pipeline compartido;
5. features como adaptadores finos;
6. UX sobre contratos públicos;
7. persistencia robusta;
8. observabilidad operativa;
9. `sourceOrigin` + evidence/confidence transversales;
10. crecimiento incremental sin rehacer el núcleo.
