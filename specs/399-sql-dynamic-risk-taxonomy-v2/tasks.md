# Tasks — Spec 399 / B312

- [x] Reutilizar la señal `dynamic-sql` ya existente en `dynamicStringReferences` sin abrir un parser SQL nuevo.
- [x] Añadir `dynamic-sql:n` en `riskReasons` solo cuando la evidencia SQL sea defendible y conservar `dynamic-strings:n` como contador genérico.
- [x] Propagar esa taxonomía a `safeEditPlan` vía `impactAnalysis` sin ensanchar los casos dinámicos no SQL.
- [x] Validar el slice con `invocationRiskModel`, `safeEditPlan`, `codeActions` y `powerBuilderTechnicalDebtReport`.