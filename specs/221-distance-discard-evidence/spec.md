# Spec 221 - Motivos de descarte por distancia (B157)

## 1. Resumen

Registrar en `evidence` qué candidatos del winner path quedaron descartados por estar más lejos en la jerarquía que el ganador mínimo.

## 2. Problema

Tras `Spec 220`, el query engine ya conserva el pool bruto, pero todavía no explica por qué ciertos candidatos jerárquicos no ganaron frente al override más cercano.

## 3. Objetivo

Emitir `evidence` de descarte por distancia mínima en rutas jerárquicas.

## 4. Alcance

- capturar los descartes que produce el filtro por distancia;
- exponerlos dentro de `evidence`;
- cubrir el caso con test unitario focalizado.

## 5. Fuera de alcance

- descartes por contexto o cualificador inválido;
- empate entre candidatos de la misma distancia;
- confidence formal por feature.

## 6. Requisitos

- R1. El descarte debe calcularse sobre la misma distancia usada para elegir ganador.
- R2. La resolución final no puede cambiar.
- R3. La validación debe ser ejecutable y centrada en `semanticQueryService`.

## 7. Criterios de aceptacion

- AC1. `ResolvedTargetInfo.evidence` incluye descartes por distancia cuando aplica.
- AC2. El evidence distingue distancia del candidato descartado y distancia ganadora.
- AC3. La suite unitaria focalizada cubre el caso de override local frente a ancestro.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- Esta slice solo cubre descartes provocados por el filtro jerárquico existente.
- Documentacion a revisar: `docs/done-log.md`.