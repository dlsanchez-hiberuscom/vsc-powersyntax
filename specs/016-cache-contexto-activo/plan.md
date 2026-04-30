# Plan — 016 Hot Context Cache (B134A)

## 1. Módulo `src/server/knowledge/HotContextCache.ts`

```ts
export class HotContextCache {
  private activeUri: string | null = null;
  private kbVersion: number = -1;
  private activeEntities: Entity[] | undefined;
  private inheritedMembers: Map<string, Entity[]> = new Map();

  setActive(uri: string, kbVersion: number): void {
    if (this.activeUri !== uri || this.kbVersion !== kbVersion) {
      this.invalidate();
      this.activeUri = uri;
      this.kbVersion = kbVersion;
    }
  }

  getActiveUri(): string | null;
  getActiveEntities(): Entity[] | undefined;
  setActiveEntities(entities: Entity[]): void;
  getInheritedMembers(typeName: string): Entity[] | undefined;
  setInheritedMembers(typeName: string, members: Entity[]): void;
  invalidate(): void;
  invalidateForUri(uri: string): void;
}
```

## 2. Wiring en `server.ts`

- Crear instancia única `hotContextCache`.
- En `documents.onDidChangeContent`, llamar `hotContextCache.invalidateForUri(uri)`.
- En `documents.onDidClose`, llamar `hotContextCache.invalidateForUri(uri)`.

## 3. Tests

- `setActive` con misma URI + misma versión no invalida nada.
- Cambiar URI invalida.
- Cambiar `kbVersion` invalida.
- `invalidateForUri(activeUri)` limpia entradas pero conserva la identidad.
- `invalidateForUri(otra-uri)` no toca cache.
