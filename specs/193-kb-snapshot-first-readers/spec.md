# Spec 193 - KB snapshot-first readers (B151)

## 1. Resumen

Hacer que los readers documentales de `KnowledgeBase` sirvan `symbols` y `scopes` desde el snapshot publicado cuando exista.

## 2. Problema

El snapshot semantico canónico ya se publica por documento, pero `getEntitiesByUri()` y `getScopeAt()` seguian leyendo indices paralelos. Eso mantenia abierto el gap entre el contrato de `SemanticDocumentSnapshot` y el consumo real del hot path.

## 3. Objetivo

Reducir `B151` en la frontera mas pequeña y reusable: que el acceso documental de `KnowledgeBase` sea snapshot-first.

## 4. Alcance

- Priorizar `documentSnapshots` en `getEntitiesByUri()`.
- Priorizar `documentSnapshots` en `getScopeAt()`.
- Cubrir el comportamiento snapshot-first con tests unitarios de `KnowledgeBase`.

## 5. Fuera de alcance

- Migrar todavia todas las features core a snapshot-first end-to-end.
- Cambiar el contrato completo de `DocumentAnalysis`.
- Cerrar por si sola toda la deuda restante de `B151`.

## 6. Requisitos

- R1. El cambio debe ser pequeno, local y reversible.
- R2. No puede romper el fallback legacy cuando un documento aun no tenga snapshot publicado.
- R3. La validacion debe ser ejecutable y centrada en `KnowledgeBase`.

## 7. Criterios de aceptacion

- AC1. `KnowledgeBase` sirve entidades documentales desde `snapshot.symbols` cuando existe snapshot publicado.
- AC2. `KnowledgeBase` resuelve scopes documentales desde `snapshot.scopes` cuando existe snapshot publicado.
- AC3. El comportamiento queda cubierto por tests unitarios focalizados.
- AC4. `B151` queda reducido explicitamente al consumo snapshot-first end-to-end pendiente en features core.

## 8. Riesgos y notas

- Este slice no cierra `B151` mientras features como `completion`, `signatureHelp`, `documentSymbols`, `semanticTokens` o `diagnostics` sigan recomponiendo datos fuera del snapshot.
- Documentacion a revisar: `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md`, `docs/done-log.md`.