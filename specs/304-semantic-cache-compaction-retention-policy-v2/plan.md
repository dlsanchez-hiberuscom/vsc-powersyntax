# Plan - Spec 304 semantic cache compaction and retention policy v2 (B259)

## 1. Enfoque técnico

Reforzar `cacheStore` como dueño de la persistencia semántica: la policy v2 debe vivir en el mismo rail que ya conoce `workspaceKey`, checkpoints, journals y restore, sin mover compactación ni retención al hot path interactivo.

## 2. Pasos

1. Añadir policy v2 en `cacheStore` con TTL por workspace, métricas de disco e inspección de mantenimiento.
2. Añadir compactación controlada del journal con validación de restore posterior.
3. Exponer la policy y los findings por `showStats`/health, más un comando local de mantenimiento.
4. Validar con unit de `cacheStore`/`cachePersistence` y con el carril warm/cold existente.

## 3. Riesgos

- compactar o limpiar en el hot path y degradar latencia interactiva;
- borrar workspaces persistidos no obsoletos por una policy de TTL demasiado agresiva;
- dejar un checkpoint compactado que no pueda reusarse al siguiente restore.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/cacheStore.test.js out/test/server/unit/cachePersistence.test.js out/test/server/unit/runtimeHealth.test.js`
- `npx mocha --ui tdd --timeout 30000 out/test/server/performance/indexer.perf.test.js --grep "Cold start|Warm start"`

## 5. Resultado ejecutado

1. La policy v2 ya limpia `workspaceKey` obsoletos, mide bytes persistidos y compacta journals grandes bajo un comando explícito.
2. `showStats` y `health` ya publican budgets y findings de persistencia sin tocar el hot path.
3. El foco canónico del repo pasa a `B260`.