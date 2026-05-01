# Spec 243 - Feature confidence gating (B157/B158)

## 1. Resumen

Hacer que `decideFeatureReadiness()` aplique `fallbackAction` cuando la confidence real de resolución no satisface el threshold mínimo del feature.

## 2. Problema

La policy de confidence ya está modelada, pero todavía no altera la decisión final aunque el caller aporte una confidence insuficiente.

## 3. Objetivo

Activar el gating por confidence reutilizando la `fallbackAction` ya definida por feature.

## 4. Alcance

- comprobar `actualResolutionConfidence` contra el threshold requerido;
- degradar o bloquear usando `fallbackAction` cuando sea insuficiente;
- cubrir casos representativos con tests unitarios focalizados.

## 5. Fuera de alcance

- propagación del contexto de confidence desde los handlers del servidor;
- mensajes UX detallados sobre insufficiency;
- cambios en la resolución del query engine.

## 6. Requisitos

- R1. El gating por confidence solo aplica cuando el readiness semántico ya es suficiente.
- R2. La acción debe reutilizar `fallbackAction` del feature.
- R3. La validación debe ser ejecutable y centrada en `featureReadiness`.

## 7. Criterios de aceptacion

- AC1. `decideFeatureReadiness()` bloquea o degrada por confidence insuficiente.
- AC2. Hover/completion siguen permitiendo confidence baja por su threshold `low`.
- AC3. Existe cobertura unitaria focalizada.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- El gating no debe eclipsar al gating de readiness o latencia existente.
- Documentacion a revisar: `docs/done-log.md`.