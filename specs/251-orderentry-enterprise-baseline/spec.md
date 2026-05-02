# Spec 251 - Corpus enterprise OrderEntry baseline (B226)

## 1. Resumen

Convertir `fixtures-local/STD_FC_OrderEntry` en baseline enterprise reproducible para discovery, indexacion, routing y regresiones semanticas reales.

## 2. Estado real actual

`B226` esta `Partial`: ya existe baseline ejecutable de performance para discovery e indexacion cold/warm, pero faltan smoke/semantics, topologia moderna parcial y reglas completas de ruido.

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
