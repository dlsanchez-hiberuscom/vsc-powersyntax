# Developer Workflows — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento describe workflows reales que el plugin debe soportar para ser útil a programadores PowerBuilder.

Sirve para priorizar features visibles contra valor profesional real, no contra demos aisladas.

---

## 2. Workflow 1 — Abrir proyecto y obtener valor rápido

El usuario abre un workspace o solution.

El plugin debe:

1. detectar modo: Workspace, Solution, mixed o PBL-only;
2. mostrar en la status bar el proyecto activo y el estado real de discovery/indexing;
3. priorizar archivo activo;
4. permitir abrir desde esa status bar un dashboard read-only de salud del proyecto reutilizando stats, manifest y build health ya publicados, incluyendo la matriz oficial de soporte por modo/surface y un enterprise health score explicable;
5. exponer un Object Explorer read-only por proyecto/librería/kind con foco opcional en proyecto o archivo activo;
6. servir Document Symbols y Hover cuanto antes;
7. exponer desde esa status bar accesos rápidos a stats, salud del runtime y build;
8. continuar indexando en background.

Valor:

- el usuario no espera a que el workspace completo termine;
- y la status bar deja de ser decorativa porque sirve como punto de mantenimiento, observabilidad y acceso al dashboard de salud.

Estado actual:

- el discovery ya distingue `PBL-only` cuando solo aparecen roots `.pbl`;
- el project model y el Object Explorer proyectan esas librerías como nodos read-only sin requerir `.pbt/.pbproj` ni staging.
- en multi-root, `project routing`, `semanticWorkspaceManifest` y Object Explorer aíslan proyectos/librerías homónimos por URI real, sin colapsarlos por label visible.

Contrato visible actual publicado por el health report:

- el dashboard y el health report proyectan un enterprise health score explicable por readiness, diagnostics, build, ORCA, cache, sourceOrigin, performance y support matrix, sin abrir otro motor de health;
- `Workspace`, `Solution` y target `.pbt` se proyectan como superficies soportadas del producto.
- `pbl-only`, source plain-text/exportado, staging ORCA y `DataWindow .srd` se proyectan como superficies read-only con límites explícitos y degradación honesta.
- `PBAutoBuild` queda condicionado al tooling detectado, mientras PowerServer/PowerClient se reflejan como build files validados por el mismo carril JSON compartido.

---

## 3. Workflow 2 — Entender el objeto actual

El usuario abre una ventana, user object o función.

El plugin debe mostrar, mediante el Current Object Context Panel read-only:

- tipo de objeto;
- librería/proyecto;
- ancestor;
- variables visibles;
- funciones/eventos;
- anchors de SQL embebido con keyword, rango, `confidence` y transaction target cuando el binding es defendible;
- readiness;
- sourceOrigin;
- diagnostics relevantes.

---

## 4. Workflow 3 — Navegar herencia

El usuario quiere saber de dónde viene una función/evento.

El plugin debe permitir:

- ver cadena de ancestros;
- navegar al script del ancestro;
- ver overrides;
- ver descendientes;
- ver evidence/confidence de la resolución.

---

## 5. Workflow 4 — Entender DataWindows usadas

El usuario está en una ventana con DataWindow controls.

El plugin debe poder:

- detectar `DataObject = "d_xxx"`;
- navegar al `.srd`;
- mostrar columnas/args básicos;
- derivar ese resumen, los `retrieveArguments` y la especialización de `Retrieve(...)` desde el mismo `DataWindowModel` canónico, sin un parser local por workflow;
- navegar `Describe/Modify(...)` cuando la ruta apunta a `DataWindow.Table.Select`, `report(...)` o `dddw.name` resolubles;
- seguir child DataWindows por `report(name=... dataobject=...)` y dropdowns `dddw.name` sin mezclar `.srd` con PowerScript normal;
- proyectar un lineage SQL read-only que encadene `retrieve` raíz, report children y dropdown children resolubles desde bindings reales o desde el `.srd` activo;
- ofrecer completion segura y diagnósticos conservadores sobre property paths DataWindow reconocibles, sin abrir completion genérica dentro de strings arbitrarios;
- detectar `Retrieve`/`Update`;
- degradar si el DataObject es dinámico.

