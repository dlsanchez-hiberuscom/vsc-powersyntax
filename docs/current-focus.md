# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01` — `OLEADA 2 / P0 — Diagnostics por tiers`

Cadena obligatoria vigente:
```txt
docs/backlog.md -> Active: PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01
docs/done-log.md -> Closed prerequisites: PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01, PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01, PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01, PB-ARCH-P0-SEMANTIC-QUERY-RESULT-CONTRACT-HARDENING-01
```

Estado de éxito:
```txt
- El backlog activo ya no arrastra cierres documentales pendientes y el done-log absorbe el cierre de `PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01`.
- El gate de conformance ya es estructural, emite JSON estable y queda integrado en `npm run test:architecture:rapid`.
- `KnowledgeBase.publishedState` ya es observablemente readonly en query paths y `scopeIndex` vive en una proyección versionada con owner explícito.
- `SemanticQueryResult` ya refleja la policy efectiva real consumida por cada surface crítica y publica metadata base de `source/degraded`.
- El siguiente P0 puede arrancar sobre diagnostics porque la cadena previa testing/conformance/snapshot/query quedó cerrada y documentada.
```

---

## 2. Por qué este foco está activo

- La primera oleada P0 quedó cerrada en orden estricto: testing docs, gate estructural, snapshot readonly y hardening del query contract.
- El siguiente cuello de botella ahora es `buildDiagnosticsForDocument`, que sigue mezclando tiers/reglas/advisory sin registry ejecutable ni metadata homogénea por rule.
- La transición de foco ya no depende de abrir nuevos contratos semánticos base, sino de convertir diagnostics en un pipeline por tiers con budgets y caps explícitos.

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


