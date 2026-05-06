# Ejecutar spec exacta: SYMBOL-I18N-ENRICHMENT-AUDIT-01

Ejecuta únicamente la spec del backlog:

`SYMBOL-I18N-ENRICHMENT-AUDIT-01 — Macroauditoría de i18n, localization y enrichment layers`

## Objetivo

Auditar exhaustivamente la internacionalización/localización/enrichments del system catalog y del sistema de símbolos antes de implementar nuevas traducciones o enrichments sobre `generated`.

Debes comprobar que está correctamente separada esta cadena:

```text
symbol identity
  -> generated catalog entry
  -> manual/curated enrichment
  -> localization overlay
  -> localized presentation
  -> LSP payload
```

## Reglas duras

- NO preguntes.
- NO pares hasta terminar.
- NO implementes nuevas features.
- NO abras otras specs del backlog.
- NO empieces a enriquecer símbolos todavía.
- NO añadas traducciones nuevas salvo que sea necesario para corregir una incoherencia mínima demostrada.
- NO cambies generated IDs/domains/kinds/namespaces/lookupKeys/signatures/parameterName/sourceUrl.
- NO traduzcas anchors técnicos:
  - `name`
  - `id`
  - `lookupKeys`
  - `normalizedName`
  - `ownerTypes`
  - `domain`
  - `kind`
  - `namespace`
  - `invocation`
  - `signatures.label`
  - `parameterName`
  - `datatypes`
  - `enum values`
  - `sourceUrl`
- NO traduzcas nombres reales de funciones, variables, objetos, columnas, DataObjects ni controles.
- NO inventes firmas ni documentación built-in.
- NO metas documentación larga en `completion initial`.
- NO dupliques reglas entre documentos.
- Cada regla debe tener un owner documental claro.
- Todo gap debe terminar corregido o registrado en backlog con evidencia, riesgo, plan y validación.
- No marques la spec como `Done` si no has ejecutado validaciones reales o justificado por qué no se pudieron ejecutar.

---

## FASE 1 — Leer documentación y entender estado actual

Lee y revisa como mínimo:

```text
docs/backlog.md
docs/current-focus.md
docs/roadmap.md
docs/done-log.md
docs/architecture-implementation-map.md
docs/architecture-status.md
docs/symbol-system.md
docs/localization.md
docs/testing.md
docs/performance-budget.md
docs/adr/ADR-0001-system-catalog-source-of-truth.md
```

Si algún documento no existe, no lo inventes: registra el gap y decide si debe crearse o si otro documento ya es el owner.

Debes comprobar:

1. Qué documento es fuente de verdad para símbolos.
2. Qué documento es fuente de verdad para localization/catalog overlays.
3. Qué documento describe performance budgets.
4. Qué documento describe comandos/tests reales.
5. Qué documento gobierna generated/manual/localization.
6. Si hay duplicidad o contradicción entre docs.

---

## FASE 2 — Auditar código real relacionado

Audita código real en estas zonas, si existen:

```text
src/server/knowledge/system/generated/**
src/server/knowledge/system/manual/**
src/server/knowledge/system/localization/**
src/server/knowledge/system/SystemCatalog.ts
src/server/knowledge/system/services/**
src/server/knowledge/system/localization/documentationService.ts
src/server/features/completion.ts
src/server/features/hover.ts
src/server/features/signatureHelp.ts
src/server/presentation/**
scripts/*catalog*
tools/*catalog*
package.json
```

Comprueba:

1. Cómo se carga `generated`.
2. Cómo se cargan overlays manuales/curated.
3. Cómo se cargan overlays localizados.
4. Si `SystemCatalog` actúa como fachada única.
5. Si localization crea símbolos nuevos o sólo documentación visible.
6. Si hay fallback correcto cuando falta locale.
7. Si completion initial carga documentación pesada.
8. Si completion resolve difiere documentación/enrichment.
9. Si hover usa cache/enrichment sin hacer scans pesados.
10. Si signatureHelp consume firmas reales y no traducciones.
11. Si semantic tokens dependen o no de texto traducido.
12. Si diagnostics/reasonCodes tienen estrategia i18n o gap explícito.

---

## FASE 3 — Auditar generated/manual/localization

Verifica estrictamente:

```text
generated = fuente oficial reproducible
manual/curated = gaps, enrichments, overrides o candidates con política explícita
localization = overlay documental presentation-only por locale
```

Comprueba que:

- `generated` no se modifica manualmente para traducir.
- `manual/curated` no reemplaza identidad semántica sin política.
- `localization` no duplica entradas como símbolos nuevos.
- `localization` no traduce anchors técnicos.
- `localization` sólo afecta documentación visible.
- `sourceUrl` se conserva como trazabilidad del símbolo base.
- `source: 'manual-curated'` o equivalente se usa cuando hay explicación curada.
- `targetId` y `targetKey` están explicados y validados.
- `reviewed: true` sólo se permite cuando no hay issues pendientes.

---

## FASE 4 — Auditar targetId, targetKey y reportes

Ejecuta o revisa, según existan:

```bash
npm run test:unit -- --grep "catalogLocalization|catalogConsistency"
npm run report:catalog-localization
npm run migrate:catalog-localization-target-ids
```

Comprueba en el reporte:

