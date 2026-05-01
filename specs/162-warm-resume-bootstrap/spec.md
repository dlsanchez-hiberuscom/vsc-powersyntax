# Spec 162 - Bootstrap de warm resume en el servidor (B071)

## 1. Resumen

Cargar el checkpoint reutilizable al arrancar y restaurar DocumentCache y KnowledgeBase antes del indexado cuando la compatibilidad lo permite.

## 2. Problema

La persistencia existia en piezas sueltas, pero el servidor seguia arrancando como cold start en cada sesion.

## 3. Objetivo

Insertar el resume temprano en el lifecycle del servidor sin publicar estado incierto.

## 4. Alcance

- Leer cacheStorageUri en onInitialize.
- Crear el store tras discovery y project model.
- Restaurar DocumentCache y KB antes del indexado.
- Respetar decision reuse o rebuild.

## 5. Fuera de alcance

- Resume por proyecto.
- Warm serving cache.
- Metrica cold vs warm avanzada.

## 6. Requisitos

- R1. El cambio debe materializar una mejora pequena, verificable y coherente con el runtime actual.
- R2. La implementacion no debe introducir estado incierto ni duplicar logica semantica ya existente.
- R3. Deben existir tests o validaciones ejecutables del area tocada.
- R4. La trazabilidad documental debe quedar alineada con B071.

## 7. Criterios de aceptacion

- AC1. La capacidad descrita por esta spec existe en codigo del producto.
- AC2. El baseline de validacion del repositorio queda en verde tras el cambio.
- AC3. El comportamiento nuevo queda cubierto por tests o por wiring verificable del runtime.
- AC4. Backlog, current focus y done-log reflejan el avance real cuando aplique.

## 8. Riesgos y notas

- El valor de esta slice depende de mantener cambios pequenos y facilmente reversibles.
- Si la compatibilidad falla, el runtime debe degradar o reconstruir en lugar de servir estado dudoso.
- Documentacion a revisar: docs/current-focus.md, docs/roadmap.md, docs/done-log.md.
