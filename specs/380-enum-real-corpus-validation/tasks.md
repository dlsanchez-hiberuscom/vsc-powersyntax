# Tasks — Spec 380 Enum real-corpus validation

- [x] Añadir extracción y reporte corpus-driven de valores con `!` en `src/server/features/catalogCorpusValidation.ts`.
- [x] Cubrir el builder y la clasificación sintética en `test/server/unit/catalogCorpusValidation.test.ts`.
- [x] Añadir `test/server/performance/enumCatalogCorpusValidation.smoke.test.ts` para PFC Solution, STD_FC_OrderEntry y legacy PBL dump.
- [x] Optimizar la smoke para evitar diagnostics completos por archivo y mantener una duración razonable.
- [x] Registrar el baseline real (`13068 total / 1554 catalogados / 5296 unknown / 6214 false positives / 4 out-of-context / 0 candidates`).
- [x] Encaminar las familias de gaps observadas a `B368/B370` sin tocar el catálogo oficial.
- [x] Actualizar backlog/current-focus/done-log/testing/performance-budget/corpus baseline para reflejar el cierre.