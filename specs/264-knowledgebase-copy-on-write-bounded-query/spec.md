# Spec 264 - KnowledgeBase copy-on-write e indices de consulta acotada (B230)

**Estado:** cerrada y validada.

## 1. Resumen

Reducir el coste incremental de `KnowledgeBase` evitando clones amplios del estado publicado en cada mutacion y reforzar consultas/conteos acotados cuando el consumer ya conoce un subconjunto util del indice.

## 2. Estado real actual

`B230` queda `Closed`: `KnowledgeBase` ya clona superficialmente el estado base y duplica solo los buckets afectados por id/kind/dependencia durante `upsert/remove`; ademas, `queryEntities/countEntities` reutilizan un indice por `EntityKind` y un total precalculado para evitar recorridos completos cuando no hacen falta.

## 3. Objetivo

Hacer que las mutaciones documentales de `KnowledgeBase` escalen mejor en workspaces grandes sin romper atomicidad defensiva ni reabrir estructuras mutables a consumidores del runtime.

## 4. Alcance

- sustituir el clon profundo de `PublishedKnowledgeState` por copy-on-write por bucket;
- mantener inmutabilidad observable en lecturas publicas y batches atomicos;
- ampliar las consultas/conteos acotados por `kind` donde ya existe un hot path claro;
- fijar el presupuesto incremental con una prueba de rendimiento sintetica de miles de documentos.

## 5. Fuera de alcance

- redisenar `ManagedStringInterner` o cambiar su contrato persistente;
- abrir nuevos paneles o surfaces UX sobre la mejora interna de la KB;
- reescribir `workspaceSymbols`, `completion` o features ajenas fuera del consumo puntual del indice acotado;
- introducir caches publicas nuevas fuera de `KnowledgeBase`.

## 6. Criterios de aceptacion

- AC1. `upsert/remove` dejan de clonar en profundidad todo el estado publicado y copian solo buckets afectados.
- AC2. La atomicidad defensiva de lecturas publicas, snapshots y batch updates se conserva.
- AC3. `queryEntities/countEntities` aprovechan indices acotados cuando se les pide un subconjunto por `kind`.
- AC4. Existe benchmark sintetico con miles de documentos para fijar el coste incremental.
- AC5. La documentacion canónica refleja el cierre y el siguiente foco pasa a `B231`.

## 7. Documentacion afectada

- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/performance-budget.md`
- `docs/roadmap.md`
- `docs/testing.md`

## 8. Validacion requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/knowledgeBase.test.js out/test/server/performance/knowledgeBase.perf.test.js`
- `npm run test:performance -- --grep "knowledgeBase"`

## 9. Cierre registrado

- `src/server/knowledge/KnowledgeBase.ts` introduce el copy-on-write por bucket para ids, kinds y dependencias inversas, con total de entidades precalculado;
- `src/server/features/semanticWorkspaceManifest.ts` consume el nuevo conteo acotado por `kind`;
- `test/server/unit/knowledgeBase.test.ts` amplía el contrato visible y `test/server/performance/knowledgeBase.perf.test.ts` fija el presupuesto incremental con 5000 documentos sinteticos.