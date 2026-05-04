# PowerBuilder 2025 para IA — Guía canónica para construir un plugin profesional de VS Code

> Documento para GitHub Copilot, Copilot Agent u otra IA de ingeniería.  
> Objetivo: entender PowerBuilder 2025 como ecosistema completo, no como simple sintaxis, y guiar el diseño de un plugin profesional de VS Code para proyectos PowerBuilder reales.

---

## 0. Principio maestro no negociable

> **Descubrir e indexar muy rápido sin bloquear.**

Toda decisión debe proteger:

- archivo activo primero;
- activación rápida de la extensión;
- indexación progresiva;
- serving interactivo desde snapshots publicados;
- persistencia y warm resume;
- cancelación y timeouts;
- observabilidad;
- degradación segura;
- semántica fuerte;
- cero bloqueo del Extension Host.

Regla principal:

```text
Nunca sacrificar la experiencia interactiva por análisis global.
```

El archivo abierto y sus dependencias directas tienen prioridad absoluta sobre el workspace completo.

---

## 1. Modelo mental correcto

PowerBuilder no es solo PowerScript. Es un ecosistema compuesto por:

```text
Workspace / Solution
Targets / Projects
PBL binarias
PBL folders modernos
PBD compiladas
Objetos SR*
PowerScript
DataWindows
DataStores
Menus
Structures
Queries
Pipelines
Resources
INI/config
PBAutoBuild
ORCA / OrcaScript
PBNI / PBX / DLL
PowerClient
PowerServer
.NET DataStore / Web APIs
HTTP / REST / JSON
WebView2
ActiveX / OLE
WinAPI
SQL embebido
código dinámico vía strings
```

PowerBuilder 2025 introduce un formato de **Solution** con `.pbsln`, `.pbproj`, carpetas `.pbl` y fuente SR* en texto. Al convertir desde Workspace, `.pbw` pasa a `.pbsln`, `.pbt` a `.pbproj`, y cada PBL se convierte en carpeta `.pbl` con objetos SR* separados.

El formato Workspace clásico usa `.pbw`, `.pbt`, `.pbl` y, cuando está bajo source control desde el IDE, `ws_objects` como carpeta de objetos exportados a texto.

Un plugin profesional no puede limitarse a syntax highlighting. Debe construir un modelo semántico incremental del proyecto.

---

## 2. Modos de proyecto

### 2.1 Solution moderno

```text
*.pbsln
*.pbproj
*.pbl/
  *.pblmeta
  *.sra
  *.srw
  *.sru
  *.srd
  *.srm
  *.srf
  *.srs
  *.srq
  *.srp
  *.srj
.pb/
build/
_BackupFiles/
```

En Solution, la fuente canónica está en carpetas `.pbl` con objetos SR* individuales. `.pb` y `build` contienen artefactos internos/binarios generados por el flujo de compilación. `_BackupFiles` guarda copias del Workspace/PBL anteriores tras conversión.

Reglas:

```text
- Solution no usa ws_objects.
- PBL folder es fuente primaria.
- .pbsln y .pbproj suelen serializar rutas en atributos Path="..." que pueden contener espacios; discovery/topology debe preservar la cadena entrecomillada completa antes de tokenizar.
- en apps reales modernizadas parcialmente puede existir .pbproj aislado sin .pbsln, junto a múltiples carpetas .pbl, .srj de deployment y .pblmeta solo en parte de las librerías; el plugin debe poder descubrir e indexar sin exigir topología completa desde el minuto cero.
- .pb y build se ignoran por defecto.
- _BackupFiles se ignora por defecto.
- .pblmeta se indexa como metadata de librería.
- variantes multiidioma como _e/_f/_i/_s son source real distinto y no deben colapsarse por stem, aunque compartan ancestros o propósito funcional.
- Machine code no aplica en Solution: el formato usa Pcode.
```

La conversión a Solution es de una sola dirección: Workspace puede convertirse a Solution, pero Solution no se convierte automáticamente de vuelta a Workspace.

### 2.2 Workspace clásico

```text
*.pbw
*.pbt
*.pbl
*.pbd
*.pbg
*.pbr
ws_objects/
  library_name__pbl/
    *.sra
    *.srw
    *.sru
    *.srd
    *.srm
    *.srf
    *.srs
    *.srq
    *.srp
    *.srj
```

En Workspace, `ws_objects` representa la fuente versionable cuando el proyecto se gestiona desde Git/SVN con PowerBuilder IDE.

Reglas:

```text
- ws_objects gana a PBL binaria para análisis.
- .pbl es contenedor/artefacto compilable, no texto editable directo.
- .pbd es artefacto compilado/dynamic library.
- .pbg puede mapear inventario de objetos legacy/source control.
- .pbr puede contener recursos que deben indexarse.
- si no existe ws_objects, puede ser PBL-only, source exportado manualmente o proyecto incompleto.
```

PowerBuilder permite seleccionar encoding para `ws_objects`: ANSI/DBCS, HEXASCII o UTF8. El plugin no debe asumir UTF-8 automáticamente.

### 2.3 PBL-only legacy

```text
*.pbw
*.pbt
*.pbl
*.pbd
resources/
ini/
```

Una PBL binaria no debe editarse directamente desde VS Code.

Reglas:

```text
- ORCA puede exportar objetos a staging.
- LibraryExport puede producir source textual.
- El staging ORCA no es fuente canónica salvo configuración explícita.
- El staging controlado actual vive en `.vsc-powersyntax/orca-export/orca-staging`, con script en `.vsc-powersyntax/orca-export/scripts/export-to-staging.orc` y estado en `.vsc-powersyntax/orca-export/state/last-export.state`.
- El rail write-enabled actual genera `.vsc-powersyntax/orca-export/scripts/import-from-staging.orc`, `.vsc-powersyntax/orca-export/scripts/regenerate-from-staging.orc`, `.vsc-powersyntax/orca-export/scripts/rebuild-from-staging.orc`, backups binarios en `.vsc-powersyntax/orca-export/backups/<operationId>/` y ledgers en `.vsc-powersyntax/orca-export/state/last-*-ledger.json`.
- Cualquier importación a PBL requiere preflight, backup, fingerprint y compile.
- El gate actual ya bloquea PBL fingerprint mismatch, staging ausente y `stale staging` frente a source real rastreado.
- Si solo hay roots `.pbl`, el plugin debe detectarlo como modo `PBL-only` y sintetizar un nodo read-only por librería para manifest/project model.
```

ORCA permite automatizar tareas equivalentes al Library Painter, incluyendo importación, compilación, regeneración, consulta de objetos y gestión de librerías.

### 2.4 Mixed mode

En proyectos reales pueden convivir:

```text
source real
PBL binarias
PBD compiladas
ORCA staging
dumps legacy
generated artifacts
backup folders
recursos
build outputs
```

Regla obligatoria:

```text
Todo archivo y símbolo debe tener sourceOrigin explícito.
La authority actual vive en lineage.authority; un sourceAuthority plano por archivo requeriría spec propia.
```

---

## 3. Source origin

Todo archivo/símbolo debe clasificar su origen:

```text
solution-source
workspace-ws_objects
pbl-folder-source
manual-export-source
orca-staging
pbl-dump-source
generated
backup
unknown
```

Prioridad:

```text
solution-source / workspace-ws_objects / pbl-folder-source
  > manual-export-source
  > orca-staging
  > pbl-dump-source
  > generated
  > backup
  > unknown
```

Reglas:

