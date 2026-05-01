# Spec 163 - Persistencia de checkpoint al alcanzar readiness estable (B071)

## 1. Resumen

Persistir checkpoints solo al final de una indexacion lista y no degradada para evitar snapshots provisionales.

## 2. Problema

Persistir demasiado pronto fijaria estados a medias y degradados como si fueran material reutilizable.

## 3. Objetivo

Amarrar la escritura del checkpoint a un punto de estabilidad explicito del runtime.

## 4. Alcance

- Persistir solo tras indexacion ready.
- Evitar persistir estados degradados.
- Limpiar journal tras checkpoint estable.
- Reflejar el lifecycle en tests del store.

## 5. Fuera de alcance

- Persistencia incremental por proyecto.
- Health checks de consistencia.
- Warm query cache.

## 6. Requisitos

- R1. El cambio debe materializar una mejora pequena, verificable y coherente con el runtime actual.
- R2. La implementacion no debe introducir estado incierto ni duplicar logica semantica ya existente.
- R3. Deben existir tests o validaciones ejecutables del area tocada.
- R4. La trazabilidad documental debe quedar alineada con B071.

## 7. Criterios de aceptacion

- AC1. La capacidad descrita por esta spec existe en codigo del producto.
- AC2. El baseline de validacion del repositorio queda en verde tras el cambio.
- AC3. El comportamiento nuevo queda cubierto por tests o por wiring verificable del runtime.
- AC4. Backlog, current focus y done-log reflejan el avance real cuando aplique.

## 8. Riesgos y notas

- El valor de esta slice depende de mantener cambios pequenos y facilmente reversibles.
- Si la compatibilidad falla, el runtime debe degradar o reconstruir en lugar de servir estado dudoso.
- Documentacion a revisar: docs/current-focus.md, docs/testing.md, docs/done-log.md.
