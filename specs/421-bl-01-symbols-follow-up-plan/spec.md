# Spec 421 — SYM-01 Symbols follow-up plan

## Estado

- done

## Relación backlog

- Backlog item: `SYM-01 — Plan de mejora de symbols, references y rename`

## Objetivo

Dejar priorizado el siguiente slice P1 de symbols/references/rename tras estabilizar el tramo VSIX/docs.

## Resultado esperado

- mapa de gaps reales respaldado por evidencia actual;
- primer slice fino elegido;
- validación focal y no-go cases explícitos antes de implementar.

## Validación mínima esperada

- `npm run test:docs:drift`

## Fuera de alcance

- tocar runtime interactivo sin un slice defendible;
- abrir varias sublíneas de symbols a la vez.

## Cierre registrado

- el primer slice elegido queda acotado a **coherencia project-scoped de symbols/references/rename en mixed roots**, apoyándose en `referenceSourcePool`, `workspaceSymbols`, `crossProjectSymbolConflicts` y los fences de `sourceOrigin` ya existentes;
- los no-go explícitos del siguiente corte son: no widening a `workspace` sin routing de proyecto, no rename sobre `orca-staging/generated`, y no apertura de edición cuando la evidencia siga en `dynamic|fallback|external|source-origin-conflict`;
- la validación focal futura queda definida sobre `referenceSourcePool`, `references`, `rename`, `workspaceSymbols`, `crossProjectSymbolConflicts` y el guard de hot path antes de tocar runtime interactivo.

## Validación ejecutada

- `npm run test:docs:drift`
