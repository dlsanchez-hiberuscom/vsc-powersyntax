# Quickstart - Spec 320 semantic snapshot schema evolution and compatibility (B269)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/semanticWorkspaceSnapshot.test.js out/test/server/unit/publicApi.test.js out/test/server/unit/supportBundle.test.js
```

Comprobación funcional mínima:

1. Verificar que `semanticWorkspaceSnapshot.test.ts` importa un snapshot legado compatible sin `schemaVersion` o `summary` y sigue rechazando versiones no soportadas.
2. Verificar que el manifest versionado externo roundtripea a través del carril de snapshot sin perder conteos ni readiness.
3. Verificar que `publicApi.test.ts` y `supportBundle.test.ts` mantienen compatibilidad minor con `public-contract`, `read-only-tool-bridge` y `support bundle manifest` de `test/fixtures/compatibility`.
4. Verificar que `B269` ya no permanece en el backlog activo y que el siguiente foco canónico es `B271`.