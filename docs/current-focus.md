# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01` — Wave 08: cerrar observabilidad runtime bounded, corpus sintético y gates 10k sin romper `release:verify`.

Cadena actual:
```txt
docs/backlog.md -> Partial: PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01 (boundary mínimo y receipt bounded listos; convergencia cross-consumer pendiente)
docs/backlog.md -> Partial: PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01 (PerformanceEvent, scheduler/worker/event-loop/memory snapshots y showStats bounded ya operativos)
docs/backlog.md -> Partial: PB-PERF-P2-10K-SEMANTIC-CORPUS-01 (generador determinístico smoke/medium/10k y lanes performance ya operativos; dominios/mutaciones extra pendientes)
docs/backlog.md -> Partial: PB-CI-P1-REGRESSION-GATE-10K-PAYLOAD-01 (smoke sintético en release gate y lane 10k opcional/report-only ya operativos; fail mode y payload depth pendientes)
docs/backlog.md -> Partial: PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01 (scanner cableado; falta cobertura de más providers en el contrato de métricas)
docs/backlog.md -> Partial: PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01 (validación local directa lista; CI VS Code y corpus ampliado pendientes)
docs/done-log.md -> Closed: PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01, PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01, PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01, PB-ARCH-P0-SEMANTIC-QUERY-RESULT-CONTRACT-HARDENING-01
```

Estado de éxito alcanzado (spec blocks waves 2-4, primera oleada):
```txt
- `PerformanceEvent` ya existe como contrato homogéneo y `InteractiveServingStatsTracker` conserva compatibilidad con el snapshot histórico.
- `powerbuilder.showStats` publica snapshots bounded de scheduler lanes, worker pool, event loop, memory pressure y `performanceEvents` sin crear otra surface paralela.
- `runtimeCommandHandlers` ya emite `PerformanceEvent` bounded también para `powerbuilder.objectExplorerProjection` y `powerbuilder.semanticWorkspaceManifest`, de modo que el contrato ya no vive sólo en el pipeline interactivo inicial.
- El snapshot agregado de `performanceEvents` ya publica `p50/p95/p99` para `durationMs`, `payloadBytes` y `resultSize` sobre la ventana bounded actual.
- El gate rápido `npm run test:performance:gate` ya incorpora `performance/synthetic-corpus-smoke` y produce artefactos JSON estables.
- Existe un generador determinístico reusable para corpus `smoke`, `medium` y `10k`, ya enriquecido con `.sra/.srf/.srp` y con un mutador deterministic `while-indexing`, además de un lane `10k` opcional/report-only con artefacto propio.
- Las validaciones focales del slice Wave 08 están verdes: unit runtime, gate rápido, smoke sintético y lane 10k opcional.
```

Pendiente para cerrar esta oleada:
```txt
- Extender `PerformanceEvent` a más providers/workloads adicionales ahora que ya cubre también commands read-only de runtime, sin mezclar refactor estructural con instrumentación.
- Enriquecer el corpus sintético con más superficie native/external y conectar más consumers reales al corpus mutado sin duplicar datasets.
- Decidir cuándo el lane `synthetic-10k` pasa de `report-only` a `fail mode` dentro del workflow opcional y cuándo los percentiles actuales se convierten en ratchets de budget.
```

---

## 2. Por qué este foco está activo

- Wave 08 es el primer punto donde performance deja de ser evidencia fragmentada y pasa a contrato observable con artefactos reproducibles.
- El release gate necesitaba una muestra sintética controlada antes de abrir refactors mayores de runtime/indexing.
- El lane 10k tenía que existir como carril opcional separado para proteger `release:verify` y, al mismo tiempo, evitar una falsa sensación de escala cubierta.

---

## 3. Trabajo permitido ahora

- Extender instrumentación runtime bounded provider por provider.
- Mantener verdes `build:test`, unit focales, `test:performance:gate`, `test:performance:10k:nightly`, `test:architecture:rapid` y `test:docs:drift`.
- Endurecer el corpus sintético y los artefactos JSON sin volver obligatorio el lane 10k en cada PR.

---

## 4. Trabajo fuera de foco

- Reescrituras amplias del scheduler, worker pool o providers sólo para instrumentar métricas.
- Convertir `release:verify` en dependiente obligatorio del lane 10k completo.
- Introducir corpora gigantes versionados dentro del repositorio.

---

## 5. Siguiente paso recomendado

- Ampliar la emisión de `PerformanceEvent` a más hot paths y conectar payload/result metrics donde aún falten.
- Enriquecer el corpus sintético con mutaciones y dominios adicionales antes de promover el lane 10k a `fail mode`.

---

## 6. Regla final

No se marca ningún bloque como cerrado sin código, pruebas, docs y validación final reproducible. La documentación no puede presentar como soporte productivo lo que hoy solo es evidencia parcial, heuristic-only o target arquitectónico.

