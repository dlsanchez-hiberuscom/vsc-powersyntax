# Plan — Spec 375 Official enumerated datatype extractor and coverage rail

## Phase 1 — Hardening del scraper oficial

- [x] Recortar el parsing de Appeon al contenido local relevante para evitar sobrecaptura de TOCs y `navfooter`.
- [x] Reutilizar el mismo generator oficial en `script/` y mantener `scripts/` como wrapper de compatibilidad.

## Phase 2 — Outputs generated y wiring runtime

- [x] Emitir `enumeratedTypes.generated.ts`, `enumeratedValues.generated.ts`, `enumeratedCoverage.generated.ts` y `enumeratedProvenance.generated.ts` desde el rail oficial existente.
- [x] Publicar los nuevos slices `generated` en el registry runtime sin crear un pipeline paralelo ni scans completos adicionales.
- [x] Alinear hover con la unión efectiva `manual-core + generated` cuando el símbolo entra por la ruta principal del system catalog.

## Phase 3 — Guardrails y cierre canónico

- [x] Fijar tests focales del generator, del catálogo runtime y del hover para el rail oficial de enumerados.
- [x] Ejecutar validación focal reproducible sobre generator, compile y `vscode-test` unitario.
- [x] Sacar B361 del backlog activo, mover el foco a B362 y registrar el cierre en spec/docs/done-log.