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

---

## 3. Comando de trabajo

```bash
npm run report:catalog-localization
```

Este comando recompila el servidor, ejecuta el audit vivo del catálogo y deja un snapshot determinista con:

- conteos por locale (`overlayCount`, `reviewedCount`, `targetIdCount`, `targetKeyCount`, `orphanCount`);
- cobertura por dominio (`localizedTargetCount`, `reviewedTargetCount`, ratios sobre targets canónicos);
- overlays incompletos (`missingFields`);
- anchors técnicos inválidos (`invalidParameterTargets`);
- overlays huérfanos.

---

## 4. Workflow incremental

1. Ejecutar `npm run report:catalog-localization` y elegir el siguiente dominio según cobertura y prioridad.
2. Añadir overlays en `src/server/knowledge/system/localization/es/` siguiendo el archivo del dominio correspondiente.
3. Mantener siempre nombres reales, `signatureLabel` y `parameterName` en inglés/original, tal como aparecen en la entry base.
4. Rerun:

```bash
npm run test:unit -- --grep "catalogLocalization|catalogConsistency"
npm run report:catalog-localization
```

5. Solo marcar `reviewed: true` cuando el overlay ya no aparezca como `incomplete` ni como `invalidParameterTarget`, y siga sin generar huérfanos.

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

---

## 7. Qué significan los issues

- `orphanOverlays`: el target ya no resuelve por `targetId`/`targetKey`.
- `incompleteOverlays`: faltan campos documentales que sí existen en la entry base (`summary`, `documentation`, `usageNotes`, `obsoleteMessage`, `returnDocumentation`, `parameterDocumentation`).
- `invalidParameterTargets`: el overlay intentó usar un `signatureLabel` o `parameterName` que no coincide con la firma real del símbolo; suele significar que alguien tradujo un anchor técnico o lo copió mal.

---

## 8. Validación mínima

```bash
npm run test:unit -- --grep "catalogLocalization|catalogConsistency"
npm run report:catalog-localization
```

Si además el cambio toca consumers visibles o locale runtime, sumar las validaciones de `B373`.