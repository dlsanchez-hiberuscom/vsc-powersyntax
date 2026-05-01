# Spec 165 - ServingCache para definition (B160)

## 1. Resumen

Aplicar ServingCache al handler de definition con clave semantica estable por posicion y version de KnowledgeBase.

## 2. Problema

Definition seguia resolviendose siempre en caliente aunque la misma consulta se repitiera sobre la misma version de KB.

## 3. Objetivo

Bajar latencia repetida de definition con invalidacion coherente por URI y version.

## 4. Alcance

- Construir clave de serving para definition.
- Leer hits antes de resolver.
- Guardar misses resueltos.
- Medir el camino con la misma instrumentacion existente.

## 5. Fuera de alcance

- Persistencia cross-session.
- Confidence gates.
- References cache.

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
