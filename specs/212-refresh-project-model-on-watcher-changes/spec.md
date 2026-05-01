# Spec 212 - Refresh project model on watcher changes (B141A)

## 1. Resumen

Refrescar `ProjectRegistry` y `UnifiedProjectModel` cuando el watcher añade o elimina archivos fuente del inventario del workspace.

## 2. Problema

El watcher ya actualizaba `knownFiles`, pero el routing project-aware quedaba congelado en el estado del discovery inicial. Un `create` o `delete` externo podía dejar obsoleto el `UnifiedProjectModel` usado por runtime y status.

## 3. Objetivo

Mantener sincronizado el routing project-aware con el inventario real de archivos fuente tras cambios externos.

## 4. Alcance

- añadir un refresh centralizado del routing en `WorkspaceState`;
- activarlo desde el watcher cuando cambie el inventario;
- validar create/delete con test focalizado.

## 5. Fuera de alcance

- reparseo de topología por cambios en `.pbw/.pbt/.pbproj/.pbsln`;
- optimización incremental más fina del refresh;
- cierre total de `B141A`.

## 6. Requisitos

- R1. Altas y bajas de source files deben reflejarse en `UnifiedProjectModel`.
- R2. El refresh debe vivir en un único punto reutilizable.
- R3. La validación debe cubrir create y delete externos.

## 7. Criterios de aceptacion

- AC1. `WorkspaceState` expone refresh centralizado de routing project-aware.
- AC2. `applyWatchedFileEvents()` lo invoca cuando cambia el inventario fuente.
- AC3. Los tests prueban que el archivo aparece y desaparece del `projectModel` tras create/delete.

## 8. Riesgos y notas

- El refresh actual recompone el routing completo; si el corpus crece mucho habrá que estudiar una vía incremental.
- Esta slice corrige coherencia runtime, no topología cambiante por markers de proyecto.