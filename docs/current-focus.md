# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

Sin derivados vivos en la fase activa listada del backlog.

Estado actual: `AUDIT-04-DERIVED-007` queda cerrado como no-action validado. `resolveQualifierType` ya reutilizaba `getDocumentEntities(..., hotContext)` y la suite focal ya fijaba que no debe releer `kb.getEntitiesByUri()` cuando `HotContextCache` dispone de `activeEntities`. Con este cierre, la secuencia de derivados activos listada en backlog queda agotada.

La evidencia inmediata que deja este cierre es:

- `semanticQueryService.test` ya valida que `resolveQualifierType` reutiliza `activeEntities` del `HotContextCache` para el documento activo.
- No quedan ítems `AUDIT-04-DERIVED-*` abiertos en la sección de fase activa del backlog.
- `docs/backlog.md`, `docs/done-log.md` y `docs/current-focus.md` vuelven a reflejar el cierre completo de la secuencia activa auditada.

---

## 2. Por qué este es el foco activo

- No queda otro derivado activo en la fase listada del backlog.
- Cualquier foco siguiente debe salir del backlog canónico general o de una nueva priorización explícita, no de esta secuencia ya agotada.
- El documento mantiene el estado operativo inmediato sin inventar trabajo fuera de backlog.

---

## 3. Trabajo permitido ahora

- No reabrir `AUDIT-04-DERIVED-005`, `006` o `007` salvo regresión nueva observable.
- Si se abre un foco nuevo, anclarlo primero en el backlog canónico antes de tocar código.
- Mantener `docs/backlog.md`, `docs/current-focus.md` y `docs/done-log.md` sincronizados con cualquier nueva priorización.

---

## 4. Trabajo fuera de foco

- Inventar un nuevo derivado activo sin registro explícito en backlog.
- Reabrir la secuencia auditada ya cerrada sin una regresión verificable.

---

## 5. Criterios para abrir el siguiente foco

- Debe existir un ítem activo explícito en backlog o una nueva priorización canónica equivalente.
- El siguiente derivado vivo del backlog queda promovido explícitamente como foco.

---

## 6. Regla final

No se inventa un foco nuevo mientras la sección activa del backlog no lo declare de forma explícita.