```text
- Definition prefiere source real.
- References deben indicar evidence/sourceOrigin.
- Rename solo con confidence alta y sourceOrigin confiable.
- Import to PBL solo desde orca-staging controlado.
- Source real gana siempre a staging.
- Backup nunca debe indexarse como source principal.
```

Estado runtime actual:

```text
- KnowledgeBase ordena buckets globales y por kind con esta prioridad.
- semanticQueryService desempata global fallback y candidatos equivalentes con la misma regla.
- semanticWorkspaceManifest sirve primero source real cuando un límite de objetos trunca duplicados con orca-staging.
- buildSymbolKey define la identidad exacta de símbolo e incorpora URI/posición, fileObjectName, owner o container, kind, signature, sourceOrigin, implementationKind y declarationScope.
- buildConflictFamilyKey es la única agregación relajada permitida para conflictos cross-project o cross-library; references, rename, manifest, dependency graph y API symbols no deben volver a comparar solo por nombre visible.
- las surfaces visibles que exportan símbolos publican identityKey derivada de esa misma serialización canónica en lugar de recomponer IDs locales por feature.
```

Estado actual del runtime:

```text
- `B229` ya queda cerrada: el análisis documental, la caché interactiva, el indexador y el watcher consumen `sourceOrigin` contextual desde `WorkspaceState`/routing cuando existe autoridad topológica.
- `inferSourceOrigin()` queda como fallback cuando el workspace todavía no puede servir un origen mejor o solo conoce `unknown`.
- si la topología cambia y altera `sourceOrigin`, los snapshots publicados se rematerializan sin exigir rediscovery global.
```

---

## 4. Lineage authority actual

Además de `sourceOrigin`, las entidades y queries actuales pueden exponer `authority` dentro de su lineage:

```text
derived
curated
official
project
workspace
custom
```

Uso:

```text
derived   -> inferido por análisis/documento.
curated   -> mantenido manualmente o por catálogo controlado.
official  -> proveniente de catálogo/documentación oficial.
project   -> derivado del modelo de proyecto.
workspace -> agregado a nivel workspace.
custom    -> suministro externo/configuración específica.
```

Reglas:

```text
- operaciones peligrosas combinan sourceOrigin confiable + authority suficiente + confidence alta;
- lineage.authority no equivale todavía a un sourceAuthority plano por archivo;
- si se necesita un contrato write/read-only por archivo, debe abrirse spec propia antes de documentarlo como estado vigente.
```

Contrato vigente del system catalog:

```text
- dataset `manual-core` -> provenance.kind = manual, authority = curated.
- dataset `generated` -> provenance.kind = generated, authority = official.
- la coexistencia de ambos rails en un mismo dominio no convierte ese dominio completo en oficial.
- `buildCatalogConsistencyReport()` debe poder resumir authorities/sources/versiones por dominio y detectar mismatches o metadata oficial incompleta antes de ampliar nuevos slices.
- corpus reales como PFC, STD u OrderEntry sirven para validación, no para declarar coverage oficial.
```

---

## 5. Encoding, line endings y round-trip seguro

PowerBuilder puede crear source control con `ws_objects` en ANSI/DBCS, HEXASCII o UTF8. El plugin debe preservar encoding y line endings cuando escriba.

Reglas:

```text
- detectar encoding por archivo;
- preservar encoding original al escribir;
- normalizar internamente solo para parsing;
- preservar CRLF cuando el proyecto lo requiera;
- avisar si hay mezcla CRLF/LF;
- no reescribir archivos completos si basta con cambio incremental;
- no tocar archivos con bytes no decodificables;
- no formatear automáticamente source exportado si puede romper round-trip con PB IDE.
```

Confidence baja si:

```text
encoding desconocido
caracteres no decodificables
mezcla CRLF/LF
source exportado sin metadata fiable
source generado desde PBL dump
```

---

## 6. Extensiones clave

```text
.sra      Application
.srw      Window
.sru      User Object
.srm      Menu
.srd      DataWindow
.srf      Global Function
.srs      Structure
.srq      Query
.srp      Pipeline
.srj      Project

.pbl      Library binary o folder según contexto
.pbd      Dynamic library / compiled artifact
.pbt      Target
.pbw      Workspace
.pbsln    Solution
.pbproj   Project
.pblmeta  Library metadata
.pbg      Library object list legacy/source control
.pbr      Resource list
.psr      DataWindow/report saved output or report artifact
.ini      Application/runtime configuration
.bmp      Resource
.ico      Resource
.cur      Resource
.png      Resource
.wav      Resource

.pbx      PBNI/PBX native extension
.dll      Native/.NET/ActiveX dependency
.json     PBAutoBuild / project metadata / app config
.xml      RibbonBar / config / generated metadata
.sql      SQL scripts/procedures externos
```

Reglas:

```text
- .srd no es PowerScript.
- .pbl no es editable como texto.
- .pbd no es source.
- .pbr, .ini, .json, .xml y .sql pueden contener referencias críticas.
```

---

## 7. Arquitectura de análisis

```text
Project Detector
  -> File Classifier
    -> Source Origin Resolver
      -> Encoding Detector
        -> ProjectGraph Builder
          -> LibraryGraph Builder
            -> Container Parser SR*
              -> Embedded PowerScript Parser
              -> DataWindow Parser
              -> SQL Extractor
              -> Resource Resolver
              -> Semantic Snapshot Builder
```

Reglas:

```text
- No parsear todo como PowerScript.
- .srd requiere parser DataWindow.
- .pbt/.pbproj alimentan ProjectGraph.
- .pbg alimenta object inventory.
- .pbr alimenta resource index.
- .json puede ser PBAutoBuild/project metadata.
- .xml puede ser RibbonBar/config.
```

---

## 8. ProjectGraph y LibraryGraph

El plugin debe construir:

```text
ProjectGraph
  - roots[]
  - solutions[]
  - workspaces[]
  - targets[]
  - projects[]
  - libraries[]
  - pblFolders[]
  - pblBinaries[]
  - pbdDependencies[]
  - objects[]
  - resources[]
  - buildProfiles[]
  - sourceOrigins[]
  - lineageAuthorities[]
```

```text
LibraryGraph
  - target
  - orderedLibraries[]
  - objectOwnership
  - pbgInventories[]
  - duplicateObjectNames[]
  - unresolvedLibraries[]
  - externalPbdDependencies[]
```

Reglas:

```text
- library order afecta definición, references y completion.
- objeto duplicado en varias librerías requiere evidence.
- definition debe preferir la primera librería válida según target activo.
- references deben conservar library/object ownership.
- diagnostics deben detectar duplicados peligrosos.
```

---

## 9. Anatomía SR*

### 9.1 `.sru` — User Object

Puede contener:

```text
forward global type
global type ... from ...
global object variable
forward prototypes
functions
events
variables
on create
on destroy
```

Ejemplo:

```powerscript
forward global type n_customer_service from nonvisualobject
end type
end forward

global type n_customer_service from nonvisualobject
end type

global n_customer_service n_customer_service

forward prototypes
public function long uf_loadCustomer (long al_customerId)
end prototypes

public function long uf_loadCustomer (long al_customerId);
    long ll_rc
    return ll_rc
end function

on n_customer_service.create
    call super::create
    TriggerEvent(this, "constructor")
end on
```

Regla adicional:

```text
- En SR* exportados por PowerBuilder es común que el bloque estructural `on object.create` / `on object.destroy`
  contenga solo `TriggerEvent(this, "constructor")` / `TriggerEvent(this, "destructor")`, incluso sin
  `event constructor/destructor` local explícito y, en corpus reales como PFC, a veces también sin `call super::*`.
- Ese patrón debe tratarse como boilerplate de definición del objeto, no como wiring lifecycle sospechoso por sí mismo.
```

### 9.2 `.srw` — Window

Contiene:

```text
window type
ancestor
controls
control declarations
events
control events
variables
functions
scripts
```

### 9.3 `.sra` — Application

Define el objeto Application y su entry point lógico, especialmente eventos como `Open`, `Close` y `SystemError`.

### 9.4 `.srf` — Global Function

Debe indexarse como función global accesible según library order.

### 9.5 `.srs` — Structure

Debe indexarse como tipo de datos con campos y tipos.

### 9.6 `.srd` — DataWindow

No es PowerScript. Requiere modelo propio.

---

## 10. Scopes y resolución de variables

PowerBuilder define variables globales, instance, shared y local. Para referencias no cualificadas, PowerBuilder busca en este orden:

```text
local
shared
global
instance
```

Reglas:

```text
- local oculta shared/global/instance.
- shared oculta global/instance.
- global oculta instance.
- instance debe calificarse cuando queda oculta.
- global oculto puede accederse con ::globalName.
- instance oculto debe accederse con object.instanceVariable.
- rename debe bloquearse si cambia la resolución efectiva.
```

---

## 11. Pronombres y calificación

El plugin debe entender:

```text
This.x
Parent.x
::globalName
super::function
ancestor::function
object.member
control.event
```

Reglas:

```text
- No resolver referencias por texto.
- No renombrar sin resolver contexto.
- super:: apunta al ancestor inmediato.
- ancestorClass:: apunta a ancestor explícito.
- :: fuerza scope global.
```

---

## 12. Prototype vs implementation

El plugin debe relacionar prototypes e implementations, no tratarlos como duplicados.

Reglas:

```text
PB-STRUCT-001 Prototype without implementation
PB-STRUCT-002 Implementation without prototype
PB-STRUCT-003 Prototype signature differs from implementation
PB-STRUCT-004 Access modifier differs
```

Navegación:

```text
Definition desde llamada -> implementation
Peek Declaration -> prototype
References -> prototype + implementation + call sites
```

---

## 13. Access modifiers, overloads y ancestor chain

El resolver debe modelar:

```text
public
protected
private
system
event
function
subroutine
global function
```

Reglas:

```text
- funciones/eventos pueden estar overloaded.
- descendants pueden override/extend ancestor methods.
- la ancestor chain puede terminar en tipos nativos del runtime (por ejemplo crypterobject, window o raíces como powerobject/throwable); diagnostics, hierarchy y APIs read-only deben resolverlos contra system catalog y completar la cadena nativa compartida sin reportarlos como tipos base ausentes del workspace.
- la firma incluye nombre, return type, parámetros, BY VALUE/BY REF/READONLY y throws.
- references deben distinguir override local, ancestor call y dynamic dispatch.
- completion debe priorizar miembros visibles según contexto.
```

Estado cerrado B281:

```text
- los overloads se conservan por firma normalizada en semanticFacts;
- prototype e implementation de la misma firma no generan ambigüedad artificial;
- definition y signatureHelp pasan aridad y tipos literales simples al query engine compartido;
- impact analysis solo trata como override las firmas compatibles;
- si una llamada no aporta evidencia suficiente de firma, la ambigüedad sigue visible.
```

---

## 13.1 PowerBuilder Language Knowledge Catalog v2

El catálogo del lenguaje vive en `src/server/knowledge/system` y es la fuente rica para metadata de sistema. No sustituye los `Set<string>` rápidos de `src/server/parsing/grammar.ts`; esos Sets siguen disponibles para parser/matcher hot-paths.

Dominios ya modelados:

```text
keywords
reserved-words
datatypes
system-object-datatypes
operators
pronouns
system-globals
enumerated-values
global-functions
object-functions
datawindow-functions
system-events
datawindow-events
statements
```

Reglas:

```text
- no cambiar IDs, kind, domain ni namespace generados existentes sin spec de compatibilidad;
- DataWindow expression/property catalog vive en dominios separados (`datawindow-expression-functions`, `datawindow-properties`) y sigue aislado de PowerScript normal;
- completion debe filtrar por prefijo, deduplicar y respetar prioridad de símbolos locales/proyecto;
- hover puede explicar símbolos de lenguaje como fallback, sin romper callable/event hover;
- diagnostics solo deben consumir hechos de catálogo con confidence suficiente.
```

Estado auditado 2026-05-03:

