# Spec 194 - KB atomic document readers (B165)

## 1. Resumen

Endurecer la validacion de publicacion atomica de `KnowledgeBase` para cubrir tambien las lecturas documentales publicadas.

## 2. Problema

La base de staging y publish atomico ya existia, pero la prueba visible solo cubria `findDefinition()`. Faltaba demostrar que `getEntitiesByUri()`, `getScopeAt()` y `getDocumentSnapshot()` tampoco exponen estado staged o mezclas parciales.

## 3. Objetivo

Cerrar `B165` con evidencia ejecutable sobre las superficies documentales que consumen las features interactivas.

## 4. Alcance

- Extender los tests de `KnowledgeBase` para cubrir entidades, scopes y snapshot durante batch update.
- Verificar que antes del commit no se publica estado staged.
- Verificar que tras el commit todo el estado aparece de forma coherente en el mismo publish.

## 5. Fuera de alcance

- Cambiar el protocolo de publish del runtime.
- Introducir caches nuevas de serving.
- Cerrar otros items de incrementalidad fina.

## 6. Requisitos

- R1. La validacion debe cubrir surfaces documentales y no solo simbolos globales.
- R2. El cambio no debe ampliar superficie funcional ni tocar features ajenas.
- R3. Debe mantenerse el contrato de rollback existente.

## 7. Criterios de aceptacion

- AC1. Antes de `commitBatchUpdate()`, `findDefinition()`, `getEntitiesByUri()`, `getScopeAt()` y `getDocumentSnapshot()` siguen viendo el estado publicado anterior.
- AC2. Tras `commitBatchUpdate()`, esas lecturas ven el nuevo estado de manera coherente en el mismo publish.
- AC3. `rollbackBatchUpdate()` sigue descartando el estado staged.
- AC4. `B165` puede pasar a `Done` con validacion ejecutable del area tocada.

## 8. Riesgos y notas

- Esta spec cierra `B165`, pero no sustituye la necesidad de seguir endureciendo inmutabilidad (`B174`) y adopcion snapshot-first completa (`B151`).
- Documentacion a revisar: `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md`, `docs/done-log.md`.