---

## 6. Workflow 5 — Ejecutar build

El usuario quiere compilar desde VS Code.

El plugin debe:

- detectar y mostrar disponibilidad de PBAutoBuild por configuración, entorno o candidatos por defecto sin lanzar build;
- descubrir JSON de build;
- validar rutas/secrets;
- lanzar build out-of-process;
- mostrar logs;
- publicar errores en Problems Panel si hay source fiable.

Estado actual:

- la capability detection read-only ya es visible en status/health del cliente;
- discovery/validación read-only de build files JSON ya está cerrada en servidor y refresca incrementalmente por watcher;
- la matriz read-only de perfiles y validación de entorno ya está cerrada por comando/API/tool, combinando inventory completo, último profile recordado y build health sin disparar builds;
- el runner out-of-process ya está cerrado y expone comandos run/cancel con estado mínimo visible en status/stats/journal;
- el parser de logs y Problems Panel ya están cerrados con publicación separada de problemas de build cuando hay mapeo fiable;
- la health unificada del build moderno ya está cerrada y se reutiliza en status, menú y health report;
- la UX final de perfiles/comandos ya está cerrada con último build recordado y selección explícita de build file utilizable;
- el último build profile recordado y la matriz read-only distinguen roots homónimos por `buildFileUri`, aunque el label visible del JSON se repita.
- el helper CI/CD ya está cerrado como bundle neutral y versionable en `tools/pbautobuild-ci/<perfil>` sin acoplar la extensión a un proveedor concreto.
- el carril legacy ORCA ya tiene adapter base out-of-process y capability detection read-only visible en status/health; el comando del script activo consume `vscPowerSyntax.legacy.orcaPath` o `PB_ORCA_PATH` sin autodetección difusa por instalaciones locales, el export controlado a `.vsc-powersyntax/orca-export/orca-staging` usa `vscPowerSyntax.legacy.orcaSessionDll`, `PB_ORCA_DLL` o `pborc250.dll` para dejar source indexable sin tocar la PBL original, `vscPowerSyntax.importOrcaStaging` reutiliza ese último export persistido para ejecutar preflight, verificar drift del source real rastreado, hacer backup binario, correr `import-from-staging.orc` y dejar `last-import-ledger.json`, `vscPowerSyntax.regenerateOrcaLibraries` / `vscPowerSyntax.rebuildOrcaProject` reutilizan el mismo rail seguro para mantenimiento legacy sin abrir un segundo motor, la API pública `applySpecDrivenPblUpdate()` encadena safe edit plan + export fresco + edits explícitos sobre staging + import seguro sobre ese mismo rail, `applySpecDrivenPblUpdateBatch()` coordina múltiples PBL de forma secuencial con `stopOnError`, y el servidor persiste la secuencia técnica reciente de build/ORCA en `.vsc-powersyntax/runtime/build-orca-journal.json` además de publicarla por `showStats`.

---

## 7. Workflow 6 — Preparar contexto para IA

El usuario quiere que una IA modifique o revise código PowerBuilder.

El plugin debe poder generar contexto read-only:

- current object context;
- dependencies;
- cross-project conflicts;
- workspace migration assistant;
- references;
- diagnostics;
- ancestor chain;
- DataWindow bindings;
- sourceOrigin;
- evidence/confidence;
- invocationRisk y riskReasons para bloquear automatización insegura.

Estado actual:

- el plugin ya puede exportar un repro pack semántico reproducible desde el editor activo, capturando `currentObjectContext`, `impactAnalysis`, `safeEditPlan`, `semanticWorkspaceManifest`, `serverStats`, diagnostics visibles y copias de archivos relacionados bajo `tools/semantic-repros`.
- los diagnostics incluidos en ese contexto y en snapshots ya exponen `diagnostic.code` estable; tooling nuevo debe consumir ese campo y no parsear `source` como contrato primario.
- la API pública v2 ya expone descriptor contractual, bridge read-only por tools, snapshot semántico exportable/importable, settings governance observable con perfiles `fast|balanced|deep-analysis|legacy-orca|ci-support|support-safe`, knowledge packs curados y safe batch refactor planning sin abrir un segundo motor en cliente.
- el cliente ya expone además un Diagnostics Explainability Panel read-only sobre los diagnostics emitidos, reutilizando el mismo contrato estable de `diagnostic.code`.
- `impactAnalysis`, `safeEditPlan`, `dependencyGraph` y code actions ya exponen `invocationRisk` uniforme para que la automatización diferencie llamadas seguras, heredadas, fallback, dinámicas o externas antes de proponer cambios.

Automatización write-enabled solo debe llegar después de API estable, confidence gates y validación suficiente.

---

## 8. Workflow 7 — Cambiar topología o scripts en caliente

El usuario crea, modifica o elimina `targets/projects/solutions` o añade SR* nuevos mientras sigue trabajando.

El plugin debe:

- absorber cambios en `.pbw`, `.pbt`, `.pbproj`, `.pbsln` y build files JSON sin exigir rediscovery completo;
- refrescar `project routing`, `sourceOrigin` y el catálogo read-only de build files cuando entren SR* nuevos o cambie la topología;
- tratar `.pbw/.pbt/.pbproj/.pbsln` y `.pbl` como inputs de topología/discovery, no como documentos semánticos PowerScript aunque un override de lenguaje intente forzar ese camino;
- mantener status/readiness coherentes mientras el watcher procesa el batch;
- degradar de forma segura si un marker no puede reprocesarse.

Estado actual:

- `WorkspaceState`, watcher y indexador recalculan `sourceOrigin` según el marker topológico más cercano, no según un modo global del workspace;
- el export ORCA a staging elige además el workspace folder correcto cuando hay varias raíces abiertas y mantiene los aliases ligados a la librería legacy original del root correcto.

---

## 9. Workflow 8 — Normalizar scripts sin romper constructs reales

El usuario quiere normalizar un script PowerBuilder soportado de forma manual o al guardar.

El plugin debe:

- ofrecer un formatter conservador y configurable para documentos PowerScript soportados;
- respetar strings y comentarios;
- no tratar DataWindow como PowerScript normal;
- permitir `formatOnSave` delegando el cálculo al servidor LSP o degradando por presupuesto explícito, sin introducir un motor semántico paralelo ni peso extra en el hot path del cliente.

---

## 10. Workflow 9 — Preparar release y revisar marketplace readiness

El mantenedor quiere validar una release sin improvisacion de ultima hora.

El plugin y su repo deben poder:

- generar un VSIX real y repetible;
- inspeccionar el contenido publicado antes de empaquetar;
- ejecutar smoke, unit/integration y gate de rendimiento dentro del mismo release lane;
- y mantener README, changelog y workflow de release alineados con el estado real del producto.

Estado actual:

- `npm run package:vsix` genera `./.dist/vsc-powersyntax.vsix` con el runtime real de la extension;
- `npm run package:vsix:list` inspecciona el contenido publicable;
- `npm run release:verify` encadena tests base, gate de rendimiento y empaquetado;
- `.github/workflows/release-readiness.yml` deja ese mismo carril disponible en CI.

---

## 11. Workflow 10 — Operar y diagnosticar build moderno y ORCA legacy

El usuario o maintainer necesita decidir rápido qué carril usar y cómo depurar un fallo sin abrir el código.

Matriz de decisión operativa:

