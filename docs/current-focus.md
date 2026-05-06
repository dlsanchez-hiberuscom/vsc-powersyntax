# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`SYMBOL-MODEL-01 — Canonical symbol model and facade contract`

Cadena obligatoria vigente:

```txt
docs/backlog.md#symbol-model-01--canonical-symbol-model-and-facade-contract
```

Estado de continuidad tras la auditoría final:

```txt
cadena de auditorías Bloque 13 cerrada; el siguiente trabajo promovido es el primer slice derivado para formalizar contrato canónico de símbolos sobre los owners ya existentes, sin reabrir runtime ni catálogo fuera de spec.
```

Auditorías transversales activas:

```txt
ninguna
```

---

## 2. Por qué este foco está activo

- El usuario promovió explícitamente la cadena de prompts de Bloques 3-13.
- Los Bloques 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 y 13 quedaron cerrados y movidos a `done-log.md` con validación registrada.
- La auditoría final dejó como primer follow-up accionable el contrato canónico de símbolos y facade, documentado en [symbol-system.md](symbol-system.md).

---

## 3. Trabajo permitido ahora

- Ejecutar `SYMBOL-MODEL-01` con cambios pequeños, pruebas focales y docs afectadas.
- Mantener verdes los carriles existentes de legacy isolation, docs drift, architecture rapid y performance mientras se avanza.
- No abrir slices posteriores de localización, semantic tokens o DataWindow enrichments hasta cerrar el contrato base o promoverlos explícitamente.

---

## 4. Trabajo fuera de foco

- Reabrir la auditoría final ya cerrada sin evidencia nueva.
- Mezclar trabajo posterior dentro del mismo diff si el cambio no tiene validación acotada.
- Introducir scans, IO o parse completo en hot paths interactivos.
- Reabrir resolvers semánticos, `KnowledgeBase`, `DataWindowFastContext`, parsers, composition roots, testing gates o la capa `presentation` sin spec focal y guard explícito.

---

## 5. Siguiente paso recomendado

- Diseñar el contrato `CanonicalSymbol` mínimo, su relación con `buildSymbolKey`, sourceOrigin/confidence y los consumidores LSP que deben entrar por `SemanticQueryFacade`.
- Ejecutar validación focal después de cada corte y actualizar [done-log.md](done-log.md) sólo al cerrar el slice.

---

## 6. Regla final

No se marca ningún bloque como cerrado sin código, pruebas, docs y validación final reproducible.
