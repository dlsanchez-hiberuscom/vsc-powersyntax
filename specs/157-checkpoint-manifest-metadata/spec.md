# Spec 157 - Metadata y manifiesto de checkpoint (B168)

## 1. Resumen

Endurecer el checkpoint con metadata explicita de schema, roots y estadisticas para decidir reuse o rebuild de forma verificable.

## 2. Problema

El formato anterior aceptaba demasiado y no explicaba con claridad por que un checkpoint era reutilizable o no.

## 3. Objetivo

Modelar metadata suficiente para validar compatibilidad antes de restaurar estado.

## 4. Alcance

- Anadir metadata al schema persistente.
- Normalizar roots y estadisticas del checkpoint.
- Decidir reuse o rebuild de forma explicita.
- Cubrir el contrato con tests de compatibilidad.

## 5. Fuera de alcance

- Migraciones automaticas complejas.
- Particionado por proyecto.
- Health checks profundos.

## 6. Requisitos

- R1. El cambio debe materializar una mejora pequena, verificable y coherente con el runtime actual.
- R2. La implementacion no debe introducir estado incierto ni duplicar logica semantica ya existente.
- R3. Deben existir tests o validaciones ejecutables del area tocada.
- R4. La trazabilidad documental debe quedar alineada con B168.

## 7. Criterios de aceptacion

- AC1. La capacidad descrita por esta spec existe en codigo del producto.
- AC2. El baseline de validacion del repositorio queda en verde tras el cambio.
- AC3. El comportamiento nuevo queda cubierto por tests o por wiring verificable del runtime.
- AC4. Backlog, current focus y done-log reflejan el avance real cuando aplique.

## 8. Riesgos y notas

- El valor de esta slice depende de mantener cambios pequenos y facilmente reversibles.
- Si la compatibilidad falla, el runtime debe degradar o reconstruir en lugar de servir estado dudoso.
- Documentacion a revisar: docs/architecture.md, docs/backlog.md, docs/done-log.md.
