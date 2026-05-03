# Plan — Spec 347 Override/overload hardening

## Phase 1 — Signature preservation

- [x] Preserve overloads in semantic facts by normalized callable signature.
- [x] Keep implementation preferred over prototype for the same owner/signature.

## Phase 2 — Shared resolver hardening

- [x] Add reusable callable signature helpers.
- [x] Infer lightweight argument count and literal types in invocation contexts.
- [x] Filter query candidates by arity/type evidence before inheritance distance ranking.
- [x] Emit explicit `discarded-signature` evidence.

## Phase 3 — Consumer alignment

- [x] Reuse the hardened query engine from Definition and Signature Help.
- [x] Make impact override collection signature-aware.
- [x] Keep ambiguity visible when signature evidence is absent.

## Phase 4 — Closure

- [x] Add focused unit tests.
- [x] Rebuild tests with `npm run build:test`.
- [x] Run B281 focal Mocha suite.
- [x] Align backlog, done-log, current-focus and technical docs.