1. usar `PBAutoBuild` si existe un build file JSON `usable`, el source real ya es la autoridad y el objetivo es compilar o exportar un helper CI/CD neutral;
2. usar `ORCA legacy` si el workspace depende de `.pbl`, hace falta exportar a staging indexable o ejecutar `import/regenerate/rebuild` sobre librerías legacy;
3. no tratar nunca `orca-staging` como source canónico ni como sustituto del carril moderno de build;
4. no esperar creación de `EXE/PBD/DLL` vía ORCA: esa línea queda explícitamente no expuesta y requeriría un feature flag dedicado.

Superficies visibles que deben bastar para el troubleshooting:

- status bar y menú de estado con `Build`, `Último build`, `Elegir build`, `Cancelar build`, `ORCA` y `Cancelar ORCA`;
- dashboard read-only de salud del proyecto con enterprise health score explicable;
- `PowerSyntax: Mostrar Stats del Runtime` para inspeccionar `buildFiles`, `buildRunner`, `orcaTooling`, `orcaRunner`, `buildProblems`, `buildHealth` y `showStats.persistence.buildOrcaJournalUri`.

Artefactos de diagnóstico que el usuario debe poder localizar sin ambigüedad:

- `tools/pbautobuild-ci/<perfil>` para el helper neutral de CI/CD;
- `.vsc-powersyntax/orca-export/orca-staging` para source exportado indexable;
- `.vsc-powersyntax/orca-export/state/last-export.state` como frontera del último export válido;
- `.vsc-powersyntax/orca-export/state/last-import-ledger.json` y `last-*-ledger.json` como resultado del rail write-enabled legacy;
- `.vsc-powersyntax/runtime/build-orca-journal.json` como journal técnico persistente `build|legacy`.

Troubleshooting mínimo defendible:

1. si `PBAutoBuild` no aparece, revisar `vscPowerSyntax.build.pbAutoBuildPath`, `PB_AUTOBUILD_PATH` y la lista de build files `usable` antes de culpar al runner;
2. si el build corre pero no publica problemas, revisar si el parser pudo resolver el objeto del log a un archivo único del workspace;
3. si ORCA no aparece como disponible, revisar `vscPowerSyntax.legacy.orcaPath` o `PB_ORCA_PATH` y no asumir autodetección por instalaciones del sistema;
4. si el export ORCA falla, revisar `vscPowerSyntax.legacy.orcaSessionDll`, `PB_ORCA_DLL`, el fallback `pborc250.dll` y los scripts generados bajo `.vsc-powersyntax/orca-export/scripts/`;
5. si el import/regenerate/rebuild se bloquea, revisar `last-export.state`, drift del source real rastreado, fingerprints de PBL, staging vacío y el `last-*-ledger.json` antes de reintentar;
6. si la release falla, repetir `npm run build:test`, `npm run package:vsix`, `npm run package:vsix:list` y `npm run release:verify` antes de asumir una regresión de producto.

---

## 12. Workflow 11 — Comparar dos estados semánticos exportados

El maintainer o agente quiere medir qué cambió entre dos snapshots exportados del workspace sin reabrir el motor semántico ni depender del estado vivo del editor.

Flujo:

1. exportar un snapshot base con `exportSemanticWorkspaceSnapshot()`;
2. importar o construir un segundo snapshot candidato;
3. ejecutar `diffSemanticWorkspaceSnapshots()` o el tool read-only `semantic-snapshot-diff`;
4. revisar cambios de proyectos, objetos exportados, símbolos, readiness, health, diagnósticos y `sourceOrigin`.

Reglas:

- el diff reutiliza solo el contrato público versionado ya exportado;
- no consulta al servidor ni recalcula semántica al comparar snapshots ya serializados;
- el resultado debe ser exportable y defendible aunque el workspace original ya no esté abierto.

---

## 13. Workflow 12 — Visualizar el grafo inmediato de dependencias

