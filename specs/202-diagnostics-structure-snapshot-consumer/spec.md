# Spec 202 - Diagnostics structure snapshot consumer (B151A)

## 1. Resumen

Hacer snapshot-first la validación estructural de diagnósticos para que `validateStructure()` trabaje sobre el texto enmascarado y las secciones publicadas por el snapshot.

## 2. Problema

La ruta estructural de diagnósticos seguia leyendo `lines` y `sections` desde `DocumentAnalysis`, aunque el snapshot canónico ya publica exactamente esa información en `maskedText` y `containerModel.sections`.

## 3. Objetivo

Cerrar otra slice de `B151A` dentro de `diagnostics` sin tocar todavía la parte semántica más grande.

## 4. Alcance

- usar `snapshot.maskedText.lines` en `validateStructure()`;
- usar `snapshot.containerModel.sections` para detectar secciones declarativas;
- mantener intactas las reglas de bloques y continuaciones existentes.

## 5. Fuera de alcance

- migrar en esta spec `validateSemantics()`;
- cambiar reglas de diagnóstico estructural;
- cerrar por sí sola toda la deuda snapshot-first de `diagnostics`.

## 6. Requisitos

- R1. El comportamiento estructural visible debe mantenerse.
- R2. La función debe consumir únicamente datos ya publicados por el snapshot.
- R3. La validación debe ser ejecutable y centrada en `diagnostics`.

## 7. Criterios de aceptacion

- AC1. `validateStructure()` usa `snapshot.maskedText.lines`.
- AC2. `validateStructure()` usa `snapshot.containerModel.sections`.
- AC3. La suite unitaria de `diagnostics` sigue verde para los casos estructurales existentes.

## 8. Riesgos y notas

- Esta slice asume que el texto enmascarado preserva offsets y longitud de línea, igual que las rutas ya migradas de snapshot textual.
- Documentacion a revisar al cerrar el bloque: `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md`, `docs/done-log.md`.