# Spec: PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01

## 1. Identificación
- **ID:** PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01
- **Título:** Formalizar SemanticQueryResult detrás de la facade
- **Estado:** Open
- **Prioridad:** P0
- **Orden recomendado:** 05
- **Área:** Arquitectura, Semántica

## 2. Objetivo
Definir de forma estricta y formal el uso de `SemanticQueryResult` como el vehículo (envelope) común para todas las respuestas de la facade hacia los features. Esto eliminará las incoherencias donde diferentes consumers (hover, completion, diagnostics) filtran, rankean y añaden heurísticas propias sobre el mismo constructo del lenguaje.

## 3. Principios de Diseño
1. **Un solo envoltorio (Envelope):** Todas las resoluciones de facade deben devolver un `SemanticQueryResult` en lugar de objetos crudos sin confidence o sourceOrigin. Este envoltorio incluirá de base `target`, `alternatives`, `evidence`, `reasons`, `degradedState` y `cacheability`.
2. **Encapsulamiento del Fallback:** Las degradaciones de fallbacks y reportes parciales (reason codes) no son un concern de hover o completion; deben proveerse desde la facade de manera unificada.
3. **Lazy Evidence:** Para no exceder los performance budgets en features que materializan miles de items (ej. completion), property paths extensos y alternatives se encapsulan de forma lazy o capadas.

## 4. Alcance y Tareas
1. **Redacción de Spec:** Consolidar formalmente este diseño operativo en `docs/specs`.
2. **Migración de SemanticQueryFacade:** Asegurar que los endpoints públicos de la facade retornen este envelope común de manera iterativa sin romper `ResolvedTargetInfo` abruptamente.
3. **Cross-Surface Consumer Adaptation:** Adaptar gradualmente hover, definition y signatureHelp para que consuman `SemanticQueryResult` y reflejen los reason codes generados internamente.

## 5. Criterios de Aceptación
- [ ] La Facade expone `SemanticQueryResult` en lugar de datos no decorados en sus contratos clave.
- [ ] Resoluciones ambiguas (ej. overloads) incluyen explícitamente `reasons` detallando el estado de resolución (fallback, heuristic).
- [ ] El budget payload por consumer se mantiene intacto sin duplicar la evidencia.

## 6. Documentación afectada
- `docs/semantic-design-target.md`
- `docs/symbol-system.md`
- `docs/testing.md`

## 7. Notas de Dependencia
Depende directamente de `PB-ARCH-P0-SEMANTIC-SOURCE-OF-TRUTH-01` y su cierre es pre-requisito para converger las facades en `PB-SEMANTIC-P0-FACADE-CONVERGENCE-01`.
