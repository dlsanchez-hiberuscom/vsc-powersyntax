# Tasks 012 - Semantic Tokens

**Estado histórico:** cerrada y normalizada por B233.

## Implementación retroactivamente trazada

- [x] T1. Registrar `semanticTokens/full` y la `legend` correspondiente en el servidor LSP.
- [x] T2. Implementar `src/server/features/semanticTokens.ts` apoyado en análisis y conocimiento ya publicados.
- [x] T3. Mapear tipos base (`variable`, `parameter`, `property`, `function`, `class`, `type`) y modificadores semánticos relevantes.
- [x] T4. Añadir `test/server/unit/semanticTokens.test.ts` para fijar legend y coloreado base.
- [x] T5. Mantener la extracción dentro del hot path reutilizando `DocumentCache` y facts publicados.