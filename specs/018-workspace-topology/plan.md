# Plan — 018 Workspace topology parser (B056)

## Módulo `src/server/workspace/topology.ts`

```ts
export interface TargetInfo { uri: string; name: string; libraries: string[]; }
export interface ProjectInfo { uri: string; name: string; libraries: string[]; }
export interface SolutionInfo { uri: string; projects: string[]; }

export interface WorkspaceTopology {
  targets: TargetInfo[];
  projects: ProjectInfo[];
  solutions: SolutionInfo[];
}

export function parseTopology(uri: string, content: string): TargetInfo | ProjectInfo | SolutionInfo | null;
```

Heurística:
- `.pbw` → lista de targets, captura cada token con `.pbt`/`.pbproj`.
- `.pbt` → captura líneas con extensión `.pbl`.
- `.pbsln` → captura tokens `.pbproj`.
- `.pbproj` → captura `.pbl`.

Nombre derivado del basename del archivo.

## WorkspaceState

- `setTopology(t)`, `getTopology(): WorkspaceTopology`.

## Integración

En `discoverWorkspace`, al detectar un marker, leer su contenido (tolerante a
errores) y agregar al topology builder. Devolver topology al final.

## Tests

- Parsea `.pbw` con 2 targets.
- Parsea `.pbt` con varias `.pbl`.
- Parsea `.pbsln` con varios `.pbproj`.
- Parsea `.pbproj` con varias `.pbl`.
