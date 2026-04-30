# Plan — 020 Library order resolver (B087)

## Módulo `src/server/knowledge/resolution/libraryOrder.ts`

```ts
export function resolveByLibraryOrder(
  candidates: Entity[],
  activeUri: string | null,
  state: WorkspaceState
): Entity[];
```

## Lógica

1. Para cada candidato calcular `(projectUri, libraryIndex)`.
2. Score = `(activeProjectMatch ? 0 : 1, libraryIndex ?? Infinity)`.
3. Ordenar ascendente por score.

## Integración

`provideDefinition` envuelve los candidatos antes del `sortAndFilterByDistance`.

## Tests

- Mismo proyecto, dos libs distintas → orden por library.
- Diferentes proyectos → preferencia al activo.
