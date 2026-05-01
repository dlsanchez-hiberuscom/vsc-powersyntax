# Spec 153 - Puerto persistente de filesystem (B167)

## 1. Resumen

Extender el puerto IFileSystem y su implementacion NodeFileSystem para soportar escritura real a disco con createDirectory, writeFile y deletePath.

## 2. Problema

La persistencia del runtime no podia materializar checkpoints ni journals porque el puerto de filesystem solo exponia lectura.

## 3. Objetivo

Habilitar un borde de escritura minimo y seguro para que las capas de cache persistente puedan operar sin acoplarse directamente a fs.

## 4. Alcance

- Anadir createDirectory al puerto de filesystem.
- Anadir writeFile con creacion de carpetas padre.
- Anadir deletePath para limpieza idempotente.
- Cubrir el contrato con tests unitarios sobre temp dirs.

## 5. Fuera de alcance

- Persistencia de schema y journal.
- Politicas de versionado.
- Caches de consultas frecuentes.

## 6. Requisitos

- R1. El cambio debe materializar una mejora pequena, verificable y coherente con el runtime actual.
- R2. La implementacion no debe introducir estado incierto ni duplicar logica semantica ya existente.
- R3. Deben existir tests o validaciones ejecutables del area tocada.
- R4. La trazabilidad documental debe quedar alineada con B167.

## 7. Criterios de aceptacion

- AC1. La capacidad descrita por esta spec existe en codigo del producto.
- AC2. El baseline de validacion del repositorio queda en verde tras el cambio.
- AC3. El comportamiento nuevo queda cubierto por tests o por wiring verificable del runtime.
- AC4. Backlog, current focus y done-log reflejan el avance real cuando aplique.

## 8. Riesgos y notas

- El valor de esta slice depende de mantener cambios pequenos y facilmente reversibles.
- Si la compatibilidad falla, el runtime debe degradar o reconstruir en lugar de servir estado dudoso.
- Documentacion a revisar: docs/architecture.md, docs/backlog.md, docs/done-log.md.
