# ULTRA AUDITORÍA SEMÁNTICA POWERBUILDER TOTAL — VSC PowerSyntax

Actúa como **arquitecto principal de semántica PowerBuilder**, **auditor senior de lenguaje**, **especialista en frameworks PowerBuilder reales** y **mantenedor del plugin VSC PowerSyntax / PowerBuilder 2025 para VS Code**.

Esta auditoría la ejecuta GitHub Copilot Agent con acceso completo al repositorio, documentación, código, tests y web.

## Objetivo maestro

Validar si el plugin entiende PowerBuilder de forma **real, profunda, oficial, defendible y útil para desarrolladores profesionales**, no solo como sintaxis superficial.

El resultado debe dejar:

1. auditado completamente el documento técnico canónico;
2. auditado completamente el sistema semántico real del plugin;
3. contrastada cualquier mínima duda con documentación oficial Appeon;
4. contrastados patrones reales con corpus oficiales/públicos como PFC, STD, Appeon Examples y fixtures locales;
5. actualizado el backlog con entradas muy detalladas, con ejemplos PowerBuilder reales;
6. actualizada toda la documentación arquitectónica afectada;
7. generada una matriz clara de cobertura semántica, gaps, riesgos, pruebas necesarias y prioridades.

No implementes features nuevas durante esta auditoría salvo correcciones mínimas documentales o ajustes triviales necesarios para registrar hallazgos.
El objetivo principal es **auditar, contrastar, documentar y crear backlog accionable**.

---

# REGLAS ABSOLUTAS

1. No trabajes de memoria.
2. No inventes reglas PowerBuilder.
3. No conviertas corpus en norma oficial.
4. No infieras reglas del lenguaje desde una implementación concreta.
5. Si existe cualquier duda mínima, aunque parezca menor, crea hallazgo y entrada de backlog.
6. Si una duda se resuelve consultando documentación oficial, documenta la fuente y decisión.
7. Si una duda no se resuelve con documentación oficial, contrástala con corpus real y márcala como `Low confidence` o `Needs official confirmation`.
8. Si un hallazgo no se corrige en esta auditoría, debe ir a `Backlog derivado`.
9. Toda entrada de backlog debe tener evidencia, riesgo, ejemplo PowerBuilder, criterio de aceptación, tests y docs afectadas.
10. No abras nuevas features visuales, webviews, agentes o tools.
11. No rompas la meta maestra del plugin:

```txt
El plugin debe descubrir e indexar muy rápido sin bloquear.
```

12. Toda propuesta semántica debe indicar si afecta hot paths:
    - hover;
    - completion;
    - definition;
    - references;
    - diagnostics;
    - semantic tokens;
    - workspace indexing.
13. Cualquier mejora semántica pesada debe proponerse como index-time/offline/cacheable, no como full scan en hot path.
14. No actualices `done-log.md` salvo que se haya cerrado trabajo real con código/tests/validación/docs.
15. No cierres la auditoría con dudas abiertas fuera del backlog.

---

# FUENTES INTERNAS OBLIGATORIAS

Lee completamente antes de concluir:

```txt
docs/powerbuilder-2025-vscode-plugin-technical-guide.md
docs/architecture.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/troubleshooting.md
docs/performance-budget.md
backlog.md
current-focus.md
done-log.md
roadmap.md
package.json
```

Lee también todo el código real relacionado con semántica:

```txt
src/**
server/**
client/**
test/**
```

Localiza explícitamente módulos de:

```txt
lexer/tokenizer
statement splitter
code masking
parser
symbol extraction
semantic model
symbol index
workspace indexer
project model
library search path
inheritance graph
scope resolver
type resolver
call resolver
overload resolver
event model
DataWindow handling
embedded SQL handling
transaction handling
diagnostics
hover
completion
definition
references
document symbols
semantic tokens
runtime self-test
health/dashboard
confidence model
serving cache
```

No basta con buscar nombres. Debes leer implementación real.

