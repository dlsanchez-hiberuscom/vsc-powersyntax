# Spec 429 — BL-03 Embedded and dynamic SQL coverage

## Estado

- done

## Relación backlog

- Backlog item: `BL-03 — Ampliar modelo de SQL embebido y dynamic SQL`

## Objetivo

Ampliar el modelo seguro de SQL embebido para cubrir más statements oficiales sin fingir semántica cuando no exista evidencia.

## Alcance del corte

- ampliar `findSqlRegions()` con statements SQL embebidos oficiales adicionales;
- mantener una heurística conservadora que no confunda llamadas normales con SQL;
- cubrir el cambio en tests de `sqlRegions` y `currentObjectContext`.

## Validación mínima esperada

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/sqlRegions.test.js out/test/server/unit/currentObjectContext.test.js --grep "SQL|embedded SQL|sqlRegions"`

## Fuera de alcance

- abrir un parser SQL general;
- fingir resolución semántica detallada sobre SQL dinámico complejo.

## Cierre registrado

- `findSqlRegions()` detecta ahora de forma conservadora statements oficiales adicionales (`CONNECT`, `DECLARE`, `FETCH`, `OPEN`, `CLOSE`, `PREPARE`, `COMMIT`, `ROLLBACK`) sin tratar llamadas normales con paréntesis como SQL embebido;
- el contrato público de `embeddedSqlAnchors` acepta ya esos keywords adicionales sin abrir un parser SQL general;
- `currentObjectContext` proyecta los nuevos anchors reales sin perder la degradación honesta ni confundir invocaciones normales como `open(w_child)`.

## Validación ejecutada

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/sqlRegions.test.js out/test/server/unit/currentObjectContext.test.js --grep "SQL|embedded SQL|sqlRegions"`