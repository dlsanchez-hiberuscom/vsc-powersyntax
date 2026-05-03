# Quickstart - Spec 321 telemetry-free observability contract (B271)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/publicApi.test.js out/test/server/unit/supportBundle.test.js
```

Comprobación funcional mínima:

1. Verificar que `publicApi.test.ts` ve un `observability` descriptor versionado dentro del contrato público.
2. Verificar que el descriptor declara `externalTelemetry = false`, `localOnly = true` y cubre readiness/indexing/cache/memory/latency/build/ORCA/diagnostics/query trace/support bundle/health.
3. Verificar que `supportBundle.test.ts` sigue probando la redacción real del export offline y que el contrato lo clasifica como `sanitized` + `offline-export`.
4. Verificar que `B271` ya no permanece en el backlog activo y que el siguiente foco canónico es `B272`.