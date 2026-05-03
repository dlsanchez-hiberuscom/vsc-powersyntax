# Spec 362: Catalog corpus validation over real corpora

## Status

Closed.

## Backlog mapping

- B336 — Catalog corpus validation against PFC/OrderEntry/legacy.

## Objective

Turn catalog coverage and consumption over PFC, OrderEntry and the public legacy corpus into an executable baseline by domain and surface, separate from discovery/indexing general and separate from confidence-threshold calibration.

## Implemented scope

- `catalogCorpusValidation.ts` builds a pure report with hits, misses, ambiguities and budget violations by domain and surface.
- `catalogCorpusValidation.test.ts` locks the report semantics before touching real corpora.
- `catalogCorpusValidation.smoke.test.ts` indexes PFC Solution, OrderEntry and the legacy PBL dump, warms each probe once to isolate served latency, and freezes five real probes across `system-globals`, `global-functions` and `datawindow-functions`.
- `test/results/003-real-corpora-baseline.md` records the reviewed corpus baseline with `0 misses / 0 ambiguities / 0 budget violations`.

## Out of scope

- Workspace support matrix finalization. That remains in B293.
- Confidence-threshold changes beyond the reviewed baseline already closed in B283.
- New catalog domains or new runtime consumers without evidence from real corpora.

## Acceptance evidence

- Real corpora provide a stable baseline by domain and surface.
- `hover`, `completion` and `diagnostics` stay crash-free on the reviewed probes.
- The reviewed baseline remains at `0 misses / 0 ambiguities / 0 budget violations`.