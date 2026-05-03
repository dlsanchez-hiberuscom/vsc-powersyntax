# Quickstart - Spec 304 semantic cache compaction and retention policy v2 (B259)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/cacheStore.test.js out/test/server/unit/cachePersistence.test.js out/test/server/unit/runtimeHealth.test.js
npx mocha --ui tdd --timeout 30000 out/test/server/performance/indexer.perf.test.js --grep "Cold start|Warm start"
```

Comprobación funcional mínima:

1. Verificar que `PowerSyntax: Ejecutar Mantenimiento de Cache Semántica` compacta journals grandes y limpia workspaces persistidos obsoletos.
2. Verificar que `PowerSyntax: Mostrar Stats del Runtime` expone `persistence.policy` y `persistence.maintenance`.
3. Verificar que `PowerSyntax: Mostrar Salud del Runtime` refleja findings cuando hay workspaces obsoletos, journals grandes o budget de disco excedido.