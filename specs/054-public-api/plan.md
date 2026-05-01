# Plan 054 (B109)
- `shared/publicApi.ts` + tests.
- export `VscPowerSyntaxApi` desde `client/extension.ts`.
- reutilizar `ApiServerStats` y `ApiSymbol` en `getServerStats()` y `querySymbols()`.
- validar la superficie pública desde smoke y recompilar cliente/servidor en `build:test`.
