# Tasks - Spec 319 persistent cache corruption fuzz recovery suite (B270)

## 1. Preparación

- [x] T1. Confirmar qué casos de corrupción ya estaban cubiertos por `cacheStore.test.ts` y `cachePersistence.test.ts`.
- [x] T2. Identificar el hueco local: manifest de particiones malformado y corrupción particionada sin matriz determinista explícita.

## 2. Implementación

- [x] T3. Validar la forma de `project-partitions.json` antes de consumirlo en `cacheStore.load()`.
- [x] T4. Crear `cacheStoreCorruptionFuzz.test.ts` con casos deterministas sobre manifest/checkpoint/journal particionados.
- [x] T5. Alinear docs canónicas y mover el foco a `B269`.

## 3. Validación

- [x] T6. Ejecutar `npm run build:test`.
- [x] T7. Ejecutar la batería `cacheStore|cachePersistence|cacheStoreCorruptionFuzz`.

## 4. Cierre

- [x] T8. Sacar `B270` del backlog activo, registrar el cierre en `docs/done-log.md`, mover `docs/current-focus.md` a `B269` y dejar la trazabilidad en `specs/319-persistent-cache-corruption-fuzz-recovery-suite`.