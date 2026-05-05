# Spec 426 — AUDIT-VSIX Post-fix evidence closure

## Estado

- done

## Relación backlog

- Backlog item: `AUDIT-VSIX — Cierre post-fix del fallo real del VSIX instalado`

## Objetivo

Cerrar con trazabilidad completa la auditoría del fallo real del VSIX instalado sin degradar el lane release.

## Alcance del corte

- registrar causa raíz y fix en la frontera cliente/servidor;
- sostener unit guard y smoke instalada contra la clase real de regresión;
- cerrar solo junto a `VSIX-01` y a la documentación canónica ya alineada.

## Validación mínima esperada

- `npx mocha --ui tdd out/test/server/unit/commandOwnership.test.js`
- `npm run package:vsix`
- `npm run verify:vsix-contents`
- `npm run package:vsix:list`
- `npm run test:smoke:installed-vsix`

## Fuera de alcance

- abrir fixes nuevos no vinculados a la regresión del VSIX instalado;
- degradar el carril release mientras se documenta el cierre.

## Cierre registrado

- la auditoría queda cerrada con causa raíz, fix y guardrails trazados entre cliente, servidor, smoke instalada y empaquetado del VSIX;
- `commandOwnership.test` ahora puede ejecutarse en Node puro con `mocha` directo sin depender del módulo `vscode`, eliminando el falso rojo que impedía registrar evidencia canónica del fix;
- la lane release instalada permaneció verde tras repetir la batería mínima obligatoria completa.

## Validación ejecutada

- `npx mocha --ui tdd out/test/server/unit/commandOwnership.test.js`
- `npm run package:vsix`
- `npm run verify:vsix-contents`
- `npm run package:vsix:list`
- `npm run test:smoke:installed-vsix`
