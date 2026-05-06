
> Objetivo: ejecutar **todas las specs restantes del backlog de Symbols + Generated Enrichment + Catalog Localization**, una a una, en orden estricto, después de haber completado o dejado correctamente cerrada/Partial la spec `SYMBOL-I18N-ENRICHMENT-AUDIT-01`.
>
> Este prompt está diseñado para evitar que el agente se pare a mitad, abra trabajo fuera de orden, cierre sin validación o deje backlog/docs desalineados.

---

## Spec previa obligatoria

Antes de empezar, verifica el estado de:

```text
SYMBOL-I18N-ENRICHMENT-AUDIT-01 — Macroauditoría de i18n, localization y enrichment layers
```

Reglas:

- Si está `Done`, continúa con la secuencia.
- Si está `Partial`, lee el pendiente exacto y decide si bloquea alguna spec posterior.
- Si no existe reporte final, no empieces specs dependientes: primero deja el gap en backlog/current-focus.
- Si la auditoría detectó blockers P1/P0 no resueltos, no los ignores.

---

## Reglas duras globales

- NO preguntes.
- NO pares hasta terminar la secuencia posible.
- Ejecuta las specs **una a una** y en el orden definido en este prompt.
- NO abras una spec si sus dependencias no están satisfechas.
- NO ejecutes specs P2/P3 si queda una P1 bloqueante relacionada.
- NO implementes features fuera del backlog.
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
- NO hagas IO/workspace scan/full parse en hot path para enrichments.
- NO dupliques reglas entre documentos.
- Cada regla debe tener owner documental claro.
- Cada spec cerrada debe tener código real si aplica, tests/validación, docs actualizadas y done-log si queda `Done`.
- Si una spec no puede cerrarse, déjala como `Partial` con pendiente exacto.
- Todo gap nuevo debe terminar en backlog con evidencia, riesgo, plan, validación, docs y tests.

---

## Orden estricto de ejecución

Ejecuta en este orden:

```text
10. SYMBOL-I18N-TERMS-01
11. SYMBOL-CATALOG-DW-ENRICH-P1
12. SYMBOL-DW-01
13. SYMBOL-TOKENS-01
14. SYMBOL-CATALOG-ENUMS-ENRICH-P2
15. SYMBOL-CATALOG-DATATYPES-ENRICH-P2
16. SYMBOL-CATALOG-STATEMENTS-ENRICH-P2
17. CATALOG-LOCALIZATION-DOMAINS-01
18. SYMBOL-DOCS-EXAMPLES-01
19. SYMBOL-FRAMEWORKS-01
```

Si una spec del listado no existe en `docs/backlog.md`, no la inventes silenciosamente. Añádela sólo si el backlog recomendado o la auditoría previa la justifican, con origen, evidencia, prioridad, acceptance criteria, docs y tests.

---

# FASE 0 — Preparación común antes de cada spec

Antes de cada spec:

1. Lee `docs/backlog.md`.
2. Lee `docs/current-focus.md`.
3. Lee `docs/roadmap.md` si existe.
4. Lee `docs/done-log.md`.
5. Lee `docs/symbol-system.md`.
6. Lee `docs/localization.md` o `docs/catalog-localization-workflow.md` si existe.
7. Lee `docs/architecture-implementation-map.md`.
8. Lee `docs/testing.md`.
9. Lee `docs/performance-budget.md`.
10. Revisa dependencias de la spec.
11. Verifica que la spec sigue siendo necesaria.
12. Promueve la spec a current-focus sólo si vas a ejecutarla.

---

# FASE 10 — SYMBOL-I18N-TERMS-01

## Objetivo

Crear glosario estable español/inglés para presentation/enrichments.

## Términos mínimos

```text
function
event
variable
parameter
return value
DataWindow
DataStore
DataWindowChild
transaction
ancestor
override
scope
source origin
confidence
deprecated
inferred
ambiguous
unknown
```

## Cierre

