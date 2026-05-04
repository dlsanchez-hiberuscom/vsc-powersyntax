# Spec 415 — B284 Semantic query explain plan

## Estado

- done

## Relación backlog

- Backlog item: `B284 — Semantic query explain plan`

## Objetivo

Exportar un explain plan legible de una resolución semántica real, con fases, candidatos, descartes, winner, `confidence`, `sourceOrigin` y coste aproximado sin abrir otro motor de resolución.

## Resultado de cierre

- `src/server/features/explainSemanticQuery.ts` compone el report read-only directamente sobre `queryContext`, `ResolvedTargetInfo` y `queryTrace`, exponiendo phases/candidates/discards/winner/`sourceOrigin` y coste aproximado sobre la resolución real;
- `src/shared/publicApi.ts`, `src/server/handlers/reportCommandHandlers.ts`, `src/server/handlers/lifecycleHandlers.ts` y `src/client/extension.ts` publican `explainSemanticQuery()` como comando/API/tool estable (`powerbuilder.explainSemanticQuery`, `explain-semantic-query`) con fallback por editor activo;
- `src/client/explainSemanticQueryReport.ts`, `src/client/commandRegistration.ts` y `package.json` añaden `PowerSyntax: Explain Semantic Query at Cursor` como salida Markdown legible del explain plan.

## Validación ejecutada

- `npm run test:unit -- --grep "unit/(explainSemanticQuery|publicApi)"`
- `npm run test:smoke -- --grep "explain semantic query"`

## Fuera de alcance del corte cerrado

- cambiar la política de resolución del query engine o reabrir cómo se elige el winner en el hot path;
- usar knowledge packs para alterar este explain plan antes de cerrar la policy específica de `B286`;
- exportar batches masivos de explain plans si el contrato local por cursor ya cubre el caso read-only defendible.