El maintainer o agente quiere inspeccionar el vecindario inmediato de dependencias de un objeto PowerBuilder sin reindexar el workspace ni montar una engine paralela.

Flujo:

1. abrir el archivo u objeto foco en el editor;
2. ejecutar `PowerSyntax: Abrir Grafo de Dependencias PowerBuilder` o `getPowerBuilderDependencyGraph()`;
3. revisar el Mermaid generado y las aristas `inherits`, `depends-on` y `used-by`;
4. exportar el payload JSON o reutilizar el tool read-only `dependency-graph` si hace falta automatización.

Reglas:

- el grafo usa solo snapshots, símbolos y reverse dependencies ya publicados por el pipeline semántico;
- el alcance actual es de vecindario inmediato y debe degradar de forma honesta cuando una dependencia no pueda resolverse;
- una resolución ambigua debe permanecer explícita y no fingir una única verdad cross-project.

---

## 14. Workflow 13 — Inspeccionar DataWindow SQL lineage

El maintainer o agente quiere inspeccionar el lineage SQL real de un DataWindow sin reparsear el workspace ni reconstruir otra engine semántica.

Flujo:

1. abrir un `.srd` o un script con binding `DataObject` literal activo;
2. ejecutar `PowerSyntax: Abrir DataWindow SQL Lineage`, `getDataWindowSqlLineage()` o el tool read-only `datawindow-sql-lineage`;
3. revisar el árbol raíz/report/dropdown, las sentencias `retrieve` y las referencias SQL proyectadas;
4. exportar el payload JSON o reutilizar el Markdown como evidencia de troubleshooting.

Reglas:

- el lineage reutiliza solo `DataWindowModel`, bindings `DataObject` y child routes ya indexadas por el pipeline semántico;
- el subset SQL actual cubre aliases de `select`, `JOIN ... ON` simples y `WHERE` básico; si aparece subquery o SQL complejo, el lineage debe degradar sin inventar referencias;
- la resolución debe permanecer explícita como `resolved|missing|ambiguous|dynamic` y no fingir rutas únicas cuando no existan;
- el slice actual es read-only y no introduce parsing paralelo ni recomputación global del workspace.

---

## 15. Workflow 14 — Analizar conflictos semánticos cross-project

El maintainer o agente quiere detectar símbolos homónimos defendibles entre proyectos o librerías del mismo workspace sin abrir una engine paralela ni volver a escanear el código.

Flujo:

1. ejecutar `PowerSyntax: Abrir Analizador de Conflictos Cross-Project`, `getCrossProjectSymbolConflicts()` o el tool read-only `cross-project-symbol-conflicts`;
2. revisar el ranking por `buildSymbolKey`, proyecto, librería y `sourceOrigin` preferido;
3. usar el Markdown o el payload JSON como evidencia de troubleshooting o planificación read-only;
4. mantener explícita la ambigüedad cuando el fallback global ya devuelve múltiples winners defendibles.

Reglas:

- el analizador reutiliza `KnowledgeBase`, `buildSymbolKey`, `WorkspaceState` y la prioridad de `sourceOrigin` ya publicada por el producto;
- staging ORCA o duplicados de la misma ubicación no deben sobrerreportarse como conflicto canónico si existe source real preferido;
- el slice sigue siendo read-only y no habilita rename/references automáticos cross-project por sí solo.

---

## 16. Workflow 15 — Planificar migración de layouts legacy

El maintainer o agente quiere ordenar una migración desde un layout `pbl-only` o `mixed` hacia una topología soportada sin abrir un planner paralelo ni aplicar escritura opaca sobre el workspace.

Flujo:

1. ejecutar `PowerSyntax: Abrir Asistente de Migración de Workspace`, `getWorkspaceMigrationAssistant()` o el tool read-only `workspace-migration-assistant`;
2. revisar `currentMode`, `targetMode`, resumen de roots/build files/proyectos y las recomendaciones priorizadas por `topology`, `build` y `legacy`;
3. usar el Markdown o el payload JSON como evidencia defendible para decidir si primero conviene consolidar markers, sanear build files o retirar dependencia accidental de `orca-staging`;
4. repetir el análisis después de cada ajuste estructural para confirmar que la topología objetivo queda más estable.

