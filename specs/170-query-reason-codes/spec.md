# Spec 170 - Reason codes para ganadores semanticos (B157)

## 1. Resumen

Devolver reasonCodes junto a los targets detallados para explicar si una resolucion gano por scope local, jerarquia, qualifier o fallback global.

## 2. Problema

El motor podia devolver el target correcto, pero no formalizaba por que ese target habia ganado frente a otras rutas.

## 3. Objetivo

Dar una primera capa de evidencia estructurada reutilizable por stats, debugging y futuras confidence gates.

## 4. Alcance

- Modelar QueryReasonCode.
- Devolver reasonCodes desde resolveTargetEntityDetailed.
- Anotar winner paths principales.
- Validar reason codes con tests unitarios.

## 5. Fuera de alcance

- Confidence scores completos.
- Lineage de simbolos.
- Decisioning de rename.

## 6. Requisitos

- R1. El cambio debe materializar una mejora pequena, verificable y coherente con el runtime actual.
- R2. La implementacion no debe introducir estado incierto ni duplicar logica semantica ya existente.
- R3. Deben existir tests o validaciones ejecutables del area tocada.
- R4. La trazabilidad documental debe quedar alineada con B157.

## 7. Criterios de aceptacion

- AC1. La capacidad descrita por esta spec existe en codigo del producto.
- AC2. El baseline de validacion del repositorio queda en verde tras el cambio.
- AC3. El comportamiento nuevo queda cubierto por tests o por wiring verificable del runtime.
- AC4. Backlog, current focus y done-log reflejan el avance real cuando aplique.

## 8. Riesgos y notas

- El valor de esta slice depende de mantener cambios pequenos y facilmente reversibles.
- Si la compatibilidad falla, el runtime debe degradar o reconstruir en lugar de servir estado dudoso.
- Documentacion a revisar: docs/backlog.md, docs/done-log.md.
