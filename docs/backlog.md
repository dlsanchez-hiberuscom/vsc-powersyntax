# Backlog — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---

## 0. Meta maestra

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Toda spec nueva debe respetar esta meta. Si una mejora aumenta complejidad pero no mejora velocidad percibida, estabilidad, seguridad semántica, entendimiento real de PowerBuilder o utilidad profesional, no debe priorizarse sobre el core.

---

# L7 — Modern PowerBuilder ecosystem intelligence

## B306 — HTTPClient/REST/JSON usage analyzer
- **Estado:** Open
- **Track:** modern PB APIs / modernization
- **Prioridad:** Media
- **Depende de:** B260, B261, B282
- **Objetivo:** detectar usos de HTTPClient, REST/JSON y patrones de integración moderna para metrics/debt report.
- **Cierre:** reporta endpoints/patrones sin exponer secretos y con redaction por defecto.
- **Validación esperada:** fixtures PowerScript con HTTPClient/JSONParser.
- **Docs afectadas:** `docs/rules-catalog.md`, `docs/developer-workflows.md`.

## B307 — WebBrowser/WebView2 usage analyzer
- **Estado:** Open
- **Track:** modern UI / modernization
- **Prioridad:** Media
- **Depende de:** B260, B261, B282
- **Objetivo:** detectar patrones WebBrowser/WebView2 relevantes en código PowerBuilder y clasificarlos como modernización/interop.
- **Cierre:** metrics/debt report refleja riesgos de interop, navegación, scripting y dependencias externas sin analizar contenido web.
- **Validación esperada:** fixtures y report snapshots.
- **Docs afectadas:** `docs/developer-workflows.md`, `docs/rules-catalog.md`.

## B308 — PBNI/PBX dependency insight v2
- **Estado:** Open
- **Track:** native dependencies
- **Prioridad:** Media-Alta
- **Depende de:** B207, B260, B261
- **Objetivo:** profundizar en dependencias PBX/PBNI/DLL externas para reports, health y support bundle.
- **Cierre:** external dependencies report distingue dll/pbx/unknown, alias, consumers, riesgo y build/ORCA impact.
- **Validación esperada:** externalFunctions tests + report tests.
- **Docs afectadas:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.

## B309 — Source control artifact awareness
- **Estado:** Open
- **Track:** workspace hygiene / source control
- **Prioridad:** Media
- **Depende de:** B256, B293
- **Objetivo:** reconocer artefactos Git/SVN/SCC relevantes para evitar indexar ruido y mejorar migration assistant.
- **Cierre:** discovery/workspace assistant explican qué se ignora, qué afecta build y qué debe versionarse.
- **Validación esperada:** fixtures con `.git`, SVN folders y export artifacts.
- **Docs afectadas:** `docs/developer-workflows.md`.

## B310 — Object lifecycle risk report v2
- **Estado:** Open
- **Track:** PowerBuilder lifecycle / diagnostics
- **Prioridad:** Media
- **Depende de:** B213, B260, B261
- **Objetivo:** elevar lifecycle create/destroy/constructor/destructor a reportes de riesgo y modernization.
- **Cierre:** reporta objetos con missing-super, missing-trigger, unresolved hooks y riesgo por ancestor flow.
- **Validación esperada:** diagnostics + metrics/debt report.
- **Docs afectadas:** `docs/rules-catalog.md`.

## B311 — Transaction and DataWindow update flow analyzer
- **Estado:** Open
- **Track:** transaction semantics / reports
- **Prioridad:** Media-Alta
- **Depende de:** B211, B212, B253, B260, B261
- **Objetivo:** analizar flujos `SetTransObject/SetTrans/Retrieve/Update` y DataWindow update readiness.
- **Cierre:** metrics/debt report identifica DataWindows sin transaction clara, bindings dinámicos y retrieve/update inconsistentes.
- **Validación esperada:** diagnostics + report tests.
- **Docs afectadas:** `docs/rules-catalog.md`, `docs/developer-workflows.md`.

## B312 — SQL dynamic risk taxonomy v2
- **Estado:** Open
- **Track:** SQL / risk model
- **Prioridad:** Media-Alta
- **Depende de:** B090, B208, B211, B291
- **Objetivo:** clasificar riesgo de SQL embebido/dinámico para diagnostics, debt report y safe edit plan.
- **Cierre:** taxonomy con reason codes y confidence; no intenta parsear SQL dinámico no defendible.
- **Validación esperada:** sqlRegions, dynamicStringReferences y reports.
- **Docs afectadas:** `docs/rules-catalog.md`.

## B313 — Workspace artifact cleanup advisor
- **Estado:** Open
- **Track:** workspace hygiene / supportability
- **Prioridad:** Baja-Media
- **Depende de:** B256, B258, B293
- **Objetivo:** sugerir limpieza no destructiva de artefactos locales, staging, logs y caches del workspace.
- **Cierre:** advisor read-only con comandos manuales y sin borrar por defecto.
- **Validación esperada:** workspace assistant/support bundle tests.
- **Docs afectadas:** `docs/developer-workflows.md`.

## B314 — Build/ORCA failure classification v2
- **Estado:** Open
   - Fallo observado: no se extrae la sección `Return value`.
   - Casos obligatorios:
     - `ApplyTheme` debe extraer `returnType: "Integer"` y descripción de retorno.
     - `AddItemArray` debe extraer `returnType: "Long"` y descripción de retorno.

5. **Faltan argumentos estructurados**
   - Fallo observado: los parámetros solo viven como texto dentro de `signature.label`.
   - Caso obligatorio: `AddItemArray` debe extraer `ParentItemHandle`, `ParentItemPath` y `Key` con documentación.

6. **Faltan Event IDs**
   - Fallo observado: eventos como `BeginDrag` solo generan firma.
   - Caso obligatorio: `BeginDrag` debe extraer `pbm_lvnbegindrag` para `ListView` y `pbm_tvnbegindrag` para `TreeView`.

7. **Faltan syntax groups en eventos**
   - Fallo observado: se pierden grupos tipo `Syntax 1`, `Syntax 2`, `Syntax 3`.
   - Caso obligatorio: `DragDrop` debe conservar grupos para `ListBox/PictureListBox/ListView/Tab`, `TreeView` y `windows and other controls`.

8. **Summaries genéricos en system object datatypes**
   - Fallo observado: summaries como `Official documented PowerBuilder system object/control datatype X`.
   - Caso obligatorio: `PDFDocumentProperties` debe extraer summary específico, `baseType: "PDFModel"` y propiedades principales como `Application`, `Author`, `Keywords`, `Subject`, `Title`.

9. **Reserved words con `*` pierden metadata estructural**
   - Fallo observado: `canBeFunctionName` solo acaba en summary textual.
   - Debe producir `reservedWordCanBeFunctionName: true` e `identifierPolicy: 'allowed-as-function-name'`.

10. **Generated actual mezcla scraping, coverage, rendering y heurísticas**
    - Debe dividirse el script en módulos.
    - El entrypoint debe orquestar; las reglas deben vivir en módulos separados.

### Información máxima a extraer por tipo de página

#### PowerScript functions

Extraer:

```txt
title
canonicalName
description
documentation
appliesTo
ownerTypes
syntaxGroups
signatures
parameters
returnType
returnDocumentation
returnsNullOnNullArgument
usageNotes
limitations
examplesAvailable
seeAlso
obsolete
obsoleteMessage
replacement
risk
sourceUrl
```

#### DataWindow methods

Extraer:

```txt
title
canonicalName
description
appliesTo DataWindow type
ownerTypes
syntaxGroups
signatures
parameters
returnType
returnDocumentation
usageNotes
obsolete
obsoleteMessage
replacement
legacyWebDataWindowFlag
dataWindowContextOnly
seeAlso
sourceUrl
```

#### PowerScript events

Extraer:

```txt
title
eventName
syntaxGroup
syntaxDescription
description
appliesTo
ownerTypes
eventId
eventIds
parameters
eventReturnType
eventReturnCodes
usageNotes
examplesAvailable
seeAlso
obsolete
obsoleteMessage
sourceUrl
```

#### Objects and Controls

Extraer:

```txt
name
description
documentation
category
baseType
derivedFrom
properties
events
functions
inheritedProperties
inheritedFunctions
obsolete
obsoleteMessage
sourceUrl
```

#### Reserved words / keywords

Extraer:

```txt
name
category
summary
reservedWordCanBeFunctionName
identifierPolicy
sourceUrl
```

#### Enumerated datatypes / values

Extraer cuando aplique:

```txt
enumeratedType
enumeratedValues
enumNumericValue
enumValueMeaning
obsolete
obsoleteMessage
replacement
sourceUrl
```

### Modelo de metadata objetivo

```ts
type PbSystemSymbolParameter = {
    name: string;
    type?: string;
    documentation?: string;
    optional?: boolean;
    byRef?: boolean;
};

type PbSystemSymbolSignature = {
    label: string;
    parameters?: readonly PbSystemSymbolParameter[];
    returnType?: string;
};

type PbSystemSymbolEntryDraft = {
    documentation?: string;
    returnType?: string;
    returnDocumentation?: string;
    returnsNullOnNullArgument?: boolean;
    usageNotes?: readonly string[];
    limitations?: readonly string[];
    examplesAvailable?: boolean;
    seeAlso?: readonly string[];

    eventId?: string;
    eventIds?: readonly {
        id: string;
        ownerTypes?: readonly string[];
    }[];
    eventReturnType?: string;
    eventReturnCodes?: readonly {
        value: string;
        meaning: string;
    }[];
    syntaxGroup?: string;
    syntaxDescription?: string;

    baseType?: string;
    properties?: readonly string[];
    functions?: readonly string[];
    events?: readonly string[];

    reservedWordCanBeFunctionName?: boolean;
    identifierPolicy?: 'reserved' | 'allowed-as-function-name' | 'literal' | 'operator';

    enumValues?: readonly string[];
    enumValueOf?: string;
    enumNumericValue?: number;
    enumValueMeaning?: string;
};
```