---

# FUENTES OFICIALES WEB A CONSULTAR

Consulta documentación oficial Appeon cuando exista cualquier mínima duda.

Como mínimo, revisa o usa como fuente de contraste:

```txt
Appeon PowerBuilder 2025 PowerScript Reference
Appeon PowerBuilder 2025 Users Guide
Appeon PowerBuilder 2025 Application Techniques
Appeon PowerBuilder 2025 Objects and Controls
Appeon PowerBuilder 2025 DataWindow Reference
Appeon PowerBuilder 2025 DataWindow Programmers Guide
Appeon PowerBuilder 2025 Connecting to Your Database
Appeon PowerBuilder 2025 Connection Reference
Appeon PowerBuilder 2025 ORCA Guide
Appeon PowerBuilder 2025 PowerBuilder Extension Reference
Appeon PowerBuilder 2025 PBNI Programmers Guide and Reference
Appeon PowerBuilder 2025 PBAutoBuild / Users Guide
Appeon migration/32-bit/64-bit documentation when external/PBX/longptr appears
```

Registra las URLs consultadas en una sección final.

---

# CORPUS WEB / REPOSITORIOS A CONSULTAR

Usa corpus público como validación de patrones reales, no como fuente normativa.

Consulta cuando haga falta:

```txt
OpenSourcePFCLibraries/2025-Solution
OpenSourcePFCLibraries/2025-Workspace
OpenSourcePFCLibraries organization
Appeon GitHub organization
Appeon/PowerBuilder-Example
Appeon/PowerBuilder-Sales-Example
Appeon/PowerBuilder-AutoBuild-Sales-Example
Appeon/PowerBuilder-RibbonBar-Example
Appeon/PowerBuilder-RestClient-Example
Appeon/PowerBuilder-Components-Example
STD Foundation Classes / OrderEntry
STD SourceForge packages
PowerBuilder CodeExchange if accessible
PBNI/PBX examples if accessible
ORCA utilities if accessible
tree-sitter-powerscript only as non-authoritative comparative reference
```

Clasifica siempre la fuente:

```txt
Official documentation
Official Appeon example
Public framework corpus
Community corpus
Non-authoritative parser/tooling
Local fixture
Heuristic
```

---

# JERARQUÍA DE AUTORIDAD

Usa esta jerarquía para resolver conflictos:

```txt
1. Documentación oficial Appeon PowerBuilder 2025/2025 R2.
2. Source exportado real por PowerBuilder/IDE/ORCA.
3. Corpus oficial Appeon examples.
4. Corpus público PFC.
5. Corpus público STD/OrderEntry.
6. Otros corpus públicos.
7. Heurísticas de parsers externos.
8. Suposiciones de IA, siempre Low confidence.
```

Si una regla interna contradice documentación oficial, no la corrijas automáticamente: crea hallazgo crítico y entrada de backlog.

---

# FORMATO DE TODO HALLAZGO

Cada hallazgo debe tener este formato:

```md
### <ID temporal del hallazgo> — <Título>

- Área:
- Severidad:
  - Critical
  - High
  - Medium
  - Low
  - Needs evidence
- Confianza:
  - Official-confirmed
  - Corpus-confirmed
  - Implementation-observed
  - Low-confidence
  - Unknown
- Fuente:
  - documentación oficial:
  - corpus:
  - código interno:
- Evidencia:
- Ejemplo PowerBuilder:
```powerscript
...
```
- Comportamiento esperado:
- Comportamiento actual del plugin:
- Riesgo:
- Impacto en features:
  - hover:
  - completion:
  - definition:
  - references:
  - diagnostics:
  - semantic tokens:
  - indexing:
- Riesgo de performance:
- Acción recomendada:
- Backlog requerido: sí/no
- Docs afectadas:
- Tests necesarios:
```

Si hay duda mínima, `Backlog requerido: sí`.

---

# FORMATO DE ENTRADA DE BACKLOG

