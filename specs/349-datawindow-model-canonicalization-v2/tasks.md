# Tasks — Spec 349 DataWindow model canonicalization v2

- [x] Extend `DataWindowModel` with canonical `retrieveArguments`.
- [x] Support escaped quotes in quoted DataWindow attributes.
- [x] Support balanced parenthesized unquoted attribute values.
- [x] Replace raw parsing in `dataWindowSafeMode` with `buildDataWindowModelFromSnapshot()`.
- [x] Replace raw parsing in `dataWindowBindingModel` with canonical `retrieveArguments`.
- [x] Add `test/server/unit/dataWindowModel.test.ts`.
- [x] Validate the affected DataWindow surfaces and architecture import guard.
- [x] Register B287 closure in canonical docs.