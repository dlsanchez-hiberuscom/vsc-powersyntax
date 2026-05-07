# Spec: PB-ARCH-P0-SEMANTIC-CONFORMANCE-TESTS-01

## 1. Identificación
- **ID:** PB-ARCH-P0-SEMANTIC-CONFORMANCE-TESTS-01
- **Título:** Crear gates de conformidad semántica cross-surface
- **Estado:** Open
- **Prioridad:** P0
- **Orden recomendado:** 02
- **Área:** Arquitectura, Testing

## 2. Objetivo
Añadir pruebas de conformidad estrictas para proteger el diseño semántico objetivo. Estas pruebas deben asegurar que los `providers` utilicen de forma exclusiva el `SemanticQueryFacade`, que las llaves de caché (`cache keys`) contemplen origen y evidencia, y que ninguna superficie materialice repositorios de metadatos en memoria sin los debidos topes (caps).

## 3. Principios de Diseño
1. **Source of Truth Único:** Ningún feature handler o report list (hover, definition, completion) debe acceder al AST, al Symbol System o al KnowledgeBase evadiendo la SemanticQueryFacade, excepto en casos explícitamente anotados como fallbacks tolerados.
2. **Validación Cross-Surface:** Un mismo constructo de lenguaje debe resolver de idéntica manera (con el mismo owner, definition y evidence) si se solicita desde Hover, Definition, Completion o Signature Help.
3. **Budget Protection:** Las listas no limitadas están prohibidas en hot paths. Los test deben fallar si se detectan clones (vía `structuredClone` o similares) sobre colecciones del KnowledgeBase en read-only projections.

## 4. Alcance y Tareas
1. **Definición de Suite:** Iniciar el archivo `test/server/unit/semanticConformance.test.ts` que establecerá las aserciones de arquitectura (AST estático del propio repositorio o inspección reflexiva).
2. **Validación de Cache Keys:** Asegurar contractualmente (vía test) que `CacheKeyContract` incluya `epoch`, `sourceOrigin` y `documentSemanticVersion`.
3. **Cross-Surface Golden:** Integrar las aserciones de completitud para que la semántica básica (ej. llamada a una función global) sea unificada.

## 5. Criterios de Aceptación
- [ ] Spec redactada en `docs/specs/PB-ARCH-P0-SEMANTIC-CONFORMANCE-TESTS-01.md`.
- [ ] La suite de tests de arquitectura estática falla si un provider (en `src/server/features`) evade la Facade sin un exception anotado.
- [ ] Los tests validan explícitamente el contrato de `cache key`.
- [ ] Integración con la suite de pruebas unitarias (`npm run test:unit`).

## 6. Documentación afectada
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/architecture-status.md`

## 7. Notas de Dependencia
El cierre de esta spec y sus pruebas habilita con seguridad `PB-ARCH-P0-SEMANTIC-SOURCE-OF-TRUTH-01`.
