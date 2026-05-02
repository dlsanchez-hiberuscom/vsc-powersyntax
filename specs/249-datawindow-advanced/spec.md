# Spec 249 - DataWindow avanzado (B042)

## 1. Resumen

Abrir el soporte avanzado de DataWindow por encima del safe mode y del catalogo basico ya cerrados, sin mezclar `.srd` con PowerScript normal.

## 2. Estado real actual

- `B117`, `B139`, `B041` y `B212` ya cubrian safe mode minimo, refuerzo legacy-safe, catalogo/navegacion basicos y bridge `DataObject/Retrieve`.
- Esta spec queda ejecutada con un primer slice avanzado real: `DataWindowModel` reutilizable, relaciones `report(name=... dataobject=...)`, `column.dddw.name` y property paths `Describe/Modify(...DataWindow.Table.Select)` sobre bindings `DataObject` literales y deterministas.
- `B042` puede cerrarse como trabajo ya materializado y documentado.

## 3. Objetivo

Modelar expresiones, property blocks, controles y relaciones adicionales de DataWindow como sublenguaje propio, apoyado en un modelo puro reutilizable y mappers LSP en el borde.

## 4. Alcance

- separar modelo/query DataWindow puro de providers LSP cuando se amplie la capacidad;
- cubrir expresiones y propiedades avanzadas resolubles en `.srd`;
- enriquecer controles y relaciones sin stores globales paralelos;
- mantener degradacion honesta para contenido dinamico, ambiguo o incompleto.

## 5. Fuera de alcance

- parsear `.srd` como PowerScript;
- resolver `dw.Object...` completo, que pertenece a `B081`;
- automatizacion write-enabled sobre DataWindow;
- soporte ORCA/PBL o PBAutoBuild.

## 6. Criterios de aceptacion

- AC1. Existe un modelo DataWindow puro reutilizable por hover/definition/symbols sin duplicar semantica por feature.
- AC2. Al menos una capacidad avanzada real queda cubierta con tests unitarios focalizados.
- AC3. DataWindow mantiene `sourceOrigin`, readiness/evidence/confidence y degradacion segura.
- AC4. Docs canónicas distinguen safe mode, catalogo basico y soporte avanzado real.

Estado de cierre:

- AC1 cumplido por `src/server/features/dataWindowModel.ts` reutilizado desde `dataWindowLegacySafeMode`, `hover`, `definition` y `documentSymbols`.
- AC2 cumplido por los tests focalizados de `dataWindowLegacySafeMode`, `hover`, `definition` y `documentSymbols`.
- AC3 cumplido: las rutas avanzadas solo se sirven sobre bindings `DataObject` literales y child chains deterministas; el resto degrada sin fingir soporte.
- AC4 cumplido con actualización de backlog, current-focus, architecture, testing, developer workflows, guía técnica y done-log.

## 7. Documentacion afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/architecture.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/testing.md`
- `docs/developer-workflows.md`

## 8. Validacion requerida

- `npm run test:unit -- --grep "DataWindow|dataWindow"`
- `npm run test:integration` si cambia serving LSP visible
- `npm run test:performance` si cambia parsing o hot path de `.srd`