Reglas:

- el asistente reutiliza `WorkspaceState`, summary de build files, project model y aliases ORCA ya publicados por el runtime, sin abrir otra engine de discovery;
- si discovery aún no tiene roots/materialización suficiente, la surface puede degradar a `available: false` con reason explícita en vez de inventar un plan;
- el slice es read-only: no crea markers ni reescribe build files automáticamente.

---

## 17. Workflow 16 — Validar perfiles de build y entorno

El maintainer o agente quiere decidir qué build profile es ejecutable y qué gap de entorno o inventario bloquea PBAutoBuild sin lanzar un proceso real.

Flujo:

1. ejecutar `PowerSyntax: Abrir Matriz de Perfiles de Build`, `getBuildProfileMatrix()` o el tool read-only `build-profile-matrix`;
2. revisar tooling, build health, último profile recordado y el inventario completo de build files con estado `usable|ambiguous|invalid`;
3. corregir primero el gap dominante: tooling ausente/inválido, profile recordado obsoleto, build file ambiguo o JSON inválido;
4. repetir la matriz antes de ejecutar `runPbAutoBuild` para confirmar que al menos un profile queda `canRun = true`.

Reglas:

- la matriz se construye sobre capability detection de PBAutoBuild, inventory completo del servidor y build health ya publicada, sin lanzar builds ni reanalizar el workspace;
- un profile `usable` puede seguir quedar no ejecutable si el entorno no expone `pbautobuild250.exe` válido;
- el slice es read-only y no selecciona ni persiste automáticamente otro profile por el usuario.

---

## 18. Workflow 17 — Exportar support bundle offline

## 17A. Workflow 17A — Usar el core maintenance command pack

El maintainer o agente quiere inspeccionar o sanear el runtime sin abrir debugging manual, sin duplicar observabilidad y sin tocar código del workspace.

Flujo:

1. abrir `PowerSyntax: Abrir Menú de Estado` o ejecutar directamente el comando del síntoma principal;
2. usar `PowerSyntax: Exportar Health Report`, `Check Workspace`, `Ejecutar Runtime Self-Test`, `Mostrar Memory Budgets`, `Mostrar Estado de Indexación`, `Mostrar Project Routing` o `Mostrar Conflictos de sourceOrigin` para inspección read-only del runtime;
3. ejecutar `PowerSyntax: Validar Cache Persistente` antes de tocar persistencia y usar `PowerSyntax: Ejecutar Mantenimiento de Cache Semántica` solo cuando la retención/journal lo recomienden;
4. reservar `PowerSyntax: Limpiar Cache Semántica` y `PowerSyntax: Rebuild Workspace Index` para limpieza explícita del estado persistido o relanzado del runtime, siempre tras confirmación modal.

Reglas:

- `workspace check`, `export health report`, `run runtime self-test`, `show memory budgets`, `show indexing state`, `show project routing`, `show sourceOrigin conflicts`, `validate persistent cache` y `export support bundle` son read-only;
- `clear semantic cache` y `rebuild workspace index` son comandos confirmables y no deben dispararse en background ni sin acción explícita del usuario;
- el pack reutiliza `showStats`, dashboard, manifest, `currentObjectContext`, conflictos cross-project y `cacheStore`, sin abrir un segundo motor de observabilidad;
- `workspace check`, `runtime self-test`, `health report` y `support bundle` son complementarios: el primero responde de forma estructurada si el workspace está listo para cerrar trabajo, el segundo ofrece un chequeo rápido del runtime, el tercero congela dashboard/score enterprise/stats/manifest para inspección rápida y el cuarto añade snapshot offline con redacción explícita por perfil.

