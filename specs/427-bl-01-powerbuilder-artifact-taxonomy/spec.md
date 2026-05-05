# Spec 427 — BL-01 PowerBuilder artifact taxonomy

## Estado

- done

## Relación backlog

- Backlog item: `BL-01 — Normalizar taxonomía de archivos y artifacts PowerBuilder`

## Objetivo

Ampliar y normalizar la taxonomía de artefactos PowerBuilder reconocidos explícitamente por el producto, incluyendo `pbg`, `pbr` y `psr`, sin servirlos como PowerScript ni romper el hot path.

## Alcance del corte

- clasificar explícitamente `pbg`, `pbr` y `psr` en la taxonomía compartida;
- registrar esos artefactos en discovery sin tratarlos como source ni como markers;
- cubrir la clasificación y el no-serving con tests unitarios focales.

## Validación mínima esperada

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/powerbuilderFiles.test.js out/test/server/unit/workspace.test.js`

## Fuera de alcance

- parsear `pbg`, `pbr` o `psr` como PowerScript;
- abrir todavía taxonomías más amplias fuera del trio inmediato pedido por `BL-01`.

## Cierre registrado

- la taxonomía compartida clasifica ya `pbg` como build/support, `pbr` como resource y `psr` como report, sin tratarlos como source ni como markers;
- discovery registra estos artefactos como categorías explícitas del workspace sin romper el hot path ni convertirlos en PowerScript servible;
- los tests focales de taxonomía y workspace confirman clasificación, no-serving y exposición en discovery summary.

## Validación ejecutada

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/powerbuilderFiles.test.js out/test/server/unit/workspace.test.js`