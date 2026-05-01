# Spec 238 - Feature confidence order helper (B157/B158)

## 1. Resumen

Definir en `featureReadiness` un orden canónico para comparar la confidence de resolución `low`, `medium` y `high`.

## 2. Problema

La confidence general ya existe en el query engine, pero la capa de readiness todavía no tiene un helper canónico para compararla sin lógica ad hoc.

## 3. Objetivo

Introducir un comparador puro reutilizable para la confidence de resolución.

## 4. Alcance

- modelar un orden canónico para `low`, `medium`, `high`;
- exportar un helper `compareResolutionConfidence()`;
- cubrir comparaciones básicas con tests unitarios focalizados.

## 5. Fuera de alcance

- thresholds por feature;
- integración con decisiones de gating;
- cambios en handlers del servidor.

## 6. Requisitos

- R1. El helper debe ser puro y estable.
- R2. Debe ordenar `low < medium < high`.
- R3. La validación debe ser ejecutable y centrada en `featureReadiness`.

## 7. Criterios de aceptacion

- AC1. Existe `compareResolutionConfidence()`.
- AC2. El helper refleja el orden canónico definido.
- AC3. Existe cobertura unitaria focalizada.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- El orden debe quedar centralizado para evitar comparaciones inconsistentes en capas superiores.
- Documentacion a revisar: `docs/done-log.md`.