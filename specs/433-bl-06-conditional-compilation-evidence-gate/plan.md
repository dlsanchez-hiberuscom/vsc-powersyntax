# Plan — Spec 433 / BL-06

- Owner directo: `src/server/utils/comments.ts` como filtro canónico; detector nuevo en parsing puro.
- Hipótesis: un detector line-based apoyado en `stripCommentsSmart()` basta para diferenciar directivas activas de histórico comentado sin abrir soporte de parser.
- Guardrail: el detector no cambia el análisis semántico ni reescribe `logicalStatements`; sólo publica evidencia reutilizable y tests sentinel.
- Validación focal:
  - `npx tsc -p tsconfig.test.json`
  - `npx mocha --ui tdd out/test/server/unit/conditionalCompilationGate.test.js out/test/server/unit/powerbuilderParserResilienceFuzz.test.js`
  - `npm run test:docs:drift`