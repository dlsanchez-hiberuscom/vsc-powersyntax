# Spec 237 - Hover target count (B157/B103)

## 1. Resumen

Mostrar en el hover de usuario el número de candidatos ganadores devueltos por la resolución detallada como dato separado del aviso de ambigüedad.

## 2. Problema

La `Spec 236` ya muestra una nota de ambigüedad, pero la cardinalidad de candidatos sigue embebida en una frase y no aparece cuando solo hay un ganador.

## 3. Objetivo

Renderizar una línea explícita con el número de candidatos ganadores del winner path.

## 4. Alcance

- reutilizar `targetCount` en el summary de resolución del hover;
- renderizar `Candidatos ganadores` como línea separada;
- cubrir casos unitarios simple y ambiguo.

## 5. Fuera de alcance

- listar todas las definiciones candidatas;
- cambios en el algoritmo de resolución;
- surfaces públicas adicionales.

## 6. Requisitos

- R1. La cardinalidad debe venir del query engine, no recalcularse en hover.
- R2. Debe poder mostrarse con un único ganador.
- R3. La validación debe ser ejecutable y centrada en `hover`/`hoverFormat`.

## 7. Criterios de aceptacion

- AC1. El hover muestra `Candidatos ganadores` cuando existe `targetCount`.
- AC2. La cardinalidad se proyecta desde `provideHover()`.
- AC3. Existe cobertura unitaria focalizada.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- El dato debe seguir siendo puramente informativo y no alterar la selección del target mostrado.
- Documentacion a revisar: `docs/done-log.md`.