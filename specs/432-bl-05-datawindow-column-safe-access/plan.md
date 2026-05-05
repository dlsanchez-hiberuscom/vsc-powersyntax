# Plan — Spec 432 / BL-05

- Owner directo: `src/server/features/dataWindowBindingModel.ts` + `src/server/features/dataWindowModel.ts`; consumers de borde en `definition.ts` y `hover.ts`.
- Hipótesis: la columna literal de `GetItem*` / `SetItem` / `SetItemStatus` puede resolverse con el mismo backbone que ya usa `Describe/Modify/GetChild` cuando el `DataObject` es literal y único.
- Guardrail: si el `DataObject` no es literal, el resultado debe seguir siendo `null`; no se abre un motor DataWindow paralelo ni se simulan buffers.
- Validación focal:
  - `npx tsc -p tsconfig.test.json`
  - `npx mocha --ui tdd out/test/server/unit/definition.test.js out/test/server/unit/hover.test.js`
  - `npm run test:docs:drift`