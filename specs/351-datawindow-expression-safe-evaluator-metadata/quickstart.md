# Quickstart — Spec 351 DataWindow expression safe evaluator metadata

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/dataWindowModel.test.js out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js
```

## Notes

- The metadata is intentionally read-only and conservative.
- `expression=` and quoted dynamic `~t...` values are in scope; runtime value evaluation is not.
- Any future DataWindow behavioral depth must stay on top of `dataWindowModel` instead of creating a second parser.