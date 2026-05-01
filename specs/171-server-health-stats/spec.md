# Spec 171 - Snapshot ampliado de salud interna del servidor (B176, B107)

## 1. Resumen

Ampliar powerbuilder.showStats con readiness, indexer, caches, projectModel, persistence y lastQueryTrace para inspeccion interna del motor.

## 2. Problema

La superficie de stats seguia siendo demasiado corta para explicar el estado real del runtime tras introducir persistencia y serving cache.

## 3. Objetivo

Consolidar una vista interna util del estado del motor sin abrir aun una API publica pesada.

## 4. Alcance

- Incluir readiness e indexer en showStats.
- Incluir caches de analysis, serving, documents y hot context.
- Incluir persistence y lastQueryTrace.
- Mantener la salida como snapshot interno ligero.

## 5. Fuera de alcance

- Health checker formal.
- Alertas automaticas.
- API publica completa para terceros.

## 6. Requisitos

- R1. El cambio debe materializar una mejora pequena, verificable y coherente con el runtime actual.
- R2. La implementacion no debe introducir estado incierto ni duplicar logica semantica ya existente.
- R3. Deben existir tests o validaciones ejecutables del area tocada.
- R4. La trazabilidad documental debe quedar alineada con B176, B107.

## 7. Criterios de aceptacion

- AC1. La capacidad descrita por esta spec existe en codigo del producto.
- AC2. El baseline de validacion del repositorio queda en verde tras el cambio.
- AC3. El comportamiento nuevo queda cubierto por tests o por wiring verificable del runtime.
- AC4. Backlog, current focus y done-log reflejan el avance real cuando aplique.

## 8. Riesgos y notas

- El valor de esta slice depende de mantener cambios pequenos y facilmente reversibles.
- Si la compatibilidad falla, el runtime debe degradar o reconstruir en lugar de servir estado dudoso.
- Documentacion a revisar: docs/architecture.md, docs/backlog.md, docs/done-log.md.
