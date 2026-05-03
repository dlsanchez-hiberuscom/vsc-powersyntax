# Plan - Spec 325 ambiguity model v2 for query engine (B280)

## 1. Enfoque técnico

Partir del mismo sitio donde ya vivían `reasonCodes`, `confidence` y la evidence del winner path: `semanticQueryService`. La idea fue no reescribir la resolución, sino enriquecer su salida con dos categorías nuevas que faltaban de verdad en los consumers: `fallback-ambiguity` cuando el winner path ya es ambiguo por `global-fallback`, y `source-origin-conflict` cuando el winner se decide descartando un origin más débil. Con esa señal publicada, `queryContext` la expone a features y `hoverFormat` deja de mostrar todo como simple empate por distancia mínima.

## 2. Pasos

1. Fijar en tests la ausencia de `ambiguityKind` y de evidence para `global-fallback` ambiguo y conflicto de `sourceOrigin`.
2. Añadir esa señal a `semanticQueryService` sin abrir un segundo motor ni tocar la identidad canónica de `B279`.
3. Proyectarla hacia `queryContext` y `hoverFormat`.
4. Revalidar `definition`, `references` y `rename` para asegurar que el modelo nuevo no altera sus guardrails.
5. Alinear docs canónicas y mover el foco a `B281`.

## 3. Riesgos

- degradar surfaces ya verdes si la nueva evidence cambia el gating implícito de `rename` o la lectura de ambiguity en `queryContext`;
- mezclar la nueva clasificación con clasificación por proyecto/librería que pertenece más al carril `B255` que al query engine puro;
- documentar `global-fallback` ambiguo como si fuese lo mismo que empate por distancia, dejando el problema conceptual intacto.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticQueryService.test.js out/test/server/unit/queryContext.test.js out/test/server/unit/hoverFormat.test.js out/test/server/unit/hover.test.js out/test/server/unit/definition.test.js`
- `npx mocha --ui tdd out/test/server/unit/references.test.js out/test/server/unit/rename.test.js`

## 5. Resultado ejecutado

1. `semanticQueryService` distingue ya `distance-minimum`, `global-fallback` ambiguo y `source-origin-conflict` resuelto por prioridad;
2. `queryContext` y hover proyectan la nueva semántica sin romper consumers existentes;
3. el foco canónico del repo pasa a `B281`.