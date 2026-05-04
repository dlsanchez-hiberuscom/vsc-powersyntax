# Spec 406 — B385 Production esbuild bundling for client and language server

## Estado

- done

## Relacion backlog

- Backlog item: `B385 — Production esbuild bundling for client and language server`

## Objetivo

Sustituir el empaquetado basado en `out/** + node_modules runtime` por bundles de producción con `esbuild`, dejando un runtime VSIX autocontenido y defendible.

## Resultado de cierre

- `package.json` publica `main = ./dist/client/extension.js`, empaqueta solo `dist/**` y ejecuta `npm run bundle` en `vscode:prepublish`/`package:vsix` para que el carril productivo no dependa de `node_modules` runtime suelto;
- `tools/esbuild.mjs` genera `dist/client/extension.js` y `dist/server/server.js`, manteniendo `vscode` como `external` del cliente y un server bundle Node ejecutable localmente;
- `src/client/extension.ts` arranca el LSP desde `dist/server/server.js` y deja `out/server/server.js` como fallback exclusivo de `Development`.

## Validacion ejecutada

- `npm run test:unit -- --grep "unit/productionBundlingContract"`
- `npm run package:vsix`
- `npm run package:vsix:list`

## Nota de validacion

- `npm run test:unit -- --grep "unit/architectureImports"` sigue fallando por el hotspot preexistente de `src/client/extension.ts` (budgets de líneas/imports), no introducido por este slice.

## Fuera de alcance del corte cerrado

- endurecer la allowlist/denylist exacta del VSIX, que queda en `B386`;
- validar instalación/activación real desde VSIX, que queda en `B387` y `AUDIT-01`;
- refactorizar el hotspot histórico de `src/client/extension.ts` fuera del alcance del bundling.
