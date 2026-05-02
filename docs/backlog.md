# Backlog — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---

## 0. Meta maestra

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Toda spec nueva debe respetar esta meta. Si una mejora aumenta complejidad pero no mejora velocidad percibida, estabilidad, seguridad semántica, entendimiento real de PowerBuilder o utilidad profesional, no debe priorizarse sobre el core.

---

## 1. Cómo debe usar este backlog una IA

- Ejecutar por orden de prioridad global.
- No abrir ítems si sus dependencias no están cerradas, salvo trabajo preparatorio claro.
- Crear sub-specs solo cuando vaya a implementarse el ítem.
- No cerrar si falta código real, tests/validación suficiente, documentación alineada y actualización de roadmap/current-focus si aplica.
- Si un ítem crece demasiado, dividir en sub-specs, no duplicar ítems padre.
- Registrar deuda nueva en **Backlog derivado**.
- Tratar `plugin_old` como guía, dataset y referencia de patrones probados, no como código a portar por inercia.
- Las dependencias hacia ítems `Done` se consideran ya satisfechas y quedan solo como trazabilidad histórica.
- No sacrificar la meta maestra por features secundarias.

---

## 2. Estados oficiales

- **Open:** sin slice activa de cierre.
- **Partial:** implementación parcial o primer corte operativo, pero faltan criterios de cierre.
- **Ready for closure:** código y tests básicos existen; falta revisión final, documentación o validación ampliada.
- **Blocked:** no puede avanzar por dependencia, entorno o decisión explícita.
- **Done:** código, tests, documentación y validación cerrados; vive en `done-log.md`, no en backlog activo.

Un ítem `Partial` debe incluir, siempre que sea posible:

```md
**Pendiente exacto:**
- ...
```

---

## 3. Orden maestro de prioridad

### L0 — Core platform no negociable

Estado: cerrado como bloque operativo. Los ítems cerrados viven en `done-log.md`.

### L1 — Persistencia y modelo de workspace/proyecto

Pendiente de cierre operativo fino.

### L2 — Query engine y serving profesional

Foco principal actual.

### L2.5 — PowerBuilder semantic understanding

Nuevo carril para mejorar el entendimiento real de PowerBuilder antes de DataWindow profundo, build avanzado o automatización IA.

### L3 — Validación fuerte, salud interna y excelencia operativa

Validación real, corpus, health, performance y calidad operativa.

### L4 — Especialización PowerBuilder y automatización

DataWindow, PBAutoBuild, ORCA/PBL y especialización del ecosistema.

### L4.5 — AI-ready PowerBuilder context

Contexto semántico read-only para IA antes de automatización write-enabled.

### L5 — Documentación IA-first y workflows

Gobierno documental, workflows de usuario y reglas diagnósticas.

---

## 4. Ítems cerrados fuera del backlog activo

Los siguientes ítems ya no deben aparecer como trabajo activo:

```text
B031, B032, B063, B065, B066, B071B, B109, B122, B123, B124, B125, B126,
B134, B141, B141A, B151, B151A, B152, B152A, B153, B154, B155,
B156, B158, B159, B163, B164, B165, B166, B169, B169A, B170,
B172, B173, B174, B176
```

El detalle técnico de cierre vive en `done-log.md`.

---

# 5. Backlog activo

# L1 — Persistencia y modelo de workspace/proyecto

Sin ítems activos tras el cierre completo de `B155`. El histórico de persistencia cerrada vive en `done-log.md`.

---

# L2 — Query engine y serving profesional

## B067 — Formateador configurable
- **Estado:** Open
- **Track:** productividad
- **Depende de:** B156, B205
- **Objetivo:** formateo configurable solo sobre base sintáctica/semántica fiable.
- **Cierre:** formatter sin romper constructs PowerBuilder reales.

---

# L2.5 — PowerBuilder semantic understanding

## B204 — Source origin model unificado
- **Estado:** Closed
- **Track:** core topology / provenance
- **Depende de:** B141, B172
- **Desbloquea:** B171, B192, B193, B217, B220
- **Objetivo:** clasificar de forma uniforme el origen de cada documento, símbolo y snapshot semántico.
- **Resultado real:**
  - contrato compartido de `sourceOrigin` con prioridad explícita entre `solution-source`, `workspace-ws_objects`, `pbl-folder-source`, `manual-export-source`, `orca-staging`, `pbl-dump-source`, `generated`, `backup`, `unknown`;
  - `WorkspaceState`, discovery y checkpoints persisten y restauran origen por archivo junto al snapshot semántico del workspace;
  - `EntityLineage`, query evidence, diagnostics snapshot, `showStats` y la API pública de `querySymbols()` exponen ya `sourceOrigin` de forma estable;
  - el runtime prefiere el origen de mayor prioridad al recomputar o fusionar procedencia para un mismo documento conocido.