---

## 18. Workflow 17 — Exportar support bundle offline

El maintainer o soporte quiere congelar una evidencia técnica del runtime para análisis offline sin copiar código bruto del workspace ni depender de releer el estado vivo del editor.

Flujo:

1. si hace falta una redacción más estricta, aplicar antes `ci-support` o `support-safe` desde `PowerSyntax: Aplicar Perfil de Settings`;
2. ejecutar `PowerSyntax: Exportar Support Bundle Offline` desde el workspace activo;
3. localizar el bundle bajo `tools/support-bundles/<workspace>-<timestamp>` o en el destino explícito elegido por el comando y confirmar en `manifest.json` / `README.md` el `redactionProfile` y la `redactionPolicy` aplicada;
4. revisar `runtime-health.json`, `server-stats.sanitized.json`, `diagnostics-snapshot.sanitized.json`, `semantic-workspace-manifest.reduced.json`, `runtime-journal-tail.json`, `performance-summary.json`, `current-object-context.sanitized.json`, `powerbuilder-code-metrics.sanitized.json`, `powerbuilder-technical-debt-report.sanitized.json`, `settings-sanitized.json`, `build-orca-snapshot.json`, `public-contract.json`, `read-only-tool-bridge.json` y `api-inventory.json`;
5. adjuntar el bundle como evidencia de troubleshooting o soporte sin mezclarlo con el repro pack semántico si no hace falta copiar archivos fuente relacionados.

Reglas:

- el support bundle se construye cliente-side sobre `showStats`, health, manifest semántico, current object context, code metrics, debt report, gobernanza de settings y contrato API ya publicados;
- el contrato público ya declara este carril como observabilidad local `externalTelemetry = false`; la exportación offline requiere una acción explícita del usuario y no existe envío automático de métricas fuera de la máquina local;
- `fast`, `balanced`, `deep-analysis` y `legacy-orca` mantienen `sanitized`, mientras `ci-support` y `support-safe` pueden endurecer paths/snippets/settings/manifest a `summary-only` según la policy publicada en el bundle;
- rutas, URIs, ejecutables y artefactos locales deben salir redaccionados y el bundle no copia código bruto por defecto;
- el repro pack semántico sigue siendo el carril para bugs donde haga falta copiar contexto fuente relacionado, mientras que el support bundle prioriza observabilidad offline y privacidad local.

---

## 19. Workflow 18 — Revisar métricas avanzadas de código PowerBuilder

El maintainer o agente quiere obtener un mapa defendible de hotspots de código, SQL embebido, DataWindows, dependencias externas y footprint build/ORCA sin releer el workspace ni abrir un motor paralelo.

Flujo:

1. ejecutar `PowerSyntax: Abrir Métricas Avanzadas de Código PowerBuilder`, `getPowerBuilderCodeMetrics()` o el tool read-only `code-metrics`;
2. revisar el resumen global, `Diagnostics By Area`, el footprint de build/ORCA y la lista de hotspots truncada por `maxObjects`;
3. usar los objetos con mayor `approximateComplexity`, `diagnostics`, `externalDependencies` o `linkedDataWindows` como entrada para deuda técnica, modernización y troubleshooting;
4. si hace falta ampliar o reducir la muestra, repetir el análisis vía API/tool ajustando `maxObjects`.

Reglas:

- el reporte reutiliza snapshots semánticos ya publicados, bindings `DataObject`, diagnostics snapshot y `WorkspaceState`, sin abrir un parser ni un índice paralelos;
- `approximateComplexity`, SQL embebido y lifecycle warnings son métricas defendibles con límites claros, no una puntuación absoluta de calidad;
- el slice es read-only: no propone ni ejecuta cambios sobre el código.

---

## 20. Workflow 19 — Revisar deuda técnica y modernización priorizada

