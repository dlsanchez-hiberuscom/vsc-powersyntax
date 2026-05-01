# Spec 166 - ServingCache para signature help (B160)

## 1. Resumen

Extender ServingCache a signatureHelp para reutilizar respuestas estables del mismo callsite y version semantica.

## 2. Problema

Signature help comparte mucha repeticion interactiva y aun no aprovechaba la cache de serving comun.

## 3. Objetivo

Homogeneizar la latencia de signature help con el resto del hot path.

## 4. Alcance

- Anadir clave de serving para signatureHelp.
- Reutilizar resultados cacheados.
- Persistir resultados calculados en caliente.
- Mantener invalidacion por URI ya existente.

## 5. Fuera de alcance

- Persistencia cross-session.
- Score por confianza.
- Telemetry avanzada.

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