Toda entrada nueva o actualizada en `backlog.md` debe tener este formato:

```md
## PB-SEMANTIC-<PRIORIDAD>-<DOMINIO>-<NÚMERO> — <Título claro>

- **Estado:** Open.
- **Prioridad:** P0/P1/P2.
- **Origen:** Ultra auditoría semántica PowerBuilder.
- **Área semántica:** <PowerScript/OOP/DataWindow/SQL/Events/etc.>
- **Confianza:** Official-confirmed / Corpus-confirmed / Low-confidence / Needs evidence.
- **Evidencia:**
  - ...
- **Fuente oficial/corpus:**
  - ...
- **Riesgo:**
  - ...
- **Objetivo:**
  - ...
- **Ejemplos PowerBuilder:**
```powerscript
...
```
- **Comportamiento esperado:**
  - ...
- **Comportamiento actual:**
  - ...
- **Notas de performance:**
  - Hot path afectado:
  - Debe ejecutarse en index-time:
  - Cache requerida:
  - Degradación por confidence:
- **Acceptance criteria:**
  - ...
- **Docs:**
  - ...
- **Tests:**
  - ...
```

No crees entradas vagas. Cada backlog item debe ser implementable.

---

# FASE 0 — Inventario inicial total

1. Lee todos los documentos internos.
2. Extrae todas las reglas semánticas declaradas en la guía técnica.
3. Extrae todas las reglas semánticas implícitas en arquitectura/mapa.
4. Localiza todos los módulos semánticos reales.
5. Localiza todos los tests relacionados.
6. Localiza corpus local disponible.
7. Localiza scripts para ejecutar tests, docs drift y performance gates.
8. Identifica qué repos externos oficiales/públicos conviene consultar.

Salida inicial:

```md
## FASE 0 — Inventario inicial

### Documentos leídos
- ...

### Reglas semánticas declaradas
- ...

### Módulos semánticos reales
- ...

### Tests existentes
- ...

### Corpus local disponible
- ...

### Repositorios externos recomendados
- ...

### Gaps obvios iniciales
- ...
```

No modifiques archivos todavía.

---

# FASE 1 — Auditoría total del documento técnico canónico

Audita completamente:

```txt
docs/powerbuilder-2025-vscode-plugin-technical-guide.md
```

Revisión obligatoria por secciones:

```txt
0. Propósito, alcance y reglas de lectura
1. Modelo mental PowerBuilder
2. OOP
3. Objetos oficiales
4. Entorno y organización lógica
5. Organización física
6. Source control, exports, encoding
7. Archivos y extensiones
8. Anatomía SR*
9. Metamodelo ClassDefinition/VariableDefinition/ScriptDefinition
10-14. PowerScript lexical/datatypes/Any/enums
15-19. Variables, scopes, pronouns, assignment
20-24. Lifecycle, functions, events, dynamic calls
25-30. Statements, expressions, NULL, exceptions, SQL
31-37. Transactions y DataWindow
38-46. Recursos, external, RPCFUNC, PBNI, ORCA, PBAutoBuild, integrations
47. Frameworks reales
48. Seguridad
49-50. Reglas críticas y errores frecuentes
51-54. Ejemplos, corpus, glosario, fuentes
```

Para cada sección responde:

```md
### Sección <n>

- Correcta:
- Ambigua:
- Incompleta:
- Potencialmente incorrecta:
- Falta fuente oficial:
- Falta ejemplo:
- Falta test/plugin implication:
- Requiere backlog:
- Cambios documentales propuestos:
```

Si una frase te genera la más mínima duda, consulta documentación oficial Appeon y registra decisión.

---

# FASE 2 — Auditoría total de architecture-implementation-map

Audita completamente:

```txt
docs/architecture-implementation-map.md
```

Objetivo: comprobar si el mapa de implementación refleja realmente el sistema semántico.

Revisa:

```txt
capas reales
rutas de código
hot paths
parser/lexer
symbol extraction
semantic model
workspace index
serving cache
confidence model
diagnostics
hover/completion/definition/references
DataWindow handling
SQL handling
tests
performance budgets
known gaps
architecture vs status vs implementation
```

Para cada área:

```md
### Área de implementation-map: <nombre>

- Lo que dice el documento:
- Código real encontrado:
- Coincide: sí/no/parcial
- Gaps:
- Riesgos:
- Hot path:
- Backlog necesario:
- Actualización documental:
```

No permitas que el architecture map declare soporte semántico que el código no valida.

---

# FASE 3 — Auditoría del sistema semántico real

Audita el código real y separa capacidades en:

```txt
Implemented
Partially implemented
Heuristic only
Documented but not implemented
Implemented but not documented
Tested
Untested
Unsafe in hot path
Needs official confirmation
```

Áreas obligatorias:

```txt
lexer
comments
strings
conditional compilation
statement splitter
parser
SR* object model
function/event extraction
prototype vs implementation
variables/scopes
types
structures
arrays
Any
enums !
NULL
pronouns This/Parent/Super/ParentWindow
global ::
ancestorclass::
inheritance graph
library search path
object assignment vs structure assignment
CREATE/DESTROY/Open lifecycle
events and user events
TriggerEvent/PostEvent/EVENT
CALL SUPER/AncestorReturnValue
overload/override
DYNAMIC
embedded SQL
dynamic SQL
transaction objects
DataWindow/DataStore/DataWindowChild
.srd/DataWindow expressions
Describe/Modify/Evaluate/SyntaxFromSQL
external functions
RPCFUNC
PBX/PBNI
ORCA/PBAutoBuild/source model
framework hooks
PFC/STD patterns
diagnostics severities
hover/completion/definition/references
semantic tokens
confidence/degradation
```

Salida por área:

```md
## FASE 3 — Área <nombre>

- Regla esperada:
- Implementación real:
- Tests:
- Cobertura:
- Gaps:
- Riesgo:
- Fuente oficial/corpus:
- Backlog:
```

---

# FASE 4 — Pasada semántica PowerScript base

Audita exhaustivamente:

```txt
comments
strings
statement continuation &
statement separation
inline after ;
conditional compilation
reserved words
labels/GOTO
datatypes
aliases
arrays
Any
enums !
NULL
operators
precedence
IF/ELSEIF/ELSE
CHOOSE CASE
FOR/NEXT
DO/LOOP
EXIT/CONTINUE
RETURN
TRY/CATCH/FINALLY
THROW/THROWS
embedded SQL lexical boundaries
```

Contrasta con PowerScript Reference oficial ante cualquier duda.

Crear backlog para cualquier gap, incluso si es Low confidence.

---

# FASE 5 — Pasada OOP, scopes, nombres y resolución

Audita exhaustivamente:

```txt
global variables
shared variables
instance variables
local variables
arguments
constants
access modifiers
shadowing
This
Parent
Super
ParentWindow
::
ancestorclass::
object.member
control.event
containment vs inheritance
ancestor/descendant
library search path
duplicate object names across libraries
global functions
object functions
system functions
prototype vs implementation
overload
override
polymorphism
dynamic dispatch
```

Casos mínimos a buscar o crear como fixture:

```powerscript
Parent.uf_save()
Super::uf_save()
w_base::uf_save()
::gs_value
This.is_value
luo_service.DYNAMIC uf_execute(ls_action)
public function long uf_find(long al_id)
public function long uf_find(string as_code)
```

Si falta soporte o tests, crear backlog.

---

# FASE 6 — Pasada events, lifecycle y framework hooks

Audita exhaustivamente:

```txt
system events
user events
mapped events
event IDs
event return values
EVENT
TriggerEvent
PostEvent
posted return value not usable
CALL SUPER
AncestorReturnValue
Open/Close/SystemError
Constructor/Destructor
CREATE
CREATE USING
DESTROY
Open window
autoinstantiated objects
PFC hooks
STD hooks
framework extension points
empty hooks
lifecycle diagnostics
```

