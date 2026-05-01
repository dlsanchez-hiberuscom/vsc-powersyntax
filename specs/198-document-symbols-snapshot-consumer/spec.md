# Spec 198 - DocumentSymbols snapshot-first consumer (B151A)

## 1. Resumen

Mover `documentSymbols` a una lectura snapshot-first para que la outline deje de recomponer estructura directamente desde `DocumentAnalysis`.

## 2. Problema

`Spec 193` ya hizo snapshot-first a `KnowledgeBase`, pero `documentSymbols` seguia leyendo `lines`, `sections` y parsing auxiliar desde `DocumentAnalysis`. Eso mantenia abierta una duplicidad visible en una feature core de `B151A`.

## 3. Objetivo

Cerrar la primera slice visible de `B151A` haciendo que `documentSymbols` consuma `SemanticDocumentSnapshot` publicado.

## 4. Alcance

- derivar secciones desde `snapshot.containerModel.sections`;
- derivar tipos desde `snapshot.containerModel.typeBlocks` y facts publicados;
- derivar callables desde `snapshot.symbols` y `snapshot.scopes`;
- cubrir el contrato con test unitario focalizado.

## 5. Fuera de alcance

- migrar en esta spec `semanticTokens`, `diagnostics`, `completion` o `signatureHelp`;
- rehacer el parser estructural;
- cerrar por si sola toda la épica `B151A`.

## 6. Requisitos

- R1. El cambio debe reutilizar el snapshot ya publicado, no abrir otra fuente paralela.
- R2. Debe conservar el nesting de tipos y callables visible para Outline/CodeLens.
- R3. La validación debe ser ejecutable y centrada en la feature tocada.

## 7. Criterios de aceptacion

- AC1. `extractDocumentSymbols()` delega en el snapshot publicado del documento.
- AC2. Los tipos y callables visibles se reconstruyen desde `containerModel`, `symbols` y `scopes` del snapshot.
- AC3. Existe test unitario focalizado sobre la ruta snapshot-first.
- AC4. `B151A` queda reducido para seguir con `semanticTokens`, `diagnostics`, `completion` y `signatureHelp`.

## 8. Riesgos y notas

- El snapshot no guarda `DocumentSymbol` listo para servir; esta slice sigue reconstruyendo la shape LSP, pero ya no depende de `DocumentAnalysis` como fuente semántica primaria.
- Documentacion a revisar al cerrar la slice: `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md`, `docs/done-log.md`.