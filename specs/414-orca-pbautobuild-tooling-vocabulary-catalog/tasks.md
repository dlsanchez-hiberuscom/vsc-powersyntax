# Tasks — Spec 414

## Estado

- done

## Tasks

- [x] Publicar un slice manual `tooling-symbols` bajo `powerbuilder-tooling` para ORCA, PBAutoBuild, env vars y settings de tooling.
- [x] Integrar el dominio nuevo en `manual-core` y en el consistency report sin romper counts ni provenance.
- [x] Blindar `resolveLanguageSymbol()` para que ese vocabulario no contamine el hot path interactivo del lenguaje.
- [x] Alinear arquitectura, workflows, testing y artefactos canónicos de backlog/foco/cierre con el nuevo slice.

## Riesgos residuales registrados

- `tooling-symbols` queda disponible por acceso explícito al catálogo, pero no implica aún consumers adicionales fuera del system catalog y del consistency report.
- Cualquier surface futura que quiera usar este dominio debe seguir tratándolo como vocabulario de tooling fuera del lenguaje y no reintroducirlo en hover/completion genéricos.