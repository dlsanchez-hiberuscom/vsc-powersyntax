# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`POST-AUDIT / P0-P1 — Normalización documental y convergencia semántica`

Cadena obligatoria vigente:
```txt
docs/backlog.md -> Superseded: PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01
                -> Open: PB-AUDIT-P0-DOC-ALIGNMENT-01
                -> Open: PB-ARCH-P0-SEMANTIC-DESIGN-TARGET-01
                -> Open: PB-ARCH-P0-SEMANTIC-CONFORMANCE-TESTS-01
                -> Open: PB-SEMANTIC-P0-FACADE-CONVERGENCE-01
                -> Open: PB-SEMANTIC-P1-CONFIDENCE-CONTRACT-01
```

Estado de éxito:
```txt
- El backlog, current-focus, roadmap y done-log vuelven a contar el mismo estado real.
- La arquitectura objetivo deja claro que SemanticQueryFacade es target de convergencia, no rollout completo ya cerrado.
- Hover y definition mantienen su slice read-only actual sin reabrir hot paths, mientras completion/signature/references/semantic tokens/document surfaces documentan o reducen sus excepciones.
- Current Object Context, Diagnostics Explainability, Object Explorer y runtime self-test tienen owners, tests y budgets explícitos.
- Confidence, riesgo y frameworkKnowledgeConflict dejan de publicarse con certeza alta no defendible en surfaces read-only.
```

---

## 2. Por qué este foco está activo

- La ultra auditoría semántica dejó cerrados varios hechos técnicos, pero encontró deriva entre backlog, current-focus, roadmap, architecture-status y done-log.
- El runtime ya tiene un slice semántico útil y prudente, pero la adopción de `SemanticQueryFacade` sigue siendo parcial y desigual según consumer.
- Algunas surfaces read-only ya forman parte del producto público y hoy carecen de owner documental, budgets o matrices de prueba tan explícitas como los hot paths clásicos.
- `docs/semantic-design-target.md` y la sección `4.2` de `docs/backlog.md` añaden el plan PB-ARCH; el foco inmediato sigue siendo normalización documental y conformance antes de implementar slices nuevos.
- El siguiente trabajo valioso no es reabrir caché o discovery, sino alinear contrato semántico, confidence y documentación para evitar falsas promesas del producto.

---

## 3. Trabajo permitido ahora

- Normalizar owners documentales en `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md`, `docs/done-log.md`, `docs/architecture-status.md` y `docs/architecture-implementation-map.md`.
- Converger consumer por consumer hacia un contrato semántico común, empezando por completion/signature help frente al slice ya activo de hover/definition.
- Corregir publication de confidence y conflictos advisory en semantic tokens, Current Object Context y reportes read-only.
- Asignar tests, troubleshooting y budgets a Object Explorer, Current Object Context, Diagnostics Explainability, Impact Analysis, Safe Edit Plan y runtime self-test.

---

## 4. Trabajo fuera de foco

- Reescrituras amplias del parser PowerScript o de la capa de caché estabilizada.
- Soporte total de DataWindow, SQL avanzado o conditional compilation más allá del slice defendible ya documentado.
- Nuevos carriles ORCA/PBAutoBuild o nuevas surfaces write-enabled sin depender antes del contrato semántico y los owners read-only.

---

## 5. Siguiente paso recomendado

- Cerrar primero la normalización documental, enlazar el target semántico desde los owner docs y fijar la matriz real de adopción de `SemanticQueryFacade`, `queryContext`, `SemanticQueryResult` y `confidence` por consumer antes de abrir trabajo semántico más amplio.

---

## 6. Regla final

No se marca ningún bloque como cerrado sin código, pruebas, docs y validación final reproducible. La documentación no puede presentar como soporte productivo lo que hoy solo es evidencia parcial, heuristic-only o target arquitectónico.

