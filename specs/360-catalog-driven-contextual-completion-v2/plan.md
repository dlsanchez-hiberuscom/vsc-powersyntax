# Plan — Spec 360 Catalog-driven contextual completion v2

## Phase 1 — Locate the owning path

- [x] Confirm that completion already consumed `keywords`, `datatypes` and `system types` in the unqualified branch.
- [x] Confirm that `SystemCatalog` already exposed `reserved-words`, `pronouns`, `system-globals` and `enumerated-values`.

## Phase 2 — Expand contextual completion

- [x] Add the missing catalog domains to the unqualified completion path.
- [x] Reuse existing dedupe and priority ordering so local/project symbols stay ahead of catalog vocabulary.
- [x] Tighten completion item kinds for catalog domains with runtime/value semantics.

## Phase 3 — Validation

- [x] Rebuild code and tests.
- [x] Lock positive contextual suggestions in `completion.test.ts`.
- [x] Lock negative member-context behavior and hot-path safety.

## Phase 4 — Closure

- [x] Align backlog, current-focus, done-log, architecture, testing and the technical guide.