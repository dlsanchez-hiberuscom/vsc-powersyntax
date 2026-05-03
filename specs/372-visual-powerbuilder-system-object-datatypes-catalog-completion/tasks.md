# Tasks — Spec 372 Visual PowerBuilder system object datatypes catalog completion

- [x] Materializar `manual/visual/` en slices pequeñas por ownership (`visualObjects`, `textControls`, `listControls`, `drawingControls`, `dataControls`, `ribbonControls`, `oleVisualControls`).
- [x] Integrar el rail visual en `manual/visual/index.ts` y en el agregador manual estable sin reintroducir un `systemTypes.ts` monolítico.
- [x] Reclassificar `Application` fuera del rail visual y mover `OLEControl`/`OLECustomControl` al carril `OLE visual`.
- [x] Alinear owner groups, ancestros nativos y `PB_BUILTIN_TYPES` para tipos visuales avanzados representativos.
- [x] Añadir validación focalizada de resolución para `MDIFrame`, `MDIClient`, `MenuCascade`, `RibbonApplicationMenu`, `RibbonPanelItem`, `OLEControl` y `WindowActiveX`.
- [x] Cerrar B358 en spec, backlog, done-log, current-focus y documentación canónica afectada.