Casos a validar contra PFC/STD:

```powerscript
event open;
CALL SUPER::open
of_postopen()
end event

PostEvent(This, "ue_refresh")

This.EVENT ue_refresh()

TriggerEvent(This, "ue_refresh")
```

No marcar hooks como unused por ausencia de llamadas textuales.

---

# FASE 7 — Pasada DataWindow total

Audita exhaustivamente:

```txt
.srd
DataWindow object vs DataWindow control
DataStore
DataWindowChild
DataObject literals
DataObject dynamic variables
SetTrans
SetTransObject
Retrieve
Update
AcceptText
ItemChanged
ItemError
buffers Primary!/Filter!/Delete!
RowsCopy/RowsMove/ShareData
Describe
Modify
Evaluate
SyntaxFromSQL
DataWindow.Table.Select
PBSELECT vs SQL
property paths
data expressions
Object.column[row]
Object.Data.Primary[row,col]
DDDW
nested reports
computed fields
filters
sorts
validation rules
default~tExpression
global functions inside DataWindow expressions
dynamic DataWindow Create
```

Regla absoluta:

```txt
.srd y DataWindow expressions no son PowerScript normal.
```

Consulta DataWindow Reference y DataWindow Programmers Guide ante cualquier duda.

Crear backlog si:
- el plugin parsea algo de DataWindow como PowerScript normal;
- falta boundary;
- falta lineage;
- falta confidence/degradation;
- falta test.

---

# FASE 8 — Pasada SQL, transactions y DBMS

Audita exhaustivamente:

```txt
embedded SQL
CONNECT/DISCONNECT/COMMIT/ROLLBACK
SELECT INTO
INSERT/UPDATE/DELETE
DECLARE/OPEN/FETCH/CLOSE cursor
DECLARE PROCEDURE/EXECUTE/FETCH/CLOSE
SELECTBLOB/UPDATEBLOB
host variables :
indicator variables
SQLCode/SQLErrText
SQLCA
custom transaction objects
Transaction descendants
SQLSA/SQLDA
dynamic SQL formats 1-4
EXECUTE IMMEDIATE
PREPARE
DESCRIBE
OPEN DYNAMIC
EXECUTE DYNAMIC
SetTrans vs SetTransObject
ODBC
DB2 via ODBC if project evidence exists
DBParm
Lock/isolation
stored procedures
RPCFUNC
```

No modificar SQL. Solo auditar y registrar gaps.

Crear backlog si:
- embedded SQL no está bien delimitado;
- host variables no se validan;
- SQL strings se tratan como PowerScript;
- transactions se mezclan con DataWindow sin confidence;
- SetTrans/SetTransObject se confunden;
- DBMS-specific assumptions no están documentadas.

---

# FASE 9 — Pasada external/native/build/source model

Audita exhaustivamente:

```txt
external functions
LIBRARY
ALIAS FOR
REF
DLL bitness
longptr
RPCFUNC vs external DLL
PBX
PBNI
PBX_GetDescription
IPB_Session
IPB_Value
IPB_Arguments
PowerBuilder Extension Reference
ORCA
OrcaScript
PBAutoBuild
PBL binary
PBD compiled artifact
Workspace
Solution
ws_objects
.pbl folder
.pblmeta
encoding ANSI/DBCS/HEXASCII/UTF8/UTF16
source export/import
round-trip risk
Library painter
PBAutoBuild JSON
```

Consulta ORCA Guide, PBNI Guide, Users Guide y PBAutoBuild docs si existe duda.

Crear backlog si el plugin asume fuente textual donde solo hay artefacto binario/compilado.

---

# FASE 10 — Pasada corpus real local y web

Ejecuta auditoría contra corpus disponible.

Mínimo si están accesibles:

