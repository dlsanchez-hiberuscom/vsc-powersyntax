# Spec 052 — Project status helper (B107)

## Motivación
Datos para status bar / tooltip. Resume estado del workspace.

## Alcance
- `src/server/features/projectStatus.ts`:
  - `formatProjectStatus({readiness, projectName?, totalFiles, indexedFiles})` → string.

## Criterios
1. ready: `"app — N archivos"`.
2. indexing: `"app — indexando i/N"`.
3. error: `"app — error"`.