```bash
npm run test:unit
npm run test:docs:drift
```

---

# FASE 11 — SYMBOL-CATALOG-DW-ENRICH-P1

## Objetivo

Enriquecer documentación visible de DataWindow core sin modificar anchors, property paths ni identidad.

## Reglas

- Seleccionar DataWindow functions/properties/core entries de alto impacto.
- Mantener DataWindow names, property paths y enum values intactos.
- Traducir/enriquecer sólo documentación visible.
- Añadir targetKey si la entry procede de generated inestable.
- Validar performance de hover/completion/signatureHelp.
- Registrar cobertura antes/después.

## Cierre

```bash
npm run test:unit -- --grep "dataWindow|catalogLocalization|catalogConsistency|documentationService"
npm run report:catalog-localization
npm run test:performance:gate
npm run test:docs:drift
```

---

# FASE 12 — SYMBOL-DW-01

## Objetivo

Definir enrichments DataWindow sobre `DataWindowFastContext`.

## Debe cubrir

```text
DataWindow control
DataStore variable
DataWindowChild
DataObject literal
column
computed field
property path
buffer
dynamic/unknown binding
```

## Reglas

- Confidence/sourceOrigin obligatorio.
- No parsear `.srd` como PowerScript normal.
- Dynamic/unknown no debe generar falsos positivos fuertes.

## Cierre

```bash
npm run test:unit -- --grep "dataWindow"
npm run test:architecture:rapid
npm run test:docs:drift
```

---

# FASE 13 — SYMBOL-TOKENS-01

## Objetivo

Definir mapping explícito de símbolos PowerBuilder a token types/modifiers.

## Reglas

- Semantic tokens no dependen de texto traducido.
- Decidir tipos estándar VS Code vs custom token types.
- Documentar mapping y límites.
- Crear tests de rangos/modifiers.

## Cierre

```bash
npm run test:unit -- --grep "semanticTokens"
npm run test:performance:gate
npm run test:docs:drift
```

---

# FASE 14 — SYMBOL-CATALOG-ENUMS-ENRICH-P2

## Objetivo

Enriquecer documentación visible de enumerated types/values sin traducir enum values.

## Reglas

- Mantener valores con `!` intactos.
- Traducir sólo explicación/summary/usageNotes.
- Validar contexto esperado de enums en completion/signatureHelp/diagnostics si aplica.

## Cierre

```bash
npm run test:unit -- --grep "enum|catalogLocalization|catalogConsistency"
npm run test:docs:drift
```

---

# FASE 15 — SYMBOL-CATALOG-DATATYPES-ENRICH-P2

## Objetivo

Enriquecer datatypes principales del sistema sin traducir datatypes reales.

## Reglas

- Mantener datatypes en original.
- Enriquecer descripción visible.
- Añadir usage notes sólo si existe evidencia.
- Validar hover/completion si estos datatypes son visibles.

## Cierre

```bash
npm run test:unit -- --grep "catalogLocalization|catalogConsistency|systemCatalog"
npm run test:docs:drift
```

---

# FASE 16 — SYMBOL-CATALOG-STATEMENTS-ENRICH-P2

## Objetivo

Enriquecer ayuda contextual de statements, keywords y reserved words sin traducir lexemas.

## Reglas

- Mantener keywords/reserved words originales.
- Traducir sólo ayuda visible.
- SemanticTokens no dependen de textos localizados.
- Validar completion/hover si aplica.

## Cierre

```bash
npm run test:unit -- --grep "keyword|reserved|catalogLocalization|catalogConsistency"
npm run test:docs:drift
```

---

# FASE 17 — CATALOG-LOCALIZATION-DOMAINS-01

## Objetivo

Avanzar cobertura por dominios completos con métricas antes/después.

## Dominios

```text
global-functions
DataWindow core
system object datatypes
enumerated types/values
statements/reserved words
resto generated
```

## Cierre

