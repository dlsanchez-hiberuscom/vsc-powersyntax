# Spec 408 — B387 Release readiness alignment after bundling

## Estado

- done

## Relacion backlog

- Backlog item: `B387 — Release readiness alignment after bundling`

## Objetivo

Alinear `release:verify`, workflow de GitHub Actions y documentación con el modelo productivo basado en `dist/**`, verificación de contenido y smoke instalada del VSIX.

## Resultado de cierre

- `.vscode-test.js` publica el label `smoke-installed` con `extensionDevelopmentPath: []`, `installExtensions: ['.dist/vsc-powersyntax.vsix']` y directorios aislados de user-data/extensions para ejecutar la smoke de activación real sobre la extensión instalada;
- `package.json` añade `test:smoke:installed-vsix` y encadena esa smoke dentro de `release:verify` después de `package:vsix` y `verify:vsix-contents`, dejando el lane release alineado con `bundle -> package -> verify -> installed smoke`;
- `.github/workflows/release-readiness.yml` sigue usando `npm run release:verify` y publica el VSIX/artifacts del mismo carril, mientras la documentación de release/testing/performance refleja ya el flujo `dist/**` y la validación instalada.

## Validacion ejecutada

- `npm run test:smoke:installed-vsix`
- `npm run test:unit -- --grep "unit/releaseReadinessContract"`
- `npm run test:performance:gate`
- `npm run test:architecture:rapid`
- `npm run test:architecture:metrics`
- `npm run release:verify`

## Nota de validacion

- `npm run test:architecture:metrics` y `npm run release:verify` siguen fallando por bloqueos preexistentes fuera de `B387`: el hotspot histórico de `src/client/extension.ts` en `architecture-hotspot-guard`/`unit/architectureImports` y regresiones ajenas en `unit/visualCatalogDatatypes`, `unit/systemCatalogQueryHardening`, `unit/runtimeCatalogDatatypes`, `unit/explainSystemSymbol` y `unit/catalogConsistency`.

## Fuera de alcance del corte cerrado

- corregir los fallos globales preexistentes de catálogo o el hotspot histórico de `src/client/extension.ts`;
- abrir una segunda infraestructura de smoke distinta de `vscode-test` para la extensión instalada;
- reabrir el modelo de bundling/VSIX ya fijado en `B385/B386`.
