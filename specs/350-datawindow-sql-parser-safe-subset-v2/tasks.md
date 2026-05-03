# Tasks — Spec 350 DataWindow SQL parser safe subset v2

- [x] Extend `dataWindowModel.sqlReferences` beyond the plain `SELECT` list.
- [x] Resolve simple table aliases.
- [x] Cover `JOIN ... ON` simple predicates.
- [x] Cover basic `WHERE` predicates.
- [x] Degrade honestamente ante subquery/SQL complejo.
- [x] Add focused tests in `dataWindowModel.test.ts`, `dataWindowLegacySafeMode.test.ts` and `dataWindowSqlLineage.test.ts`.
- [x] Register B288 closure in spec/backlog/done-log/current-focus and technical docs.