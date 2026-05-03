# Spec 360: Catalog-driven contextual completion v2

## Status

Closed.

## Backlog mapping

- B330 — Catalog-driven contextual completion v2.

## Objective

Extend completion so it consumes `reserved-words`, `pronouns`, `system-globals` and `enumerated-values` from the system catalog in relevant unqualified contexts, while preserving prefix filtering, deduplication, stable priority and low hot-path cost.

## Implemented scope

- `completion.ts` extends the unqualified completion path with `reserved-words`, `pronouns`, `system-globals` and `enumerated-values` from `SystemCatalog`.
- Catalog entries are deduplicated case-insensitively against locals, members and global/project symbols already added to completion.
- `createSystemCompletionItem(...)` now emits more precise LSP kinds for catalog entries such as `system-global`, `pronoun` and `enumerated-value`.
- Focused tests lock positive contextual suggestions, dedup against local symbols, negative member-context behavior and hot-path safety.

## Out of scope

- Confidence calibration over real corpora. That remains in B283.
- Corpus-wide catalog validation. That remains in B336.
- Semantic tokens catalog integration. That remains in B329.

## Acceptance evidence

- Unqualified completion suggests `COMMIT`, `THIS`, `SQLCA` and `SaveAsType!` under matching prefixes.
- Member contexts such as `SQLCA.sa` do not mix global vocabulary domains back into owner-qualified completion.
- Hot-path guards remain green after adding the new catalog domains.