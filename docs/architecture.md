# Architecture.md — versión IA-first LEAN

## 1. Objetivo

Definir la arquitectura base del plugin profesional de **PowerBuilder 2025 para Visual Studio Code**.

La arquitectura debe garantizar:

- carga rápida;
- activación perezosa;
- impacto mínimo en el Extension Host;
- descubrimiento e indexación muy rápidos sin bloquear;
- base semántica reutilizable;
- escalabilidad en workspaces grandes y legacy;
- mantenibilidad a largo plazo;
- evolución incremental sin rehacer el núcleo;
- y preparación futura para automatización/IA mediante contratos públicos, no mediante acoplamiento al core.

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

## 3. Decisiones arquitectónicas base

La arquitectura oficial es:

- **cliente ligero en VS Code**;
- **servidor LSP separado**;
- **prioridad absoluta al archivo activo**;
- **core semántico compartido y agnóstico del editor**;
- **análisis incremental, cancelable y observable**;
- **persistencia y caché como capacidades de primer nivel**;
- **readiness/evidence/confidence como contratos transversales**;
- **source origin explícito para evitar mezclar source real, staging y generado**;
- **features y UX como adaptadores finos**;
- **documentación viva alineada con el estado real del repositorio**.

---

## 4. Principios arquitectónicos

### 4.1 Cliente mínimo real

El cliente solo debe encargarse de:

- activación mínima;
- lifecycle del cliente LSP;
- exportación de API pública mínima y versionada;
- comandos ligeros;
- configuración;
- estado visible básico;
- bridge con el servidor.

No debe contener análisis profundo ni semántica del lenguaje.

### 4.2 Servidor como runtime principal del conocimiento

El servidor LSP es responsable de:

- parseo;
- indexación;
- semántica;
- resolución;
- diagnósticos;
- navegación;
- serving de capacidades de lenguaje.

### 4.3 Core agnóstico del editor

El core no debe depender directamente de:

- VS Code;
- LSP;
- JSON-RPC;
- DTOs externos;
- herramientas de IA concretas.

Toda integración externa debe resolverse en adaptadores de borde.

### 4.4 Fuente única de verdad semántica

La arquitectura debe converger a una base común donde:

- la sintaxis se representa una sola vez;
- símbolos y scopes se construyen una sola vez;
- la resolución se centraliza;
- las features consumen consultas compartidas;
- ninguna feature reconstruye semántica por su cuenta.

### 4.5 Atomicidad del estado semántico

El sistema no debe exponer estados a medias. Los cambios relevantes del conocimiento compartido deben publicarse de forma coherente y atómica, o con degradación explícita y segura.

### 4.6 Incrementalidad fina

El sistema debe recalcular solo lo necesario. La invalidación debe ser fina, explícita y basada en impacto semántico real siempre que sea posible.

### 4.7 Persistencia robusta

La caché y la persistencia deben diseñarse con:

- versionado;
- invalidación clara;
- recuperación segura;
- estrategia explícita de reanudación;
- journaling cuando aplique.

Política vigente de schema persistente:

- payloads compatibles del schema actual, o payloads heredados sin campos opcionales/materializados, se normalizan mediante migradores internos antes del restore;
- cualquier `schemaVersion` desconocido o incompatible fuerza `rebuild` limpio, sin migraciones ad hoc en caliente;
- la política oficial es `migrate cuando la compatibilidad es estructuralmente segura, rebuild cuando no lo es`.

### 4.8 Explicabilidad y observabilidad

El motor debe poder exponer:

- qué está haciendo;
- qué parte del workspace está lista;
- qué caché está reutilizando;
- por qué una query devolvió un resultado;
- por qué una feature degrada o bloquea una operación.

### 4.9 Source origin como principio arquitectónico

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
- operaciones peligrosas requieren source origin confiable.

Estado operativo actual:

- `KnowledgeBase`, `semanticQueryService` y `semanticWorkspaceManifest` ya consumen esa misma prioridad de `sourceOrigin`, de forma que un duplicado entre source real y `orca-staging` se sirve primero desde el origen real y el staging queda como backing read-only.

### 4.10 Readiness, evidence y confidence como contrato transversal

Las features no deben decidir localmente si un resultado es seguro. El sistema debe exponer contratos compartidos para:

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
- future tools/API/IA.

### 4.11 Estado real reciente

El repositorio ya materializa un primer corte operativo de:

- snapshot semántico canónico por documento;
- `KnowledgeBase` con publicación atómica y `semanticEpoch`;
- semantic diff, dependencias inversas e invalidación dirigida/transitiva;
- indexación estructural + enriquecida con prioridad al activo;
- budgets adaptativos, preempción y modo degradado;
- `UnifiedProjectModel` como base topológica compartida;
- cacheStore, workspaceKey estable, checkpoints y journals persistidos por proyecto, con policy v2 de retención/compactación, métricas de disco, cleanup TTL por workspace y comando local de mantenimiento fuera del hot path;
- warm resume de `DocumentCache` + `KnowledgeBase`;
- `ServingCache` extendido a hover/definition/signatureHelp/completion;
- `EntityLineage` como contrato de provenance/origen/fase/fiabilidad, ahora con `sourceOrigin` compartido con discovery, diagnostics y API pública;
- metadata contractual de símbolo (`declarationScope`, `fileObjectName`, `containerSignature`, `ownerName`, `implementationKind`, `returnType`) ya sale del análisis y no se reconstruye por feature;
- API pública v2 versionada, con descriptor contractual, inventario estable de metodos/schemas/tools y helpers de compatibilidad;
- catálogo versionado de task execution contracts injertado en ese descriptor público y servido por el tool `contract`, describiendo inputs/outputs, dry-run, límites write-enabled, receipts y handoff SDD sin mover IA dentro del core;
- bridge read-only JSON-RPC/local tool servido por API pública, con dispatch por nombre estable y payloads tipados en vez de accesos ad hoc al host;
- semantic workspace snapshot exportable/importable desde cliente sobre el mismo manifest versionado, sin publicar estado semántico parcial;
- diff read-only entre dos semantic workspace snapshots exportados, calculado cliente-side sobre el mismo contrato público y sin abrir un segundo motor semántico;
- grafo inmediato de dependencias PowerBuilder servido read-only por API pública/LSP, apoyado en snapshots y reverse dependencies ya publicados por `KnowledgeBase`, con export Mermaid/JSON y sin rescans del workspace;
- analizador read-only de conflictos cross-project servido por API pública/LSP/comando Markdown, agrupando entidades por `buildSymbolKey`, enriqueciendo proyecto/librería/sourceOrigin desde `WorkspaceState` y colapsando staging o duplicados de la misma ubicación sin abrir otro índice;
- asistente read-only de migración de workspace legacy servido por API pública/LSP/comando Markdown, derivado de `WorkspaceState`, summary de build files, project model y aliases ORCA para recomendar topología objetivo y saneamiento del layout sin abrir otro planner ni tocar archivos;
- matriz read-only de perfiles de build y validación de entorno servida por API pública/comando Markdown, derivada client-side de capability detection de PBAutoBuild, inventario completo de build files y build health ya publicados, sin crear otro rail de ejecución;
- reporte read-only de métricas avanzadas de código PowerBuilder servido por API pública/LSP/comando Markdown, derivado de snapshots semánticos, `DiagnosticsSnapshot`, bindings `DataObject` y footprint build/ORCA de `WorkspaceState`, con `maxObjects` acotado y sin reparsear ni abrir un segundo motor de scoring;
- informe read-only de deuda técnica y modernización servido por API pública/LSP/comando Markdown, compuesto sobre `code-metrics`, `diagnostic.code`, `sourceOrigin` summary y `workspaceMigrationAssistant`, sin inventar diagnósticos nuevos ni abrir heurísticas opacas paralelas;
- framework versionado de code actions seguras servido por LSP sobre diagnósticos ya publicados, con `catalogVersion`, preview explícita, preflight obligatorio y bloqueos por `sourceOrigin`/dynamic strings antes de proponer cualquier edit;
- gobernanza de settings y perfiles del producto servida por una surface compartida entre cliente y API pública, sin defaults opacos;
- current object context pack read-only servido por API pública/LSP, derivado del snapshot semántico, hierarchy inspection, diagnostics y bindings `DataObject` en vez de scans ad hoc para IA, ahora ampliado con variables visibles para sostener surfaces UX sin recomputación local;
- impact analyzer read-only servido por API pública/LSP, compuesto desde `references`, descendientes/overrides, events, bindings `DataObject` y project routing en vez de listas planas por nombre;
- safe edit plan read-only servido por API pública/LSP, derivado del impacto explícito y del context pack para proponer archivos, riesgos, tests y docs sin ejecutar cambios;
- safe batch refactor planning read-only servido por API pública/LSP y por el tool bridge, reutilizando `rename` preflight, `impact analysis` y `safe edit plan` en vez de abrir otra engine de impacto;
- workflows write-enabled `applySpecDrivenPblUpdate` / `applySpecDrivenPblUpdateBatch` servidos por API pública/LSP, reutilizando `safeEditPlan`, export ORCA fresco, edits explícitos sobre staging y el mismo rail de import con backup/ledger/journal en vez de abrir un motor legacy paralelo;
- exportación cliente-side de semantic repro packs reutilizando esas mismas surfaces read-only, `serverStats` y copias de archivos relacionados en un bundle versionable bajo `tools/semantic-repros`, sin abrir un motor paralelo en servidor;
- exportación cliente-side de support bundles offline saneados bajo `tools/support-bundles`, reutilizando `serverStats`, manifest semántico, gobernanza de settings y el inventario API/tool ya público, con redacción explícita de rutas/URIs/ejecutables y sin exportar código bruto por defecto;
- semantic workspace manifest read-only servido por API pública/LSP, derivado de `WorkspaceState`, `UnifiedProjectModel`, `KnowledgeBase`, `InheritanceGraph`, knowledge packs curados y diagnostics snapshot para exponer estructura compacta/versionada del workspace sin exportar código bruto;
- diagnostics snapshot agrupado por proyecto/objeto;
- contrato diagnóstico estable por `diagnostic.code`, con helpers compartidos para leer IDs emitidos actuales y fallback al sufijo legacy de `source` solo donde aún haga falta compatibilidad;
- compactación de strings calientes;
- latency governor en serving/scheduler;
- hierarchy inspection y CodeLens más fiables;
- `RuntimeJournal` exportable del motor, alimentado desde `queryTrace`, `ServingCache` e invalidaciones documentales reales, servido por `showStats`/status sin abrir un canal paralelo y ahora también proyectado a un journal persistente acotado para `phase: build|legacy`;
- health checker estructurado del runtime con findings por capa y severidad sobre readiness, scheduler, project model, cachés, persistencia y ambigüedad de query;
- watcher incremental completo sobre source + markers de topología, con refresh de `UnifiedProjectModel`/`sourceOrigin` desde el puente real LSP -> watcher y sin rediscovery completo para cambios calientes;
- `references`, `rename` y CodeLens apoyados en un candidate pool compartido y acotado por query/proyecto, con reuso de líneas y `maskedText` ya publicados por snapshot en lugar de rereads/remasking globales;
- formatter conservador configurable sobre documentos PowerScript soportados, alojado como motor puro compartido y ejecutado en servidor LSP mediante `powerbuilder.formatDocument`; el cliente conserva solo selector/configuración/UX ligera y el servidor aplica budgets explícitos por caracteres/líneas para degradar archivos grandes sin parsear DataWindow como PowerScript.
- `knowledge/parsing/utils` ya usan tipos internos para posiciones/rangos/símbolos documentales y dejan `DocumentSymbol`/DTOs LSP en el borde de `features/documentSymbols`, protegidos además por un test arquitectónico de imports.
- `documentSymbols` ejecuta ahora una reconciliación explícita entre `sections/typeBlocks` del parser, facts/scopes del snapshot y el árbol LSP a publicar, generando reason codes y reporte interno antes de servir el outline.
- carril moderno de build ya materializado en siete piezas: el cliente resuelve `PBAutoBuild250.exe` por configuración/entorno/candidatos por defecto, el servidor descubre/valida build files JSON y lista los utilizables, un runner server-side dedicado ejecuta `PBAutoBuild` out-of-process con selección segura/timeout/cancelación, un parser server-side resuelve problemas de build a una colección diagnóstica separada del canal semántico, el cliente consolida todo en un snapshot único de build health, recuerda/repite el último build frecuente por workspace y además exporta bundles neutrales de CI/CD (`manifest` + scripts) bajo `tools/pbautobuild-ci/<perfil>`; `B198` y `B195` ya quedan cerradas: la guía operativa está alineada y el packaging ORCA de `EXE/PBD/DLL` queda explícitamente no expuesto detrás de un feature flag aún no abierto.
- runtime expone un reporte unificado de budgets de memoria por capa (`analysis`, `serving`, `documents`, `hot-context`, `code-lens`, `knowledge`) con estimates soft y vigilancia integrada en `showStats`, health checker y status visible.
- cliente expone un dashboard read-only de salud del proyecto componiendo `showStats`, `semanticWorkspaceManifest`, reportes de status/health y snapshot de build ya publicados, sin abrir una ruta paralela de cálculo en servidor.
- cliente expone también un Object Explorer read-only sobre `semanticWorkspaceManifest` enriquecido, agrupado por proyecto/librería/kind y filtrable por proyecto/archivo activo, sin consultas per-node ni un segundo índice local.
- el project model unificado ya materializa también nodos legacy `kind: library` para roots `.pbl` no cubiertos por `.pbt/.pbproj`, permitiendo modo `pbl-only` y surfaces read-only coherentes antes de abrir staging ORCA.
- cliente expone además un Current Object Context Panel read-only que sigue el editor activo y proyecta `currentObjectContext` ya servido por API pública, incluyendo ancestor chain, variables visibles, members, diagnostics, bindings `DataObject` y evidence/confidence sin motor semántico paralelo.
- cliente expone tambien un Diagnostics Explainability Panel read-only que proyecta `diagnostic.code`, severidad y localizacion del editor activo sin parsear el Problems Panel ni recomputar diagnosticos.
- carril ORCA legacy ya queda partido en cuatro capas: un adapter base server-side, out-of-process y cancelable; una capability read-only cliente-side resuelta desde configuración explícita o `PB_ORCA_PATH`, publicada como `orcaTooling`; un export controlado a `.vsc-powersyntax/orca-export/{orca-staging,scripts,state}` que persiste aliases desde cada carpeta staging hacia la librería `.pbl` original para que routing/manifest sigan atribuyendo proyecto y librería al graph legacy real, mientras `KnowledgeBase` y query/serving priorizan siempre el source real cuando ambos publican el mismo símbolo y `last-export.state` conserva fingerprints del source real rastreado por objeto; un rail write-enabled único que hoy materializa `import-from-staging.orc`, `regenerate-from-staging.orc`, `rebuild-from-staging.orc`, `applySpecDrivenPblUpdate` y `applySpecDrivenPblUpdateBatch`, siempre con preflight, backup binario, ledgers persistidos y journal técnico antes de tocar la PBL; y un journal técnico persistente en `.vsc-powersyntax/runtime/build-orca-journal.json` que conserva eventos `build|legacy` del mismo `RuntimeJournal`. `import` ya bloquea fingerprint mismatch y `stale staging`; además, `orcaTooling.packagingPolicy` publica de forma explícita que el packaging `EXE/PBD/DLL` no está expuesto y requeriría un feature flag dedicado fuera del hot path.
- query engine compartido con modelo explícito de invocación PowerBuilder (`unqualified`, `this`, `parent`, `super`, `ancestor`, global, dynamic, external`) y propagación de `invocationKind`/`invocationRisk` a trace, context y operaciones semánticas;
- eventos PowerBuilder tratados como entidades de primera clase: `on object.event` conserva owner real, `call super::create` resuelve sobre on-handlers reales y `TriggerEvent/PostEvent` con literal estable reusan el mismo backbone semántico.
- lifecycle PowerBuilder integrado en surfaces visibles: `hierarchyInspection` reconstruye create/destroy desde snapshot semántico, hover explica `constructor/destructor` desde el mismo modelo y diagnostics emite warnings suaves (`missing-super-*`, `missing-trigger-*`, `unresolved-*`) sin abrir un segundo motor.
- PowerBuilder Language Knowledge Catalog v2: una fuente centralizada y versionada que sirve no solo ancestros nativos y tipos raíz (powerobject, throwable, etc.), sino también el modelo completo de lenguaje incluyendo keywords, reserved words, datatypes, pronouns, operators, system globals y enumerated values; proporciona metadata rica (summaries, categorías, documentación) y APIs de consulta indexadas para hover, completion, semantic tokens y diagnostics sin recomputar semántica en el hot-path.
- modelo transaccional básico integrado en el backbone: `SQLCA` se resuelve como `transaction` especial, `SetTransObject`/`SetTrans` enlazan con `Retrieve`/`Update` en diagnostics y las superficies interactivas (`completion`/`hover`/`signatureHelp`) filtran el catálogo por `ownerType` para DataWindow/DataStore sin lookup plano por nombre.
- bridge DataWindow integrado en el mismo backbone: `.srd` publica stubs navegables sin parsearse como PowerScript, `DataObject = "d_xxx"` resuelve hacia el snapshot `.srd` ya indexado, `signatureHelp` reutiliza `arguments=(...)`/`ARG(...)` para especializar `Retrieve(...)`, el safe mode resume SQL base/columnas/bandas principales para hover, `dataWindowModel` aporta un modelo reutilizable para hover/definition/documentSymbols, el slice avanzado actual cubre `report(name=... dataobject=...)`, `column.dddw.name`, property paths `Describe/Modify(...DataWindow.Table.Select)`, acceso directo `.Object.<control|column|property>` y `GetChild()` sobre child DataWindows deterministas, `dataWindowSqlLineage` expone por API pública/LSP/comando Markdown el árbol SQL read-only de root/report/dropdown reutilizando ese mismo backbone, y `completion`/`diagnostics` consumen el mismo resolver de property paths con una excepción segura al guard de strings solo en contexto DataWindow reconocible y warnings conservadores sobre rutas completas no resolubles; todo ello degradando con honestidad cuando el binding o la ruta no son defendibles, sin abrir stores globales paralelos.
- dependencias nativas externas modeladas como primer ciudadano ligero: `externalAlias`, `externalDependencyKind` (`dll`, `pbx`, `unknown`), hover explícito y degradación honesta de rename/references/diagnostics sin fingir implementation interna.
- cierre de documento ahora expulsa solo la caché interactiva de análisis y no borra `DocumentCache`/`KnowledgeBase`; la eliminación real de conocimiento queda reservada a eventos de borrado de archivo.
- `KnowledgeBase` ya publica mutaciones con copy-on-write por bucket (ids, kinds y dependencias), y `workspaceSymbols`, API symbols, completion global y manifest semántico consumen consultas/conteos acotados para evitar materializar toda la base cuando solo se necesitan resultados limitados.
- CodeLens mantiene caché LRU acotada, invalidable por URI y visible en stats/health, en línea con los budgets de memoria pendientes de `B070`.
- el selector LSP del cliente y un guard server-side compartido evitan servir markers `.pbw/.pbt/.pbproj/.pbsln` y `.pbl` binarios como documentos PowerScript, aunque se fuerce un lenguaje servido; discovery/topología siguen observándolos por watcher.

---

## 5. Vista de alto nivel

```text
VS Code UI
  └─ Cliente ligero
      ├─ bootstrap mínimo
      ├─ commands ligeros
      ├─ estado visible
      ├─ API pública mínima + análisis/planes/context packs read-only
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

Cliente mínimo de VS Code. Responsable de activación, wiring con servidor, configuración, comandos ligeros, status mínimo y exportación de API pública mínima.

### 6.2 `runtime/`

Orquestación operativa del servidor. Responsable de scheduler, prioridades, yielding, cancelación, preempción, invalidación, backpressure, gobernador de latencia, warm resume, progreso y readiness.

### 6.3 `core/domain/`

Conceptos canónicos del sistema: símbolos, scopes, tipos, referencias, dependencias, herencia, sourceOrigin, evidence/confidence y contratos internos.

### 6.4 `core/application/`

Casos de uso internos: analizar documento, actualizar conocimiento, resolver símbolos, calcular definition/references, preparar snapshots y servir consultas compartidas.

### 6.5 `core/ports/`

Puertos hacia infraestructura: filesystem, caché, persistencia, logging, reloj, observabilidad.

### 6.6 `workspace/`

Modelo y estrategia del workspace/proyecto: discovery, roots, project modes, exclusiones, markers, watch/scan, project context y `UnifiedProjectModel`.

### 6.7 `parsing/`

Conversión de archivos PowerBuilder en estructuras sintácticas reutilizables. Debe ser testeable sin VS Code y separado de semántica rica. `parsing/grammar.ts` es el módulo canónico para keywords, matchers estructurales, secciones y bloques compartidos; parser, diagnostics y features deben consumirlo antes de introducir regex nuevas.

### 6.8 `knowledge/`

Backbone semántico compartido: snapshots, symbols, binding, resolution, index, queries, publish atómico, epochs semánticas, dependencias inversas, lineage y conocimiento incremental.

### 6.9 `diagnostics/`

Reglas diagnósticas apoyadas en servicios comunes. No reconstruye semántica.

### 6.10 `features/`

Adaptadores finos para capacidades LSP: hover, completion, definition, references, rename, document symbols, workspace symbols, signature help, semantic tokens, diagnostics y code actions.

### 6.11 `ux/`

Superficies visibles de producto para el desarrollador:

- PowerBuilder Object Explorer;
- Current Object Context Panel;
- Project Health Dashboard;
- status contextual;
- comandos de inspección;
- vistas de diagnóstico/export.

Regla: `ux/` consume contratos públicos, LSP o API estable del servidor. No reconstruye semántica ni accede directamente a estructuras internas del dominio.

### 6.12 `adapters/`

Implementaciones concretas de borde: filesystem, cache, logging, LSP, API local, futura integración MCP/tools.

### 6.13 `platform/`

Primitivas técnicas compartidas: observability, performance, persistence, hashing, text, cancellation, ids, collections.

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
- datos inmediatos de serving.

### 7.2 Estado semántico del workspace

- símbolos exportados;
- relaciones de herencia;
- dependencias;
- topología de proyecto;
- índices globales;
- readiness del proyecto/workspace.

### 7.3 Estado persistente

- fingerprints;
- metadata de caché;
- checkpoints;
- schema version;
- journals;
- resúmenes reutilizables.

Schema persistente actual:

- `semantic-checkpoint.json`: `schemaVersion`, `semanticEpoch`, `createdAt`, `metadata` (`workspaceMode`, `rootUris`, `projectStats`, `publishedAt`) y `documents` persistidos;
- `semantic-journal.json`: `schemaVersion`, `sequence`, `semanticEpoch`, `createdAt`, `kind`, `uris` y `documents` opcionales para `upsert`;
- `build-orca-journal.json`: `schemaVersion`, `updatedAt` y snapshot tipado de eventos persistidos para `phase: build|legacy`, accesible también desde `showStats.persistence.buildOrcaJournalUri`;
- si el payload conserva compatibilidad estructural, el restore normaliza campos faltantes; si no, la decisión canónica es invalidar y reconstruir.

### 7.4 Estado de origen y confianza

- `sourceOrigin`;
- evidence;
- reason codes;
- confidence;
- readiness mínima;
- degradación o bloqueo por feature.

---

## 8. Reglas de dependencia

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
- las integraciones IA consumen API pública/tools/context packs, no dominio interno.
- `B229` ya queda cerrada: `documentAnalysis`, `analysisCache`, indexador y watcher consumen `sourceOrigin` contextual desde `WorkspaceState`/routing y dejan `inferSourceOrigin()` solo como fallback cuando la autoridad contextual es inexistente o sigue en `unknown`.

---

## 9. Componentes temporales y migración

Las capas bootstrap son válidas si aportan valor temprano, pero deben ser explícitas, temporales, decrecientes y con dirección clara de migración.

> Ninguna capa provisional debe convertirse en núcleo permanente por acumulación histórica.

La dirección objetivo es que el peso semántico migre progresivamente hacia:

- `core/`;
- `knowledge/`;
- `runtime/`.

---

## 10. Estrategia de carga

### 10.1 Arranque en frío

El arranque debe hacer prácticamente cero trabajo pesado.

### 10.2 Primer archivo PowerBuilder

1. activar cliente;
2. levantar servidor;
3. analizar primero el archivo activo;
4. enriquecer dependencias inmediatas;
5. diferir trabajo global.

### 10.3 Indexación del workspace

Prioridad:

1. documento activo;
2. dependencias inmediatas;
3. contexto cercano;
4. resto del proyecto;
5. resto del workspace.

Siempre progresiva, cancelable y no bloqueante.

---

## 11. Reglas transversales

- El cliente no implementa semántica pesada.
- El parser no depende de VS Code.
- La semántica no depende de UI ni transporte.
- Handlers LSP no contienen lógica de negocio profunda.
- El dominio no conoce JSON ni DTOs.
- Ninguna feature reconstruye semántica por su cuenta.
- Toda capacidad costosa declara prioridad, invalidación, cache, cancelación y presupuesto.
- Toda decisión estructural relevante actualiza documentación canónica.

---

## 12. Regla de alineación documental

Toda decisión relevante sobre arquitectura debe actualizar, cuando aplique:

- `README.md`;
- `docs/architecture.md`;
- `docs/roadmap.md`;
- `docs/backlog.md`;
- `docs/current-focus.md`;
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`;
- specs afectadas.

La arquitectura documentada debe distinguir siempre entre implementado, parcial y objetivo.

---

## 13. Resumen final

La arquitectura debe converger a:

1. cliente mínimo;
2. runtime explícito;
3. core agnóstico;
4. knowledge pipeline compartido;
5. features como adaptadores finos;
6. UX sobre contratos públicos;
7. persistencia robusta;
8. observabilidad operativa;
9. source origin + evidence/confidence transversales;
10. crecimiento incremental sin rehacer el núcleo.
