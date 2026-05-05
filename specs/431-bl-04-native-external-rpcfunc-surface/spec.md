# Spec 431 — BL-04 Native / external / RPCFUNC surface

## Estado

- done

## Relación backlog

- Backlog item: `BL-04 — Profundizar superficie native, external, RPCFUNC y PBNI`

## Objetivo

Distinguir de forma explícita external functions `LIBRARY` frente a declaraciones `RPCFUNC`, reutilizando el rail seguro de degradación existente sin abrir un segundo analizador ni prometer implementación PowerScript interna.

## Resultado esperado

- parser de declaraciones externas capaz de diferenciar `LIBRARY` y `RPCFUNC`;
- proyección visible mínima en hover, diagnostics y evidencia read-only;
- rename/references degradan igual de forma segura cuando el callable no tiene implementación interna.

## Validación mínima esperada

- `npx mocha --ui tdd out/test/server/unit/externalFunctions.test.js out/test/server/unit/rename.test.js out/test/server/unit/references.test.js out/test/server/unit/hoverFormat.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js`
- `npm run test:docs:drift`

## Fuera de alcance

- modelar ABI, marshalling o result sets de stored procedures;
- abrir una surface PBNI independiente de la evidencia PBX ya existente;
- prometer rename/reference dentro de DLL, PBX o DBMS stored procedures.

## Cierre registrado

- `parseExternalFunction()` distingue ya declaraciones `LIBRARY` y `RPCFUNC` en el mismo rail seguro de callables sin implementación PowerScript interna;
- hover, diagnostics y `powerBuilderTechnicalDebtReport` proyectan la diferencia sin abrir una surface PBNI separada ni degradar `RPCFUNC` a `unknown`;
- rename y references bloquean/degradan `RPCFUNC` igual que las dependencias externas nativas, manteniendo el contrato de seguridad del query engine.

## Validación ejecutada

- `npx tsc -p tsconfig.test.json`
- `npx mocha --ui tdd out/test/server/unit/externalFunctions.test.js out/test/server/unit/rename.test.js out/test/server/unit/references.test.js out/test/server/unit/hoverFormat.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js`
- `npm run test:docs:drift`