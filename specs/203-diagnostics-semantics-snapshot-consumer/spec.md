# Spec 203 - Diagnostics semantics snapshot consumer (B151A)

## 1. Resumen

Mover `validateSemantics()` y la comprobación de flujo huérfano para que consuman `symbols`, `scopes`, `controlBlocks`, `sections` y texto enmascarado desde el snapshot publicado.

## 2. Problema

Tras las slices previas de `diagnostics`, la parte semántica principal seguia leyendo `semanticFacts`, `scopes`, `sections`, `controlBlocks` y `strippedLines` desde `DocumentAnalysis`, manteniendo abierta duplicidad en el hot path diagnóstico.

## 3. Objetivo

Reducir de forma sustancial la deuda restante de `diagnostics` dentro de `B151A` consumiendo el snapshot semántico canónico.

## 4. Alcance

- usar `snapshot.symbols` como facts semánticos publicados;
- usar `snapshot.scopes` y `snapshot.controlBlocks`;
- usar `snapshot.containerModel.sections`;
- usar `snapshot.maskedText.lines` para los recorridos léxicos.

## 5. Fuera de alcance

- cambiar el catálogo de reglas SD2-SD10;
- introducir nuevos diagnósticos;
- cerrar todavía `semanticTokens` o la épica completa `B151A`.

## 6. Requisitos

- R1. Las reglas semánticas existentes deben mantener su comportamiento visible.
- R2. La ruta debe apoyarse solo en datos publicados por el snapshot.
- R3. La validación debe ser ejecutable y centrada en `diagnostics`.

## 7. Criterios de aceptacion

- AC1. `validateSemantics()` usa `snapshot.symbols`, `snapshot.scopes`, `snapshot.controlBlocks` y `snapshot.containerModel.sections`.
- AC2. `checkOrphanedFlowKeywords()` usa el snapshot en lugar de `DocumentAnalysis`.
- AC3. La suite unitaria de `diagnostics` sigue verde.

## 8. Riesgos y notas

- Esta slice sigue apoyándose en que el texto enmascarado preserve offsets y estructura suficiente para las heurísticas léxicas.
- Documentacion a revisar al cerrar el bloque: `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md`, `docs/done-log.md`.