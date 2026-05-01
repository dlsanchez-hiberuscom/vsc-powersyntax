# Spec 205 - Structural snapshot publish pass (B152A)

## 1. Resumen

Publicar un snapshot `structural-only` honesto antes de empezar el pase enriquecido del indexador.

## 2. Problema

El indexador ya separaba nominalmente `structural` y `enriched`, pero solo publicaba estado al final del enriquecimiento. Eso dejaba el primer pase sin valor visible y hacía falsa la existencia de un snapshot `structural-only` real.

## 3. Objetivo

Abrir el cierre real de `B152A` publicando un snapshot estructural previo y promoviéndolo después al enriquecido.

## 4. Alcance

- derivar un snapshot `structural-only` honesto desde el snapshot completo actual;
- publicarlo en `KnowledgeBase` al terminar el pase estructural;
- arrancar el pase enriquecido desde ese estado ya publicado;
- cubrir la transición con tests de `workspaceIndexer`.

## 5. Fuera de alcance

- abaratar todavía el coste del pase estructural;
- reescribir `analyzeDocument()` en esta spec;
- modelar aún `project-semantic-ready` o `workspace-semantic-ready`.

## 6. Requisitos

- R1. El snapshot estructural no debe fingir datos enriquecidos.
- R2. El snapshot enriquecido debe seguir promoviendo el documento a `nearby-semantic-ready`.
- R3. La validación debe demostrar la transición `structural -> enriched`.

## 7. Criterios de aceptacion

- AC1. Al terminar el pase estructural, `KnowledgeBase` ya expone `snapshot.pass = structural` y `readiness = structural-only`.
- AC2. Al terminar el pase enriquecido, el mismo documento queda promovido a `pass = enriched` y `readiness = nearby-semantic-ready`.
- AC3. La suite unitaria de `workspaceIndexer` cubre la transición.

## 8. Riesgos y notas

- Esta slice entrega publicación temprana honesta, pero no cierra todavía el requisito de que el pase estructural sea claramente más barato que el enriquecido.
- Documentacion a revisar al cerrar el bloque: `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md`, `docs/done-log.md`.