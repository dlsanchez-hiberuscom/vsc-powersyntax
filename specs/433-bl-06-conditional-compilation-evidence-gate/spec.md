# Spec 433 — BL-06 Conditional compilation evidence gate

## Estado

- done

## Relación backlog

- Backlog item: `BL-06 — Gate de evidencia para conditional compilation`

## Objetivo

Mantener una policy explícita de no-soporte productivo para conditional compilation mientras no exista corpus activo defendible, añadiendo un detector read-only de marcadores activos fuera de comentarios y tests sentinel reutilizables.

## Resultado esperado

- existe un detector puro para `#IF/#ELSEIF/#ELSE/#END IF/#define` y variantes `$if/$elseif/$else/$end if` fuera de comentarios;
- el detector ignora pseudo-marcadores históricos dentro de comentarios;
- la documentación canónica deja claro que esto es un gate de evidencia y no soporte de parser/semántica.

## Validación mínima esperada

- `npx tsc -p tsconfig.test.json`
- `npx mocha --ui tdd out/test/server/unit/conditionalCompilationGate.test.js out/test/server/unit/powerbuilderParserResilienceFuzz.test.js`
- `npm run test:docs:drift`

## Validación ejecutada

- `npx tsc -p tsconfig.test.json`
- `npx mocha --ui tdd out/test/server/unit/conditionalCompilationGate.test.js out/test/server/unit/powerbuilderParserResilienceFuzz.test.js`
- `npm run test:docs:drift`

## Fuera de alcance

- interpretar ramas activas/inactivas de preprocesador;
- alterar `logicalStatements`, scopes o diagnostics para “soportar” directivas condicionales;
- introducir gramática nueva sin corpus real defendible.