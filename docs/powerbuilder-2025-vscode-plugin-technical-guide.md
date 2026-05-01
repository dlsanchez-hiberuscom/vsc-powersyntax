# PowerBuilder 2025 para GitHub Copilot — Guía canónica para construir un plugin profesional de VS Code

> Este documento ayuda a GitHub Copilot, Copilot Agent u otra IA de ingeniería a entender **PowerBuilder 2025 como ecosistema**, no solo como sintaxis. El objetivo es guiar decisiones de diseño para que el plugin entienda correctamente código PowerBuilder real.

---

## 0. Principio maestro

> **Descubrir e indexar muy rápido sin bloquear.**

Toda decisión debe proteger:

- archivo activo primero;
- indexación progresiva;
- serving interactivo rápido;
- persistence/warm resume;
- observabilidad;
- degradación segura;
- semántica fuerte.

---

## 1. Modelo mental correcto

PowerBuilder no es solo un lenguaje. Es un ecosistema compuesto por:

- Workspace/Solution;
- targets/proyectos;
- librerías PBL;
- carpetas PBL modernas;
- objetos SR*;
- scripts PowerScript;
- DataWindows;
- PBAutoBuild;
- ORCA/OrcaScript;
- extensiones PBNI/PBX;
- WebView2, JSON, HTTP y código dinámico.

Un plugin profesional no puede limitarse a syntax highlighting. Debe construir un modelo semántico del proyecto.

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
.pb/
build/
_BackupFiles/
```

En Solution, las carpetas `*.pbl` contienen source canónico. `.pb`, `build` y `_BackupFiles` son artefactos o backups y se ignoran por defecto.

### 2.2 Workspace clásico

```text
*.pbw
*.pbt
*.pbl
ws_objects/
  library_name__pbl/
    *.sra
    *.srw
    *.sru
    *.srd
    *.srm
    *.srf
```

En Workspace, `ws_objects` representa el source versionable. El plugin debe preferirlo cuando exista.

### 2.3 PBL-only legacy

Una PBL binaria no debe editarse directamente. ORCA o extractores pueden exportar source a staging, pero ese staging no es source canónico.

### 2.4 Mixed mode

En proyectos reales puede convivir source real, PBL binarias, staging ORCA, dumps legacy y generated artifacts. Por eso `sourceOrigin` es obligatorio.

---

## 3. Source origin

Todo archivo/símbolo debe clasificar su origen:

```text
solution-source
workspace-ws_objects
pbl-folder-source
orca-staging
pbl-dump-source
generated
unknown
```

Prioridad:

```text
solution-source / workspace-ws_objects / pbl-folder-source
  > orca-staging
  > pbl-dump-source
  > generated
  > unknown
```

Reglas:

- Definition prefiere source real.
- Rename solo con confidence alta y source origin confiable.
- Import to PBL solo desde `orca-staging` controlado.
- Source real gana siempre a staging.

---

## 4. Extensiones clave

```text
.sra  Application
.srw  Window
.sru  User Object
.srm  Menu
.srd  DataWindow
.srf  Global Function
.srs  Structure
.srq  Query
.srp  Pipeline
.srj  Project
.pbl  Library binary o folder según contexto
.pblmeta Library metadata
.pbw  Workspace
.pbt  Target
.pbsln Solution
.pbproj Project
.pbg  Library object list legacy/source control
.pbx  PBNI/PBX native extension
.pbd  Dynamic library / compiled artifact
```

---

## 5. Arquitectura de parsing

```text
Project Detector
  -> File Classifier
    -> Container Parser SR*
      -> Embedded PowerScript Parser
      -> DataWindow Safe Parser
      -> SQL Extractor
      -> Semantic Snapshot Builder
```

No parsear todo como PowerScript. `.srd` requiere parser DataWindow.

---

## 6. Anatomía SR*

### 6.1 `.sru` — User Object

Puede contener:

- `forward global type`;
- `global type ... from ...`;
- instancia global;
- prototypes;
- implementations;
- `on create/destroy`;
- variables.

```powerscript
forward global type n_customer_service from nonvisualobject
end type
end forward

global type n_customer_service from nonvisualobject
end type
global n_customer_service n_customer_service

