# Spec 169 - Superficie de query trace en el hot path (B157)

## 1. Resumen

Retener la ultima traza de resolucion y exponerla desde el motor para observabilidad y debugging del winner path.

## 2. Problema

Existian trazas internas puntuales, pero no una superficie clara para inspeccionar la ultima resolucion ejecutada.

## 3. Objetivo

Hacer observable la evidencia de resolucion sin contaminar el contrato de features visibles.

## 4. Alcance

- Guardar la ultima traza capturada.
- Exponer getLastTrace.
- Usar etiquetas de trace por feature.
- Cubrir la superficie con tests unitarios.

## 5. Fuera de alcance

- UI de inspeccion completa.
- Persistencia de work journal.
- Repro packs automaticos.

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
- Documentacion a revisar: docs/architecture.md, docs/backlog.md, docs/done-log.md.