```text
- DataWindowChild está alineado entre system-object-datatypes y PB_BUILTIN_TYPES.
- `B285` queda ya cerrada: `system-object-datatypes` cubre ahora el runtime base usado en PFC/OrderEntry, incluyendo HTTP/JSON/OAuth, controles visuales comunes (`CommandButton`, `TreeView`, `WebBrowser`, `RibbonBar`, etc.), objetos de servicios (`INet`, `InternetResult`, `RestClient`, `WSConnection`) y reflection/runtime (`EnumerationDefinition`, `Function_Object`, `PBDOM_*`).
- `PB_BUILTIN_TYPES` queda alineado con ese catálogo curado para evitar drift entre parser rápido y system catalog.
- `script/generate_official_function_catalog.cjs` apunta al layout actual del servidor.
- `scripts/generate_official_function_catalog.cjs` existe como wrapper de compatibilidad.
- `B319` queda ya cerrada: `officialCoverage.generated.ts` publica coverage oficial para `global-functions`, `object-functions`, `datawindow-functions`, `system-events` y `statements`, dejando a B322-B336 la expansión oficial del resto de dominios.
- `B322` queda ya cerrada: `officialCoverage.generated.ts` cubre `keywords` y `reserved-words` sin gaps, `generated.generated.ts` materializa `PB_GENERATED_KEYWORDS` y `PB_GENERATED_RESERVED_WORDS`, y `generatedKeywordLexemes.generated.ts` mantiene `PB_KEYWORDS` alineado con vocabulario oficial como `PUBLIC`, `COMMIT`, `NAMESPACE`, `WITH`, `SYSTEMREAD` y `XOR` sin convertir `pronouns` ni `system-globals` en la fuente primaria del dominio.
- `B357` queda ya cerrada: el catálogo manual se reparte ahora en `language/`, `datawindow/`, `runtime/`, `core/` y `ownerTypes/`; `manual/common.ts` conserva sólo factories/helpers, `manual/sources.ts` centraliza provenance base y `manual/index.ts` publica agregadores estables para que `registry/datasets.ts`, `nativeAncestors.ts` y el carril generated no dependan de rutas internas de slices.
- `B358` queda ya cerrada: el carril visual de `system-object-datatypes` vive ahora en `manual/visual/` (`visualObjects`, `textControls`, `listControls`, `drawingControls`, `dataControls`, `ribbonControls`, `oleVisualControls`), `Application` queda fijado en runtime/system, `OLEControl`/`OLECustomControl` pasan al rail visual y tipos como `MDIFrame`, `MDIClient`, `MenuCascade`, `RibbonApplicationMenu`, `RibbonPanelItem` y `WindowActiveX` quedan alineados entre catálogo, owner groups, ancestros nativos y `PB_BUILTIN_TYPES`.
- `B359` queda ya cerrada: `manual/runtime/` y `manual/integration/` completan el carril nonvisual moderno en slices explícitas (`systemTypes`, `errors`, `reflection`, `ole`, `mail`, `profiling`, `json`, `http`, `rest`, `oauth`, `pdf`, `filesystem`, `compression`, `crypto`, `dotnet`), el catálogo fija casing canónico para `Inet`, `RESTClient`, `MailFileDescription` y `MailMessage`, y familias representativas como `SMTPClient`, `ResourceResponse`, `PDFPage`, `PDFTableOfContents`, `TraceTreeRoutine` y `PowerServerResult` quedan curadas ya en `manual-core` con `PB_BUILTIN_TYPES` alineado sin remezclar visual con runtime/nonvisual.
- `B360` queda ya cerrada: `manual/language/enumerations/` separa de forma estricta `enumerated-type` y `enumerated-value`, los tipos canónicos (`SaveAsType`, `DWBuffer`, `Encoding`, `WindowType`, etc.) ya no conservan `!`, los valores (`Text!`, `Primary!`, `EncodingUTF8!`, etc.) quedan ligados por `enumValueOf`, `queryService.ts`/`SystemCatalog.ts` publican `listEnumeratedTypes()` + `resolveEnumeratedType()`/`resolveEnumeratedValue()` y `buildCatalogConsistencyReport()` bloquea regresiones con `invalidEnumeratedTypeNames`.
- `B361` queda ya cerrada: el mismo rail oficial de `script/generate_official_function_catalog.cjs` genera `enumeratedTypes.generated.ts`, `enumeratedValues.generated.ts`, `enumeratedCoverage.generated.ts` y `enumeratedProvenance.generated.ts` desde el concepto de enumerated datatypes, DataWindow constants y property pages de Appeon, recortando el contenido local antes del `navfooter` para no mezclar TOCs o páginas índice con membresía real.
- Ese rail oficial puede dejar tipos sin `enumValues` cuando la documentación solo publica códigos enteros o rangos numéricos y no tokens con `!` defendibles, como ocurre con `SecureProtocol`; cualquier ampliación curada posterior pertenece a `B362`, no al extractor oficial.
- `B362` queda ya cerrada: el catálogo enumerado runtime deja `missingDocs = []` en `enumerated-types`, `SecureProtocol` conserva explicación y owners oficiales sin valores `!` inventados, y `SeekType` entra como gap manual-curated de archivo con `FromBeginning!`, `FromCurrent!` y `FromEnd!` respaldado por corpus real (`FileSeek`) y por evidencia PFC.
- `B363` queda ya cerrada: hover, completion y signatureHelp consumen ya el modelo canonico de enums desde `SystemCatalog`, `enumeratedContext.ts` comparte la resolucion del tipo esperado para propiedades y parametros catalog-driven, `semanticTokens.ts` clasifica valores conocidos con `!` como `enumMember` y `diagnostics.ts` emite `enum-value-context-mismatch` solo cuando el tipo esperado es inequívoco y la confidence sigue siendo defendible.
- `B324` queda ya cerrada: `operators`, `pronouns`, `enumerated-types` y `enumerated-values` se mantienen como dominios curados explícitos del vocabulary rail, y `catalogV2.test.ts` bloquea overlaps accidentales con `keywords`/`reserved-words` después de la oficialización de B322 y del breaking split de `B360`.
- `B325` queda ya cerrada: `systemGlobals.ts` publica `valueType`, `risk` y firmas tipadas para `SQLCA`, `SQLSA`, `SQLDA`, `Error` y `Message`; `semanticQueryService.ts` y `signatureHelp.ts` consumen ya esa metadata catalog-driven en lugar de hardcodes por nombre.
- `B365` queda ya cerrada: `buildIndexes.ts` publica `byDomainAndLookupKey`, `byKindAndLookupKey`, `byEnumValueOf` y `byOwnerTypeAndDomain` como buckets compuestos readonly, `queryService.ts` expone queries indexadas y owner-scoped sobre esos buckets, y `resolveLanguageSymbol()` usa una prioridad explícita (`reserved-word -> keyword -> pronoun -> datatype -> system-type -> enumerated-type -> system-global -> enumerated-value -> operator -> property -> constant`) sin depender del orden accidental del registry.
- `B330` queda ya cerrada: `completion.ts` consume `reserved-words`, `pronouns`, `system-globals`, `enumerated-types` y `enumerated-values` sólo en la rama contextual sin qualifier, con deduplicación case-insensitive y prioridad menor que símbolos locales/proyecto, evitando mezclar esos dominios en member contexts irrelevantes.
- `B320` queda ya cerrado: `manual/datawindow/` publica `datawindow-properties` y `datawindow-expression-functions` con provenance oficial/curada, `dataWindowPropertyPaths.ts` reconsume `DataWindow.*`/`dddw.*` desde el catálogo y `completion.ts` ofrece funciones de expresión oficiales sólo dentro de `.srd`, manteniendo namespace `datawindow` / `datawindow-expression` separado de PowerScript general.
- `B323` queda ya cerrada: `officialCoverage.generated.ts` deja `datatypes` y `system-object-datatypes` en cobertura oficial completa, `generated.generated.ts` materializa los system types oficiales faltantes y `generatedBuiltinTypes.generated.ts` mantiene `PB_BUILTIN_TYPES` alineado con aliases críticos como `UnsignedInt` y con tipos oficiales relevantes como `SMTPClient`, `WindowObject`, `PDFAction`, `SyncParm` y `PowerServerResult`.
- `B366` queda ya cerrada: el scraper oficial extrae ya `returnType/returnDocumentation`, parámetros por firma incluso cuando Appeon los publica como tabla anónima bajo `Syntax`, `eventId/eventIds`, metadata estructural de reserved words y overlays ricos para `system-object-datatypes`; `PDFDocumentProperties` publica `baseType = PDFModel` con `properties/functions/events`, `AddItemArray` queda con parámetros estructurados reales y `queryService.ts` prioriza ese overlay oficial enriquecido cuando resuelve tipos runtime.
- `B370` queda ya cerrada: el mismo rail oficial queda congelado en snapshots compactos offline (`ApplyTheme`, `AddItemArray`, `SetItemDate`, `OLEActivate`, `BeginDrag`, `DragDrop`, `PDFDocumentProperties` y reserved words), `catalogGeneratorScript.test.ts` compara esos casos contra JSON compacto sin red y el extractor publica ya `usageNotes` cuando la referencia oficial de Appeon incluye sección `Usage`, dejando cualquier drift del layout oficial localizado por fixture antes de abrir `B367`.
- `B367` queda ya cerrada: `script/generate_official_function_catalog.cjs` publica el catálogo official `generated` en modo `complete` por defecto, `generated.generated.ts` incorpora ya `datatypes` además del resto de dominios oficiales, `generatedCompleteness.generated.ts` deja cobertura completa por dominio (`missingCount = 0`) y el generator fusiona overloads oficiales con identidad lógica repetida antes de materializar el dataset para no reintroducir duplicados estructurales al convivir con `manual-core`.
- `B368` queda ya cerrada: el catálogo runtime hace explícita la capa curada manual mediante `manualOverlay`, `registry.ts` clasifica `gap/enrichment/override` sobre el source-of-truth oficial ya completo, `catalogConsistency` falla si hay overlaps manual/generated sin policy y `queryService.ts` aplica una merge policy provisional donde `generated` permanece como base oficial, `enrichment` añade metadata curada sin competir y `override` manual corrige casos oficiales concretos como `Clipboard`.
- `B369` queda ya cerrada: `buildCatalogConsistencyReport().adoption` convierte la comparación `generated` vs `manual-core` en evidencia contractual por dominio y summary global, `docs/adr/ADR-0001-system-catalog-source-of-truth.md` fija la decisión y el runtime adopta formalmente `generated-primary-with-manual-overlays`; solo `datawindow-events`, `operators`, `pronouns` y `system-globals` permanecen `manual-primary` hasta que exista un extractor oficial defendible para esos dominios.
- `B371` queda ya cerrada: `src/server/knowledge/system/localization/` introduce el rail de localización documental separado con overlays inmutables por locale, primer índice español parcial y resolvedor memoizado por `entry.id` o `targetKey`, enlazado siempre contra la entry canónica del bucket runtime; `generated` conserva el texto oficial/original, no se duplican símbolos por idioma y `catalogConsistency` publica los overlays huérfanos bajo `localization` para cortar drift antes de integrar consumers visibles.
- `B373` queda ya cerrada: `hover`, `completion` y `signatureHelp` consumen ya el rail localizado en producto real mediante `DocumentationService`, la setting pública `vscPowerSyntax.languageServices.documentationLocale` resuelve `auto|en|es` usando el locale de VS Code cuando procede, la `ServingCache` se segrega por idioma efectivo y el serving documental puede reutilizar overlays desde siblings manual/generated del mismo bucket lógico sin alterar el símbolo semántico finalmente servido.
- `B374` queda ya cerrada: el mismo rail localizado incorpora ya un workflow de authoring explícito, con `domainCoverage`, overlays incompletos y `invalidParameterTargets` publicados desde `buildCatalogConsistencyReport().localization`, script determinista `npm run report:catalog-localization` para snapshot JSON/Markdown bajo `artifacts/catalog/` y guía viva en `docs/localization.md` para ampliar `es` sin traducir nombres reales ni anchors técnicos.
- `B375` queda ya cerrada: si una regeneración mueve el `targetId` pero deja intacta la identidad semántica del símbolo, `targetKey` recupera el target canónico, el audit publica `recoveredTargetIds` y `npm run migrate:catalog-localization-target-ids` deja la reconciliación del source como operación offline explícita en lugar de esconderla dentro del runtime.
```

