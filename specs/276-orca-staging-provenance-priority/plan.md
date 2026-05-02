# Plan - Spec 276 ORCA staging provenance and source priority (B192)

1. Fijar una prueba estrecha donde `orca-staging` entre antes que el source real y comprobar que el runtime todavía no prioriza provenance.
2. Corregir el punto raíz mínimo en `KnowledgeBase` y `semanticQueryService`, reutilizando el contrato compartido de `sourceOrigin`.
3. Revalidar manifest/read-only y mover el foco documental a `B193` sin abrir import/compile.