- **Cierre:** todas las queries, diagnostics y surfaces públicas explican de dónde viene cada símbolo y priorizan source real frente a staging/export.

## B206 — Rich PowerBuilder symbol metadata
- **Estado:** Closed
- **Track:** semantic model
- **Depende de:** B157, B204
- **Desbloquea:** B031, B032, B065, B117, B207, B209, B210, B217
- **Objetivo:** enriquecer progresivamente el modelo de símbolo con metadata específica de PowerBuilder.
- **Resultado real:**
  - `documentAnalysis` y `semanticFacts` ya emiten `containerKind`, `containerSignature`, `fileObjectName`, `declarationScope`, `implementationKind`, `ownerName`, `parameterCount`, `returnType`, `access` y `sourceOrigin` cuando aplican;
  - `hoverFormat` consume el contrato enriquecido para distinguir prototype, implementation, on-handler, external function, member/local/parameter y owner real sin recomputar metadata fuera del backbone;
  - `documentSymbols`, `references`, `rename`, `queryEngineConsistency`, `workspaceSymbols` y `cachePersistence` quedaron validados contra el modelo enriquecido sin romper contratos públicos;
  - los campos añadidos no quedan muertos: se internan, participan en `semanticDiff` y quedan cubiertos por tests focalizados de `documentAnalysis`, `enrichEntity` y `hoverFormat`.
- **Fuera de alcance inicial:**
  - no añadir campos no usados por ninguna feature;
  - no romper contratos públicos existentes.
- **Cierre:** las features semánticas distinguen prototype, implementation, on-handler, external function, member/local/parameter y owner real.

## B207 — External functions and native dependency model
- **Estado:** Closed
- **Track:** PowerBuilder ecosystem / native dependencies
- **Depende de:** B206
- **Desbloquea:** B202, B217, B222
- **Objetivo:** modelar funciones externas, DLL/PBX/PBNI y dependencias nativas sin tratarlas como símbolos internos.
- **Resultado real:**
  - el parser y el backbone semántico conservan ya `library "..."`, `alias for`, `externalAlias` y `externalDependencyKind` (`dll`, `pbx`, `unknown`) para external functions y subroutines;
  - `hoverFormat` explica librería, alias y tipo de dependencia nativa sin presentar la declaración externa como implementation interna del plugin;
  - `rename` bloquea dependencias nativas externas y `references` degrada a la declaración cuando el target resuelto es externo, evitando prometer reescritura o cobertura interna falsa;
  - `diagnostics` emite ya una nota informativa para declaraciones externas sin implementación interna navegable y la metadata nueva queda validada también en `semanticDiff`, `stringInterning`, `cachePersistence`, `workspaceSymbols` y `semanticQueryService`.
- **Cierre:** el plugin reconoce dependencias nativas y evita prometer navegación interna falsa.

## B208 — Dynamic string reference detector
- **Estado:** Closed
- **Track:** semantic safety
- **Depende de:** B157, B206
- **Desbloquea:** B171, B032, B217, B219, B222
- **Objetivo:** detectar referencias semánticamente relevantes dentro de strings dinámicos y degradar confidence cuando afecten operaciones peligrosas.
- **Resultado real:**
  - detector conservador reusable para `Open("w_xxx")`, `DataObject = "d_xxx"`, `TriggerEvent`, `PostEvent`, `EvaluateJavaScriptSync/Async`, JSON paths, SQL dinámico y `Describe/Modify/Evaluate`;
  - clasificación explícita `safe-literal`, `probable`, `dynamic`, `unknown` con tests focalizados;
  - `rename` se bloquea cuando aparece un hit no seguro en strings dinámicos;
  - `references` degrada a definiciones cuando hay hits dinámicos en vez de prometer cobertura textual falsa.
- **Cierre:** rename/references/code actions bloquean o degradan cuando un símbolo aparece en strings dinámicos.

