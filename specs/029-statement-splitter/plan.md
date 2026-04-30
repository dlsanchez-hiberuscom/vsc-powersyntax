# Plan — 029 Statement splitter (B095)

- `src/server/parsing/statementSplitter.ts`: `splitStatements`.
- Usa `maskDocument` para evitar romper sobre `&` en strings/comentarios.
- Tests `test/server/unit/statementSplitter.test.ts`.
