# Spec: PB-ARCH-P1-SEMANTIC-TOKENS-EVIDENCE-CONTRACT-01

## 1. Identificación
- **ID:** PB-ARCH-P1-SEMANTIC-TOKENS-EVIDENCE-CONTRACT-01
- **Título:** Semantic Tokens evidence contract
- **Estado:** Done
- **Prioridad:** P1
- **Área:** Arquitectura, Semántica
- **Absorbe:** PB-SEMANTIC-P1-CONFIDENCE-CONTRACT-01

## 2. Objetivo
Separar tokens visuales estructurales de tokens semánticamente resueltos y eliminar la `confidence` hardcodeada. Los tokens estructurales no deben aparentar semántica fuerte y los tokens resueltos deben propagar su `confidence` generada por el query service de forma honesta.

## 3. Criterios de Aceptación
- La función `provideSemanticTokens` respeta el nivel de confianza arrojado por `resolveTargetEntityDetailed`.
- Se introdujo `confidence` en el `TokenEntry` local, y su view model mapper usa la confianza propagada o `high` para resoluciones estructurales (locales o catalogadas).
- Tests de `confidenceCalibration` validados y consistentes.
