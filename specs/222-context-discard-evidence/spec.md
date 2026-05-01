# Spec 222 - Motivos de descarte por contexto (B157)

## 1. Resumen

Registrar en `evidence` los misses de contexto cuando un qualifier no resuelve a tipo o no encuentra miembros compatibles en esa ruta.

## 2. Problema

El query engine ya explica ganador y descartes por distancia, pero todavía devuelve un vacío opaco cuando la ruta cualificada falla por contexto antes de encontrar candidatos.

## 3. Objetivo

Emitir evidence negativa y pequeña para misses de qualifier.

## 4. Alcance

- detectar qualifier no resuelto a tipo;
- detectar qualifier resuelto sin miembros compatibles;
- exponer esos misses como `evidence`;
- cubrir ambos casos con tests unitarios focalizados.

## 5. Fuera de alcance

- misses de scope local sin qualifier;
- ambigüedad entre candidatos de la misma distancia;
- exposición pública en API o stats.

## 6. Requisitos

- R1. Los misses deben reflejar el punto real donde la resolución se corta.
- R2. La resolución final no puede cambiar.
- R3. La validación debe ser ejecutable y centrada en `semanticQueryService`.

## 7. Criterios de aceptacion

- AC1. `ResolvedTargetInfo.evidence` expone misses de qualifier no resuelto.
- AC2. `ResolvedTargetInfo.evidence` expone misses de qualifier sin miembros compatibles.
- AC3. La suite unitaria focalizada cubre ambos casos negativos.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- Esta slice mantiene el contrato negativo pequeño para no contaminar aún surfaces públicas.
- Documentacion a revisar: `docs/done-log.md`.