---

## 14. Lifecycle events

`on object.create` y `on object.destroy` son scripts especiales.

El plugin debe detectar:

```text
call super::create
call super::destroy
TriggerEvent(this, "constructor")
TriggerEvent(this, "destructor")
constructor/destructor logical flow
```

Reglas:

```text
- mostrar lifecycle outline.
- diagnosticar falta de ancestor call si regla del proyecto lo exige y el bloque no es solo boilerplate estructural exportado.
- no emitir `missing-super-*`, `missing-trigger-*` ni `unresolved-*` solo porque un SR* exportado use el patrón estructural create/destroy + TriggerEvent implícito del objeto.
- permitir navegación create/destroy.
```

---

## 15. Lexing y control flow

Debe soportar:

```text
comentarios
strings
continuaciones con &
IF / END IF
CHOOSE CASE
FOR / NEXT
DO / LOOP
TRY / CATCH / FINALLY
THROW
THROWS
RETURN
EXIT
CONTINUE
GOTO
embedded SQL
```

Reglas:

```text
- parser tolerante a errores.
- preservar rangos exactos.
- nunca romper semantic tokens por un error parcial.
- degradar readiness, no bloquear LSP.
```

---

## 16. SQL en PowerScript

Reconocer al menos:

```text
SELECT ... INTO ...
INSERT
UPDATE
DELETE
DECLARE cursor
OPEN cursor
FETCH cursor
CLOSE cursor
EXECUTE IMMEDIATE
COMMIT
ROLLBACK
SQLCA
Transaction
SetTransObject
SetTrans
```

Variables PowerScript dentro de SQL se referencian con `:`. También existen indicator variables para null/conversion errors en FETCH/SELECT.

Ejemplo:

```powerscript
SELECT name
INTO :ls_name
FROM customer
WHERE customer_id = :ll_customerId;
```

Ejemplo con indicator variable:

```powerscript
FETCH c_customer
INTO :ls_name :li_nameInd;
```

Diagnostics recomendados:

```text
PB-SQL-001 Host variable not declared
PB-SQL-002 Indicator variable is not integer
PB-SQL-003 Cursor opened but not closed
PB-SQL-004 SQLCode not checked after critical SQL
PB-SQL-005 Transaction object unresolved
PB-SQL-006 Dynamic SQL lowers confidence
```

---

## 17. DataWindow como sublenguaje

`.srd` no debe parsearse como PowerScript.

Modelo recomendado:

```text
DataWindowModel
  - name
  - sourceUri
  - sourceOrigin
  - confidence
  - columns[]
  - arguments[]
  - sql?
  - pbselect?
  - bands[]
  - controls[]
  - expressions[]
  - validations[]
  - updateProperties?
  - nestedReports[]
  - dddwReferences[]
  - tables[]
  - joins[]
  - computedFields[]
```

Fases:

```text
Phase 1: safe mode
  - name
  - columns
  - arguments
  - SQL raw/extracted
  - bands

Estado actual del repo:
- safe mode mínimo ya operativo para `.srd` sobre snapshots read-only;
- se extraen `arguments=(...)` / `ARG(...)`, SQL base (`retrieve=`), columnas `table(column=...)` y bandas principales `header/detail/footer/summary`;
- hover puede proyectar este resumen cuando un `DataObject` literal resuelve hacia un `.srd` indexado;
- definition sigue navegando contra el stub `.srd` publicado por el análisis, sin parsear DataWindow como PowerScript.
- un refuerzo legacy-safe adicional permite hover/definition locales dentro del propio `.srd` para bandas y columnas SQL simples del `retrieve`, sin reintroducir el subsistema legacy completo.
- el catálogo básico ya está integrado: `documentSymbols` expone root/bandas/tabla/columnas/`retrieve` y los workspace/API symbols publican el stub `.srd` como tipo navegable del workspace.
- existe ya un `DataWindowModel` reutilizable por hover/definition/documentSymbols para el slice avanzado inicial;
- `B287` queda ya cerrada: `DataWindowModel` concentra `retrieve`, `retrieveArguments`, bandas, columnas `table`, `report(...)` y referencias SQL simples, incluyendo comillas escapadas `~"` y tipos con paréntesis balanceados;
- `dataWindowSafeMode`, los bindings `DataObject` y la especialización de `Retrieve(...)` reutilizan ese mismo `DataWindowModel` en vez de reparsear snapshots `.srd` por su cuenta;
- `B288` queda ya cerrada: `sqlReferences` soporta aliases de `select`, `JOIN ... ON` simples y `WHERE` básico, resolviendo aliases de tabla cuando son defendibles y degradando cláusulas complejas con subquery sin fingir una engine SQL completa;
- `B290` queda ya cerrada: `Describe`, `Modify`, `Retrieve`, `SetTrans`, `SetTransObject`, `Update` y `GetChild` viven en un catálogo owner-scoped con firmas, docs y `risk` coherentes para `hover`, `signatureHelp`, `completion` y `diagnostics`;
- `B291` queda ya cerrada: `sqlRegions` publica anchors SQL embebidos con `confidence` y `transactionTarget` defendible hacia current object context, code metrics, debt report y support bundle, sin abrir un parser SQL general ni IDs diagnósticos nuevos;
- `GetChild()` queda restringido a DataWindow control y DataStore; `DataWindowChild` no debe ofrecerlo ni explicarlo por fallback cuando el owner ya está resuelto;
- ese slice avanzado cubre `report(name=... dataobject=...)`, `column.dddw.name`, property paths `Describe/Modify(...DataWindow.Table.Select)`, acceso directo `dw.Object.<control|column|property>` y `GetChild()` cuando el binding `DataObject` literal y la cadena child son deterministas.
- `B320` cierra además el primer catálogo oficial reutilizable de ese sublenguaje: `datawindow-properties` sirve `DataWindow.DataObject`, `DataWindow.Table.Select` y `dddw.name` a `Describe/Modify/Object`, mientras `datawindow-expression-functions` sirve `CurrentRow`, `If`, `Sum` y el resto del vocabulario oficial Appeon sólo dentro de expresiones `.srd`.

