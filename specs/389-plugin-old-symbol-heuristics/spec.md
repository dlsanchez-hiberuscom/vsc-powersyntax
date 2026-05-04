# Spec 389 — B342 Extract proven symbol heuristics from plugin_old

## Estado

- done

## Relacion backlog

- Backlog item: `B342 — Extract proven symbol heuristics from plugin_old`

## Objetivo

Revisar heurísticas probadas de `plugin_old` y extraer sólo las defendibles sobre el backbone actual (`KnowledgeBase`, snapshots, `queryContext`, `references`, `signatureHelp`) sin crear un motor paralelo ni reintroducir providers legacy completos.

## Alcance

- clasificar explícitamente las heurísticas auditadas (`already implemented / partial / valuable gap / obsolete / unsafe`);
- adoptar al menos una heurística de valor probado sobre el runtime actual con wiring LSP mínimo y tests focales;
- mantener cualquier serving nuevo detrás de los mismos readiness/confidence gates ya usados por rename/references.

## Fuera de alcance

- portar providers cliente completos de `plugin_old`;
- abrir un segundo query engine o un índice semántico paralelo;
- mezclar edge cases DataWindow profundos que pertenecen a `B344`.

## Resultado de cierre

- la auditoría de `docs/plugin-old-migration-opportunities.md` deja una matriz explícita por heurística: `linked editing` queda absorbido, `folding` / `inlay hints` / resúmenes extra de `code lens` quedan como parciales aprovechables y los casos DataWindow `child/report/column occurrences` se aislan como siguiente frente de `B344`;
- `src/server/features/linkedEditing.ts` publica linked editing seguro para símbolos `Local` y `Argumento`, reusando `queryContext` + `references` sobre el documento activo y sin abrir provider host ni query engine paralelo;
- `src/server/handlers/featureHandlers.ts`, `lifecycleHandlers.ts` y `server.ts` cablean la nueva capacidad LSP con los mismos readiness/confidence gates ya usados por rename/references.

## Validación de cierre

- `npm run test:unit -- --grep "unit/(linkedEditing|architectureImports)"` — `unit/linkedEditing` verde; `unit/architectureImports` sigue cayendo por el hotspot preexistente de `src/client/extension.ts` fuera del alcance de `B342`.