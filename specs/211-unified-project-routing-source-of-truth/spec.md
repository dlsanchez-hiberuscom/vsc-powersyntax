# Spec 211 - Unified project routing source of truth (B141A)

## 1. Resumen

Extraer la asignación archivo->proyecto a un helper compartido y hacer que `UnifiedProjectModel` deje de depender internamente de `ProjectRegistry`.

## 2. Problema

Aunque el runtime ya consumía `UnifiedProjectModel` en más sitios, el propio modelo seguía apoyándose en `ProjectRegistry`, manteniendo una dependencia circular de diseño y duplicando la fuente real de verdad del routing.

## 3. Objetivo

Compartir una única resolución de routing de proyecto entre `ProjectRegistry` y `UnifiedProjectModel`, para que el modelo unificado pueda construirse directamente desde topología + archivos fuente.

## 4. Alcance

- extraer un helper de routing compartido;
- reutilizarlo desde `ProjectRegistry`;
- reconstruir `UnifiedProjectModel` sin parámetro `registry`;
- ajustar call sites y tests afectados.

## 5. Fuera de alcance

- eliminar todavía `ProjectRegistry` del bootstrap del servidor;
- borrar APIs legacy de `WorkspaceState`;
- cerrar toda la épica `B141A`.

## 6. Requisitos

- R1. `UnifiedProjectModel` debe poder derivar `getProjectForFile()` sin `ProjectRegistry`.
- R2. `ProjectRegistry` y el modelo deben compartir la misma lógica base de routing.
- R3. Las suites de routing existentes deben seguir verdes.

## 7. Criterios de aceptacion

- AC1. Existe un helper compartido de routing archivo->proyecto.
- AC2. `buildUnifiedProjectModel()` ya no recibe `registry`.
- AC3. `projectRegistry`, `unifiedProjectModel`, `libraryOrder` y `workspaceIndexer` siguen funcionando con tests.

## 8. Riesgos y notas

- Esta slice elimina una dependencia interna importante, pero aún deja `ProjectRegistry` vivo en el bootstrap por compatibilidad transitoria.
- La siguiente slice natural es retirar ese bootstrap redundante del runtime si ya no hay consumers productivos.