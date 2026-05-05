# Plan — Spec 423 / CAT-01

- Gap consolidado: tras `B369`, el baseline `generated-primary-with-manual-overlays` ya está cerrado y el siguiente frente útil es ownership/identity de dominios excepción, no la reapertura del source-of-truth.
- Primer slice elegido: endurecer reporting y ownership de los dominios `manual-primary` permitidos (`datawindow-events`, `operators`, `pronouns`, `system-globals`) y de las colisiones de identidad que puedan romper `catalogConsistency`/`catalogV2`.
- No-go explícitos: no abrir un segundo rail de catálogo, no mezclar localización con ownership semántico, no tocar query/serving interactivo sin evidencia nueva.
- Validación focal futura:
	- `npm run test:unit -- --grep "catalogV2|catalogConsistency|catalogAdoptionDecision|catalogProvenanceAudit|systemCatalogQueryHardening|systemNormalization"`
	- `npm run report:catalog-consistency`
	- `npm run verify:catalog-coverage`
