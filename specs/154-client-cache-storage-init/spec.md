# Spec 154 - Bootstrap de storage persistente desde el cliente (B071)

## 1. Resumen

Propagar cacheStorageUri desde el cliente VS Code hasta la inicializacion del servidor para que el runtime pueda elegir una raiz estable de persistencia.

## 2. Problema

El servidor no recibia una ubicacion oficial de storage y no podia diferenciar entre memoria efimera y persistencia real entre sesiones.

## 3. Objetivo

Pasar una ruta estable de cache al servidor sin ensuciar el cliente con logica semantica.

## 4. Alcance

- Leer storageUri del contexto de extension.
- Anadir cacheStorageUri a initializationOptions.
- Consumir ese dato en onInitialize del servidor.
- Mantener el cliente ligero y sin semantica.

## 5. Fuera de alcance

- Creacion del store persistente.
- Warm resume del pipeline.
- Persistencia por proyecto.

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
- Documentacion a revisar: docs/architecture.md, docs/current-focus.md, docs/done-log.md.