```bash
npm run report:catalog-localization
npm run migrate:catalog-localization-target-ids
npm run test:docs:drift
```

---

# FASE 18 — SYMBOL-DOCS-EXAMPLES-01

## Objetivo

Documentar ejemplos breves de overlays, enrichments y payloads sin copiar catálogos completos.

## Ejemplos mínimos

```text
overlay localizado
enrichment manual-curated
confidence/sourceOrigin
completion resolve enrichment
targetId/targetKey recovery
```

## Cierre

```bash
npm run test:docs:drift
```

---

# FASE 19 — SYMBOL-FRAMEWORKS-01

## Objetivo

Añadir enrichments PFC/STD sólo advisory.

## Reglas

- Nunca autoridad sobre símbolo real.
- Declarar source, confidence, tests y fallback.
- No portar código legacy.
- Usar corpus/fixtures locales sólo si existen.
- Si corpus no existe, skip honesto; no inventar resultados.

## Cierre

```bash
npm run test:unit
npm run test:docs:drift
```

---

# Revisión final global obligatoria

Cuando termines todas las specs posibles:

1. Relee `docs/backlog.md`.
2. Relee `docs/current-focus.md`.
3. Relee `docs/roadmap.md`.
4. Relee `docs/done-log.md`.
5. Relee `docs/symbol-system.md`.
6. Relee `docs/localization.md`.
7. Relee `docs/testing.md`.
8. Relee `docs/performance-budget.md`.
9. Relee `docs/architecture-implementation-map.md`.
10. Verifica que no quedan specs ejecutadas sin estado correcto.
11. Verifica que no queda spec `Done` sin validación/done-log.
12. Verifica que no queda spec `Partial` sin pendiente exacto.
13. Verifica que no hay contradicciones entre docs.
14. Verifica que no hay reglas duplicadas sin owner.
15. Verifica que no hay anchors traducidos.
16. Verifica que `completion initial` sigue compacto.
17. Verifica que enrichment pesado va a resolve/hover cacheable/offline.
18. Verifica que todos los gaps quedan en backlog.
19. Ejecuta validaciones finales reales disponibles.
20. Genera reporte final.

---

## Validaciones finales esperadas

Ejecuta las disponibles:

```bash
npm run compile
npm run test:unit -- --grep "catalogLocalization|catalogConsistency|documentationService|completion|hover|signatureHelp"
npm run report:catalog-localization
npm run migrate:catalog-localization-target-ids
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:performance:gate
npm run test:unit
npm test
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

## Reporte final obligatorio

Genera un reporte final con esta estructura:

```markdown
# Symbols, Generated Enrichment & Catalog Localization Execution Report

## 1. Specs ejecutadas

## 2. Specs cerradas como Done

## 3. Specs dejadas como Partial y pendiente exacto

## 4. Specs bloqueadas y motivo

## 5. Cambios de código

## 6. Cambios de documentación

## 7. Cambios de backlog/current-focus/roadmap/done-log

## 8. Validaciones ejecutadas

## 9. Validaciones no ejecutadas y motivo

## 10. Gaps nuevos detectados

## 11. Backlog derivado creado

## 12. Riesgos pendientes

## 13. Siguiente slice recomendado
```

---

## Criterio de cierre global

Sólo puedes cerrar la secuencia si:

```text
1. Cada spec ejecutada tiene estado correcto.
2. Las specs Done tienen tests/docs/done-log.
3. Las specs Partial tienen pendiente exacto.
4. No quedan blockers P1 sin backlog.
5. No hay anchors técnicos traducidos.
6. No hay cambios no autorizados en generated identity.
7. completion initial sigue compacto.
8. Los enrichments pesados son lazy/cacheados/offline.
9. Docs están alineadas y sin duplicación crítica.
10. Backlog/current-focus/roadmap/done-log están sincronizados.
11. Reporte final existe.
```

Si no se cumple todo, no declares cierre total. Declara cierre parcial y lista exactamente lo pendiente.
