# Spec 016 — Caché caliente del contexto activo (B134A)

## 1. Motivación

Cuando el usuario edita un archivo, hover/completion/definition/signatureHelp
recalculan ancestros, miembros heredados y resultados intermedios cada
vez. La KB ya indexa por URI con O(1), pero datos derivados (lista de
ancestros, miembros visibles, símbolos del documento ordenados) se
recomputan constantemente.

Un caché *caliente* dedicado al **documento activo** y sus **dependencias
inmediatas** permite reutilizar esos resultados durante la sesión de
edición sin esperar al re-índice global.

## 2. Alcance

- Nueva clase `HotContextCache` en `src/server/knowledge/HotContextCache.ts`.
- Almacena entradas asociadas a un único `activeUri` y a `kbVersion`:
  - entidades del documento activo,
  - tipos derivados (`activeTypes`),
  - miembros heredados por tipo (`inheritedMembers`).
- Auto-invalidación cuando:
  - cambia `activeUri`,
  - cambia `kbVersion` (versión del índice),
  - se llama `invalidate(uri?)` desde el servidor.
- Instanciación en `server.ts`. Invalidación en `onDidChangeContent` y
  cuando se cierra el documento.

### Fuera de alcance

- Caché de resultados de features (hover, completion → spec 017).
- Pre-cálculo agresivo en background (B121/B121.x).

## 3. Criterios de aceptación

1. `HotContextCache` expone `setActive`, `getActiveEntities`,
   `setActiveEntities`, `getInheritedMembers`, `setInheritedMembers`,
   `invalidate`, `invalidateForUri`.
2. Cambiar `activeUri` o `kbVersion` borra el caché.
3. Llamar a `invalidateForUri(activeUri)` invalida sin borrar la
   identidad de `activeUri` (próximo `setActive` re-poblará).
4. Tests unitarios sobre todos los caminos de invalidación.

## 4. Documentación afectada

- `docs/architecture.md` (mención del HotContextCache).
- `docs/current-focus.md`, `docs/backlog.md` (B134A cerrada).
