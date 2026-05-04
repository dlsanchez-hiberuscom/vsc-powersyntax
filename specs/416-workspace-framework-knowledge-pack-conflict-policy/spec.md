# Spec 416 — B286 Workspace symbols vs framework knowledge pack conflict policy

## Estado

- done

## Relación backlog

- Backlog item: `B286 — Workspace symbols vs framework knowledge pack conflict policy`

## Objetivo

Definir cómo conviven los símbolos reales del workspace con framework knowledge packs curados, manteniendo el source real como autoridad visible y degradando los packs a contexto advisory sin reabrir la política generated/manual ni el winner real del query engine.

## Resultado de cierre

- `src/server/knowledge/system/frameworkKnowledgePackPolicy.ts` centraliza la policy ligera basada en owner types curados + `sourceOrigin`, donde el source real del workspace gana y los knowledge packs degradan a contexto advisory;
- `src/shared/publicApi.ts`, `src/server/features/workspaceSymbols.ts`, `src/server/features/currentObjectContext.ts`, `src/server/features/impactAnalysis.ts` y `src/server/features/safeEditPlan.ts` publican `frameworkKnowledgeConflict` en las surfaces read-only que ya conocían el símbolo ganador;
- `src/client/objectCheckReport.ts` y `src/client/currentObjectContextPanelModel.ts` hacen visible la policy en object check/panel sin alterar la selección real del winner ni abrir un segundo rail semántico.

## Validación ejecutada

- `npx tsc -p tsconfig.test.json`
- `npx mocha --ui tdd out/test/server/unit/frameworkKnowledgePacks.test.js out/test/server/unit/workspaceSymbols.test.js out/test/server/unit/currentObjectContext.test.js out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/currentObjectContextPanelModel.test.js out/test/server/unit/objectCheckReport.test.js out/test/server/unit/publicApi.test.js`
- `npm run test:docs:drift`

## Fuera de alcance del corte cerrado

- alterar la política generated/manual del system catalog o mezclarla con esta policy de knowledge packs;
- cambiar cómo el query engine elige el winner real del workspace;
- ampliar el catálogo de knowledge packs o convertirlo en un segundo motor semántico.