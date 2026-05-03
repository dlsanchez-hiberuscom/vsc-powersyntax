# Spec 357: Official reserved words and keywords catalog generation

## Status

Closed.

## Backlog mapping

- B322 — Official reserved words and keywords catalog generation.

## Objective

Officialize `keywords` and `reserved-words` on top of the restored generator rail, align `PB_KEYWORDS` with the relevant official vocabulary, and keep `pronouns` and `system-globals` as explicit parser blockers instead of the primary source of the domain.

## Implemented scope

- `script/generate_official_function_catalog.cjs` now audits `keywords` and `reserved-words` in `officialCoverage.generated.ts`, with both domains reaching zero missing units.
- The generator emits `PB_GENERATED_KEYWORDS` and `PB_GENERATED_RESERVED_WORDS` in `generated.generated.ts` for missing official vocabulary such as `PUBLIC`, `COMMIT`, `NAMESPACE`, `WITH`, `SYSTEMREAD`, `SYSTEMWRITE` and `XOR`.
- `generatedKeywordLexemes.generated.ts` now feeds `PB_KEYWORDS`, while `grammar.ts` keeps only explicit block phrases and explicit `pronouns`/`system-globals` blockers outside the authoritative lexical domains.
- The reserved-words parser is anchored to the real Appeon table, avoiding navigation noise like `Prev`, `Up` or `Sidebar`.

## Out of scope

- Officialization of `operators`, `pronouns` and `enumerated-values`. That remains in B324.
- System globals catalog hardening. That remains in B325.
- Datatype/system-type officialization. That was closed in B323.

## Acceptance evidence

- `officialCoverage.generated.ts` reports `missingCount = 0` for `keywords` and `reserved-words`.
- `generated.generated.ts` materializes the missing official keywords/reserved words.
- `generatedKeywordLexemes.generated.ts` keeps the parser fast-path aligned with the official language vocabulary.
- Focused unit validation stays green on the generator rail and catalog queries.