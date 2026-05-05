# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

Bloque 13 — Multi-Audit Final, Symbol System & Catalog Localization Roadmap.

Cadena obligatoria vigente:

```txt
.github/prompts/implement-spec.bloque13.prompt.md
```

Estado de continuidad:

```txt
bloques devtools serving + hover cerrados; Bloque 3 cerrado con completion inicial ligera y `completionItem/resolve`; Bloque 4 cerrado con LSP serving alignment; Bloque 5 cerrado con `SemanticQueryFacade`, modelos resueltos comunes y owners semánticos documentados; Bloque 6 cerrado con `DataWindowFastContext`, adapters DataWindow comunes y frontera `.srd` validada; Bloque 7 cerrado con `src/server/presentation`, ViewModels/formatters LSP y guard de ownership de presentación; Bloque 8 cerrado con guards de boundaries, handler registration y growthPolicy para composition roots; Bloque 9 cerrado con matriz de lanes, hot path harness, payload/cache/performance gates y docs drift reforzado; Bloque 10 cerrado con `docs/ai-orchestration.md`, prompts `*.prompt.md`, contratos públicos read-only AI y guards de gobernanza; Bloque 11 cerrado con release readiness reforzado, VSIX instalado validado, owners `docs/release.md`/`docs/troubleshooting.md` y workflow CI headless; Bloque 12 cerrado con `plugin_old` reference-only, inventario de deuda técnica y cleanup controlado sin retiradas físicas
```

Auditorías transversales activas:

```txt
ninguna
```

---

## 2. Por qué este foco está activo

- El usuario promovió explícitamente la cadena de prompts de Bloques 3-13.
- Los Bloques 3, 4, 5, 6, 7, 8, 9, 10, 11 y 12 quedaron cerrados y movidos a `done-log.md` con validación completa.
- El siguiente foco de la cadena es ejecutar la auditoría final multi-surface, revisar sistema de símbolos y ordenar la hoja de ruta de localización de catálogo.

---

## 3. Trabajo permitido ahora

- Cerrar el Bloque 13 con cambios pequeños, pruebas focales y docs afectadas.
- Mantener verdes los carriles existentes de legacy isolation, docs drift, architecture rapid y performance mientras se avanza.
- No abrir trabajo posterior hasta dejar el estado del Bloque 13 explícito y verificable.

---

## 4. Trabajo fuera de foco

- Marcar el Bloque 13 como completado sin cubrir y validar sus ítems restantes.
- Mezclar trabajo posterior dentro del mismo diff si el cambio no tiene validación acotada.
- Introducir scans, IO o parse completo en hot paths interactivos.
- Reabrir resolvers semánticos, `KnowledgeBase`, `DataWindowFastContext`, parsers, composition roots, testing gates o la capa `presentation` salvo que Bloque 13 lo requiera con guard explícito.

---

## 5. Siguiente paso recomendado

- Implementar el primer corte verificable del Bloque 13 según el prompt activo.
- Ejecutar validación focal después de cada corte y no tocar `done-log.md` hasta cerrar el bloque completo.

---

## 6. Regla final

No se marca ningún bloque como cerrado sin código, pruebas, docs y validación final reproducible.