### Refactor esperado del script

```txt
scripts/catalog/
  generate_official_function_catalog.cjs

  appeon/
    fetch.cjs
    html.cjs
    sections.cjs
    powerScriptFunctions.cjs
    powerScriptEvents.cjs
    powerScriptStatements.cjs
    dataWindowMethods.cjs
    objectsAndControls.cjs
    reservedWords.cjs
    enumeratedDatatypes.cjs

  rules/
    ownerTypeRules.cjs
    datatypeRules.cjs
    keywordRules.cjs
    statementRules.cjs
    obsoleteRules.cjs

  render/
    renderCatalog.cjs
    renderCoverage.cjs
    renderParsingArtifacts.cjs

  coverage/
    coverage.cjs
```

### Criterios de cierre verificables

- `SetItemDate` se marca obsolete/deprecated y no queda como DataWindow/DataStore normal si la fuente indica Web DataWindow server component.
- `OLEActivate` genera signatures separadas.
- `ApplyTheme` incluye return info y usage notes.
- `AddItemArray` incluye parámetros estructurados y return info.
- `BeginDrag` incluye Event IDs.
- `DragDrop` conserva syntax groups.
- `PDFDocumentProperties` incluye summary específico, `baseType` y propiedades.
- Reserved words con `*` tienen metadata estructural.
- El scraper no extrae `appliesTo` desde breadcrumbs, navegación, `See also` ni links auxiliares.
- Hay tests/snapshots de cada caso obligatorio.
- Output determinista.

### Docs afectadas

- `docs/architecture.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/testing.md`
- `docs/rules-catalog.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "generator|scraper|official|catalog|provenance"
npm run test:unit -- --grep "ApplyTheme|AddItemArray|SetItemDate|OLEActivate|BeginDrag|DragDrop|PDFDocumentProperties|reserved"
```

---

## B369 — Generated-vs-manual catalog adoption decision gate
- **Estado:** Open
- **Track:** knowledge / architecture decision / catalog governance
- **Prioridad:** Alta
- **Depende de:** B367, B368, B335, B339
- **Objetivo:** decidir con métricas reales si el catálogo definitivo será `generated official primary`, `manual curated primary` o `hybrid by domain`.
- **Razón técnica:** antes de seguir ampliando manual o generated, hay que decidir la fuente principal por dominio con datos: cobertura, errores de scraping, utilidad para hover/signatureHelp y coste de mantenimiento.

### Opciones a evaluar

```txt
A. generated official primary
B. manual curated primary
C. hybrid by domain
```

### Métricas obligatorias

```txt
officialCount
generatedCount
manualCount
duplicateCount
gapCount
overrideCount
enrichmentCount
scraperErrorCount
signatureQuality
appliesToQuality
ownerTypesQuality
obsoleteDetectionQuality
eventIdCoverage
returnTypeCoverage
parameterDocsCoverage
hoverUsefulness
signatureHelpUsefulness
maintenanceCost
```

### ADR requerido

```txt
docs/adr/ADR-xxxx-system-catalog-source-of-truth.md
```

Debe incluir:

```md
# ADR — System catalog source of truth

## Context
## Options considered
## Evidence
## Decision
## Consequences
## Migration plan
## Rollback plan
```

### Decisión preliminar recomendada

```txt
generated official primary + manual curated gaps/enrichments/overrides
```

Pero la decisión final debe basarse en métricas, no intuición.

### Criterios de cierre verificables

- Existe reporte comparativo generated vs manual.
- Existe ADR.
- Existe merge policy.
- Existe plan de migración.
- Existe test contra duplicados silenciosos.
- Docs/backlog/current-focus/roadmap quedan alineados.
- No se cierra sin métricas reales.

### Docs afectadas

- `docs/architecture.md`
- `docs/rules-catalog.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/testing.md`
- `docs/adr/ADR-xxxx-system-catalog-source-of-truth.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "catalog|generated|manual|coverage|consistency|registry|merge"
npm run test:unit -- --grep "completion|hover|signatureHelp"
```

---

## B371 — Catalog localization model and immutable overlay contract
- **Estado:** Open
- **Track:** knowledge / localization / catalog UX
- **Prioridad:** Alta
- **Depende de:** B366, B367
- **Relacionada con:** B368, B369
- **Objetivo:** añadir un modelo de localización ligero para documentación del catálogo sin duplicar entradas completas ni modificar el texto oficial original del generated.
- **Razón técnica:** el generated oficial está en inglés porque procede de la documentación Appeon. Para una UX profesional en español, el plugin necesita mostrar summaries, documentación, usage notes y mensajes en español, pero sin perder provenance oficial, sin duplicar símbolos y sin traducir en runtime.

### Decisión arquitectónica

```txt
generated.summary = texto oficial/original en inglés
localization/es = texto español precompilado
entry.id / targetKey = enlace estable entre generated y localización
runtime = símbolo único + overlay documental opcional
```

### Alcance incluido

- Añadir tipos de localización para documentación de catálogo.
- Definir contrato inmutable de overlay por `entry.id` o `targetKey` estable.
- Mantener `summary` original del generated sin traducir.
- Añadir soporte para localización de:
  - `summary`
  - `documentation`
  - `usageNotes`
  - `limitations`
  - `obsoleteMessage`
  - `returnDocumentation`
  - `parameter.documentation`
  - `eventReturnCodes.meaning`
  - `category` solo si es categoría visible de UX.
- No traducir nombres reales de PowerBuilder.
- Añadir validación de que cada overlay apunta a una entrada existente o queda reportado como orphan.

### No traducir nunca

```txt
name
id
lookupKeys
normalizedName
ownerTypes
domain
kind
namespace
invocation
signatures.label
function names
event names
datatypes
enum values
sourceUrl
```

### Modelo objetivo

```ts
export type PbCatalogLocale = 'en' | 'es';

export type PbLocalizedText = {
    summary?: string;
    documentation?: string;
    usageNotes?: readonly string[];
    limitations?: readonly string[];
    obsoleteMessage?: string;
    returnDocumentation?: string;
    category?: string;
};

export type PbLocalizedParameterDocumentation = {
    signatureLabel: string;
    parameterName: string;
    documentation: string;
};

export type PbLocalizedEventReturnCodeDocumentation = {
    value: string;
    meaning: string;
};

export type PbSystemSymbolLocalizationOverlay = {
    targetId?: string;
    targetKey?: {
        domain: string;
        kind: string;
        namespace: string;
        invocation: string;
        name: string;
        ownerTypes?: readonly string[];
    };
    locale: PbCatalogLocale;
    text?: PbLocalizedText;
    parameters?: readonly PbLocalizedParameterDocumentation[];
    eventReturnCodes?: readonly PbLocalizedEventReturnCodeDocumentation[];
    reviewed?: boolean;
    source?: 'manual-curated' | 'machine-assisted-reviewed' | 'generated-assisted';
};
```

### Estructura objetivo

```txt
src/server/knowledge/system/localization/
  index.ts
  types.ts
  localizationResolver.ts
  es/
    index.ts
    generatedFunctionLocalization.ts
    generatedEventLocalization.ts
    generatedDatatypeLocalization.ts
    generatedStatementLocalization.ts
    generatedEnumLocalization.ts
```

### Reglas estrictas

- No crear `PB_GENERATED_GLOBAL_FUNCTIONS_ES` ni duplicar entries por idioma.
- No modificar `summary` oficial en generated para traducirlo.
- No traducir en runtime usando servicios externos.
- No hacer deep merge global en startup.
- Las localizaciones se consultan lazy solo cuando una feature necesita texto visible.
- Si falta traducción española, fallback seguro al texto original inglés.

### Criterios de cierre verificables

- Existe modelo de overlay localizado.
- Existe índice español inicial aunque sea parcial.
- Los overlays se validan contra entradas reales.
- Los overlays huérfanos fallan en consistency o aparecen en reporte.
- No se duplican entradas del catálogo por idioma.
- No se altera el texto original del generated.
- Docs explican qué se traduce y qué no.

### Docs afectadas

- `docs/architecture.md`
- `docs/rules-catalog.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/testing.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "catalog|localization|overlay|consistency"
```

---

## B372 — DocumentationService locale-aware lazy resolver
- **Estado:** Open
- **Track:** knowledge / localization / runtime performance
- **Prioridad:** Alta
- **Depende de:** B371, B365
- **Objetivo:** crear un servicio de documentación localizado que resuelva textos visibles por idioma de forma lazy, O(1), sin scans, sin traducción dinámica y sin merge global en startup.
- **Razón técnica:** hover, completion, signatureHelp y diagnostics necesitan documentación localizada, pero esas rutas son sensibles a latencia. La localización debe ser un lookup por índice sobre la entrada ya resuelta, no una transformación masiva del catálogo.

### Alcance incluido

- Crear `documentationService.ts` o equivalente.
- Resolver documentación preferida por locale.
- Implementar fallback:

```txt
locale solicitado: es
1. overlay es si existe
2. texto original de entry
3. string vacío/undefined si no hay documentación
```

- Exponer APIs pequeñas y sin scans.
- Cachear de forma segura si aporta valor, sin stale data.
- No tocar resolución semántica ni índices principales salvo integración mínima.

### API objetivo

