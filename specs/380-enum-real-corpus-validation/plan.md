# Plan — Spec 380 Enum real-corpus validation

## Phase 1 — Construir el reporte reusable

- [x] Extender la surface de `catalogCorpusValidation.ts` con extracción y resumen corpus-driven de valores con `!`.
- [x] Fijar la clasificación base en unit (`official-known`, `curated-known`, `candidate`, `false-positive`, `out-of-context`, `unknown`).

## Phase 2 — Ejecutar la validación real

- [x] Añadir una smoke/perf que recorra PFC Solution, STD_FC_OrderEntry y legacy PBL dump con breakdown por corpus.
- [x] Reducir el coste del extractor para que la smoke cierre en tiempos razonables sin depender de diagnostics completos por archivo.
- [x] Registrar el baseline real de counts y duraciones de scan.

## Phase 3 — Cierre canónico

- [x] Alinear `docs/testing.md`, `docs/performance-budget.md`, `test/corpora/README.md` y `test/results/003-real-corpora-baseline.md` con el baseline real.
- [x] Sacar `B364` del backlog activo, mover el cierre a `docs/done-log.md` y devolver el foco a `B353`.
- [x] Encaminar los gaps detectados a la cadena abierta `B368/B370` sin promocionarlos al catálogo.