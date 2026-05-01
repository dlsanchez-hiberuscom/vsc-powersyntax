# Spec 219 - Evidence del ganador semantico (B157)

## 1. Resumen

Anadir una primera pieza formal de `evidence` al resultado detallado del query engine para describir el target ganador sin depender solo de `reasonCodes` y `winnerLineage` por separado.

## 2. Problema

`resolveTargetEntityDetailed()` ya expone `reasonCodes`, `winnerLineage` y `trace`, pero todavia no entrega un contrato unico y estable de `evidence` que un consumer pueda leer sin recomponer esos campos manualmente.

## 3. Objetivo

Crear un contrato pequeno de `winner evidence` reutilizable por slices posteriores de `B157`.

## 4. Alcance

- modelar el contrato de `winner evidence`;
- poblarlo desde `resolveTargetEntityDetailed()`;
- cubrir la salida con test unitario focalizado.

## 5. Fuera de alcance

- candidatos descartados o perdedores;
- confidence gates por feature;
- exposicion publica en API o stats.

## 6. Requisitos

- R1. El contrato debe ser pequeno y estable.
- R2. No puede cambiar el comportamiento de resolucion existente.
- R3. La validacion debe ser ejecutable y centrada en `semanticQueryService`.

## 7. Criterios de aceptacion

- AC1. `ResolvedTargetInfo` expone `evidence` cuando existe target ganador.
- AC2. La evidence del ganador reutiliza `reasonCode`, `confidence` y origen documental ya disponibles.
- AC3. La suite unitaria focalizada cubre la salida nueva.
- AC4. La trazabilidad documental del avance queda registrada en `done-log.md`.

## 8. Riesgos y notas

- La shape de `evidence` debe permitir crecer luego con descartes sin romper consumers.
- Documentacion a revisar: `docs/done-log.md`.