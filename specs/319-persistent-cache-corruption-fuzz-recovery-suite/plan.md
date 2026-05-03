# Plan - Spec 319 persistent cache corruption fuzz recovery suite (B270)

## 1. Enfoque técnico

Partir del borde más falsable: la carga de cache persistente ya cubría truncados básicos, así que el hueco útil era la forma del manifest de particiones y la ausencia de una matriz única sobre corrupción de particiones. La estrategia fue endurecer ese punto de entrada y congelarlo con casos deterministas de corrupción sobre manifest/checkpoint/journal particionado.

## 2. Pasos

1. Validar explícitamente la forma del manifest de particiones en `cacheStore.load()`.
2. Añadir una matriz determinista sobre manifest y persistencia particionada corrupta.
3. Revalidar `cacheStore`, `cachePersistence` y la nueva suite de corrupción.
4. Cerrar docs canónicas y mover el foco a `B269`.

## 3. Riesgos

- dejar que un manifest válido como JSON pero inválido estructuralmente entre en el restore y lance tarde;
- cubrir solo truncados raíz y no corrupción de particiones;
- cerrar `B270` sin dejar una suite única y explícita de recuperación segura.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/cacheStore.test.js out/test/server/unit/cachePersistence.test.js out/test/server/unit/cacheStoreCorruptionFuzz.test.js`

## 5. Resultado ejecutado

1. `cacheStore.ts` reconstruye limpio cuando `project-partitions.json` no es seguro.
2. `cacheStoreCorruptionFuzz.test.ts` cubre manifest y particiones dañadas.
3. backlog/focus/roadmap/done-log ya dejan `B270` cerrada y mueven el foco a `B269`.