```ts
export type DocumentationLocale = 'en' | 'es';

export function getDisplaySummary(
    entry: PbSystemSymbolEntry,
    locale: DocumentationLocale,
): string;

export function getDisplayDocumentation(
    entry: PbSystemSymbolEntry,
    locale: DocumentationLocale,
): string | undefined;

export function getDisplayUsageNotes(
    entry: PbSystemSymbolEntry,
    locale: DocumentationLocale,
): readonly string[];

export function getDisplayObsoleteMessage(
    entry: PbSystemSymbolEntry,
    locale: DocumentationLocale,
): string | undefined;

export function getDisplayReturnDocumentation(
    entry: PbSystemSymbolEntry,
    locale: DocumentationLocale,
): string | undefined;

export function getDisplayParameterDocumentation(
    entry: PbSystemSymbolEntry,
    signatureLabel: string,
    parameterName: string,
    locale: DocumentationLocale,
): string | undefined;
```

### Performance rules

- `entry.id` → localization overlay debe ser `Map<string, Overlay>` o estructura equivalente.
- No recorrer todos los overlays en hover/completion/signatureHelp.
- No construir copias profundas de `PbSystemSymbolEntry` por idioma.
- No generar arrays nuevos si no hay uso visible, salvo valores pequeños inevitables.
- No llamar traductores ni APIs externas.
- El servicio no resuelve símbolos; solo transforma documentación de una entry ya resuelta.

### Criterios de cierre verificables

- Hover puede pedir resumen/documentación en español con lookup O(1).
- Si falta overlay español, se muestra inglés original.
- Tests cubren fallback `es → en`.
- Tests cubren overlay por `targetId`.
- Tests cubren overlay por `targetKey` si se implementa.
- No hay full-catalog scans en el servicio.
- No hay merge global en startup.
- Performance/hot-path tests siguen verdes.

### Docs afectadas

- `docs/architecture.md`
- `docs/performance-budget.md`
- `docs/testing.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "documentationService|localization|fallback|catalog"
npm run test:unit -- --grep "hotPath|performance|allocation"
```

---

## B373 — Localized catalog consumers for hover, completion and signatureHelp
- **Estado:** Open
- **Track:** language services / localization / UX
- **Prioridad:** Alta
- **Depende de:** B372
- **Objetivo:** integrar la documentación localizada en hover, completion y signatureHelp sin cambiar la identidad semántica de los símbolos ni introducir coste adicional significativo.
- **Razón técnica:** la localización solo aporta valor si aparece en las superficies visibles del usuario. La integración debe hacerse en los renderers/consumers, no en el registry ni en la resolución semántica.

### Alcance incluido

- Integrar `documentationService` en hover.
- Integrar `documentationService` en completion item detail/documentation.
- Integrar `documentationService` en signatureHelp para documentación de parámetros y retorno.
- Preparar diagnostics para mensajes localizados si ya existe infraestructura de reason codes.
- Añadir configuración de locale si no existe.
- Mantener signatures originales sin traducir.
- Mantener nombres de símbolos originales.

### Configuración objetivo

Usar una de estas opciones, según arquitectura existente:

```ts
powerbuilder.catalog.documentationLocale: 'auto' | 'en' | 'es'
```

o:

```ts
powerbuilder.languageServices.documentationLocale: 'auto' | 'en' | 'es'
```

Reglas:

```txt
auto → usar idioma de VS Code si disponible, si no es/en fallback definido
en → usar texto original
es → usar overlay español si existe
```

### Reglas de render

- Hover:
  - título/nombre original.
  - firma original.
  - summary/documentation localizados.
  - sourceUrl oficial si aplica.
- Completion:
  - label original.
  - detail original o técnico.
  - documentation localizada.
- SignatureHelp:
  - signature label original.
  - parameter docs localizados si existen.
  - return docs localizados si existen.
- Diagnostics:
  - mantener reason codes estables.
  - mensaje localizado solo como presentación.

### Criterios de cierre verificables

- Hover de una función generated muestra español si hay overlay.
- Hover de una función sin overlay cae a inglés.
- Completion no duplica items por idioma.
- SignatureHelp mantiene firmas originales y localiza descripciones.
- La configuración de locale funciona y tiene fallback.
- No se alteran tests de resolución semántica.
- No se introducen scans por token ni por completion item.

### Docs afectadas

- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `README.md` si se documenta la setting pública.

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "hover|completion|signatureHelp|localization|documentationService"
npm run test:unit -- --grep "catalog|systemCatalog|queryService"
npm run test:unit -- --grep "hotPath|performance|allocation"
```

---

## B374 — Spanish catalog localization authoring workflow and coverage gate
- **Estado:** Open
- **Track:** localization / docs governance / catalog quality
- **Prioridad:** Media-Alta
- **Depende de:** B371, B372, B366, B367
- **Relacionada con:** B369
- **Objetivo:** crear un workflow mantenible para añadir traducciones españolas por tandas, medir cobertura y evitar drift entre generated y overlays localizados.
- **Razón técnica:** traducir todo el catálogo de golpe es costoso y arriesgado. La localización debe poder crecer incrementalmente, con cobertura medible, validación de overlays huérfanos y prioridad por utilidad de usuario.

### Alcance incluido

- Crear comando/script de reporte de cobertura de localización.
- Medir cobertura por dominio:
  - global-functions
  - object-functions
  - datawindow-functions
  - system-events
  - statements
  - datatypes
  - system-object-datatypes
  - enumerated-types
  - enumerated-values
- Detectar overlays huérfanos.
- Detectar overlays incompletos.
- Detectar traducciones que intentan cambiar nombres técnicos.
- Definir prioridad de traducción incremental.
- Documentar guía de estilo para traducciones españolas.

### Orden recomendado de traducción

```txt
1. Functions/events más usados y visibles.
2. DataWindow core.
3. System object datatypes principales.
4. Enumerated types/values.
5. Statements y reserved words.
6. Resto generated.
```

### Guía de estilo de traducción

- Mantener nombres reales del lenguaje en inglés/original.
- Traducir significado, no símbolos.
- Usar español técnico claro y breve.
- Evitar traducciones literales pobres si no ayudan al programador.
- No inventar comportamiento no presente en la fuente oficial.
- Si se añade explicación curada, marcar source como `manual-curated`.
- Mantener `sourceUrl` oficial como trazabilidad.

### Ejemplo esperado

```ts
export const PB_SYSTEM_SYMBOL_LOCALIZATION_ES = {
  'generated:global-functions:callable:powerscript:global:applytheme:all': {
    locale: 'es',
    text: {
      summary: 'Aplica un tema a la interfaz de usuario de la aplicación actual.',
      documentation: 'Debe llamarse cuando todas las ventanas estén cerradas para que el tema se aplique correctamente a ventanas y controles.',
    },
    reviewed: true,
    source: 'manual-curated',
  },
} as const;
```

### Criterios de cierre verificables

- Existe reporte de cobertura de localización.
- El reporte detecta overlays huérfanos.
- El reporte detecta overlays contra IDs inexistentes tras regenerar catálogo.
- Existe guía de estilo documentada.
- Existe primera tanda de localización española revisada.
- Tests cubren que no se traducen nombres de símbolos ni signatures.
- Docs explican cómo añadir nuevas traducciones.

### Docs afectadas

- `docs/rules-catalog.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/localization.md` si se crea documento nuevo.

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "localization|coverage|catalog|consistency"
```

---

## B375 — Generated localization compatibility with regenerated catalog IDs
- **Estado:** Open
- **Track:** localization / generated compatibility / catalog governance
- **Prioridad:** Media-Alta
- **Depende de:** B371, B367, B374
- **Objetivo:** garantizar que los overlays de localización sobreviven a regeneraciones del catálogo o fallan con mensajes claros cuando cambian IDs o claves de destino.
- **Razón técnica:** si la localización se enlaza por `entry.id`, una mejora del generated puede cambiar IDs si cambian domain/kind/namespace/invocation/name/ownerTypes. El sistema debe detectar esos cambios y ofrecer una ruta de migración segura.

### Alcance incluido

- Añadir test/snapshot de IDs localizados.
- Añadir reporte de overlays rotos tras regenerar generated.
- Soportar `targetKey` como fallback si `targetId` cambia pero la identidad semántica sigue siendo localizable.
- Añadir script opcional de migración de localization IDs.
- Documentar cuándo usar `targetId` y cuándo usar `targetKey`.

### Reglas recomendadas

```txt
targetId:
  usar cuando el ID es estable y la entry ya está consolidada.

targetKey:
  usar cuando la entry procede de generated en evolución o puede cambiar ownerTypes.

Ambos:
  targetId preferido; targetKey fallback de recuperación.
```

### Criterios de cierre verificables

- Una regeneración de generated no rompe silenciosamente localizaciones.
- Overlays sin destino válido fallan en consistency o aparecen en reporte claro.
- Existe fixture de ID cambiado que demuestra recuperación por targetKey.
- Existe documentación de migración.
- No hay coste en hot path por resolver migraciones; la resolución se preindexa.

### Docs afectadas

- `docs/rules-catalog.md`
- `docs/testing.md`
- `docs/architecture.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "localization|generated|ids|compatibility|consistency"
```

---

# L5.2 — Enumerated Catalog / DataWindow Knowledge

