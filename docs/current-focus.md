# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01` — `OLEADA 2 / P0 — Conectar registry al pipeline`

Cadena actual:
```txt
docs/backlog.md -> Partial: PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01 (registry creado, conexión pipeline pendiente)
docs/backlog.md -> Partial: PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01 (descriptors creados)
docs/backlog.md -> Partial: PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01 (state machine creada)
docs/backlog.md -> Partial: PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01 (generation guard creado)
docs/backlog.md -> Partial: PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01 (bounded discovery creado)
docs/backlog.md -> Partial: PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01 (contratos definidos)
docs/backlog.md -> Partial: PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01 (tests creados)
docs/backlog.md -> Partial: PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01 (resultState creado)
docs/done-log.md -> Closed: PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01, PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01, PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01, PB-ARCH-P0-SEMANTIC-QUERY-RESULT-CONTRACT-HARDENING-01
```

Estado de éxito alcanzado (spec blocks waves 2-4, primera oleada):
```txt
- DiagnosticRuleRegistry creado con 20 reglas registradas con tier/domain/lane/budget/advisory.
- SemanticTokensResultState con delta/resultId versionado y evicción LRU creado.
- CacheDescriptorRegistry con 12 descriptores de InteractiveServingCacheFeature creado.
- IndexStateInvariants con ALLOWED_TRANSITIONS + PersistenceWriteQueue serializada creado.
- GenerationGuard + SchedulerGenerationRegistry para commits stale creados e integrados en diagnosticScheduler.
- discovery.ts ampliado con DISCOVERY_MAX_CONCURRENCY, WarmStartManifest, discoverWorkspaceBounded.
- providerAdapterContract.ts: contrato para 13 features con allowsFullScan: false.
- 76 tests nuevos (65 unit + 11 integration) añadidos; build:test limpio.
```

Pendiente para cerrar esta oleada:
```txt
- Conectar DiagnosticRuleRegistry al pipeline de buildDiagnosticsForDocument.
- Asegurar Tier 0/1 se ejecuten inmediatos en open/change sin Tier 3/4.
- Integrar GenerationGuard en scheduler interactivo de references/semanticTokens.
- Conectar SemanticTokensResultState al proveedor real de semantic tokens.
- Integrar PROVIDER_ADAPTER_CONTRACTS en el scanner de conformance.
- Cross-validar CacheDescriptorRegistry con cacheKeyContract.ts.
- Integrar IndexStateInvariants en workspaceIndexer real.
```

---

## 2. Por qué este foco está activo

- La primera oleada P0 quedó cerrada en orden estricto: testing docs, gate estructural, snapshot readonly y hardening del query contract.
- Las oleadas 2-4 de spec blocks establecen la infraestructura base: registry de reglas, caches, state machine de índice, guards de generación y contratos de providers.
- El siguiente paso es conectar DiagnosticRuleRegistry al pipeline ejecutable en buildDiagnosticsForDocument.

---

## 3. Trabajo permitido ahora

- Completar la conexión de DiagnosticRuleRegistry al pipeline de buildDiagnosticsForDocument.
- Integrar GenerationGuard en scheduler interactivo de references/semanticTokens.
- Mantener verde `npm run build:test`, `npm run test:architecture:rapid` y el baseline documental.
- Conectar SemanticTokensResultState y ProviderAdapterContracts a sus proveedores reales.

---

## 4. Trabajo fuera de foco

- Nuevas oleadas P2 mientras los ítems P0/P1 actuales sigan parciales.
- Reescrituras amplias de parser, cache o providers fuera de la ruta mínima necesaria para los ítems activos.
- Apertura de submodelos DataWindow/SQL o surfaces read-only adicionales antes de completar la integración actual.

---

## 5. Siguiente paso recomendado

- Conectar `DiagnosticRuleRegistry` al pipeline de `buildDiagnosticsForDocument` para cerrar `PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01`.
- Integrar `GenerationGuard` en los schedulers interactivos restantes.

---

## 6. Regla final

No se marca ningún bloque como cerrado sin código, pruebas, docs y validación final reproducible. La documentación no puede presentar como soporte productivo lo que hoy solo es evidencia parcial, heuristic-only o target arquitectónico.


