# Prompt — Audit & Migration Plan: English Base + Spanish Localization Mirror

Ejecuta una auditoría completa para convertir el plugin a **base canónica en inglés** y dejar una capa de **localización española completa**, organizada como espejo lógico de `manual/**`.

## Objetivo

Auditar, planificar y preparar la migración para que:

```text
generated/**      = fuente oficial reproducible, sin cambios manuales de identidad
manual/**         = overrides/enrichments curados en inglés o metadata no localizada
localization/es/** = traducción/localización española visible, sin cambiar identidad técnica
presentation/**   = aplica locale y formato final para UI/LSP payloads
```

La auditoría debe generar **TODOS los backlog items necesarios** para dejar el sistema correctamente migrado, sin duplicidad de traducción, sin anchors técnicos traducidos y sin degradar el hot path.

---

## Reglas duras

- NO preguntes.
- NO pares hasta terminar la auditoría completa.
- NO implementes migraciones masivas sin backlog/spec explícita.
- NO cambies `generated/**` salvo que sea un cambio autorizado por spec y validado.
- NO traduzcas anchors técnicos.
- NO cambies IDs, domains, kinds, namespaces, lookupKeys, signatures, parameterName, datatypes, enum values ni sourceUrl.
- NO traduzcas nombres reales de funciones, variables, objetos, columnas, DataObjects, controles ni property paths.
- NO inventes firmas ni documentación built-in.
- NO dejes texto visible en español dentro de `manual/**` salvo que sea comentario interno no user-facing y quede justificado.
- NO dupliques la misma documentación española en `manual/**` y `localization/es/**`.
- NO metas documentación pesada en `completion initial`.
- NO hagas IO/workspace scan/full parse en hot path para resolver localización/enrichments.
- Todo texto visible español detectado en `manual/**` debe clasificarse y tener destino:
  - mover a `localization/es/**`;
  - traducir `manual/**` a inglés;
  - eliminar si es duplicado/obsoleto;
  - justificar si no aplica.
- Todo gap debe terminar en backlog con evidencia, riesgo, plan, docs y validación.

---

## Política final esperada

### `generated/**`

Debe representar:

```text
fuente oficial reproducible
identidad técnica
data oficial
documentación base generada si existe
```

No debe convertirse en lugar de traducciones manuales.

### `manual/**`

Debe representar:

```text
overrides curados
gaps manuales
enrichments canónicos base
authoring en inglés
metadata no localizada
correcciones de firmas/ownerTypes/risk/provenance
```

Si tiene texto visible, debe estar en inglés salvo excepción explícita y justificada.

### `localization/es/**`

Debe representar:

```text
summary en español
documentation en español
usageNotes en español
obsoleteMessage en español
returnDocumentation en español
parameterDocumentation en español
labels visibles en español
reasonCodes/help snippets en español
```

Debe ser overlay presentation-only por locale.

### Organización espejo lógica

`localization/es/**` debe quedar organizada de forma equivalente a `manual/**`, no necesariamente archivo por archivo exacto, pero sí con correspondencia clara por dominio:

```text
manual/core/**        -> localization/es/core/**
manual/datawindow/**  -> localization/es/datawindow/**
manual/integration/** -> localization/es/integration/**
manual/language/**    -> localization/es/language/**
manual/runtime/**     -> localization/es/runtime/**
manual/tooling/**     -> localization/es/tooling/**
manual/visual/**      -> localization/es/visual/**
```

Si se decide mantener archivos agregados, debe existir un mapa claro de correspondencia dominio -> localization owner.

---

## FASE 1 — Inventario de estructura actual

Revisa la estructura real de:

```text
src/server/knowledge/system/generated/**
src/server/knowledge/system/manual/**
src/server/knowledge/system/localization/**
src/server/knowledge/system/localization/es/**
src/server/knowledge/system/SystemCatalog.ts
src/server/knowledge/system/registry/**
src/server/knowledge/system/localization/**
src/server/presentation/**
src/server/features/completion.ts
src/server/features/hover.ts
src/server/features/signatureHelp.ts
src/server/features/semanticTokens.ts
scripts/*catalog*
tools/*catalog*
package.json
```

Entrega un mapa factual:

```markdown
## Current structure map

### manual/**
- core: ...
- datawindow: ...
- integration: ...
- language: ...
- ownerTypes: ...
- runtime: ...
- tooling: ...
- visual: ...

### localization/es/**
- current files/folders: ...
- domains covered: ...
- missing mirror domains: ...
```

---

## FASE 2 — Auditoría de texto español en `manual/**`

Busca texto visible en español dentro de todo `manual/**`.

Revisa como mínimo:

```text
summary
documentation
usageNotes
obsoleteMessage
returnDocumentation
parameterDocumentation
category
label
description
manualOverlay.reason
comments user-facing si existen
examples/comments visibles
```

Clasifica cada hallazgo:

```text
Spanish visible text -> move to localization/es
Spanish category label -> convert to stable key + localized label
Spanish technical anchor -> critical bug, must be fixed
Spanish internal comment -> keep or translate depending on owner policy
Duplicate Spanish text already in localization/es -> remove from manual or reconcile
Spanish text with no English base -> create English manual base + Spanish localization overlay
```

Genera tabla de hallazgos:

```markdown
| File | Symbol/Entry | Field | Spanish text type | Target action | Target localization domain | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
```

---

## FASE 3 — Auditoría de categorías y labels

Detecta categorías localizadas usadas como claves lógicas.

Ejemplos a buscar:

```text
Datos
Metadatos
Navegación
Transacciones
Visual
Layout
Contexto
Texto
Sistema
Ficheros
Compresión
Criptografía
HTTP
JSON
REST
OAuth
PDF
```

Define política final:

```text
category key interna = inglés estable / enum-like
category label visible = localization
```

Ejemplo:

```text
category: 'data'
label.es: 'Datos'
label.en: 'Data'
```

Genera backlog para normalizar categorías sin romper consumers.

---

## FASE 4 — Auditoría de `localization/es/**` como espejo lógico

Comprueba si `localization/es/**` cubre todos los dominios de `manual/**`.

Debe revisar:

```text
core
datawindow
integration
language
ownerTypes
runtime
tooling
visual
common/shared labels
```

Para cada dominio:

```markdown
| Manual domain | Localization es owner exists | Coverage | Missing files/domains | Recommended action |
| --- | --- | ---: | --- | --- |
```

Si falta un dominio en localization, crear backlog para añadirlo.

---

## FASE 5 — Auditoría de targetId/targetKey y anchors técnicos

Ejecuta o revisa:

```bash
npm run test:unit -- --grep "catalogLocalization|catalogConsistency"
npm run report:catalog-localization
npm run migrate:catalog-localization-target-ids
```

Revisa:

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

- `orphanOverlays` -> backlog P1.
- `invalidParameterTargets` -> backlog P1.
- `recoveredTargetIds` -> migrator dry-run + backlog/reconcile.
- No usar `--write` sin revisar dry-run.
- `reviewed: true` sólo si no hay incomplete/invalid/recovered/orphan.

---

## FASE 6 — Auditoría de fallback inglés/español

Verifica comportamiento esperado:

```text
locale = en -> generated/manual English/base text
locale = es -> localization/es overlay, fallback a manual/generated English si falta overlay
locale = auto -> VS Code/server effective locale si existe, fallback controlado
```

Comprueba que no pueda ocurrir:

```text
locale en muestra español desde manual/**
locale es duplica símbolo por idioma
semanticTokens dependen de textos traducidos
signatureHelp usa translated signature labels
completion initial carga documentación localizada pesada
```

Si se detecta riesgo, crear backlog.

---

## FASE 7 — Auditoría de consumers visibles

Revisa consumers que muestran texto:

```text
hover
completion initial
completion resolve
signatureHelp
diagnostics
reports
semanticTokens
AI context bundles
```

Clasifica:

```text
uses identity only
uses base documentation
uses localized documentation
uses reasonCodes/messages
needs l10n
not user-facing
```

Criterios:

- `completion initial` debe seguir compacto.
- `completion resolve` puede cargar enrichment/documentación localizada.
- `hover` puede usar enrichment/localization cacheable.
- `signatureHelp` debe mantener firma real intacta.
- `diagnostics` deben tener code estable y message localizable si visible.
- `semanticTokens` no deben usar textos localizados.

---

## FASE 8 — Plan de migración por slices

Genera TODOS los backlog items necesarios para llegar al estado final.

Debe incluir como mínimo estos tipos de specs si aplican:

```text
CATALOG-MANUAL-LANGUAGE-AUDIT-01
CATALOG-MANUAL-BASE-LANGUAGE-POLICY-01
CATALOG-LOCALIZATION-MIRROR-STRUCTURE-01
CATALOG-MANUAL-CATEGORIES-KEYS-01
CATALOG-MANUAL-CORE-TO-EN-01
CATALOG-MANUAL-DW-TO-EN-01
CATALOG-MANUAL-INTEGRATION-TO-EN-01
CATALOG-MANUAL-LANGUAGE-TO-EN-01
CATALOG-MANUAL-RUNTIME-TO-EN-01
CATALOG-MANUAL-TOOLING-TO-EN-01
CATALOG-MANUAL-VISUAL-TO-EN-01
CATALOG-LOCALIZATION-ES-MIRROR-CORE-01
CATALOG-LOCALIZATION-ES-MIRROR-DW-01
CATALOG-LOCALIZATION-ES-MIRROR-INTEGRATION-01
CATALOG-LOCALIZATION-ES-MIRROR-LANGUAGE-01
CATALOG-LOCALIZATION-ES-MIRROR-RUNTIME-01
CATALOG-LOCALIZATION-ES-MIRROR-TOOLING-01
CATALOG-LOCALIZATION-ES-MIRROR-VISUAL-01
CATALOG-LOCALIZATION-DUPLICATE-AUDIT-01
CATALOG-LOCALIZATION-FALLBACK-EN-ES-01
CATALOG-LOCALIZATION-REPORTS-01
CATALOG-LOCALIZATION-QUALITY-01
PLUGIN-L10N-AUDIT-01
PLUGIN-L10N-CONFIG-01
PLUGIN-VSCODE-L10N-FOUNDATION-01
```

