# Tasks - Spec 314 cross-surface golden contract matrix (B273)

## 1. Preparación

- [x] T1. Confirmar el ancla local: ya existían `powerbuilderSemanticGolden.test.ts` y `semanticConsistencyOracle.test.ts` como base de fixture y contrato visible.
- [x] T2. Identificar el primer borde falsable: faltaba una sola suite que resumiera múltiples surfaces visibles sobre el mismo fixture.

## 2. Implementación

- [x] T3. Crear `test/server/unit/crossSurfaceGoldenMatrix.test.ts` reutilizando un fixture compartido con ancestro y DataWindow.
- [x] T4. Resumir `documentSymbols`, `workspaceSymbols`, hover, definition, references, rename eligibility, diagnostics, semantic tokens, `currentObjectContext`, `impactAnalysis`, `safeEditPlan`, manifest, dependency graph, DataWindow lineage y support bundle en una matriz estable.
- [x] T5. Ajustar la normalización para evitar depender de blobs completos o inventario API global frágil.
- [x] T6. Alinear docs canónicas y mover el foco a `B268`.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar la batería focal `crossSurfaceGoldenMatrix|powerbuilderSemanticGolden|semanticConsistencyOracle|documentSymbols|workspaceSymbols|semanticTokens|impactAnalysis|safeEditPlan|semanticWorkspaceManifest|dependencyGraph|dataWindowSqlLineage|supportBundle`.

## 4. Cierre

- [x] T9. Sacar `B273` del backlog activo, registrar el cierre en `docs/done-log.md`, mover `docs/current-focus.md` a `B268` y dejar la trazabilidad en `specs/314-cross-surface-golden-contract-matrix`.