## B209 — PowerBuilder call model and invocation classification
- **Estado:** Closed
- **Track:** semantic resolution
- **Depende de:** B157, B206
- **Desbloquea:** B031, B032, B210, B218, B222
- **Objetivo:** clasificar llamadas PowerBuilder según forma y riesgo semántico.
- **Resultado real:**
  - `invocationContext` distingue ya `.` y `::`, y conserva la forma sintáctica de la invocación para `this`, `parent`, `super`, `ancestor` y qualifiers tipados;
  - `semanticQueryService` resuelve el current object real por línea/scope, añade `invocationKind`/`invocationRisk`, y clasifica llamadas no cualificadas, `this.uf_xxx()`, `parent.uf_xxx()`, `super::uf_xxx()`, `ancestor::event`, global functions, llamadas dinámicas y external functions;
  - `queryContext`, `queryTrace` y la API pública mínima propagan esa clasificación y el tipo de qualifier resuelto para que definition/references/rename/completion/signatureHelp compartan la misma explicación de resolución;
  - la validación focal cubre `invocationContext`, `queryContext`, `semanticQueryService` y `definition`, y la pasada lateral mantiene verdes `references`, `rename`, `renamePreflight`, `queryEngineConsistency`, `completion` y `signatureHelp`.
- **Cierre:** definition, references y rename comparten el mismo modelo de invocación y pueden explicar cada resolución con reason code, confidence y clasificación de invocación.

## B210 — PowerBuilder event model
- **Estado:** Closed
- **Track:** semantic model / events
- **Depende de:** B206, B209
- **Desbloquea:** B065, B031, B213, B217, B222
- **Objetivo:** modelar eventos PowerBuilder como entidades semánticas de primera clase.
- **Resultado real:**
  - el parser de `on object.event` separa ya owner y event name, preserva la firma cualificada y cuelga el scope del owner real en vez del `global type` por defecto;
  - `documentAnalysis` materializa eventos de controles y de objetos raíz como `EntityKind.Event` con `implementationKind: on-handler`, `containerName`/`ownerName` correctos y `fileObjectName` estable;
  - `definition`, `references` y `queryContext` resuelven ya `call super::create`, `TriggerEvent(this, "create")` y `cb_ok.PostEvent("clicked")` contra los on-handlers reales usando el mismo query engine compartido;
  - `hover`, `documentSymbols`, `completion`, `signatureHelp`, `semanticTokens`, `rename` y `queryEngineConsistency` quedaron validados sin romper el backbone semántico ni la degradación conservadora de strings realmente dinámicos.
- **Cierre:** el plugin navega y explica eventos, owners y literales estables de `TriggerEvent/PostEvent` sin tratarlos como funciones planas.

## B211 — Transaction and SQLCA semantic model
- **Estado:** Closed
- **Track:** PowerBuilder database semantics
- **Depende de:** B206, B209
- **Desbloquea:** B117, B184, B212, B217
- **Objetivo:** modelar el uso de `Transaction`, `SQLCA`, `SetTransObject`, `Retrieve`, `Update` y SQL embebido.
- **Resultado real:**
  - `semanticQueryService` y `queryContext` tratan `SQLCA` como transaction global especial, lo que estabiliza el owner-type de `SQLCA.*` dentro del backbone semántico compartido;
  - `completion`, `hover` y `signatureHelp` consumen members del catálogo filtrados por `ownerType`, de modo que `datastore/datawindow.SetTransObject`, `SetTrans`, `Retrieve`, `Update` y `SQLCA.DBHandle()` explican la API correcta en vez de una coincidencia plana por nombre;
  - `diagnostics` enlaza ya `SetTransObject`/`SetTrans` con `Retrieve`/`Update` cuando la transaction es resoluble, avisa cuando falta una transaction conocida y degrada la confidence cuando el binding es dinámico;
  - la parte de SQL estático/dinámico queda apoyada en las piezas ya existentes de `sqlRegions` y `dynamicStringReferences`, y la validación integral mantiene verdes `completion`, `diagnostics`, `hover`, `signatureHelp`, `sqlRegions` y `dynamicStringReferences`.
- **Cierre:** el plugin explica relaciones básicas entre código, DataStore/DataWindow y transaction object.

