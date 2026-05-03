# Spec 314 - cross-surface golden contract matrix (B273)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B273` congelando en una matriz golden resumida los outputs visibles de `documentSymbols`, `workspaceSymbols`, hover, definition, references, rename eligibility, diagnostics, semantic tokens, `currentObjectContext`, `impactAnalysis`, `safeEditPlan`, manifest, dependency graph, DataWindow lineage y support bundle sobre un fixture compartido.

## 2. Estado real actual

El repo ya dispone de `test/server/unit/crossSurfaceGoldenMatrix.test.ts`, que monta un fixture compartido (`w_context`, `w_context_base`, `d_sales_orders`) y construye una matriz normalizada con las surfaces read-only visibles. Esa suite se revalida junto con `powerbuilderSemanticGolden`, `semanticConsistencyOracle`, `documentSymbols`, `workspaceSymbols`, `semanticTokens`, `impactAnalysis`, `safeEditPlan`, `semanticWorkspaceManifest`, `dependencyGraph`, `dataWindowSqlLineage` y `supportBundle`, y la documentación canónica ya mueve el foco a `B268`.

## 3. Objetivo

Detectar drift visible entre surfaces clave con un único golden explícito, reutilizando la base read-only ya cerrada y sin abrir un segundo oracle ni nuevos contratos fuera del backbone existente.

## 4. Alcance

- crear una suite cross-feature que analice una sola vez un fixture compartido y resuma las surfaces visibles más relevantes;
- congelar nombres, ubicaciones, reason codes, riesgos, `sourceOrigin`, lineage y señales del support bundle en un formato estable y mantenible;
- revalidar el golden junto con las suites vecinas que ya sostienen el backbone PowerBuilder/read-only;
- alinear `docs/testing.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md` y `docs/done-log.md` con el cierre.

## 5. Fuera de alcance

- abrir una infraestructura nueva de snapshots masivos por surface o un segundo oracle paralelo a `B264`;
- congelar payloads completos y frágiles del support bundle o blobs enteros de API cuando basta una normalización estable;
- mezclar `B273` con nuevas APIs, nuevas writes o nuevos carriles runtime/arquitectura.

## 6. Criterios de aceptación

- AC1. existe una suite golden cross-surface explícita sobre un fixture compartido.
- AC2. la matriz cubre `documentSymbols`, `workspaceSymbols`, hover, definition, references, rename eligibility, diagnostics, semantic tokens, `currentObjectContext`, `impactAnalysis`, `safeEditPlan`, manifest, dependency graph, DataWindow lineage y support bundle.
- AC3. la normalización congela señales visibles útiles sin depender de blobs enteros frágiles ni de inventario API global irrelevante.
- AC4. la validación incluye la suite nueva y una batería focal de suites vecinas del backbone read-only.
- AC5. backlog, roadmap, current-focus, testing y done-log quedan alineados y el siguiente foco canónico pasa a `B268`.

## 7. Documentación afectada

- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/crossSurfaceGoldenMatrix.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js out/test/server/unit/semanticConsistencyOracle.test.js out/test/server/unit/documentSymbols.test.js out/test/server/unit/workspaceSymbols.test.js out/test/server/unit/semanticTokens.test.js out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/dependencyGraph.test.js out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/supportBundle.test.js`

## 9. Cierre registrado

- la matriz golden cross-surface ya queda fijada sobre un fixture común y reutiliza el backbone de surfaces read-only existente;
- el drift visible entre outline, navegación, diagnostics, context packs, manifest, lineage y support bundle ya queda detectado por una única suite explícita;
- el siguiente foco canónico del repo pasa a `B268`.