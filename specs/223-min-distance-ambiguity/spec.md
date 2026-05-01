# Spec 223 - Ambiguedad de minima distancia (B157)

## 1. Resumen

Registrar en `evidence` cuando la distancia mínima deja más de un candidato ganador en la misma ruta jerárquica.

## 2. Problema

El query engine ya conserva pool y descartes por distancia, pero todavía no marca explícitamente cuándo el conjunto ganador mínimo sigue siendo ambiguo.

## 3. Objetivo

Emitir una evidencia pequeña de ambigüedad cuando varios candidatos comparten la misma distancia ganadora.

## 4. Alcance

- detectar empate de distancia mínima en el ranking jerárquico;
- exponerlo como `evidence`;
- cubrir el caso con test unitario focalizado.

## 5. Fuera de alcance

- resolver la ambigüedad por otra heurística;
- bloquear aún features por confidence;
- exposición pública en API o stats.

## 6. Requisitos

- R1. La detección debe reutilizar la misma distancia usada para elegir el conjunto ganador.
- R2. `targets` no debe cambiar en esta slice.
- R3. La validación debe ser ejecutable y centrada en `semanticQueryService`.

## 7. Criterios de aceptacion

- AC1. `ResolvedTargetInfo.evidence` incluye una marca de ambigüedad cuando varios targets comparten la distancia ganadora.
- AC2. El evidence informa la distancia ganadora y el número de candidatos empatados.
- AC3. La suite unitaria focalizada cubre el caso.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- Esta slice solo detecta la ambigüedad; no decide todavía qué hacer con ella en features sensibles.
- Documentacion a revisar: `docs/done-log.md`.