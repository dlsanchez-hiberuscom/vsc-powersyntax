# Plan - Spec 309 semantic consistency oracle (B264)

## 1. Enfoque técnico

No abrir una surface nueva: componer un oracle interno encima de surfaces read-only ya cerradas. El primer ajuste debía ser local y falsable: alinear `objectKind` entre currentObjectContext y manifest. A partir de ahí, el oracle compara valores, emite reason codes y tolera de forma honesta cuando el manifest está truncado por budget.

## 2. Pasos

1. Compartir la inferencia de `objectKind` por URI entre currentObjectContext y manifest.
2. Construir el oracle interno sobre context, manifest, graph, diagnostics, lineage y conflictos cross-project.
3. Validar el oracle con casos sanos, divergencias forzadas, DataWindow y ORCA staging.
4. Añadir una smoke mínima sobre corpus reales PFC/OrderEntry.
5. Alinear docs canónicas y mover el foco a `B265`.

## 3. Riesgos

- confundir drift semántico real con límites de budget del manifest;
- comparar surfaces derivadas de la misma fuente inmediata y creer que son evidencias independientes;
- reintroducir `EntityKind.Type` como `objectKind` visible y romper la consistencia base.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/semanticConsistencyOracle.test.js`
- `npx mocha --ui tdd out/test/server/performance/semanticConsistencyOracle.smoke.test.js`

## 5. Resultado ejecutado

1. `objectKind` ya queda normalizado entre currentObjectContext y manifest.
2. El oracle interno ya distingue corpus sanos, divergencias forzadas y staging colapsado.
3. PFC Solution y OrderEntry quedan validados con smoke real antes del cierre canónico.