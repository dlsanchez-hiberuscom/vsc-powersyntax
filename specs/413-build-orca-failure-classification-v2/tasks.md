# Tasks — Spec 413

## Estado

- done

## Tasks

- [x] Clasificar fallos comunes de build moderno desde `buildTooling`, `buildRunner` y `buildProblems` ya publicados.
- [x] Clasificar fallos comunes de ORCA legacy desde `orcaTooling`, `orcaRunner` y el `build-orca-journal` persistido.
- [x] Exportar `failureClassification` dentro de `build-orca-snapshot.json` sin filtrar rutas crudas en mensajes ORCA.
- [x] Alinear troubleshooting, catálogo de reglas, testing y artefactos canónicos de backlog/foco/cierre con el nuevo slice.

## Riesgos residuales registrados

- La clasificación sigue siendo read-only y resumida; para análisis exhaustivo todavía hay que revisar `last-*-ledger.json`, el journal técnico y los logs originales cuando exista evidencia suficiente.
- `packaging-disabled` sigue describiendo la política pública actual; no habilita EXE/PBD/DLL ni cambia el alcance write-enabled de ORCA.