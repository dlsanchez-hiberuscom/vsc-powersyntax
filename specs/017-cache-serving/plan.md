# Plan — 017 Serving Cache (B134B)

## 1. Módulo `src/server/knowledge/ServingCache.ts`

```ts
export interface ServingKeyParts {
  feature: 'hover' | 'completion' | 'signatureHelp' | 'definition';
  uri: string;
  line: number;
  character: number;
  kbVersion: number;
  extra?: string;
}

export function makeKey(p: ServingKeyParts): string;

export class ServingCache<T = unknown> {
  constructor(maxEntries = 256);
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  invalidate(uri?: string): void;
  size(): number;
}
```

LRU vía `Map` (orden de inserción) + `delete + set` al hit para mover a final.

## 2. Wiring en `server.ts`

- Crear `servingCache = new ServingCache<...>()`.
- En `documents.onDidChangeContent`: `servingCache.invalidate(uri)`.
- En `documents.onDidClose`: `servingCache.invalidate(uri)`.

## 3. Wiring en `hover` (PoC)

- En `connection.onHover` componer `key = makeKey(...)`.
- `const cached = servingCache.get(key); if (cached) return cached;`
- Calcular y guardar `servingCache.set(key, result)`.

## 4. Tests

- LRU evicción cuando se supera `maxEntries`.
- `invalidate(uri)` solo elimina entradas con esa URI.
- `invalidate()` lo borra todo.
- `makeKey` estable y diferenciado por cada parte.