forward prototypes
public function long uf_load_customer (long al_customer_id)
end prototypes

public function long uf_load_customer (long al_customer_id);
    long ll_rc
    return ll_rc
end function

on n_customer_service.create
    call super::create
    TriggerEvent(this, "constructor")
end on
```

### 6.2 `.srw` — Window

Contiene tipo ventana, herencia, controles, variables, funciones, eventos de ventana y eventos de controles hijos.

### 6.3 `.sra` — Application

Define el objeto Application y su evento `Open`, entry point lógico de la aplicación.

### 6.4 `.srf` — Global Function

Debe indexarse como función global accesible según library order.

### 6.5 `.srs` — Structure

Debe indexarse como tipo de datos con campos y tipos.

### 6.6 `.srd` — DataWindow

No es PowerScript. Requiere modelo propio.

---

## 7. Scopes y resolución

PowerBuilder resuelve variables no calificadas en este orden:

```text
local
shared
global
instance
```

El plugin debe implementar este orden exactamente para hover, definition, references, rename, diagnostics y shadowing.

---

## 8. Pronombres y calificación

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

No hacer rename seguro sin resolver contexto.

---

## 9. Prototype vs implementation

El plugin debe relacionar prototypes e implementations, no tratarlos como duplicados.

Reglas útiles:

```text
PB-STRUCT-001 Prototype without implementation
PB-STRUCT-002 Implementation without prototype
PB-STRUCT-003 Prototype signature differs from implementation
PB-STRUCT-004 Access modifier differs
```

Definition desde llamada debe ir a implementation. Peek declaration puede ir a prototype.

---

## 10. Lifecycle events

`on object.create` y `on object.destroy` son scripts especiales.

El plugin debe detectar:

- llamada ancestor;
- `TriggerEvent(this, "constructor")`;
- `TriggerEvent(this, "destructor")`;
- lifecycle navigation.

---

## 11. Lexing y control flow

Debe soportar:

- comentarios;
- strings;
- continuaciones con `&`;
- IF/END IF;
- CHOOSE CASE;
- FOR/NEXT;
- DO/LOOP;
- TRY/CATCH/FINALLY;
- THROW;
- RETURN;
- EXIT/CONTINUE;
- SQL embebido.

El parser debe preservar rangos y recuperarse ante errores.

---

## 12. SQL en PowerScript

Reconocer al menos:

```text
SELECT ... INTO ...
INSERT
UPDATE
DELETE
DECLARE/OPEN/FETCH/CLOSE cursor
EXECUTE IMMEDIATE
SQLCA
Transaction
SetTransObject
```

Fase inicial: syntax regions, references a transaction y diagnostics básicos.

---

## 13. DataWindow como sublenguaje

Modelo recomendado:

```text
DataWindowModel
  - name
  - columns[]
  - arguments[]
  - sql?
  - bands[]
  - controls[]
  - expressions[]
  - updateProperties?
  - nestedReports[]
  - confidence
```

Fases:

```text
Phase 1: safe mode
  - name, columns, args, SQL raw/extracted, bands

Phase 2: bindings
  - DataObject assignments, Retrieve/Update, SetTransObject, DataStore usage

Phase 3: advanced properties
  - controls, expressions, Describe, Modify, Evaluate, DataWindowChild/DDDW

Phase 4: diagnostics
  - missing DataObject, retrieve arg mismatch, transaction missing, dynamic downgrade
