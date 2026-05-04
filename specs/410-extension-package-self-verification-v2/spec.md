# Spec 410 — B315 Extension package self-verification v2

## Estado

- done

## Relación backlog

- Backlog item: `B315 — Extension package self-verification v2`

## Objetivo

Reforzar la auto-verificación del VSIX empaquetado para que el carril de release instalado compruebe activación, comandos, handshake mínimo con runtime/LSP, defaults de settings y descriptor/API pública.

## Resultado de cierre

- `test/smoke/extension.test.ts` amplía la smoke instalada para verificar defaults de `vscPowerSyntax.profile`, `progress.show`, `formatting.enabled`, `formatting.formatOnSave`, `formatting.maxDocumentChars` y `formatting.maxDocumentLines`, además de activación, comandos y descriptor/API pública ya cubiertos;
- `test/server/unit/packageSelfVerificationContract.test.ts` congela el alcance del self-verification del paquete y confirma que `release:verify` mantiene `test:smoke:installed-vsix` como parte del lane;
- la verificación ampliada sigue ejecutándose sobre el VSIX instalado real a través de `package:vsix -> verify:vsix-contents -> test:smoke:installed-vsix`, sin abrir un segundo harness.

## Validación ejecutada

- `npm run test:unit -- --grep "unit/packageSelfVerificationContract"`
- `npm run test:smoke:installed-vsix`
- `npm run release:verify`

## Nota de validación

- `npm run release:verify` sigue bloqueado por fallos globales preexistentes ajenos a `B315`: `unit/visualCatalogDatatypes`, `unit/systemCatalogQueryHardening`, `unit/runtimeCatalogDatatypes`, `unit/explainSystemSymbol`, `unit/catalogConsistency` y el hotspot histórico de `src/client/extension.ts` en `unit/architectureImports`.

## Fuera de alcance del corte cerrado

- corregir las regresiones globales de catálogo o el hotspot histórico de `src/client/extension.ts`;
- abrir un segundo runner de smoke distinto de `vscode-test` para la extensión instalada;
- rediseñar el carril `release:verify`, que solo se amplía con el self-verification del paquete.
