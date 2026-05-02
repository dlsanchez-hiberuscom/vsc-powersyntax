# Plan - Spec 256 (B162)

## 1. Hipótesis local

La desalineación relevante no se decide en el scheduler ni en el transporte LSP, sino en `documentSymbols`, donde se cruzan `typeBlocks/sections`, facts/scopes y el árbol visible. Si ahí añadimos reconciliación explícita, cerramos el gap sin abrir otro motor.

## 2. Pasos

1. Introducir un resultado detallado de extracción con reporte de reconciliación.
2. Definir findings reason-coded para drift entre parser, snapshot y LSP.
3. Registrar warnings en servidor antes de publicar el outline.
4. Añadir tests para snapshot sano e inconsistente.

## 3. Riesgos controlados

- no convertir drift interno en error visible para el usuario sin evidencia suficiente;
- no duplicar lógica del parser ni del binder fuera del backbone existente;
- no romper `.srd` ni el outline ya existente para snapshots sanos.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/documentSymbols.test.js out/test/server/unit/documentSymbolsReconciliation.test.js`

## 5. Resultado ejecutado

1. `documentSymbols` pasó a devolver un reporte puro de reconciliación junto al outline.
2. El servidor registra reason codes y detalle del drift antes de publicar LSP cuando el snapshot no está reconciliado.
3. Los tests fijan tanto el caso `healthy` como el caso inconsistente.