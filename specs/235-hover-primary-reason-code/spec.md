# Spec 235 - Hover primary reason code (B157/B103)

## 1. Resumen

Mostrar en el hover de símbolos de usuario el `reasonCode` principal que explica cómo llegó el query engine al target mostrado.

## 2. Problema

El hover ya expone la confidence general, pero sigue sin explicar la ruta principal de resolución, como `member-hierarchy` o `global-fallback`.

## 3. Objetivo

Llevar al hover el motivo principal de resolución sin duplicar lógica del query engine.

## 4. Alcance

- extender el metadato opcional de `formatUserHover()`;
- pasar el primer `reasonCode` desde `provideHover()`;
- renderizar una línea explícita en el Markdown del hover;
- cubrir la proyección con tests unitarios focalizados.

## 5. Fuera de alcance

- evidence completa;
- taxonomía traducida de reason codes;
- cambios en la resolución.

## 6. Requisitos

- R1. El valor debe venir de `resolved.reasonCodes[0]`.
- R2. El hover debe seguir funcionando si el metadato falta.
- R3. La validación debe ser ejecutable y centrada en `hover`/`hoverFormat`.

## 7. Criterios de aceptacion

- AC1. El hover de usuario muestra `Motivo de resolución` cuando existe.
- AC2. `provideHover()` pasa el reason code principal.
- AC3. Existe cobertura unitaria focalizada.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- El hover debe limitarse a mostrar el código canónico, no reinterpretarlo.
- Documentacion a revisar: `docs/done-log.md`.