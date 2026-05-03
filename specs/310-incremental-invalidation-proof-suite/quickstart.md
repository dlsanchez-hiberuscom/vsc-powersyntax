# Quickstart - Spec 310 incremental invalidation proof suite (B265)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/semanticDiff.test.js out/test/server/unit/watchedFileIntake.test.js
npx mocha --ui tdd out/test/server/performance/large-workspace-incremental.perf.test.js
```

Comprobación funcional mínima:

1. Verificar que `watchedFileIntake.test.ts` cubre los casos mínimos de `B265` sin abrir rediscovery global.
2. Verificar que `semanticDiff.test.ts` detecta dependencias `DataObject`/child DataWindow y cambios de contrato retrieve en `.srd`.
3. Verificar que `large-workspace-incremental.perf.test.ts` mantiene el burst incremental y masivo dentro del budget vigente.