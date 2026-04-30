# Spec 056 — Document model logical lines (B135)

## Motivación
Combinar `splitStatements` + `scanSections` + `parseSrContainer` en un
modelo estable consumido por features. Reduce duplicación.

## Alcance
- `src/server/parsing/documentModel.ts`:
  - `buildDocumentModel(content): { statements, sections, container }`.
- Tests de smoke.

## Criterios
1. statements length > 0 para fuente con líneas.
2. container con `globalType` para forward declaration.
