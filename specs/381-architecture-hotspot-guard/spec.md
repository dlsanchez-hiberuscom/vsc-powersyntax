# Spec 381: Architecture hotspot guard

## Status

Closed.

## Backlog mapping

- B353 — Large-file regression guard and architecture metrics.

## Objective

Añadir un guard reproducible de tamaño, imports y responsibility drift para los hotspots TypeScript del repo, sin convertirlo en un sustituto del firewall de imports ni del gate real sobre PFC/STD.

## Implemented scope

- `tools/run-architecture-hotspot-guard.mjs` publica un runner local/CI que mide `lines`, `imports` y `topLevelDeclarations` sobre los hotspots críticos `src/client/extension.ts`, `src/server/server.ts` y `src/client/commandRegistration.ts`.
- El runner mantiene una allowlist explícita para slices generated/manual grandes del catálogo (`generated.generated.ts`, `objectFunctions.ts`, `dataWindowFunctions.ts`, `manual/language/enumerations/index.ts`, `globalFunctions.ts`, `systemEvents.ts`) con budgets propios y warnings a partir del `90%` del umbral.
- `package.json` expone el lane estable `npm run test:architecture:metrics` y el runner deja evidencia en `artifacts/performance/architecture-hotspot-guard.json`.
- `test/server/unit/architectureImports.test.ts` sigue fijando el firewall por capas y ahora además ejecuta el runner para que el guard quede integrado en la suite unitaria rápida de arquitectura.

## Out of scope

- Descomponer `src/server/server.ts` o reducir directamente `src/client/extension.ts` (`B347/B354`).
- Cambiar budgets de performance o sustituir `npm run test:architecture:rapid` sobre corpus reales.
- Decidir todavía la política final manual/generated del catálogo (`B367-B370`).

## Acceptance evidence

- Existe un comando reproducible local/CI para el guard: `npm run test:architecture:metrics`.
- El guard diferencia hotspots críticos de catálogo allowlisted y falla solo cuando un budget explícito se supera.
- La suite unitaria de arquitectura consume el runner y sigue verificando a la vez el firewall de imports por capas.
- `docs/architecture.md`, `docs/testing.md`, `docs/current-focus.md`, `docs/backlog.md` y `docs/done-log.md` quedan alineados con el nuevo rail.

## Validation

```bash
npm run test:unit -- --grep architectureImports
npm run test:architecture:metrics
```