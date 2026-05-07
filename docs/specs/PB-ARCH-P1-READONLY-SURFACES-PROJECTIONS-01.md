# Spec: PB-ARCH-P1-READONLY-SURFACES-PROJECTIONS-01

## 1. Identificación
- **ID:** PB-ARCH-P1-READONLY-SURFACES-PROJECTIONS-01
- **Título:** Read-only surfaces as projections
- **Estado:** Done
- **Prioridad:** P1
- **Área:** Arquitectura, Performance
- **Absorbe:** PB-RUNTIME-P1-READONLY-SURFACES-GATES-01

## 2. Objetivo
Convertir las interfaces Object Explorer, Current Object Context, Explainability, Workspace Reports, AI Bundles y Runtime Self-Test en "proyecciones acotadas" del snapshot actual y del query service. Esto implica no recalcular toda la información ni bloquear VSCode.

## 3. Criterios de Aceptación Cumplidos
1. Se establecieron los budgets formales para las Read-Only Surfaces en `docs/performance-budget.md` (Sección 7.7).
2. Se implementaron los tests y validaciones funcionales interactivos en el Runtime Self-Test (`src/client/runtimeSelfTest.ts` y `extension.ts` con probes).
3. La interfaz `SemanticQueryFacade` garantiza el budget de ejecución y el confidence propagation, sirviendo a las proyecciones.
