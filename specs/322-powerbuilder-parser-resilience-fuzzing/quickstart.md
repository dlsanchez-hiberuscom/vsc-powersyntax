# Quickstart - Spec 322 powerbuilder parser resilience fuzzing (B272)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/codeMasking.test.js out/test/server/unit/nestedComments.test.js out/test/server/unit/statementSplitter.test.js out/test/server/unit/documentAnalysis.test.js out/test/server/unit/externalFunctions.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js out/test/server/unit/corpusRegression.test.js out/test/server/unit/powerbuilderParserResilienceFuzz.test.js
```

Comprobación funcional minima:

1. Verificar que `powerbuilderParserResilienceFuzz.test.ts` cubre comentarios anidados, strings raros, continuaciones `&`, SQL embebido, external functions, prototypes incompletos, eventos, `try/catch/finally`, labels y EOF truncado.
2. Verificar que `statementSplitter.test.ts` confirma que `logicalStatements` no arrastran comentarios aunque haya `;` o `&` dentro de comentarios anidados.
3. Verificar que `documentAnalysis.ts` mantiene scopes de type monotónicos y que los callables malformados previos al primer `type` degradan a `global` en lugar de colgarse del objeto futuro.
4. Verificar que `B272` ya no permanece en el backlog activo y que el siguiente foco canónico es `B278`.