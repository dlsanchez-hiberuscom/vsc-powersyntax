# Spec 174 - Journal persistente particionado por proyecto (B071A)

## 1. Resumen

Particionar las mutaciones persistidas del journal por proyecto para completar el reuse fino del cache store sobre la base del checkpoint ya dividido.

## 2. Problema

Tras `Spec 173`, el checkpoint ya se persiste por proyecto, pero el journal sigue siendo global al workspace. Eso mantiene un punto monolítico en la reanudación y evita cerrar B071A con granularidad consistente.

## 3. Objetivo

Persistir y restaurar journals separados por proyecto y por workspace, manteniendo restore agregado seguro.

## 4. Alcance

- Particionar `appendJournalMutation` por proyecto.
- Mantener journal de workspace para huérfanos.
- Restaurar checkpoints y journals por partición sin mezclar secuencias incompatibles.
- Dejar trazabilidad documental del avance.

## 5. Fuera de alcance

- Cache persistente de consultas frecuentes.
- Confidence gates.
- Lineage de símbolos.

## 6. Requisitos

- R1. El cache store debe seguir degradando a rebuild ante payloads persistidos dudosos.
- R2. La secuencia del journal debe validarse por partición, no como stream global artificial.
- R3. Deben existir tests unitarios que prueben persistencia y restore de la ruta particionada.
- R4. La documentación debe reflejar el cierre efectivo de B071A si se alcanza.

## 7. Criterios de aceptacion

- AC1. Las mutaciones de documentos de proyecto se persisten en journals separados por proyecto.
- AC2. Las mutaciones de huérfanos permanecen en el journal de workspace.
- AC3. El restore recompone correctamente el estado agregado aplicando journals por partición.
- AC4. Compile y baseline de tests quedan en verde.

## 8. Riesgos y notas

- Mezclar secuencias de varias particiones en un stream único puede invalidar restores válidos.
- El slice debe mantenerse centrado en cacheStore y no reabrir el serving.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md, docs/roadmap.md.