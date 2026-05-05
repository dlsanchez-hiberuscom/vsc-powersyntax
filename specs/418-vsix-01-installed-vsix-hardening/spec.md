# Spec 418 — VSIX-01 Installed VSIX hardening

## Estado

- done

## Relación backlog

- Backlog item: `VSIX-01 — Hardening del VSIX instalado y del arranque real del runtime`

## Objetivo

Cerrar canónicamente la regresión real del VSIX instalado, conservando la separación cliente/servidor de comandos y la verificación del arranque real del runtime empaquetado.

## Alcance del corte

- mantener el fix de ownership de commands entre cliente y servidor;
- mantener la smoke instalada sensible a `startFailed` y a degradación de readiness;
- sostener la lane de packaging/release mientras se cierran docs y auditoría transversal.

## Validación mínima esperada

- `npx mocha --ui tdd out/test/server/unit/commandOwnership.test.js`
- `npm run package:vsix`
- `npm run verify:vsix-contents`
- `npm run package:vsix:list`
- `npm run test:smoke:installed-vsix`

## Fuera de alcance

- features nuevas ajenas al fallo real del VSIX;
- cambios de runtime sin relación con la frontera command ownership / startup.

## Cierre registrado

- causa raíz confirmada: `powerbuilder.inspectHierarchy` y otros comandos UI del cliente se anunciaban también desde `executeCommandProvider.commands`, provocando doble registro durante el arranque LSP del VSIX instalado;
- el servidor ya no anuncia comandos UI del cliente en `SERVER_EXECUTE_COMMANDS`, el guard de ownership sigue cubriendo IDs duplicados y solapamiento cliente/servidor, y la smoke instalada sigue fallando si reaparecen `startFailed`, `already exists` o `readiness=error`;
- la batería mínima obligatoria quedó verde con evidencia ejecutada real en el carril VSIX instalado.

## Validación ejecutada

- `npx mocha --ui tdd out/test/server/unit/commandOwnership.test.js`
- `npm run package:vsix`
- `npm run verify:vsix-contents`
- `npm run package:vsix:list`
- `npm run test:smoke:installed-vsix`
