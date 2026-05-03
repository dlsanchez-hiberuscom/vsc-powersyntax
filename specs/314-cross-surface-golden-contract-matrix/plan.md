# Plan - Spec 314 cross-surface golden contract matrix (B273)

## 1. Enfoque técnico

No abrir otra infraestructura: reutilizar el fixture y el backbone read-only ya existentes. El primer borde falsable era comprobar si podía resumirse una matriz estable con una sola prueba nueva sin depender de blobs completos ni de inventarios globales ajenos al fixture.

## 2. Pasos

1. Construir un fixture compartido que ya materialice ancestro, DataWindow y routing de proyecto.
2. Resumir en una sola matriz `documentSymbols`, `workspaceSymbols`, hover, definition, references, rename eligibility, diagnostics, semantic tokens, `currentObjectContext`, `impactAnalysis`, `safeEditPlan`, manifest, dependency graph, DataWindow lineage y support bundle.
3. Ajustar la normalización para congelar señales visibles útiles y no datos globales demasiado frágiles.
4. Validar la suite nueva junto con la batería focal del backbone PowerBuilder/read-only.
5. Alinear docs canónicas y mover el foco a `B268`.

## 3. Riesgos

- fijar blobs enteros o inventario API global y convertir la suite en una trampa de ruido documental;
- abrir un segundo oracle paralelo a `B264` en vez de reutilizar surfaces existentes;
- dejar `B273` cerrada sin sacar el ítem del backlog activo o sin mover el foco canónico.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/crossSurfaceGoldenMatrix.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js out/test/server/unit/semanticConsistencyOracle.test.js out/test/server/unit/documentSymbols.test.js out/test/server/unit/workspaceSymbols.test.js out/test/server/unit/semanticTokens.test.js out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/dependencyGraph.test.js out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/supportBundle.test.js`

## 5. Resultado ejecutado

1. `crossSurfaceGoldenMatrix.test.ts` ya fija la matriz visible sobre un fixture compartido.
2. La normalización ya congela señales útiles sin fijar inventario API irrelevante al fixture.
3. El cierre canónico de `B273` ya deja el foco del repo en `B268`.