## B213 — PowerBuilder object lifecycle model
- **Estado:** Closed
- **Track:** semantic model / lifecycle
- **Depende de:** B210
- **Desbloquea:** B065, B217, B045
- **Objetivo:** modelar create/destroy, constructor/destructor y llamadas ancestor en objetos PowerBuilder.
- **Resultado real:**
  - `hierarchyInspection` proyecta ya create/destroy como fases lifecycle con evidencia de `call super::create/destroy`, hooks `constructor/destructor`, resolución del hook y warnings suaves por wiring sospechoso a partir del snapshot semántico publicado;
  - `hover` reutiliza ese mismo bloque lifecycle para explicar `constructor/destructor` estables disparados desde `TriggerEvent(this, ...)` sin tratarlos como eventos planos ni recomputar semántica fuera del backbone;
  - `diagnostics` emite ahora warnings suaves para lifecycle sospechoso (`missing-super-*`, hook declarado pero no disparado, hook disparado pero no resoluble) reutilizando el mismo modelo que hierarchy inspection;
  - `definition` y la resolución de eventos sobre `call super::create` y `TriggerEvent/PostEvent` permanecen soportadas por el query engine compartido ya cerrado en `B210`, sin abrir un motor paralelo para B213.
- **Cierre:** hierarchy inspection y hover explican flujo de inicialización/destrucción.

---

# L3 — Validación fuerte, salud interna y excelencia operativa

## B070 — Memory budgets de caché e índice
- **Estado:** Open
- **Track:** escala
- **Depende de:** B164
- **Objetivo:** límites explícitos de memoria y métricas por capa.
- **Cierre:** budgets definidos, medidos y vigilados.

## B162 — Reconciliación parser / symbol model / salida LSP
- **Estado:** Open
- **Track:** consistencia interna
- **Depende de:** B151, B156
- **Objetivo:** detectar incoherencias internas antes de publicarlas.
- **Cierre:** aserciones internas útiles y reportes claros de inconsistencias.

## B175 — Repro packs automáticos para bugs semánticos
- **Estado:** Open
- **Track:** mantenibilidad
- **Depende de:** B157, B163, B162
- **Objetivo:** generar paquetes de repro para bugs complejos.
- **Cierre:** un bug semántico complejo puede reproducirse sin reconstruir contexto manualmente.

# L4 — Especialización PowerBuilder y automatización

## B042 — Soporte avanzado de DataWindow
- **Estado:** Open
- **Track:** PB ecosystem
- **Depende de:** B041
- **Objetivo:** expresiones, propiedades avanzadas, funciones, relaciones con DataStore.
- **Cierre:** soporte ampliado y estable.

## B081 — Inteligencia de DataWindow y acceso a `.Object`
- **Estado:** Open
- **Track:** PB ecosystem
- **Depende de:** B042
- **Objetivo:** cubrir `dw_1.Object`.
- **Cierre:** navegación/validación seguras en acceso a `.Object`.

## B214 — PowerBuilder Object Explorer
- **Estado:** Open
- **Track:** UX profesional
- **Depende de:** B141, B157, B171
- **Desbloquea:** B203, B217
- **Objetivo:** ofrecer una vista navegable del modelo PowerBuilder del workspace.
- **Debe contener:**
  - projects;
  - libraries;
  - object kinds;
  - Application/Window/UserObject/Menu/DataWindow/Function/Structure;
  - readiness por nodo;
  - sourceOrigin;
  - filtros;
  - abrir objeto;
  - acciones contextuales seguras.
- **Cierre:** el usuario navega el proyecto PowerBuilder sin conocer rutas físicas.

## B215 — Current Object Context panel
- **Estado:** Open
- **Track:** UX / semantic context
- **Depende de:** B157, B171, B206, B210
- **Desbloquea:** B217
- **Objetivo:** mostrar contexto semántico del objeto activo.
- **Debe contener:**
  - object kind/name;
  - sourceOrigin;
  - project/library;
  - ancestor chain;
  - variables visibles;
  - functions/events/prototypes;
  - DataObject bindings si existen;
  - diagnostics relevantes;
  - readiness/confidence.
- **Cierre:** el programador entiende rápidamente dónde está y qué contexto semántico tiene.

## B216 — Project Health Dashboard
- **Estado:** Open
- **Track:** health / UX
- **Depende de:** B176, B107
- **Desbloquea:** B187, B198
- **Objetivo:** mostrar salud del workspace en una vista útil y accionable.
- **Debe contener:**
  - readiness;
  - indexing status;
  - cache/warm resume status;
  - diagnostics summary;
  - project model status;
  - sourceOrigin conflicts;
  - build readiness;
  - PBAutoBuild/ORCA availability cuando aplique.
- **Cierre:** el usuario entiende si el plugin/proyecto está sano y qué acción tomar.

## B043 — Integración con PBAutoBuild
- **Estado:** Open
- **Track:** build
- **Depende de:** B141
- **Objetivo:** build moderno oficial.
- **Cierre:** lanzar build, validar entorno, capturar errores y alimentar health del workspace.

