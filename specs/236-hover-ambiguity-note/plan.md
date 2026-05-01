# Plan - Spec 236 Hover ambiguity note (B157/B103)

## 1. Resumen tecnico

Extender el summary de resolución del hover para marcar si el query engine devolvió más de un target ganador.

## 2. Estado actual

- el hover ya proyecta confidence y reason code;
- falta una advertencia cuando la resolución sigue siendo ambigua.

## 3. Diseno propuesto

- ampliar `HoverResolutionSummary` con `ambiguous` y `targetCount`;
- pasar las señales desde `provideHover()`;
- renderizar una nota compacta cuando `targetCount > 1`.

## 4. Impacto en el runtime

- hace visible la ambigüedad al usuario;
- no altera la selección actual del target principal.

## 5. Riesgos tecnicos

- inducir a pensar que el hover lista todos los candidatos;
- derivar la ambigüedad fuera del query engine.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/hover"`

## 7. Documentacion a actualizar

- `docs/done-log.md`