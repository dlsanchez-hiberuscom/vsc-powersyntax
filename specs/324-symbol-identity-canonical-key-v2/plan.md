# Plan - Spec 324 symbol identity canonical key v2 (B279)

## 1. Enfoque técnico

Partir del punto donde realmente se decide la identidad y no del query engine completo. `src/server/knowledge/symbolKey.ts` concentraba el defecto raíz, así que la estrategia fue fijar primero el fallo con una unidad roja, endurecer la identidad exacta y solo después separar el consumidor que sí necesitaba una agrupación relajada (`crossProjectSymbolConflicts`). Con esa base, el siguiente ajuste fue local al resolver semántico para que una occurrence dentro de un duplicado staging prefiriera su misma surface antes de aplicar prioridad global por `sourceOrigin`, evitando que `references` y `rename` arrastraran la copia equivocada.

## 2. Pasos

1. Añadir tests focales para demostrar que la clave vieja colapsaba `solution-source` y `orca-staging`.
2. Endurecer `buildSymbolKey` e introducir `buildConflictFamilyKey` sin abrir una segunda identidad paralela.
3. Ajustar `crossProjectSymbolConflicts` para usar la family key y mantener el colapso legítimo por ubicación.
4. Reforzar `semanticQueryService`, `references` y `rename` con un caso real frente a `orca-staging`.
5. Propagar `identityKey` a manifest, dependency graph, exported symbols y candidatos de conflicto.
6. Alinear docs canónicas y mover el foco a `B280`.

## 3. Riesgos

- endurecer demasiado la identidad exacta y romper agrupados legítimos cross-project;
- seguir mezclando staging si la resolución semántica prefería el target global aunque el match viviera dentro del duplicado local;
- publicar `identityKey` con serializadores distintos entre surfaces y reabrir drift contractual.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/symbolKey.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js`
- `npx mocha --ui tdd out/test/server/unit/references.test.js out/test/server/unit/rename.test.js`
- `npx mocha --ui tdd out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/dependencyGraph.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js`

## 5. Resultado ejecutado

1. la identidad exacta ya sale de `buildSymbolKey` y la family key relajada queda acotada a `buildConflictFamilyKey`;
2. `references` y `rename` ya no mezclan surfaces `orca-staging` cuando la resolución canónica es la real;
3. manifest, dependency graph, exported symbols y candidatos de conflicto exponen ya `identityKey`, y el foco del repo pasa a `B280`.