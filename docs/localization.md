# Catalog Localization Workflow

## 1. Propósito

Este documento fija el workflow operativo para ampliar la localización documental del system catalog sin romper identidad semántica, sin traducir anchors técnicos y sin perder trazabilidad cuando crezca la cobertura del rail `es`.

---

## 2. Artefactos propietarios

- overlays españoles: `src/server/knowledge/system/localization/es/`
- audit runtime: `buildCatalogConsistencyReport().localization`
- snapshot serializado: `artifacts/catalog/catalogLocalizationReport.generated.json`
- resumen humano: `artifacts/catalog/catalogLocalizationReport.generated.md`

Regla: el rail localizado solo toca documentación visible. Nunca traduce `name`, `id`, `lookupKeys`, `normalizedName`, `ownerTypes`, `domain`, `kind`, `namespace`, `invocation`, `signatures.label`, nombres reales de parámetros, datatypes, enum values ni `sourceUrl`.

Orden de capas que debe respetar cualquier overlay localizado:

```text
generated base -> manual curated enrichment -> localization overlay -> presentation formatter
```

La terminología bilingüe estable para presentation/enrichments no vive en overlays por dominio. Su owner canónico es `src/server/presentation/terminology.ts`, reutilizado por `hover`, `completion-resolve` y labels visibles de catálogo para compartir keys estables, fallback `en/es` y términos mínimos sin traducir anchors técnicos ni nombres reales.

`ADR-0001-system-catalog-source-of-truth.md` sigue mandando: la overlay localizada nunca resuelve contra slices crudas ni reabre la competencia `generated` vs `manual-core`; siempre cae sobre la entry runtime canónica ya colapsada por `generated-primary-with-manual-overlays`.

Schema estricta vigente:

- versión runtime: `1.0.0` en `src/server/knowledge/system/localization/schema.ts`;
- metadata obligatoria por overlay: `source` y `reviewed` explícitos;
- anchors obligatorios: al menos uno entre `targetId` o `targetKey`;
- issues de schema publicados por el audit: `missing-source`, `missing-reviewed`, `reviewed-with-issues`;
- agregación de authoring: `missingFieldsByDomain` publica huecos documentales por dominio antes de tocar consumers visibles.

---

## 3. Comando de trabajo

```bash
npm run report:catalog-localization
npm run migrate:catalog-localization-target-ids
```

Este comando recompila el servidor, ejecuta el audit vivo del catálogo y deja un snapshot determinista con:

- conteos por locale (`overlayCount`, `reviewedCount`, `targetIdCount`, `targetKeyCount`, `orphanCount`);
- cobertura por dominio (`localizedTargetCount`, `reviewedTargetCount`, ratios sobre targets canónicos);
- overlays incompletos (`missingFields`);
- anchors técnicos inválidos (`invalidParameterTargets`);
- targetIds recuperados por `targetKey` (`recoveredTargetIds`);
- overlays huérfanos.

El migrador funciona en modo dry-run por defecto. Para aplicar reemplazos sobre los overlays fuente:

```bash
npm run migrate:catalog-localization-target-ids -- --write
```

---

## 4. Workflow incremental

1. Ejecutar `npm run report:catalog-localization` y capturar el baseline del dominio elegido: `localizedTargetCount`, `reviewedTargetCount`, `missingFieldsByDomain`, `schemaIssues`, `invalidParameterTargets`, `recoveredTargetIds` y `orphanOverlays`.
2. Elegir el siguiente dominio según prioridad real de uso y cobertura, respetando el orden vigente de authoring.
3. Añadir o editar overlays en `src/server/knowledge/system/localization/es/` con `source` y `reviewed` explícitos, sin tocar anchors técnicos.
4. Mantener siempre nombres reales, `signatureLabel` y `parameterName` en inglés/original, tal como aparecen en la entry base.
5. Si la entry viene de `generated` o puede mover `ownerTypes`/IDs al regenerar, añadir también `targetKey` como ancla de recuperación; si el ID está estable, usar `targetId`; si quieres drift explícito y recuperación automática, usar ambos.
6. Rerun:

```bash
npm run test:unit -- --grep "catalogLocalization|catalogConsistency"
npm run report:catalog-localization
npm run migrate:catalog-localization-target-ids
```

7. Comparar cobertura antes/después y registrar el delta real del dominio tocado, junto con los issues resueltos o pendientes.
8. Solo marcar `reviewed: true` cuando el overlay ya no aparezca como `incomplete`, `invalidParameterTarget`, `recoveredTargetId` pendiente de reconciliación, `schemaIssue`, ni siga generando huérfanos.

