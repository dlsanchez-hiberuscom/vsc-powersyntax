# Spec 240 - Feature confidence sufficiency helper (B157/B158)

## 1. Resumen

Introducir en `featureReadiness` un helper que determine si una confidence de resolución satisface el threshold mínimo de un feature.

## 2. Problema

Ya existen orden canónico y thresholds por feature, pero todavía falta un punto único que responda la pregunta operativa: “¿esta confidence es suficiente para este feature?”.

## 3. Objetivo

Exportar un helper puro de suficiencia reutilizable por futuras decisions y gates.

## 4. Alcance

- añadir `isResolutionConfidenceSufficient(feature, confidence)`;
- basarlo en el comparador y en el getter de thresholds existentes;
- cubrir el helper con tests unitarios focalizados.

## 5. Fuera de alcance

- activación de gates automáticos;
- cambios en handlers del servidor;
- mensajes UX finales.

## 6. Requisitos

- R1. El helper debe reutilizar los helpers ya introducidos.
- R2. La suficiencia debe ser inclusiva respecto al threshold.
- R3. La validación debe ser ejecutable y centrada en `featureReadiness`.

## 7. Criterios de aceptacion

- AC1. Existe `isResolutionConfidenceSufficient()`.
- AC2. El helper responde correctamente para features laxos y estrictos.
- AC3. Existe cobertura unitaria focalizada.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- La suficiencia debe quedar definida una sola vez antes de introducir gating en runtime.
- Documentacion a revisar: `docs/done-log.md`.