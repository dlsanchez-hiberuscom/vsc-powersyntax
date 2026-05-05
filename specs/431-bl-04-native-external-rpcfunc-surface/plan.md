# Plan — Spec 431 / BL-04

- Ancla local: `src/server/parsing/externalFunctions.ts` y sus consumers inmediatos en `documentAnalysis`, `hoverFormat`, `diagnostics` y `powerBuilderTechnicalDebtReport`.
- Hipótesis: `RPCFUNC` comparte el hecho de no tener implementación PowerScript interna, así que puede reutilizar el rail actual de `isExternal` si añadimos un discriminador explícito `library|rpcfunc`.
- Guardrail: no introducir una clasificación PBNI separada; PBX ya sigue siendo la evidencia visible para runtime/packaging PBNI.
- Validación focal:
  - `npx mocha --ui tdd out/test/server/unit/externalFunctions.test.js out/test/server/unit/rename.test.js out/test/server/unit/references.test.js out/test/server/unit/hoverFormat.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js`
  - `npm run test:docs:drift`