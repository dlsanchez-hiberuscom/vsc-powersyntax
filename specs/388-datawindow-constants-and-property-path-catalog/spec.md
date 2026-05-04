# Spec 388 — B327 DataWindow constants and property path catalog

## Estado

- done

## Relacion backlog

- Backlog item: `B327 — DataWindow constants and property path catalog`

## Objetivo

Catalogar constantes, property paths y nombres de propiedades DataWindow reutilizables por `Describe/Modify/Object`, manteniéndolos separados del parser PowerScript y sirviéndolos sólo con contexto DataWindow defendible.

## Alcance

- ampliar `datawindow-properties` con property paths reales observables en corpus/tests;
- poblar `datawindow-constants` con source-of-truth oficial/curado cuando exista evidencia defendible;
- reconsumir el catálogo desde providers DataWindow existentes en vez de seguir ampliando hardcodes locales.

## Fuera de alcance

- reparsear `.srd` como PowerScript;
- mezclar constantes o property paths DataWindow con el vocabulario PowerScript global;
- cerrar ítems posteriores de semantic tokens o explainability en la misma slice.

## Resultado de cierre

- `datawindow-constants` queda materializado como dominio `generated` derivado del rail oficial de `enumerated-types` / `enumerated-values` con source URLs `datawindow_reference`, sin introducir una segunda fuente de verdad ni duplicar el catálogo global;
- `queryService.ts` y `SystemCatalog.ts` exponen queries owner-scoped para ese dominio, mantienen `listValuesForEnumeratedType()` aislado del dominio nuevo y reutilizan el orden visible ya fijado por el rail enumerado general;
- `completion.ts` y `signatureHelp.ts` consumen `datawindow-constants` solo en contextos member-scoped DataWindow (`RowsMove`, `Retrieve`, `Update`, etc.), mientras `Describe/Modify/Object` siguen reconsumiendo `datawindow-properties` y fijan el root completion `DataWindow.T -> Table` junto al slice previo `DataWindow.Syntax`.

## Validación de cierre

- `npm run test:unit -- --grep "unit/(systemCatalog|completion|signatureHelp)"`