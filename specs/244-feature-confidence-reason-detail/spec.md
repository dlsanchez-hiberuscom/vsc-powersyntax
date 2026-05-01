# Spec 244 - Feature confidence reason detail (B157/B158)

## 1. Resumen

Enriquecer el `reason` de `FeatureReadinessDecision` cuando la decisión se deba a confidence insuficiente, incluyendo el valor actual y el requerido.

## 2. Problema

La `Spec 243` ya activa el gating por confidence, pero el `reason` aún es demasiado genérico y no explica el desajuste concreto entre `actual` y `required`.

## 3. Objetivo

Hacer explícito en el `reason` cuál era la confidence actual y cuál la mínima requerida.

## 4. Alcance

- enriquecer el mensaje del branch de confidence insuficiente;
- reutilizar `actualResolutionConfidence` y `requiredResolutionConfidence` ya presentes;
- cubrir el mensaje con tests unitarios focalizados.

## 5. Fuera de alcance

- cambios en acciones resultantes;
- traducción avanzada o i18n;
- integración con handlers del servidor.

## 6. Requisitos

- R1. El mensaje debe mencionar tanto la confidence actual como la requerida.
- R2. No debe afectar a otras ramas de `reason`.
- R3. La validación debe ser ejecutable y centrada en `featureReadiness`.

## 7. Criterios de aceptacion

- AC1. El `reason` de insufficiency incluye `actual` y `required`.
- AC2. La acción no cambia respecto a la `Spec 243`.
- AC3. Existe cobertura unitaria focalizada.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- El mensaje debe ser informativo sin duplicar lógica de la decisión.
- Documentacion a revisar: `docs/done-log.md`.