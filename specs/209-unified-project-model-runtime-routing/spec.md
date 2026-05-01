# Spec 209 - UnifiedProjectModel runtime routing (B141A)

## 1. Resumen

Mover dos decisiones project-aware del hot path (`workspaceIndexer` y `libraryOrder`) desde `ProjectRegistry` hacia `UnifiedProjectModel`.

## 2. Problema

`showStats` y `cacheStore` ya reutilizaban `UnifiedProjectModel`, pero el runtime seguía leyendo `ProjectRegistry` directamente en caminos sensibles, manteniendo duplicidad en la lógica project-aware.

## 3. Objetivo

Reducir la mezcla de modelos haciendo que la priorización de indexación y el ranking por librería lean el mismo modelo unificado.

## 4. Alcance

- ampliar `UnifiedProjectModel` con `getFilesForProject()`;
- usarlo en `prioritizeFilesForIndexing()`;
- usarlo en `resolveByLibraryOrder()`;
- reforzar tests existentes de routing project-aware.

## 5. Fuera de alcance

- eliminar aún `ProjectRegistry` del bootstrap;
- conectar invalidación y serving al mismo modelo;
- cerrar toda la épica `B141A`.

## 6. Requisitos

- R1. El indexador debe priorizar el proyecto activo usando `UnifiedProjectModel`.
- R2. `libraryOrder` debe resolver proyecto y librerías desde el mismo modelo.
- R3. Los tests deben seguir cubriendo el routing por proyecto.

## 7. Criterios de aceptacion

- AC1. Ninguno de esos dos hot paths consulta `WorkspaceState.getProjectRegistry()`.
- AC2. `UnifiedProjectModel` expone archivos por proyecto para reutilización runtime.
- AC3. Las suites de `workspaceIndexer`, `libraryOrder` y `unifiedProjectModel` quedan verdes.

## 8. Riesgos y notas

- Esta slice reduce duplicidad, pero `UnifiedProjectModel` aún depende internamente de `ProjectRegistry` para mapear archivo -> proyecto.
- B141A seguirá abierta hasta conectar también invalidación, serving y status project-aware al mismo modelo.