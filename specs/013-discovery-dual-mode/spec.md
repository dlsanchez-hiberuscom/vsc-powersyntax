# Spec 013 — Discovery rápido no bloqueante en modo Dual (B120)

## 1. Motivación

`discoverWorkspace` solo reconoce hoy los markers de **Workspace** clásico
(`.pbw`, `.pbt`, `.pbl`). PowerBuilder 2025 introduce además el modo
**Solution** con `.pbsln` y `.pbproj`, donde las carpetas `*.pbl` contienen
ficheros `*.sr*` exportados.

Para sostener ambos modos sin penalizar el arranque hace falta:

- detectar de forma fiable los markers de los dos modos,
- excluir directorios de build/respaldo que solo añaden ruido (`.pb`,
  `build`, `_BackupFiles`),
- distinguir el modo descubierto en `WorkspaceState` para que las capas
  superiores puedan reaccionar (status bar, scheduler, indexador).

## 2. Alcance

- Ampliar `WorkspaceRoots` con `solutions` (`.pbsln`) y `projects`
  (`.pbproj`).
- Detectar `.pbsln`/`.pbproj` durante `discoverWorkspace`.
- Añadir `IGNORED_DIRECTORIES`: `.pb`, `build`, `_backupfiles`.
- Exponer `WorkspaceState.getMode(): 'workspace' | 'solution' | 'mixed' | 'unknown'`.
- Mantener cooperatividad/cancelación ya implementadas.

### Fuera de alcance

- Parseo del contenido de `.pbsln`/`.pbproj` (eso es B056/B057, P1).
- Library order (B087, P1).
- Watch incremental real (queda para B125 progresivo).

## 3. Criterios de aceptación

1. `WorkspaceRoots` incluye `solutions: string[]` y `projects: string[]`.
2. `discoverWorkspace` registra `.pbsln`/`.pbproj` en sus listas y no los
   indexa como código fuente.
3. Las carpetas `.pb`, `build` y `_BackupFiles` no se recorren ni se
   reportan.
4. `WorkspaceState.getMode()` devuelve `'solution'` si hay `.pbsln`,
   `'workspace'` si solo hay `.pbw`, `'mixed'` si conviven y `'unknown'`
   si no hay markers.
5. Toda la suite unit + integración pasa sin regresiones.

## 4. Validación

- Tests unitarios sobre `discovery.ts` con fixtures sintéticas para los
  cuatro escenarios de `getMode()`.
- Test que verifica la exclusión de `.pb`, `build`, `_BackupFiles`.
- `npm run compile` y `npm run build:test` limpios.

## 5. Documentación afectada

- `docs/current-focus.md` (B120 cerrada).
- `docs/backlog.md` (B120 marcada como entregada).
- `docs/roadmap.md` (Fase 6B avanza).
- `README.md` (mención del modo Dual).
