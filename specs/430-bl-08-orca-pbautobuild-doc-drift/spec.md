# Spec 430 — BL-08 ORCA/PBAutoBuild doc drift

## Estado

- done

## Relación backlog

- Backlog item: `BL-08 — Corregir deriva documental ORCA/PBAutoBuild`

## Objetivo

Cerrar la deriva documental residual del carril ORCA/PBAutoBuild declarando un documento propietario suficiente y retirando la necesidad de rutas especializadas inexistentes.

## Alcance del corte

- declarar explícitamente si `docs/build/README.md` es el documento propietario actual del carril build/ORCA/PBAutoBuild;
- confirmar que no quedan referencias rotas activas a documentos especializados inexistentes;
- cerrar el gate con `docs-drift` en verde.

## Validación mínima esperada

- `npm run test:docs:drift`

## Fuera de alcance

- abrir un documento especializado nuevo sin contenido propietario real;
- reabrir el carril build/release ya absorbido por `DOC-02`.

## Cierre registrado

- `docs/build/README.md` declara de forma explícita que es el documento propietario actual del carril build/release/ORCA/PBAutoBuild mientras no exista contenido especializado que justifique una división posterior;
- no quedan referencias activas a rutas especializadas inexistentes y la documentación de arquitectura/build sigue apuntando a superficies reales;
- el gate residual queda cerrado con `docs-drift` en verde y permite promover la planificación posterior sin reabrir el carril build documental.

## Validación ejecutada

- `npm run test:docs:drift`