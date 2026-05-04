# Tasks — Spec 407

## Estado

- done

## Tasks

- [x] Congelar `package.json.files` como allowlist productiva y confirmar ausencia de `.vscodeignore` contradictorio.
- [x] Validar que `tools/verify-vsix-contents.mjs` comprueba required paths y forbidden prefixes del VSIX real.
- [x] Fijar el contrato con `test/server/unit/vsixPackageSurfaceContract.test.ts`.
- [x] Ejecutar `npm run test:unit -- --grep "unit/vsixPackageSurfaceContract"`.
- [x] Ejecutar `npm run package:vsix:list`.
- [x] Ejecutar `npm run verify:vsix-contents`.
- [x] Ejecutar `npm run release:verify` y registrar los bloqueos ajenos al slice.
- [x] Alinear backlog/current-focus/roadmap/done-log y docs de release/testing/README.

## Riesgos residuales registrados

- `release:verify` sigue bloqueado por regresiones preexistentes ajenas al carril VSIX en tests de catálogo y por el hotspot histórico de `unit/architectureImports`.
- La instalación/activación real desde VSIX y el workflow de release quedan para `B387`.
