# Plan — Spec 434 / BL-07

- Owner directo: `test/fixtures/lsp-guards` y `test/smoke/lsp-guards.extension.test.ts`; validación de compatibilidad en `test/server/unit/topology.test.ts`.
- Hipótesis: basta con dar a cada fixture el subset textual que `parseTopology()` ya entiende (`.pbw -> .pbt/.pbproj`, `.pbt/.pbproj -> .pbl`, `.pbsln -> .pbproj`) para convertirlos en markers plausibles sin cambiar el guard del LSP.
- Guardrail: el cambio no toca `server.ts`, `powerbuilderFiles.ts` ni el parser topológico fuera del subset ya contractual.
- Validación focal:
  - `npx tsc -p tsconfig.test.json`
  - `npx mocha --ui tdd out/test/server/unit/topology.test.js`
  - `npm run test:smoke -- --grep "lsp-guards"`
  - `npm run test:docs:drift`