# Spec 047 — Catalog sanity tests (B112)

## Motivación
Tests adicionales que protegen contra regresiones en provenance,
ownerTypes y lookup keys.

## Alcance
- `test/server/unit/catalogSanity.test.ts`:
  - Cada entry tiene `id`, `dataset`, `provenance.kind`, `provenance.authority`.
  - Cada entry tiene al menos un lookup key.
  - El lookup key es lower-case.

## Criterios
1. Los 3 invariantes pasan sobre el catálogo actual.
