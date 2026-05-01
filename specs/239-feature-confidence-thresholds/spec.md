# Spec 239 - Feature confidence thresholds (B157/B158)

## 1. Resumen

Definir en `featureReadiness` la confidence mínima de resolución requerida por cada feature sin activar todavía gates automáticos.

## 2. Problema

Ya existe un comparador canónico de confidence, pero aún no hay una política central que diga qué bucket mínimo necesita cada feature.

## 3. Objetivo

Introducir un mapa de thresholds por feature y un getter explícito para consultarlo.

## 4. Alcance

- modelar thresholds mínimos por feature;
- exportar `getRequiredResolutionConfidence()`;
- cubrir el mapa con tests unitarios focalizados.

## 5. Fuera de alcance

- gating automático basado en confidence;
- cambios en handlers del servidor;
- ajustes de UX por feature.

## 6. Requisitos

- R1. Hover y completion deben tolerar confidence baja.
- R2. Definition debe exigir al menos confidence media.
- R3. References y rename deben exigir confidence alta.
- R4. La validación debe ser ejecutable y centrada en `featureReadiness`.

## 7. Criterios de aceptacion

- AC1. Existe un getter de confidence requerida por feature.
- AC2. La política queda centralizada y testeada.
- AC3. Existe cobertura unitaria focalizada.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- La política debe quedar explícita antes de activar gates automáticos.
- Documentacion a revisar: `docs/done-log.md`.