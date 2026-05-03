# Quickstart - Spec 317 long-running session stability soak tests (B275)

```bash
$env:POWERSYNTAX_SOAK_ITERATIONS='8'; npm run test:performance:soak; Remove-Item Env:POWERSYNTAX_SOAK_ITERATIONS
```

Comprobación funcional mínima:

1. Verificar que la suite `performance/session-stability-soak` termina en verde y emite una línea `[soak-report] {...}`.
2. Verificar que `artifacts/performance/session-stability-soak.json` y `.md` se regeneran con el resumen de baseline/final cache sizes, flushes y resume checks.
3. Verificar que `finalDocumentCacheSize == baselineDocumentCacheSize`, `finalKnowledgeDocuments == baselineKnowledgeDocuments`, `finalServingCacheEntries == 0` y `lastResumeAction == "reuse"`.
4. Verificar que `B275` ya no permanece en el backlog activo y que el siguiente foco canónico es `B276`.