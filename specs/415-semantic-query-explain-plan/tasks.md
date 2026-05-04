# Tasks — Spec 415

## Estado

- done

## Tasks

- [x] Construir un report read-only de explain plan semántico directamente sobre `queryContext`, `ResolvedTargetInfo` y `queryTrace`.
- [x] Exponer `explainSemanticQuery()` como comando/API/tool estable con fallback por editor activo.
- [x] Publicar un comando Markdown legible para inspección manual del explain plan en VS Code.
- [x] Validar unit del builder/contrato y smoke focal de método, tool y comando Markdown.

## Riesgos residuales registrados

- El explain plan refleja la política de resolución actual; si `B286` cambia pesos entre source real y knowledge packs, deberá reconsumir esta evidencia en vez de abrir otro report paralelo.
- El coste aproximado es heurístico y proporcional al trace/candidate/discard count; no debe reinterpretarse como métrica dura de rendimiento del runtime.