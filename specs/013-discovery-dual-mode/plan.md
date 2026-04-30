# Plan — 013 Discovery Dual Mode (B120)

## 1. Cambios en `workspaceState.ts`

- Añadir a `WorkspaceRoots`:
  - `solutions: string[]` (URIs de `.pbsln`).
  - `projects: string[]` (URIs de `.pbproj`).
- Inicializar listas vacías en el constructor implícito.
- Añadir método `getMode(): 'workspace' | 'solution' | 'mixed' | 'unknown'`.

## 2. Cambios en `discovery.ts`

- Ampliar `IGNORED_DIRECTORIES` con `.pb`, `build`, `_backupfiles`.
- En `walkDirectory`:
  - `.pbsln` → `state.addRoot('solutions', uri)`.
  - `.pbproj` → `state.addRoot('projects', uri)`.
  - Mantener detección existente de `.pbw`, `.pbt`, `.pbl`.

## 3. Tests

- Nueva suite en `test/server/unit/workspace.test.ts` que extiende los tests
  existentes con:
  - workspace puro (solo `.pbw`/`.pbt`).
  - solution pura (solo `.pbsln`/`.pbproj`).
  - workspace + solution → `mixed`.
  - sin markers → `unknown`.
  - exclusión de `.pb`, `build`, `_BackupFiles`.

## 4. Validación

- `npm run compile`.
- `npm run build:test` + `npx mocha out/test/server/unit/**/*.test.js`.
- `npx mocha out/test/server/integration/**/*.test.js`.
