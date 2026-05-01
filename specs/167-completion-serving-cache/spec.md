# Spec 167 - ServingCache para completion (B160)

## 1. Resumen

Aplicar ServingCache a completion incluyendo triggerKind y triggerCharacter en la clave para estabilizar hits seguros.

## 2. Problema

Completion se recalculaba desde cero aun cuando la posicion, el trigger y la KB no habian cambiado.

## 3. Objetivo

Aprovechar el cache de serving tambien en completion sin romper invalidacion ni contexto.

## 4. Alcance

- Construir clave con feature, posicion y kbVersion.
- Anadir triggerKind y triggerCharacter a la clave.
- Leer cache antes de resolver.
- Guardar el resultado del serving interactivo.

## 5. Fuera de alcance

- Persistencia de completions.
- Confidence gates.
- Ranking avanzado.

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
- Documentacion a revisar: docs/backlog.md, docs/done-log.md.
