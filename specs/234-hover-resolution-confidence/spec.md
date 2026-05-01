# Spec 234 - Hover resolution confidence (B157/B103)

## 1. Resumen

Mostrar en el hover de símbolos de usuario la confidence general de resolución derivada por el query engine.

## 2. Problema

El hover ya enseña lineage de la entidad final, pero no proyecta todavía la confidence general de resolución que resume si el winner path fue alto, medio o bajo.

## 3. Objetivo

Llevar al hover la `confidence` general del query engine sin alterar la resolución ni el target elegido.

## 4. Alcance

- extender `formatUserHover()` para aceptar metadatos de resolución;
- pasar la confidence desde `provideHover()`;
- renderizar una línea explícita en el Markdown del hover;
- cubrir el comportamiento con tests unitarios focalizados.

## 5. Fuera de alcance

- reason codes o evidencia detallada;
- cambios en la lógica de resolución;
- surfaces públicas adicionales.

## 6. Requisitos

- R1. La confidence debe venir del query engine, no recomputarse en hover.
- R2. El hover debe seguir funcionando cuando no se pase metadato de resolución.
- R3. La validación debe ser ejecutable y centrada en `hover`/`hoverFormat`.

## 7. Criterios de aceptacion

- AC1. El hover de usuario muestra `Confianza de resolución` cuando existe.
- AC2. `provideHover()` pasa la confidence desde la resolución detallada.
- AC3. Existe cobertura unitaria focalizada.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- No mezclar la confidence de resolución con la confidence de lineage ya existente.
- Documentacion a revisar: `docs/done-log.md`.