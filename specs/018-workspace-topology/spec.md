# Spec 018 — Workspace topology parser (B056)

## 1. Motivación

Hoy `discoverWorkspace` solo localiza markers (`.pbw`/`.pbt`/`.pbsln`/`.pbproj`)
pero no parsea su contenido. Sin esto, no podemos:
- asociar archivos a su target/proyecto,
- aplicar library order real,
- distinguir librerías por target.

## 2. Alcance

- Nuevo módulo `src/server/workspace/topology.ts`.
- Parser tolerante para los formatos de `*.pbw`, `*.pbt`, `*.pbsln`, `*.pbproj`:
  - Extrae rutas/identificadores básicos (líneas con extensiones reconocidas o
    valores entre comillas).
  - Devuelve `WorkspaceTopology` con:
    - `targets: TargetInfo[]` (`uri`, `name`, `libraries: string[]`).
    - `solutions: SolutionInfo[]` (`uri`, `projects: string[]`).
    - `projects: ProjectInfo[]` (`uri`, `name`, `libraries: string[]`).
- `WorkspaceState.setTopology` / `getTopology`.
- Llamada en `discoverWorkspace` cuando se detectan markers.

### Fuera de alcance

- Parser semántico exacto del binario PB.
- Library order priorización (B087 spec 020).

## 3. Criterios de aceptación

1. `parseTopology(uri, content)` devuelve `TargetInfo`/`SolutionInfo`/`ProjectInfo` según extensión.
2. `WorkspaceState.getTopology()` expone los datos parseados.
3. Tests sobre fixtures sintéticos.

## 4. Documentación

- `docs/architecture.md` (capa workspace topology).
- `docs/current-focus.md`/`backlog.md` (B056 cerrada).
