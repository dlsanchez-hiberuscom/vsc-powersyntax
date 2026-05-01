# Spec 172 - Contrato publico ampliado para stats del servidor (B109)

## 1. Resumen

Extender ApiServerStats para reflejar readiness, indexer, projectModel, persistence y lastQueryTrace del snapshot interno.

## 2. Problema

La API publica quedaba por detras del estado real expuesto por showStats y no podia describir la nueva observabilidad del motor.

## 3. Objetivo

Alinear el contrato publico con el snapshot real de stats manteniendo compatibilidad hacia delante.

## 4. Alcance

- Anadir campos opcionales de readiness e indexer.
- Anadir projectModel y persistence.
- Anadir lastQueryTrace resumido.
- Mantener compatibilidad por optional fields.

## 5. Fuera de alcance

- APIs externas de control remoto.
- Telemetry remota.
- Confidence gates por cliente.

## 6. Requisitos

- R1. El cambio debe materializar una mejora pequena, verificable y coherente con el runtime actual.
- R2. La implementacion no debe introducir estado incierto ni duplicar logica semantica ya existente.
- R3. Deben existir tests o validaciones ejecutables del area tocada.
- R4. La trazabilidad documental debe quedar alineada con B109.

## 7. Criterios de aceptacion

- AC1. La capacidad descrita por esta spec existe en codigo del producto.
- AC2. El baseline de validacion del repositorio queda en verde tras el cambio.
- AC3. El comportamiento nuevo queda cubierto por tests o por wiring verificable del runtime.
- AC4. Backlog, current focus y done-log reflejan el avance real cuando aplique.

## 8. Riesgos y notas

- El valor de esta slice depende de mantener cambios pequenos y facilmente reversibles.
- Si la compatibilidad falla, el runtime debe degradar o reconstruir en lugar de servir estado dudoso.
- Documentacion a revisar: docs/backlog.md, docs/done-log.md, docs/architecture.md.
