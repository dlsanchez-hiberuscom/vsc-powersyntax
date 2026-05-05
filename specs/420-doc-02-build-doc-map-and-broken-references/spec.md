# Spec 420 — DOC-02 Build doc map and broken references

## Estado

- done

## Relación backlog

- Backlog item: `DOC-02 — Mapa documental canónico de build, packaging, VSIX, PBAutoBuild y ORCA`

## Objetivo

Consolidar una entrada documental única del carril build/release y retirar referencias rotas hacia documentación inexistente.

## Alcance del corte

- crear `docs/build/README.md` como mapa canónico;
- apuntar arquitectura y estado arquitectónico a superficies reales;
- dejar claro dónde viven packaging, smoke instalada, PBAutoBuild y ORCA.

## Validación mínima esperada

- `npm run test:docs:drift`

## Fuera de alcance

- abrir nuevas docs especializadas vacías;
- cambiar el comportamiento de build/release más allá de la trazabilidad documental.

## Cierre registrado

- `docs/build/README.md` queda consolidado como mapa propietario actual del carril build/release/VSIX/PBAutoBuild/ORCA;
- `docs/architecture.md` y `docs/architecture-status.md` apuntan a superficies documentales existentes en vez de mantener referencias rotas hacia documentación inexistente;
- la decisión actual es no abrir un documento especializado vacío adicional mientras `docs/build/README.md` siga cubriendo el carril de forma suficiente.

## Validación ejecutada

- `npm run test:docs:drift`
