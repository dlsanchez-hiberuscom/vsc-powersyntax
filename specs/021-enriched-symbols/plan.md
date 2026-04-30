# Plan — 021 Enriched Symbols (B064)

## Cambios

- `src/server/knowledge/types.ts`: añadir campos opcionales.
- `src/server/knowledge/enrichEntity.ts`: helper puro.
- Tests `test/server/unit/enrichEntity.test.ts`.

## Helper

```ts
export function enrichEntity(e: Entity): Entity;
```

Reglas:

- `parameterCount = e.parameters?.length`
- `ownerName = e.ownerName ?? e.containerName`
- `implementationKind` ← derivado de `kind` + `signature`.
