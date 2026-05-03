# Spec 348: Dynamic invocation risk model v2

## Status

Closed.

## Backlog mapping

- B282 — Dynamic invocation risk model v2.

## Objective

Unify dynamic invocation risk across semantic navigation, impact analysis and safe editing surfaces without creating a second semantic engine.

## Implemented scope

- `ApiInvocationRisk` and `ApiInvocationRiskSummary` are part of the public API contract.
- `invocationRiskModel` centralizes risk composition for query risk, sourceOrigin, dynamic strings, DataWindow binding state and external targets.
- `impactAnalysis` publishes `invocationKind`, `invocationRisk`, `riskReasons` and dynamic string counts.
- `safeEditPlan` blocks `dynamic`, `fallback` and `external` risks with explicit reasons.
- `dependencyGraph` exposes a summary risk derived from focus sourceOrigin and unresolved or ambiguous dependency evidence.
- `codeActions` carry risk metadata and keep quick fixes disabled for non-canonical source or dynamic string references.
- `references` returns no textual usages when declarations are excluded and a blocking dynamic string reference exists.
- `rename` blocks dynamic/fallback invocation risk before generating workspace edits.
- `dynamicStringReferences` covers event, DataWindow, WebView and HTTP request string patterns.

## Out of scope

- Runtime prediction for dynamic dispatch.
- Deep HTTP/WebView/JavaScript parsing.
- New diagnostics or security findings for HTTP/credentials.
- Reopening B279 identity, B280 ambiguity or B281 signature semantics.

## Acceptance evidence

- Dynamic strings degrade or block references, rename, impact and safe edit plan consistently.
- External/native dependencies remain blocked for rename/safe edit.
- Code actions expose the same risk metadata used by safe-edit consumers.
- Dependency graph reports fallback risk for unresolved or ambiguous dependency evidence.
- DataWindow dynamic or ambiguous bindings raise dynamic risk in impact/safe edit.