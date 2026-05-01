# Spec 156 - Clave estable de cache por workspace (B071A)

## 1. Resumen

Derivar una workspaceKey estable a partir de roots normalizados para que el storage persistente no dependa del orden de descubrimiento.

## 2. Problema

Sin una identidad estable del workspace, el resume podia fragmentarse o pisarse por orden accidental de roots.

## 3. Objetivo

Dar al store una clave reproducible y portable para checkpoints y journals del mismo workspace.

## 4. Alcance

- Normalizar roots antes de derivar la clave.
- Hacer la clave independiente del orden de entrada.
- Usar la clave en rutas de checkpoint y journal.
- Cubrir estabilidad con tests unitarios.

## 5. Fuera de alcance

- Particionado por proyecto.
- Shard fino por library.
- Cache de queries.

## 6. Requisitos

- R1. El cambio debe materializar una mejora pequena, verificable y coherente con el runtime actual.
- R2. La implementacion no debe introducir estado incierto ni duplicar logica semantica ya existente.
- R3. Deben existir tests o validaciones ejecutables del area tocada.
- R4. La trazabilidad documental debe quedar alineada con B071A.

## 7. Criterios de aceptacion

- AC1. La capacidad descrita por esta spec existe en codigo del producto.
- AC2. El baseline de validacion del repositorio queda en verde tras el cambio.
- AC3. El comportamiento nuevo queda cubierto por tests o por wiring verificable del runtime.
- AC4. Backlog, current focus y done-log reflejan el avance real cuando aplique.

## 8. Riesgos y notas

- El valor de esta slice depende de mantener cambios pequenos y facilmente reversibles.
- Si la compatibilidad falla, el runtime debe degradar o reconstruir en lugar de servir estado dudoso.
- Documentacion a revisar: docs/backlog.md, docs/done-log.md.
