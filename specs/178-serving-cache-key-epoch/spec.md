# Spec 178 - Parseo de epoch en clave de ServingCache (B071B)

## 1. Resumen

Exponer un helper en ServingCache que extraiga el `kbVersion` desde la clave serializada para poder filtrar snapshots persistentes por epoch activa.

## 2. Problema

La persistencia de ServingCache ya existe, pero ni el helper ni el runtime pueden discriminar entradas válidas de entradas muertas sin volver a parsear manualmente la clave.

## 3. Objetivo

Introducir un parser pequeño y seguro de `kbVersion` desde las claves de ServingCache.

## 4. Alcance

- Añadir helper para extraer `kbVersion` desde una clave válida.
- Devolver `null` en claves incompatibles o mal formadas.
- Cubrir el helper con tests unitarios puros.

## 5. Fuera de alcance

- Filtrar snapshots al persistir o restaurar.
- Cambiar wiring del runtime.
- Cambiar el formato de makeKey.

## 6. Requisitos

- R1. El helper debe ser compatible con el formato actual de makeKey.
- R2. El helper no debe afectar el hot path salvo cuando se invoque explícitamente.
- R3. Deben existir tests de clave válida e inválida.

## 7. Criterios de aceptacion

- AC1. ServingCache expone un helper para leer la epoch de una clave.
- AC2. Las claves mal formadas degradan a `null`.
- AC3. Compile y tests del slice quedan en verde.

## 8. Riesgos y notas

- Cambiar la semántica de parsing sin tests rompería filtros posteriores de snapshots.
- El slice debe quedar en ServingCache; la persistencia se ajustará después.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md.