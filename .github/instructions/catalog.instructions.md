---
name: Catalog source of truth
description: System/manual/localized catalogs and diagnostic reason codes.
applyTo: "**/*catalog*/**,**/*rules*/**,**/*.json"
---
- Generated/manual/localized catalog layers must remain separate.
- Do not rename/remove stable IDs, domains, kinds or namespaces without migration.
- Localization is presentation only; it must not change canonical meaning.
- New entries need source/provenance and compatibility impact.
- Existing query behavior and tests must keep passing.
