# Spec 254 - Modelo interno sin DTOs LSP en knowledge/parsing (B228)

**Estado:** cerrada y validada.

## 1. Resumen

Eliminar `DocumentSymbol`, `Range`, `Position`, `SymbolKind` y DTOs afines de `knowledge`, `parsing` y utilidades puras, sustituyéndolos por tipos internos y mappers de borde.

## 2. Estado real actual

- `src/server/knowledge/types.ts` sigue exponiendo `DocumentSymbol[]` en `DocumentCacheEntry`.
- `src/server/parsing/sections.ts` y `src/server/utils/helpers.ts` construyen `DocumentSymbol` directamente con tipos LSP.
- `src/server/features/documentSymbols.ts` consume esa estructura interna ya contaminada, en vez de mapear desde un modelo propio.

## 3. Objetivo

Hacer que `knowledge/parsing/utils` trabajen con tipos internos puros y que el transporte LSP quede solo en features/adapters.

## 4. Alcance

- introducir tipos internos para posiciones/rangos/símbolos documentales;
- migrar `knowledge.types`, `stringInterning`, `parsing.sections` y `utils.helpers` a esos tipos;
- mapear a `DocumentSymbol` solo en `features/documentSymbols` o adaptadores equivalentes;
- añadir guardrail de tests para evitar que vuelvan imports LSP al core afectado.

## 5. Fuera de alcance

- reescribir todo el pipeline de hover/definition/references;
- rediseñar la semántica de símbolos o ranges;
- tocar features que ya son borde LSP legítimo.

## 6. Criterios de aceptacion

- AC1. `knowledge`, `parsing` y utilidades puras afectadas ya no importan `vscode-languageserver`.
- AC2. `documentSymbols` visible sigue funcionando desde mappers de borde.
- AC3. Existe un test arquitectónico que bloquee reintroducciones del acoplamiento.
- AC4. Docs canónicas reflejan el guardrail.

## 7. Documentacion afectada

- `docs/architecture.md`
- `docs/spec-driven-development.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`

## 8. Validacion requerida

- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/documentSymbols.test.js out/test/server/unit/architectureImports.test.js`

## 9. Resultado de cierre

- `knowledge/parsing/utils` afectados ya no importan `vscode-languageserver`; usan tipos internos para posiciones, rangos y símbolos documentales;
- `features/documentSymbols` asume el mapper de borde hacia `DocumentSymbol` y mantiene verde la salida visible del outline;
- `test/server/unit/architectureImports.test.ts` deja bloqueada la reintroducción del acoplamiento en el core afectado;
- la validación ejecutada fue `npm run build:test` más `npx mocha --ui tdd out/test/server/unit/documentSymbols.test.js out/test/server/unit/architectureImports.test.js`.