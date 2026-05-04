# Spec 390 — B344 DataWindow binding edge cases from plugin_old

## Estado

- done

## Relacion backlog

- Backlog item: `B344 — DataWindow binding edge cases from plugin_old`

## Objetivo

Extraer casos probados de bindings DataWindow `child/report/dddw` desde `plugin_old` como fixtures o reglas sobre el backbone actual (`DataWindowModel`, bindings `DataObject`, `dataWindowPropertyPaths`) sin reintroducir providers cliente ni parsear `.srd` como PowerScript.

## Alcance

- fijar al menos un edge case real de `report -> column -> dddw` sobre los resolvers actuales;
- extender sólo el punto local que impide servir el caso defendible;
- validar el comportamiento tanto en unit como en smoke con `.srd` en disco.

## Fuera de alcance

- portar el subsistema legacy de child links de `plugin_old`;
- abrir un parser paralelo para DataWindow;
- mezclar trabajo de orquestación runtime que pertenece a `B354`.

## Resultado de cierre

- `src/server/features/dataWindowPropertyPaths.ts` deja de tratar `report` resolubles como namespace ciego y expone el root del DataWindow hijo en completion, de modo que `Modify("rpt_orders.")` ya ofrece columnas y `DataWindow` además de permitir continuar a `rpt_orders.status_id.dddw.*` sobre el modelo actual;
- `test/server/unit/completion.test.ts` y `hover.test.ts` fijan el caso anidado `report -> column -> dddw.name` sin ampliar el contrato fuera de bindings deterministas;
- `test/fixtures/datawindow-b344/` y `test/smoke/datawindow-b344.extension.test.ts` añaden una validación sobre `.srd` reales en disco para completion y hover del mismo path, cerrando el gap confirmado por la auditoría de `plugin_old`.

## Validación de cierre

- `npm run test:unit -- --grep "report child y su columna dropdown anidada|report child hacia dddw\.name"`
- `npm run test:smoke -- --grep "report child con columna dropdown"`