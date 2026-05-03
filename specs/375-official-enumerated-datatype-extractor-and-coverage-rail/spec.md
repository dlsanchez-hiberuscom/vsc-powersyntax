# Spec 375: Official enumerated datatype extractor and coverage rail

## Status

Closed.

## Backlog mapping

- B361 — Official enumerated datatype extractor and coverage rail.

## Objective

Cerrar el rail oficial reproducible para tipos y valores enumerados PowerBuilder sin abrir un pipeline paralelo al generator actual, dejando cobertura auditable, provenance explícita y consumers runtime capaces de mezclar `manual-core` + `generated` por `enumValueOf`.

## Implemented scope

- `script/generate_official_function_catalog.cjs` extiende el rail oficial existente con helpers de recorte local (`findDocPageEndIndex`, `extractPrimaryContentHtml`) y endurece `extractSectionHtml`, `parseDataWindowConstantPage`, `extractObjectsPropertyVariantReferences` y `parseObjectsPropertyEnumPageVariant` para no capturar TOCs, índices locales ni `navfooter` globales de Appeon como si fueran valores enumerados oficiales.
- El mismo generator materializa ya `src/server/knowledge/system/generated/enumeratedTypes.generated.ts`, `enumeratedValues.generated.ts`, `enumeratedCoverage.generated.ts` y `enumeratedProvenance.generated.ts`, con cobertura oficial trazable de `enumerated-types` y `enumerated-values` desde el concepto de enumerated datatypes, DataWindow constants y property pages oficiales.
- `src/server/knowledge/system/registry/datasets.ts` publica los slices `generated` de enums junto al rail manual existente, mientras `buildIndexes.ts` y `queryService.ts` siguen resolviendo la unión efectiva por `byEnumValueOf` sin scans completos ni un segundo query path.
- `src/server/features/hover.ts` deja de depender solo de `symbol.enumValues` cuando el tipo enumerado llega por la ruta principal de `findSystemSymbol(...)`, y renderiza la unión efectiva manual + generated para casos como `WindowType`.
- `test/server/unit/catalogGeneratorScript.test.ts`, `catalogV2.test.ts` y `hover.test.ts` fijan la nueva salida generated, la integración runtime y el merge visible del hover; `docs/architecture.md`, `docs/testing.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/done-log.md` y `docs/roadmap.md` quedan alineados con el cierre de B361 y con el paso del foco a `B362`.

## Out of scope

- Completar el catálogo manual-curated de todas las familias de enums más allá de la cobertura oficial reproducible ya extraída (`B362`).
- Añadir diagnósticos, completion contextual o signature help enriquecidos específicamente para enums más allá del ajuste mínimo necesario para que hover respete la unión efectiva runtime (`B363`).
- Inventar `enumValues` con sufijo `!` para páginas oficiales que solo documentan rangos enteros o códigos numéricos, como `SecureProtocol`, mientras Appeon no publique membresía nominal defendible.

## Acceptance evidence

- El generator oficial produce salidas deterministas para `enumeratedTypes.generated.ts`, `enumeratedValues.generated.ts`, `enumeratedCoverage.generated.ts` y `enumeratedProvenance.generated.ts`.
- `enumeratedCoverage.generated.ts` publica `officialCount = coveredCount = 33` para `enumerated-types` y `officialCount = coveredCount = 233` para `enumerated-values`, con `missingCount = 0` en ambos dominios.
- `listValuesForEnumeratedType('WindowType')` y el hover de `WindowType` exponen conjuntamente valores manual-core y oficiales generated (`Main!`, `MDIDock!`, `MDIDockHelp!`, etc.) sin hardcodes paralelos por feature.
- `SecureProtocol` permanece como datatype oficial generado sin `enumValues` fabricados cuando la documentación oficial solo describe valores enteros y no tokens enumerados con `!`.
- El rail oficial no copia texto masivo de la documentación Appeon y mantiene provenance/version/sourceUrl trazables para los símbolos generated.

## Validation

```bash
node script/generate_official_function_catalog.cjs
npm run compile
npx tsc -p tsconfig.test.json
npx vscode-test --label unit --grep "unit/catalogGeneratorScript|unit/catalogV2|unit/hover"
```