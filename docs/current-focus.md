# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01` — `OLEADA 3 / P1 — Conectar invariants y persistencia al indexer real`

Cadena actual:
```txt
docs/backlog.md -> Partial: PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01 (registry cableado; performance gate por tier pendiente)
docs/backlog.md -> Partial: PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01 (cross-val ejecutable lista; métricas pendientes)
docs/backlog.md -> Partial: PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01 (state machine creada)
docs/backlog.md -> Partial: PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01 (generation guard creado)
docs/backlog.md -> Partial: PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01 (bounded discovery creado)
docs/backlog.md -> Partial: PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01 (scanner cableado; métricas/matriz pendientes)
docs/backlog.md -> Partial: PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01 (validación local directa lista; CI VS Code pendiente)
docs/backlog.md -> Partial: PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01 (provider cableado; validación host/range pendiente)
docs/done-log.md -> Closed: PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01, PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01, PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01, PB-ARCH-P0-SEMANTIC-QUERY-RESULT-CONTRACT-HARDENING-01
```

Estado de éxito alcanzado (spec blocks waves 2-4, primera oleada):
```txt
- DiagnosticRuleRegistry gobierna `buildDiagnosticsForDocument` por tier y valida cobertura de códigos emitidos.
- SemanticTokensResultState gobierna `previousResultId`/fallback full y se evacúa en close/change.
- CacheDescriptorRegistry queda cruzado con `cacheKeyContract.ts`; `prefix` ya participa en builder+matcher y completion-resolve usa `documentFingerprint` documental.
- IndexStateInvariants con ALLOWED_TRANSITIONS + PersistenceWriteQueue serializada creado.
- GenerationGuard + SchedulerGenerationRegistry para commits stale creados e integrados en diagnosticScheduler.
- discovery.ts ampliado con DISCOVERY_MAX_CONCURRENCY, WarmStartManifest, discoverWorkspaceBounded.
- providerAdapterContract.ts queda validado por conformance scanner (campos requeridos, cachePolicy/sourceScope y `allowsFullScan: false`).
- Las suites focales directas pasan en entorno sandbox: 100 unit + 11 integration.
```

Pendiente para cerrar esta oleada:
```txt
- Integrar IndexStateInvariants en workspaceIndexer real.
- Integrar PersistenceWriteQueue en los writes reales de persistencia/checkpoint.
- Integrar GenerationGuard en los schedulers interactivos restantes (`references`/semantic tokens host path).
- Cablear `discoverWorkspaceBounded` y warm start real con receipts/progreso y validación corpus.
- Ejecutar los lanes `vscode-test`/CI reales para la matriz LSP y semantic tokens host.
```

---

## 2. Por qué este foco está activo

- La primera oleada P0 quedó cerrada en orden estricto: testing docs, gate estructural, snapshot readonly y hardening del query contract.
- Las oleadas 2-4 de spec blocks establecen la infraestructura base: registry de reglas, caches, state machine de índice, guards de generación y contratos de providers.
- El cableado de diagnostics, semantic tokens, contracts de provider y key symmetry ya está aplicado.
- El siguiente cuello de botella real sigue siendo conectar invariantes/persistencia al `workspaceIndexer` y al warm start verdadero.

---

## 3. Trabajo permitido ahora

- Completar la conexión de `IndexStateInvariants` y `PersistenceWriteQueue` al indexer/persistencia reales.
- Integrar GenerationGuard en scheduler interactivo de `references` y validar host path de semantic tokens.
- Mantener verde `npm run build:test`, `npm run test:architecture:rapid` y el baseline documental.
- Mantener alineadas las evidencias locales directas y la validación CI/VS Code pendiente.

---

## 4. Trabajo fuera de foco

- Nuevas oleadas P2 mientras los ítems P0/P1 actuales sigan parciales.
- Reescrituras amplias de parser, cache o providers fuera de la ruta mínima necesaria para los ítems activos.
- Apertura de submodelos DataWindow/SQL o surfaces read-only adicionales antes de completar la integración actual.

---

## 5. Siguiente paso recomendado

- Conectar `IndexStateInvariants` y `PersistenceWriteQueue` al `workspaceIndexer`/checkpoint real para cerrar `PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01`.
- Mantener `PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01` y `PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01` como los siguientes carriles de wiring.

---

## 6. Regla final

No se marca ningún bloque como cerrado sin código, pruebas, docs y validación final reproducible. La documentación no puede presentar como soporte productivo lo que hoy solo es evidencia parcial, heuristic-only o target arquitectónico.