No añadas specs que no tengan evidencia o utilidad real. Si una spec no aplica, documenta por qué.

---

## FASE 9 — Formato obligatorio de cada backlog item generado

Cada backlog generado debe seguir este formato:

```markdown
## <ID> — <Título>

- **Estado:** Open.
- **Prioridad:** P1/P2/P3.
- **Origen:** CATALOG-MANUAL-LOCALIZATION-AUDIT.
- **Evidencia:** archivo(s), símbolo(s), campo(s) afectados.
- **Riesgo:** qué se rompe si no se hace.
- **Objetivo:** qué deja resuelto.
- **Depends on:** ...
- **Acceptance criteria:**
  - ...
- **Docs:** ...
- **Tests:** ...
- **Notas:** ...
```

---

## FASE 10 — Orden recomendado de ejecución

Propón un orden seguro de ejecución.

Orden esperado aproximado:

```text
1. CATALOG-MANUAL-BASE-LANGUAGE-POLICY-01
2. CATALOG-LOCALIZATION-MIRROR-STRUCTURE-01
3. CATALOG-MANUAL-CATEGORIES-KEYS-01
4. CATALOG-MANUAL-CORE-TO-EN-01
5. CATALOG-LOCALIZATION-ES-MIRROR-CORE-01
6. CATALOG-MANUAL-DW-TO-EN-01
7. CATALOG-LOCALIZATION-ES-MIRROR-DW-01
8. CATALOG-MANUAL-INTEGRATION-TO-EN-01
9. CATALOG-LOCALIZATION-ES-MIRROR-INTEGRATION-01
10. CATALOG-MANUAL-LANGUAGE-TO-EN-01
11. CATALOG-LOCALIZATION-ES-MIRROR-LANGUAGE-01
12. CATALOG-LOCALIZATION-DUPLICATE-AUDIT-01
13. CATALOG-LOCALIZATION-FALLBACK-EN-ES-01
14. CATALOG-LOCALIZATION-QUALITY-01
```

Ajusta el orden según evidencias reales.

---

## FASE 11 — Actualización documental

Actualiza o propone cambios en:

```text
docs/backlog.md
docs/current-focus.md
docs/roadmap.md
docs/symbol-system.md
docs/localization.md
docs/testing.md
docs/performance-budget.md
docs/architecture-implementation-map.md
docs/architecture-status.md
```

Reglas:

- `docs/localization.md` debe ser owner del workflow operativo de localization.
- `docs/symbol-system.md` debe describir cómo symbols consumen localization/enrichments, pero no duplicar workflow operativo completo.
- `docs/testing.md` debe listar comandos reales.
- `docs/performance-budget.md` debe proteger completion initial/hover/signatureHelp.
- `docs/backlog.md` debe contener specs accionables, no teoría duplicada.

---

## FASE 12 — Validaciones finales

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

Genera:

```markdown
# Catalog Manual English Base & Spanish Localization Mirror Audit Report

## 1. Evidencia revisada

## 2. Estado factual actual

## 3. Manual domains auditados

## 4. Localization/es mirror coverage

## 5. Español detectado en manual/**

## 6. Categorías/labels localizadas usadas como keys

## 7. Duplicidades manual vs localization/es

## 8. Riesgos de fallback en locale en/es

## 9. Consumers visibles afectados

## 10. Validaciones ejecutadas

## 11. Validaciones no ejecutadas y motivo

## 12. Backlog generado

## 13. Orden recomendado de ejecución

## 14. Siguiente slice recomendado
```

---

## Criterio de cierre

La auditoría sólo puede cerrarse si:

```text
1. Todo manual/** fue inventariado.
2. Todo localization/es/** fue inventariado.
3. Se detectó y clasificó texto visible español en manual/**.
4. Se definió política final: manual inglés/base, localization/es español.
5. Se verificó o backlogizó la estructura espejo lógica.
6. Se revisaron targetId/targetKey/reviewed/orphan/invalid/recovered.
7. Se revisó fallback en/es.
8. Se generaron TODOS los backlog items necesarios.
9. Backlog/current-focus/roadmap/docs quedaron alineados o con follow-up exacto.
10. Validaciones ejecutadas o justificadas.
11. Hay reporte final.
```

Si no se cumple todo, deja la auditoría como `Partial` con pendiente exacto.
