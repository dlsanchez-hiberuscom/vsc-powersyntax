# Spec 407 — B386 VSIX package surface hardening and package content verification

## Estado

- done

## Relacion backlog

- Backlog item: `B386 — VSIX package surface hardening and package content verification`

## Objetivo

Endurecer la surface del VSIX para que el paquete final sea pequeño, reproducible y verificable, evitando artefactos de desarrollo y dependencias innecesarias.

## Resultado de cierre

- `package.json.files` queda fijado sobre la allowlist productiva `dist/**`, `syntaxes/**`, `icons/**`, `language-configuration.json`, `package.json`, `LICENSE`, `README.md` y `CHANGELOG.md`, sin `.vscodeignore` paralelo que contradiga ese modelo;
- `tools/verify-vsix-contents.mjs` comprueba required paths del runtime/publicación y bloquea prefijos prohibidos (`src/`, `test/`, `fixtures-local/`, `node_modules/`, `coverage/`, `.cache/`, `.tmp/`, `tools/`, `scripts/`, `out/`) además de `*.tsbuildinfo`;
- `test/server/unit/vsixPackageSurfaceContract.test.ts` congela el contrato `allowlist + verify-vsix-contents + release:verify` para que el carril VSIX no vuelva a ensancharse por accidente.

## Validacion ejecutada

- `npm run test:unit -- --grep "unit/vsixPackageSurfaceContract"`
- `npm run package:vsix:list`
- `npm run verify:vsix-contents`
- `npm run release:verify`

## Nota de validacion

- `npm run release:verify` sigue fallando por regresiones preexistentes ajenas a `B386` en `unit/visualCatalogDatatypes`, `unit/systemCatalogQueryHardening`, `unit/runtimeCatalogDatatypes`, `unit/explainSystemSymbol`, `unit/catalogConsistency` y por el hotspot histórico de `unit/architectureImports` sobre `src/client/extension.ts`.

## Fuera de alcance del corte cerrado

- alinear workflows manuales/CI e instalación real desde VSIX; eso queda para `B387` y `AUDIT-01`;
- corregir regresiones preexistentes de catálogo o el hotspot histórico de `src/client/extension.ts`;
- ampliar la allowlist del VSIX más allá de la surface publicable ya defendida.