```text
overlayCount
reviewedCount
targetIdCount
targetKeyCount
orphanCount
localizedTargetCount
reviewedTargetCount
missingFields
invalidParameterTargets
recoveredTargetIds
orphanOverlays
```

Reglas:

- Si hay `orphanOverlays`, registrar gap P1.
- Si hay `invalidParameterTargets`, registrar gap P1.
- Si hay `recoveredTargetIds`, verificar si procede migrador dry-run.
- No usar `--write` salvo que el dry-run sea claro y seguro.
- Si no se ejecuta un comando, indicar motivo real.

---

## FASE 5 — Auditar performance de enrichment/localization

Comprueba si algún consumer hace en hot path:

```text
IO
workspace scan
full parse
full catalog scan
large stringify
heavy markdown rendering
heavy localization bundle load
heavy enrichment resolution
```

Revisa especialmente:

```text
completion initial
completion resolve
hover
signatureHelp
semanticTokens
diagnostics
```

Reglas:

- `completion initial` debe ser compacto.
- documentación larga debe ir a `completionItem/resolve` o hover cacheable.
- locale debe formar parte de la clave de cache si afecta output.
- unknown/ambiguous debería tener negative cache si aplica.
- semantic tokens no deben depender de strings localizados.
- no debe haber full-catalog scan por cada request interactiva.

---

## FASE 6 — Auditar documentación

Revisa si estas reglas están correctamente documentadas y no duplicadas:

```text
no traducir anchors técnicos
generated como fuente oficial reproducible
manual/curated como enrichment/gap controlado
localization como overlay documental
targetId vs targetKey
reviewed: true
completion initial vs completion resolve
source/provenance
sourceOrigin/confidence
fallback de locale
validaciones reales
```

Documentos esperados:

```text
docs/symbol-system.md
docs/localization.md
docs/testing.md
docs/performance-budget.md
docs/architecture-implementation-map.md
docs/backlog.md
```

Si una regla aparece repetida en varios documentos, decide owner canónico y convierte el resto en enlaces/resúmenes.

---

## FASE 7 — Generar hallazgos y backlog derivado

Genera un reporte final con esta estructura:

```markdown
# SYMBOL-I18N-ENRICHMENT-AUDIT-01 Report

## 1. Evidencia revisada

## 2. Estado factual

## 3. Cadena identity -> generated -> manual -> localization -> presentation -> LSP payload

## 4. Hallazgos

### Critical/High

### Medium

### Low

## 5. Gaps de documentación

## 6. Gaps de código/arquitectura

## 7. Gaps de performance

## 8. Gaps de testing

## 9. Validaciones ejecutadas

## 10. Validaciones no ejecutadas y motivo

## 11. Backlog derivado recomendado

## 12. Siguiente slice recomendado
```

Todo backlog derivado debe tener este formato:

```markdown
## <ID> — <Título>

- **Estado:** Open.
- **Prioridad:** P1/P2/P3.
- **Origen:** SYMBOL-I18N-ENRICHMENT-AUDIT-01.
- **Evidencia:** ...
- **Riesgo:** ...
- **Plan:** ...
- **Validación:** ...
- **Docs:** ...
- **Tests:** ...
```

---

## FASE 8 — Revisión final obligatoria contra el backlog

Antes de cerrar, vuelve a leer `docs/backlog.md` y comprueba específicamente:

1. Que `SYMBOL-I18N-ENRICHMENT-AUDIT-01` ha cumplido todos sus acceptance criteria.
2. Que no has abierto otras specs por error.
3. Que no has implementado enrichments fuera de alcance.
4. Que los nuevos gaps están registrados en backlog.
5. Que no quedan referencias contradictorias entre:
   - `docs/backlog.md`
   - `docs/current-focus.md`
   - `docs/roadmap.md`
   - `docs/done-log.md`
   - `docs/symbol-system.md`
   - `docs/localization.md`
   - `docs/testing.md`
   - `docs/performance-budget.md`
6. Que `current-focus` sigue apuntando al trabajo correcto.
7. Que `done-log` sólo se actualiza si la spec queda realmente cerrada.
8. Que si la spec no puede cerrarse, queda como `Partial` con pendiente exacto.

---

## Validaciones esperadas

Ejecuta las disponibles:

```bash
npm run test:unit -- --grep "catalogLocalization|catalogConsistency|documentationService|completion|hover|signatureHelp"
npm run report:catalog-localization
npm run migrate:catalog-localization-target-ids
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:performance:gate
```

Si alguna no existe o falla por entorno, registra:

```text
comando
resultado
motivo
impacto
follow-up
```

---

## Criterio de cierre

Sólo puedes cerrar `SYMBOL-I18N-ENRICHMENT-AUDIT-01` si:

```text
1. La separación identity/generated/manual/localization/presentation/LSP está verificada.
2. No hay contradicciones documentales críticas.
3. No hay reglas duplicadas sin owner documental.
4. targetId/targetKey/reviewed están documentados y validados.
5. completion initial sigue protegido frente a documentación pesada.
6. Los gaps están corregidos o backlogizados.
7. Las validaciones reales fueron ejecutadas o justificadas.
8. backlog/current-focus/roadmap/done-log quedaron alineados.
9. El reporte final existe.
```

Si no se cumple todo, deja la spec como `Partial` y documenta el pendiente exacto.
```
