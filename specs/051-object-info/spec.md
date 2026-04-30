# Spec 051 — Comando info objeto actual (B106)

## Motivación
Datos canónicos para responder al comando `powerbuilder.objectInfo`
mostrando objeto, base type, library/project, sección actual.

## Alcance
- `src/server/features/objectInfo.ts`:
  - `buildObjectInfo({uri, content, line, project?, library?})` →
    `{file, kind, sectionKind?, globalType?, baseType?, library?, project?}`.
  - Reusa `parseSrContainer` y `scanSections`.

## Criterios
1. Para fichero con `global type w_main from window`, retorna globalType y baseType.
2. Sección detectada según línea.
