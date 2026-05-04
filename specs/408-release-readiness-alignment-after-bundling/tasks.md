# Tasks — Spec 408

## Estado

- done

## Tasks

- [x] Publicar una smoke instalada del VSIX en `.vscode-test.js` sin `extensionDevelopmentPath`.
- [x] Añadir `test:smoke:installed-vsix` y encadenarlo dentro de `release:verify`.
- [x] Mantener `.github/workflows/release-readiness.yml` consumiendo `npm run release:verify` y publicando el VSIX resultante.
- [x] Validar la smoke instalada con `npm run test:smoke:installed-vsix`.
- [x] Fijar el contrato con `npm run test:unit -- --grep "unit/releaseReadinessContract"`.
- [x] Confirmar que el gate de rendimiento usa corpora CI-safe con `npm run test:performance:gate`.
- [x] Ejecutar `npm run test:architecture:rapid` y `npm run test:architecture:metrics` para registrar el estado arquitectónico real del lane.
- [x] Ejecutar `npm run release:verify` y registrar sus bloqueos preexistentes ajenos al slice.
- [x] Alinear backlog/current-focus/roadmap/done-log y docs de release/testing/performance/README.

## Riesgos residuales registrados

- `release:verify` sigue bloqueado por fallos preexistentes ajenos a `B387` en tests de catálogo y por el hotspot histórico de `src/client/extension.ts`.
- El lane instalado real queda cubierto por `test:smoke:installed-vsix`, pero la corrección de esas regresiones globales sigue fuera del alcance del slice release.
