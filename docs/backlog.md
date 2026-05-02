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

Base cerrada como bloque operativo; reabrir solo para gaps incrementales de routing, provenance o modelo de proyecto.

### L2 — Query engine y serving profesional

Base materializada; este carril queda para refuerzos puntuales de serving, latencia y consultas compartidas.

### L2.5 — PowerBuilder semantic understanding

Base materializada para sourceOrigin, metadata enriquecida, eventos, invocaciones, lifecycle, transacciones y dependencias nativas; reabrir solo para gaps semánticos concretos.

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
B172, B173, B174, B176, B204, B206, B207, B208, B209, B210, B211, B213,
B067, B223, B224
```

El detalle técnico de cierre vive en `done-log.md`.

---

# 5. Backlog activo

# L1 — Persistencia y modelo de workspace/proyecto

Sin ítems activos inmediatos en L1 tras cerrar `B224`; reabrir solo si aparece otro gap incremental de routing o provenance.

---

# L2 — Query engine y serving profesional

Sin refuerzos activos inmediatos en L2 tras cerrar `B067` y `B223`; reabrir solo para gaps nuevos de serving interactivo o productividad ya trazables.

---

# L2.5 — PowerBuilder semantic understanding

Tras cerrar `B204`, `B206`, `B207`, `B208`, `B209`, `B210`, `B211` y `B213`, L2.5 reabre solo para gaps semánticos concretos detectados en corpus reales.

## B225 — Cobertura completa de ancestros nativos PowerBuilder
- **Estado:** Partial
- **Track:** semantic completeness
- **Depende de:** B206, B209, B210
- **Objetivo:** cerrar falsos positivos y huecos de resolución cuando la herencia termina en objetos nativos del runtime PowerBuilder servidos por `system catalog`.
- **Avance actual:** diagnostics, current object context, impact analysis e inspectHierarchy ya distinguen ancestros nativos conocidos del catálogo del sistema y los proyectan como `system type`.
- **Pendiente exacto:**
  - ampliar el catálogo/índices de owner types base y sus alias nativos más allá de los casos ya conectados;
  - reutilizar esa verdad única en diagnostics, hierarchy/current object context, impact analysis y queries derivadas;
  - añadir casos positivos/negativos con ancestros nativos representativos del lenguaje y del framework base.
- **Cierre:** los ancestros nativos conocidos no disparan SD3 ni quedan como `missing base type`, y las superficies read-only distinguen de forma estable entre tipos de sistema, framework y aplicación.

---

# L3 — Validación fuerte, salud interna y excelencia operativa

## B226 — Corpus enterprise OrderEntry como baseline operativo
- **Estado:** Partial
- **Track:** corpus real / performance
- **Depende de:** B030, B069
- **Objetivo:** convertir `fixtures-local/STD_FC_OrderEntry` en corpus local de regresión para discovery, indexación y routing sobre una aplicación PowerBuilder real híbrida.
- **Avance actual:** ya existe baseline ejecutable de performance para discovery e indexación cold/warm sobre el corpus OrderEntry.
- **Pendiente exacto:**
  - ampliar la matriz más allá del baseline actual con smoke/semantics sobre clases representativas y variantes multiidioma;
  - cubrir topología moderna parcial (`.pbproj` aislado sin `.pbsln`), `.pblmeta` disperso, `.srj` de deploy y recursos ruidosos sin tratarlos como fuente;
  - medir sourceOrigin/routing/readiness sobre librerías base `STD_FC_PB_Base*`, `OES_*` y superficies mixtas `.NET DataStore`/deploy.
- **Cierre:** OrderEntry queda integrado como corpus enterprise estable con performance + smoke/semantics reproducibles y reglas documentadas de qué ruido se ignora y qué superficie sí debe indexarse.

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
- **Depende de:** B041, B117, B139, B212
- **Objetivo:** ampliar DataWindow por encima del safe mode, el catálogo básico y el bridge `DataObject/Retrieve` ya cerrados.
- **Pendiente exacto:**
  - expresiones y property blocks avanzados del `.srd`;
  - controles, relaciones y superficies adicionales reutilizando el sublenguaje ya visible;
  - soporte adicional sin mezclar DataWindow con PowerScript normal ni reimplementar el safe mode mínimo.
- **Cierre:** existe soporte avanzado adicional de DataWindow, explícitamente separado del safe mode y del catálogo básico ya cerrados.

## B081 — Inteligencia de DataWindow y acceso a `.Object`
- **Estado:** Open
- **Track:** PB ecosystem
- **Depende de:** B042, B117, B139
- **Objetivo:** resolver rutas `dw_1.Object...` y `GetChild()` sobre DataWindow/DataWindowChild sin fingir semántica donde no haya contexto.
- **Pendiente exacto:**
  - parser de rutas `Object.<control|column|property>`;
  - navegación, hover y validación seguras para paths resolubles;
  - degradación honesta para paths dinámicos, ambiguos o incompletos.
- **Cierre:** acceso a `.Object` y rutas hijas navegables/validables cuando el path es resoluble y degradación explícita cuando no lo es.

## B214 — PowerBuilder Object Explorer
- **Estado:** Open
- **Track:** UX profesional
- **Depende de:** B141, B157, B171, B220
- **Objetivo:** ofrecer una vista navegable del modelo PowerBuilder del workspace consumiendo `semanticWorkspaceManifest`, `querySymbols` y `project model`, sin motor semántico paralelo.
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
- **Cierre:** el usuario navega el proyecto PowerBuilder sin conocer rutas físicas ni duplicar semántica fuera del backbone.

## B215 — Current Object Context panel
- **Estado:** Open
- **Track:** UX / semantic context
- **Depende de:** B157, B171, B206, B210, B217
- **Objetivo:** proyectar en panel/vista el current object context read-only ya expuesto por API/LSP, sin reconstruir semántica localmente.
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
- **Cierre:** el programador entiende rápidamente dónde está y qué contexto semántico tiene consumiendo el contrato read-only ya cerrado.

## B216 — Project Health Dashboard
- **Estado:** Open
- **Track:** health / UX
- **Depende de:** B176, B107, B220
- **Objetivo:** mostrar salud del workspace consumiendo health report, status bar y manifest semántico ya cerrados; integrar build solo cuando `B187` exista.
- **Debe contener:**
  - readiness;
  - indexing status;
  - cache/warm resume status;
  - diagnostics summary;
  - project model status;
  - sourceOrigin conflicts;
  - build readiness;
  - PBAutoBuild/ORCA availability cuando aplique.
- **Cierre:** el usuario entiende si el plugin/proyecto está sano y qué acción tomar sin abrir un segundo motor de health.

## B043 — Integración con PBAutoBuild
- **Estado:** Open
- **Track:** build / epic
- **Depende de:** B141
- **Objetivo:** épica contenedora del carril de build moderno oficial.
- **Pendiente exacto:**
  - detección/capabilities;
  - discovery/validación de build files;
  - runner out-of-process;
  - parser de logs + Problems Panel;
  - UX/comandos/perfiles;
  - health unificado.
- **Cierre:** `B181-B187` cerradas y build moderno observable end-to-end sin bloquear Extension Host ni LSP.

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
2. B181 — PBAutoBuild capability detection
3. B070 — Memory budgets de caché e índice
4. B162 — Reconciliación parser / symbol model / salida LSP

## Siguiente bloque técnico recomendado

Ejecutar después de cerrar `B042` o preparar en paralelo sin abrir superficie write-enabled:

1. B181 — PBAutoBuild capability detection
2. B216 — Project Health Dashboard
3. B162 — Reconciliación parser / symbol model / salida LSP
4. B214 — PowerBuilder Object Explorer

## Persistencia robusta pendiente

Sin línea de persistencia robusta prioritaria abierta tras el cierre de `B155`, `B167`, `B168` y `B071`.

## Validación temprana permitida

Sin nueva línea de validación temprana prioritaria abierta tras el cierre de `B161`; el siguiente frente de validación útil queda subordinado a `B042`, `B181`, `B070` y `B162`.

---

# 7. Backlog derivado

- Decidir si `B043` debe mantenerse como épica padre documental o absorberse completamente por `B181-B187`.
- Decidir si el bloque ORCA debe agruparse bajo una épica padre explícita o mantenerse como secuencia `B188-B198`.
- Definir política oficial de `.hiberus-powersyntax/orca-export/` en `.gitignore`.
- Definir si staging ORCA puede editarse directamente o si debe abrirse readonly hasta `B193`.
- Definir matriz de soporte: PowerBuilder 2025 workspace/solution, target `.pbt`, PBL-only legacy y source plain-text.
