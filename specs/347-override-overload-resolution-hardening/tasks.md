# Tasks — Spec 347 Override/overload hardening

- [x] Add `src/server/knowledge/callSignature.ts`.
- [x] Update `documentAnalysis` callable deduplication to preserve overloads.
- [x] Extend `InvocationContext` with argument count and lightweight literal argument types.
- [x] Harden `semanticQueryService` candidate filtering and evidence.
- [x] Make `InheritanceGraph` override family keys signature-aware.
- [x] Make `impactAnalysis` collect only signature-compatible overrides.
- [x] Pass signature context through `signatureHelp`.
- [x] Add tests in `documentAnalysis`, `semanticQueryService`, `definition`, `signatureHelp` and `impactAnalysis`.
- [x] Register B281 closure in canonical docs.