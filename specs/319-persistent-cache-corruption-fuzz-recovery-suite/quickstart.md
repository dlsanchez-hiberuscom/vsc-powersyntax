# Quickstart - Spec 319 persistent cache corruption fuzz recovery suite (B270)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/cacheStore.test.js out/test/server/unit/cachePersistence.test.js out/test/server/unit/cacheStoreCorruptionFuzz.test.js
```

Comprobación funcional mínima:

1. Verificar que `cacheStoreCorruptionFuzz.test.ts` deja `decision.action = rebuild` y checkpoint vacío para manifest/checkpoint/journal particionados corruptos.
2. Verificar que `cacheStore.test.ts` y `cachePersistence.test.ts` siguen verdes sobre truncados, schema mismatch, journal sequence y serving snapshot inválido.
3. Verificar que la corrupción persistida no provoca crash ni estado semántico parcialmente restaurado.
4. Verificar que `B270` ya no permanece en el backlog activo y que el siguiente foco canónico es `B269`.