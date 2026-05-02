# Quickstart - Spec 253 Formatter server-side y presupuesto de formato (B227)

## Contexto minimo

Leer:

- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/performance-budget.md`
- `docs/testing.md`

## Comandos estrechos sugeridos

```bash
npm run build:test ; npx mocha --ui tdd out/test/server/unit/formatDocument.test.js out/test/server/unit/powerBuilderFormatter.test.js
npm test -- --grep "smoke/formatting-extension"
```