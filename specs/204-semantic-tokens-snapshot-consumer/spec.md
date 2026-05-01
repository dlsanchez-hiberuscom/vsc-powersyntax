# Spec 204 - SemanticTokens snapshot consumer (B151A)

## 1. Resumen

Mover `semanticTokens` para que coloree declaraciones y usos a partir del snapshot publicado en lugar de consumir `DocumentAnalysis` directo.

## 2. Problema

Era la última feature core explícita de `B151A` que seguia leyendo facts, scopes y texto enmascarado desde `DocumentAnalysis`, manteniendo una vía paralela respecto al snapshot canónico.

## 3. Objetivo

Cerrar la migración snapshot-first de `semanticTokens` con el menor cambio capaz de mantener el comportamiento visible actual.

## 4. Alcance

- usar `snapshot.symbols` para declaraciones semánticas publicadas;
- usar `snapshot.scopes` para parámetros y locales;
- usar `snapshot.maskedText.lines` para escanear usos;
- validar con la suite unitaria focalizada de `semanticTokens`.

## 5. Fuera de alcance

- añadir nuevos tipos de token o modificar la leyenda;
- enriquecer todavía el snapshot con spans adicionales si no hacen falta para la suite actual;
- cerrar automáticamente toda la épica `B151A` sin revisión documental.

## 6. Requisitos

- R1. El comportamiento visible de coloreado debe mantenerse.
- R2. La feature debe leer su estado desde el snapshot publicado.
- R3. La validación debe ser ejecutable y centrada en `semanticTokens`.

## 7. Criterios de aceptacion

- AC1. `provideSemanticTokens()` usa `snapshot.symbols`, `snapshot.scopes` y `snapshot.maskedText.lines`.
- AC2. La suite unitaria focalizada de `semanticTokens` sigue verde.
- AC3. `B151A` queda sin features core pendientes de migración snapshot-first.

## 8. Riesgos y notas

- Si apareciera una regresión por granularidad insuficiente de `snapshot.symbols`, la siguiente slice deberá ampliar el modelo publicado en lugar de reintroducir lectura directa de `DocumentAnalysis`.
- Documentacion a revisar al cerrar el bloque: `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md`, `docs/done-log.md`.