```

Binding típico:

```powerscript
dw_1.DataObject = "d_customer"
dw_1.SetTransObject(SQLCA)
dw_1.Retrieve(ll_customer_id)
```

---

## 14. PBAutoBuild

PBAutoBuild es ruta moderna para build desde VS Code cuando existe JSON de build.

Detectar:

```text
PBAutoBuild250.exe
MetaInfo
BuildPlan
SourceControl
BuildJob
Projects
ProjectType
Libraries
CodeGenerationOptions
ProjectBuildOptions
```

Siempre out-of-process. Nunca bloquear Extension Host.

---

## 15. ORCA y PBL legacy

ORCA es opcional y legacy/PBL.

Nunca en hot path:

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

Toda escritura sobre PBL requiere preflight, backup, fingerprint, compile result, rollback/log.

---

## 16. PBNI/PBX y dependencias nativas

Detectar:

```text
.pbx
.dll
PBNI
external function
native dependency
```

No prometer definition interna si vive en PBX/DLL. Hover puede mostrar dependencia externa. Rename/references deben degradar.

---

## 17. WebView2, JavaScript, JSON, HTTP

PowerBuilder moderno puede contener:

```text
EvaluateJavaScriptSync
EvaluateJavaScriptAsync
WebBrowser/WebView2 events
HttpClient
JsonParser
JSON path strings
WebAPI
WebSocket
FTP/SFTP
```

Todo símbolo referenciado desde strings dinámicos degrada confidence y puede bloquear rename seguro.

---

## 18. Semantic Snapshot

Features LSP deben consumir snapshot publicado, no recomponer análisis.

```text
SemanticSnapshot
  - uri
  - fingerprint
  - sourceOrigin
  - objectKind
  - objectName
  - ancestor
  - library
  - project
  - pass
  - readiness
  - prototypes[]
  - implementations[]
  - events[]
  - variables[]
  - symbols[]
  - dataWindowModel?
  - dependencies[]
  - diagnostics[]
  - lineage
```

---

## 19. Readiness y confidence

Readiness:

```text
structural-only
nearby-semantic-ready
project-semantic-ready
workspace-semantic-ready
```

Confidence:

```text
high    -> source real, scope/tipo resuelto, library order conocido
medium  -> ancestor parcial, DataObject literal, system catalog
low     -> dynamic call, JS string, JSON path, ORCA staging, PBL dump
blocked -> source conflict, stale staging, ambiguous duplicate, import unsafe
```

Uso:

```text
Hover       acepta high/medium/low con explicación
Definition  high/medium; low como probable
References  high/medium; low separado como probable/dynamic
Rename      solo high
PBL import  solo orca-staging + preflight OK
```

---

## 20. LSP features recomendadas

Orden recomendado:

1. Document Symbols snapshot-first.
2. Hover snapshot-first.
3. Definition con library order.
4. Completion por scope/tipo.
5. Signature Help.
6. References con evidence.
7. CodeLens.
8. Rename con confidence gates.
9. DataWindow navigation.
10. Build/health integration.

---

## 21. Corpus recomendado

Validar contra:

```text
PFC:
  - OpenSourcePFCLibraries/2025-Solution
  - OpenSourcePFCLibraries/2025-Workspace

DataWindow:
  - Appeon/PowerBuilder-Dw2Doc-Example
  - thansuoi113 DataWindow examples
  - sebkirche/PowerBuilder-DataWindow
  - tree-sitter-datawindow

PBL/legacy:
  - gmai2006/powerbuilder-pbl-dump
  - rwxce/pb-toolkit
  - Hucxy/PBDWEDIT

Build/ORCA:
  - Appeon/PowerBuilder-AutoBuild-Sales-Example
  - tuke307/lib-builder
  - zrh535/pborca
  - zhj149/PowerBuilder-ORCA

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
```

---

## 22. Errores de diseño que la IA debe evitar

```text
1. Asumir que Solution usa ws_objects.
2. Asumir que Workspace siempre tiene source completo.
3. Indexar .pb/build/_BackupFiles como source.
4. Parsear .srd como PowerScript.
5. Resolver referencias por texto.
6. Ignorar library order.
7. Ignorar sourceOrigin.
8. Mezclar ORCA staging con source real.
9. Permitir rename con dynamic strings.
10. Ejecutar ORCA en hot path.
11. Tratar PBNI/PBX como símbolos internos.
12. Cerrar specs sin actualizar documentación.
```

---

## 23. Resumen ejecutivo para Copilot

PowerBuilder 2025 debe modelarse como un ecosistema dual Workspace/Solution con objetos SR* individuales, librerías ordenadas, source origins explícitos, scopes particulares, herencia, DataWindow como sublenguaje y automatización separada entre PBAutoBuild moderno y ORCA legacy.

El plugin debe construir snapshots semánticos incrementales, servir LSP desde estados publicados y usar readiness/evidence/confidence para evitar operaciones peligrosas.
