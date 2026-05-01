# Spec 242 - Feature decision actual confidence (B157/B158)

## 1. Resumen

Exponer en `FeatureReadinessDecision` la confidence de resolución realmente aportada por el contexto cuando exista.

## 2. Problema

La decisión ya conoce el threshold requerido, pero todavía no puede transportar la confidence real de la consulta para compararla o diagnosticarla.

## 3. Objetivo

Añadir `actualResolutionConfidence` al contexto y a la decisión sin cambiar aún la acción final.

## 4. Alcance

- modelar `resolutionConfidence` en `FeatureReadinessContext`;
- modelar `actualResolutionConfidence` en `FeatureReadinessDecision`;
- propagar el valor cuando exista;
- cubrir la proyección con tests unitarios focalizados.

## 5. Fuera de alcance

- gating por insufficiency;
- reason strings específicos de confidence;
- cambios en handlers del servidor.

## 6. Requisitos

- R1. La confidence real debe ser opcional.
- R2. La decisión debe reflejar el valor contextual sin alterarlo.
- R3. La validación debe ser ejecutable y centrada en `featureReadiness`.

## 7. Criterios de aceptacion

- AC1. `FeatureReadinessContext` acepta `resolutionConfidence`.
- AC2. `FeatureReadinessDecision` expone `actualResolutionConfidence`.
- AC3. Existe cobertura unitaria focalizada.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- La confidence real no debe recomputarse dentro de `featureReadiness`.
- Documentacion a revisar: `docs/done-log.md`.