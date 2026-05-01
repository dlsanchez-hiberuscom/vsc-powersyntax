# Spec 200 - SignatureHelp masked text snapshot consumer (B151A)

## 1. Resumen

Mover `signatureHelp` para que extraiga el contexto de invocación desde `snapshot.maskedText` en lugar de leer directamente `DocumentAnalysis`.

## 2. Problema

`signatureHelp` seguia escaneando `lines`, `strippedLines` y `masks` desde `DocumentAnalysis`, aunque el snapshot publicado ya contiene la vista textual enmascarada suficiente para encontrar paréntesis, comas e identificadores relevantes.

## 3. Objetivo

Cerrar otra slice pequeña de `B151A` consumiendo el snapshot canónico en la extracción del contexto de firma.

## 4. Alcance

- usar `snapshot.maskedText.lines` en la búsqueda hacia atrás del `(` activo;
- usar `snapshot.maskedText.masks` para ignorar strings y comentarios;
- mantener intacta la resolución posterior contra `SystemCatalog` y `KnowledgeBase`.

## 5. Fuera de alcance

- cambiar sobrecargas o ranking de firmas;
- migrar todavía `semanticTokens` o `diagnostics`;
- cerrar toda la épica `B151A`.

## 6. Requisitos

- R1. La extracción del contexto debe seguir ignorando comentarios y strings.
- R2. La resolución semántica no debe cambiar en esta slice.
- R3. La validación debe ser ejecutable y centrada en `signatureHelp`.

## 7. Criterios de aceptacion

- AC1. `extractSignatureContext()` usa `snapshot.maskedText.lines` y `snapshot.maskedText.masks`.
- AC2. Las firmas visibles y el `activeParameter` se mantienen correctos en la suite unitaria.
- AC3. `B151A` queda reducido para seguir con `semanticTokens` y `diagnostics`.

## 8. Riesgos y notas

- La línea enmascarada debe preservar offsets; esta slice asume el contrato ya usado por el resto del snapshot textual.
- Documentacion a revisar al cerrar el bloque: `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md`, `docs/done-log.md`.