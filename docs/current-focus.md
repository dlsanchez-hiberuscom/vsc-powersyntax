# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`PHASE-6C/P2 — Refinamiento de Runtime`

Cadena obligatoria vigente:
```txt
docs/backlog.md -> Done: CACHE-P0-DOCUMENT-CACHE-LRU-EVICTION-01
                -> Done: CACHE-P0-SERVING-KEY-DOCUMENT-EPOCH-01
                -> Done: CACHE-P0-MEMORY-PRESSURE-GRADUATED-POLICY-01
                -> Done: CACHE-P1-FROZEN-REFS-HOT-PATH-01
                -> Done: CACHE-P1-READINESS-DISCOVERY-DEADLOCK-01
                -> Done: CACHE-P1-JOURNAL-AUTOCOMPACTION-01
                -> Done: CACHE-P1-KB-DEPENDENCY-INVALIDATION-01
                -> Open: PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01
```

Estado de éxito:
```txt
- Auditoría de arquitectura de caché completada al 100%.
- Infraestructura de caché estabilizada, resiliente y lista para manejar +10,000 archivos sin interbloqueos ni doom-loops.
- Enfoque actual: Refinar la experiencia de usuario y el ruido visual en la capa LSP interactiva.
```

---

## 2. Por qué este foco está activo

- La capa de caché, indexación incremental y el journal persistente ya están blindados.
- Hemos solucionado las posibles cascadas de OOM (Out Of Memory) que tumbaban el serving cache de VS Code en entornos grandes.
- Al tener un runtime ultra rápido, ahora debemos centrarnos en la experiencia de usuario (Developer Experience): mejorar la calidad de los diagnósticos, reducir el ruido informativo y ajustar los ciclos de vida de patrones específicos de PowerBuilder (PFC, runtime estricto, etc.).

---

## 3. Trabajo permitido ahora

- Atacar `PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01`.
- Ajustar severidad de diagnostics para `dataobject-dynamic` y `transaction-binding-dynamic`.
- Mantener la información útil de riesgos/confidence en el hover, pero evitar ensuciar la ventana de Problems por defecto.

---

## 4. Trabajo fuera de foco

- Modificaciones estructurales profundas en la recién estabilizada capa de Caché (`DocumentCache`, `KnowledgeBase`, `ServingCache`), a menos que sea estrictamente necesario para resolver un bug crítico introducido durante la fase anterior.
- Modificar el core de parsing semántico.

---

## 5. Siguiente paso recomendado

- Configurar o ajustar la emisión de diagnósticos en el servidor LSP para reducir severidades de `warning`/`error` a puramente informativas en hover para casos que no son errores reales de compilación.

---

## 6. Regla final

No se marca ningún bloque como cerrado sin código, pruebas, docs y validación final reproducible.