## B362 — PowerBuilder enumerated datatypes and values catalog completion
- **Estado:** Closed
- **Track:** knowledge / language catalog / enumerations
- **Prioridad:** Alta
- **Depende de:** B360, B361, B339
- **Objetivo:** completar la integración consumible del catálogo de tipos y valores enumerados usando como base primaria el rail oficial generado por B361, añadiendo solo gaps, enrichments, overrides o candidates manual-curated cuando exista evidencia suficiente.
- **Razón técnica:** el programador debe entender qué está escribiendo. El catálogo debe explicar tanto el tipo (`DWBuffer`) como cada valor (`Primary!`) con significado concreto, numeric value y obsolescencia cuando aplique, sin duplicar entradas oficiales ya generadas.
- **Nota de continuidad:** `B361` deja ya cerrados `enumeratedTypes.generated.ts`, `enumeratedValues.generated.ts`, `enumeratedCoverage.generated.ts` y `enumeratedProvenance.generated.ts`; `B362` debe consumir ese rail oficial, no reabrirlo ni volver a scrapearlo.
- **Cierre 2026-05:** `SecureProtocol` conserva documentación y `allowedOnOwners` oficiales sin inventar `enumValues` nominales, el rail manual-core ya no deja `enumerated-types` sin `documentation` y `SeekType` queda cubierto como gap manual-curated con `FromBeginning!`, `FromCurrent!` y `FromEnd!`; ver `specs/376-enumerated-catalog-completion-and-curated-gap-closure`.

### Structure target

```txt
generated/
  enumeratedTypes.generated.ts
  enumeratedValues.generated.ts
  enumeratedCoverage.generated.ts
  enumeratedProvenance.generated.ts

manual/curated/enumerations/
  index.ts
  gaps.ts
  enrichments.ts
  overrides.ts
  corpusCandidates.ts
```

### Factory target

```ts
enumeratedType({
    name: 'DWBuffer',
    category: 'DataWindow',
    summary: 'Tipo enumerado para seleccionar el buffer de filas de un DataWindow.',
    documentation: 'Se usa en métodos DataWindow que acceden, mueven o consultan filas en un buffer concreto.',
    enumValues: ['Primary!', 'Delete!', 'Filter!'],
});

enumeratedValue({
    name: 'Primary!',
    category: 'DataWindow',
    summary: 'Buffer principal del DataWindow.',
    documentation: 'Representa las filas activas del DataWindow, es decir, filas que no han sido eliminadas ni filtradas.',
    enumValueOf: 'DWBuffer',
    enumNumericValue: 0,
});
```

### Minimum required enum types

```txt
DataWindow:
  SaveAsType
  DWBuffer
  DWItemStatus
  DWConflictResolution
  SQLPreviewFunction
  SQLPreviewType
  SaveMetaData
  WebPagingMethod

File / encoding:
  Encoding
  FileAccess
  FileMode
  SeekType

UI / controls:
  AccessibleRole
  Alignment
  Border
  BorderStyle
  Pointer
  TextCase
  ToolbarAlignment
  ToolbarStyle

Windows / MDI:
  WindowType
  WindowState
  ArrangeType

Drawing / graphics:
  FillPattern
  LineStyle
  GraphType
  UnitType
  FontCharSet
  FontFamily
  FontPitch

PDF:
  PDFStandard
  PDFPageSize
  PDFOrientation
  PDFFormFieldEvent
```

### Minimum required enum values

```txt
SaveAsType:
  Excel!
  Text!
  CSV!
  SYLK!
  WKS!
  WK1!
  DIF!
  dBASE2!
  dBASE3!
  SQLInsert!
  Clipboard!
  PSReport!
  WMF!
  HTMLTable!
  Excel5!
  XML!
  XSLFO!
  PDF!
  Excel8!
  EMF!
  XLSX!
  XLSB!

DWBuffer:
  Primary!
  Delete!
  Filter!

Encoding:
  EncodingANSI!
  EncodingUTF8!
  EncodingUTF16LE!
  EncodingUTF16BE!

Alignment:
  Center!
  Left!
  Right!

WindowState:
  Normal!
  Maximized!
  Minimized!

FileAccess:
  FileRead!
  FileWrite!
  FileReadWrite!

FileMode:
  LineMode!
  StreamMode!
```

### Hover usefulness rules

Each `enumerated-type` must include:

```txt
summary
longer documentation
enumValues
source/provenance
```

Each `enumerated-value` must include:

```txt
summary
longer documentation
enumValueOf
enumNumericValue when available
obsolete/obsoleteMessage/replacement when applicable
source/provenance
```

### PFC/STD rule

- PFC, STD/OrderEntry and public PB repositories provide real-world usage and fixtures.
- They do not define official enum membership.
- Unknown values found in corpus become `corpusCandidates` or backlog items unless official source confirms them.

### Criterios de cierre verificables

- Each `enumerated-value` has `enumValueOf`.
- Each `enumerated-type` has `enumValues`.
- No orphan values.
- No empty enum types unless explicitly justified.
- Obsolete values are marked when official source says so.
- `listValuesForEnumeratedType('SaveAsType')` returns official values.
- `listValuesForEnumeratedType('DWBuffer')` returns `Primary!`, `Delete!`, `Filter!`.
- `resolveEnumeratedValue('Primary!')` indicates `enumValueOf: 'DWBuffer'`.
- Hover can be built from catalog metadata without extra hardcoding.

### Docs afectadas

- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md`
- `docs/testing.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "enumerated|enum|catalog|systemCatalog"
```

---

## B376 — Workspace check command and AI-readable validation report
- **Estado:** Open
- **Track:** developer workflow / diagnostics / AI supportability
- **Prioridad:** Alta
- **Depende de:** B335, B365
- **Objetivo:** añadir una tool/API read-only consolidada para comprobar el workspace con las capacidades reales del plugin y devolver un informe estructurado apto para IA.
- **Razón técnica:** la API actual expone piezas útiles (`server-stats`, `semantic-workspace-manifest`, `code-metrics`, `technical-debt-report`, `build-profile-matrix`, etc.), pero no existe un comando único equivalente a “compilar/checkear” desde la perspectiva del plugin. Una IA necesita una llamada única que responda: “¿qué errores detecta el plugin ahora mismo y puedo cerrar la spec?”.

---

## Diagnóstico actual

La API pública ya contiene muchas superficies read-only útiles:

```txt
server-stats
semantic-workspace-manifest
code-metrics
technical-debt-report
build-profile-matrix
cross-project-symbol-conflicts
datawindow-sql-lineage
current-object-context
impact-analysis
safe-edit-plan
safe-batch-refactor-plan
```

Pero falta una superficie consolidada tipo:

```txt
workspace-check
checkWorkspace()
powerbuilder.checkWorkspace
```

La nueva API no debe crear un motor paralelo; debe actuar como **orquestador read-only** de información ya disponible.

---

## Alcance incluido

### 1. Añadir read-only tool

Añadir a `ApiReadOnlyToolName`:

```ts
| 'workspace-check'
```

Añadir descriptor:

```ts
{
  name: 'workspace-check',
  description: 'Ejecuta una comprobación read-only consolidada del workspace usando discovery, indexing, diagnostics, health, catálogo y señales semánticas ya disponibles.',
  command: 'powerbuilder.checkWorkspace',
  requestSchema: 'ApiWorkspaceCheckRequest',
  responseSchema: 'ApiWorkspaceCheckReport',
  usesActiveEditorFallback: false,
}
```

### 2. Añadir comando VS Code

```txt
PowerBuilder: Check Workspace
```

Command ID:

```txt
powerbuilder.checkWorkspace
```

Opcional si encaja con la arquitectura existente:

```txt
PowerBuilder: Check Current File
powerbuilder.checkCurrentFile
```

### 3. Añadir método público

Añadir a `VscPowerSyntaxApi`:

```ts
checkWorkspace(request?: ApiWorkspaceCheckRequest): Promise<ApiWorkspaceCheckReport>;
```

Añadir a `PUBLIC_API_CONTRACT_METHODS`:

```ts
{
  name: 'checkWorkspace',
  command: 'powerbuilder.checkWorkspace',
  access: 'read-only',
  stability: 'stable',
  requestSchema: 'ApiWorkspaceCheckRequest',
  responseSchema: 'ApiWorkspaceCheckReport',
}
```

### 4. Añadir schemas al contrato público

Añadir a `PUBLIC_API_CONTRACT_SCHEMAS`:

```ts
{ name: 'ApiWorkspaceCheckRequest', version: '1.0.0', kind: 'request' },
{ name: 'ApiWorkspaceCheckReport', version: '1.0.0', kind: 'response' },
{ name: 'ApiWorkspaceCheckFinding', version: '1.0.0', kind: 'response' },
{ name: 'ApiWorkspaceCheckCatalogSummary', version: '1.0.0', kind: 'response' },
```

---

## Modelo de API objetivo

### Request

```ts
export type ApiWorkspaceCheckMode = 'quick' | 'full' | 'catalog' | 'diagnostics';

export interface ApiWorkspaceCheckRequest {
  mode?: ApiWorkspaceCheckMode;
  includeDiagnostics?: boolean;
  includeCatalog?: boolean;
  includeHealth?: boolean;
  includeBuildProfiles?: boolean;
  includeTechnicalDebt?: boolean;
  includeCodeMetrics?: boolean;
  includeManifest?: boolean;
  maxDiagnostics?: number;
  maxFiles?: number;
  maxFindings?: number;
}
```

### Finding

```ts
export interface ApiWorkspaceCheckFinding {
  code: string;
  severity: 'info' | 'warning' | 'error';
  area:
    | 'readiness'
    | 'indexing'
    | 'diagnostics'
    | 'catalog'
    | 'semantic'
    | 'datawindow'
    | 'build'
    | 'health'
    | 'performance'
    | 'localization'
    | 'unknown';
  message: string;
  detail?: string;
  uri?: string;
  line?: number;
  character?: number;
  evidence?: string[];
  suggestedAction?: string;
}
```

### Catalog summary

```ts
export interface ApiWorkspaceCheckCatalogSummary {
  available: boolean;
  totalEntries?: number;
  duplicates?: number;
  missingSignatures?: number;
  invalidEnumTypes?: number;
  orphanEnumValues?: number;
  orphanLocalizationOverlays?: number;
  generatedManualConflicts?: number;
  consistencyStatus: 'passed' | 'warning' | 'failed' | 'unknown';
}
```

### Summary

```ts
export interface ApiWorkspaceCheckSummary {
  projectCount: number;
  objectCount: number;
  exportedSymbolCount: number;

