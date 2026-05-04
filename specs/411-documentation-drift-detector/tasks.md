# Tasks — Spec 411

## Estado

- done

## Tasks

- [x] Publicar un audit local reproducible para drift canónico entre backlog, done-log, specs y foco vivo.
- [x] Añadir cobertura unitaria que congele tanto un caso sintético de drift como el baseline limpio del repo actual.
- [x] Reparar el drift documental real que el nuevo audit detecta en el repositorio.
- [x] Alinear `docs/spec-driven-development.md`, `docs/ai-orchestrator.md`, `docs/testing.md` y los artefactos canónicos de backlog/foco/done-log.

## Riesgos residuales registrados

- El audit no normaliza retrospectivamente ownership histórico de specs antiguas ni la ausencia masiva de `plan.md`; solo protege el drift canónico que bloquea cierres actuales.
- La automatización del lifecycle backlog ↔ done-log sigue pendiente de `B317`; `B316` deja la precondición de auditoría, no el guard de transición completo.