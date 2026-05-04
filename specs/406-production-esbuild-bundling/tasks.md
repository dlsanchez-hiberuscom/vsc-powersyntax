# Tasks — Spec 406

## Estado

- done

## Tasks

- [x] Confirmar que `package.json` ya publica `./dist/client/extension.js` y empaqueta `dist/**`.
- [x] Confirmar que `tools/esbuild.mjs` genera cliente y servidor en `dist/**` con contrato de bundling estable.
- [x] Limitar `out/server/server.js` a fallback exclusivo de `Development` en `src/client/extension.ts`.
- [x] Añadir test focal `test/server/unit/productionBundlingContract.test.ts` para congelar el contrato textual de bundling.
- [x] Validar el carril con `npm run test:unit -- --grep "unit/productionBundlingContract"`.
- [x] Validar el VSIX real con `npm run package:vsix`.
- [x] Inspeccionar el contenido publicable con `npm run package:vsix:list`.
- [x] Alinear backlog/current-focus/roadmap/done-log y documentación de arquitectura/testing/workflows.

## Riesgos residuales registrados

- `architectureImports` sigue rojo por el hotspot preexistente de `src/client/extension.ts`; este spec no cambia su tamaño ni su budget estructural.
- El hardening exhaustivo del contenido del VSIX se difiere a `B386` para no mezclar bundling con allowlist/denylist de release.
