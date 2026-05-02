# Spec 251 - Corpus enterprise OrderEntry baseline (B226)

**Estado:** cerrada y validada.

## 1. Resumen

Convertir `fixtures-local/STD_FC_OrderEntry` en baseline enterprise reproducible para discovery, indexacion, routing y regresiones semanticas reales.

## 2. Estado real actual

`B226` queda cerrada: el corpus local ya aporta baseline reproducible de discovery, indexacion cold/warm y smoke semantica focalizada sobre objetos representativos, topologia parcial y ruido no fuente.

## 3. Objetivo

Ampliar el baseline OrderEntry sin introducir corpus en Git ni convertir ruido de deploy/build en fuente semantica.

## 4. Alcance

- smoke/semantics sobre clases representativas;
- topologia `.pbproj` aislada sin `.pbsln`;
- `.pblmeta` disperso, `.srj` de deploy y recursos ruidosos;
- medicion de `sourceOrigin`, routing y readiness.

## 5. Fuera de alcance

- subir el corpus local al repo;
- cerrar soporte general de PBAutoBuild;
- diagnosticos nuevos no requeridos por el baseline.

## 6. Criterios de aceptacion

- AC1. OrderEntry queda cubierto por performance + smoke/semantics reproducibles.
- AC2. La documentacion explica que ruido se ignora y que superficie se indexa.
- AC3. Las pruebas no fallan cuando el corpus local no esta presente; deben degradar con skip explicito.

## 7. Documentacion afectada

- `docs/backlog.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `test/corpora/README.md`
- `test/results/*` si se regeneran mediciones

## 8. Validacion requerida

- `npm run test:performance -- --grep "OrderEntry"`
- smoke/semantics focalizados si se anaden

## 9. Resultado de cierre

- `src/shared/powerbuilderFiles.ts` deja de tratar `.srj` de deployment como fuente semantica del pipeline de workspace;
- `test/server/performance/orderentry.smoke.test.ts` mantiene la cobertura de solution-mode parcial, `_BackupFiles` y variantes multiidioma `_e/_f/_i/_s`;
- `test/server/performance/orderentry.semantic.test.ts` fija objetos representativos (`nc_ac_orderentry`, `vc_oes_toolbar_e`, `wn_dotnet_datastore_e`, `ap_image_build`), `sourceOrigin` pbl-folder-source, topologia parcial y exclusion explicita de `.srj`, `.pblmeta` y recursos HTML;
- `npm run test:performance -- --grep "OrderEntry"` deja verde discovery, cold/warm index y smoke/semantics sobre el slot enterprise local sin depender de Git.
