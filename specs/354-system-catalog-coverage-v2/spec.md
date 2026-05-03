# Spec 354: System catalog coverage v2

## Status

Closed.

## Backlog mapping

- B285 — System catalog coverage v2.

## Objective

Expand the curated runtime catalog so frequent system types used in real PFC/OrderEntry corpus resolve through one versioned lane, without scattering hardcoded lists across editor features.

## Implemented scope

- `systemObjectDatatypes.ts` now covers a broader curated runtime base across HTTP/JSON/OAuth, visual controls, service/network objects, profiling/trace objects and reflection/runtime types visible in PFC/OrderEntry.
- `PB_BUILTIN_TYPES` in `grammar.ts` was aligned with that curated runtime coverage so parser fast-paths and system catalog no longer drift for those types.
- Focused tests lock catalog resolution plus visible completion/hover behavior and a semantic golden over representative HTTP/JSON types.
- A corpus-backed check over `global type ... from ...` in local PFC/OrderEntry fixtures leaves only project/custom ancestors unresolved after filtering workspace prefixes.

## Out of scope

- Restoring the official generator and domain coverage artifacts. That is owned by B319.
- Official per-domain generation for datatypes, object functions and events. That remains in B323/B322/B324.
- Framework-specific knowledge packs over real project symbols. That remains in B286 and follow-up audit items.

## Acceptance evidence

- Curated runtime system types from PFC/OrderEntry resolve through `SystemCatalog.resolveDatatype(...)`.
- Parser fast-path builtin types remain aligned with that curated runtime set.
- Completion and hover expose representative new system types without feature-local hardcode.
- Semantic golden keeps those types visible through the shared catalog lane.