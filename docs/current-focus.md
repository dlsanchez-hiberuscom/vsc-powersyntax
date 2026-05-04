# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

Sin backlog activo abierto.

Estado actual: el dashboard ADR-0001 del catálogo queda cerrado. La spec `417-catalog-adr-compliance-dashboard-gate` consolida un gate reproducible y un reporte determinista fuera del hot path.

La evidencia cerrada que deja este corte es:

- `src/server/features/workspaceCheckCatalogSummary.ts` reconsume `buildCatalogConsistencyReport()` y la merge policy real del query layer para publicar `adrCompliance` con policy recomendada, dominios `manual-primary`, coverage drift y `candidateHotPathViolations`;
- `src/client/workspaceCheckReport.ts` eleva ese estado a findings/status/Markdown del `workspace-check`, de modo que el gate ADR-0001 puede fallar sin abrir otro motor de catálogo;
- `scripts/generate_catalog_consistency_report.cjs` y `npm run report:catalog-consistency` serializan JSON/Markdown determinista en `artifacts/catalog/` usando el mismo baseline contractual `generated-primary-with-manual-overlays`.

---

## 2. Por qué no hay foco activo

- `docs/backlog.md` queda sin ítems `Open` tras cerrar el dashboard ADR-0001 del catálogo;
- abrir nueva implementación sin registrar primero el siguiente ítem rompería la alineación canónica backlog/focus/roadmap/specs;
- el trabajo inmediato permitido es priorizar y registrar el siguiente corte antes de tocar más código funcional.

---

## 3. Trabajo permitido ahora

- registrar el siguiente ítem activo en backlog y reflejarlo en `docs/current-focus.md`, `docs/roadmap.md` y su spec correspondiente antes de nueva implementación;
- mantener verdes `npm run test:docs:drift`, la batería focal del catálogo y `npm run report:catalog-consistency`;
- corregir sólo regresiones demostrables sobre el dashboard ADR-0001, el cierre previo de knowledge packs y los contracts públicos tocados recientemente.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir cierres canónicos recientes sin evidencia ejecutable;
- mezclar nueva funcionalidad semántica mientras el backlog activo siga vacío;
- usar el report ADR-0001 desde `hover`, `completion`, `signatureHelp` o `diagnostics` del hot path.

---

## 5. Criterios para abrir el siguiente foco

- existe un nuevo ítem `Open` en `docs/backlog.md`;
- existe una spec activa para ese ítem;
- `docs/current-focus.md` y `docs/roadmap.md` apuntan al mismo trabajo vivo.

---

## 6. Regla final

No se abre una nueva implementación mientras el backlog activo siga vacío y la priorización canónica no haya sido actualizada.
