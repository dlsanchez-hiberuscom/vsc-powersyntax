# Spec 168 - Consumo real de HotContextCache en serving (B160)

## 1. Resumen

Usar HotContextCache para activeEntities e inheritedMembers dentro del hot path de hover, definition, signatureHelp y completion.

## 2. Problema

La cache caliente existia pero no alimentaba de forma consistente a todas las features interactivas.

## 3. Objetivo

Convertir HotContextCache en una aceleracion real del documento activo y de los members mas repetidos.

## 4. Alcance

- Activar hot context al entrar en handlers interactivos.
- Reutilizar activeEntities cacheadas.
- Reutilizar inheritedMembers por tipo.
- Cubrir el consumo real con tests de completion.

## 5. Fuera de alcance

- Precomputed closures globales.
- Persistencia de hot cache.
- References optimizadas.

## 6. Requisitos

- R1. El cambio debe materializar una mejora pequena, verificable y coherente con el runtime actual.
- R2. La implementacion no debe introducir estado incierto ni duplicar logica semantica ya existente.
- R3. Deben existir tests o validaciones ejecutables del area tocada.
- R4. La trazabilidad documental debe quedar alineada con B160.

## 7. Criterios de aceptacion

- AC1. La capacidad descrita por esta spec existe en codigo del producto.
- AC2. El baseline de validacion del repositorio queda en verde tras el cambio.
- AC3. El comportamiento nuevo queda cubierto por tests o por wiring verificable del runtime.
- AC4. Backlog, current focus y done-log reflejan el avance real cuando aplique.

## 8. Riesgos y notas

- El valor de esta slice depende de mantener cambios pequenos y facilmente reversibles.
- Si la compatibilidad falla, el runtime debe degradar o reconstruir en lugar de servir estado dudoso.
- Documentacion a revisar: docs/architecture.md, docs/backlog.md, docs/done-log.md.
