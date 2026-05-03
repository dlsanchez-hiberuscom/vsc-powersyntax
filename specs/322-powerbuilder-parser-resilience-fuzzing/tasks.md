# Tasks - Spec 322 powerbuilder parser resilience fuzzing (B272)

## 1. Preparación

- [x] T1. Identificar el borde parser/masking/splitter con el hueco mas falsable para B272.
- [x] T2. Demostrar el hueco local con un test focal sobre `statementSplitter`.

## 2. Implementación

- [x] T3. Hacer que `statementSplitter` derive `logicalStatements` desde el stripper canónico y no desde texto con comentarios.
- [x] T4. Añadir la suite `powerbuilderParserResilienceFuzz.test.ts` con corpus y mutaciones deterministas.
- [x] T5. Reparar rangos monotónicos de scopes de type repetidos en `documentAnalysis.ts`.
- [x] T6. Degradar a `global` los callables truncados que aparecen antes del primer `type` real.
- [x] T7. Actualizar docs canónicas y mover el foco a `B278`.

## 3. Validación

- [x] T8. Ejecutar `npm run build:test`.
- [x] T9. Ejecutar la regresion focal `codeMasking|nestedComments|statementSplitter|documentAnalysis|externalFunctions|diagnostics|powerbuilderSemanticGolden|corpusRegression|powerbuilderParserResilienceFuzz`.

## 4. Cierre

- [x] T10. Sacar `B272` del backlog activo, registrar el cierre en `docs/done-log.md`, mover `docs/current-focus.md` a `B278` y dejar la trazabilidad en `specs/322-powerbuilder-parser-resilience-fuzzing`.