# Spec 201 - Diagnostics extra snapshot consumer (B151A)

## 1. Resumen

Hacer snapshot-first la ruta de `runExtraDiagnostics()` para que los diagnósticos SD11/SD12/SD13 consuman `scopes` y texto enmascarado desde el snapshot publicado.

## 2. Problema

El módulo `diagnosticsExtra` seguia leyendo `scopes` y `strippedLines` desde `DocumentAnalysis`, aunque el snapshot ya publica esa misma información en una forma estable y reusable.

## 3. Objetivo

Reducir `B151A` en otra frontera pequeña y verificable dentro del pipeline de diagnósticos.

## 4. Alcance

- consumir `snapshot.scopes` en `runExtraDiagnostics()`;
- consumir `snapshot.maskedText.lines` para SD11/SD12/SD13;
- añadir una prueba end-to-end focalizada sobre `runExtraDiagnostics()`.

## 5. Fuera de alcance

- migrar aún `validateStructure()` o el resto del pipeline principal de diagnósticos;
- cambiar las heurísticas SD11/SD12/SD13;
- cerrar por sí sola toda la parte de `diagnostics` dentro de `B151A`.

## 6. Requisitos

- R1. El comportamiento de los diagnósticos extra debe mantenerse.
- R2. La fuente de `scopes` y texto debe ser el snapshot publicado.
- R3. La validación debe ser ejecutable y centrada en esta ruta.

## 7. Criterios de aceptacion

- AC1. `runExtraDiagnostics()` usa `snapshot.scopes`.
- AC2. `runExtraDiagnostics()` usa `snapshot.maskedText.lines`.
- AC3. La prueba end-to-end focalizada y la suite del módulo siguen verdes.

## 8. Riesgos y notas

- Esta slice no cierra aún la deuda snapshot-first del pipeline principal de `diagnostics.ts`.
- Documentacion a revisar al cerrar el bloque: `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md`, `docs/done-log.md`.