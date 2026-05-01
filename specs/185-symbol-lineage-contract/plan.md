# Plan - Spec 185 Contrato base de lineage para símbolos (B172)

## 1. Resumen tecnico

Definir una interfaz `EntityLineage` y enums/unions asociadas en `types.ts`, enlazándolas a `Entity` sin tocar productores todavía.

## 2. Estado actual

- `Entity` ya concentra los campos compartidos del modelo semántico.
- No existe hoy un contrato único para provenance/lineage/resolution.

## 3. Diseno propuesto

- Tipos pequeños y opcionales.
- Vocabulario compatible con las necesidades de parser, resolución y bridge de sistema.

## 4. Impacto en rendimiento

- Nulo; solo modelado de tipos.

## 5. Riesgos tecnicos

- Introducir demasiados campos o nomenclatura inestable.

## 6. Estrategia de validacion

- npm run compile
- npm run test:unit
- npm test

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md