Checklist corto de authoring por overlay:

- `source` explícito.
- `reviewed` explícito.
- `targetId` y/o `targetKey` coherentes con la entry canónica.
- anchors técnicos intactos.
- cobertura antes/después registrada.
- comandos ejecutados registrados.

Campos visibles permitidos en la overlay localizada actual:

- `summary`
- `documentation`
- `usageNotes`
- `obsoleteMessage`
- `returnDocumentation`
- `parameterDocumentation`
- `category` cuando sea UX-visible

Slots reservados del schema actual, todavía no servidos en runtime visible:

- `examples`
- `tags`
- `qualityFlags`
- `provenanceMetadata`

Campos bloqueados por contrato:

- `id`
- `name`
- `lookupKeys`
- `normalizedName`
- `domain`
- `kind`
- `namespace`
- `ownerTypes`
- `invocation`
- `signatures.label`
- `parameterName`
- datatypes
- enum values
- `sourceUrl`

Exposición por consumer visible:

- Hover puede leer documentación localizada completa.
- Completion initial sólo puede usar resumen breve; la documentación larga se difiere a completion resolve.
- Completion resolve y signatureHelp reutilizan la misma overlay documental, pero mantienen firmas y nombres reales sin traducir.

---

## 5. Orden recomendado de authoring

```txt
1. Functions/events más usados y visibles.
2. DataWindow core.
3. System object datatypes principales.
4. Enumerated types/values.
5. Statements y reserved words.
6. Resto generated.
```

## 5.1 Roadmap de cobertura `es`

Estado factual tras los cortes visibles de built-ins y DataWindow, tomado de [catalogLocalizationReport.generated.md](../artifacts/catalog/catalogLocalizationReport.generated.md):

| Dominio | Cobertura actual | Prioridad | Criterio de avance |
| --- | ---: | --- | --- |
| `global-functions` | `8/285` revisados (`2.81%`) | P1 | Ampliar funciones/eventos visibles con `reviewed: true` sólo si no generan incomplete/invalid/orphan. |
| `datawindow-functions` | `5/302` revisados (`1.66%`) | P1 | Seguir ampliando DataWindow core sin traducir anchors, property paths ni nombres reales. |
| `datawindow-properties` | `0/7` (`0%`) | P1 | Completar el rail DataWindow sin mezclar properties con functions ni relajar el audit. |
| `system-object-datatypes` | `5/224` revisados (`2.23%`) | P2 | Priorizar tipos runtime/visual principales ya estabilizados por catálogo. |
| `enumerated-types` / `enumerated-values` | `3/37` (`8.11%`) y `2/245` (`0.82%`) | P2 | Mantener enum values con `!` sin traducir; traducir sólo documentación visible. |
| `statements`, `keywords`, `reserved-words` | `3/16` (`18.75%`), `2/60` (`3.33%`) y `3/48` (`6.25%`) | P2 | Localizar ayuda contextual, no lexemas del lenguaje. |
| resto generated/manual | `0%` | P3 | Avanzar por uso real y cobertura visible, no por masa de entradas. |

Cada incremento debe registrar cobertura antes/después, dominios tocados, issues resueltos y comandos ejecutados. La localización de nuevos idiomas queda `Planned`: debe reutilizar el mismo contrato de overlays y no abrir símbolos duplicados por locale.

El primer corte cerrado de built-ins visibles (`SYMBOL-CATALOG-BUILTINS-ENRICH-P1`) añadió `IsNull`, `SetNull`, `Len`, `Lower` y `Upper`, llevando `global-functions` de `3/285` a `8/285` overlays revisados sin issues de schema, drift ni anchors.

El primer corte cerrado de DataWindow core (`SYMBOL-CATALOG-DW-ENRICH-P1`) añadió overlays `es` revisados para `Describe`, `Retrieve`, `SetItemStatus`, `SetTransObject` y `Update`, llevando `datawindow-functions` de `0/302` a `5/302` sin `incompleteOverlays`, `invalidParameterTargets`, `recoveredTargetIds`, `schemaIssues` ni `orphans`.

El corte cerrado de enums (`SYMBOL-CATALOG-ENUMS-ENRICH-P2`) añade overlays `es` revisados para `SaveAsType`, `FillPattern`, `SecureProtocol`, `Text!` y `Primary!`, elevando el locale `es` a `18` overlays revisados y abriendo cobertura limpia en `enumerated-types` (`3/37`) y `enumerated-values` (`2/245`) sin traducir valores con `!`, `signatureLabel` ni otros anchors técnicos.

