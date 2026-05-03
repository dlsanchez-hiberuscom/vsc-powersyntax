# Spec 319 - persistent cache corruption fuzz recovery suite (B270)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B270` endureciendo la carga de caché persistente ante manifests/particiones malformados y añadiendo una matriz determinista de corrupción que garantice `rebuild` limpio sin crash ni estado semántico a medias.

## 2. Estado real actual

El repo ya dispone de `test/server/unit/cacheStoreCorruptionFuzz.test.ts`, además de `cacheStore.test.ts` y `cachePersistence.test.ts`, para cubrir truncados, journals corruptos, schema mismatch, manifests malformados y checkpoints/journals particionados dañados. `cacheStore.ts` valida ya la forma del manifest de particiones antes de usarlo.

## 3. Objetivo

Demostrar con pruebas deterministas que la persistencia semántica degrada a `rebuild` limpio cuando el estado persistido llega truncado, corrupto o estructuralmente inválido, sin publicar estado intermedio ni derribar el carril interactivo.

## 4. Alcance

- validar explícitamente `project-partitions.json` antes de consumir sus entradas;
- cubrir corrupción en checkpoint/journal raíz y particionado;
- cubrir manifests malformados y entradas de partición incompletas;
- dejar la decisión de restore en `rebuild` limpio cuando la persistencia no sea segura;
- alinear `docs/testing.md`, `docs/performance-budget.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md` y `docs/done-log.md` con el cierre.

## 5. Fuera de alcance

- abrir un segundo rail de persistencia o un formato alternativo de caché;
- maquillar corrupción con migraciones ad hoc no respaldadas por schema;
- mezclar `B270` con evolución de snapshots y payloads públicos, que pertenece a `B269`.

## 6. Criterios de aceptación

- AC1. manifest de particiones malformado o con entradas incompletas fuerza `rebuild` limpio.
- AC2. checkpoints y journals particionados truncados/corruptos fuerzan `rebuild` limpio.
- AC3. la batería determinista cubre corrupción raíz y particionada sin lanzar excepciones ni exponer documentos restaurados a medias.
- AC4. `cacheStore.test.ts` y `cachePersistence.test.ts` siguen verdes como regresión del carril de restore.
- AC5. docs canónicas quedan alineadas y el siguiente foco canónico pasa a `B269`.

## 7. Documentación afectada

- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/cacheStore.test.js out/test/server/unit/cachePersistence.test.js out/test/server/unit/cacheStoreCorruptionFuzz.test.js`

## 9. Cierre registrado

- la persistencia dañada ya no puede colarse por un manifest de particiones ambiguo;
- la suite determinista deja trazado que los casos corruptos caen a `rebuild` limpio sin crash;
- el siguiente foco canónico del repo pasa a `B269`.