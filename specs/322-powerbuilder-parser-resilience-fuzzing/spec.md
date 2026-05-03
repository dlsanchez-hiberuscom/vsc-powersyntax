# Spec 322 - powerbuilder parser resilience fuzzing (B272)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B272` endureciendo parser/masking/splitter con una suite determinista de fuzzing sobre entradas PowerBuilder raras o truncadas, fijando que no haya crash, que los scopes se mantengan coherentes y que los diagnosticos no se disparen sin control.

## 2. Estado real actual

El repo ya dispone de `test/server/unit/powerbuilderParserResilienceFuzz.test.ts`, que ejerce corpus y mutaciones deterministas sobre comentarios anidados, strings raros, continuaciones `&`, SQL embebido, external functions, prototypes incompletos, eventos, `try/catch/finally`, labels y EOF incompleto. `statementSplitter.ts` construye ya el texto logico desde `stripCommentsSmart`, y `documentAnalysis.ts` mantiene rangos monotónicos de scopes de type degradando a `global` los callables malformados que aparecen antes del primer `type` real.

## 3. Objetivo

Endurecer el pipeline parser/masking/splitter para que degrade de forma segura ante inputs PowerBuilder raros o mutilados, reutilizando el backbone actual sin abrir un parser paralelo ni heuristicas opacas.

## 4. Alcance

- añadir fuzzing determinista para parser/masking/splitter sobre casos PowerBuilder raros y truncados;
- limpiar `logicalStatements` de comentarios para que diagnostics y bindings no consuman texto contaminado;
- fijar rangos agregados y monotónicos para scopes de type repetidos `forward/implementation`;
- degradar a `global` los callables truncados previos al primer `type` real;
- alinear `docs/testing.md`, `docs/architecture.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md` y `docs/done-log.md` con el cierre y el movimiento del foco a `B278`.

## 5. Fuera de alcance

- abrir soporte nuevo de preprocesador/conditional patterns, que pertenece a `B292`;
- introducir nuevos comandos de mantenimiento, que pertenecen a `B278`;
- ampliar semántica PowerBuilder fuera del endurecimiento defensivo y la degradación segura.

## 6. Criterios de aceptación

- AC1. existe una suite determinista que cubre comentarios anidados, strings raros, continuaciones `&`, SQL embebido, external functions, prototypes incompletos, eventos, `try/catch/finally`, labels y EOF truncado.
- AC2. parser, masking, splitter y diagnostics no lanzan excepciones sobre esa matriz determinista.
- AC3. `logicalStatements` no arrastran comentarios al texto lógico.
- AC4. los scopes de type repetidos mantienen rangos monotónicos y los callables previos al primer `type` degradan a `global` bajo input malformado.
- AC5. docs canónicas quedan alineadas y el siguiente foco canónico pasa a `B278`.

## 7. Documentación afectada

- `docs/testing.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/codeMasking.test.js out/test/server/unit/nestedComments.test.js out/test/server/unit/statementSplitter.test.js out/test/server/unit/documentAnalysis.test.js out/test/server/unit/externalFunctions.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js out/test/server/unit/corpusRegression.test.js out/test/server/unit/powerbuilderParserResilienceFuzz.test.js`

## 9. Cierre registrado

- el parser ya queda cubierto por fuzzing determinista y por regresion focal sobre la misma superficie;
- el texto logico del splitter deja de arrastrar comentarios al backbone consumido por diagnostics y bindings;
- el siguiente foco canónico del repo pasa a `B278`.