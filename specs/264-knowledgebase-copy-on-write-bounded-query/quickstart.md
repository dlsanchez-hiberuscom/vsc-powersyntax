# Quickstart - Spec 264 KnowledgeBase copy-on-write e indices de consulta acotada (B230)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/knowledgeBase.test.js out/test/server/performance/knowledgeBase.perf.test.js
npm run test:performance -- --grep "knowledgeBase"
```