# Quickstart - Spec 266 Semantic repro pack export (B175)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/semanticReproPack.test.js
npm run test:smoke -- --grep "semantic-repro-pack"
```