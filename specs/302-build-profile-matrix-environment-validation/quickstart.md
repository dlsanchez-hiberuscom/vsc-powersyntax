# Quickstart - Spec 302 build profile matrix and environment validation (B257)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/pbAutoBuildProfileMatrix.test.js out/test/server/unit/publicApi.test.js --grep "(B257|pbAutoBuildProfileMatrix|build-profile-matrix|versión exportada|descriptor contractual|bridge read-only)"
npm run test:smoke -- --grep "la extensión se activa"
```

Comprobación funcional mínima:

1. Verificar que la matriz prioriza el último profile recordado, distingue `usable|ambiguous|invalid` y deja `canRun` explícito según tooling.
2. Verificar que `getBuildProfileMatrix()` y el tool `build-profile-matrix` exponen el schema `ApiBuildProfileMatrix` con `health` y `findings` defendibles.
3. Verificar que `PowerSyntax: Abrir Matriz de Perfiles de Build` abre un Markdown lateral y que backlog/current-focus/roadmap/done-log ya no tratan `B257` como deuda activa.