# Spec 155 - Store persistente de cache semantica (B167)

## 1. Resumen

Introducir cacheStore como lifecycle persistente real para checkpoint y journal sobre una raiz de storage controlada por el runtime.

## 2. Problema

Existia contrato de checkpoint y journal, pero no una capa operativa para cargar, persistir y truncar esos artefactos en disco.

## 3. Objetivo

Separar el lifecycle persistente en una abstraccion pequena y reutilizable que pueda cargar, guardar y limpiar journal con seguridad.

## 4. Alcance

- Crear createSemanticCacheStore.
- Cargar checkpoint y journal desde disco.
- Persistir checkpoint y limpiar journal tras snapshots estables.
- Exponer datos basicos del store para observabilidad.

## 5. Fuera de alcance

- Particionado por proyecto.
- Warm query cache.
- Migraciones avanzadas de formato.

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
