# Tasks — Spec 417

## Estado

- done

## Tasks

- [x] Reconsumir `buildCatalogConsistencyReport()` desde `workspaceCheckCatalogSummary` para publicar un resumen `adrCompliance` del catálogo vivo.
- [x] Elevar ese estado a findings/status/Markdown del `workspace-check` sin abrir otro rail semántico ni tocar el hot path interactivo.
- [x] Publicar un reporte determinista `npm run report:catalog-consistency` bajo `artifacts/catalog/`.
- [x] Validar el slice con compile focal, suites de catálogo/workspace-check, `report:catalog-consistency` y `npm run test:docs:drift`.

## Riesgos residuales registrados

- El gate reutiliza el consistency report y la merge policy runtime actuales; si el contrato `generated-primary-with-manual-overlays` cambia, esta surface debe reconsumir esa decisión en vez de abrir un checker paralelo.
- El backlog activo queda vacío tras este cierre; antes de abrir nueva implementación debe registrarse el siguiente ítem vivo y alinear `backlog/current-focus/roadmap/specs`.