# Plan — Spec 422 / LOC-01

- Gap consolidado: falta priorización explícita del siguiente corte de authoring localizado tras quedar cubiertos el rail de serving `es -> en`, el audit y los consumers visibles.
- Primer slice elegido: authoring incremental guiado por `report:catalog-localization`, con reconciliación explícita de `targetId`/`targetKey` y sin abrir cambios de runtime mientras `documentationService`, `documentationLocale` y `catalogLocalization` sigan cubriendo el rail actual.
- No-go explícitos: no traducir `name`, `id`, `lookupKeys`, `parameterName`, `signatureLabel` ni anchors técnicos; no duplicar entries por locale; no abrir overlays paralelos.
- Validación focal futura:
	- `npm run test:unit -- --grep "catalogLocalization|catalogConsistency|documentationService|documentationLocale"`
	- `npm run report:catalog-localization`
	- `npm run migrate:catalog-localization-target-ids`
