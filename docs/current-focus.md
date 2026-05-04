# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B375 — Generated localization compatibility with regenerated catalog IDs`

Estado actual: `B374` queda cerrada. El rail `localization/` ya publica cobertura por dominio, overlays incompletos e intentos de traducir anchors técnicos (`signatureLabel`/`parameterName`) dentro de `buildCatalogConsistencyReport().localization`; además, `npm run report:catalog-localization` serializa un snapshot determinista en `artifacts/catalog/` y `docs/localization.md` fija el workflow incremental para authoring español.

La evidencia vigente que deja `B374` es:

- `src/server/knowledge/system/localization/localizationResolver.ts` y `types.ts` publican ya `domainCoverage`, `incompleteOverlays` e `invalidParameterTargets`, calculados sobre targets canónicos por dominio y sin reabrir el hot path interactivo;
- `src/server/knowledge/system/consistency.ts` integra ese audit ampliado bajo `buildCatalogConsistencyReport().localization`, de modo que authoring roto o anchors técnicos traducidos fallen como gobernanza de catálogo antes de llegar a hover/completion/signatureHelp;
- `scripts/generate_catalog_localization_report.cjs`, `package.json` y `artifacts/catalog/catalogLocalizationReport.generated.{json,md}` dejan disponible un workflow determinista de snapshot para cobertura/localización revisada por dominio;
- `test/server/unit/catalogLocalization.test.ts` y `catalogConsistency.test.ts` fijan cobertura por dominio, ausencia de issues en el baseline real y detección sintética de overlays incompletos o parámetros/signatures mal anclados.

Con authoring y coverage ya visibles, el siguiente cuello de botella pasa a ser de compatibilidad con regeneración: toca abrir `B375` para garantizar que un cambio de IDs en `generated` no rompa silenciosamente overlays ya revisados y deje una ruta clara de migración/recuperación.

---

## 2. Por qué es prioritario

Con `B374` cerrada, la cobertura existe; ahora hay que blindar la estabilidad de esos overlays ante regeneraciones del catálogo:

- `B375` debe garantizar que una regeneración de `generated` no deje overlays válidos pero invisibles por drift de `targetId`, ni obligue a reparaciones manuales ciegas tras cada refresh del catálogo oficial;
- el nuevo reporte de `B374` ya detecta authoring incompleto o anchors técnicos traducidos, así que el riesgo dominante restante es compatibilidad/migración de identidad entre generaciones del catálogo;
- si no se cierra ahora, el rail español puede empezar a acumular cobertura revisada sobre IDs frágiles antes de tener una policy de supervivencia explícita.

---

## 3. Trabajo permitido ahora

- añadir fixtures/tests que simulen cambio de IDs en `generated` y prueben recuperación o fallo honesto por `targetKey`;
- reforzar el reporte para distinguir drift recuperable frente a overlays realmente rotos;
- documentar la regla operativa `targetId` vs `targetKey`, más cualquier script o rutina segura de migración fuera del hot path.

---

## 4. Trabajo fuera de foco

No abrir salvo regresión demostrable:

- reabrir `B374` salvo regressión real del reporte, del workflow de artifacts o del gate sobre anchors técnicos;
- ampliar locales nuevos o abrir una tanda masiva de traducciones antes de fijar la compatibilidad con regeneración;
- tocar consumers visibles o remezclar serving/documentation locale en el runtime interactivo;
- resolver migraciones en hot path, con scans por request o con heurísticas no preindexadas.

---

## 5. Criterios de salida del foco actual

- una regeneración de `generated` no rompe silenciosamente overlays revisados;
- existe fixture que demuestra recuperación por `targetKey` o fallo claro cuando la identidad ya no es recuperable;
- la policy `targetId` vs `targetKey` y la ruta de migración quedan documentadas;
- `testing`, `architecture`, `backlog`, `done-log` y `current-focus` quedan alineados.

---

## 6. Siguiente foco natural

1. `B378` — AI PowerBuilder context pack and token budget contract.
2. `B379` — Explain diagnostic tool and suggested safe fix contract.
3. `B380` — Explain system symbol and catalog lookup tool for AI.

---

## 7. Regla final

`B375` debe construir sobre `B371 + B372 + B373 + B374`. No toca reabrir serving ni authoring visible: toca blindar identidad/migración de overlays frente a regeneración del catálogo sin sacrificar trazabilidad ni meter coste en hot path.
