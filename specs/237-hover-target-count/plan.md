# Plan - Spec 237 Hover target count (B157/B103)

## 1. Resumen tecnico

Reutilizar el `targetCount` ya proyectado a `HoverResolutionSummary` para mostrar la cardinalidad del winner path en una línea independiente del hover.

## 2. Estado actual

- hover ya conoce `targetCount` para notas de ambigüedad;
- falta exponer la cardinalidad como dato independiente y estable.

## 3. Diseno propuesto

- renderizar `*Candidatos ganadores:* N` cuando exista `targetCount`;
- reutilizar el valor ya pasado desde `provideHover()`;
- validar casos simple y ambiguo en tests unitarios.

## 4. Impacto en el runtime

- mejora la legibilidad del hover;
- separa warning de ambigüedad y cardinalidad informativa.

## 5. Riesgos tecnicos

- duplicar información de la nota de ambigüedad de forma confusa;
- dejar de mostrar el dato en el caso no ambiguo.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/hover"`

## 7. Documentacion a actualizar

- `docs/done-log.md`