# Spec 173 - Checkpoint persistente particionado por proyecto (B071A)

## 1. Resumen

Particionar la persistencia del checkpoint semantico por proyecto manteniendo un ancla de workspace para huérfanos y compatibilidad de restore.

## 2. Problema

El cache store actual materializa un unico checkpoint por workspace. Eso obliga a reutilizar o invalidar estado como bloque monolitico aunque el runtime ya conozca proyectos, targets y huérfanos.

## 3. Objetivo

Persistir y restaurar checkpoints divididos por proyecto para reducir recomputacion innecesaria y preparar el cierre de B071A.

## 4. Alcance

- Persistir documentos del checkpoint en particiones por proyecto.
- Mantener documentos huérfanos en la particion de workspace.
- Restaurar el conjunto agregado desde las particiones persistidas.
- Dejar trazabilidad documental de la slice.

## 5. Fuera de alcance

- Particionado del journal por proyecto.
- Cache persistente de queries frecuentes.
- Confidence gates o lineage.

## 6. Requisitos

- R1. El cambio debe reutilizar UnifiedProjectModel ya disponible en runtime.
- R2. El restore debe seguir degradando a rebuild si el payload persistido no es fiable.
- R3. Debe existir validacion ejecutable del cache store para la ruta particionada.
- R4. La documentacion debe quedar alineada con el avance real de B071A.

## 7. Criterios de aceptacion

- AC1. El cache store persiste checkpoints separados por proyecto cuando existe modelo de proyectos.
- AC2. Los documentos sin proyecto quedan anclados al checkpoint de workspace.
- AC3. La carga del cache recompone el conjunto de documentos desde las particiones persistidas.
- AC4. Compile y tests del slice quedan en verde.

## 8. Riesgos y notas

- Cambiar el formato persistido sin una ruta de compatibilidad puede romper warm resume.
- El slice debe mantenerse pequeno: checkpoint primero, journal despues.
- Documentacion a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md, docs/roadmap.md.