# Spec 236 - Hover ambiguity note (B157/B103)

## 1. Resumen

Mostrar en el hover de usuario una nota explícita cuando la resolución detallada es ambigua y existen varios ganadores a distancia mínima.

## 2. Problema

El hover sigue mostrando el primer target incluso cuando la resolución es ambigua, pero no avisa al usuario de que hay más de un candidato ganador.

## 3. Objetivo

Anotar la ambigüedad en el hover sin cambiar la selección actual del target visualizado.

## 4. Alcance

- extender el summary de resolución del hover con `ambiguous` y `targetCount`;
- pasar la señal desde `provideHover()`;
- renderizar una nota explícita en el Markdown;
- cubrir el caso ambiguo con tests unitarios focalizados.

## 5. Fuera de alcance

- cambiar la política de selección del target mostrado;
- listar todas las definiciones en el hover;
- feature gates.

## 6. Requisitos

- R1. La ambigüedad debe venir de la resolución detallada ya calculada.
- R2. El hover debe seguir eligiendo el primer target como hoy.
- R3. La validación debe ser ejecutable y centrada en `hover`/`hoverFormat`.

## 7. Criterios de aceptacion

- AC1. El hover muestra una nota de ambigüedad cuando hay varios ganadores.
- AC2. La nota incluye el número de candidatos ganadores.
- AC3. Existe cobertura unitaria focalizada del caso ambiguo.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- La nota no debe reinterpretar la política de desempate, solo explicarla.
- Documentacion a revisar: `docs/done-log.md`.