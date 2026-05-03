# Spec 372: Visual PowerBuilder system object datatypes catalog completion

## Status

Closed.

## Backlog mapping

- B358 — Visual PowerBuilder system object datatypes catalog completion.

## Objective

Cerrar el rail visual curado del catálogo PowerBuilder bajo `manual/visual/`, separando ventanas, controles estándar, Ribbon y OLE visual del runtime/nonvisual, y dejando owner groups, builtins y ancestros nativos alineados con el catálogo estable.

## Implemented scope

- `src/server/knowledge/system/manual/visual/` se materializa en siete slices (`visualObjects.ts`, `textControls.ts`, `listControls.ts`, `drawingControls.ts`, `dataControls.ts`, `ribbonControls.ts`, `oleVisualControls.ts`) y `manual/visual/index.ts` publica un agregador estable de categorías + entries para el rail visual.
- `src/server/knowledge/system/manual/index.ts` recompone `system-object-datatypes` desde visual + runtime, manteniendo estable el dominio público sin volver a depender de un archivo monolítico interno.
- `src/server/knowledge/system/manual/runtime/systemTypes.ts` queda reducido al carril runtime/nonvisual: `Application` pasa a `Objetos de sistema`, `OLEControl`/`OLECustomControl` salen del bloque OLE runtime y `B359` arranca ya con separación visual/runtime explícita.
- `src/server/knowledge/system/manual/ownerTypes/visualOwnerTypes.ts`, `src/server/knowledge/system/nativeAncestors.ts` y `src/server/parsing/grammar.ts` alinean owner groups, ancestros nativos y `PB_BUILTIN_TYPES` para tipos visuales avanzados (`MDIFrame`, `MDIClient`, `MenuCascade`, `RibbonApplicationMenu`, `RibbonPanelItem`, `WindowActiveX`, etc.).
- `test/server/unit/visualCatalogDatatypes.test.ts` fija el cierre de B358 y `test/server/unit/catalogV2.test.ts` sigue bloqueando regresiones del catálogo combinado.
- `docs/architecture.md`, `docs/testing.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/roadmap.md`, `docs/backlog.md`, `docs/current-focus.md` y `docs/done-log.md` quedan alineados con el nuevo cierre.

## Out of scope

- Completar runtime/nonvisual e integración moderna (`B359`).
- Introducir nuevos dominios o factories fuera de `systemObjectDatatype()`.
- Reabrir el query hot path ya endurecido en `B365`.
- Añadir diagnostics/rules nuevas fuera de la alineación de tipos, owner groups y ancestros nativos.

## Acceptance evidence

- El carril visual queda troceado bajo `manual/visual/` y el agregador manual estable recompone visual + runtime sin imports frágiles.
- `resolveDatatype()` resuelve tipos visuales representativos, incluidos `MDIClient`, `RibbonApplicationMenu`, `OLEControl` y `WindowActiveX`.
- `Application` queda fuera del rail visual y `OLEControl`/`OLECustomControl` quedan clasificados como `OLE visual`.
- Owner groups, ancestros nativos y `PB_BUILTIN_TYPES` permanecen alineados para los tipos visuales avanzados cerrados en B358.
- `npm run build:test` compila limpio.
- `npm run test:unit -- --grep "visualCatalogDatatypes|catalogV2"` pasa limpio.