  diagnostics: {
    error: number;
    warning: number;
    info: number;
    hint: number;
  };

  healthStatus?: 'healthy' | 'warning' | 'error';
  readinessState?: string;

  catalogIssues: number;
  blockingFindings: number;
  warningFindings: number;

  generatedFromCache?: boolean;
  truncated: boolean;
}
```

### Report

```ts
export interface ApiWorkspaceCheckReport {
  schemaVersion: '1.0.0';
  generatedAt: string;
  apiVersion: string;
  mode: ApiWorkspaceCheckMode;
  status: 'passed' | 'warning' | 'failed';
  available: boolean;
  reason?: string;

  summary: ApiWorkspaceCheckSummary;

  readiness?: ApiServerStats['readiness'];
  health?: ApiRuntimeHealthReport;
  diagnostics?: ApiDiagnosticsSnapshot;
  catalog?: ApiWorkspaceCheckCatalogSummary;
  manifest?: ApiSemanticWorkspaceManifest;
  codeMetrics?: ApiPowerBuilderCodeMetrics;
  technicalDebt?: ApiPowerBuilderTechnicalDebtReport;
  buildProfiles?: ApiBuildProfileMatrix;

  findings: ApiWorkspaceCheckFinding[];
  recommendedActions: string[];
}
```

---

## Composición interna esperada

`workspace-check` debe componer datos ya existentes, sin duplicar motores:

```txt
1. getServerStats()
2. getSemanticWorkspaceManifest()
3. ApiServerStats.diagnostics
4. ApiServerStats.health
5. catalog consistency report si está disponible
6. localization consistency si B371-B375 están implementadas
7. getBuildProfileMatrix() solo en full o si includeBuildProfiles=true
8. getPowerBuilderCodeMetrics() solo en full o si includeCodeMetrics=true
9. getPowerBuilderTechnicalDebtReport() solo en full o si includeTechnicalDebt=true
```

---

## Reglas de estado

### `failed`

El reporte debe devolver `failed` si ocurre cualquiera de estas condiciones:

```txt
diagnostics.error > 0
health.status === 'error'
catalog consistency failed
readiness blocked/error
required index unavailable
```

### `warning`

El reporte debe devolver `warning` si ocurre cualquiera de estas condiciones y no hay errores bloqueantes:

```txt
diagnostics.warning > 0
health.status === 'warning'
index degraded
catalog warnings
build profile invalid but not required
localization orphan overlays warning
```

### `passed`

El reporte debe devolver `passed` si:

```txt
no hay diagnostics error
no hay health error
no hay catalog failure
no hay readiness blocked/error
```

---

## Reglas estrictas

- La tool debe ser read-only.
- No debe modificar archivos.
- No debe borrar caches.
- No debe ejecutar ORCA/build por defecto.
- No debe hacer full scans si hay índices/caches válidos.
- No debe bloquear VS Code.
- No debe inventar resultados si un subsistema no está disponible.
- Si falta información, debe devolver `available: false` o `reason` claro para esa sección.
- Debe respetar límites de contexto (`maxDiagnostics`, `maxFiles`, `maxFindings`).
- Debe marcar `truncated: true` cuando recorte información.

---

## Salidas recomendadas

### API / tool

La salida primaria debe ser JSON estructurado:

```txt
ApiWorkspaceCheckReport
```

### Command Palette

El comando `PowerBuilder: Check Workspace` puede mostrar:

```txt
passed / warning / failed
número de errores
número de warnings
readiness
health
acciones recomendadas
```

### Export opcional

Si encaja con la arquitectura existente, puede exportar:

```txt
test/results/pb-check/latest.json
test/results/pb-check/latest.md
test/results/pb-check/latest.diagnostics.json
```

Este export debe ser explícito, no automático si no existe una política de artifacts.

---

## Ejemplo de salida esperada

```json
{
  "schemaVersion": "1.0.0",
  "generatedAt": "2026-05-03T21:45:00.000Z",
  "apiVersion": "2.14.0",
  "mode": "quick",
  "status": "failed",
  "available": true,
  "summary": {
    "projectCount": 3,
    "objectCount": 1240,
    "exportedSymbolCount": 98234,
    "diagnostics": {
      "error": 3,
      "warning": 42,
      "info": 18,
      "hint": 0
    },
    "healthStatus": "warning",
    "readinessState": "ready",
    "catalogIssues": 1,
    "blockingFindings": 3,
    "warningFindings": 43,
    "truncated": false
  },
  "findings": [
    {
      "code": "diagnostics.errors-present",
      "severity": "error",
      "area": "diagnostics",
      "message": "El workspace contiene diagnostics de error.",
      "suggestedAction": "Revisar diagnostics por archivo antes de cerrar la spec."
    }
  ],
  "recommendedActions": [
    "Corregir diagnostics de error.",
    "Revisar catalog consistency report."
  ]
}
```

---

## Criterios de cierre verificables

- `ApiReadOnlyToolName` incluye `workspace-check`.
- `READ_ONLY_TOOL_DESCRIPTORS` incluye `workspace-check`.
- `getReadOnlyToolBridgeDescriptor()` publica `workspace-check`.
- `PUBLIC_API_CONTRACT_METHODS` incluye `checkWorkspace`.
- `PUBLIC_API_CONTRACT_SCHEMAS` incluye los schemas nuevos.
- `VscPowerSyntaxApi` expone `checkWorkspace`.
- Existe command `powerbuilder.checkWorkspace`.
- `ApiWorkspaceCheckReport.status` devuelve `passed`, `warning` o `failed`.
- El reporte incluye diagnostics agregados.
- El reporte incluye readiness y health.
- El reporte incluye catalog consistency si está disponible.
- La tool es read-only.
- No se ejecuta ORCA/build por defecto.
- Tests cubren workspace sano.
- Tests cubren workspace con diagnostics.
- Tests cubren catalog failure.
- Tests cubren truncado por límites.
- Docs explican que este comando es el equivalente “check/compile-like” del plugin para IA.

---

## Docs afectadas

- `docs/developer-workflows.md`
- `docs/ai-orchestrator.md`
- `docs/testing.md`
- `docs/architecture.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `README.md` si se expone en Command Palette.
- `docs/backlog.md`
- `docs/current-focus.md`

---

## Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "workspace-check|publicApi|readOnlyTool|diagnostics|health|catalog"
npm run test:unit -- --grep "contract|publicApi|toolBridge"
```
---

## B377 — Current object/class check command and AI-readable validation report
- **Estado:** Open
- **Track:** developer workflow / diagnostics / AI supportability
- **Prioridad:** Alta
- **Depende de:** B376, B365
- **Objetivo:** añadir una tool/API read-only para comprobar una clase/objeto PowerBuilder completo usando el índice semántico, diagnostics, contexto del objeto, dependencias inmediatas, DataWindow bindings y safe-edit signals.
- **Razón técnica:** una IA necesita poder validar una unidad concreta después de modificar o revisar una clase, ventana, userobject, menú, datastore, DataWindow o nonvisual object. `workspace-check` valida el workspace completo; esta spec valida una unidad focal sin obligar a analizar todo el workspace.

---

## Alcance incluido

### 1. Nueva read-only tool

Añadir a `ApiReadOnlyToolName`:

```ts
| 'object-check'
```

Descriptor:

```ts
{
  name: 'object-check',
  description: 'Ejecuta una comprobación read-only de una clase/objeto PowerBuilder completo usando contexto semántico, diagnostics, dependencias, bindings DataWindow y health local.',
  command: 'powerbuilder.checkCurrentObject',
  requestSchema: 'ApiObjectCheckRequest',
  responseSchema: 'ApiObjectCheckReport',
  usesActiveEditorFallback: true,
}
```

---

### 2. Comandos VS Code

```txt
PowerBuilder: Check Current Object
PowerBuilder: Check Object...
```

Command IDs:

```txt
powerbuilder.checkCurrentObject
powerbuilder.checkObject
```

---

### 3. Método público

Añadir a `VscPowerSyntaxApi`:

```ts
checkObject(request?: ApiObjectCheckRequest): Promise<ApiObjectCheckReport>;
```

Añadir a `PUBLIC_API_CONTRACT_METHODS`:

```ts
{
  name: 'checkObject',
  command: 'powerbuilder.checkCurrentObject',
  access: 'read-only',
  stability: 'stable',
  requestSchema: 'ApiObjectCheckRequest',
  responseSchema: 'ApiObjectCheckReport',
}
```

---

### 4. Añadir schemas al contrato público

Añadir a `PUBLIC_API_CONTRACT_SCHEMAS`:

```ts
{ name: 'ApiObjectCheckRequest', version: '1.0.0', kind: 'request' },
{ name: 'ApiObjectCheckReport', version: '1.0.0', kind: 'response' },
{ name: 'ApiObjectCheckFinding', version: '1.0.0', kind: 'response' },
{ name: 'ApiObjectCheckSummary', version: '1.0.0', kind: 'response' },
```

---

## Modelo de API objetivo

### Request

```ts
export interface ApiObjectCheckRequest {
  uri?: string;
  objectName?: string;
  line?: number;
  character?: number;

