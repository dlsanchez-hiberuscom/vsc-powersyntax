# Spec 434 — BL-07 LSP guards realistic markers

## Estado

- done

## Relación backlog

- Backlog item: `BL-07 — Guards LSP con markers reales minimalistas`

## Objetivo

Sustituir los fixtures sintéticos de `lsp-guards` por markers PowerBuilder plausibles y minimalistas para `.pbw`, `.pbt`, `.pbproj`, `.pbsln` y `.pbl`, manteniendo la smoke de no-serving y la compatibilidad con discovery/topología.

## Resultado esperado

- los fixtures de `test/fixtures/lsp-guards` dejan de contener PowerScript disfrazado;
- el parser de topología puede consumir el shape mínimo de los markers textuales usados por la smoke;
- la smoke `lsp-guards` sigue probando ausencia de diagnostics/providers semánticos aunque se fuerce el lenguaje.

## Validación mínima esperada

- `npx tsc -p tsconfig.test.json`
- `npx mocha --ui tdd out/test/server/unit/topology.test.js`
- `npm run test:smoke -- --grep "lsp-guards"`
- `npm run test:docs:drift`

## Validación ejecutada

- `npx tsc -p tsconfig.test.json`
- `npx mocha --ui tdd out/test/server/unit/topology.test.js`
- `npm run test:smoke -- --grep "lsp-guards"`
- `npm run test:docs:drift`

## Fuera de alcance

- tocar el guard central `isPowerBuilderSemanticUri()`;
- ampliar parsing topológico más allá del subset ya soportado;
- abrir serving o UX nueva sobre markers.