El corte cerrado de datatypes (`SYMBOL-CATALOG-DATATYPES-ENRICH-P2`) añade overlays `es` revisados para `DataStore`, `DataWindowChild`, `Transaction`, `HTTPClient` y `RESTClient`, elevando el locale `es` a `23` overlays revisados y abriendo cobertura limpia en `system-object-datatypes` (`5/224`) sin traducir nombres reales de datatypes ni otros anchors tecnicos.

El corte cerrado de statements (`SYMBOL-CATALOG-STATEMENTS-ENRICH-P2`) añade overlays `es` revisados para `IF...THEN`, `CHOOSE CASE`, `FOR...NEXT`, `IF`, `FOR`, `TRUE`, `FALSE` y `NOT`, elevando el locale `es` a `31` overlays revisados y abriendo cobertura limpia en `statements` (`3/16`), `keywords` (`2/60`) y `reserved-words` (`3/48`) sin traducir lexemas ni otros anchors tecnicos.

Con estos cinco cortes, `CATALOG-LOCALIZATION-ES-01` queda `Partial`: el rail `es` ya cubre `global-functions`, `datawindow-functions`, `enumerated-types`, `enumerated-values`, `system-object-datatypes`, `statements`, `keywords` y `reserved-words` con audit limpio, pero sigue pendiente abrir `datawindow-properties` y el resto del carril `generated` todavia sin slice visible.

Con ese baseline, `CATALOG-LOCALIZATION-DOMAINS-01` tambien queda `Partial`: el reporte y el migrador ya consolidan el estado factual del rail `es` sin issues ni targetIds recuperados, pero no es defendible marcarlo `Done` mientras `datawindow-properties` (`0/7`) y el resto de dominios `generated` sigan sin slice visible ni decision de alcance documentada.

---

## 6. Guía de estilo

- Traducir significado, no símbolos.
- Mantener nombres reales del lenguaje en inglés/original.
- Usar español técnico claro, breve y estable.
- No inventar comportamiento que no esté en la referencia oficial.
- Si se añade explicación curada, marcar `source: 'manual-curated'`.
- Mantener `sourceUrl` oficial como trazabilidad del símbolo base.
- Preferir cubrir primero `summary`, `documentation`, `returnDocumentation` y parámetros ya documentados en la entry base.
- Si la entry base tiene `usageNotes`, no marcar el overlay como revisado hasta aportar una nota equivalente o decidir explícitamente que no aplica.

## 6.1 Cuándo usar `source: 'manual-curated'`

Usarlo cuando el overlay:

- añade explicación redactada y revisada manualmente sobre comportamiento ya respaldado por la referencia oficial;
- traduce o resume documentación visible sin cambiar anchors ni semántica del símbolo;
- aporta una nota de uso, limitación o retorno útil que no inventa comportamiento nuevo;
- ya pasó por el audit y puede sostener `reviewed: true` o quedar explícitamente `reviewed: false` mientras madura.

No usar `manual-curated` como etiqueta cosmética si el contenido no añade valor real frente al texto oficial o si todavía depende de suposiciones no verificadas.

## 6.2 Cuándo NO añadir enrichment

No añadir un overlay cuando:

- no puedes resolver la entry canónica con `targetId` o `targetKey` defendible;
- necesitas traducir `name`, `signatureLabel`, `parameterName`, enum values, datatypes u otro anchor técnico para que “encaje”;
- el único resultado sería duplicar en español una frase oficial sin contexto útil ni mejora visible;
- falta evidencia oficial suficiente para redactar explicación curada sin inventar comportamiento;
- el overlay seguiría saliendo como `schemaIssue`, `incomplete`, `invalidParameterTarget`, `recoveredTargetId` pendiente o huérfano y no piensas corregirlo en el mismo corte.

---

## 7. Qué significan los issues

- `orphanOverlays`: el target ya no resuelve por `targetId`/`targetKey`.
- `incompleteOverlays`: faltan campos documentales que sí existen en la entry base (`summary`, `documentation`, `usageNotes`, `obsoleteMessage`, `returnDocumentation`, `parameterDocumentation`).
- `invalidParameterTargets`: el overlay intentó usar un `signatureLabel` o `parameterName` que no coincide con la firma real del símbolo; suele significar que alguien tradujo un anchor técnico o lo copió mal.
- `recoveredTargetIds`: el `targetId` fuente ya no existe, pero `targetKey` todavía recupera un target canónico válido. El serving no se rompe, pero el overlay debería reconciliar su `targetId` con el migrador offline.
- `schemaIssues`: el overlay incumple el contrato base del schema (`source`/`reviewed` faltantes o `reviewed: true` coexistiendo con issues de integridad/calidad).

