# Spec: PB-SEMANTIC-P0-FACADE-CONVERGENCE-01

## 1. Identificación
- **ID:** PB-SEMANTIC-P0-FACADE-CONVERGENCE-01
- **Título:** Convergencia del contrato SemanticQueryFacade entre consumers interactivos
- **Estado:** Open
- **Prioridad:** P0
- **Orden recomendado:** 06
- **Área:** Semántica, Architecture

## 2. Objetivo
Unificar y aplicar funcionalmente el contrato de resolución read-only (`SemanticQueryFacade`) para todas las superficies interactivas (Hover, Definition, Completion, Signature Help, References). Se busca que un mismo constructo resuelva de manera idéntica en cualquier proveedor, eliminando lógicas de fallback o heurísticas aisladas por feature.

## 3. Principios de Diseño
1. **Delegación Estricta:** Ningún *consumer interactivo* realizará búsquedas de catálogo, evaluaciones de dependencias ni validaciones de jerarquía; delegarán dichas tareas a la Facade.
2. **Excepciones Documentadas:** Si algún feature, por diseño, no puede engranar en la Facade general (ej. análisis de references offline extendidos), debe quedar justificado de forma explícita en el registro de arquitectura.
3. **Consistencia Cross-Surface:** Un `hover` sobre un objeto y un `completion` del mismo deben mostrar exactamente el mismo `owner` y `confidence`.

## 4. Alcance y Tareas
1. **Redactar Spec:** Crear este documento oficial.
2. **Matriz de features:** Fijar los features interactivos que migrarán (Hover y Definition ya usan la facade, faltan Completion y Signature Help).
3. **Unificación de Evidence:** Retornar `SemanticQueryResult` de manera uniforme (depende de `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01`).

## 5. Criterios de Aceptación
- Hover y definition siguen en verde sin afectar presupuestos (budgets).
- Completion y signature help usan el mismo contrato o proyección autorizada de la Facade.
- Consumers migrados comparten resolución semántica unificada.

## 6. Documentación afectada
- `docs/architecture.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/testing.md`

## 7. Notas de Dependencia
Depende directamente de `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01`.
