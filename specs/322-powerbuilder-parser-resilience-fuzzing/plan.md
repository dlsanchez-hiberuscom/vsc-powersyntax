# Plan - Spec 322 powerbuilder parser resilience fuzzing (B272)

## 1. Enfoque técnico

Partir del borde mas falsable del parser actual: `statementSplitter` y `documentAnalysis` ya sostenian buena parte del consumo posterior, pero faltaba una harness determinista que forzase entradas truncadas o raras y comprobase scopes/diagnostics. La estrategia fue fijar primero el hueco local en el splitter, luego colgar una suite determinista sobre parser/masking/splitter y reparar solo los dos defectos reales que aparecieron: texto lógico contaminado por comentarios y scopes colgados de un type futuro bajo input malformado.

## 2. Pasos

1. Demostrar el hueco local del splitter con un test focal sobre comentarios anidados.
2. Rehacer `splitStatements` sobre `stripCommentsSmart` y sus máscaras.
3. Añadir `powerbuilderParserResilienceFuzz.test.ts` con corpus + mutaciones deterministas.
4. Reparar rangos de scopes de type repetidos y degradación a `global` para callables previos al primer `type` real.
5. Revalidar la superficie parser/masking/diagnostics/golden y alinear docs canónicas moviendo el foco a `B278`.

## 3. Riesgos

- contaminar `logicalStatements` con comentarios y provocar falsos positivos en diagnostics o bindings;
- colgar callables truncados de un objeto futuro y corromper el árbol de scopes;
- cerrar `B272` con fuzzing no determinista o sin una regresion focal del mismo slice.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/codeMasking.test.js out/test/server/unit/nestedComments.test.js out/test/server/unit/statementSplitter.test.js out/test/server/unit/documentAnalysis.test.js out/test/server/unit/externalFunctions.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js out/test/server/unit/corpusRegression.test.js out/test/server/unit/powerbuilderParserResilienceFuzz.test.js`

## 5. Resultado ejecutado

1. `logicalStatements` quedan ya construidos sobre texto sin comentarios y mantienen el caso de comentarios anidados con `;`/`&`.
2. la suite `powerbuilderParserResilienceFuzz.test.ts` deja fijado el no-crash y la coherencia estructural del parser en los casos raros del backlog.
3. backlog/current-focus/roadmap/done-log ya dejan `B272` cerrada y mueven el foco a `B278`.