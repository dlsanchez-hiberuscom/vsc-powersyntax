# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

Sin backlog activo abierto.

Estado actual: el endurecimiento semántico **AUDIT-04** queda cerrado. El core de resolución ahora respeta estrictamente el orden de Appeon, soporta `::`, `This.`, `Parent.` y aplica filtrado de visibilidad (`public`, `protected`, `private`) en todos los niveles.

La evidencia cerrada que deja este corte es:

- `src/server/knowledge/scopePriority.ts` centraliza la prioridad canonical: `Local -> Shared -> Global -> Instance`.
- `src/server/knowledge/resolution/semanticQueryService.ts` implementa `::` forzado, resolución calificada porvisibilidad y desambiguación determinista de variables.
- `src/server/features/completion.ts` alinea el autocompletado con la prioridad de scopes y variables globales.
- `test/server/unit/scopePriority.test.ts` garantiza la resolución correcta de `Parent.` y desambiguación de shadowing.

---

## 2. Por qué no hay foco activo

- `docs/backlog.md` tiene el ítem `AUDIT-04` marcado como `Done`.
- El siguiente gran hito (e.g. `AUDIT-01` o `AUDIT-05`) requiere asignación de foco antes de iniciar implementación.
- Se ha verificado que la suite de tests unitarios está en verde (102 passing).

---

## 3. Trabajo permitido ahora

- Registrar el siguiente ítem activo en backlog.
- Mantener verdes `npm run test:unit`.
- Corregir sólo regresiones críticas sobre el motor de resolución semántica recién endurecido.

---

## 4. Trabajo fuera de foco

- Alterar la lógica de visibilidad o resolución sin una spec que lo justifique.
- Introducir cambios en DataWindow mientras no se abra `AUDIT-05`.

---

## 5. Criterios para abrir el siguiente foco

- Existe un nuevo ítem `Open` en `docs/backlog.md`.
- `docs/current-focus.md` apunta al siguiente objetivo de auditoría o feature.

---

## 6. Regla final

No se abre una nueva implementación mientras el backlog activo siga vacío y la priorización canónica no haya sido actualizada.