  includeDiagnostics?: boolean;
  includeContext?: boolean;
  includeDependencyGraph?: boolean;
  includeImpactAnalysis?: boolean;
  includeSafeEditPlan?: boolean;
  includeDataWindowBindings?: boolean;
  includeEmbeddedSql?: boolean;
  includeLifecycle?: boolean;

  maxDiagnostics?: number;
  maxReferences?: number;
  maxDependencyNodes?: number;
  maxFindings?: number;
}
```

---

### Finding

```ts
export interface ApiObjectCheckFinding {
  code: string;
  severity: 'info' | 'warning' | 'error';
  area:
    | 'parser'
    | 'diagnostics'
    | 'semantic'
    | 'inheritance'
    | 'override'
    | 'lifecycle'
    | 'datawindow'
    | 'sql'
    | 'dependency'
    | 'safe-edit'
    | 'health'
    | 'unknown';

  message: string;
  detail?: string;
  uri?: string;
  line?: number;
  character?: number;
  evidence?: string[];
  suggestedAction?: string;
}
```

---

### Summary

```ts
export interface ApiObjectCheckSummary {
  objectName?: string;
  objectKind?: string;
  uri?: string;

  diagnostics: {
    error: number;
    warning: number;
    info: number;
    hint: number;
  };

  dependencyCount: number;
  dependentCount: number;
  unresolvedDependencyCount: number;
  ambiguousDependencyCount: number;

  dataWindowBindingCount: number;
  unresolvedDataWindowBindingCount: number;

  embeddedSqlCount: number;
  dynamicSqlRiskCount: number;

  blockingFindings: number;
  warningFindings: number;

  truncated: boolean;
}
```

---

### Report

```ts
export interface ApiObjectCheckReport {
  schemaVersion: '1.0.0';
  generatedAt: string;
  apiVersion: string;

  available: boolean;
  reason?: string;

  status: 'passed' | 'warning' | 'failed';

  source: {
    kind: 'active-editor' | 'uri' | 'object-name';
    uri?: string;
    objectName?: string;
    line?: number;
    character?: number;
  };

  summary: ApiObjectCheckSummary;

  objectContext?: ApiCurrentObjectContext;
  dependencyGraph?: ApiPowerBuilderDependencyGraph;
  impactAnalysis?: ApiImpactAnalysis;
  safeEditPlan?: ApiSafeEditPlan;

  findings: ApiObjectCheckFinding[];
  recommendedActions: string[];
}
```

---

## Composición interna esperada

La tool debe reutilizar APIs existentes:

```txt
1. getCurrentObjectContext()
2. getPowerBuilderDependencyGraph()
3. analyzeImpact()
4. generateSafeEditPlan()
5. diagnostics del objeto/documento desde ApiCurrentObjectContext
6. DataWindow bindings desde ApiCurrentObjectContext.dataWindowBindings
7. embedded SQL anchors desde ApiCurrentObjectContext.embeddedSqlAnchors
8. dependency graph summary
```

No debe crear un motor paralelo.

---

## Reglas de estado

### `failed`

El reporte debe devolver `failed` si ocurre cualquiera de estas condiciones:

```txt
diagnostics.error > 0
objectContext.available === false
safeEditPlan.blocked === true, si includeSafeEditPlan=true
unresolved critical inheritance/base object
critical parser failure for the object
```

### `warning`

El reporte debe devolver `warning` si ocurre cualquiera de estas condiciones y no hay errores bloqueantes:

```txt
diagnostics.warning > 0
dependencyGraph has unresolved/ambiguous dependencies
DataWindow bindings unresolved
dynamic SQL risk detected
safeEditPlan has high risks but not blocked
```

### `passed`

El reporte debe devolver `passed` si:

```txt
objectContext available
no diagnostics error
no critical unresolved inheritance
no blocking safe edit plan
```

---

## Reglas estrictas

- La tool debe ser read-only.
- No debe modificar archivos.
- No debe ejecutar ORCA/build.
- No debe hacer full workspace scan si el objeto ya está indexado.
- Debe usar active editor fallback solo si no se pasa `uri/objectName`.
- Si el objeto no está indexado, debe devolver `available: false` y `reason` claro.
- Debe respetar límites `maxDiagnostics`, `maxReferences`, `maxDependencyNodes`, `maxFindings`.
- Debe marcar `truncated: true` si recorta resultados.
- No debe inventar resultados cuando una sección no esté disponible.
- No debe bloquear VS Code.

---

## Salidas recomendadas

### API / tool

La salida primaria debe ser JSON estructurado:

```txt
ApiObjectCheckReport
```

### Command Palette

El comando `PowerBuilder: Check Current Object` puede mostrar:

```txt
passed / warning / failed
nombre del objeto
kind del objeto
diagnostics agregados
riesgos principales
acciones recomendadas
```

### Export opcional

Si encaja con la arquitectura existente, puede exportar explícitamente:

```txt
test/results/pb-check/current-object.latest.json
test/results/pb-check/current-object.latest.md
```

---

## Ejemplo de salida esperada

```json
{
  "schemaVersion": "1.0.0",
  "generatedAt": "2026-05-03T22:30:00.000Z",
  "apiVersion": "2.14.0",
  "available": true,
  "status": "warning",
  "source": {
    "kind": "active-editor",
    "uri": "file:///workspace/app/w_customer.srw",
    "objectName": "w_customer"
  },
  "summary": {
    "objectName": "w_customer",
    "objectKind": "window",
    "uri": "file:///workspace/app/w_customer.srw",
    "diagnostics": {
      "error": 0,
      "warning": 2,
      "info": 1,
      "hint": 0
    },
    "dependencyCount": 6,
    "dependentCount": 3,
    "unresolvedDependencyCount": 1,
    "ambiguousDependencyCount": 0,
    "dataWindowBindingCount": 2,
    "unresolvedDataWindowBindingCount": 1,
    "embeddedSqlCount": 1,
    "dynamicSqlRiskCount": 0,
    "blockingFindings": 0,
    "warningFindings": 3,
    "truncated": false
  },
  "findings": [
    {
      "code": "datawindow.binding.unresolved",
      "severity": "warning",
      "area": "datawindow",
      "message": "Hay un binding DataWindow no resuelto en el objeto actual.",
      "suggestedAction": "Revisar dataobject asignado y disponibilidad del .srd correspondiente."
    }
  ],
  "recommendedActions": [
    "Revisar el binding DataWindow no resuelto.",
    "Revisar warnings antes de cerrar la spec."
  ]
}
```

---

## Criterios de cierre verificables

- `ApiReadOnlyToolName` incluye `object-check`.
- `READ_ONLY_TOOL_DESCRIPTORS` incluye `object-check`.
- `getReadOnlyToolBridgeDescriptor()` publica `object-check`.
- `PUBLIC_API_CONTRACT_METHODS` incluye `checkObject`.
- `PUBLIC_API_CONTRACT_SCHEMAS` incluye los schemas nuevos.
- `VscPowerSyntaxApi` expone `checkObject`.
- Existe command `powerbuilder.checkCurrentObject`.
- Usa active editor fallback correctamente.
- Devuelve `passed`, `warning` o `failed`.
- Incluye diagnostics del objeto.
- Incluye contexto semántico del objeto.
- Incluye dependency graph si se solicita.
- Incluye impact analysis si se solicita.
- Incluye safe edit plan si se solicita.
- Incluye DataWindow bindings si existen.
- Incluye embedded SQL anchors si existen.
- No ejecuta ORCA/build.
- Tests cubren objeto sano.
- Tests cubren objeto con diagnostics.
- Tests cubren objeto no resoluble.
- Tests cubren objeto con DataWindow binding missing.
- Tests cubren objeto con dependencia ambigua.
- Tests cubren truncado por límites.

---

## Docs afectadas

- `docs/developer-workflows.md`
- `docs/ai-orchestrator.md`
- `docs/testing.md`
- `docs/architecture.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `README.md` si se expone en Command Palette.
- `docs/backlog.md`
- `docs/current-focus.md`

---

## Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "object-check|currentObjectContext|dependencyGraph|safeEditPlan|diagnostics"
npm run test:unit -- --grep "publicApi|readOnlyTool|toolBridge|contract"
```
---


## B378 — AI PowerBuilder context pack and token budget contract
- **Estado:** Open
- **Track:** AI supportability / developer workflow / context budget
- **Prioridad:** Alta
- **Depende de:** B301, B365
- **Relacionada con:** B376, B377
- **Objetivo:** crear un context pack compacto, estable y versionado para que una IA pueda programar en PowerBuilder respetando arquitectura, estilo, validación y reglas del proyecto sin cargar documentación masiva.
- **Razón técnica:** la IA funciona mejor con contexto breve, estable y accionable que con documentos extensos repetidos en cada tarea. Un context pack reduce tokens, evita drift y estandariza cómo los agentes deben trabajar con PowerBuilder y con este plugin.

### Alcance incluido

- Crear documento compacto:

```txt
docs/ai-context/powerbuilder-plugin-context.md
```

- Opcionalmente añadir versión reducida o referencia desde:

```txt
AGENTS.md
.github/copilot-instructions.md
```

- Incluir solo información estable y de alto valor:
  - arquitectura general del plugin;
  - reglas PowerBuilder del proyecto;
  - reglas de SQL y DataWindow;
  - rutas importantes;
  - comandos de validación;
  - herramientas read-only disponibles;
  - flujo recomendado para tareas IA;
  - qué no hacer;
  - specs activas actuales;
  - reglas de documentación.

### Contenido mínimo requerido

```md
# AI context — PowerBuilder plugin