```txt
PFC 2025 Solution
PFC 2025 Workspace
OrderEntry / STD
Appeon examples
local fixtures
```

Si no están localmente, usa web/GitHub para examinar estructura y patrones, pero no inventes resultados de ejecución.

Para cada corpus:

```md
## Corpus: <nombre>

- Fuente:
- Tipo:
  - official example
  - public framework
  - local fixture
- Layout:
- Workspace/Solution:
- Librerías:
- Objetos:
- Ancestors:
- DataWindows:
- SQL:
- Dynamic calls:
- Framework hooks:
- External/RPC/PBX:
- Hallazgos:
- Falsos positivos esperables:
- Gaps del plugin:
- Backlog:
```

No eleves naming conventions de PFC/STD a regla universal.

---

# FASE 11 — Pasada services/consumers del plugin

Valida que la semántica llega correctamente a consumers:

```txt
hover
completion
signature help
definition
references
document symbols
workspace symbols
semantic tokens
diagnostics
diagnostics explainability
Object Explorer
Current Object Context
Runtime self-test
health dashboard
AI tools/read-only reports
```

Para cada consumer:

```md
### Consumer: <nombre>

- Qué semántica consume:
- Fuente de datos:
- Confidence handling:
- Fallback/degradation:
- Tests:
- Gaps:
- Hot path risk:
- Backlog:
```

---

# FASE 12 — Pasada de documentación cruzada

Revisa consistencia entre:

```txt
technical guide
architecture.md
architecture-status.md
architecture-implementation-map.md
testing.md
troubleshooting.md
performance-budget.md
backlog.md
current-focus.md
roadmap.md
done-log.md
```

Buscar:

```txt
duplicidades
contradicciones
soporte declarado pero no implementado
soporte implementado pero no documentado
gaps sin backlog
backlog cerrado pero no validado
docs obsoletos
current-focus desalineado
done-log prematuro
performance budget incompleto
```

Actualizar documentos.

---

# FASE 13 — Revisión completa 1: correctness

Relee todos los hallazgos.

Eliminar o degradar:

```txt
hallazgos sin evidencia
suposiciones IA
reglas derivadas solo de corpus
claims no oficiales
duplicados
issues ya cerrados por código/tests
```

Todo lo que siga en duda mínima debe ir a backlog como `Needs evidence`.

---

# FASE 14 — Revisión completa 2: performance/hot paths

Para cada backlog propuesto, indicar:

```txt
¿Afecta hot path?
¿Debe ejecutarse en index-time?
¿Requiere cache?
¿Requiere serving cache?
¿Debe degradar por confidence?
¿Puede ser async/background?
¿Puede bloquear editor?
¿Necesita performance gate?
```

No aceptes propuestas que rompan la meta maestra.

---

# FASE 15 — Revisión completa 3: testability

Para cada hallazgo/backlog, definir tests mínimos:

```txt
unit
integration
fixture corpus
smoke
performance
docs drift
self-test
manual validation
```

Si un hallazgo no es testeable, debe reformularse.

---

# FASE 16 — Revisión completa 4: backlog quality

Revisa que cada entrada de backlog sea:

```txt
concreta
implementable
no duplicada
con prioridad correcta
con evidencia
con ejemplo
con acceptance criteria
con tests
con docs afectadas
con notas de performance
```

Si un ítem es demasiado grande, dividirlo.

---

# FASE 17 — Revisión completa 5: documentación final

Revisa que cada documento tenga responsabilidad clara:

```txt
technical guide = verdad conceptual PowerBuilder
architecture.md = arquitectura objetivo
architecture-status.md = estado real
architecture-implementation-map.md = rutas/hot paths/implementación
backlog.md = trabajo activo
done-log.md = trabajo cerrado
testing.md = suites y criterios
troubleshooting.md = síntomas/diagnóstico operativo
performance-budget.md = límites y gates
current-focus.md = foco inmediato
roadmap.md = dirección alto nivel
```

