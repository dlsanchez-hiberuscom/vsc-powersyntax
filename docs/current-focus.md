# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01` — `OLEADA 2 / P0 — Diagnostics por tiers` — Partial

Cadena obligatoria vigente:
```txt
docs/backlog.md -> Partial: PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01
docs/backlog.md -> Partial: PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01, PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01
docs/backlog.md -> Partial: PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01, PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01
docs/backlog.md -> Partial: PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01
```

Estado de éxito parcial (spec blocks waves 2-4):
```txt
- DiagnosticRuleRegistry creado con 20 reglas registradas con tier/domain/lane/budget/advisory.
- SemanticTokensResultState con delta/resultId versionado y evicción LRU creado.
- CacheDescriptorRegistry con 12 descriptores de InteractiveServingCacheFeature creado.
- IndexStateInvariants con ALLOWED_TRANSITIONS + PersistenceWriteQueue serializada creado.
- GenerationGuard + SchedulerGenerationRegistry para commits stale creados.
- diagnosticScheduler.ts actualizado con generation guard.
- discovery.ts ampliado con DISCOVERY_MAX_CONCURRENCY, WarmStartManifest, discoverWorkspaceBounded.
- providerAdapterContract.ts: contrato para 13 features con allowsFullScan: false.
- 65 unit tests + 11 integration tests pasan; build:test limpio.
```

Pendiente para cerrar P0:
```txt
- Conectar DiagnosticRuleRegistry al pipeline de buildDiagnosticsForDocument.
- Integrar GenerationGuard en el scheduler interactivo de referencias/semanticTokens.
- Tests de performance gate para diagnostics por tier.
```

---

## 2. Por qué este foco está activo

- La primera oleada P0 quedó cerrada en orden estricto: testing docs, gate estructural, snapshot readonly y hardening del query contract.
- Las oleadas 2-4 de spec blocks establecen la infraestructura base: registry de reglas, caches, state machine de índice, guards de generación y contratos de providers.
- El siguiente paso es conectar DiagnosticRuleRegistry al pipeline ejecutable en buildDiagnosticsForDocument.

---

## 3. Trabajo permitido ahora

- Implementar en orden estricto el registry tiered de diagnostics y mantener cerrado el carril P0 anterior.
- Mantener verde `npm test`, `npm run test:architecture:rapid` y el baseline documental mientras avance la cadena P0.
- Ajustar sólo la ruta mínima necesaria en `buildDiagnosticsForDocument`, metadata de reglas/tier y adapters de compatibilidad diagnóstica.

---

## 4. Trabajo fuera de foco

- Nuevas oleadas P1/P2 mientras la secuencia P0 siga abierta o el baseline global esté rojo.
- Reescrituras amplias de parser, cache o providers fuera de la ruta mínima necesaria para el P0 activo.
- Apertura de submodelos DataWindow/SQL o surfaces read-only adicionales antes de cerrar el contrato base de conformance/snapshot/query.

---

## 5. Siguiente paso recomendado

- Ejecutar `PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01` sobre `buildDiagnosticsForDocument`, el registry de reglas y los adapters compat para separar tiers, budgets, caps y metadata por rule.

---

## 6. Regla final

No se marca ningún bloque como cerrado sin código, pruebas, docs y validación final reproducible. La documentación no puede presentar como soporte productivo lo que hoy solo es evidencia parcial, heuristic-only o target arquitectónico.