## Mission
## Architecture boundaries
## PowerBuilder coding rules
## SQL formatting rules
## DataWindow rules
## Catalog/generated/manual/localization rules
## Validation commands and tools
## Recommended AI workflow
## Do not do
## Active focus
## Documentation ownership
```

### Reglas estrictas

- El context pack no debe duplicar documentación larga.
- El context pack debe enlazar a documentos propietarios cuando haga falta detalle.
- El context pack debe caber en un prompt pequeño.
- El context pack no debe incluir generated/manual catalog completo.
- El context pack debe mantenerse actualizado cuando cambien arquitectura, reglas de validación o foco activo.
- Si hay conflicto entre context pack y documentación propietaria, la documentación propietaria gana y debe corregirse el context pack.

### Criterios de cierre verificables

- Existe `docs/ai-context/powerbuilder-plugin-context.md`.
- El documento incluye reglas PowerBuilder críticas.
- El documento incluye comandos/tools recomendadas para IA.
- El documento referencia `workspace-check` y `object-check` cuando B376/B377 estén disponibles.
- El documento indica que no se debe cargar generated/manual completo en prompts.
- El documento enlaza a docs propietarias en vez de duplicarlas.
- Tests/checks documentales detectan si el archivo desaparece o queda sin referencias.

### Docs afectadas

- `docs/ai-strategy.md`
- `docs/ai-orchestrator.md`
- `docs/developer-workflows.md`
- `docs/spec-driven-development.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `AGENTS.md` si existe.

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "docs|ai-context|context-budget|documentation"
```

---

## B379 — Explain diagnostic tool and suggested safe fix contract
- **Estado:** Open
- **Track:** diagnostics / AI supportability / safe fixes
- **Prioridad:** Alta
- **Depende de:** B376, B377, B365
- **Objetivo:** añadir una tool/API read-only para explicar un diagnostic concreto con contexto mínimo, reason code, evidencia, scope, riesgo y posible fix seguro si existe.
- **Razón técnica:** para ahorrar tokens, una IA no debería necesitar leer archivos completos para entender un error. Debe poder pedir explicación estructurada de un diagnostic concreto y recibir solo la evidencia necesaria para decidir una corrección segura.

### Alcance incluido

- Añadir read-only tool:

```ts
| 'explain-diagnostic'
```

- Añadir comando:

```txt
PowerBuilder: Explain Diagnostic at Cursor
powerbuilder.explainDiagnostic
```

- Añadir método público:

```ts
explainDiagnostic(request: ApiExplainDiagnosticRequest): Promise<ApiExplainDiagnosticReport>;
```

- Integrar con diagnostics existentes, current-object-context y safe-edit-plan cuando aplique.
- No aplicar fixes automáticamente.
- No modificar archivos.

### Descriptor de tool

```ts
{
  name: 'explain-diagnostic',
  description: 'Explica un diagnostic PowerBuilder concreto con evidencia mínima, reason code, scope y posible fix seguro si existe.',
  command: 'powerbuilder.explainDiagnostic',
  requestSchema: 'ApiExplainDiagnosticRequest',
  responseSchema: 'ApiExplainDiagnosticReport',
  usesActiveEditorFallback: true,
}
```

### Request

```ts
export interface ApiExplainDiagnosticRequest {
  uri?: string;
  line?: number;
  character?: number;
  code?: string;
  diagnosticIndex?: number;
  includeObjectContext?: boolean;
  includeSafeFixPlan?: boolean;
  maxEvidence?: number;
  maxExcerptLines?: number;
}
```

### Report

```ts
export interface ApiExplainDiagnosticReport {
  schemaVersion: '1.0.0';
  generatedAt: string;
  apiVersion: string;

  available: boolean;
  reason?: string;

  diagnostic?: {
    code?: string;
    message: string;
    severity: 'error' | 'warning' | 'info' | 'hint';
    uri: string;
    line: number;
    character: number;
  };

  explanation?: {
    summary: string;
    reasonCode?: string;
    area:
      | 'parser'
      | 'semantic'
      | 'catalog'
      | 'datawindow'
      | 'sql'
      | 'lifecycle'
      | 'unused'
      | 'shadowing'
      | 'unknown';
    confidence: 'high' | 'medium' | 'low';
    whyItMatters?: string;
  };

  evidence: Array<{
    kind: 'source-excerpt' | 'symbol' | 'scope' | 'catalog' | 'datawindow' | 'dependency' | 'rule';
    label: string;
    detail?: string;
    uri?: string;
    line?: number;
    character?: number;
  }>;

  safeFix?: {
    available: boolean;
    kind?:
      | 'remove-declaration'
      | 'rename-symbol'
      | 'add-reference'
      | 'adjust-signature'
      | 'replace-enum-value'
      | 'update-datatype'
      | 'manual-review';
    confidence?: 'high' | 'medium' | 'low';
    blocked?: boolean;
    blockedReasons?: string[];
    planSummary?: string;
  };

  recommendedActions: string[];
}
```

### Reglas estrictas

- Read-only.
- No aplicar cambios.
- No generar edits directamente salvo que se integren como safe-edit-plan read-only.
- No leer todo el workspace si el diagnostic está en un documento ya indexado.
- Usar active editor fallback solo si no se pasa `uri`.
- Si hay varios diagnostics en la posición, devolver el más cercano o razón clara de ambigüedad.
- Respetar `maxEvidence` y `maxExcerptLines`.
- Marcar `confidence` baja cuando la explicación dependa de heurísticas.

### Casos mínimos

```txt
unused-variable
shadowing
unresolved-symbol
ambiguous-call
obsolete-symbol
enum-value-not-valid-for-expected-type
datawindow-binding-unresolved
dynamic-sql-risk
parser-error-near-token
```

### Criterios de cierre verificables

- `ApiReadOnlyToolName` incluye `explain-diagnostic`.
- `READ_ONLY_TOOL_DESCRIPTORS` incluye `explain-diagnostic`.
- `VscPowerSyntaxApi` expone `explainDiagnostic`.
- El contrato público incluye schemas nuevos.
- El comando `powerbuilder.explainDiagnostic` existe.
- Explica diagnostics de variable no usada con evidencia mínima.
- Explica unresolved symbol con scope/candidates si existen.
- Explica enum value incompatible si B360-B363 están implementadas.
- No modifica archivos.
- Tests cubren diagnostic inexistente, diagnóstico único, múltiples diagnostics en posición y truncado.

### Docs afectadas

- `docs/developer-workflows.md`
- `docs/ai-orchestrator.md`
- `docs/testing.md`
- `docs/rules-catalog.md`
- `docs/backlog.md`
- `docs/current-focus.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "explain-diagnostic|diagnostics|safeFix|publicApi|readOnlyTool"
```

---

## B380 — Explain system symbol and catalog lookup tool for AI
- **Estado:** Open
- **Track:** catalog / AI supportability / hover-signatureHelp
- **Prioridad:** Alta
- **Depende de:** B367, B368, B371, B365
- **Relacionada con:** B335, B376
- **Objetivo:** añadir una tool/API read-only para explicar un símbolo del catálogo PowerBuilder sin pasar generated/manual completos al prompt.
- **Razón técnica:** una IA necesita saber qué significa un símbolo PowerBuilder, qué signatures tiene, qué ownerTypes aplican, si está obsoleto, de dónde viene y cómo se documenta en español si existe. Pasar el catálogo completo consume demasiados tokens y aumenta el riesgo de errores.

### Alcance incluido

- Añadir read-only tool:

```ts
| 'explain-system-symbol'
```

- Añadir comando opcional:

```txt
PowerBuilder: Explain System Symbol
powerbuilder.explainSystemSymbol
```

- Añadir método público:

```ts
explainSystemSymbol(request: ApiExplainSystemSymbolRequest): Promise<ApiExplainSystemSymbolReport>;
```

- Resolver símbolos desde catálogo merged runtime:
  - generated official;
  - manual curated gaps/enrichments/overrides;
  - localization/es si se solicita;
  - enums cuando existan;
  - ownerTypes si aplica.

### Descriptor de tool

```ts
{
  name: 'explain-system-symbol',
  description: 'Explica un símbolo del catálogo PowerBuilder con signatures, ownerTypes, provenance, localización y warnings sin cargar el catálogo completo.',
  command: 'powerbuilder.explainSystemSymbol',
  requestSchema: 'ApiExplainSystemSymbolRequest',
  responseSchema: 'ApiExplainSystemSymbolReport',
  usesActiveEditorFallback: true,
}
```

### Request

```ts
export interface ApiExplainSystemSymbolRequest {
  name?: string;
  uri?: string;
  line?: number;
  character?: number;
  ownerType?: string;
  domain?: string;
  kind?: string;
  locale?: 'en' | 'es';
  includeSignatures?: boolean;
  includeParameters?: boolean;
  includeEnumValues?: boolean;
  includeProvenance?: boolean;
  includeConflicts?: boolean;
  maxCandidates?: number;
  maxSignatures?: number;
  maxEnumValues?: number;
}
```

### Report

```ts
export interface ApiExplainSystemSymbolReport {
  schemaVersion: '1.0.0';
  generatedAt: string;
  apiVersion: string;

  available: boolean;
  reason?: string;
  query: ApiExplainSystemSymbolRequest;

  resolution: {
    state: 'resolved' | 'ambiguous' | 'unresolved';
    candidateCount: number;
    selectedId?: string;
    confidence: 'high' | 'medium' | 'low';
  };

