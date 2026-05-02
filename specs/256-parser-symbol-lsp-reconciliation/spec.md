# Spec 256 - Reconciliación parser / symbol model / salida LSP (B162)

**Estado:** cerrada y validada.

## 1. Problema

`documentSymbols` ya combinaba parser estructural, facts/scopes semánticos y salida LSP visible, pero lo hacía sin una surface explícita de reconciliación. Si alguno de esos planos divergía, el outline seguía publicándose sin dejar reason codes ni evidencia clara.

## 2. Objetivo

Detectar incoherencias internas entre parser, symbol model y salida LSP antes de publicar el outline, sin abrir un motor semántico paralelo ni cambiar el contrato visible cuando el snapshot está sano.

## 3. Restricciones

- cliente ligero, servidor pesado;
- sin duplicar semántica fuera del backbone existente;
- reason codes explícitos para inconsistencias relevantes;
- degradación interna observable antes que precisión fingida.

## 4. Enfoque

- reutilizar `documentSymbols` como punto único de unión entre parser, snapshot y LSP;
- calcular un reporte puro de reconciliación sobre `sections/typeBlocks`, facts/scopes y árbol LSP proyectado;
- registrar el drift en consola y `runtimeJournal` cuando exista, manteniendo la salida visible estable.

## 5. Cambios principales

- `src/server/features/documentSymbols.ts` añade `ExtractDocumentSymbolsResult`, `DocumentSymbolReconciliationReport` y reason codes explícitos para drift entre parser/snapshot/LSP;
- `src/server/server.ts` registra warnings de reconciliación antes de devolver `DocumentSymbol[]`;
- `test/server/unit/documentSymbolsReconciliation.test.ts` cubre snapshots sanos e inconsistentes.

## 6. Criterios de cierre

- existe reconciliación explícita y testeada en el punto que publica `DocumentSymbol[]`;
- las inconsistencias relevantes dejan evidencia útil con reason codes;
- docs canónicas y done-log reflejan el guardrail.

## 7. Validación requerida

- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/documentSymbols.test.js out/test/server/unit/documentSymbolsReconciliation.test.js`

## 8. Resultado de cierre

- el outline del documento deja reason codes y reporte interno de reconciliación antes de publicarse cuando parser/snapshot/LSP divergen;
- snapshots sanos mantienen la salida existente y reportan estado `healthy`;
- la validación ejecutada fue `npm run build:test ; npx mocha --ui tdd out/test/server/unit/documentSymbols.test.js out/test/server/unit/documentSymbolsReconciliation.test.js`.