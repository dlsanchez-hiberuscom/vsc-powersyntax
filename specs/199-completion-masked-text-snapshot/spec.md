# Spec 199 - Completion masked text snapshot consumer (B151A)

## 1. Resumen

Hacer que `completion` lea el contexto textual inmediato desde `snapshot.maskedText` en lugar de depender de `DocumentAnalysis` directo.

## 2. Problema

Tras `Spec 198`, `documentSymbols` ya dejó de tirar de `DocumentAnalysis` como fuente primaria, pero `completion` seguia leyendo `strippedLines` y `masks` desde esa estructura aunque el snapshot publicado ya contiene exactamente ese modelo en `maskedText`.

## 3. Objetivo

Cerrar otra slice de `B151A` con un cambio pequeño: mover el consumo textual de `completion` al snapshot canónico.

## 4. Alcance

- leer la línea activa desde `snapshot.maskedText.lines`;
- leer la máscara de comentarios/strings desde `snapshot.maskedText.masks`;
- validar la feature con la suite unitaria existente de `completion`.

## 5. Fuera de alcance

- cambiar el ranking o el contenido de sugerencias;
- migrar todavía `signatureHelp`, `semanticTokens` o `diagnostics`;
- cerrar toda la épica `B151A`.

## 6. Requisitos

- R1. El comportamiento visible de completion debe mantenerse.
- R2. La fuente textual debe ser el snapshot publicado, no una recomposición paralela.
- R3. La validación debe ser ejecutable y focalizada en `completion`.

## 7. Criterios de aceptacion

- AC1. `provideCompletion()` usa `snapshot.maskedText.lines` para derivar el prefijo actual.
- AC2. `provideCompletion()` usa `snapshot.maskedText.masks` para bloquear completion en comentarios/strings.
- AC3. La suite unitaria de `completion` sigue verde.
- AC4. `B151A` queda reducido para seguir con `semanticTokens`, `signatureHelp` y `diagnostics`.

## 8. Riesgos y notas

- Esta slice no altera resolución semántica ni ranking; solo cambia la fuente textual inmediata hacia el snapshot canónico.
- Documentacion a revisar al cerrar el bloque: `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md`, `docs/done-log.md`.