## B181 — PBAutoBuild capability detection
- **Estado:** Open
- **Track:** build / tooling detection
- **Depende de:** B043, B141
- **Desbloquea:** B182, B183, B187
- **Objetivo:** detectar `PBAutoBuild250.exe`, versión/capabilities y disponibilidad de entorno.
- **Cierre:** el plugin informa si PBAutoBuild está disponible sin bloquear ni lanzar build.

## B182 — PBAutoBuild build-file discovery and validation
- **Estado:** Open
- **Track:** build / project model
- **Depende de:** B181, B141
- **Desbloquea:** B183, B185, B187
- **Objetivo:** descubrir y validar JSON de PBAutoBuild.
- **Cierre:** el plugin sabe qué build files existen, qué proyecto representan y si son utilizables.

## B183 — PBAutoBuild command runner out-of-process
- **Estado:** Open
- **Track:** build / execution
- **Depende de:** B181, B182, B126
- **Desbloquea:** B184, B185, B187
- **Objetivo:** ejecutar PBAutoBuild sin bloquear Extension Host ni LSP.
- **Cierre:** build observable, cancelable y seguro desde VS Code.

## B184 — PBAutoBuild log parser and Problems Panel integration
- **Estado:** Open
- **Track:** build / diagnostics
- **Depende de:** B183, B063
- **Desbloquea:** B185, B187
- **Objetivo:** convertir logs de build/error en diagnósticos navegables cuando sea posible.
- **Cierre:** errores de build aparecen en Problems Panel sin inventar ubicaciones.

## B185 — PBAutoBuild build profiles, commands and status UX
- **Estado:** Open
- **Track:** build / UX
- **Depende de:** B183, B184, B107
- **Desbloquea:** B186, B187
- **Objetivo:** comandos de usuario para build frecuente.
- **Cierre:** el usuario ejecuta builds habituales sin recordar comandos manuales.

## B186 — PBAutoBuild CI/CD helper export
- **Estado:** Open
- **Track:** build / automation
- **Depende de:** B185, B110
- **Desbloquea:** B140, B198
- **Objetivo:** generar ayudas reproducibles para CI/CD.
- **Cierre:** build local validado se puede llevar a CI/CD sin acoplarse a proveedor.

## B187 — Unified build health model
- **Estado:** Open
- **Track:** build / health
- **Depende de:** B181, B182, B184, B176
- **Desbloquea:** B194, B198
- **Objetivo:** unificar estado de build moderno en health checker.
- **Cierre:** el usuario entiende si el workspace está listo para build moderno.

## B188 — ORCA adapter architecture
- **Estado:** Open
- **Track:** legacy ecosystem / ORCA
- **Depende de:** B141, B109, B176
- **Desbloquea:** B189, B190, B191, B193, B194
- **Objetivo:** adaptador ORCA opcional, out-of-process y separado del hot path.
- **Cierre:** skeleton operativo para invocar ORCA sin acoplarlo al core semántico.

## B189 — ORCA capability detection and environment validation
- **Estado:** Open
- **Track:** legacy ecosystem / ORCA
- **Depende de:** B188
- **Desbloquea:** B190, B191
- **Objetivo:** detectar si ORCA puede usarse y validar entorno/versiones.
- **Cierre:** ausencia de ORCA no rompe el plugin y queda explicada claramente.

## B190 — PBL library graph and directory discovery read-only
- **Estado:** Open
- **Track:** legacy ecosystem / PBL discovery
- **Depende de:** B188, B189, B141
- **Desbloquea:** B191, B192
- **Objetivo:** listar PBLs y objetos read-only e integrarlos en project model.
- **Cierre:** el plugin entiende topología PBL legacy sin modificar nada.

## B191 — ORCA export to staging source
- **Estado:** Open
- **Track:** legacy ecosystem / export
- **Depende de:** B190, B155
- **Desbloquea:** B192, B193
- **Objetivo:** exportar objetos desde PBL a staging indexable.
- **Cierre:** proyecto PBL-only puede analizarse desde VS Code sin modificar PBL.

## B192 — ORCA staging provenance and source priority
- **Estado:** Open
- **Track:** legacy ecosystem / source model
- **Depende de:** B204, B190, B191
- **Desbloquea:** B193, B194
- **Objetivo:** evitar confusión entre source real y source exportado.
- **Cierre:** serving y diagnósticos explican de dónde viene cada símbolo.