Phase 2: bindings
  - DataObject assignments
  - Retrieve/Update
  - SetTransObject/SetTrans
  - DataStore usage

Phase 3: advanced properties
  - controls
  - expressions
  - validations
  - Describe
  - Modify
  - Evaluate
  - DataWindowChild/DDDW

Estado actual del repo:
- el primer corte real de Phase 3 ya existe para relaciones `report(...)` y `DDDW`, junto con hover/definition seguros de `Describe/Modify`, `.Object.<...>` y `GetChild()` sobre rutas resolubles del mismo backbone `DataWindowModel`;
- sigue fuera de alcance resolver rutas dinámicas/ambiguas o fingir semántica cuando el `DataObject` o la cadena child no tienen evidencia suficiente.

Phase 4: diagnostics
  - missing DataObject
  - retrieve arg mismatch
  - transaction missing
  - dynamic downgrade
```

Binding típico:

```powerscript
dw_1.DataObject = "d_customer"
dw_1.SetTransObject(SQLCA)
dw_1.Retrieve(ll_customerId)
```

Diagnostics recomendados:

```text
PB-DW-001 DataObject literal not found
PB-DW-002 Retrieve argument count mismatch
PB-DW-003 DataObject assignment cannot be resolved
PB-DW-004 DataWindow expression dependency unresolved
PB-DW-005 Dynamic Modify/Describe lowers confidence
PB-DW-006 Nested report reference not found
PB-DW-007 DDDW reference not found
PB-TX-001 SetTransObject/SetTrans missing before Retrieve/Update
PB-TX-002 Update without transaction handling
```

---

## 18. Framework Intelligence

PowerBuilder real suele apoyarse en frameworks como PFC, STD Foundation Classes o frameworks internos.

Modelo recomendado:

```text
FrameworkModel
  - frameworkKind: pfc | std | custom | unknown
  - layer: base | extension | descendant | application
  - services[]
  - managers[]
  - ancestors[]
  - overriddenMethods[]
  - extensionPoints[]
  - applicationEntryPoints[]
```

Reglas:

```text
- no tratar framework base y código app como igual;
- distinguir ancestor framework vs objeto de aplicación;
- soportar navegación por override;
- soportar impact analysis si cambia un ancestor;
- detectar servicios comunes: resize, security, logging, metadata, DataWindow, transaction, preference, error manager;
- permitir filtros: "application symbols only", "include framework symbols".
```

---

## 19. Recursos, INI y artefactos auxiliares

PowerBuilder usa recursos y configuración externos:

```text
.pbr
.ini
.bmp
.ico
.cur
.png
.wav
.psr
.xml
.json
.sql
html/js/css assets
```

El plugin debe indexar referencias desde:

```text
propiedades visuales
DataWindow
scripts PowerScript
project/build metadata
PBR
INI/ProfileString/ProfileInt
RibbonBar XML
WebView2/HTML assets
```

Diagnostics recomendados:

```text
PB-RES-001 Referenced resource not found
PB-RES-002 Unused resource
PB-RES-003 INI key used but file/profile unresolved
PB-RES-004 PBR references missing file
PB-RES-005 Case mismatch risk in source control
PB-RES-006 Generated resource indexed as source
```

---

## 20. PBAutoBuild

PBAutoBuild250.exe permite construir desde línea de comandos sin abrir PowerBuilder IDE, usando JSON de build.

Detectar:

```text
PBAutoBuild250.exe
MetaInfo
IDEVersion
RuntimeVersion
BuildPlan
SourceControl
Git/SVN/VSS
Merging
BuildJob
Projects
ProjectType
Libraries
PBRFileName
CodeGenerationOptions
ProjectBuildOptions
PowerClient config
PowerServer config
```

Reglas:

```text
- siempre out-of-process;
- nunca bloquear Extension Host;
- ejecutar con timeout/cancelación;
- capturar stdout/stderr/logs;
- publicar errores como VS Code Problems;
- soportar dry-run/validate cuando sea posible;
- no guardar credenciales desencriptadas;
- no modificar JSON sin backup.
```

Estado actual del producto:

```text
- `B181` ya queda cubierta como capability detection read-only.
- El cliente puede resolver `PBAutoBuild250.exe` por `vscPowerSyntax.build.pbAutoBuildPath`, `PB_AUTOBUILD_PATH` o candidatos instalados por defecto.
- El servidor ya descubre candidatos `*.json`, filtra build files PBAutoBuild por `BuildPlan`/hints mínimos, los vincula a markers `.pbw/.pbt/.pbproj/.pbsln` y los clasifica `usable/invalid/ambiguous` sin ejecutar builds.
- El watcher incremental ya refresca ese catálogo read-only cuando cambian build files JSON o markers topológicos.
- `B183` ya deja un runner out-of-process con `run/cancel`, timeout, selección segura del build file y estado mínimo visible en stats/journal/cliente.
- `B184` ya parsea la salida relevante del build y publica problemas solo cuando el objeto del log resuelve de forma única a un archivo real del workspace.
- `B187` ya unifica capability detection, build files, runner y problemas recientes en un snapshot reutilizable para status/health/menú.
- `B185` ya recuerda el último build ejecutado por workspace y expone comandos para repetirlo o elegir un build file utilizable desde VS Code.
- `B186` ya exporta un bundle neutral de CI/CD (`manifest`, README y scripts PowerShell/CMD/Bash) bajo `tools/pbautobuild-ci/<perfil>`, apoyado en el build file/perfil utilizable ya validado.
- La deuda operativa/documental `B198` ya quedó cerrada en `README.md` y `docs/developer-workflows.md`; `B195` también queda cerrada dejando explícito que el packaging ORCA de `EXE/PBD/DLL` no está expuesto y requeriría un feature flag dedicado, no una ampliación del carril técnico base de PBAutoBuild.
```

---

## 21. PowerClient, PowerServer y .NET DataStore

El plugin debe detectar:

```text
Native PB project
PowerClient project
PowerServer project
.NET DataStore project
REST/WebAPI metadata
generated C# solution
DataWindow WebAPI exposure
database config
runtime version
deploy target
```

Reglas:

```text
- separar source PB de generated .NET/API artifacts;
- no indexar generated server code como PowerScript;
- enlazar DataWindows expuestos como WebAPI;
- mostrar health/build profile por target;
- detectar RESTClient/HTTPClient consumidores;
- confidence baja si el endpoint se construye dinámicamente.
```

---

## 22. ORCA y PBL legacy

ORCA es tooling externo para operar con librerías PowerBuilder.

Nunca ejecutar ORCA en hot path:

```text
hover
completion
definition
references
signatureHelp
semanticTokens
diagnostics interactivos
```

Flujo seguro:

```text
export PBL -> orca-staging
edit source
preflight
backup PBL
ORCA import + compile
parse errors
refresh index
write report
```

Reglas:

```text
- la DLL de sesión ORCA se resuelve desde `vscPowerSyntax.legacy.orcaSessionDll`, `PB_ORCA_DLL` o fallback `pborc250.dll`.
- el staging exportado debe aliasarse a la librería `.pbl` original para routing/manifest antes de abrir import o prioridad de source.
- toda escritura sobre PBL requiere preflight.
- toda escritura sobre PBL requiere backup.
- toda escritura sobre PBL requiere fingerprint.
- toda escritura sobre PBL requiere compile result.
- toda operación debe tener rollback/log.
- nunca importar si el PBL cambió desde el export.
- nunca importar si el source real correspondiente cambió desde el export.
- nunca sobrescribir objeto más nuevo que staging.
```

Estado actual del runtime:

```text
- `vscPowerSyntax.importOrcaStaging` reutiliza `last-export.state` y ejecuta preflight antes de tocar la PBL.
- `vscPowerSyntax.regenerateOrcaLibraries` y `vscPowerSyntax.rebuildOrcaProject` reutilizan ese mismo rail seguro para mantenimiento legacy.
- `applySpecDrivenPblUpdate()` genera safe edit plan, fuerza export ORCA fresco, aplica edits explícitos sobre staging y reutiliza el mismo import con backup/ledger/journal para actualizar una PBL de forma controlada.
- `applySpecDrivenPblUpdateBatch()` coordina varias requests sobre ese workflow unitario, corta temprano cuando `stopOnError` está activo y agrega resultados por item sin abrir otro motor ORCA.
- El preflight actual ya bloquea fingerprint mismatch de PBL, staging ausente, staging vacío y `stale staging` frente a source real rastreado.
- `rebuild` se bloquea si el export persistido no conserva un target/project legacy real.
- Cada import persistida deja backup binario, `compileResult` y `last-import-ledger.json` con rollbackAvailable.
```

Operation ledger obligatorio:

```text
OrcaOperationLedger
  - operationId
  - timestamp
  - workspace
  - target
  - library
  - objectName
  - objectKind
  - sourceFingerprintBefore
  - sourceFingerprintAfter
  - pblFingerprintBefore
  - pblFingerprintAfter
  - backupPath
  - preflightResult
  - compileResult
  - errors[]
  - warnings[]
  - rollbackAvailable