El maintainer o agente quiere priorizar deuda técnica real del workspace sin abrir un scoring paralelo ni convertir el reporte en una acción write-enabled.

Flujo:

1. ejecutar `PowerSyntax: Abrir Informe Técnico de Deuda y Modernización PowerBuilder`, `getPowerBuilderTechnicalDebtReport()` o el tool read-only `technical-debt-report`;
2. revisar el resumen global de hotspots/recomendaciones y confirmar si la presión dominante viene de `obsolete`, `dynamic-sql`, `datawindow-risk`, `external-dependency`, `source-origin-risk` o del layout legacy del workspace;
3. usar los hotspots `high/medium` y sus evidencias para decidir el siguiente carril: modernización manual, estabilización DataWindow, limpieza sourceOrigin o consolidación ORCA/PBL;
4. usar las recomendaciones del reporte como handoff hacia el siguiente bloque de contratos/consistencia o troubleshooting, no como autorización automática para editar el código.

Reglas:

- el informe reutiliza `code-metrics`, `diagnostic.code`, `sourceOrigin` summary y `workspaceMigrationAssistant`; no inventa diagnósticos nuevos ni abre un segundo motor de scoring;
- `priority` y `confidence` deben leerse como señal defendible y acotada, no como decisión irreversible de refactor;
- el slice es read-only: las acciones sugeridas son recomendaciones operativas y deben pasar por preflight/guards antes de cualquier cambio real.

---

## 21. Workflow 20 — Aplicar quick fixes seguras y explicables

El maintainer o agente quiere aprovechar una acción pequeña desde Problems o el editor sin abrir automatización opaca ni saltarse governance.

Flujo:

1. abrir un documento con un diagnóstico publicado y pedir Code Action o quick fix desde Problems o desde el rango afectado;
2. revisar el preview y confirmar que la acción sigue siendo un reemplazo local y versionado del catálogo;
3. si el documento cae en `sourceOrigin` dudoso, preflight inválido o referencias dinámicas por string del mismo identificador, la acción debe mostrarse bloqueada y explicable en vez de editar;
4. si la acción queda habilitada, aplicarla como cambio mínimo y dejar que diagnostics vuelva a confirmar el estado final.

Reglas:

- el framework consume `diagnostic.code` ya publicado y no parsea `source` como contrato primario ni inventa diagnósticos locales;
- cada acción declara `catalogVersion`, `requiredConfidence`, `evidence` y `preview` antes de tocar el documento;
- `sourceOrigin` dudoso, preflight fallido y dynamic strings bloquean la acción antes del edit.

---

## 22. Workflow 21 — Gobernar perfiles y settings del producto

El maintainer o agente quiere aplicar un baseline corporativo defendible sobre el workspace sin tocar settings uno a uno ni abrir overrides invisibles fuera del carril explícito del producto.

Flujo:

1. ejecutar `PowerSyntax: Mostrar Gobernanza de Settings` para inspeccionar el perfil activo, las claves gobernadas y los conflictos actuales;
2. ejecutar `PowerSyntax: Aplicar Perfil de Settings` para aplicar uno de los perfiles `fast`, `balanced`, `deep-analysis`, `legacy-orca`, `ci-support` o `support-safe` sobre el workspace actual;
3. revisar conflictos residuales, especialmente combinaciones inválidas como `formatOnSave=true` con `formatting.enabled=false`;
4. si el workspace arrastra perfiles legacy (`interactive`, `legacy-safe`), normalizarlos a `fast` o `support-safe` antes de seguir con soporte, ORCA o troubleshooting.

Reglas:

- la política sólo gobierna claves explícitas del producto; no debe sobreescribir paths locales de PBAutoBuild u ORCA ni settings ajenos al contrato;
- `legacy-orca`, `ci-support` y `support-safe` priorizan reproducibilidad y baja mutación sobre corpus legacy o sesiones de soporte;
- la aplicación del perfil escribe en settings de workspace, no en settings globales del usuario.
