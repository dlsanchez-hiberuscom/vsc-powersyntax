# Spec 180 - Restaurar solo la epoch esperada en ServingCache (B071B)

## 1. Resumen

Filtrar la snapshot restaurada de ServingCache para rehidratar únicamente entradas de la epoch esperada del checkpoint reutilizado.

## 2. Problema

La persistencia ya escribe solo la epoch activa, pero el restore sigue aceptando todo el snapshot aunque contenga entradas antiguas o inválidas.

## 3. Objetivo

Restaurar solo entradas cuya clave pertenezca a la epoch esperada del KB restaurado.

## 4. Alcance

- Filtrar las entradas cargadas desde el store antes de `restoreEntries()`.
- Pasar la epoch esperada desde el call site de warm resume.
- Cubrir el filtro con test unitario.

## 5. Fuera de alcance

- Cambiar el formato persistido.
- Añadir políticas de invalidez más ricas.
- Cambiar heurísticas de reuse del checkpoint.

## 6. Requisitos

- R1. El helper debe aceptar la epoch esperada.
- R2. Las claves inválidas deben descartarse del restore.
- R3. Debe existir test con mezcla de epochs válidas y obsoletas.

## 7. Criterios de aceptacion

- AC1. restoreServingCacheSnapshot solo rehidrata entradas de la epoch esperada.
- AC2. Las claves inválidas u obsoletas no se restauran.
- AC3. Compile y tests del slice quedan en verde.

## 8. Riesgos y notas

- Restaurar entradas obsoletas puede producir falsos hits sobre una KB distinta.
- El slice debe mantenerse en el helper y el call site directo de warm resume.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md.