# Spec 053 — Diagnostics snapshot (B063)

## Motivación
Vista agregada de diagnostics: por archivo, por código y totales. Útil
para vista resumen y comandos de "next problem in file/code".

## Alcance
- `src/server/features/diagnosticsSnapshot.ts`:
  - `buildDiagnosticsSnapshot(byUri: Map<string, Diagnostic[]>): Snapshot`.
  - Snapshot: `{totals: {error, warning, info, hint}, byCode, byFile}`.

## Criterios
1. Suma totales por severity.
2. Agrupa por código (`source:code`).
