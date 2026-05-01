# Spec 241 - Feature decision required confidence (B157/B158)

## 1. Resumen

Exponer en `FeatureReadinessDecision` la confidence mínima requerida por el feature para que la policy quede visible en la propia decisión.

## 2. Problema

Ya existe un getter de threshold por feature, pero la decisión devuelta por `decideFeatureReadiness()` todavía no lo refleja explícitamente.

## 3. Objetivo

Añadir `requiredResolutionConfidence` al contrato de decisión sin cambiar aún la acción calculada.

## 4. Alcance

- modelar `requiredResolutionConfidence` en `FeatureReadinessDecision`;
- poblarla en `decideFeatureReadiness()`;
- cubrir la nueva surface con tests unitarios focalizados.

## 5. Fuera de alcance

- confidence real aportada por contexto;
- gating por insufficiency;
- cambios en handlers del servidor.

## 6. Requisitos

- R1. La surface debe reutilizar el getter de threshold ya existente.
- R2. Debe estar siempre presente en la decisión.
- R3. La validación debe ser ejecutable y centrada en `featureReadiness`.

## 7. Criterios de aceptacion

- AC1. `FeatureReadinessDecision` expone `requiredResolutionConfidence`.
- AC2. `decideFeatureReadiness()` lo rellena para cualquier feature.
- AC3. Existe cobertura unitaria focalizada.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- La decisión debe seguir siendo canónica y autocontenida.
- Documentacion a revisar: `docs/done-log.md`.