# Spec 054 — Public API surface (B109)

## Motivación
Definir interfaz pública estable para integraciones externas. Solo
declaraciones tipadas + helper de versionado en `src/shared/publicApi.ts`.

## Alcance
- `src/shared/publicApi.ts`:
  - `PUBLIC_API_VERSION = '0.1.0'`.
  - Tipos `ApiSymbol`, `ApiQuerySymbolsRequest`, `ApiCatalogReport`.
  - `isApiVersionCompatible(requested: string): boolean` (semver mayor + menor compatibles).

## Criterios
1. Versión exportada.
2. Compatibilidad: `0.1.x` con `0.1.0` ok; `0.2.0` ok; `1.x` no.
