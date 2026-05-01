# Spec 179 - Persistir solo la epoch activa en ServingCache (B071B)

## 1. Resumen

Filtrar al persistir la snapshot de ServingCache para conservar únicamente entradas de la epoch activa del KnowledgeBase.

## 2. Problema

Aunque la snapshot persistente ya existe, todavía puede arrastrar entradas de epochs antiguas que nunca volverán a hacer hit tras una reapertura.

## 3. Objetivo

Persistir solo entradas de ServingCache cuya clave pertenezca a la epoch activa.

## 4. Alcance

- Filtrar exportEntries por `kbVersion` antes de persistir.
- Mantener intacto el resto del contrato del helper.
- Cubrir el filtro con test unitario.

## 5. Fuera de alcance

- Filtrar el restore.
- Cambiar el formato persistido.
- Cambiar invalidación o particionado por proyecto.

## 6. Requisitos

- R1. El helper debe aceptar la epoch activa del KB.
- R2. Las claves inválidas deben descartarse de la persistencia.
- R3. Debe existir test con mezcla de epochs válidas y obsoletas.

## 7. Criterios de aceptacion

- AC1. persistServingCacheSnapshot solo escribe entradas de la epoch activa.
- AC2. Las claves inválidas u obsoletas no llegan al snapshot persistido.
- AC3. Compile y tests del slice quedan en verde.

## 8. Riesgos y notas

- Persistir snapshots mixtos degrada el valor real de B071B.
- El slice debe quedarse en el helper de persistencia y no abrir aún restore por epoch.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md.