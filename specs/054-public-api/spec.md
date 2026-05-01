# Spec 054 — Public API surface (B109)

## Motivación
Definir una interfaz pública estable para integraciones externas sobre
contratos maduros del runtime, sin exponer estructuras mutables ni prometer
evidence que aún no está cerrada.

## Alcance
- `src/shared/publicApi.ts`:
  - `PUBLIC_API_VERSION = '0.1.0'`.
  - Tipos `ApiSymbol`, `ApiQuerySymbolsRequest`, `ApiCatalogReport`, `ApiServerStats` y `VscPowerSyntaxApi`.
  - `isApiVersionCompatible(requested: string): boolean`.
- `src/client/extension.ts`:
  - la activación exporta `version`, `isVersionCompatible()`, `getServerStats()` y `querySymbols()`.
- `package.json`:
  - el flujo `build:test` recompila cliente/servidor antes de las suites sobre la extensión real.

## Criterios
1. Versión exportada.
2. La extensión exporta una API pública mínima real tras `activate()`.
3. La API no expone referencias mutables del runtime.
4. `getServerStats()` y `querySymbols()` operan sobre contratos maduros y validables.
