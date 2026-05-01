# Plan - Spec 235 Hover primary reason code (B157/B103)

## 1. Resumen tecnico

Extender el summary de resolución del hover para incluir el `reasonCode` principal del resultado detallado.

## 2. Estado actual

- el hover ya proyecta confidence general;
- falta el motivo principal que explica por qué se eligió ese camino de resolución.

## 3. Diseno propuesto

- ampliar `HoverResolutionSummary` con `reasonCode`;
- pasar `resolved.reasonCodes[0]` desde `provideHover()`;
- renderizar una línea separada en `formatUserHover()`.

## 4. Impacto en el runtime

- añade explicabilidad visible al hover;
- reutiliza información ya calculada por el query engine.

## 5. Riesgos tecnicos

- reetiquetar el code en lugar de preservar el valor canónico;
- romper callers existentes del formateador.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/hover"`

## 7. Documentacion a actualizar

- `docs/done-log.md`