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
4. servir Document Symbols y Hover cuanto antes;
5. exponer desde esa status bar accesos rápidos a stats, salud del runtime y build;
6. continuar indexando en background.

Valor:

- el usuario no espera a que el workspace completo termine;
- y la status bar deja de ser decorativa porque sirve como punto de mantenimiento y observabilidad.

---

## 3. Workflow 2 — Entender el objeto actual

El usuario abre una ventana, user object o función.

El plugin debe mostrar:

- tipo de objeto;
- librería/proyecto;
- ancestor;
- variables visibles;
- funciones/eventos;
- readiness;
- sourceOrigin;
- diagnostics relevantes.

Feature futura relacionada:

- Current Object Context Panel.

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
- discovery de JSON, runner, log parser y health unificado siguen pendientes en `B182-B187`.

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

Automatización write-enabled solo debe llegar después de API estable, confidence gates y validación suficiente.

---

## 8. Workflow 7 — Cambiar topología o scripts en caliente

El usuario crea, modifica o elimina `targets/projects/solutions` o añade SR* nuevos mientras sigue trabajando.

El plugin debe:

- absorber cambios en `.pbw`, `.pbt`, `.pbproj` y `.pbsln` sin exigir rediscovery completo;
- refrescar `project routing` y `sourceOrigin` cuando entren SR* nuevos o cambie la topología;
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
