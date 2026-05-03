# Tasks — Spec 318 Catalog v2

## Closed implementation tasks

- [x] Extend catalog type unions additively.
- [x] Register manual slices for keywords, reserved words, datatypes, system object datatypes, pronouns, operators, system globals and enumerated values.
- [x] Expose indexed query APIs through `queryService` and `SystemCatalog`.
- [x] Integrate conservative hover and completion consumers.
- [x] Cover compatibility, domain/kind counts and language-symbol resolution in `catalogV2.test.ts`.

## 2026-05-03 audit tasks

- [x] Verify `grammar.ts` fast Sets remain available for parser/matcher hot paths.
- [x] Fix the `DataWindowChild` spelling gap in the fast builtin-type Set without removing the legacy misspelling.
- [x] Align generator script paths with `out/server/knowledge/system` and `src/server/knowledge/system/generated`.
- [x] Add wrapper for the plural `scripts/generate_official_function_catalog.cjs` path.
- [x] Add regression coverage in `catalogGeneratorScript.test.ts` and `catalogV2.test.ts`.

## Deferred tasks owned by follow-up backlog

- [ ] B319 restores full official generator and coverage v2.
- [ ] B320 adds official DataWindow expression/property catalog domains.
- [ ] B321 enriches generated entries with v2 metadata.