# Plan - Spec 254 Modelo interno sin DTOs LSP en knowledge/parsing (B228)

## 1. Enfoque tecnico

Resolver `B228` con un primer corte estructural sobre `DocumentSymbol` y tipos de posición/rango, porque hoy es la filtración más clara desde `knowledge/parsing/utils` hacia LSP.

## 2. Pasos

1. Definir tipos internos para posiciones/rangos/símbolos documentales.
2. Migrar helpers, parsing y cache interna a esos tipos.
3. Mapear a LSP solo en `features/documentSymbols`.
4. Añadir test arquitectónico que bloquee imports `vscode-languageserver` en el core afectado.
5. Actualizar docs y cerrar `B228` si el guardrail queda materializado.

## 3. Riesgos

- romper `documentSymbols` visible al cambiar los tipos de árbol;
- dejar imports LSP residuales en utilidades supuestamente puras;
- abrir refactors más amplios de los necesarios.

## 4. Validacion

- unit de `documentSymbols`;
- test arquitectónico de imports;
- `npm run build:test` para asegurar que el tipado no se rompe al desacoplar.

## 5. Resultado ejecutado

1. Se definieron tipos internos para posiciones/rangos/símbolos documentales.
2. Se migró `knowledge/parsing/utils` al modelo interno para el eje `DocumentSymbol`.
3. `features/documentSymbols` pasó a mapear al DTO LSP solo en el borde.
4. Se añadió un test arquitectónico que bloquea imports LSP en el core afectado.