---

## 8. Cuándo usar `targetId` y cuándo `targetKey`

- `targetId`: usar cuando la entry ya está consolidada y el ID es estable dentro del catálogo actual.
- `targetKey`: usar cuando la entry procede de `generated` o de un bucket lógico cuyo `targetId` puede moverse con regeneraciones futuras.
- ambos: usar `targetId` + `targetKey` cuando quieres drift explícito y recuperación automática. Si el reporte publica `recoveredTargetIds`, ejecutar el migrador y volver a dejar el source reconciliado.

## 8.1 Ejemplos mínimos

Overlay localizado sobre una entry `generated` usando `targetKey` como ancla principal:

```ts
{
	locale: 'es',
	reviewed: true,
	source: 'manual-curated',
	targetKey: {
		domain: 'system-object-datatypes',
		kind: 'system-type',
		namespace: 'powerbuilder-runtime',
		invocation: 'global',
		name: 'HTTPClient',
	},
	text: {
		summary: 'HTTPClient es un objeto base para enviar solicitudes HTTP y recibir respuestas HTTP desde un recurso identificado por una URI.',
		documentation: 'Es mas facil de usar que Inet y soporta mas metodos HTTP y protocolos SSL/TLS.',
	},
}
```

Recovery explícito cuando quieres dejar trazado de drift y reconciliarlo luego con el migrador:

```ts
{
	locale: 'es',
	reviewed: false,
	source: 'manual-curated',
	targetId: 'generated:global-functions:callable:powerscript:global:abs:all:stale',
	targetKey: {
		domain: 'global-functions',
		kind: 'callable',
		namespace: 'powerscript',
		invocation: 'global',
		name: 'Abs',
	},
	text: {
		summary: 'Calcula el valor absoluto de un numero.',
	},
}
```

En ambos casos, `name`, firmas, `parameterName`, datatypes, enum values y demás anchors técnicos permanecen intactos; sólo cambia el texto visible dentro de `text`.

---

## 9. Validación mínima

```bash
npm run test:unit -- --grep "catalogLocalization|catalogConsistency"
npm run report:catalog-localization
npm run migrate:catalog-localization-target-ids
```

El reporte generado debe quedar con `schemaIssues = 0`, `orphanOverlays = 0`, `invalidParameterTargets = 0`, `recoveredTargetIds = 0` y `missingFieldsByDomain` consistente con el estado factual del dominio tocado. Si además el cambio toca consumers visibles o locale runtime, sumar las validaciones de `B373`.

---

## 10. Hallazgo de auditoría: manual/** en español (2026-05-06)

> [!CAUTION]
> La auditoría `CATALOG-MANUAL-LOCALIZATION-AUDIT` detectó que **todo `manual/**` tiene `summary`, `documentation` y `category` en español**. Esto causa que cuando `locale = en`, los consumers (hover, completion, signatureHelp) muestren texto español al usuario.

### Estado factual

- ~1200+ entries en `manual/**` con texto visible en español.
- 29+ categorías españolas usadas como keys lógicas.
- `localization/es/**` solo cubre entries de `generated/`, no de `manual/`.
- No existe estructura espejo `localization/es/{core,datawindow,...}/`.

### Política objetivo

```
manual/**         = overrides/enrichments en INGLÉS canónico
localization/es/**= overlay español visible, sin cambiar identidad técnica
```

### Plan de migración

```
1. CATALOG-MANUAL-BASE-LANGUAGE-POLICY-01  — Formalizar política EN-base
2. CATALOG-MANUAL-CATEGORIES-KEYS-01       — Normalizar categorías a keys EN
3. CATALOG-LOCALIZATION-MIRROR-STRUCTURE-01 — Crear estructura espejo es/
4. CATALOG-MANUAL-EN-MIGRATION             — Migrar por dominio: core, DW, visual, runtime, language, integration, tooling
```

Cada slice de migración debe:
- Preservar el texto ES original como overlay en `localization/es/` antes de sobrescribir con EN.
- Mantener el baseline en 0 incomplete / 0 invalid / 0 recovered / 0 orphan.
- Registrar cobertura antes/después.
- No cambiar IDs, names, signatures, parameterNames, datatypes ni anchors técnicos.