# Spec 053 — Diagnostics snapshot (B063)

## Motivación
Vista agregada de diagnostics: ya no solo por archivo y código, sino
también por proyecto/objeto y con enlace a la versión real del documento
y del snapshot publicado. Útil para resumen exportable, observabilidad y
consumidores que necesiten consistencia con el estado semántico vigente.

## Alcance
- `src/server/features/diagnosticsSnapshot.ts`:
  - `buildDiagnosticsSnapshot(byUri: Map<string, Diagnostic[] | DiagnosticsSnapshotInputEntry>): Snapshot`.
  - Snapshot: `{totals, byFile, byCode, bySeverity, documents, projects}`.
- `src/server/features/diagnostics.ts`:
  - reutiliza el mismo snapshot enriquecido para exponer export/summary sin duplicar agregación.

## Criterios
1. Suma totales por severity.
2. Agrupa por código (`source:code`).
3. Agrupa por proyecto y objeto cuando hay contexto suficiente.
4. Conserva `documentVersion` y `snapshotVersion` por entrada documental.
5. La exportación/resumen reutiliza el builder común y no una agregación paralela.
