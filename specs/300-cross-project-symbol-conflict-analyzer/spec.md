# Spec 300 - cross project symbol conflict analyzer (B255)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B255` con un analizador read-only de conflictos semánticos cross-project que agrupe símbolos por `buildSymbolKey`, proyecte ranking/evidence defendible y no sobrerreporte duplicados de la misma ubicación cuando `sourceOrigin` ya prioriza source real frente a `orca-staging`.

## 2. Estado real actual

El repositorio ya tenía query engine, `sourceOrigin`, routing por proyecto/librería y explainability, pero el gap real era doble: el query trace infradeclaraba ambigüedad cuando el fallback global devolvía varios winners y no existía una surface read-only que materializara conflictos cross-project con contexto exportable.

## 3. Objetivo

Servir un reporte read-only de conflictos cross-project reutilizando `KnowledgeBase`, `buildSymbolKey`, `WorkspaceState`, prioridad de `sourceOrigin` y el tool bridge público ya endurecido, sin abrir una segunda engine semántica ni reparsear el workspace.

## 4. Alcance

- marcar ambigüedad en `semanticQueryService` y `queryContext` cuando una resolución devuelve múltiples winners cross-project;
- construir `crossProjectSymbolConflicts` como feature server-side read-only con ranking por proyecto/librería/origen y colapso de duplicados en la misma ubicación;
- exponer la surface por API pública v2.7.0, tool bridge y comando Markdown;
- fijar el contrato en tests unitarios, contractuales y smoke;
- alinear documentación viva y mover el foco canónico a `B256`.

## 5. Fuera de alcance

- reescribir el query engine o el project routing;
- abrir rename/references cross-project automáticos sobre esta base;
- introducir un índice paralelo o un escaneo textual del workspace.

## 6. Criterios de aceptación

- AC1. `semanticQueryService` y `queryContext` reflejan ambigüedad cuando el fallback global devuelve varios winners cross-project.
- AC2. el analizador agrupa por `buildSymbolKey` y colapsa staging/duplicados de la misma ubicación según prioridad de `sourceOrigin`.
- AC3. la feature se sirve por LSP, API pública, tool bridge y comando Markdown con contrato estable.
- AC4. la validación cubre unit del query engine, `queryContext`, feature B255, contrato público y smoke de activación.
- AC5. backlog, roadmap y current-focus dejan de tratar `B255` como deuda activa y pasan a `B256`.

## 7. Documentación afectada

- `README.md`
- `docs/developer-workflows.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticQueryService.test.js out/test/server/unit/queryContext.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js out/test/server/unit/publicApi.test.js --grep "(cross-project|crossProject|publicApi|cross-project-symbol-conflicts)"`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 9. Cierre registrado

- `crossProjectSymbolConflicts` queda servido por API pública/tool bridge/comando Markdown sobre la semántica ya indexada;
- `semanticQueryService` y `queryContext` dejan explícita la ambigüedad cross-project en fallback global;
- el siguiente foco canónico del repo pasa a `B256`.
