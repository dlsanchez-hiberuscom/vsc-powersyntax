# Spec 158 - Validacion estricta del journal y rebuild seguro (B168)

## 1. Resumen

Validar secuencias del journal y forzar rebuild limpio cuando schema, metadata o secuencia resultan incompatibles.

## 2. Problema

Un journal inconsistente podia contaminar el restore y dejar el runtime en un estado ambiguo.

## 3. Objetivo

Hacer que cualquier corrupcion o incompatibilidad derive en descarte seguro, no en replay optimista.

## 4. Alcance

- Validar secuencias duplicadas o fuera de orden.
- Detectar incompatibilidades de roots y schema.
- Resolver restore como reuse o rebuild.
- Anadir tests de escenarios invalidos.

## 5. Fuera de alcance

- Transacciones distribuidas.
- Migraciones entre formatos mayores.
- Persistencia de queries.

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
- Documentacion a revisar: docs/testing.md, docs/backlog.md, docs/done-log.md.
