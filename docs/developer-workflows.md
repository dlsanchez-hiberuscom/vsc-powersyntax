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
4. permitir abrir desde esa status bar un dashboard read-only de salud del proyecto reutilizando stats, manifest y build health ya publicados;
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

---

## 3. Workflow 2 — Entender el objeto actual

El usuario abre una ventana, user object o función.

El plugin debe mostrar, mediante el Current Object Context Panel read-only:

- tipo de objeto;
- librería/proyecto;
- ancestor;
- variables visibles;
- funciones/eventos;
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
- navegar `Describe/Modify(...)` cuando la ruta apunta a `DataWindow.Table.Select`, `report(...)` o `dddw.name` resolubles;
- seguir child DataWindows por `report(name=... dataobject=...)` y dropdowns `dddw.name` sin mezclar `.srd` con PowerScript normal;
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
- el runner out-of-process ya está cerrado y expone comandos run/cancel con estado mínimo visible en status/stats/journal;
- el parser de logs y Problems Panel ya están cerrados con publicación separada de problemas de build cuando hay mapeo fiable;
- la health unificada del build moderno ya está cerrada y se reutiliza en status, menú y health report;
- la UX final de perfiles/comandos ya está cerrada con último build recordado y selección explícita de build file utilizable;
- el helper CI/CD ya está cerrado como bundle neutral y versionable en `tools/pbautobuild-ci/<perfil>` sin acoplar la extensión a un proveedor concreto.
- el carril legacy ORCA ya tiene adapter base out-of-process y capability detection read-only visible en status/health; el comando del script activo consume `vscPowerSyntax.legacy.orcaPath` o `PB_ORCA_PATH` sin autodetección difusa por instalaciones locales, el export controlado a `.vsc-powersyntax/orca-export/orca-staging` usa `vscPowerSyntax.legacy.orcaSessionDll`, `PB_ORCA_DLL` o `pborc250.dll` para dejar source indexable sin tocar la PBL original, `vscPowerSyntax.importOrcaStaging` reutiliza ese último export persistido para ejecutar preflight, verificar drift del source real rastreado, hacer backup binario, correr `import-from-staging.orc` y dejar `last-import-ledger.json`, `vscPowerSyntax.regenerateOrcaLibraries` / `vscPowerSyntax.rebuildOrcaProject` reutilizan el mismo rail seguro para mantenimiento legacy sin abrir un segundo motor, la API pública `applySpecDrivenPblUpdate()` encadena safe edit plan + export fresco + edits explícitos sobre staging + import seguro sobre ese mismo rail, `applySpecDrivenPblUpdateBatch()` coordina múltiples PBL de forma secuencial con `stopOnError`, y el servidor persiste la secuencia técnica reciente de build/ORCA en `.vsc-powersyntax/runtime/build-orca-journal.json` además de publicarla por `showStats`.

---

## 7. Workflow 6 — Preparar contexto para IA

El usuario quiere que una IA modifique o revise código PowerBuilder.

El plugin debe poder generar contexto read-only:

- current object context;
- dependencies;
- references;
- diagnostics;
- ancestor chain;
- DataWindow bindings;
- sourceOrigin;
- evidence/confidence.

Estado actual:

- el plugin ya puede exportar un repro pack semántico reproducible desde el editor activo, capturando `currentObjectContext`, `impactAnalysis`, `safeEditPlan`, `semanticWorkspaceManifest`, `serverStats`, diagnostics visibles y copias de archivos relacionados bajo `tools/semantic-repros`.
- los diagnostics incluidos en ese contexto y en snapshots ya exponen `diagnostic.code` estable; tooling nuevo debe consumir ese campo y no parsear `source` como contrato primario.
- la API pública v2 ya expone descriptor contractual, bridge read-only por tools, snapshot semántico exportable/importable, settings governance observable, knowledge packs curados y safe batch refactor planning sin abrir un segundo motor en cliente.
- el cliente ya expone además un Diagnostics Explainability Panel read-only sobre los diagnostics emitidos, reutilizando el mismo contrato estable de `diagnostic.code`.

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
