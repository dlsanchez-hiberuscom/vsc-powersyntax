# Plan - Spec 198 DocumentSymbols snapshot-first consumer (B151A)

## 1. Resumen tecnico

Mover `documentSymbols` a una lectura snapshot-first para que la outline deje de recomponer estructura directamente desde `DocumentAnalysis`.

## 2. Estado actual

- `Spec 193` ya habia hecho snapshot-first el boundary documental de `KnowledgeBase`.
- `documentSymbols` seguia leyendo `lines`, `sections` y parsing auxiliar desde `DocumentAnalysis`.

## 3. Diseno propuesto

- Derivar secciones desde `snapshot.containerModel.sections`.
- Derivar tipos desde `snapshot.containerModel.typeBlocks` y facts publicados.
- Derivar callables desde `snapshot.symbols` y `snapshot.scopes`.

## 4. Impacto en el runtime

- Cierra la primera slice visible de `B151A`.
- Elimina una fuente semantica paralela en Outline/CodeLens.

## 5. Riesgos tecnicos

- Perder nesting visible de tipos y callables.
- Seguir reconstruyendo la shape LSP desde una fuente distinta al snapshot publicado.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/documentSymbols"`
- `npm run compile`
- `npm run test:unit`

## 7. Documentacion a actualizar

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/roadmap.md`