No dupliques contenido.

---

# FASE 18 — Actualización de backlog

Actualizar `backlog.md` con todos los hallazgos.

Reglas:

1. Añadir nueva sección si conviene:

```md
## Backlog derivado — Ultra auditoría semántica PowerBuilder
```

2. Crear IDs claros, por ejemplo:

```txt
PB-SEMANTIC-P0-OOP-RESOLUTION-01
PB-SEMANTIC-P0-DATAWINDOW-BOUNDARY-01
PB-SEMANTIC-P1-EVENT-LIFECYCLE-01
PB-SEMANTIC-P1-SQL-HOST-VARIABLES-01
PB-SEMANTIC-P1-PBNI-EXTERNAL-BOUNDARY-01
PB-SEMANTIC-P2-CORPUS-PFC-STD-COVERAGE-01
```

3. Si un hallazgo es solo duda mínima:

```txt
Estado: Open
Prioridad: P2 o Needs evidence
Confianza: Low-confidence / Needs official confirmation
```

4. Nada dudoso queda solo en el informe.

---

# FASE 19 — Actualización documental

Actualizar como mínimo si aplica:

```txt
docs/powerbuilder-2025-vscode-plugin-technical-guide.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/troubleshooting.md
docs/performance-budget.md
backlog.md
current-focus.md
roadmap.md
```

No actualizar `done-log.md` salvo que se haya cerrado trabajo real.

---

# FASE 20 — Validación final

Ejecutar lo disponible:

```bash
npm run build:test
npm run test:docs:drift
npm run test:performance:gate
```

Ejecutar suites relacionadas si existen:

```bash
npx mocha --ui tdd diagnostics.test.js diagnosticsExtra.test.js
npx mocha --ui tdd hover.test.js lsp-hover.test.js
npx mocha --ui tdd workspaceIndexer.test.js workspace.test.js
npx mocha --ui tdd readiness.test.js servingReadiness.test.js featureReadiness.test.js
npx mocha --ui tdd codeMasking.test.js comments_stripper.test.js statementSplitter.test.js
npx mocha --ui tdd powerbuilderParserResilienceFuzz.test.js
```

Si un comando no existe, buscar equivalente en `package.json`.

No inventes resultados.

---

# FASE 21 — Resultado final obligatorio

Entregar:

```md
# Resultado — Ultra auditoría semántica PowerBuilder

## 1. Resumen ejecutivo
- ...

## 2. Documentos internos auditados
- ...

## 3. Documentación oficial consultada
- ...

## 4. Repositorios/corpus consultados
- ...

## 5. Cobertura semántica actual
### PowerScript base
- ...
### OOP/scopes/resolution
- ...
### Events/lifecycle
- ...
### DataWindow
- ...
### SQL/transactions
- ...
### External/PBNI/ORCA/build
- ...
### Frameworks PFC/STD
- ...
### Consumers LSP
- ...

## 6. Hallazgos Critical
- ...

## 7. Hallazgos High
- ...

## 8. Hallazgos Medium
- ...

## 9. Hallazgos Low / Needs evidence
- ...

## 10. Hallazgos descartados tras revisión
- ...

## 11. Backlog creado o actualizado
- `ID` — título — prioridad — confianza

## 12. Documentación actualizada
- ...

## 13. Tests/validaciones ejecutadas
- ...

## 14. Riesgos de performance
- ...

## 15. Dudas que quedan explícitamente registradas
- ...

## 16. Siguiente foco recomendado
- ...
```

---

# RESTRICCIÓN FINAL

No cierres la auditoría sin haber hecho las cinco revisiones completas:

1. correctness;
2. performance/hot paths;
3. testability;
4. backlog quality;
5. documentación final.

Si algo genera cualquier duda mínima, por pequeña que sea, no lo dejes en notas sueltas: crea o actualiza una entrada de backlog con evidencia, ejemplo, fuente, riesgo y validación.
