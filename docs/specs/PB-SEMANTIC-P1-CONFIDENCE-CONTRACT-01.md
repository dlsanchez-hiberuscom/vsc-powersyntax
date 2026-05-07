# Spec: PB-SEMANTIC-P1-CONFIDENCE-CONTRACT-01

## 1. Identificación
- **ID:** PB-SEMANTIC-P1-CONFIDENCE-CONTRACT-01
- **Título:** Calibrar confidence y conflictos cross-surface sin valores fijos no defendibles
- **Estado:** Done
- **Prioridad:** P1
- **Orden recomendado:** 11
- **Área:** Semántica, Confidence

## 2. Objetivo
Eliminar hardcodes de `confidence = high` en consumidores semánticos (especialmente en `semanticTokens` y `Current Object Context`) para asegurar que un token coloreado o un framework conflict no sobreprometan certeza estática cuando la evidencia proviene de dispatch dinámico, herencia o heurísticas.

## 3. Principios de Diseño
1. **Confianza honesta:** Ninguna feature (Semantic Tokens, Current Object Context, Explainability) debe forzar `confidence: 'high'` a ciegas.
2. **Dependencia del Query Contract:** La confianza en un symbol target debe depender exclusivamente del `ResolvedTargetInfo` devuelto por `SemanticQueryFacade` o `resolveTargetEntityDetailed`.

## 4. Alcance y Tareas
1. `src/server/features/semanticTokens.ts`: Sustituir `resolveTargetEntity` por `resolveTargetEntityDetailed` o usar `SemanticQueryFacade.resolveReference`. Pasar el `confidence` real del `ResolvedTargetInfo` a `TokenEntry` y de ahí a `SemanticTokenViewModelEntry`. Los local scopes y properties nativos tendrán `high`, pero heurísticas globales tendrán `low` o `medium`.
2. `src/server/features/currentObjectContext.ts`: En `buildCurrentObjectFrameworkKnowledgeConflict`, usar `queryContext?.resolutionConfidence` (o omitirlo) en vez de inyectar `'high'` rígidamente.
3. Tests: Actualizar o arreglar tests que esperaban 'high' ciegamente en contexts o semantic tokens.

## 5. Criterios de Aceptación
- `semanticTokens.ts` captura y expone la confidence producida por el core semántico.
- `currentObjectContext.ts` usa la evidence real para el framework conflict.
- Pruebas read-only de explain y health reportan confianzas degradadas honestamente (e.g. en literales).