```

Nota de implementación actual:

```text
- El runtime persiste hoy una versión library-level del ledger con `pblFingerprintBefore/After`, `backupRootUri`, `preflightResult`, `compileResult`, `warnings[]`, `errors[]` y `rollbackAvailable`.
- El runtime persiste además `.vsc-powersyntax/runtime/build-orca-journal.json` con el snapshot reciente de eventos `build|legacy`, accesible también desde `showStats.persistence.buildOrcaJournalUri`.
- La guía operativa y el troubleshooting comparado entre PBAutoBuild y ORCA viven en `README.md` y `docs/developer-workflows.md`; esta guía técnica conserva solo la descripción del runtime y sus invariantes.
- `orcaTooling.packagingPolicy` declara además que las operaciones `EXE/PBD/DLL` no están expuestas y exigirían un feature flag dedicado antes de abrir cualquier surface write-enabled nueva.
```

---

## 23. PBNI / PBX / DLL y dependencias nativas

Detectar:

```text
.pbx
.dll
PBNI
external function
PBX_GetDescription
PBX_CreateNonVisualObject
PBX_CreateVisualObject
PBX_InvokeGlobalFunction
native dependency
32/64-bit dependency
```

Reglas:

```text
- no prometer definition interna si vive en PBX/DLL;
- hover puede mostrar dependencia externa;
- rename/references deben degradar;
- detectar DLL/PBX faltante;
- advertir mismatch 32/64-bit cuando sea inferible;
- external functions deben indexarse como símbolos externos.
```

---

## 24. WebView2, JavaScript, JSON, HTTP y código dinámico

PowerBuilder moderno puede contener:

```text
EvaluateJavaScriptSync
EvaluateJavaScriptAsync
WebBrowser/WebView2 events
HttpClient
RestClient
JsonParser
JSONGenerator
JSONPackage
JSON path strings
WebAPI
WebSocket
FTP/SFTP
OAuth/JWT/certificates
```

Reglas:

```text
- símbolos referenciados desde strings dinámicos degradan confidence.
- JSON path strings no permiten rename seguro.
- JS strings no permiten rename seguro.
- endpoints REST dinámicos son low confidence.
- credenciales/tokens/certificados deben activar diagnostics de seguridad si aparecen hardcoded.
```

Estado cerrado B282:

```text
- invocationRisk público usa safe|inherited|fallback|dynamic|external.
- strings de eventos, DataWindow, WebView y HTTP request pueden elevar riesgo a dynamic.
- sourceOrigin no canónico eleva riesgo a fallback o dynamic según autoridad.
- impactAnalysis, safeEditPlan, dependencyGraph y code actions exponen riskReasons.
- rename y safe edit bloquean dynamic/fallback/external antes de producir edits.
- references degrada a declaraciones o vacío cuando solo se piden usos textuales inseguros.
```

---

## 25. Semantic Snapshot

Features LSP deben consumir snapshots publicados, no recomponer análisis.

```text
SemanticSnapshot
  - uri
  - version
  - fingerprint
  - identity
  - pass
  - readiness
  - containerModel
  - symbols
  - scopes
  - logicalStatements
  - maskedText
  - controlBlocks

Metadatos servidos junto al snapshot o sus entidades derivadas
  - sourceOrigin
  - lineage.authority
  - objectKind
  - objectName
  - ancestor
  - library
```

Reglas:

```text
- snapshots son inmutables.
- LSP consume último snapshot válido.
- parsing incremental publica snapshots parciales.
- errores no invalidan el snapshot anterior si este sigue siendo útil.
- cada feature debe declarar readiness mínima.
```

---

## 26. Readiness y confidence

Readiness:

```text
structural-only
nearby-semantic-ready
project-semantic-ready
workspace-semantic-ready
build-validated
```

Confidence:

```text
high
  - source real
  - scope/tipo resuelto
  - library order conocido
  - no ambigüedad

medium
  - ancestor parcial
  - DataObject literal
  - system catalog
  - dependencia externa conocida

low
  - dynamic call
  - JS string
  - JSON path
  - dynamic SQL
  - ORCA staging
  - PBL dump

blocked
  - source conflict
  - stale staging
  - ambiguous duplicate
  - import unsafe
  - encoding unsafe
```

Uso:

```text
Hover       acepta high/medium/low con explicación.
Definition  high/medium; low como probable.
References  high/medium; low separado como probable/dynamic.
Rename      solo high.
PBL import  solo staging-writeable + preflight OK.
Safe edit   bloqueado si invocationRisk es dynamic/fallback/external.
```

---

## 27. LSP features recomendadas

Orden recomendado:

```text
1. Document Symbols snapshot-first
2. Hover snapshot-first
3. Definition con library order
4. Completion por scope/tipo
5. Signature Help
6. References con evidence
7. Semantic Tokens
8. CodeLens
9. Diagnostics incremental
10. Rename con confidence gates
11. DataWindow navigation
12. Resource navigation
13. Build/health integration
14. ORCA/PBAutoBuild commands
```

Reglas:

```text
- Document Symbols debe funcionar con structural-only.
- Hover no debe bloquear esperando workspace-semantic-ready.
- Rename exige high confidence.
- References debe separar exact/probable/dynamic.
- Completion debe priorizar archivo activo y scope local.
```

---

## 28. Diagnostics profesionales recomendados

```text
PB-SCOPE-001 Variable declared but never used
PB-SCOPE-002 Variable shadows higher-scope variable
PB-SCOPE-003 Unqualified reference resolves ambiguously
PB-SCOPE-004 Rename blocked by dynamic/ambiguous reference

