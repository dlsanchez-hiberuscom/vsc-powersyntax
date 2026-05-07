# PowerBuilder Plugin — AI Context Pack

> **Estado:** contexto compacto para agentes IA.  
> **Última revisión:** 2026-05-06.  
> **Ámbito:** resumen estable del dominio PowerBuilder y del plugin para prompts.  
> **No contiene:** arquitectura completa, backlog, specs, histórico ni guía técnica exhaustiva.
> **Foco vivo:** consultar `docs/current-focus.md`.

---

## 1. Propósito

Este documento proporciona contexto compacto para agentes IA que trabajan en el plugin PowerBuilder para VS Code.

Debe usarse cuando el agente necesite entender el dominio sin cargar la guía técnica completa.

---

## 2. Producto

El proyecto es un plugin profesional de PowerBuilder 2025 para Visual Studio Code.

Objetivos principales:

- soporte rápido de edición PowerScript;
- navegación semántica;
- hover/completion/signature help útiles;
- diagnostics fiables;
- indexación incremental;
- soporte progresivo de DataWindow;
- integración controlada con ORCA/PBAutoBuild;
- arquitectura mantenible y preparada para IA.

---

## 3. Arquitectura mental

```text
VS Code Client
  → capa ligera de activación, comandos, vistas y Language Client

Language Server
  → núcleo de parsing, indexing, semantic resolution, providers, diagnostics y caches

PowerBuilder Domain
  → workspace, target, library, object, function, event, variable, structure, DataWindow

Cache Layer
  → snapshots, indices, view models, catalog lookup, diagnostics, DataWindow models
```

La arquitectura completa vive en `docs/architecture.md`.

---

## 4. PowerBuilder no es lenguaje genérico

El agente debe recordar:

- PowerBuilder tiene workspaces/solutions, targets/projects y libraries;
- los objetos PB tienen tipos y convenciones propias;
- eventos y funciones son centrales;
- DataWindow es parte fundamental del ecosistema;
- el código legacy puede tener patrones distintos;
- ORCA/PBAutoBuild son integraciones externas, no core semántico.

---

## 5. Hot paths críticos

Los hot paths son:

```text
hover
completion
completion resolve
signature help
definition
references
diagnostics
semantic tokens
document symbols
```

Estos deben respetar `docs/performance-budget.md`.

---

## 6. Reglas de DataWindow

DataWindow debe tratarse como subdominio propio:

```text
extractor
parser
model
SQL model
binding resolver
semantic provider
cache
```

No mezclar toda la complejidad DataWindow dentro del parser PowerScript principal.

---

## 7. Reglas de integración externa

ORCA y PBAutoBuild deben estar detrás de adapters.

El plugin debe funcionar aunque esas herramientas no estén disponibles, degradando de forma segura.

---

## 8. Reglas documentales para agentes

Antes de modificar documentación:

1. leer `docs/constitution.md`;
2. identificar documento propietario;
3. no duplicar fuentes de verdad;
4. no tocar documentos congelados sin autorización;
5. actualizar documentos afectados.

---

## 9. Reglas de implementación para agentes

Antes de modificar código:

1. revisar código real;
2. identificar capa afectada;
3. revisar arquitectura/status;
4. revisar testing/performance si aplica;
5. añadir tests;
6. actualizar documentación afectada.

---

## 10. Documentos grandes a evitar salvo necesidad

No cargar completos salvo necesidad explícita:

```text
docs/done-log.md
docs/architecture-implementation-map.md
docs/powerbuilder-2025-vscode-plugin-technical-guide.md
```

Usar este contexto compacto primero.