  symbol?: {
    id?: string;
    name: string;
    normalizedName?: string;
    domain?: string;
    kind?: string;
    category?: string;
    ownerTypes?: readonly string[];
    appliesTo?: readonly string[];
    summary?: string;
    documentation?: string;
    obsolete?: boolean;
    obsoleteMessage?: string;
    replacement?: string;
    risk?: string;
    sourceUrl?: string;
    authority?: 'official' | 'curated' | 'generated' | 'project' | 'workspace' | 'custom';
  };

  signatures?: Array<{
    label: string;
    returnType?: string;
    parameters?: Array<{
      name: string;
      type?: string;
      documentation?: string;
    }>;
  }>;

  enumInfo?: {
    enumValueOf?: string;
    enumValues?: readonly string[];
    enumNumericValue?: number;
    enumValueMeaning?: string;
  };

  candidates?: Array<{
    id?: string;
    name: string;
    domain?: string;
    kind?: string;
    ownerTypes?: readonly string[];
    summary?: string;
    sourceUrl?: string;
  }>;

  findings: Array<{
    code: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    detail?: string;
  }>;

  recommendedActions: string[];
}
```

### Reglas estrictas

- No devolver catálogos completos.
- Respetar `maxCandidates`, `maxSignatures` y `maxEnumValues`.
- Usar locale español solo para textos de presentación, nunca para nombres reales del lenguaje.
- No traducir signatures, datatypes, enum values ni function names.
- Si hay ambigüedad, devolver candidates compactos y no elegir con confidence alta.
- No hacer full-catalog scans en hot path; usar índices existentes.
- Si se usa active editor fallback, resolver símbolo bajo cursor con contexto.

### Casos mínimos

```txt
ApplyTheme
AddItemArray
SetItemDate
OLEActivate
BeginDrag
JSONParser
HTTPClient
RESTClient
DWBuffer
Primary!
SaveAsType
CSV!
EncodingUTF8!
```

### Criterios de cierre verificables

- `ApiReadOnlyToolName` incluye `explain-system-symbol`.
- `READ_ONLY_TOOL_DESCRIPTORS` incluye `explain-system-symbol`.
- `VscPowerSyntaxApi` expone `explainSystemSymbol`.
- El contrato público incluye schemas nuevos.
- La tool resuelve símbolos generated/manual merged sin duplicar results.
- La tool devuelve documentación española si existe overlay y `locale: 'es'`.
- La tool cae a texto oficial si no existe localización.
- La tool respeta límites de candidates/signatures/enumValues.
- Tests cubren símbolo resuelto, símbolo ambiguo, símbolo inexistente, enum type, enum value y fallback de idioma.

### Docs afectadas

- `docs/developer-workflows.md`
- `docs/ai-orchestrator.md`
- `docs/rules-catalog.md`
- `docs/testing.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "explain-system-symbol|catalog|localization|publicApi|readOnlyTool"
```

---

## B381 — AI task context bundle orchestration tool
- **Estado:** Open
- **Track:** AI supportability / context orchestration / token budget
- **Prioridad:** Media-Alta
- **Depende de:** B376, B377, B379, B380
- **Objetivo:** añadir una tool/API read-only que genere un paquete compacto de contexto para una tarea IA concreta, combinando object-check, current-object-context, safe-edit-plan, dependency-graph y explain diagnostics/symbols según límites de tokens.
- **Razón técnica:** aunque existen tools focales, una IA sigue necesitando orquestar varias llamadas para preparar una tarea. Un bundle compacto evita repetir contexto, reduce tokens y estandariza la entrada antes de modificar código.

### Alcance incluido

- Añadir read-only tool:

```ts
| 'ai-task-context-bundle'
```

- Añadir método público:

```ts
getAiTaskContextBundle(request: ApiAiTaskContextBundleRequest): Promise<ApiAiTaskContextBundle>;
```

- Añadir comando opcional:

```txt
PowerBuilder: Export AI Task Context Bundle
powerbuilder.exportAiTaskContextBundle
```

### Request

```ts
export type ApiAiTaskIntent =
  | 'bug-fix'
  | 'refactor'
  | 'add-feature'
  | 'diagnose'
  | 'catalog-work'
  | 'documentation-update'
  | 'unknown';

export interface ApiAiTaskContextBundleRequest {
  intent?: ApiAiTaskIntent;
  uri?: string;
  objectName?: string;
  line?: number;
  character?: number;
  includeWorkspaceCheck?: boolean;
  includeObjectCheck?: boolean;
  includeSafeEditPlan?: boolean;
  includeDependencyGraph?: boolean;
  includeDiagnosticsExplanation?: boolean;
  includeSystemSymbolExplanations?: boolean;
  maxTokensHint?: number;
  maxDiagnostics?: number;
  maxSymbols?: number;
  maxFiles?: number;
}
```

### Bundle

```ts
export interface ApiAiTaskContextBundle {
  schemaVersion: '1.0.0';
  generatedAt: string;
  apiVersion: string;

  available: boolean;
  reason?: string;

  intent: ApiAiTaskIntent;
  tokenBudget: {
    maxTokensHint?: number;
    estimatedTokens?: number;
    truncated: boolean;
  };

  focus: {
    uri?: string;
    objectName?: string;
    line?: number;
    character?: number;
  };

  summary: string;
  rules: string[];
  context: {
    workspaceCheck?: ApiWorkspaceCheckReport;
    objectCheck?: ApiObjectCheckReport;
    currentObjectContext?: ApiCurrentObjectContext;
    safeEditPlan?: ApiSafeEditPlan;
    dependencyGraph?: ApiPowerBuilderDependencyGraph;
    diagnosticExplanations?: ApiExplainDiagnosticReport[];
    systemSymbolExplanations?: ApiExplainSystemSymbolReport[];
  };

  recommendedWorkflow: string[];
  validationCommands: string[];
  docsToReview: string[];
  omissions: string[];
}
```

### Reglas estrictas

- Read-only.
- No modificar archivos.
- No ejecutar ORCA/build.
- No incluir código completo salvo excerpts pequeños necesarios.
- No incluir generated/manual completo.
- Respetar `maxTokensHint` de forma conservadora.
- Registrar en `omissions` todo lo omitido por límite.
- Preferir summaries y reports estructurados sobre texto largo.
- Usar active editor fallback solo si no se pasa foco explícito.

### Criterios de cierre verificables

- `ApiReadOnlyToolName` incluye `ai-task-context-bundle`.
- `READ_ONLY_TOOL_DESCRIPTORS` incluye `ai-task-context-bundle`.
- `VscPowerSyntaxApi` expone `getAiTaskContextBundle`.
- El contrato público incluye schemas nuevos.
- El bundle puede generarse para active editor.
- El bundle puede generarse para `uri/objectName` explícito.
- El bundle respeta límites y marca truncado.
- El bundle no incluye catálogos completos.
- Tests cubren intent `bug-fix`, `refactor`, `catalog-work`, foco ausente y truncado.

### Docs afectadas

- `docs/ai-orchestrator.md`
- `docs/ai-strategy.md`
- `docs/developer-workflows.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`

### Validación esperada

```bash
npm run build:test
npm run test:unit -- --grep "ai-task-context-bundle|context-budget|publicApi|readOnlyTool"
```

---

# 6. Current execution focus recomendado

## Fase activa 

01. B369 — Generated-vs-manual catalog adoption decision gate
02. B376 — Workspace check command and AI-readable validation report
03. B377 — Current object/class check command and AI-readable validation report
04. B371 — Catalog localization model and immutable overlay contract
05. B372 — DocumentationService locale-aware lazy resolver
06. B373 — Localized catalog consumers for hover, completion and signatureHelp
07. B374 — Spanish catalog localization authoring workflow and coverage gate
08. B375 — Generated localization compatibility with regenerated catalog IDs

## Siguiente fase — Localización española de alto rendimiento y datawindow

01. B378 — AI PowerBuilder context pack and token budget contract
02. B379 — Explain diagnostic tool and suggested safe fix contract
03. B380 — Explain system symbol and catalog lookup tool for AI
04. B381 — AI task context bundle orchestration 
05. B320 — DataWindow expression/property official catalog
06. B327 — DataWindow constants and property path catalog
07. B342 — Extract proven symbol heuristics from plugin_old
08. B344 — DataWindow binding edge cases from plugin_old
09. B354 — Server runtime orchestration decomposition
10. B292 — PowerBuilder preprocessor / conditional patterns investigation
11. B301 — Agent context budget enforcement
12. B299 — Agent execution dry-run contract
13. B300 — Agent validation receipt
14. B302 — Agent-safe documentation updater policy
15. B303 — Agent task replay from repro/support bundle

## No abrir todavía salvo necesidad real

- Automatización write-enabled avanzada sin `B263`, `B299` y `B300`.
- Nuevas features visuales pesadas sin guardrails claros y preferencia por Tree View frente a Webview cuando baste.
- Nuevos reports grandes sin `B276` y `B301`.
- Nuevos carriles ORCA/PBAutoBuild sin pasar por support matrix, troubleshooting y health.

---

# 7. Backlog derivado

- Mantener `B321` como absorbida por `B366/B367`; no ejecutarla como spec independiente salvo necesidad nueva demostrada.
- Si `B358/B359` vuelven al backlog, reformularlas como classification/enrichment/gaps sobre generated, no como duplicación de system object datatypes.
- Mantener DataWindow como sublenguaje propio y evitar cualquier parser DataWindow como PowerScript normal.
- Mantener ORCA fuera del hot path y detrás de policy/feature flags cuando implique write-enabled o packaging.
- Formalizar en docs la matriz de soporte final tras `B293`.
- Añadir checks de drift documental tras `B316-B317` para evitar backlog/done-log desalineados.
- Mantener la política de localización como overlay de documentación, nunca como duplicación de entries por idioma.
