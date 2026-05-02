# Spec 253 - Formatter server-side y presupuesto de formato (B227)

**Estado:** cerrada y validada.

## 1. Resumen

Sacar el cálculo del formatter conservador del Extension Host y reforzarlo con presupuestos explícitos para documentos grandes, manteniendo el cliente como wiring/configuración.

## 2. Estado real actual

- `src/client/formatting/registerFormatting.ts` calcula `formatPowerBuilderText()` de forma síncrona en cliente para formato manual y `formatOnSave`.
- El motor puro ya existe en `src/shared/formatting/powerBuilderFormatter.ts`, pero hoy se ejecuta directamente en el Extension Host.
- No existe todavía un comando/feature de servidor para formateo ni budgets explícitos por tamaño de documento.

## 3. Objetivo

Mover el trabajo de formateo al proceso LSP y bloquear/degradar documentos que excedan un presupuesto explícito y medible.

## 4. Alcance

- introducir una ruta de formateo server-side reutilizando el motor puro actual;
- mantener el cliente como adaptador fino de settings, llamadas y UX ligera;
- aplicar budgets explícitos por tamaño/líneas antes de formatear;
- conservar `formatOnSave` y el provider manual sobre la nueva ruta.

## 5. Fuera de alcance

- ampliar reglas del formatter o su gramática soportada;
- parsear DataWindow como PowerScript;
- abrir formatting range/on-type o perfiles por proyecto;
- introducir un segundo motor semántico para formateo.

## 6. Criterios de aceptacion

- AC1. El cálculo pesado del formatter deja de ejecutarse en el Extension Host.
- AC2. Existen budgets explícitos y observables para documentos grandes.
- AC3. `formatOnSave` y el provider manual siguen funcionando sobre la nueva ruta.
- AC4. Docs canónicas reflejan el cambio y los límites del formatter.

## 7. Documentacion afectada

- `docs/architecture.md`
- `docs/performance-budget.md`
- `docs/testing.md`
- `docs/current-focus.md`
- `docs/backlog.md`
- `README.md`

## 8. Validacion requerida

- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/formatDocument.test.js out/test/server/unit/powerBuilderFormatter.test.js`
- `npm test -- --grep "smoke/formatting-extension"`

## 9. Resultado de cierre

- `src/server/features/formatDocument.ts` mueve el cálculo efectivo al proceso LSP y reaprovecha `formatPowerBuilderText()` sin dejar trabajo pesado en cliente;
- `src/client/formatting/registerFormatting.ts` conserva solo selector, settings, `formatOnSave` y avisos ligeros de skip por presupuesto;
- `package.json` añade budgets explícitos (`maxDocumentChars`, `maxDocumentLines`) para degradar documentos grandes de forma observable;
- la validación ejecutada fue `npm run build:test`, `npx mocha --ui tdd out/test/server/unit/formatDocument.test.js out/test/server/unit/powerBuilderFormatter.test.js` y `npm test -- --grep "smoke/formatting-extension"`.