# Spec 347: Override and overload resolution hardening

## Status

Closed.

## Backlog mapping

- B281 — Override and overload resolution hardening.

## Objective

Harden PowerBuilder callable resolution so overloads, overrides, prototypes and implementations are handled by the shared query engine instead of collapsing to flat name matching.

## Implemented scope

- `documentAnalysis` preserves callable overloads by normalized signature while still replacing a prototype with the implementation of the same owner/signature.
- `InvocationContext` carries observable argument count and lightweight literal argument types.
- `semanticQueryService` filters callable candidates by arity and simple literal type compatibility before distance ranking, emits `discarded-signature` evidence, and treats `lineage.phase = prototype` as equivalent to `isPrototype` for older payloads.
- `InheritanceGraph` and `impactAnalysis` compare override families by signature, not only by name.
- `signatureHelp` passes the inferred call signature context to the shared resolver so active overloads are selected consistently with Definition.

## Out of scope

- Full PowerBuilder expression type inference.
- Runtime dispatch prediction for dynamic strings or unresolved qualifiers; that is owned by B282.
- Reopening B279 symbol identity or B280 ambiguity semantics.

## Acceptance evidence

- Definition resolves overloads by arity and simple literal types.
- Signature Help selects the same overload family as the query engine.
- Prototype and implementation of the same signature no longer produce artificial ambiguity.
- Distinct signatures are not treated as override equivalents in impact analysis.
- Ambiguity remains visible when a call site does not provide enough signature evidence.