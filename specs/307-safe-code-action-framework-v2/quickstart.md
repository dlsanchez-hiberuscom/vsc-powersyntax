# Quickstart - Spec 307 safe code action framework v2 (B262)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/codeActions.test.js out/test/server/unit/diagnosticsObsoleteIntegration.test.js out/test/server/unit/obsolete.test.js
npx vscode-test --label smoke --grep "expone quick fixes seguras para diagnósticos obsoletos en Problems/CodeAction"
```

Comprobación funcional mínima:

1. Abrir un documento PowerBuilder con una llamada obsoleta simple y confirmar que Problems publica `SD7`.
2. Pedir Code Action sobre ese diagnóstico y verificar que aparece una acción `Reemplazar 'RunFork' por 'Run'` con preview implícita en el propio título y sin `disabled`.
3. Confirmar en unit que el mismo framework bloquea la acción cuando falla el preflight, el `sourceOrigin` es dudoso o existe una referencia dinámica por string del mismo identificador.