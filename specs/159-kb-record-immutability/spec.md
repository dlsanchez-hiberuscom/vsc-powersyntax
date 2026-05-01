# Spec 159 - Inmutabilidad defensiva de registros de KnowledgeBase (B174)

## 1. Resumen

Aplicar copias defensivas al export y restore de registros documentales de KnowledgeBase para evitar mutaciones compartidas.

## 2. Problema

Los snapshots exportados podian compartir referencias vivas y abrir la puerta a corrupcion accidental de estado publicado.

## 3. Objetivo

Tratar los registros persistibles de la KB como payloads inmutables y desacoplados.

## 4. Alcance

- Clonar datos al exportar registros.
- Clonar datos al restaurar registros.
- Cubrir desacoplamiento con tests.
- Mantener el contrato compatible con cacheStore.

## 5. Fuera de alcance

- Freeze profundo global del motor.
- Confidence gates.
- Persistencia de serving.

## 6. Requisitos

- R1. El cambio debe materializar una mejora pequena, verificable y coherente con el runtime actual.
- R2. La implementacion no debe introducir estado incierto ni duplicar logica semantica ya existente.
- R3. Deben existir tests o validaciones ejecutables del area tocada.
- R4. La trazabilidad documental debe quedar alineada con B174.

## 7. Criterios de aceptacion

- AC1. La capacidad descrita por esta spec existe en codigo del producto.
- AC2. El baseline de validacion del repositorio queda en verde tras el cambio.
- AC3. El comportamiento nuevo queda cubierto por tests o por wiring verificable del runtime.
- AC4. Backlog, current focus y done-log reflejan el avance real cuando aplique.

## 8. Riesgos y notas

- El valor de esta slice depende de mantener cambios pequenos y facilmente reversibles.
- Si la compatibilidad falla, el runtime debe degradar o reconstruir en lugar de servir estado dudoso.
- Documentacion a revisar: docs/backlog.md, docs/done-log.md.