PB-STRUCT-001 Prototype without implementation
PB-STRUCT-002 Implementation without prototype
PB-STRUCT-003 Prototype signature differs from implementation
PB-STRUCT-004 Access modifier differs

PB-DW-001 DataObject literal not found
PB-DW-002 Retrieve argument count mismatch
PB-DW-003 SetTransObject/SetTrans missing before Retrieve/Update
PB-DW-004 DataWindow column not found
PB-DW-005 Dynamic Modify/Describe lowers confidence
PB-DW-006 Nested report/DDDW reference not found
PB-DW-007 Update without transaction handling

PB-SQL-001 Host variable not declared
PB-SQL-002 Indicator variable is not integer
PB-SQL-003 Cursor opened but not closed
PB-SQL-004 SQLCode not checked after critical SQL
PB-SQL-005 Transaction object unresolved

PB-RES-001 Resource reference not found
PB-RES-002 PBR entry missing file
PB-RES-003 INI/Profile key unresolved
PB-RES-004 Generated/backup file indexed as source

PB-PBL-001 Staging source is stale
PB-PBL-002 Import blocked by fingerprint mismatch

PB-BUILD-001 PBAutoBuild not found
PB-BUILD-002 Build JSON invalid
PB-BUILD-003 Build target not found
PB-BUILD-004 Build log contains compile errors

PB-NATIVE-001 External function target DLL/PBX not found
PB-NATIVE-002 PBNI symbol cannot be renamed safely
PB-NATIVE-003 32/64-bit native dependency mismatch risk
```

---

## 29. Corpus recomendado

Validar contra:

```text
PFC:
  - OpenSourcePFCLibraries/2025-Solution
  - OpenSourcePFCLibraries/2025-Workspace
  - PFC docs / migration notes

STD Framework:
  - SourceForge STD Foundation Classes
  - STD OrderEntry
  - STD Admin INI
  - STD PS Console
  - STD Windows Explorer

Official Appeon:
  - Appeon/PowerBuilder-Sales-Example
  - Appeon/PowerBuilder-Example
  - Appeon/PowerBuilder-AutoBuild-Sales-Example
  - Appeon CodeXchange samples

DataWindow:
  - Appeon/PowerBuilder-Dw2Doc-Example
  - thansuoi113 DataWindow examples
  - sebkirche/PowerBuilder-DataWindow
  - tree-sitter-datawindow
  - CodeXchange DataWindow utilities

PBL/legacy:
  - gmai2006/powerbuilder-pbl-dump
  - rwxce/pb-toolkit
  - Hucxy/PBDWEDIT

Build/ORCA:
  - Appeon/PowerBuilder-AutoBuild-Sales-Example
  - tuke307/lib-builder
  - zrh535/pborca
  - zhj149/PowerBuilder-ORCA
  - CodeXchange ORCA utilities

PBNI/native:
  - informaticon/cpp-pbni-framework
  - bruce-armstrong/pbnismtp
  - sebkirche/pbnilist
  - sebkirche/pbnihash
  - arnd-schmidt/pbwebview2

Modern integrations:
  - LEXBLAS/jsonapi
  - lxb320124/pbidea
  - Appeon/PowerBuilder-Graph-Example-WebView2
  - Chilkat PowerBuilder examples

Community/framework references:
  - Appeon CodeXchange
  - pblib.com framework references
  - SourceForge PowerBuilder projects
```

Cada corpus debe etiquetarse con:

```text
CorpusDescriptor
  - corpusKind
  - pbVersion
  - projectMode
  - sourceOrigin
  - hasPbl
  - hasPbd
  - hasWsObjects
  - hasPblFolders
  - hasDataWindows
  - hasPowerServer
  - hasPowerClient
  - hasDotNetDataStore
  - hasOrcaWorkflow
  - hasPBNI
  - hasResources
  - hasEmbeddedSQL
  - hasDynamicCode
  - sizeClass
```

---

## 30. Errores de diseño que la IA debe evitar

```text
1. Asumir que Solution usa ws_objects.
2. Asumir que Workspace siempre tiene source completo.
3. Indexar .pb/build/_BackupFiles como source real.
4. Parsear .srd como PowerScript.
5. Resolver referencias por texto.
6. Ignorar library order.
7. Ignorar sourceOrigin.
8. Ignorar sourceOrigin o la authority servida en lineage.
9. Ignorar encoding/line endings.
10. Mezclar ORCA staging con source real.
11. Permitir rename con dynamic strings.
12. Ejecutar ORCA en hot path.
13. Ejecutar PBAutoBuild en Extension Host.
14. Tratar PBNI/PBX como símbolos internos.
15. Indexar generated .NET/WebAPI como PowerScript.
16. Cerrar specs sin tests.
17. Cerrar specs sin actualizar documentación.
18. Añadir lógica de IA dentro del core.
```

---

## 31. Reglas para IA, agentes y Spec-Driven Development

Toda IA que trabaje en este plugin debe cumplir:

```text
1. Abrir la spec completa antes de modificar código.
2. Revisar arquitectura afectada.
3. Revisar backlog/current_focus/done-log/roadmap si aplica.
4. Implementar vertical slice real, no cambios cosméticos.
5. Añadir o actualizar tests.
6. Ejecutar tests relevantes.
7. Actualizar documentación afectada.
8. Actualizar done-log si la spec queda cerrada.
9. No cerrar specs partial sin criterios verificables.
10. No duplicar información entre documentos.
11. No tocar el core con lógica específica de IA.
12. Exponer APIs para IA externa, pero mantener core desacoplado.
13. Mantener siempre la meta: descubrir e indexar rápido sin bloquear.
14. Si una spec necesita abrir otra spec del backlog para terminar, abrirla y resolver dependencia.
15. No parar hasta dejar la spec realmente cerrada o documentar bloqueo verificable.
```

Definition of Done mínima:

```text
- código implementado;
- tests añadidos o actualizados;
- tests pasan;
- documentación afectada actualizada;
- performance/no-blocking revisado;
- diagnostics/logs entendibles;
- spec marcada como done solo si está completa;
- backlog/current_focus/done-log/roadmap alineados si aplica.
```

---

## 32. Resumen ejecutivo para IA

PowerBuilder 2025 debe modelarse como un ecosistema dual Workspace/Solution con objetos SR* individuales, librerías ordenadas, source origins explícitos, authority servida en lineage, encoding preservado, scopes particulares, herencia, frameworks, DataWindow como sublenguaje, recursos externos y automatización separada entre PBAutoBuild moderno y ORCA legacy.

El plugin debe construir snapshots semánticos incrementales, servir LSP desde estados publicados y usar readiness/evidence/confidence para evitar operaciones peligrosas.

La prioridad absoluta es descubrir e indexar muy rápido sin bloquear. El archivo activo siempre tiene prioridad sobre el análisis global. ORCA, PBAutoBuild, PBL import/export y rebuild deben ejecutarse siempre out-of-process y nunca en el hot path interactivo.

El objetivo no es un syntax highlighter: es un **PowerBuilder Workspace Intelligence Engine para VS Code**.
