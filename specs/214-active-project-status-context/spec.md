# Spec 214 - Active project status context (B141A)

## 1. Resumen

Exponer desde `WorkspaceState` un resumen reusable del proyecto activo y reutilizarlo en `powerbuilder.showStats`.

## 2. Problema

El runtime ya usaba `UnifiedProjectModel` para routing, pero el status expuesto al usuario seguía limitado a métricas agregadas sin contexto del proyecto activo.

## 3. Objetivo

Hacer visible el contexto project-aware del archivo activo usando el mismo modelo unificado del runtime.

## 4. Alcance

- añadir `getProjectContextForFile()` a `WorkspaceState`;
- reutilizarlo en `showStats`;
- cubrirlo con test unitario del estado.

## 5. Fuera de alcance

- comandos nuevos o UI dedicada de proyecto activo;
- cierre completo de `B141A`.

## 6. Requisitos

- R1. El contexto debe derivarse del `UnifiedProjectModel`.
- R2. Debe incluir proyecto, tipo, librerías y archivos del proyecto.
- R3. `showStats` debe poder exponerlo sin lógica duplicada.

## 7. Criterios de aceptacion

- AC1. `WorkspaceState` expone contexto de proyecto para una URI.
- AC2. `showStats` incluye `workspace.activeProject`.
- AC3. Hay test unitario del resumen devuelto.

## 8. Riesgos y notas

- Esta slice mejora observabilidad y decisiones de documento activo, pero no sustituye otras adopciones project-aware pendientes.