## B193 — ORCA import and compile controlled
- **Estado:** Open
- **Track:** legacy ecosystem / import
- **Depende de:** B191, B192, B184
- **Desbloquea:** B194, B196
- **Objetivo:** importar cambios a PBL de forma explícita, controlada y compilada.
- **Cierre:** import seguro con preflight, backup, compile result y rollback documentado.

## B194 — ORCA regenerate and rebuild commands
- **Estado:** Open
- **Track:** legacy ecosystem / build
- **Depende de:** B193, B176
- **Desbloquea:** B195, B197
- **Objetivo:** comandos legacy regenerate/rebuild vía ORCA.
- **Cierre:** operaciones legacy observables y seguras desde VS Code.

## B195 — ORCA executable/PBD operations behind feature flag
- **Estado:** Open
- **Track:** legacy ecosystem / packaging
- **Depende de:** B194
- **Desbloquea:** B198
- **Objetivo:** evaluar si exponer creación de ejecutables/PBD/DLL vía ORCA.
- **Cierre:** decisión documentada sin contaminar ruta PBAutoBuild.

## B196 — PBL/source synchronization safety
- **Estado:** Open
- **Track:** legacy ecosystem / safety
- **Depende de:** B192, B193
- **Desbloquea:** B197
- **Objetivo:** proteger contra inconsistencias PBL/staging/source real.
- **Cierre:** evita importar source equivocado o desactualizado.

## B197 — Build and ORCA event journal
- **Estado:** Open
- **Track:** observability / event log
- **Depende de:** B163, B183, B194
- **Desbloquea:** B198
- **Objetivo:** registrar eventos técnicos de build y ORCA.
- **Cierre:** fallos de build/ORCA diagnosticables sin reconstrucción manual.

## B198 — Build/ORCA documentation and troubleshooting
- **Estado:** Open
- **Track:** docs / operability
- **Depende de:** B186, B187, B194, B197
- **Objetivo:** documentar flujo moderno PBAutoBuild y legacy ORCA.
- **Cierre:** README/docs explican cuándo usar PBAutoBuild, cuándo ORCA y riesgos.

## B199 — Spec-driven PBL update workflow
- **Estado:** Open
- **Track:** legacy ecosystem / spec automation
- **Depende de:** B191, B192, B193, B196, B197
- **Objetivo:** permitir que una spec modifique source exportado y actualice PBL afectadas controladamente.
- **Cierre:** una spec deja PBL actualizadas con trazabilidad, validación y recuperación.

## B200 — Bulk PBL export/import orchestration
- **Estado:** Open
- **Track:** legacy ecosystem / automation
- **Depende de:** B199
- **Objetivo:** coordinar export/import masivo de múltiples PBL.
- **Cierre:** sincronización amplia contra PBL segura y observable.

---

# L4.5 — AI-ready PowerBuilder context

---

# L5 — Documentación IA-first y workflows

---

# 6. Current execution focus

## Fase activa — Soporte avanzado de DataWindow

**Orden inmediato:**

1. B042 — Soporte avanzado de DataWindow
2. B146 — PBAutoBuild baseline
3. B052 — Project status enriquecido
4. B070 — Memory budgets de caché e índice

## Siguiente bloque técnico recomendado

Ejecutar después de cerrar `B042` o preparar en paralelo sin abrir superficie write-enabled:

1. B146 — PBAutoBuild baseline
2. B052 — Project status enriquecido
3. B049 — Code actions
4. B070 — Memory budgets de caché e índice

## Persistencia robusta pendiente

Sin línea de persistencia robusta prioritaria abierta tras el cierre de `B155`, `B167`, `B168` y `B071`.

## Validación temprana permitida

Sin nueva línea de validación temprana prioritaria abierta tras el cierre de `B161`; el siguiente frente de validación útil queda subordinado a `B042`, `B146` y `B070`.

---

# 7. Backlog derivado

- Evaluar si `B083` debe convertirse en épica padre o eliminarse como duplicado funcional tras `B181-B187`.
- Evaluar si `B048` debe convertirse en épica padre o eliminarse como duplicado funcional tras `B188-B196`.
- Definir política oficial de `.hiberus-powersyntax/orca-export/` en `.gitignore`.
- Definir si staging ORCA puede editarse directamente o si debe abrirse readonly hasta `B193`.
- Definir matriz de soporte: PowerBuilder 2025 workspace/solution, target `.pbt`, PBL-only legacy y source plain-text.
