# Spec 325 - ambiguity model v2 for query engine (B280)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B280` haciendo explícito el modelo de ambigüedad del query engine: empate por distancia mínima, ambigüedad de `global-fallback` y conflicto de `sourceOrigin` resuelto por prioridad, con proyección coherente hacia `queryContext` y hover.

## 2. Estado real actual

El repo ya publicaba `reasonCodes`, `confidence` y parte de la evidence del winner path, pero seguía tratando varios escenarios distintos como si fueran lo mismo: el empate por distancia mínima ya tenía `distance-ambiguity`, mientras que un `global-fallback` con varios winners cross-project solo devolvía `winner-target`, y un conflicto entre source real y `orca-staging` quedaba resuelto por prioridad sin evidence explícita del descarte.

## 3. Objetivo

Diferenciar de forma canónica la ambigüedad real del query engine y exponer esa señal a los consumidores semánticos, sin abrir un segundo motor de resolución ni degradar el contrato de identidad exacta recién fijado por `B279`.

## 4. Alcance

- introducir `ambiguityKind` canónico en `semanticQueryService` y `queryContext`;
- emitir `fallback-ambiguity` cuando `global-fallback` deja varios winners y `source-origin-conflict` cuando el winner se elige descartando origins más débiles;
- mantener `distance-ambiguity` como categoría diferenciada para empates de distancia mínima;
- proyectar la diferencia visible en hover mediante `hoverFormat`;
- mantener verdes `definition`, `references` y `rename` con el modelo nuevo y sin relajaciones accidentales.

## 5. Fuera de alcance

- abrir `B281` o el hardening de overload/override dentro de esta spec;
- introducir clasificación por proyecto/librería dentro del query engine fuera de la evidence ya publicada por `B255`;
- cambiar el contrato de gating de rename más allá de la información que ya recibe desde `queryContext`.

## 6. Criterios de aceptación

- AC1. el query engine distingue `distance-minimum` frente a `global-fallback` y no deja ambos como ambigüedad genérica;
- AC2. un conflicto `solution-source` frente a `orca-staging` deja evidence explícita de `source-origin-conflict` cuando el winner se resuelve por prioridad;
- AC3. `queryContext` proyecta `ambiguityKind` y los `evidenceKinds` nuevos sin perder compatibilidad con consumers existentes;
- AC4. hover muestra un texto distinto para ambigüedad de fallback global frente al empate por distancia mínima;
- AC5. `definition`, `references` y `rename` siguen verdes con el modelo nuevo, y el siguiente foco del repo pasa a `B281`.

## 7. Documentación afectada

- `docs/rules-catalog.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticQueryService.test.js out/test/server/unit/queryContext.test.js out/test/server/unit/hoverFormat.test.js out/test/server/unit/hover.test.js out/test/server/unit/definition.test.js`
- `npx mocha --ui tdd out/test/server/unit/references.test.js out/test/server/unit/rename.test.js`

## 9. Cierre registrado

- `src/server/knowledge/resolution/semanticQueryService.ts` publica ya `ambiguityKind`, `fallback-ambiguity` y `source-origin-conflict` además de la evidence previa del winner path;
- `src/server/features/queryContext.ts` proyecta esa clasificación canónica a consumers del editor;
- `src/server/features/hoverFormat.ts` diferencia ya el mensaje visible entre empate por distancia mínima y ambigüedad de `global-fallback`;
- `definition`, `references` y `rename` quedan verdes con el modelo nuevo, y el siguiente foco canónico del repo pasa a `B281`.