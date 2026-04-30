# Plan — 019 Project Registry (B057)

## Módulo `src/server/workspace/projectRegistry.ts`

```ts
export interface ProjectRegistry {
  getProjectForFile(uri: string): string | null;
  getAllProjects(): string[];
  getFilesForProject(projectUri: string): string[];
}

export function buildProjectRegistry(
  topology: WorkspaceTopology,
  sourceFiles: string[]
): ProjectRegistry;
```

## Scoring

Para cada archivo:
1. Para cada target/proyecto, verificar si alguna `.pbl` referenciada es
   prefijo del archivo (caso `.pbl` carpeta) o si el `.pbl` y el archivo
   comparten dirname (caso `.pbl` archivo).
2. Si match: score = longitud del prefijo común con la library (más larga gana).
3. Si no match: score = longitud del prefijo común con dirname del marker.
4. Devuelve el de score máximo; en empate, el primer marker.

## WorkspaceState

- `setProjectRegistry(reg)`, `getProjectRegistry()`.

## Integración (server.ts)

Tras `discoverWorkspace` y antes de `indexWorkspace`, construir el registry y dejarlo en state. (Aprovechable más tarde en resolución).

## Tests

- match exacto por library prefix.
- fallback por path proximity.
- sin markers → null.
