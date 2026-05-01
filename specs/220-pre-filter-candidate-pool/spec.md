# Spec 220 - Pool de candidatos previo al filtro (B157)

## 1. Resumen

Exponer el pool de candidatos bruto del winner path antes del filtro final de distancia o selección para preparar descartes explicables.

## 2. Problema

`resolveTargetEntityDetailed()` ya elige el ganador correcto, pero una vez filtrado el resultado se pierde el conjunto de candidatos evaluados en esa misma ruta.

## 3. Objetivo

Retener y devolver el pool de candidatos previo al filtro del winner path sin cambiar la resolución final.

## 4. Alcance

- modelar el `candidatePool` del resultado detallado;
- poblarlo en rutas locales, jerárquicas, cualificadas y globales;
- cubrir el comportamiento con test unitario focalizado.

## 5. Fuera de alcance

- reason codes de descarte;
- ranking o scoring adicional;
- exposición pública en API o stats.

## 6. Requisitos

- R1. El pool debe reflejar el conjunto bruto previo al filtro final.
- R2. La resolución final no puede cambiar.
- R3. La validación debe ser ejecutable y centrada en `semanticQueryService`.

## 7. Criterios de aceptacion

- AC1. `ResolvedTargetInfo` expone `candidatePool` cuando una ruta de resolución encuentra candidatos.
- AC2. En una resolución por jerarquía, el pool conserva ganador y ancestros antes del filtro por distancia.
- AC3. La suite unitaria focalizada cubre la nueva salida.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- El contrato debe ser pequeño para poder enriquecerlo luego con motivos de descarte.
- Documentacion a revisar: `docs/done-log.md`.