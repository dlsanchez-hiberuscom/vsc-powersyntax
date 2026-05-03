# Quickstart - Spec 299 datawindow expression diagnostics safe completion (B254)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js --grep "(Modify|ruta DataWindow|binding raíz es dinámico|property paths DataWindow)"
npx mocha --ui tdd out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/hover.test.js out/test/server/unit/definition.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js --grep "(DataWindow|DataObject|GetChild|Modify|Describe|property paths DataWindow)"
```

Comprobación funcional mínima:

1. Verificar que `Modify("state_id.")` ofrece completion segura con `DataWindow` y `dddw`.
2. Verificar que `Describe("missing.DataWindow.Table.Select")` emite un warning conservador cuando el root está enlazado de forma única.
3. Verificar que el mismo patrón no emite warning extra cuando el `DataObject` es dinámico y que backlog/current-focus/roadmap/done-log ya no tratan `B254` como deuda activa.