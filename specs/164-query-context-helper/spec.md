# Spec 164 - Helper comun de contexto de query (B156)

## 1. Resumen

Extraer un helper compartido para construir InvocationContext y resolver targets documentales desde hover y definition.

## 2. Problema

Las features repetian logica de obtencion de contexto y resolucion semantica sobre el mismo documento.

## 3. Objetivo

Reducir divergencia entre features que preguntan lo mismo al motor semantico.

## 4. Alcance

- Crear resolveDocumentQueryTargets.
- Reutilizar el helper en hover.
- Reutilizar el helper en definition.
- Mantener la capa de conocimiento libre de dependencias de VS Code.

## 5. Fuera de alcance

- References unificadas.
- Rename seguro.
- Confidence gates.

## 6. Requisitos

- R1. El cambio debe materializar una mejora pequena, verificable y coherente con el runtime actual.
- R2. La implementacion no debe introducir estado incierto ni duplicar logica semantica ya existente.
- R3. Deben existir tests o validaciones ejecutables del area tocada.
- R4. La trazabilidad documental debe quedar alineada con B156.

## 7. Criterios de aceptacion

- AC1. La capacidad descrita por esta spec existe en codigo del producto.
- AC2. El baseline de validacion del repositorio queda en verde tras el cambio.
- AC3. El comportamiento nuevo queda cubierto por tests o por wiring verificable del runtime.
- AC4. Backlog, current focus y done-log reflejan el avance real cuando aplique.

## 8. Riesgos y notas

- El valor de esta slice depende de mantener cambios pequenos y facilmente reversibles.
- Si la compatibilidad falla, el runtime debe degradar o reconstruir en lugar de servir estado dudoso.
- Documentacion a revisar: docs/backlog.md, docs/done-log.md.
