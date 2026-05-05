# PowerBuilder 2025 para IA — Guía técnica canónica del lenguaje, runtime y ecosistema

## 0. Propósito, alcance y reglas de lectura

### 0.1 Objetivo del documento

Este documento explica PowerBuilder 2025 como **lenguaje, runtime, modelo de objetos y ecosistema técnico**. Su finalidad es que una IA pueda leer, razonar, revisar y proponer cambios sobre código PowerBuilder real sin reducirlo a un simple lenguaje procedural ni a una sintaxis superficial.

PowerBuilder no debe entenderse únicamente como PowerScript. Una aplicación PowerBuilder combina objetos, eventos, funciones, librerías, DataWindows, SQL embebido, recursos, configuración externa, transacciones, extensiones nativas y herramientas de build. La documentación oficial presenta PowerBuilder como un entorno para crear aplicaciones client/server, multitier e Internet, con interfaz de usuario, lógica en scripts y objetos reutilizables. 

Este documento debe servir para que una IA pueda:

```text
- identificar correctamente unidades semánticas PowerBuilder;
- distinguir PowerScript de DataWindow syntax;
- entender herencia, eventos, funciones y scopes;
- interpretar proyectos Workspace y Solution;
- entender el papel de PBL/PBD, source exportado y librerías;
- razonar sobre transacciones, SQL y DataWindow;
- detectar cuándo una inferencia es segura y cuándo debe degradarse;
- evitar refactorizaciones peligrosas por desconocimiento del ecosistema.
```

### 0.2 Qué debe aprender una IA antes de tocar código PowerBuilder

Antes de modificar o generar código, una IA debe interiorizar estas ideas:

```text
1. PowerBuilder es object-oriented y event-driven.
2. El código vive dentro de objetos, scripts, eventos y funciones.
3. Una PBL clásica no es un archivo de texto editable directo.
4. Una Solution moderna organiza librerías como carpetas .pbl con objetos individuales.
5. DataWindow es una tecnología y un sublenguaje propio, no PowerScript normal.
6. SQL embebido forma parte de PowerScript, pero tiene reglas propias.
7. El orden de librerías afecta resolución y compilación.
8. Parent no significa ancestor; Parent significa contenedor.
9. Super referencia el ancestor inmediato en descendants.
10. Dynamic calls, dynamic SQL, strings DataWindow, JSON paths y external functions reducen seguridad semántica.
```

### 0.3 Qué NO cubre este documento

Este documento no describe la arquitectura de ningún plugin, herramienta LSP o sistema de indexación. En concreto, quedan fuera:

```text
- snapshots internos;
- caches de serving;
- diseño de APIs de plugin;
- estados de backlog/specs;
- carpetas internas de implementación;
- diagnostics propios de una extensión concreta;
- runners o comandos de VS Code;
- decisiones internas de rendimiento o persistencia;
- cualquier estado Bxxx de un repositorio concreto.
```

Si una guía de arquitectura necesita aplicar este conocimiento a un plugin, esa guía debe citar este documento como base conceptual, pero no mezclar decisiones internas con reglas del lenguaje.

### 0.4 Jerarquía de fuentes

La jerarquía recomendada para razonar sobre PowerBuilder es:

```text
1. Documentación oficial Appeon PowerBuilder 2025.
2. Source exportado por PowerBuilder/ORCA/IDE.
3. Corpus público real para validar patrones.
4. Heurísticas de herramientas externas.
5. Suposiciones de una IA, siempre marcadas como baja confianza.
```

La documentación oficial cubre el entorno, objetos, PowerScript, DataWindow, base de datos, ORCA, PBNI/extensiones y build/deploy. 

### 0.5 Regla maestra

```text
No inferir reglas del lenguaje desde una implementación concreta.
```

Una implementación puede tener convenciones útiles, pero las reglas canónicas deben venir de PowerBuilder y su documentación. El corpus real ayuda a detectar patrones, edge cases y legacy, pero no convierte automáticamente una práctica observada en regla universal.

---

## 1. Modelo mental correcto de PowerBuilder

### 1.1 PowerBuilder no es solo PowerScript

PowerScript es el lenguaje de scripting de PowerBuilder, pero una aplicación real se compone de muchas piezas:

```text
- Application object;
- Windows;
- Menus;
- User Objects visuales y no visuales;
- DataWindows;
- DataStores;
- Structures;
- Global Functions;
- Queries;
- Pipelines;
- Projects;
- PBL/PBD;
- Resources;
- INI/configuración;
- SQL embebido;
- external functions;
- PBX/PBNI;
- ORCA/OrcaScript;
- PBAutoBuild.
```

La documentación oficial enumera Application, Window, DataWindow, Menu, Global Function, Query, Structure, User Object, Pipeline y Project como bloques básicos de un target PowerScript. 

### 1.2 PowerBuilder como entorno, lenguaje, runtime y ecosistema

PowerBuilder es simultáneamente:

```text
- un entorno de desarrollo con System Tree, painters, Library painter y Source editor;
- un lenguaje de scripting, PowerScript;
- un runtime con objetos system y clases visuales/no visuales;
- una tecnología de acceso y presentación de datos mediante DataWindow;
- un sistema de librerías PBL/PBD;
- un ecosistema de build y automatización con ORCA, OrcaScript y PBAutoBuild.
```

El entorno oficial trabaja con workspaces/solutions, targets/projects, System Tree, painters, Output window y Library painter. 

### 1.3 Aplicaciones event-driven

PowerBuilder es fundamentalmente **event-driven**. Las acciones del usuario o del sistema disparan eventos; cada evento puede tener un script asociado que ejecuta lógica de negocio, validación, navegación, acceso a datos o llamadas a otros eventos y funciones.

Ejemplos típicos:

```text
- Clicked de un CommandButton;
- Modified de un control de texto;
- Open de una Window;
- Open de Application;
- Close de Application;
- SystemError de Application;
- ItemChanged de DataWindow;
- eventos definidos por usuario.
```

La documentación oficial describe que el usuario controla lo que sucede mediante acciones que disparan eventos, y que los scripts especifican el procesamiento que debe ejecutarse cuando se disparan. 

### 1.4 Programación orientada a objetos en PowerBuilder

PowerBuilder soporta programación orientada a objetos mediante objetos visuales y no visuales. Los conceptos OOP se expresan con terminología PowerBuilder:

```text
Clase       → objeto PowerBuilder, como window, menu, user object o control.
Propiedad   → object variable o instance variable.
Método      → event o function.
Instancia   → objeto en memoria durante ejecución.
Ancestor    → objeto base del que hereda otro.
Descendant  → objeto derivado de un ancestor.
```

La documentación oficial explica que PowerBuilder soporta inheritance, encapsulation y polymorphism en objetos visuales y no visuales. 

### 1.5 Relación entre UI, lógica, datos, DataWindow, SQL y librerías

En PowerBuilder clásico es común encontrar lógica distribuida entre:

```text
- scripts de eventos de ventanas;
- scripts de controles;
- funciones de objetos visuales;
- nonvisual user objects de servicio;
- global functions;
- DataWindow objects;
- embedded SQL;
- stored procedures;
- transaction objects;
- recursos externos e INI.
```

PowerBuilder permite poner lógica en la interfaz o separarla en módulos reutilizables llamados custom class user objects. 

### 1.6 Diferencia entre source, compiled form y runtime

Un objeto PowerBuilder puede existir en varias formas:

```text
Source form       → representación sintáctica con scripts.
Compiled form     → forma compilada usada por PowerBuilder.
Runtime instance  → instancia en memoria durante ejecución.
Exported source   → texto exportado por IDE/Library painter/ORCA.
```

La documentación de librerías explica que un objeto se guarda en source form y object/compiled form; en Workspace la librería es `.pbl`, mientras que en Solution la librería es una carpeta `.pbl`. 

---

## 2. Conceptos OOP en PowerBuilder

### 2.1 Clase, definición de objeto, instancia y referencia

En PowerBuilder conviene distinguir:

```text
Object/class definition
  Definición guardada en una librería. Contiene variables, propiedades, eventos, funciones y código fuente.

Object instance
  Realización en memoria de una definición durante ejecución.

Object reference
  Variable que apunta a una instancia. Asignar una referencia no copia el objeto completo.
```

El metamodelo `ClassDefinition` permite inspeccionar la definición de clase de una instancia o de una clase en una librería, pero no proporciona los valores de estado de una instancia concreta. 

### 2.2 Clases PowerBuilder frente a clases en otros lenguajes

Una clase PowerBuilder no siempre se parece a una clase textual tradicional. Muchas clases se crean o modifican mediante painters y luego se almacenan en librerías. Al exportarlas, aparece una sintaxis textual con bloques como `global type`, `forward prototypes`, events, functions y `on create/destroy`.

El Library painter permite abrir objetos en painters, ver/maintain objetos en PBL, exportar/importar y compilar objetos. 

### 2.3 Properties, variables, events y functions

PowerBuilder usa objects que contienen:

```text
- properties;
- object variables;
- instance variables;
- shared variables;
- events;
- functions;
- controls o nested objects;
- scripts.
```

El metamodelo oficial `VariableDefinition` describe nombre, tipo, scope, access, array/scalar, initial value y passing mode; `ScriptDefinition` describe functions/events, return type, arguments, locals, source, access, event IDs, external functions y RPC. 

### 2.4 Inheritance

Inheritance permite crear descendants a partir de ancestors. Un descendant puede reutilizar propiedades, datos, controles y código del ancestor. En PowerBuilder esto es muy habitual en:

```text
- windows descendientes;
- user objects visuales;
- nonvisual user objects;
- frameworks como PFC/STD;
- controles especializados;
- service objects.
```

La documentación oficial describe que PowerBuilder facilita crear descendant objects mediante painters heredando de un ancestor específico. 

### 2.5 Encapsulation

Encapsulation consiste en proteger datos internos del objeto y exponer acceso controlado mediante functions/events.

En PowerBuilder se logra con:

```text
- instance variables public/protected/private;
- object functions como API del objeto;
- control de scope;
- no exponer directamente estado interno si no es necesario.
```

La documentación oficial indica que se puede restringir acceso declarando instance variables como private o protected y escribiendo object functions para acceso selectivo. 

### 2.6 Polymorphism

Polymorphism significa que functions con el mismo nombre pueden comportarse distinto según el objeto real referenciado. Esto es especialmente importante cuando una variable está tipada como ancestor, pero en runtime contiene una instancia descendant.

PowerBuilder documenta que object functions con static lookup son strongly typed en compilación, pero polimórficas en runtime; si una clase descendant overridea una función, se ejecuta la versión descendant. 

### 2.7 Descendant, ancestor y subclass

Terminología práctica:

```text
Ancestor   → clase base.
Descendant → clase derivada.
Subclass   → término OOP equivalente a descendant.
```

Una IA debe mantener siempre la cadena de ancestors porque afecta a resolución de funciones, eventos, propiedades, controles heredados, override/extend y llamadas `Super`/`ancestorclass::`.

### 2.8 Visual objects y nonvisual objects

PowerBuilder distingue:

```text
Visual objects
  Windows, controls, visual user objects, menus, DataWindow controls, etc.

Nonvisual objects
  Custom class user objects, service objects, Transaction descendants, Error/Message descendants, etc.
```

La documentación recomienda usar custom class user objects/nonvisual objects para aprovechar plenamente las capacidades OOP. 

### 2.9 Service objects y reusable objects

PowerBuilder favorece el patrón de objetos reutilizables y service objects. Un ancestor service object puede definir comportamiento común y descendants pueden especializarlo.

Ejemplos habituales:

```text
- servicio de transacción;
- servicio de errores;
- servicio de preferencias;
- servicio DataWindow;
- servicio de logging;
- servicio de seguridad;
- servicio de resize/layout;
- servicio de plataforma.
```

La documentación oficial incluye ejemplos conceptuales de ancestor service object y descendants especializados. 

### 2.10 Delegation y aggregate relationships

PowerBuilder también permite delegation: un objeto delega parte de su procesamiento en otro objeto. Esto se usa mucho en frameworks para separar responsabilidades.

Un aggregate relationship aparece cuando un owner object mantiene o usa un service object diseñado para ese tipo de objeto. La documentación oficial usa ejemplos de servicios asociados a DataWindow objects. 

### 2.11 Limitaciones prácticas del modelo OOP

Aunque PowerBuilder soporta OOP, una IA debe recordar:

```text
- mucha lógica puede estar en eventos visuales;
- algunos patrones legacy mezclan UI, SQL y negocio;
- dynamic lookup permite llamadas que no existen en compilación;
- external functions/PBX no tienen implementación PowerScript interna;
- DataWindow contiene lógica en otro sublenguaje;
- frameworks pueden añadir capas profundas de ancestors.
```

---

## 3. Objetos oficiales de PowerBuilder

### 3.1 Application object

El Application object es el punto de entrada lógico de una aplicación PowerBuilder. Define comportamiento de aplicación, como procesamiento al iniciar y finalizar, y eventos globales.

Eventos esenciales:

```text
Open
Close
SystemError
```

`Open` inicia la actividad de la aplicación; `Close` suele limpiar recursos, cerrar base de datos o escribir preferencias; `SystemError` se dispara ante errores graves no capturados por exception handling. 

### 3.2 Window object

Una Window es la interfaz principal entre usuario y aplicación. Contiene:

```text
- propiedades visuales;
- eventos;
- controles;
- scripts;
- functions;
- variables;
- user events;
- DataWindow controls u otros objetos visuales.
```

Una ventana puede mostrar información, pedir datos, responder a teclado/ratón y abrir otras ventanas. 

### 3.3 DataWindow object

Un DataWindow object define una fuente de datos y una presentación. Puede recuperar, presentar y manipular datos de una base de datos u otra fuente. No debe confundirse con el DataWindow control que lo contiene.

PowerBuilder DataWindow technology se implementa en dos partes: el DataWindow object y el DataWindow control/component que actúa como contenedor. 

### 3.4 Menu object

Un Menu object contiene comandos u opciones para una ventana activa. Sus menu items tienen nombres usados desde scripts.

PowerBuilder genera nombres por defecto para menu items, permite bloquearlos y los scripts referencian los menu items por su nombre PowerBuilder, no necesariamente por el texto visible. 

### 3.5 User object

Un User object es un módulo reutilizable de procesamiento o conjunto de controles. Puede ser visual o no visual.

#### 3.5.1 Visual User Object

Un visual user object encapsula controles y comportamiento visual reutilizable.

#### 3.5.2 Standard Class User Object

Un standard class user object hereda de un objeto system como `Transaction`, `Message` o `Error`.

#### 3.5.3 Custom Class / Nonvisual User Object

Un custom class user object hereda normalmente de `NonVisualObject` y encapsula datos y código sin UI.

La documentación oficial destaca que los custom class user objects son importantes para aprovechar bien las capacidades OOP de PowerBuilder. 

#### 3.5.4 External / Native User Object

Puede venir de una extensión PBX/PBNI y aparecer en PowerBuilder como user object importado.

#### 3.5.5 Autoinstantiated User Object

Algunos user objects se instancian automáticamente al declararlos. Esto afecta a `CREATE`, assignment y lifecycle.

### 3.6 Global Function

Una global function realiza procesamiento general accesible desde scripts. Debe distinguirse de una object function porque no pertenece a una instancia concreta y no participa igual en polymorphism.

PowerScript distingue system functions, global functions, object functions, user-defined functions, external functions y RPC. 

### 3.7 Structure

Una Structure agrupa variables relacionadas bajo un nombre. Las structures se copian por valor, a diferencia de los objetos, que se manejan por referencia.

La documentación oficial lista Structure como objeto PowerBuilder y diferencia assignment de structures frente a objects. 

### 3.8 Query

Una Query representa una sentencia SQL usada repetidamente como data source, especialmente en relación con DataWindow objects. 

### 3.9 Pipeline

Un Pipeline reproduce datos dentro de una base de datos o entre bases de datos. 

### 3.10 Project

Un Project empaqueta la aplicación para distribución y puede participar en build/deploy. 

### 3.11 Objetos system/runtime modernos

PowerBuilder 2025 incluye muchos objetos system/runtime modernos, como HTTP/REST/JSON/OAuth, PDF, DotNet, WebBrowser, compression, crypto y otros. Estos objetos forman parte del sistema de tipos PowerBuilder y deben tratarse como datatypes/objetos del runtime. 

---

## 4. Entorno de desarrollo y organización lógica

### 4.1 Workspace

Un Workspace agrupa uno o más targets. En PowerBuilder clásico, el desarrollador trabaja con targets dentro de un workspace y puede construir/desplegar múltiples targets.

La documentación oficial indica que en PowerBuilder se trabaja con uno o más targets en un workspace. 

### 4.2 Solution

PowerBuilder 2025 introduce el modelo Solution, donde el proyecto se organiza de manera más textual y moderna. En Solution, las librerías se guardan como carpetas `.pbl`, y cada objeto se guarda como archivo individual en texto plano. 

### 4.3 Target

Un Target representa una aplicación o componente construible. Un target puede ser una aplicación client/server o multitier que usa PowerScript. 

### 4.4 Project

Un Project configura empaquetado, build o despliegue. En PBAutoBuild puede exportarse a JSON y construirse por línea de comandos. 

### 4.5 System Tree

El System Tree es el hub de desarrollo. Permite abrir, ejecutar, depurar y construir targets, además de navegar objetos. 

### 4.6 Painters

PowerBuilder proporciona painters para construir cada tipo de objeto. Por ejemplo, el Window painter permite definir propiedades de una ventana y añadir controles. 

### 4.7 Source editor

El Source editor permite ver/editar representación textual de objetos, pero el formato exportado puede ser reescrito por PowerBuilder al guardar desde painters. La documentación ORCA advierte que la sintaxis completa de object source no está formalmente documentada. 

### 4.8 Library painter

El Library painter permite ver y mantener contenidos de una PBL: borrar, mover, compilar, exportar, importar, usar source control y crear PBD/DLL. 

### 4.9 Output window, builds y errores

La Output window muestra salida de migraciones, builds, deploy, ejecución de proyectos, guardado de objetos y búsquedas. 

### 4.10 Library search path

Targets/projects usan una lista de librerías. El orden de librerías puede afectar resolución de objetos, funciones globales, ancestors, referencias, compilación y ejecución.

La documentación oficial indica que los targets/projects pueden usar múltiples librerías y que el library search path puede cambiarse durante el desarrollo. 

### 4.11 Diferencia entre desarrollo clásico y Solution moderna

Resumen:

```text
Workspace clásico:
  - librería como archivo .pbl;
  - objetos compilados y source dentro de PBL;
  - source control puede crear ws_objects;
  - puede soportar machine code o Pcode.

Solution moderna:
  - librería como carpeta .pbl;
  - cada objeto como archivo individual;
  - texto plano como source;
  - soporta Pcode.
```

La documentación de librerías establece explícitamente esta diferencia. 

---

## 5. Organización física de proyectos PowerBuilder

### 5.1 Workspace clásico

Estructura habitual:

```text
workspace.pbw
app.pbt
library1.pbl
library2.pbl
shared.pbd
resources.pbr
objects.pbg
ws_objects/
```

En Workspace, la librería principal es una PBL binaria. Los objetos tienen source y compiled form dentro de esa PBL. 

### 5.2 Solution moderna

Estructura habitual:

```text
solution.pbsln
project.pbproj
app.pbl/
  object1.srw
  object2.sru
  datawindow.srd
shared.pbl/
  service.sru
```

En Solution, cada objeto se guarda como archivo individual en texto plano dentro de una carpeta `.pbl`. 

### 5.3 PBL como archivo binario en Workspace

En Workspace, `.pbl` es un archivo binario consolidado que almacena múltiples objetos. Contiene source form y compiled form; el compiled form no es legible por humanos. 

### 5.4 PBL como carpeta en Solution

En Solution, `.pbl` es una carpeta. Cada objeto se guarda en archivo propio. Esta diferencia es crítica para cualquier IA o herramienta que lea proyectos PowerBuilder. 

### 5.5 PBD como librería dinámica/artefacto compilado

Una PBD es un artefacto compilado/dynamic library. No debe tratarse como source editable. ORCA/OrcaScript/PBAutoBuild pueden crear PBDs como parte del build. 

### 5.6 Source form y object/compiled form

PowerBuilder guarda source form y object form. Al guardar un objeto, PowerBuilder compila automáticamente. En Workspace, esa información queda en PBL; en Solution, source es texto plano por objeto. 

### 5.7 Machine code, Pcode y diferencias Workspace/Solution

Según la documentación de librerías, Workspace puede soportar machine code o Pcode; Solution soporta Pcode. 

### 5.8 Library search path y resolución por orden de librerías

Application targets/projects pueden usar muchas librerías. El orden del library search path es parte del significado práctico del proyecto. Una IA no debe resolver objetos duplicados solo por nombre sin considerar librería y target activo. 

### 5.9 Proyectos mixtos, legacy y parcialmente migrados

En proyectos reales pueden coexistir:

```text
- Workspace clásico;
- Solution moderna;
- PBL binarias;
- PBD compiladas;
- ws_objects;
- exports manuales;
- ORCA staging;
- recursos;
- dumps legacy;
- build outputs.
```

La IA debe clasificar cada archivo por su naturaleza técnica antes de asumir autoridad semántica.

---

## 6. Source control, exports y codificación

### 6.1 Source control nativo con Git/SVN

PowerBuilder permite añadir Workspace/Solution a Git desde el IDE. En Workspace crea `ws_objects`; en Solution no crea `ws_objects`. 

### 6.2 SCC API legacy

Las operaciones SCC API se aplican a objetos contenidos en workspace o target PBLs, no al PBW/PBL como source directo; tampoco se habilitan para target PBD files ni objetos dentro de PBD. 

### 6.3 `ws_objects`

`ws_objects` contiene archivos fuente de objetos PowerBuilder para source control en Workspace clásico:

```text
.srw
.srm
.sru
.srd
...
```

PowerBuilder indica que `ws_objects` debe añadirse al source control para gestionar source code a nivel de objeto. 

### 6.4 Diferencia source control Workspace vs Solution

```text
Workspace:
  crea ws_objects.

Solution:
  no crea ws_objects porque el source ya vive como archivos individuales bajo carpetas .pbl.
```

Esta diferencia está documentada explícitamente al añadir workspace/solution a Git. 

### 6.5 Encoding de `ws_objects`

Para Workspace, PowerBuilder permite especificar encoding para source files en `ws_objects`:

```text
ANSI/DBCS
HEXASCII
UTF8
```

Una IA o herramienta no debe asumir UTF-8 por defecto en proyectos legacy. 

### 6.6 Unicode e internal encoding

PowerBuilder soporta Unicode y usa UTF-16LE internamente. Al manipular ficheros externos o convertir blobs/strings, puede usarse ANSI o esquemas Unicode. 

### 6.7 `FileEncoding`

`FileEncoding` comprueba la codificación de un archivo y puede devolver valores como `EncodingANSI!`, `EncodingUTF8!`, `EncodingUTF16LE!` o `EncodingUTF16BE!`. 

### 6.8 Riesgos de round-trip entre IDE, exports y editores externos

PowerBuilder puede reescribir source al guardar desde painters. ORCA indica que la sintaxis de object source no está formalmente documentada. Por tanto, editar exports manualmente exige prudencia. 

### 6.9 Qué significa “source real” en PowerBuilder

El source real depende del modo:

```text
Solution:
  archivos SR* dentro de carpetas .pbl.

Workspace bajo source control:
  ws_objects.

Workspace PBL-only:
  PBL binaria como autoridad IDE, con exports como representación derivada.
```

---

## 7. Archivos y extensiones principales

### 7.1 Objetos PowerBuilder exportados

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
```

Estos tipos corresponden a los objetos PowerBuilder oficiales y a los tipos ORCA importables/exportables. 

### 7.2 Contenedores, targets y soluciones

```text
.pbl     PowerBuilder Library; binaria en Workspace, carpeta en Solution.
.pbd     Dynamic library compilada.
.pbw     Workspace.
.pbt     Target.
.pbsln   Solution.
.pbproj  Project.
.pblmeta Metadata de librería en Solution.
```

La documentación de librerías distingue `.pbl` archivo en Workspace y carpeta `.pbl` en Solution. 

### 7.3 Source control, recursos y configuración

```text
.pbg   Inventario/lista de objetos en contextos source-control legacy.
.pbr   Resource list usada en build.
.ini   Configuración runtime.
.json  PBAutoBuild/configuración/integraciones.
.xml   Configuración/Ribbon/etc.
.sql   Scripts SQL externos.
.psr   Report/DataWindow saved output.
```

PBAutoBuild y OrcaScript pueden usar PBR durante build/deploy.

### 7.4 Dependencias nativas y extensiones

```text
.dll  External/native dependency.
.pbx  PowerBuilder extension.
.pbd  Wrapper/dynamic library usada en deployment o library search path.
```

PBX es una shared library C++ usada como extensión PowerBuilder; al importarla, sus clases aparecen como user objects en PowerBuilder. 

---

## 8. Anatomía de objetos exportados SR*

### 8.1 Cabeceras `$PBExportHeader$` y `$PBExportComments$`

Un source exportado puede comenzar con:

```powerscript
$PBExportHeader$w_about.srw
$PBExportComments$Tell us about the application
```

ORCA ignora esas cabeceras y usa argumentos específicos para entry name y comments. 

### 8.2 Advertencia oficial: source syntax no documentada formalmente

La guía ORCA afirma que la sintaxis del object source code no está documentada y que se aprende exportando objetos y estudiando su source. Esta advertencia es clave para evitar que una IA invente reglas absolutas. 

### 8.3 `forward ... end forward`

Bloque de declaraciones anticipadas. Puede contener:

```powerscript
forward
global type w_main from window
end type
type cb_ok from commandbutton within w_main
end type
end forward
```

### 8.4 `global type ... from ...`

Define el tipo principal y su ancestor:

```powerscript
global type n_customer_service from nonvisualobject
end type
```

### 8.5 Global object variable

En objetos exportados puede aparecer una instancia global del tipo:

```powerscript
global n_customer_service n_customer_service
```

### 8.6 Shared variables

Variables compartidas por todas las instancias del objeto. Oficialmente, shared variables pertenecen a la definición del objeto, retienen valor entre aperturas y son privadas. 

### 8.7 Instance/type variables

Variables asociadas a una instancia del objeto. Pueden tener access modifiers.

### 8.8 Forward prototypes

Declaran funciones antes de sus implementaciones:

```powerscript
forward prototypes
public function long uf_load(long al_id)
end prototypes
```

### 8.9 Function implementations

Implementación real:

```powerscript
public function long uf_load(long al_id);
    return 1
end function
```

### 8.10 Event implementations

Scripts asociados a eventos:

```powerscript
event clicked;
    MessageBox("Info", "Clicked")
end event
```

### 8.11 `on object.create`

Script físico de creación del objeto exportado:

```powerscript
on w_main.create
    call super::create
end on
```

### 8.12 `on object.destroy`

Script físico de destrucción:

```powerscript
on w_main.destroy
    call super::destroy
end on
```

### 8.13 Nested types y controles `within`

Controles o tipos anidados se declaran con `within`:

```powerscript
type cb_ok from commandbutton within w_main
end type
```

Esto representa containment visual/lógico, no inheritance.

### 8.14 Diferencias típicas entre SR*

```text
.sra → application-level scripts.
.srw → window, controls, window scripts.
.sru → user object visual/nonvisual.
.srm → menu y menu items.
.srs → structure.
.srf → global function.
.srd → DataWindow syntax, no PowerScript normal.
```

### 8.15 Qué puede cambiar el IDE al reexportar

El IDE puede reescribir source al guardar gráficamente objetos desde painters. Por eso, una IA debe evitar formatear o reordenar source exportado sin comprender el round-trip.

---

## 9. Metamodelo oficial de clases y reflection runtime

### 9.1 `ClassDefinition`

`ClassDefinition` proporciona información de una clase PowerBuilder:

```text
- nombre de clase;
- librería de carga;
- ancestor;
- parent/container;
- autoinstantiate;
- system/user-defined;
- visual/nonvisual;
- children/nested classes;
- variables;
- scripts.
```

La documentación indica que `ClassDefinition` es read-only y no permite modificar la definición. 

### 9.2 `VariableDefinition`

Describe variables, propiedades o argumentos:

```text
- name;
- type;
- scalar/array;
- initial value;
- constant;
- read/write access;
- scope;
- passing convention.
```

`VariableDefinition` expone scopes como global, shared, instance, argument y local. 

### 9.3 `ScriptDefinition`

Describe scripts asociados a una clase:

```text
- function o event;
- access;
- return type;
- arguments;
- local variables;
- source code;
- locally defined/scripted;
- external function;
- RPC;
- event ID.
```

`ScriptDefinition` también guarda información de `LIBRARY`, `ALIAS FOR`, external functions y RPC functions. 

### 9.4 `TypeDefinition`

Base conceptual para información de datatypes. Una IA debe entender que PowerBuilder puede inspeccionar tipos y clases mediante objetos runtime.

### 9.5 `EnumerationDefinition`

Describe enumerated datatypes, sus valores y metadatos. Es relevante para entender valores terminados en `!` y system enums. 

### 9.6 `FindClassDefinition`

Permite obtener definición de una clase en librería sin instanciarla. 

### 9.7 `FindFunctionDefinition`

Permite obtener `ScriptDefinition` para global functions. 

### 9.8 `FindTypeDefinition`

Permite razonar sobre definición de tipos en runtime, según capacidades del metamodelo.

### 9.9 Ancestor, parent/container y children

Una clase puede tener:

```text
Ancestor → herencia.
Parent   → contenedor.
Children → nested classes/controls.
```

Una IA no debe mezclar parent/container con ancestor.

### 9.10 Variables, scripts, access, event IDs y external declarations

El metamodelo oficial representa estos datos mediante `VariableDefinition` y `ScriptDefinition`. 

### 9.11 Limitaciones del metamodelo

`ClassDefinition` describe la definición, no el estado concreto de una instancia. Para valores de variables de instancia en runtime, hay que acceder a la instancia. 

---

## 10. PowerScript: fundamentos léxicos y sintácticos

### 10.1 Comments

PowerScript soporta comentarios como parte de Language Basics. Una IA debe preservar comentarios importantes, especialmente en código legacy donde pueden documentar reglas de negocio o cambios históricos. 

### 10.2 Identifier names

Los nombres de identificadores siguen reglas PowerScript. Hay que tener cuidado con configuraciones que permiten dashes en identifiers, porque pueden afectar a la interpretación de operadores como `-`, `--` y `-=`.

### 10.3 Reserved words

Reserved words forman parte de PowerScript Language Basics y no deben tratarse como nombres libres salvo contextos donde PowerBuilder lo permita explícitamente. 

### 10.4 Labels

Labels existen como parte de Language Basics y se relacionan especialmente con `GOTO`. Una IA debe reconocerlos aunque las convenciones modernas desaconsejen su uso.

### 10.5 Special ASCII characters

PowerScript documenta special ASCII characters como parte de Language Basics. Esto afecta a strings, escapes y lectura exacta del código. 

### 10.6 Statement continuation

PowerScript permite continuation de statements. Una IA debe reconstruir statements lógicos sin perder rangos ni modificar spacing innecesariamente.

### 10.7 Statement separation

Statement separation forma parte de Language Basics. Una IA debe distinguir fin de statement, continuación y bloques.

### 10.8 Whitespace

Whitespace puede ser significativo en casos como operadores con guiones si los identifiers permiten dashes. Por eso, no debe normalizarse agresivamente.

### 10.9 Case sensitivity práctica

PowerBuilder suele tratar muchos nombres de forma case-insensitive en práctica, pero el source puede conservar casing convencional. Una IA debe preservar casing original salvo razón explícita.

### 10.10 Comentarios históricos y código inactivo

En proyectos legacy, comentarios pueden contener código antiguo, pseudocódigo, condicionales históricos o anotaciones de migración. No debe parsearse automáticamente como código activo.

### 10.11 Conditional compilation

Conditional compilation forma parte de Language Basics y debe tratarse como preprocesador, no como comentario normal. 

## 11. Conditional compilation

La compilación condicional en PowerBuilder permite incluir o excluir bloques de PowerScript antes de que el código llegue al compilador. Debe tratarse como una fase de preprocesamiento real, no como simples comentarios ni como directivas decorativas.

Estado actual del producto: el plugin mantiene un gate explícito de evidencia para estas directivas. Mientras no aparezca corpus activo defendible en proyectos reales, sólo se admite detección read-only de marcadores fuera de comentarios; no hay soporte productivo de parser, semántica ni serving condicionado por preprocesador.

Para una IA, esto significa que un bloque puede estar presente en el archivo fuente pero no formar parte del código compilado bajo ciertas condiciones. Cualquier análisis de referencias, variables no usadas, llamadas, control flow o errores debe considerar que una directiva condicional puede cambiar el conjunto efectivo de statements.

### 11.1 `#IF DEFINED`

La forma principal es:

```powerscript
#IF DEFINED DEBUG THEN
    MessageBox("Debug", "Debug mode enabled")
#END IF
```

`#IF DEFINED` comprueba si un símbolo predefinido existe. Si existe, el bloque se conserva para compilación; si no existe, el preprocesador lo sustituye o lo elimina según la semántica de PowerBuilder.

Una IA debe reconocer:

```text
- inicio del bloque condicional;
- símbolo evaluado;
- negación opcional;
- condiciones compuestas;
- bloque activo/inactivo según configuración;
- cierre obligatorio con #END IF.
```

### 11.2 `#ELSEIF`

`#ELSEIF` permite evaluar una segunda condición si la primera no se cumple:

```powerscript
#IF DEFINED DEBUG THEN
    uf_log("debug")
#ELSEIF DEFINED PBNATIVE THEN
    uf_log("native")
#END IF
```

Debe tratarse como una rama alternativa del mismo bloque de preprocesador.

### 11.3 `#ELSE`

`#ELSE` define la rama por defecto:

```powerscript
#IF DEFINED DEBUG THEN
    ib_debug = TRUE
#ELSE
    ib_debug = FALSE
#END IF
```

Una IA debe evitar marcar como duplicado o contradictorio código que aparece en ramas mutuamente excluyentes.

### 11.4 `#END IF`

`#END IF` cierra el bloque condicional. Un parser tolerante debe soportar código incompleto, pero para análisis semántico completo el bloque debe estar balanceado.

Ejemplo:

```powerscript
#IF DEFINED DEBUG THEN
    uf_trace("enter")
#END IF
```

### 11.5 Símbolos predefinidos: `PBNATIVE`, `DEBUG`

PowerBuilder proporciona símbolos predefinidos como:

```text
PBNATIVE
DEBUG
```

Uso típico:

```powerscript
#IF DEFINED DEBUG THEN
    MessageBox("Trace", "Variable value: " + ls_value)
#END IF
```

Una IA no debe inventar símbolos de compilación condicional personalizados como si fueran oficialmente soportados si no hay evidencia clara del proyecto o documentación.

### 11.6 `AND`, `OR`, `NOT`

Las condiciones pueden combinar símbolos con operadores lógicos:

```powerscript
#IF DEFINED DEBUG AND DEFINED PBNATIVE THEN
    uf_trace("native debug")
#END IF
```

También puede usarse negación:

```powerscript
#IF NOT DEFINED DEBUG THEN
    ib_trace = FALSE
#END IF
```

Una IA debe distinguir estos operadores de operadores PowerScript normales porque aparecen en una directiva de preprocesador, no dentro de un statement ejecutable.

### 11.7 Interacción con continuación de línea

Las directivas de compilación condicional tienen restricciones diferentes a las de PowerScript normal. Una IA no debe aplicar automáticamente reglas de continuation con `&` dentro de la propia directiva si el lenguaje no lo permite en ese contexto.

Correcto:

```powerscript
#IF DEFINED DEBUG THEN
    ls_text = "debug " + &
              "enabled"
#END IF
```

Potencialmente problemático:

```powerscript
#IF DEFINED DEBUG &
    AND DEFINED PBNATIVE THEN
    uf_trace("debug native")
#END IF
```

### 11.8 Limitaciones: no DataWindow syntax, structures ni menus

La compilación condicional no debe asumirse universalmente válida en todos los tipos de objeto o sublenguajes. En particular, una IA debe ser especialmente conservadora en:

```text
- DataWindow syntax;
- structure objects;
- menu objects;
- source exportado donde el símbolo aparece en comentarios históricos.
```

### 11.9 Cómo debe interpretar esto una IA

Reglas prácticas:

```text
1. Reconocer directivas #IF/#ELSEIF/#ELSE/#END IF como preprocesador.
2. No tratar ramas alternativas como código simultáneamente activo sin advertirlo.
3. No eliminar variables o funciones usadas solo en ramas condicionales sin revisar configuración.
4. No convertir directivas antiguas comentadas en gramática activa.
5. Marcar baja confianza si no se conoce el símbolo o el contexto de build.
6. No aplicar reglas de DataWindow a conditional compilation de PowerScript ni viceversa.
```

---

## 12. Datatypes PowerScript

PowerScript tiene datatypes estándar, system object datatypes, user-defined object datatypes, structures, arrays, enumerated datatypes y el datatype especial `Any`. Comprender los tipos es esencial para resolver llamadas, assignment, overloads, DataWindow binding, SQL host variables y external functions.

### 12.1 Standard datatypes

Los datatypes estándar principales son:

```text
Blob
Boolean
Byte
Char / Character
Date
DateTime
Decimal / Dec
Double
Integer / Int
Long
LongLong
Longptr
Real
String
Time
UnsignedInteger / UInt
UnsignedLong / ULong
```

Uso típico:

```powerscript
integer li_count
long ll_customerId
string ls_name
boolean lb_valid
date ld_today
datetime ldt_created
decimal ldc_amount
blob lblb_payload
```

Una IA debe respetar aliases (`int`/`integer`, `dec`/`decimal`, `uint`/`unsignedinteger`, etc.) y no asumir que todos los proyectos usan una única forma canónica.

### 12.2 System object datatypes

PowerBuilder define objetos del sistema como datatypes. Ejemplos:

```text
Application
Window
Menu
CommandButton
DataWindow
DataStore
DataWindowChild
Transaction
Message
Error
Exception
HTTPClient
RESTClient
JSONParser
JSONGenerator
DotNetObject
WebBrowser
```

Esto permite declarar variables de objetos system:

```powerscript
window lw_parent
transaction ltr_conn
datawindow ldw_control
datastore lds_data
httpclient lhc_client
```

Una IA debe tratar estos tipos como parte del sistema de tipos PowerBuilder, no como clases definidas necesariamente en el workspace.

### 12.3 Object datatypes definidos por usuario

Los objetos creados por el desarrollador también son datatypes:

```powerscript
n_customer_service lnv_service
w_customer lw_customer
uo_filter luo_filter
```

El tipo puede estar definido en otra librería del library search path. Por tanto, resolverlo requiere considerar:

```text
- target activo;
- library search path;
- ancestors;
- imports/exports;
- PBL/PBD disponibles;
- source real frente a artefacto compilado.
```

### 12.4 Structure datatypes

Una structure define un conjunto de campos. Se declara y usa como datatype:

```powerscript
str_customer lstr_customer
lstr_customer.id = 100
lstr_customer.name = "ACME"
```

Las structures se comportan de forma distinta a los objetos, especialmente en assignment y paso de argumentos.

### 12.5 Enumerated datatypes

PowerBuilder incluye enumerated datatypes del runtime. Sus valores se escriben con `!`:

```powerscript
dw_1.SetRedraw(FALSE)
dw_1.RowsCopy(1, dw_1.RowCount(), Primary!, lds_copy, 1, Primary!)
MessageBox("Title", "Text", Information!, OK!)
```

Una IA debe reconocer que `Primary!`, `Information!`, `OK!`, `EncodingUTF8!` y valores similares no son strings.

### 12.6 `Any`

`Any` puede contener valores de muchos tipos. Es flexible pero reduce certeza estática:

```powerscript
any la_value
la_value = 10
la_value = "text"
la_value = dw_1.Object.Data[1, 1]
```

Una IA debe intentar inferir el tipo real por assignment, llamadas y uso posterior, pero debe degradar confianza si no hay evidencia suficiente.

### 12.7 Arrays

PowerScript soporta arrays de datatypes estándar, objetos y structures:

```powerscript
integer li_values[]
string ls_names[10]
long ll_matrix[1 TO 10, 1 TO 5]
str_customer lstr_customers[]
```

También se puede inicializar arrays:

```powerscript
integer li_values[]
li_values = {1, 2, 3, 4}
```

### 12.8 Datatype conversion

PowerBuilder proporciona funciones de conversión como `String`, `Integer`, `Long`, `Decimal`, `Date`, `Time`, `DateTime`, etc.

Ejemplo:

```powerscript
string ls_id
long ll_id

ls_id = "100"
ll_id = Long(ls_id)
```

Una IA debe revisar conversiones al cambiar tipos, especialmente si afectan a SQL host variables, DataWindow columns o external functions.

### 12.9 Datatype promotion

En expresiones, PowerBuilder puede promover tipos numéricos. Esto afecta overload resolution y posibles ambigüedades.

Ejemplo conceptual:

```powerscript
integer li_count
long ll_total

ll_total = li_count + 100
```

Una IA debe evitar cambiar signatures de funciones overloadadas sin considerar promociones y conversions implícitas.

### 12.10 Datatypes en DataWindow frente a PowerScript

DataWindow tiene su propia semántica de expressions y datatypes. Aunque se relacione con PowerScript, no todo DataWindow expression se interpreta igual que PowerScript.

Ejemplo:

```powerscript
dw_1.Object.emp_lname.Background.Color = "16777215~tIf(state = 'MA', 400, 700)"
```

El fragmento después de `~t` es una DataWindow expression, no PowerScript normal.

---

## 13. `Any` datatype

`Any` merece un capítulo propio porque introduce dinamismo real dentro de PowerScript. Una IA debe tratarlo como una fuente de incertidumbre semántica, no como un simple alias universal.

### 13.1 `Any` como datatype chameleon

`Any` toma el tipo del valor asignado:

```powerscript
any la_value

la_value = 10          // contiene integer/long según contexto
la_value = "hello"     // contiene string
la_value = Today()     // contiene date
```

El tipo efectivo de `Any` depende del último valor asignado, salvo casos donde la ejecución condicional o dynamic data impiden saberlo.

### 13.2 Asignación de datatypes estándar, objetos, structures y arrays

`Any` puede recibir:

```text
- números;
- strings;
- dates/times;
- booleans;
- blobs;
- objetos;
- structures;
- arrays.
```

Ejemplo:

```powerscript
any la_data
str_customer lstr_customer

a_data = lstr_customer
```

Una IA debe intentar rastrear el assignment antes de inferir miembros o conversiones.

### 13.3 Arrays de `Any`

También pueden existir arrays de `Any`:

```powerscript
any la_values[]
la_values[1] = 100
la_values[2] = "text"
la_values[3] = Today()
```

Cada elemento puede tener tipo efectivo diferente.

### 13.4 Restricciones con arrays dentro de `Any`

Si un `Any` contiene un array, no siempre se puede acceder a los elementos como si el `Any` fuera directamente el array tipado. Puede ser necesario asignar el contenido a una variable array del tipo adecuado.

Patrón seguro:

```powerscript
any la_any
integer li_values[]

la_any = {1, 2, 3}
li_values = la_any
```

Una IA debe evitar generar acceso directo a elementos si no hay evidencia de que el código lo permite en ese contexto.

### 13.5 Restricciones con structures dentro de `Any`

Si un `Any` contiene una structure, puede ser necesario convertir/asignar antes de usar dot notation:

```powerscript
any la_any
str_customer lstr_customer

la_any = lstr_customer
lstr_customer = la_any
MessageBox("Customer", lstr_customer.name)
```

Una IA no debe asumir que `la_any.name` es válido solo porque `la_any` recibió una structure.

### 13.6 Operadores sobre `Any`

Los operadores funcionan si el contenido real del `Any` es compatible:

```powerscript
any la_a, la_b, la_c

la_a = 10
la_b = 5
la_c = la_a - la_b
```

Pero si los tipos no son compatibles, puede producirse error runtime:

```powerscript
la_a = 10
la_b = "text"
la_c = la_a - la_b  // riesgo runtime
```

### 13.7 `ClassName` para inspección

`ClassName` puede usarse para inspeccionar el tipo efectivo:

```powerscript
choose case ClassName(la_value)
case "integer"
    // numeric processing
case "string"
    // string processing
end choose
```

Una IA debe reconocer estos patrones como type narrowing manual.

### 13.8 `SetNull` no convierte `Any` de vuelta a genérico

Si un `Any` tuvo un tipo efectivo y luego se pone a NULL, no significa necesariamente que vuelva a un estado genérico sin tipo. Por tanto, inferir `Any` desde `SetNull` requiere prudencia.

```powerscript
any la_value

la_value = "text"
SetNull(la_value)
```

La variable está NULL, pero su historial de tipo puede seguir importando.

### 13.9 Riesgos semánticos para IA

Reglas prácticas:

```text
1. Si Any tiene assignment directo inmediato, inferir tipo con confianza media/alta.
2. Si Any viene de DataWindow Object, dynamic SQL, JSON, OLE o external call, degradar confianza.
3. Si Any se usa con ClassName/Choose Case, aprovechar narrowing.
4. No generar dot notation sobre Any structure sin conversión evidente.
5. No asumir que SetNull elimina historial de tipo.
6. No usar Any como excusa para saltar validación de signatures.
```

---

## 14. Enumerated datatypes

PowerBuilder usa enumerated datatypes propios del runtime. Sus valores tienen forma distintiva: terminan en `!`. Son frecuentes en llamadas a funciones, propiedades, DataWindow buffers, MessageBox, encoding, window states y muchos objetos system.

### 14.1 Qué son los enumerated datatypes

Un enumerated datatype representa un conjunto cerrado de valores permitidos.

Ejemplos:

```powerscript
MessageBox("Title", "Text", Information!, OK!)
dw_1.RowsCopy(1, dw_1.RowCount(), Primary!, lds_target, 1, Primary!)
li_file = FileOpen(ls_path, StreamMode!, Read!, LockRead!)
```

### 14.2 Valores terminados en `!`

Los valores enumerados terminan con signo de exclamación:

```text
Primary!
Delete!
Filter!
Information!
StopSign!
OK!
Cancel!
EncodingUTF8!
StreamMode!
Read!
Write!
```

Una IA debe tokenizarlos como una unidad y no separarlos en identifier + operador.

### 14.3 No usar comillas en valores enumerados

Incorrecto:

```powerscript
dw_1.RowsCopy(1, 10, "Primary!", lds_target, 1, "Primary!")
```

Correcto:

```powerscript
dw_1.RowsCopy(1, 10, Primary!, lds_target, 1, Primary!)
```

Si aparece entre comillas, probablemente es un string literal que contiene texto, no un enum value.

### 14.4 No se crean enums propios

PowerBuilder no permite crear enumerated datatypes personalizados como en otros lenguajes. Para conjuntos propios de constantes, se suelen usar constants o variables constantes.

Ejemplo:

```powerscript
CONSTANT integer STATUS_ACTIVE = 1
CONSTANT integer STATUS_INACTIVE = 2
```

### 14.5 Enumerated values en PowerScript

Aparecen como argumentos o valores de propiedades:

```powerscript
MessageBox("Confirm", "Continue?", Question!, YesNo!)
li_file = FileOpen(ls_file, TextMode!, Read!, LockRead!)
```

### 14.6 Enumerated values en DataWindow

DataWindow usa enums como buffers:

```powerscript
dw_1.RowsCopy(1, dw_1.RowCount(), Primary!, lds_copy, 1, Primary!)
dw_1.GetItemString(1, "name", Primary!, TRUE)
```

### 14.7 Enumerated values en PBNI

PBNI también debe intercambiar valores PowerBuilder, incluyendo enumerated types. Una IA debe recordar que extensiones nativas pueden recibir o devolver enums.

### 14.8 Errores frecuentes de IA con enums

```text
- poner comillas a valores enum;
- eliminar el signo !;
- tratar Primary! como string;
- confundir enum type con enum value;
- inventar valores con ! no existentes;
- mezclar enums de DataWindow con enums de MessageBox;
- modificar casing sin necesidad.
```

---

## 15. Variables, constants, arrays y scopes

Las variables en PowerBuilder dependen fuertemente del lugar donde se declaran. El scope afecta visibilidad, lifetime, resolución de nombres, shadowing y seguridad de refactorización.

### 15.1 Declaración de variables

Forma general:

```powerscript
datatype variableName
```

Ejemplos:

```powerscript
string ls_name
long ll_customerId
boolean lb_found
decimal ldc_total
```

También se pueden declarar varias variables del mismo tipo:

```powerscript
string ls_name, ls_address, ls_city
```

### 15.2 Global variables

Una variable global es accesible desde cualquier lugar de la aplicación.

Ejemplo conceptual:

```powerscript
global string gs_applicationName
```

Las globales deben usarse con cuidado porque aumentan acoplamiento y pueden ser ocultadas por variables de otros scopes.

### 15.3 Instance variables

Una instance variable pertenece a una instancia concreta de un objeto:

```powerscript
private long il_customerId
protected string is_mode
public boolean ib_dirty
```

Pueden tener access modifiers y suelen representar estado interno del objeto.

### 15.4 Shared variables

Una shared variable pertenece a la definición del objeto y se comparte entre instancias. Es privada y accesible solo desde scripts del objeto y controles asociados.

Ejemplo:

```powerscript
shared long sl_instanceCount
```

Una IA debe distinguir shared de instance: shared no pertenece a cada instancia individual.

### 15.5 Local variables

Una local variable existe solo dentro del script donde se declara:

```powerscript
public function long uf_calculate();
    long ll_total
    ll_total = 0
    return ll_total
end function
```

Cuando termina el script, la variable deja de existir.

### 15.6 Argument variables

Los argumentos de functions/events actúan como variables dentro del script:

```powerscript
public function long uf_load(readonly long al_customerId);
    return al_customerId
end function
```

Pueden ser by value, by reference o read-only según la firma.

### 15.7 Constants

Las constantes representan valores que no deben cambiar:

```powerscript
CONSTANT long STATUS_ACTIVE = 1
CONSTANT string DEFAULT_MODE = "A"
```

Si una IA reemplaza literales por constantes, debe asegurarse de no cambiar tipo, scope ni orden de inicialización.

### 15.8 Arrays de tamaño fijo

Ejemplo:

```powerscript
string ls_names[10]
integer li_matrix[5, 5]
```

El tamaño forma parte de la declaración.

### 15.9 Arrays de tamaño variable

Ejemplo:

```powerscript
long ll_ids[]
ll_ids[1] = 100
ll_ids[2] = 200
```

### 15.10 Arrays multidimensionales

Ejemplo:

```powerscript
decimal ldc_values[1 TO 12, 1 TO 31]
```

Una IA debe preservar rangos explícitos con `TO`.

### 15.11 Rangos con `TO`

PowerBuilder permite cambiar lower bound:

```powerscript
integer li_values[0 TO 9]
```

Esto afecta cualquier análisis de índices.

### 15.12 Inicialización con `{...}`

Ejemplo:

```powerscript
integer li_values[]
li_values = {1, 2, 3, 4}
```

Una IA debe distinguir array initializer de bloque de código; PowerScript no usa `{}` como delimitador de bloques.

### 15.13 Cursores SQL como variables declarables

Los cursores SQL pueden declararse en scopes global, shared, instance o local, dependiendo del script y necesidad.

Ejemplo:

```powerscript
DECLARE c_customer CURSOR FOR
SELECT customer_id
FROM customer;
```

### 15.14 Lifetime de variables

Resumen:

```text
Global   → vida de la aplicación.
Instance → vida de la instancia.
Shared   → vida asociada a definición/uso del objeto.
Local    → vida del script.
Argument → vida del script de función/evento.
```

### 15.15 Shadowing

Una variable en un scope más cercano puede ocultar otra de scope superior:

```powerscript
string is_name

public function string uf_getName();
    string ls_name
    string is_name

    is_name = "local shadow"
    return is_name
end function
```

Una IA debe detectar shadowing antes de rename o refactorización.

---

## 16. Resolución de nombres y conflictos

La resolución de nombres en PowerBuilder no debe hacerse por texto simple. Debe considerar scope, objeto actual, containment, ancestors, library search path, signatures y dynamic lookup.

### 16.1 Resolución no cualificada

Una referencia no cualificada como:

```powerscript
ls_name = is_name
```

puede apuntar a una local, argument, shared, global o instance variable dependiendo de contexto. Una IA debe resolver el binding efectivo antes de modificar.

### 16.2 Conflictos entre local, shared, global e instance

Si varios símbolos tienen el mismo nombre, el contexto determina cuál se usa.

Ejemplo:

```powerscript
string is_code

public function string uf_test();
    string is_code
    is_code = "local"
    return is_code
end function
```

Aquí `is_code` dentro de la función puede no ser la instance variable, sino la local que la oculta.

### 16.3 Acceso cualificado

Para reducir ambigüedad se usa cualificación:

```powerscript
This.is_code = "instance"
Parent.uf_refresh()
```

### 16.4 Acceso a globals con `::`

El operador `::` puede usarse para forzar acceso global en contextos donde hay ocultamiento:

```powerscript
::gs_applicationName = "App"
```

### 16.5 Acceso a instance variables ocultas

Si una instance variable queda ocultada por una local o argumento, puede usarse `This`:

```powerscript
This.is_code = "instance value"
```

En controles, `Parent` puede acceder al contenedor:

```powerscript
Parent.ib_dirty = TRUE
```

### 16.6 Ambigüedad por librerías

El mismo objeto o función puede existir en varias librerías. El library search path y el target activo son esenciales.

Una IA debe evitar frases como “este símbolo no existe” sin revisar:

```text
- librerías del target;
- PBDs referenciadas;
- framework ancestors;
- source exportado disponible;
- diferencias Workspace/Solution.
```

### 16.7 Ambigüedad por overloads

Si existen varias funciones con mismo nombre y distinta firma, la llamada se resuelve por argumentos:

```powerscript
of_find(long al_id)
of_find(string as_code)
```

Una IA debe preservar tipos de argumentos al modificar llamadas.

### 16.8 Ambigüedad por dynamic calls

Las llamadas dinámicas se resuelven en runtime:

```powerscript
luo_service.DYNAMIC uf_execute(ls_action)
```

No puede asumirse con certeza estática que el método exista en el tipo declarado.

### 16.9 Reglas prácticas para IA

```text
1. Resolver scope antes de rename.
2. Considerar This, Parent, Super y ::.
3. Considerar ancestors y descendants.
4. Considerar overloads por firma.
5. Considerar library search path.
6. Degradar confianza ante DYNAMIC.
7. No resolver por búsqueda textual simple.
8. No modificar references en strings salvo evidencia fuerte.
```

---

## 17. Access modifiers y encapsulación

PowerBuilder permite controlar acceso a variables y scripts. La encapsulación no es automática: el desarrollador debe usar scopes y access modifiers correctamente.

### 17.1 `public`

Un miembro `public` puede ser accesible desde otros objetos según contexto.

```powerscript
public function long uf_save()
```

### 17.2 `protected`

Un miembro `protected` está pensado para uso desde el propio objeto y descendants.

```powerscript
protected function long uf_validate()
```

### 17.3 `private`

Un miembro `private` debe quedar limitado al propio objeto.

```powerscript
private string is_internalState
```

### 17.4 `system`

`system` aparece como access level en metamodelo y system scripts. Una IA debe reconocerlo como parte del runtime/objetos system.

### 17.5 Access de instance variables

Instance variables pueden declararse con access modifiers:

```powerscript
private long il_id
protected string is_status
public boolean ib_modified
```

Una IA debe evitar convertir variables `private` en `public` salvo necesidad explícita.

### 17.6 Access de functions/events

Functions y events pueden tener access:

```powerscript
public function long uf_load()
protected function boolean uf_isValid()
private subroutine uf_resetCache()
```

El cambio de access puede romper llamadas existentes o exponer API interna.

### 17.7 Read/write access

El metamodelo puede describir read/write access de variables. En objetos PowerBuilder, algunas propiedades pueden tener restricciones de lectura/escritura.

### 17.8 Encapsulación con object functions

Patrón recomendado:

```powerscript
private string is_name

public function string uf_getName();
    return is_name
end function

public subroutine uf_setName(readonly string as_name);
    is_name = as_name
end subroutine
```

### 17.9 Patrones recomendados y errores frecuentes

Reglas prácticas:

```text
1. Mantener variables internas como private/protected.
2. Exponer API mediante functions.
3. No cambiar access sin revisar descendants y callers.
4. No asumir que public significa uso externo real.
5. No eliminar protected methods porque parezcan no usados localmente.
6. Revisar framework descendants antes de borrar o renombrar.
```

---

## 18. Pronouns y cualificación

PowerScript tiene pronouns para referenciar objetos de forma contextual. Son esenciales para comprender scripts visuales, user objects, menus y herencia.

### 18.1 `This`

`This` referencia el objeto o control actual.

Ejemplo:

```powerscript
This.Visible = TRUE
This.uf_refresh()
```

En un script de ventana, `This` es la ventana. En un script de control, `This` es el control.

### 18.2 `Parent`

`Parent` referencia el contenedor, no el ancestor.

Ejemplos:

```powerscript
Close(Parent)
Parent.Title = "Customers"
Parent.uf_refresh()
```

Interpretación según contexto:

```text
Control dentro de Window      → Parent es la Window.
Control dentro de UserObject  → Parent es el UserObject.
Menu item                     → Parent es el item superior.
```

Error crítico de IA:

```text
Parent NO significa clase base.
Parent NO es inheritance.
Parent es containment.
```

### 18.3 `Super`

`Super` referencia el ancestor inmediato en descendants.

Ejemplo:

```powerscript
call super::create
call super::destroy
```

También puede usarse para llamar funciones/events del ancestor inmediato.

### 18.4 `ParentWindow`

En scripts de Menu, `ParentWindow` identifica la ventana asociada al menú durante ejecución.

Ejemplo conceptual:

```powerscript
ParentWindow.Title = "Main"
```

### 18.5 `::` para ancestor calls

Se puede llamar explícitamente una función/evento del ancestor:

```powerscript
ancestorClass::uf_process()
```

O con `Super`:

```powerscript
Super::uf_process()
```

### 18.6 `::` para global qualification

También puede usarse para referenciar globales:

```powerscript
::gs_user = "ADMIN"
```

Una IA debe resolver por contexto si `::` es ancestor call o global qualification.

### 18.7 `object.member`

Dot notation accede a miembros:

```powerscript
lw_window.Title = "Customers"
luo_service.uf_load(ll_id)
dw_1.DataObject = "d_customer"
```

### 18.8 `control.event`

Eventos pueden invocarse o referenciarse de forma contextual:

```powerscript
dw_1.EVENT ue_retrieve()
```

### 18.9 Diferencia entre containment y inheritance

```text
Containment:
  Window contiene CommandButton.
  UserObject contiene DataWindow control.
  Menu contiene MenuItem.

Inheritance:
  w_customer hereda de w_base.
  u_dw_customer hereda de u_dw_base.
  n_service hereda de n_base_service.
```

`Parent` pertenece a containment. `Super` pertenece a inheritance.

### 18.10 Errores frecuentes: Parent no es ancestor

Ejemplo erróneo:

```text
Asumir que Parent.uf_save() llama al ancestor.
```

Interpretación correcta:

```text
Parent.uf_save() llama al contenedor actual.
Super::uf_save() llama al ancestor inmediato.
ancestorClass::uf_save() llama a un ancestor explícito.
```

---

## 19. Objects, structures y assignment

Assignment en PowerBuilder tiene reglas distintas según se trate de datatypes simples, arrays, structures u objects.

### 19.1 Assignment de datatypes estándar

Ejemplos:

```powerscript
long ll_id
string ls_name
boolean lb_valid

ll_id = 100
ls_name = "Customer"
lb_valid = TRUE
```

### 19.2 Assignment de arrays

Puede copiarse contenido de arrays:

```powerscript
integer li_a[]
integer li_b[]

li_a = {1, 2, 3}
li_b = li_a
```

Una IA debe no confundir `{}` de array initializer con bloques de código.

### 19.3 Assignment de structures

Asignar una structure copia sus datos:

```powerscript
str_customer lstr_a
str_customer lstr_b

lstr_a.name = "ACME"
lstr_b = lstr_a
lstr_b.name = "OTHER"
```

Tras esto, `lstr_a` y `lstr_b` son instancias separadas.

### 19.4 Assignment de object references

Asignar un objeto copia la referencia, no el objeto:

```powerscript
n_customer_service lnv_a
n_customer_service lnv_b

lnv_a = CREATE n_customer_service
lnv_b = lnv_a
```

Ambas variables apuntan a la misma instancia.

### 19.5 Copia por valor frente a copia de referencia

Resumen:

```text
Standard datatype → valor.
Structure         → copia completa de datos.
Object            → copia de referencia.
Array             → copia de contenidos según reglas del lenguaje.
```

### 19.6 Ancestor/descendant assignment

Una variable de tipo ancestor puede contener una instancia descendant:

```powerscript
n_base_service lnv_service
lnv_service = CREATE n_customer_service
```

Esto permite polymorphism. La función ejecutada puede ser la versión descendant si existe override.

### 19.7 Autoinstantiated user objects

Para objetos autoinstantiated, la declaración crea instancia automáticamente. En esos casos, `CREATE` puede no ser necesario o incluso no permitirse según definición.

Ejemplo conceptual:

```powerscript
n_auto_service inv_service
inv_service.uf_run()
```

### 19.8 Riesgos de aliasing

Si dos referencias apuntan al mismo objeto, cambiar una afecta al objeto compartido:

```powerscript
lnv_b.is_status = "X"
```

El estado observado vía `lnv_a` también cambia porque la instancia es la misma.

### 19.9 Implicaciones para refactorización

Reglas para IA:

```text
1. No transformar object assignment como si copiara datos.
2. No eliminar una referencia aparentemente duplicada sin analizar aliasing.
3. No cambiar structure por object sin revisar semántica de copia.
4. No cambiar object por structure sin revisar identidad compartida.
5. Considerar ancestor/descendant assignment para dynamic dispatch.
6. Revisar DESTROY si hay múltiples referencias.
```

---

## 20. Object lifecycle y memoria

El ciclo de vida de objetos PowerBuilder combina creación explícita, creación visual, autoinstanciación, destrucción explícita, garbage collection y eventos lifecycle exportados.

### 20.1 `CREATE`

`CREATE` instancia un objeto de un tipo conocido en compilación:

```powerscript
n_customer_service lnv_service

lnv_service = CREATE n_customer_service
```

Después de `CREATE`, se pueden llamar properties/functions mediante dot notation:

```powerscript
lnv_service.uf_load(ll_customerId)
```

### 20.2 `CREATE USING`

`CREATE USING` instancia dinámicamente un tipo cuyo nombre se conoce en runtime:

```powerscript
n_base_service lnv_service
string ls_className

ls_className = "n_customer_service"
lnv_service = CREATE USING ls_className
```

Este patrón es habitual en frameworks, factories, configuración dinámica o selección por plataforma. Reduce certeza estática porque el tipo real depende del string.

### 20.3 `DESTROY`

`DESTROY` elimina una instancia creada con `CREATE`:

```powerscript
DESTROY lnv_service
```

Debe usarse con cuidado si puede haber otras referencias al mismo objeto.

### 20.4 Autoinstantiated objects

Los autoinstantiated objects no requieren `CREATE` explícito. La instancia se crea al declarar la variable.

Una IA debe revisar la definición del tipo antes de añadir o eliminar `CREATE`.

### 20.5 Objetos visuales creados con `Open`

Windows y algunos objetos visuales no se crean con `CREATE` directamente, sino mediante funciones como `Open`:

```powerscript
Open(w_customer)
```

Una IA no debe reemplazar `Open` por `CREATE` en windows sin justificación.

### 20.6 Garbage collection

PowerBuilder tiene garbage collection para destruir objetos no referenciados. Aun así, muchos proyectos usan `DESTROY` explícito para objetos creados manualmente.

### 20.7 Circular references

Garbage collection puede tratar referencias circulares no alcanzables, pero una IA debe evitar introducir ciclos innecesarios entre objetos de servicio, ventanas y callbacks.

### 20.8 Posted events y referencias internas

Cuando se postea un evento o función y se pasa una referencia de objeto, PowerBuilder puede retener internamente la referencia hasta ejecutar el evento. Esto afecta a lifecycle y destrucción.

Ejemplo de riesgo:

```powerscript
PostEvent(Parent, "ue_process", this)
Close(Parent)
```

Si el objeto se destruye antes de ejecutar el posted event, puede haber errores o comportamiento difícil de analizar.

### 20.9 Null object references

Una referencia de objeto puede estar NULL. Llamar una función o acceder a propiedad de un objeto NULL produce error runtime.

Patrón defensivo:

```powerscript
IF IsValid(lnv_service) THEN
    lnv_service.uf_run()
END IF
```

También pueden aparecer checks con `IsNull`, dependiendo del tipo y contexto.

### 20.10 Riesgos con objetos destruidos

Si se destruye un objeto mientras existen otras referencias, esas referencias pueden quedar inválidas o producir errores al usarse.

Reglas para IA:

```text
1. No añadir DESTROY si no se controla ownership.
2. No eliminar DESTROY si el objeto gestiona recursos externos.
3. Revisar aliases antes de destruir.
4. Revisar posted events/functions.
5. Revisar lifecycle de windows frente a nonvisual objects.
6. No cambiar CREATE USING por CREATE si el tipo es intencionadamente dinámico.
7. No crear objetos visuales con CREATE si PowerBuilder espera Open.
8. Revisar autoinstantiated antes de generar CREATE.
```

## 21. Functions, subroutines y prototypes

Las functions y subroutines son unidades centrales de lógica en PowerBuilder. Pueden existir como funciones globales, funciones de objeto, funciones system, external functions o RPCs declarados contra un `Transaction` object. Además, en source exportado es frecuente encontrar un bloque de `forward prototypes` separado de las implementaciones reales.

Una IA debe distinguir con precisión entre:

```text
- declaración/prototype;
- implementación;
- llamada;
- función global;
- función de objeto;
- función system;
- external function;
- RPCFUNC;
- event;
- subroutine.
```

Confundir estos elementos produce errores graves: falsos duplicados, navegación incorrecta, signatures equivocadas o refactorizaciones inseguras.

### 21.1 System functions

Las system functions son funciones proporcionadas por PowerBuilder. No pertenecen a un objeto concreto y están disponibles de forma global según el lenguaje/runtime.

Ejemplos habituales:

```powerscript
MessageBox("Info", "Saved")
String(ll_id)
Long(ls_id)
Today()
Now()
IsNull(ls_value)
SetNull(ls_value)
ClassName(la_value)
```

Una IA no debe buscar implementación local de una system function en el workspace.

### 21.2 Global functions

Una global function es una función definida por el desarrollador y accesible desde scripts según el proyecto y el library search path.

Ejemplo conceptual:

```powerscript
public function string gf_formatName(string as_firstName, string as_lastName);
    return as_lastName + ", " + as_firstName
end function
```

Las global functions no son métodos de objeto. No deben tratarse como miembros de una instancia ni como funciones polimórficas.

### 21.3 Object functions

Una object function pertenece a la definición de un objeto:

```powerscript
public function long uf_loadCustomer(long al_customerId);
    return 1
end function
```

Se llama mediante una instancia, `This`, `Parent`, `Super` o una variable de objeto:

```powerscript
lnv_service.uf_loadCustomer(ll_customerId)
This.uf_refresh()
Parent.uf_save()
Super::uf_validate()
```

### 21.4 User-defined functions

Son funciones definidas por el desarrollador. Pueden ser globales o pertenecer a objetos.

Una IA debe inferir el tipo de función por contexto:

```text
- archivo .srf → global function;
- function dentro de .sru/.srw/.srm/.sra → object/application/window/menu function;
- declaration con LIBRARY → external function;
- declaration con RPCFUNC → stored procedure/RPC.
```

### 21.5 Subroutines

Una subroutine es similar a una function, pero no devuelve valor.

Ejemplo:

```powerscript
public subroutine uf_clear();
    is_name = ""
    il_id = 0
end subroutine
```

Una IA no debe convertir subroutine en function ni viceversa sin revisar todas las llamadas.

### 21.6 Function painter

Las global functions se definen normalmente en el Function painter y se almacenan como objetos de tipo Global Function.

En source exportado, pueden aparecer como `.srf`. Deben resolverse según library search path.

### 21.7 Object painter functions

Las object functions se definen en painters como Window, User Object, Menu o Application painter. Quedan dentro del objeto y participan en inheritance, access modifiers y polymorphism.

### 21.8 `forward prototypes`

En source exportado, un bloque `forward prototypes` declara signatures antes de las implementaciones:

```powerscript
forward prototypes
public function long uf_load(long al_id)
protected function boolean uf_validate()
end prototypes
```

El prototype no es una implementación duplicada.

### 21.9 Implementation block

La implementación contiene el cuerpo real:

```powerscript
public function long uf_load(long al_id);
    long ll_rc

    ll_rc = 1
    return ll_rc
end function
```

La IA debe relacionar prototype e implementation por signature normalizada.

### 21.10 Prototype vs implementation

Reglas:

```text
- Prototype declara firma.
- Implementation contiene lógica ejecutable.
- Prototype e implementation no son duplicados.
- Una implementation sin prototype puede ser válida según contexto/export, pero debe revisarse.
- Un prototype sin implementation puede indicar deuda, forward declaration externa o patrón incompleto.
```

### 21.11 Function signature

La signature debe incluir:

```text
- nombre;
- return type;
- tipo function/subroutine;
- access modifier;
- lista de argumentos;
- modo de paso de argumentos;
- varargs si aplica;
- throws si aplica.
```

Ejemplo:

```powerscript
public function long uf_update(readonly long al_id, ref string as_error);
```

### 21.12 Return type

Una function devuelve un valor:

```powerscript
public function boolean uf_isValid();
    return TRUE
end function
```

Una subroutine no devuelve valor:

```powerscript
public subroutine uf_reset();
    il_id = 0
end subroutine
```

### 21.13 Argument list

Los argumentos forman parte de la signature:

```powerscript
public function long uf_find(long al_id)
public function long uf_find(string as_code)
```

Estas funciones pueden ser overloads si el contexto lo permite.

### 21.14 Access modifier

Access afecta disponibilidad:

```powerscript
public function long uf_public()
protected function long uf_protected()
private function long uf_private()
```

Cambiar access puede romper callers o descendants.

### 21.15 THROWS clause

PowerBuilder permite declarar excepciones con `THROWS` en signatures. Una IA debe conservar esta parte de la signature.

Ejemplo conceptual:

```powerscript
public function long uf_process() throws n_exception;
```

Reglas para IA:

```text
1. No tratar prototypes como duplicados.
2. No cambiar return type sin revisar todas las llamadas.
3. No cambiar argument passing sin revisar side effects.
4. No confundir global function con object function.
5. No resolver overloads solo por nombre.
6. No ignorar access modifiers.
7. No eliminar functions aparentemente no usadas sin revisar dynamic calls, events, framework hooks y external invocation.
```

---

## 22. Argument passing

PowerBuilder permite pasar argumentos de varias formas. El modo de paso es parte de la signature y afecta semántica, rendimiento, mutabilidad y compatibilidad con overloads o callbacks.

### 22.1 By value

By value pasa una copia del valor. Cambios internos no afectan la variable original.

Ejemplo:

```powerscript
public function long uf_increment(long al_value);
    al_value = al_value + 1
    return al_value
end function
```

Llamada:

```powerscript
long ll_count
ll_count = 10
MessageBox("Result", String(uf_increment(ll_count)))
```

`ll_count` conserva su valor original salvo que se reasigne explícitamente con el return.

### 22.2 By reference / `REF`

By reference permite modificar la variable original:

```powerscript
public function long uf_getCustomer(long al_id, ref string as_name);
    as_name = "Customer " + String(al_id)
    return 1
end function
```

Llamada:

```powerscript
string ls_name
uf_getCustomer(100, ls_name)
```

Después de la llamada, `ls_name` puede contener el valor asignado dentro de la función.

### 22.3 Read-only

Read-only permite pasar datos sin permitir modificación dentro de la función/evento. Es útil para documentar intención y puede evitar copias costosas en ciertos datatypes.

Ejemplo:

```powerscript
public function long uf_calculate(readonly string as_code);
    // as_code no debe modificarse aquí
    return Len(as_code)
end function
```

### 22.4 Passing standard datatypes

Con datatypes estándar, by value copia el valor; by reference permite modificar la variable original.

```powerscript
public subroutine uf_setDefault(ref long al_value);
    al_value = 1
end subroutine
```

### 22.5 Passing strings, blobs, dates y datetimes

Read-only puede ser especialmente útil en datatypes como string, blob, date, time y datetime, porque expresa intención y puede evitar copias innecesarias.

```powerscript
public function boolean uf_isValidPayload(readonly blob ablb_payload);
    return Len(ablb_payload) > 0
end function
```

### 22.6 Passing objects

Al pasar objetos, no se copia el objeto completo. Se pasa una referencia o una copia de la referencia, según modo.

Ejemplo:

```powerscript
public subroutine uf_configure(n_service anv_service);
    anv_service.of_setMode("A")
end subroutine
```

Aunque el argumento sea by value, las modificaciones sobre el objeto apuntado afectan a la instancia original.

### 22.7 Passing structures

Las structures tienen semántica de datos. Pasarlas by value copia la structure; pasarlas by reference permite modificar la original.

```powerscript
public subroutine uf_normalize(ref str_customer astr_customer);
    astr_customer.name = Trim(astr_customer.name)
end subroutine
```

### 22.8 Passing arrays

Los arrays pueden pasarse como argumentos. La IA debe revisar si el argumento se modifica dentro de la función y si el modo de paso permite side effects.

```powerscript
public function long uf_count(readonly string as_values[]);
    return UpperBound(as_values)
end function
```

### 22.9 Riesgos con posted functions/events

Si se postea un evento o función, la ejecución ocurre después. Si se pasan objetos que pueden destruirse antes de la ejecución, hay riesgo.

```powerscript
PostEvent(Parent, "ue_process", This)
```

Una IA debe ser conservadora al transformar posted calls.

### 22.10 Implicaciones para side effects

Reglas prácticas:

```text
1. REF indica posible modificación del argumento original.
2. Readonly indica no modificación esperada.
3. Objetos no se copian completos aunque se pasen by value.
4. Structures sí pueden copiarse como datos.
5. Arrays requieren revisar modo de paso y uso interno.
6. Cambiar passing mode cambia contrato público.
7. En external functions y RPCFUNC, REF suele tener implicaciones ABI/DBMS.
8. En eventos posteados, revisar lifetime del objeto pasado.
```

---

## 23. Events

Los eventos son una parte fundamental del modelo PowerBuilder. Una aplicación PowerBuilder se ejecuta principalmente reaccionando a eventos de usuario, del sistema, de controles, de ventanas, de Application, de DataWindow y de eventos definidos por el desarrollador.

### 23.1 Qué es un event en PowerBuilder

Un event es una acción en un objeto o control que puede ejecutar un script.

Ejemplos:

```text
- Clicked;
- Open;
- Close;
- Constructor;
- Destructor;
- ItemChanged;
- ItemError;
- SystemError;
- eventos definidos por usuario.
```

### 23.2 System events con ID

Algunos eventos están asociados a mensajes del sistema. Tienen un event ID y pueden dispararse por acciones del usuario o mensajes del sistema.

Ejemplo conceptual:

```powerscript
event clicked;
    MessageBox("Clicked", "Button clicked")
end event
```

### 23.3 System events sin ID

Otros eventos son disparados por PowerBuilder, no por mensajes externos del sistema. Ejemplo: `Open` del Application object.

### 23.4 User-defined events con ID

Un user event puede mapearse a un mensaje del sistema o event ID. Esto permite responder a mensajes específicos.

### 23.5 User-defined events sin ID

También pueden existir user events sin ID, invocados explícitamente desde scripts.

```powerscript
event ue_refresh;
    uf_loadData()
end event
```

### 23.6 Mapped events

Mapped events asocian eventos de usuario a mensajes del sistema. Una IA debe conservar el mapping aunque no vea llamadas explícitas en el código.

### 23.7 Event IDs

El event ID forma parte del significado del evento. Puede aparecer en metadata/export o en herramientas del IDE.

No debe eliminarse un evento solo porque no se encuentre una llamada textual: puede ser invocado por sistema o mapping.

### 23.8 Arguments de eventos

Los eventos pueden tener argumentos. Los system events tienen argumentos definidos por PowerBuilder; los user events pueden definir los suyos.

Ejemplo conceptual:

```powerscript
event type integer ue_validate(long al_row, string as_column)
```

### 23.9 Return values de eventos

Algunos eventos devuelven valor. En system events, el return value puede tener significado para el runtime o el sistema.

```powerscript
event closequery;
    return 0
end event
```

Una IA no debe eliminar o cambiar return values sin entender el contrato del evento.

### 23.10 `EVENT`

`EVENT` permite disparar eventos:

```powerscript
This.EVENT ue_refresh()
```

### 23.11 `TriggerEvent`

`TriggerEvent` dispara un evento inmediatamente:

```powerscript
TriggerEvent(This, "ue_refresh")
```

Puede aparecer con nombre de evento como string, lo que reduce seguridad de rename.

### 23.12 `PostEvent`

`PostEvent` encola un evento para ejecutarlo después:

```powerscript
PostEvent(This, "ue_refresh")
```

La ejecución no ocurre inmediatamente. Esto afecta control flow y lifetime.

### 23.13 Return value perdido en posted events

En eventos posteados, el caller ya no espera el resultado. Por tanto, el return value no puede usarse de la misma forma que en una llamada trigger/inmediata.

### 23.14 Eventos extendidos

Un descendant puede extender un evento del ancestor. PowerBuilder puede generar una llamada a `CALL SUPER::event_name` al inicio del script extendido.

```powerscript
CALL SUPER::ue_refresh
```

### 23.15 Eventos overrideados

Un descendant puede overridear un evento, reemplazando comportamiento del ancestor. Si necesita ejecutar lógica ancestor, debe llamar explícitamente `Super` o `ancestorclass::`.

Reglas para IA:

```text
1. No eliminar eventos solo porque no haya referencias textuales.
2. Reconocer eventos system disparados por runtime.
3. Reconocer user events invocados por EVENT, TriggerEvent o PostEvent.
4. Tratar nombres de eventos en strings como referencias dinámicas de baja confianza.
5. No cambiar return values de eventos system sin conocer contrato.
6. No eliminar CALL SUPER sin revisar si el event está extendiendo ancestor.
7. Distinguir trigger inmediato y post asíncrono/en cola.
```

---

## 24. Static calls, dynamic calls, overload, override y ancestor calls

PowerBuilder combina chequeo estático, dispatch polimórfico y llamadas dinámicas. Una IA debe entender estos mecanismos antes de refactorizar signatures, renombrar functions o resolver referencias.

### 24.1 Static lookup

Por defecto, PowerBuilder intenta resolver funciones/eventos en compilación usando nombre y tipos de argumentos.

```powerscript
lnv_service.uf_process(ll_id)
```

Aunque la llamada se resuelva en compilación contra el tipo declarado, si la instancia real es descendant, puede ejecutarse la implementación overrideada.

### 24.2 Dynamic lookup

Dynamic lookup permite llamar functions/events que quizá no existan en el tipo declarado en compilación.

```powerscript
lnv_service.DYNAMIC uf_process(ls_action)
```

Esto aumenta flexibilidad, pero reduce seguridad estática.

### 24.3 Global/system functions no dinámicas

Las global functions y system functions no participan en dynamic lookup como object functions. Se resuelven como funciones globales/system y no son polimórficas.

```powerscript
MessageBox("Info", "Done")
gf_format(ls_text)
```

### 24.4 Object functions polimórficas

Una variable ancestor puede apuntar a una instancia descendant:

```powerscript
n_base_service lnv_service
lnv_service = CREATE n_customer_service
lnv_service.uf_execute()
```

Si `n_customer_service` overridea `uf_execute`, se ejecuta la versión descendant.

### 24.5 Overloading

Overloading permite varias functions con el mismo nombre y distinta lista de argumentos:

```powerscript
public function long uf_find(long al_id)
public function long uf_find(string as_code)
```

Una IA debe resolver por aridad y tipos, no solo por nombre.

### 24.6 Overriding

Overriding ocurre cuando un descendant define una function/event compatible con una del ancestor para reemplazar comportamiento.

```powerscript
// ancestor
public function long uf_validate()

// descendant
public function long uf_validate()
```

### 24.7 Extending event scripts

Extending conserva lógica ancestor y añade lógica descendant. En source exportado puede aparecer:

```powerscript
CALL SUPER::event_name
```

### 24.8 `CALL SUPER::event_name`

Esta llamada ejecuta el script del evento en el ancestor inmediato.

Una IA no debe eliminarlo como “llamada redundante” sin revisar lifecycle o semántica del framework.

### 24.9 `AncestorReturnValue`

Cuando un event extendido llama al ancestor, puede existir una variable generada para capturar return value del ancestor.

```powerscript
IF AncestorReturnValue <> 0 THEN
    return AncestorReturnValue
END IF
```

Una IA debe reconocerla aunque no haya declaración local explícita.

### 24.10 `ancestorclass::function`

Se puede llamar explícitamente a un ancestor concreto:

```powerscript
w_base::uf_refresh()
```

Esto no es una llamada global; es una llamada a implementación ancestor.

### 24.11 Dynamic lookup y coste/riesgo

Dynamic lookup:

```text
- puede evitar errores de compilación;
- resuelve en runtime;
- puede fallar en runtime;
- dificulta rename;
- dificulta references;
- puede usarse en frameworks y plugins internos;
- debe degradar confianza semántica.
```

### 24.12 Reglas de IA para no romper polimorfismo

```text
1. No renombrar una function overrideada sin revisar ancestors y descendants.
2. No cambiar signature si existen overloads.
3. No eliminar ancestor function aparentemente no usada si descendants dependen de ella.
4. No reemplazar dynamic call por static call sin evidencia.
5. No resolver DYNAMIC solo contra tipo declarado.
6. No eliminar CALL SUPER sin analizar event extension.
7. No confundir ancestorclass:: con global ::.
8. No colapsar overloads por nombre visible.
```

---

## 25. Statements y control flow

PowerScript tiene statements propios para asignación, condicionales, loops, creación/destrucción de objetos, control de flujo, exceptions y SQL. Una IA debe preservar la estructura lógica y no imponer sintaxis de otros lenguajes.

### 25.1 Assignment

Assignment usa `=`:

```powerscript
ls_name = "Customer"
ll_id = 100
```

No debe confundirse con comparación dentro de `IF`, donde también se usa `=`:

```powerscript
IF ls_status = "A" THEN
    lb_active = TRUE
END IF
```

### 25.2 `IF...THEN...ELSE...END IF`

```powerscript
IF lb_valid THEN
    uf_save()
ELSE
    MessageBox("Error", "Invalid data")
END IF
```

También existe `ELSEIF`:

```powerscript
IF ll_value < 0 THEN
    ls_type = "negative"
ELSEIF ll_value = 0 THEN
    ls_type = "zero"
ELSE
    ls_type = "positive"
END IF
```

### 25.3 `CHOOSE CASE`

```powerscript
CHOOSE CASE ls_status
CASE "A"
    ls_text = "Active"
CASE "I"
    ls_text = "Inactive"
CASE ELSE
    ls_text = "Unknown"
END CHOOSE
```

### 25.4 `FOR...NEXT`

```powerscript
FOR ll_i = 1 TO dw_1.RowCount()
    dw_1.SetItem(ll_i, "selected", "N")
NEXT
```

Puede incluir step según sintaxis usada.

### 25.5 `DO...LOOP`

```powerscript
DO WHILE ll_i <= ll_count
    ll_i++
LOOP
```

También puede aparecer con condiciones al final.

### 25.6 `EXIT`

`EXIT` sale de loops o bloques compatibles:

```powerscript
IF lb_found THEN EXIT
```

### 25.7 `CONTINUE`

`CONTINUE` pasa a la siguiente iteración:

```powerscript
IF IsNull(ls_value) THEN CONTINUE
```

### 25.8 `RETURN`

`RETURN` devuelve de una function/event/subroutine. En functions debe devolver valor compatible:

```powerscript
return 1
```

En subroutines puede usarse para salir:

```powerscript
return
```

### 25.9 `CALL`

`CALL` existe en PowerScript, especialmente visible en source exportado para calls a `SUPER`:

```powerscript
CALL SUPER::ue_refresh
```

No debe eliminarse automáticamente.

### 25.10 `CREATE`

Crea instancias de objetos:

```powerscript
lnv_service = CREATE n_customer_service
```

### 25.11 `DESTROY`

Destruye instancias:

```powerscript
DESTROY lnv_service
```

### 25.12 `GOTO`

`GOTO` existe en PowerScript y usa labels. Aunque muchos proyectos modernos lo prohíben por convención, una IA debe reconocerlo correctamente.

```powerscript
GOTO cleanup

cleanup:
    uf_close()
```

### 25.13 `HALT`

`HALT` termina ejecución de la aplicación o proceso según contexto. Debe tratarse como statement de control de flujo fuerte.

### 25.14 Statement boundaries y continuation

PowerScript puede usar continuation con `&`:

```powerscript
ls_message = "Customer " + &
             "saved correctly"
```

Una IA debe reconstruir statements lógicos completos antes de analizar referencias.

### 25.15 Reglas modernas para evitar `GOTO`

Si el proyecto define reglas modernas, `GOTO` debe tratarse como deuda técnica. Pero una IA no debe eliminarlo automáticamente: debe refactorizarlo solo si puede preservar control flow exacto.

Reglas prácticas:

```text
1. Reconocer todos los statements PowerScript oficiales.
2. No imponer llaves estilo C/Java.
3. No confundir = assignment con = comparación sin contexto.
4. Reconstruir statements con & antes de analizar.
5. No eliminar CALL SUPER automáticamente.
6. No refactorizar GOTO sin control-flow completo.
7. Tratar HALT como terminación fuerte.
```

---

## 26. Operators y expressions

PowerScript tiene operadores aritméticos, relacionales, lógicos, concatenación y shortcuts de assignment. Además, las expresiones pueden verse afectadas por NULL, `Any`, datatype promotion y ambigüedades léxicas.

### 26.1 Arithmetic operators

Ejemplos:

```powerscript
ll_total = ll_price + ll_tax
ll_diff = ll_total - ll_discount
ll_area = ll_width * ll_height
ld_ratio = ld_amount / ld_count
```

### 26.2 Relational operators

```powerscript
IF ll_id = 100 THEN
IF ll_count <> 0 THEN
IF ld_amount > 0 THEN
IF ls_code <= "Z" THEN
```

PowerScript usa `=` para comparación en expresiones condicionales y también para assignment según contexto.

### 26.3 Logical operators

```powerscript
IF lb_valid AND lb_authorized THEN
IF lb_admin OR lb_owner THEN
IF NOT lb_found THEN
```

### 26.4 Concatenation

El operador `+` concatena strings:

```powerscript
ls_fullName = ls_lastName + ", " + ls_firstName
```

Debe distinguirse de suma numérica por tipo/contexto.

### 26.5 Assignment shortcuts

PowerScript soporta shortcuts como:

```powerscript
ll_i++
ll_i--
ll_total += 10
ll_total -= 5
ll_total *= 2
ll_total /= 2
```

La IA debe preservar spacing si hay riesgo por dashes en identifiers.

### 26.6 Operator precedence

La precedencia afecta evaluación:

```powerscript
ll_result = ll_a + ll_b * ll_c
```

Una IA debe añadir paréntesis si refactoriza expresiones y existe riesgo de cambiar significado.

### 26.7 Datatype promotion

Expresiones con varios tipos pueden promover valores:

```powerscript
long ll_total
integer li_count

ll_total = li_count + 100
```

Esto afecta overloads y conversions.

### 26.8 Dashes in identifiers

Si un proyecto permite guiones en identifiers, expresiones como:

```powerscript
ll_a-ll_b
```

pueden tener ambigüedad léxica. Es más seguro usar espacios alrededor de operadores:

```powerscript
ll_a - ll_b
```

### 26.9 Null propagation

Si una expresión incluye NULL, el resultado puede ser NULL. Esto afecta IF, arithmetic, concatenation y function calls.

```powerscript
SetNull(ls_name)
ls_text = "Name: " + ls_name  // resultado con riesgo NULL
```

### 26.10 Expressions con `Any`

Si un operador se aplica sobre `Any`, el resultado depende del tipo efectivo en runtime:

```powerscript
la_result = la_a + la_b
```

Puede ser suma o concatenación, o fallar si los tipos son incompatibles.

### 26.11 Expressions en DataWindow no son PowerScript normal

Esto no es PowerScript normal:

```powerscript
dw_1.Object.salary.Color = "0~tIf(salary > 1000, 255, 0)"
```

La expresión después de `~t` pertenece al motor DataWindow.

Reglas para IA:

```text
1. Resolver tipo antes de interpretar +.
2. No cambiar spacing en expresiones con guiones sin revisar identifiers.
3. Añadir paréntesis ante refactorizaciones complejas.
4. Degradar confianza en expressions con Any.
5. Considerar NULL propagation.
6. No parsear DataWindow expressions como PowerScript.
```

---

## 27. NULL semantics

NULL en PowerBuilder significa valor indefinido o desconocido. No equivale a cero, cadena vacía ni fecha vacía. La semántica de NULL afecta variables, SQL, DataWindow, expressions y control flow.

### 27.1 Qué significa NULL en PowerBuilder

NULL representa ausencia o desconocimiento de valor.

```powerscript
string ls_name
SetNull(ls_name)
```

### 27.2 Variables no inicializadas a NULL por defecto

Una variable declarada sin valor se inicializa al valor por defecto de su datatype, no a NULL.

Ejemplos conceptuales:

```text
numeric → 0
boolean → FALSE
string  → ""
```

### 27.3 NULL no es cero

```powerscript
long ll_value
SetNull(ll_value)
```

`ll_value` no es `0`; es NULL.

### 27.4 NULL no es cadena vacía

```powerscript
string ls_value
SetNull(ls_value)
```

`ls_value` no es `""`; es NULL.

### 27.5 NULL no es fecha vacía

Una date NULL no equivale a una fecha por defecto ni a una fecha textual vacía.

### 27.6 Expresiones con NULL

La mayoría de expresiones con NULL producen NULL:

```powerscript
SetNull(ll_value)
ll_total = ll_value + 10
```

`ll_total` puede quedar NULL.

### 27.7 Boolean NULL como undefined/false

Una expresión booleana NULL se trata como indefinida y no debe asumirse TRUE.

```powerscript
IF lb_flag THEN
    uf_run()
END IF
```

Si `lb_flag` es NULL, el flujo puede no entrar en el bloque.

### 27.8 `IsNull`

La forma correcta de comprobar NULL es:

```powerscript
IF IsNull(ls_value) THEN
    MessageBox("Info", "No value")
END IF
```

### 27.9 `SetNull`

`SetNull` pone una variable a NULL:

```powerscript
SetNull(ld_date)
SetNull(ls_name)
SetNull(ll_id)
```

### 27.10 Indicator variables SQL

En SQL embebido, las indicator variables permiten detectar NULL o errores de conversión:

```powerscript
FETCH c_customer
INTO :ls_name :li_nameInd;

IF li_nameInd = -1 THEN
    // NULL value
END IF
```

### 27.11 Errores frecuentes: `a = NULL`

Incorrecto:

```powerscript
IF ls_value = NULL THEN
    // incorrecto
END IF
```

Correcto:

```powerscript
IF IsNull(ls_value) THEN
    // correcto
END IF
```

Reglas para IA:

```text
1. No reemplazar IsNull por = NULL.
2. No asumir que variable no inicializada es NULL.
3. No asumir que NULL string es empty string.
4. No ignorar NULL propagation.
5. Revisar indicator variables en SQL embebido.
6. Revisar Any + SetNull con cautela.
```

---

## 28. Exception handling

PowerBuilder soporta exception handling con `TRY...CATCH...FINALLY...END TRY`, `THROW`, `THROWS` y jerarquía de excepciones. Una IA debe conservar el flujo de errores y no transformar exceptions en códigos de retorno sin criterio explícito.

### 28.1 Modelo de excepciones PowerBuilder

El modelo permite capturar errores mediante bloques `TRY/CATCH`:

```powerscript
TRY
    uf_process()
CATCH (Exception ex)
    MessageBox("Error", ex.GetMessage())
FINALLY
    uf_cleanup()
END TRY
```

### 28.2 `Throwable`

`Throwable` es raíz conceptual de objetos lanzables/capturables. Una IA debe reconocerlo como parte del runtime de exceptions.

### 28.3 `Exception`

`Exception` representa excepciones generales capturables.

```powerscript
CATCH (Exception ex)
    // handle exception
END TRY
```

### 28.4 `RuntimeError`

`RuntimeError` representa errores runtime. Puede aparecer en código que captura errores específicos.

### 28.5 User-defined exceptions

Los proyectos pueden definir excepciones propias como descendants de tipos de excepción.

```powerscript
n_validation_exception lex
```

### 28.6 `TRY...CATCH...FINALLY...END TRY`

Estructura principal:

```powerscript
TRY
    uf_execute()
CATCH (n_validation_exception ex)
    uf_handleValidation(ex)
CATCH (Exception ex)
    uf_handleGeneral(ex)
FINALLY
    uf_closeResources()
END TRY
```

El orden de `CATCH` importa: excepciones específicas antes de generales.

### 28.7 `THROW`

`THROW` lanza una excepción:

```powerscript
THROW lex_error
```

No debe eliminarse aunque parezca “salida abrupta”; forma parte del contrato de error.

### 28.8 `THROWS`

`THROWS` declara excepciones que una function puede lanzar:

```powerscript
public function long uf_process() throws n_validation_exception;
```

Una IA debe conservarlo al modificar signatures.

### 28.9 `SystemError`

`SystemError` es un evento del Application object que puede ejecutarse ante errores graves no capturados.

Una IA no debe eliminarlo aunque no se encuentre llamada textual.

### 28.10 Orden de CATCH blocks

Orden recomendado:

```text
1. Exceptions específicas.
2. Exceptions intermedias.
3. Exception general.
4. RuntimeError si aplica según patrón del proyecto.
```

### 28.11 Stack unwinding

Cuando una excepción se lanza, la ejecución normal se interrumpe y se busca un handler compatible. Esto puede saltar código posterior, salvo `FINALLY`.

### 28.12 Restricción de `RETURN` en `FINALLY`

Una IA debe ser muy cuidadosa con `RETURN` dentro de `FINALLY`, porque puede alterar o esconder exceptions/return values. Aunque pueda existir código legacy, no debe introducirse automáticamente.

### 28.13 Relación con errores runtime

Errores como null object reference, conversion errors o fallos external/native pueden interactuar con exception handling.

### 28.14 Relación con PBXRuntimeError

Las extensiones PBX/PBNI pueden lanzar errores especiales que heredan de RuntimeError. Una IA no debe asumir que todo error viene de PowerScript puro.

Reglas para IA:

```text
1. No eliminar TRY/CATCH aunque parezca envoltorio genérico.
2. No reordenar CATCH sin revisar jerarquía.
3. No cambiar THROWS sin revisar callers.
4. No convertir exceptions en return codes sin requerimiento.
5. No introducir RETURN en FINALLY.
6. Considerar external/native exceptions.
7. No eliminar SystemError por ausencia de referencias textuales.
```

---

## 29. SQL embebido en PowerScript

PowerScript soporta SQL embebido dentro de scripts. SQL embebido no es un string normal: forma parte del lenguaje y permite usar variables PowerScript como host variables.

### 29.1 Embedded SQL como parte del lenguaje

Ejemplo:

```powerscript
SELECT customer_name
INTO :ls_name
FROM customer
WHERE customer_id = :ll_customerId;
```

La IA debe reconocer este bloque como SQL, no como llamadas PowerScript.

### 29.2 `CONNECT`

Conecta usando un Transaction object:

```powerscript
CONNECT USING SQLCA;
```

### 29.3 `DISCONNECT`

Desconecta:

```powerscript
DISCONNECT USING SQLCA;
```

### 29.4 `COMMIT`

Confirma cambios:

```powerscript
COMMIT USING SQLCA;
```

### 29.5 `ROLLBACK`

Revierte cambios:

```powerscript
ROLLBACK USING SQLCA;
```

### 29.6 `SELECT ... INTO`

Recupera datos en variables PowerScript:

```powerscript
SELECT name, status
INTO :ls_name, :ls_status
FROM customer
WHERE id = :ll_id;
```

### 29.7 `INSERT`

```powerscript
INSERT INTO customer (id, name)
VALUES (:ll_id, :ls_name);
```

### 29.8 `UPDATE`

```powerscript
UPDATE customer
SET name = :ls_name
WHERE id = :ll_id;
```

### 29.9 `DELETE`

```powerscript
DELETE FROM customer
WHERE id = :ll_id;
```

### 29.10 `DECLARE cursor`

```powerscript
DECLARE c_customer CURSOR FOR
SELECT id, name
FROM customer;
```

### 29.11 `OPEN cursor`

```powerscript
OPEN c_customer;
```

### 29.12 `FETCH`

```powerscript
FETCH c_customer
INTO :ll_id, :ls_name;
```

### 29.13 `CLOSE`

```powerscript
CLOSE c_customer;
```

### 29.14 `DECLARE procedure`

```powerscript
DECLARE p_customer PROCEDURE FOR get_customer :ll_id;
```

### 29.15 `EXECUTE`

```powerscript
EXECUTE p_customer;
```

### 29.16 `SELECTBLOB` / `UPDATEBLOB`

PowerScript incluye statements para datos BLOB en SQL embebido.

Ejemplo conceptual:

```powerscript
SELECTBLOB photo
INTO :lblb_photo
FROM employee
WHERE employee_id = :ll_employeeId;
```

### 29.17 Host variables con `:`

Variables PowerScript dentro de SQL se preceden con `:`:

```powerscript
WHERE customer_id = :ll_customerId
```

Una IA debe comprobar que host variables estén declaradas en scope visible.

### 29.18 Indicator variables

Indicator variables se usan para NULL y conversion errors:

```powerscript
FETCH c_customer
INTO :ls_name :li_nameInd;
```

Valores típicos:

```text
0  → valor válido no NULL.
-1 → NULL.
-2 → error de conversión.
```

### 29.19 `SQLCode`, `SQLErrText` y error handling

Después de SQL crítico se suele revisar:

```powerscript
IF SQLCA.SQLCode <> 0 THEN
    MessageBox("SQL Error", SQLCA.SQLErrText)
END IF
```

En operaciones con cursores, `SQLCode = 100` puede significar no más filas.

### 29.20 DBMS-specific clauses y funciones

PowerBuilder permite cláusulas y funciones específicas del DBMS en SQL soportado. Una IA no debe “normalizar” SQL al estándar si el proyecto usa sintaxis DBMS concreta.

Reglas para IA:

```text
1. Detectar SQL embebido como sublenguaje, no como string.
2. Validar host variables con :.
3. Validar indicator variables como integer.
4. Revisar SQLCode tras operaciones críticas.
5. No reformatear SQL embebido rompiendo PowerScript.
6. No eliminar cursor CLOSE.
7. No cambiar transaction object sin revisar CONNECT/COMMIT/ROLLBACK.
8. Conservar sintaxis específica de DBMS si existe.
```

---

## 30. Dynamic SQL

Dynamic SQL permite construir y ejecutar SQL en runtime. Es más flexible, pero reduce la capacidad de análisis estático. Una IA debe tratarlo como zona de menor confianza.

### 30.1 Cuándo usar dynamic SQL

Dynamic SQL aparece cuando:

```text
- la sentencia se construye en runtime;
- la estructura SQL no se conoce en compilación;
- se ejecutan DDL u operaciones no soportadas por SQL embebido normal;
- columnas, tablas o filtros dependen de configuración;
- se implementan buscadores o query builders;
- se usan stored procedures o result sets dinámicos.
```

Ejemplo:

```powerscript
ls_sql = "SELECT name FROM customer WHERE id = " + String(ll_id)
EXECUTE IMMEDIATE :ls_sql USING SQLCA;
```

### 30.2 Format 1

Formato para sentencias sin result set y sin parámetros de entrada conocidos.

Ejemplo conceptual:

```powerscript
EXECUTE IMMEDIATE "CREATE TABLE temp_customer (id INTEGER)" USING SQLCA;
```

### 30.3 Format 2

Formato para sentencias sin result set pero con parámetros de entrada.

Ejemplo conceptual:

```powerscript
PREPARE SQLSA FROM :ls_sql USING SQLCA;
EXECUTE SQLSA USING :ll_id;
```

### 30.4 Format 3

Formato para result sets donde input parameters y columnas de salida son conocidos en compilación.

Ejemplo conceptual:

```powerscript
PREPARE SQLSA FROM :ls_sql USING SQLCA;
DECLARE c_dynamic CURSOR FOR SQLSA;
OPEN c_dynamic USING :ll_id;
FETCH c_dynamic INTO :ls_name;
CLOSE c_dynamic;
```

### 30.5 Format 4

Formato para casos donde input parameters, columnas de salida o ambos son desconocidos en compilación. Usa descriptores dinámicos como `SQLDA`.

### 30.6 `PREPARE`

`PREPARE` prepara una sentencia dinámica:

```powerscript
PREPARE SQLSA FROM :ls_sql USING SQLCA;
```

### 30.7 `DESCRIBE`

`DESCRIBE` permite obtener información de parámetros/resultados en dynamic SQL avanzado:

```powerscript
DESCRIBE SQLSA INTO SQLDA;
```

### 30.8 `EXECUTE IMMEDIATE`

Ejecuta SQL construido en runtime:

```powerscript
EXECUTE IMMEDIATE :ls_sql USING SQLCA;
```

Es potente, pero debe considerarse de baja confianza para análisis seguro.

### 30.9 `EXECUTE DYNAMIC`

Ejecuta cursor/procedure dinámico con parámetros o descriptor:

```powerscript
EXECUTE DYNAMIC c_proc USING :ls_param;
```

### 30.10 `OPEN DYNAMIC`

Abre cursor/procedure dinámico:

```powerscript
OPEN DYNAMIC c_customer USING :ll_id;
```

### 30.11 `DynamicStagingArea`

`DynamicStagingArea` almacena información interna de la sentencia dinámica preparada. PowerBuilder proporciona `SQLSA` como variable global de este tipo.

### 30.12 `DynamicDescriptionArea`

`DynamicDescriptionArea` describe input/output parameters en SQL dinámico avanzado. PowerBuilder proporciona `SQLDA` como variable global.

### 30.13 `SQLSA`

`SQLSA` es el DynamicStagingArea global. Es común en dynamic SQL:

```powerscript
PREPARE SQLSA FROM :ls_sql USING SQLCA;
```

### 30.14 `SQLDA`

`SQLDA` es el DynamicDescriptionArea global:

```powerscript
DESCRIBE SQLSA INTO SQLDA;
```

### 30.15 Riesgos de análisis estático

Dynamic SQL puede ocultar:

```text
- tablas;
- columnas;
- joins;
- filtros;
- host variables reales;
- número de parámetros;
- tipos de resultados;
- efectos DDL/DML;
- riesgos de inyección si concatena valores.
```

### 30.16 SQL dinámico construido por strings

Ejemplo riesgoso:

```powerscript
ls_sql = "SELECT * FROM customer WHERE name = '" + ls_name + "'"
EXECUTE IMMEDIATE :ls_sql USING SQLCA;
```

Mejor patrón, si el formato lo permite:

```powerscript
ls_sql = "SELECT * FROM customer WHERE name = ?"
PREPARE SQLSA FROM :ls_sql USING SQLCA;
EXECUTE SQLSA USING :ls_name;
```

Reglas para IA:

```text
1. Marcar dynamic SQL como menor confianza.
2. No extraer references SQL definitivas desde strings concatenados sin evidencia.
3. Detectar host variables y parámetros.
4. Señalar posible inyección si hay concatenación de input externo.
5. No reescribir dynamic SQL como embedded SQL sin entender variabilidad.
6. Revisar SQLCA/transaction object usado.
7. Revisar SQLCode después de ejecución.
8. No asumir columnas de result set si se usan descriptores dinámicos.
```

## 31. Transaction objects y conectividad a base de datos

PowerBuilder usa `Transaction` objects como área de comunicación entre la aplicación y la base de datos. El objeto transaccional concentra propiedades de conexión, estado de operaciones SQL y parámetros necesarios para que PowerScript, DataWindow y DataStore interactúen con el DBMS.

Una IA debe tratar los `Transaction` objects como elementos semánticos críticos. Cambiar una conexión, sustituir `SQLCA`, mover un `COMMIT`, eliminar un `ROLLBACK` o alterar `AutoCommit` puede modificar la consistencia de datos.

### 31.1 Transaction object

Un `Transaction` object es un objeto no visual que contiene información de conexión y estado SQL.

Uso típico:

```powerscript
SQLCA.DBMS = "ODBC"
SQLCA.DBParm = "ConnectString='DSN=MYDB;UID=user;PWD=password'"
CONNECT USING SQLCA;
```

### 31.2 `SQLCA`

`SQLCA` es el transaction object global por defecto que PowerBuilder crea para la aplicación.

```powerscript
CONNECT USING SQLCA;

IF SQLCA.SQLCode <> 0 THEN
    MessageBox("Database", SQLCA.SQLErrText)
END IF
```

`SQLCA` suele ser suficiente cuando la aplicación usa una única conexión principal.

### 31.3 Custom transaction objects

Una aplicación puede crear transaction objects adicionales:

```powerscript
transaction ltr_sales

ltr_sales = CREATE transaction
ltr_sales.DBMS = "ODBC"
ltr_sales.DBParm = "ConnectString='DSN=SALES'"
CONNECT USING ltr_sales;
```

También es común crear user objects heredados de `Transaction` para encapsular comportamiento propio o RPCFUNC.

### 31.4 `DBMS`

`DBMS` identifica el tipo de interfaz de base de datos:

```powerscript
SQLCA.DBMS = "ODBC"
```

La IA no debe cambiar este valor sin revisar driver, `DBParm`, runtime instalado y configuración del proyecto.

### 31.5 `Database`

`Database` puede contener nombre de base de datos según interfaz usada:

```powerscript
SQLCA.Database = "customers"
```

En ODBC puede estar embebido en `DBParm`/connection string.

### 31.6 `UserID`

Usuario de conexión:

```powerscript
SQLCA.UserID = "appuser"
```

Debe tratarse como dato sensible.

### 31.7 `DBPass`

Contraseña de conexión:

```powerscript
SQLCA.DBPass = "secret"
```

Una IA debe evitar introducir credenciales hardcoded. Si existen, puede señalar riesgo, pero no debe exponerlas innecesariamente.

### 31.8 `DBParm`

`DBParm` concentra parámetros específicos de conexión:

```powerscript
SQLCA.DBParm = "ConnectString='DSN=MYDB;UID=user;PWD=password'"
```

Puede contener opciones de driver, DSN, isolation, owner, tracing, autocommit, encoding o parámetros específicos del DBMS.

### 31.9 `AutoCommit`

`AutoCommit` controla si las operaciones se confirman automáticamente.

```powerscript
SQLCA.AutoCommit = FALSE
```

Cambiar `AutoCommit` puede alterar transacciones y locking.

### 31.10 `SQLCode`

`SQLCode` indica resultado de la última operación SQL:

```powerscript
IF SQLCA.SQLCode = -1 THEN
    MessageBox("SQL Error", SQLCA.SQLErrText)
END IF
```

Valores frecuentes:

```text
0    → éxito.
100  → no encontrado / fin de cursor en ciertos contextos.
-1   → error.
```

### 31.11 `SQLErrText`

Texto descriptivo del error SQL:

```powerscript
MessageBox("SQL Error", SQLCA.SQLErrText)
```

No debe usarse como lógica de control salvo casos muy justificados; normalmente se usa para logging o mensajes.

### 31.12 `CONNECT USING`

Conecta usando un transaction object:

```powerscript
CONNECT USING SQLCA;
```

Después de conectar se debe comprobar `SQLCode`.

### 31.13 `COMMIT USING`

Confirma cambios:

```powerscript
COMMIT USING SQLCA;
```

Tras `COMMIT`, se inicia una nueva unidad lógica de trabajo según comportamiento transaccional.

### 31.14 `ROLLBACK USING`

Revierte cambios:

```powerscript
ROLLBACK USING SQLCA;
```

Debe conservarse especialmente en bloques de error.

### 31.15 `DISCONNECT USING`

Desconecta:

```powerscript
DISCONNECT USING SQLCA;
```

Puede implicar confirmación automática según contexto y configuración, por lo que no debe moverse sin revisar transacciones pendientes.

### 31.16 Transaction como logical unit of work

Una transacción agrupa una o más operaciones SQL que deben confirmarse o revertirse como unidad.

Patrón típico:

```powerscript
CONNECT USING SQLCA;

UPDATE customer
SET name = :ls_name
WHERE id = :ll_id;

IF SQLCA.SQLCode = 0 THEN
    COMMIT USING SQLCA;
ELSE
    ROLLBACK USING SQLCA;
END IF
```

### 31.17 Multiple database connections

Si la aplicación usa varias bases de datos, pueden existir varios transaction objects:

```powerscript
transaction ltr_source
transaction ltr_target
```

Una IA debe rastrear qué DataWindow/DataStore/SQL usa cada transacción.

### 31.18 Transaction pooling

Algunas aplicaciones optimizan conexiones usando pooling. Una IA debe evitar introducir `CONNECT`/`DISCONNECT` repetitivos sin revisar estrategia de conexión.

### 31.19 Isolation y `Lock`

La propiedad `Lock` puede mapearse a isolation levels según DBMS/interfaz:

```powerscript
SQLCA.Lock = "RC"
```

Cambiar isolation afecta concurrencia, bloqueos, lecturas sucias y consistencia.

### 31.20 ODBC, OLE DB, ADO.NET y native database interfaces

PowerBuilder soporta distintas interfaces. ODBC es frecuente en proyectos legacy y empresariales.

La IA debe considerar:

```text
- driver instalado;
- bitness 32/64;
- DSN de usuario/sistema;
- connection string;
- PBODB.ini;
- SQL dialect;
- stored procedures;
- tipo de cursor;
- locking.
```

### 31.21 Consideraciones específicas DB2/ODBC

En proyectos DB2 vía ODBC, una IA debe ser especialmente prudente con:

```text
- sintaxis SQL propia de DB2;
- aislamiento y locks;
- packages/bindings;
- conversiones de tipos;
- fechas y timestamps;
- stored procedures;
- `SQLCode` y mensajes ODBC;
- `DBParm` específico;
- uso de `LOCAL` si el proyecto lo considera transacción válida;
- formato SQL oficial del proyecto.
```

Reglas para IA:

```text
1. No cambiar `SQLCA` por otro transaction object sin revisar todo el flujo.
2. No mover COMMIT/ROLLBACK sin analizar unidad lógica de trabajo.
3. No eliminar comprobaciones de SQLCode.
4. No hardcodear credenciales.
5. No cambiar AutoCommit sin justificar.
6. No asumir que SetTrans y SetTransObject son equivalentes.
7. No normalizar SQL específico de DBMS sin validación.
8. Revisar DataWindow/DataStore asociado a cada transaction object.
```

---

## 32. DataWindow y transacciones

DataWindow y DataStore necesitan una transacción para recuperar o actualizar datos cuando su fuente es una base de datos. PowerBuilder ofrece dos modelos principales: transacción interna mediante `SetTrans` y transacción controlada por programador mediante `SetTransObject`.

La diferencia entre ambos modelos es crítica para rendimiento, locking, commits, rollbacks y consistencia de datos.

### 32.1 DataWindow database access flow

Flujo típico:

```text
1. Configurar transaction object.
2. Conectar a base de datos.
3. Asociar transaction object al DataWindow/DataStore.
4. Ejecutar Retrieve/Update.
5. Confirmar o revertir cambios si aplica.
6. Desconectar cuando corresponda.
```

Ejemplo:

```powerscript
SQLCA.DBMS = "ODBC"
SQLCA.DBParm = "ConnectString='DSN=MYDB'"
CONNECT USING SQLCA;

dw_1.SetTransObject(SQLCA)
dw_1.Retrieve()
```

### 32.2 Internal transaction management

Con internal transaction management, el DataWindow maneja conexión/desconexión de forma automática. Esto suele implicar más overhead y menos control transaccional.

Se usa mediante `SetTrans`.

### 32.3 Separate transaction object

Con separate transaction object, el programador controla conexión, commit y rollback. Se usa mediante `SetTransObject`.

```powerscript
dw_1.SetTransObject(SQLCA)
```

Este patrón suele ser preferible para aplicaciones con control transaccional explícito.

### 32.4 `SetTrans`

`SetTrans` copia valores del transaction object a la transacción interna del DataWindow/DataStore.

```powerscript
dw_1.SetTrans(SQLCA)
dw_1.Retrieve()
```

Con este modelo, el DataWindow conecta y desconecta según necesidad.

### 32.5 `SetTransObject`

`SetTransObject` asocia el DataWindow/DataStore con un transaction object controlado por el programador.

```powerscript
dw_1.SetTransObject(SQLCA)
```

El programador debe hacer:

```powerscript
CONNECT USING SQLCA;
COMMIT USING SQLCA;
ROLLBACK USING SQLCA;
DISCONNECT USING SQLCA;
```

según proceda.

### 32.6 Retrieve y Update

`Retrieve` recupera datos:

```powerscript
li_rc = dw_1.Retrieve(ll_customerId)
```

`Update` envía cambios a base de datos:

```powerscript
li_rc = dw_1.Update()
```

### 32.7 Commit/Rollback después de Update

Patrón típico con `SetTransObject`:

```powerscript
IF dw_1.Update() = 1 THEN
    COMMIT USING SQLCA;
ELSE
    ROLLBACK USING SQLCA;
END IF
```

Una IA no debe eliminar `COMMIT`/`ROLLBACK` ni moverlos fuera del flujo sin comprender todas las operaciones asociadas.

### 32.8 Composite DataWindows

Composite DataWindows pueden requerir `SetTransObject`, porque contienen otros DataWindows y no tienen la misma información transaccional interna.

Una IA debe ser conservadora al cambiar transacciones en composites o nested reports.

### 32.9 Cambio de DataObject y pérdida de asociación transaccional

Si se cambia el DataObject de un control o se crea un DataWindow dinámicamente, puede ser necesario volver a llamar `SetTrans` o `SetTransObject`.

```powerscript
dw_1.DataObject = "d_customer"
dw_1.SetTransObject(SQLCA)
```

Tras `Create` dinámico:

```powerscript
dw_1.Create(ls_syntax, ls_error)
dw_1.SetTransObject(SQLCA)
```

### 32.10 Performance y locks

`SetTransObject` evita conectar/desconectar en cada operación y permite controlar commits periódicos, pero puede mantener locks más tiempo si el programador no confirma o revierte.

`SetTrans` puede ser más simple pero menos eficiente y menos flexible.

### 32.11 Cuándo usar `SetTrans` y cuándo `SetTransObject`

Criterio práctico:

```text
Usar SetTransObject cuando:
  - se requiere control transaccional explícito;
  - se ejecutan Retrieve/Update frecuentes;
  - se actualizan varias DataWindows como una unidad;
  - se necesita COMMIT/ROLLBACK manual;
  - se busca rendimiento.

Usar SetTrans cuando:
  - solo se recuperan datos simples;
  - se prefiere conexión automática;
  - el control transaccional no es crítico;
  - el proyecto ya sigue ese patrón.
```

Reglas para IA:

```text
1. No cambiar SetTrans por SetTransObject sin añadir CONNECT/COMMIT/ROLLBACK correcto.
2. No cambiar SetTransObject por SetTrans si hay updates coordinados.
3. Revisar llamadas a Retrieve/Update después de asignar DataObject.
4. Revisar Composite DataWindows.
5. Revisar DataStores no visuales.
6. Revisar rollback en errores.
7. Revisar transaction object activo en cada DataWindow/DataStore.
```

---

## 33. DataWindow como sublenguaje

DataWindow es una de las partes más distintivas de PowerBuilder. No es simplemente un control visual ni un conjunto de funciones: es una tecnología con objeto propio, sintaxis propia, motor de expresiones, propiedades, buffers, SQL/PBSELECT, eventos, controles internos y capacidad de actualización.

Una IA debe tratar `.srd` y DataWindow expressions como un sublenguaje independiente. Parsear DataWindow como PowerScript normal es un error grave.

### 33.1 DataWindow Technology

DataWindow Technology combina:

```text
- definición de fuente de datos;
- presentación visual/reporting;
- reglas de actualización;
- validaciones;
- expresiones;
- controles internos;
- buffers de datos;
- interacción con transaction objects.
```

### 33.2 DataWindow object

El DataWindow object define:

```text
- data source;
- presentation style;
- columns;
- update properties;
- display formats;
- validation rules;
- sort/filter;
- controls internos;
- expressions;
- SQL/PBSELECT.
```

Se almacena normalmente como `.srd` cuando está exportado o en Solution.

### 33.3 DataWindow control/component

El DataWindow control es el contenedor visual que muestra y manipula un DataWindow object.

```powerscript
dw_1.DataObject = "d_customer"
dw_1.SetTransObject(SQLCA)
dw_1.Retrieve()
```

### 33.4 DataStore

Un DataStore es un contenedor no visual para un DataWindow object. Permite recuperar, manipular, copiar, filtrar, ordenar y actualizar datos sin interfaz.

```powerscript
datastore lds_customer
lds_customer = CREATE datastore
lds_customer.DataObject = "d_customer"
lds_customer.SetTransObject(SQLCA)
lds_customer.Retrieve()
```

### 33.5 DataWindowChild

`DataWindowChild` representa nested reports o DropDownDataWindows dentro de un DataWindow.

Patrón típico:

```powerscript
DataWindowChild ldwc_child
li_rc = dw_1.GetChild("status_id", ldwc_child)
```

Después puede asociarse transacción y recuperar datos del child.

### 33.6 Data source

La fuente de datos puede ser SQL, query, stored procedure, external, etc.

Una IA debe distinguir:

```text
- SQL SELECT real;
- PBSELECT interno;
- stored procedure;
- external data;
- DataWindow dynamic syntax.
```

### 33.7 Presentation style

Presentation style define cómo se presentan los datos:

```text
- Tabular;
- Freeform;
- Grid;
- Label;
- Group;
- Composite;
- Crosstab;
- Graph;
- RichText;
- N-Up;
- TreeView;
- otros estilos según versión.
```

### 33.8 Columns

Las columnas representan datos recuperados o definidos. Pueden tener propiedades visuales, validaciones, edit styles y expressions.

### 33.9 Controls internos

Un DataWindow object contiene controles internos:

```text
- columns;
- text;
- computed fields;
- lines;
- rectangles;
- pictures;
- reports;
- graphs;
- buttons;
- table blobs;
- OLE controls.
```

### 33.10 Bands

Los bands organizan presentación:

```text
- header;
- detail;
- footer;
- summary;
- group headers/footers;
- trailer;
- background.
```

### 33.11 Computed fields

Los computed fields contienen DataWindow expressions:

```text
If(status = 'A', 'Active', 'Inactive')
Sum(amount for group 1)
```

No deben interpretarse como PowerScript.

### 33.12 Validation rules

Las columnas pueden tener reglas de validación. Esto afecta `ItemChanged`, `ItemError` y aceptación de datos.

### 33.13 Filters

Un filter oculta filas sin eliminarlas. Las filas filtradas pasan al Filter buffer.

```powerscript
dw_1.SetFilter("status = 'A'")
dw_1.Filter()
```

### 33.14 Sorts

Ordenación de filas:

```powerscript
dw_1.SetSort("name A")
dw_1.Sort()
```

### 33.15 Graphs

DataWindow puede incluir gráficos internos. Las propiedades de gráficos también pueden modificarse con dot notation, Describe o Modify.

### 33.16 Crosstabs

Los crosstabs agregan y pivotan datos. Una IA debe tener cuidado con aggregate expressions y dependencias.

### 33.17 Reports y nested reports

Un DataWindow puede contener reports anidados. Las rutas de propiedades pueden incluir varios niveles `Object`.

### 33.18 DropDownDataWindow / DDDW

Una columna puede usar DropDownDataWindow. Esto crea dependencia entre DataWindow principal y DataWindow child.

### 33.19 PSR

Un PSR es un reporte guardado, normalmente no actualizable, que contiene definición y datos al momento de guardarse. No debe tratarse igual que un DataWindow recuperable normal.

### 33.20 `.srd` no es PowerScript

Regla crítica:

```text
Un archivo .srd NO debe parsearse como PowerScript.
```

`.srd` contiene syntax DataWindow: propiedades, controles, SQL/PBSELECT, bands, expressions, etc.

Reglas para IA:

```text
1. Separar PowerScript y DataWindow syntax.
2. Tratar DataWindow expressions como sublenguaje.
3. No renombrar columnas dentro de strings sin modelo DataWindow.
4. No asumir que DataObject literal existe sin buscar el .srd.
5. No cambiar DataWindow properties sin conocer Describe/Modify syntax.
6. Revisar transaction object tras asignar DataObject o Create.
7. Reconocer DataWindowChild/DDDW/nested reports.
```

---

## 34. DataWindow runtime, buffers y edición

El runtime de DataWindow gestiona datos mediante buffers y un edit control interno. Para entender eventos como `ItemChanged`, validaciones, `AcceptText`, `Update`, filtros y borrados, una IA debe conocer este modelo.

### 34.1 Primary buffer

Contiene filas activas no filtradas ni borradas.

```powerscript
ll_count = dw_1.RowCount()
```

Por defecto, muchas operaciones trabajan sobre Primary buffer.

### 34.2 Filter buffer

Contiene filas filtradas. No están visibles, pero siguen formando parte del conjunto de datos gestionado por el DataWindow.

```powerscript
dw_1.SetFilter("status = 'A'")
dw_1.Filter()
```

### 34.3 Delete buffer

Contiene filas eliminadas por usuario o script. Se usa durante `Update` para enviar deletes a la base de datos si el DataWindow es actualizable.

```powerscript
dw_1.DeleteRow(ll_row)
```

### 34.4 Edit control interno

Cuando el usuario edita una celda, el texto todavía puede estar en el edit control interno, no aceptado en el buffer.

### 34.5 Text frente a item

Diferencia:

```text
Text → valor temporal en el edit control.
Item → valor aceptado en el buffer DataWindow.
```

Antes de guardar, puede ser necesario llamar `AcceptText`.

### 34.6 Conversión al datatype de columna

Al aceptar texto, DataWindow intenta convertirlo al datatype de la columna. Si falla, puede disparar `ItemError`.

### 34.7 `ItemChanged`

`ItemChanged` ocurre cuando una celda modificada pierde foco y el valor puede aceptarse.

```powerscript
event itemchanged;
    // validar o ajustar valor
end event
```

### 34.8 `ItemError`

`ItemError` ocurre cuando el valor no cumple datatype/validación.

```powerscript
event itemerror;
    MessageBox("Error", "Invalid value")
end event
```

### 34.9 `ItemFocusChanged`

Se dispara cuando cambia el item actual. Puede usarse para lógica visual o validaciones dependientes de foco.

### 34.10 `AcceptText`

`AcceptText` fuerza a aceptar el texto pendiente del edit control al buffer.

```powerscript
IF dw_1.AcceptText() <> 1 THEN
    return -1
END IF
```

Debe llamarse antes de `Update` si hay edición pendiente.

### 34.11 Rows, columns y current row

Funciones frecuentes:

```powerscript
ll_row = dw_1.GetRow()
ll_count = dw_1.RowCount()
ls_name = dw_1.GetItemString(ll_row, "name")
```

### 34.12 `Retrieve`

Recupera filas desde la fuente de datos:

```powerscript
li_rc = dw_1.Retrieve(ll_customerId)
```

Debe coincidir con argumentos definidos en el DataWindow.

### 34.13 `Update`

Envía cambios a base de datos:

```powerscript
li_rc = dw_1.Update()
```

Con `SetTransObject`, normalmente debe ir seguido de `COMMIT` o `ROLLBACK`.

### 34.14 `RowsCopy`, `RowsMove`, `ShareData`

Ejemplos:

```powerscript
dw_1.RowsCopy(1, dw_1.RowCount(), Primary!, lds_copy, 1, Primary!)
dw_1.RowsMove(1, 1, Primary!, dw_2, 1, Primary!)
dw_1.ShareData(dw_2)
```

Una IA debe reconocer `Primary!`, `Filter!` y `Delete!` como enum values.

### 34.15 DataStore buffers

DataStore usa buffers similares a DataWindow control, aunque no tenga UI visible.

Reglas para IA:

```text
1. Llamar AcceptText antes de Update si hay edición pendiente.
2. Distinguir text temporal de item en buffer.
3. No ignorar Delete buffer.
4. No contar solo RowCount si se necesitan filas filtradas/borradas.
5. Revisar Retrieve args.
6. Revisar Update + transaction handling.
7. No confundir DataStore con estructura simple de datos.
```

---

## 35. DataWindow properties, expressions y property paths

DataWindow permite consultar y modificar propiedades mediante dot notation, `Describe` y `Modify`. Las property paths pueden referirse al DataWindow completo, columnas, controles internos, reports anidados, DDDW y propiedades complejas.

Una IA debe separar tres conceptos:

```text
DataWindow object property     → propiedad del objeto DataWindow.
DataWindow property expression → expresión PowerBuilder para acceder/modificar propiedad.
DataWindow expression          → sublenguaje evaluado por el motor DataWindow.
```

### 35.1 DataWindow object properties frente a DataWindow control properties

El DataWindow control es el contenedor visual. El DataWindow object es la definición interna.

```powerscript
dw_1.Visible = TRUE                         // propiedad del control
ls_select = dw_1.Object.DataWindow.Table.Select // propiedad del DataWindow object
```

### 35.2 `dwcontrol.Object`

`Object` indica acceso al DataWindow object dentro del control:

```powerscript
ls_name = dw_1.Object.customer_name[1]
```

### 35.3 `dwcontrol.Object.DataWindow`

`DataWindow` como path root representa propiedades del DataWindow object completo:

```powerscript
ls_select = dw_1.Object.DataWindow.Table.Select
```

### 35.4 `dwcontrol.Object.column.property`

Acceso a propiedades de columna:

```powerscript
dw_1.Object.customer_name.Visible = TRUE
dw_1.Object.customer_name.Protect = "1"
```

### 35.5 Nested `Object`

Para reports anidados o DDDW, pueden aparecer varios niveles `Object`:

```powerscript
ls_value = dw_1.Object.rpt_orders.Object.order_id.Text
```

### 35.6 DDDW property paths

Una columna con DropDownDataWindow puede tener propiedades relacionadas con `dddw`:

```powerscript
ls_dddw = dw_1.Describe("status_id.dddw.Name")
```

### 35.7 Report property paths

Reports anidados se referencian como controles internos del DataWindow.

```powerscript
ls_reportDataObject = dw_1.Describe("rpt_detail.DataObject")
```

### 35.8 `Describe`

`Describe` consulta propiedades y puede evaluar expressions:

```powerscript
ls_select = dw_1.Describe("DataWindow.Table.Select")
ls_type = dw_1.Describe("customer_id.ColType")
```

Si una propiedad es inválida, `Describe` puede devolver indicadores especiales como `!` o `?`.

### 35.9 `Modify`

`Modify` cambia propiedades o incluso puede modificar estructura interna del DataWindow:

```powerscript
ls_err = dw_1.Modify("customer_name.Visible=0")
```

Con expressions:

```powerscript
ls_err = dw_1.Modify("salary.Color='0~tIf(salary > 1000,255,0)'")
```

### 35.10 `Evaluate`

`Evaluate` se usa dentro de `Describe` para evaluar DataWindow expressions:

```powerscript
ls_page = dw_1.Describe("Evaluate('Page()', " + String(dw_1.GetRow()) + ")")
```

### 35.11 `defaultvalue~tDataWindowExpression`

Cuando una propiedad acepta expresión condicional, en código se expresa con default value + tab `~t` + DataWindow expression:

```powerscript
dw_1.Object.amount.Color = "0~tIf(amount > 1000, 255, 0)"
```

### 35.12 `DataWindow.Table.Select`

Path frecuente para obtener/modificar SELECT:

```powerscript
ls_select = dw_1.Describe("DataWindow.Table.Select")
```

La cadena devuelta puede ser SQL o PBSELECT según contexto y conexión.

### 35.13 PBSELECT frente a SQL SELECT

PowerBuilder puede almacenar PBSELECT internamente. Una IA no debe asumir que todo valor de `Table.Select` es SQL directo y listo para parsear.

### 35.14 Nested quotes y escapes

`Modify` y expressions en strings suelen requerir escapes:

```powerscript
ls_err = dw_1.Modify("emp_lname.Background.Color='16777215~tIf(state = ~'MA~', 400, 700)'")
```

Una IA debe ser extremadamente conservadora al reescribir strings con comillas anidadas.

### 35.15 Expressions en painter frente a expressions en código

En el painter se escribe solo la DataWindow expression:

```text
If(status = 'A', 255, 0)
```

En código se suele incluir default value y `~t`:

```powerscript
"0~tIf(status = 'A', 255, 0)"
```

### 35.16 User-defined global functions en DataWindow expressions

DataWindow expressions pueden llamar global functions bajo ciertas restricciones. Una IA debe considerar que una global function aparentemente no usada puede estar referenciada desde DataWindow expressions.

### 35.17 Aggregate function restrictions

Aggregate functions como `Sum`, `Avg`, `Count`, etc. tienen restricciones según contexto: no siempre pueden usarse en filtros, validaciones o como argumentos de otras aggregates.

### 35.18 Notación numérica US en DataWindow expressions

DataWindow expressions y formatos suelen usar notación numérica US para masks y números, aunque la app se despliegue en otro locale.

Reglas para IA:

```text
1. Distinguir control property y DataWindow object property.
2. No parsear Modify string como PowerScript normal.
3. Preservar escapes y comillas.
4. Reconocer defaultvalue~tExpression.
5. Considerar DDDW y reports anidados.
6. No asumir que Table.Select siempre es SQL puro.
7. Buscar global functions usadas dentro de DataWindow expressions.
8. No renombrar columnas en property paths sin modelo DataWindow.
```

---

## 36. DataWindow data expressions

DataWindow data expressions permiten acceder directamente a datos del DataWindow object mediante la propiedad `Object`. No son iguales que DataWindow property expressions: unas acceden a datos; otras a propiedades.

### 36.1 Acceso directo a datos con `Object`

Ejemplo:

```powerscript
ls_name = dw_1.Object.customer_name[1]
```

Esto obtiene el valor de la columna `customer_name` en la fila 1.

### 36.2 Data in named columns

Acceso a columna conocida:

```powerscript
ls_name = dw_1.Object.customer_name[ll_row]
```

Si se omite fila en ciertos contextos, puede devolverse un array.

### 36.3 Selected items

Acceso a datos seleccionados:

```powerscript
la_names = dw_1.Object.customer_name.Primary.Selected
```

La IA debe distinguir `Selected` como parte de DataWindow data expression, no como propiedad genérica PowerScript.

### 36.4 Ranges

Se puede acceder a un rango de filas:

```powerscript
la_values = dw_1.Object.amount.Primary[1, 10]
```

### 36.5 Data in numbered columns

Acceso por número de columna:

```powerscript
la_value = dw_1.Object.Data.Primary[ll_row, li_column]
```

### 36.6 Whole rows

Puede accederse a filas completas como structures/user objects según contexto:

```powerscript
la_row = dw_1.Object.Data.Primary[ll_row]
```

### 36.7 Selected rows

```powerscript
la_rows = dw_1.Object.Data.Primary.Selected
```

### 36.8 Buffers en data expressions

Buffers posibles:

```text
Primary
Filter
Delete
```

Ejemplos:

```powerscript
ls_name = dw_1.Object.customer_name.Primary[1]
ls_deleted = dw_1.Object.customer_name.Delete[1]
```

### 36.9 Data expressions frente a DataWindow property expressions

Comparación:

```powerscript
// Data expression: datos
ls_name = dw_1.Object.customer_name[1]

// Property expression: propiedad del control interno
ls_visible = dw_1.Object.customer_name.Visible
```

Ambas usan `Object`, pero significan cosas distintas.

### 36.10 Riesgos de análisis con expressions dinámicas

Si columna o buffer se construye dinámicamente, baja la confianza:

```powerscript
ls_expr = "customer_name[" + String(ll_row) + "]"
ls_value = dw_1.Describe("Evaluate('" + ls_expr + "', 0)")
```

Reglas para IA:

```text
1. Distinguir datos y propiedades.
2. Reconocer buffers Primary/Filter/Delete.
3. No confundir columna con variable PowerScript.
4. No asumir tipo sin modelo DataWindow.
5. Degradar confianza si el path se construye por string.
6. Revisar selected/ranges antes de cambiar estructura.
```

---

## 37. DataWindow dinámico

PowerBuilder permite crear o modificar DataWindow objects dinámicamente en runtime. Esto es potente, pero reduce la posibilidad de análisis estático. Una IA debe tratar cualquier DataWindow generado por string como zona de baja confianza.

### 37.1 `Create`

`Create` crea un DataWindow object desde syntax:

```powerscript
string ls_syntax
string ls_error

ls_error = dw_1.Create(ls_syntax)
```

Después de `Create`, puede ser necesario volver a configurar transacción.

### 37.2 `SyntaxFromSQL`

`SyntaxFromSQL` genera syntax DataWindow desde un SELECT y opciones de presentación:

```powerscript
ls_syntax = SQLCA.SyntaxFromSQL(ls_sql, ls_presentation, ls_error)
```

Requiere transaction object conectado y metadata disponible.

### 37.3 `LibraryExport`

`LibraryExport` puede obtener source de un objeto de librería. Se puede usar para DataWindows u otros objetos según contexto.

```powerscript
ls_syntax = LibraryExport("app.pbl", "d_customer", ExportDataWindow!)
```

### 37.4 Crear DataWindow source en runtime

Algunas aplicaciones generan syntax manualmente:

```powerscript
ls_syntax = "release 19; datawindow(...) table(...)"
```

Esto es difícil de validar sin parser DataWindow.

### 37.5 Reset de transaction object tras `Create`

Tras crear o reemplazar el DataWindow object dentro del control, la asociación transaccional puede perderse:

```powerscript
dw_1.Create(ls_syntax, ls_error)
dw_1.SetTransObject(SQLCA)
```

### 37.6 Dynamic DataWindow processing

Incluye:

```text
- modificar SELECT;
- crear controles internos;
- cambiar propiedades;
- añadir filtros/sorts;
- generar reports;
- cambiar update properties;
- cambiar DataObject en runtime.
```

### 37.7 Riesgos de strings dinámicos

Si DataWindow syntax o property paths se construyen por concatenación:

```powerscript
ls_mod = as_column + ".Visible=0"
dw_1.Modify(ls_mod)
```

El análisis debe degradar confianza.

### 37.8 Qué puede y no puede inferir una IA

Puede inferir con confianza media/alta:

```text
- DataObject literal directo;
- property path literal directo;
- Retrieve args si DataWindow está localizado;
- columnas simples si .srd está disponible.
```

Debe degradar confianza con:

```text
- Create con syntax construida;
- SyntaxFromSQL dinámico;
- Modify construido por string;
- Describe/Evaluate dinámico;
- DataObject variable;
- SQL concatenado.
```

Reglas para IA:

```text
1. No fingir certeza cuando DataWindow se genera en runtime.
2. Reaplicar SetTransObject/SetTrans después de Create si procede.
3. No modificar syntax manual sin parser/modelo.
4. No renombrar columnas en strings dinámicos sin evidencia.
5. Detectar SyntaxFromSQL como dependencia SQL + metadata DB.
6. Revisar errores devueltos por Create/Modify.
```

---

## 38. Recursos y configuración externa

PowerBuilder suele depender de archivos externos: recursos visuales, INI, SQL, XML, JSON, imágenes, sonidos, PBR y otros assets. Una IA debe entender que referencias importantes pueden vivir fuera de PowerScript y DataWindow.

### 38.1 `.pbr`

Un PBR es una lista de recursos usada en build:

```text
app.ico
images\logo.bmp
reports\header.png
```

Si se elimina o renombra un recurso, debe revisarse el PBR.

### 38.2 `.ini`

Los INI contienen configuración runtime:

```ini
[database]
dsn=MYDB
user=appuser
```

PowerBuilder puede leerlos con funciones de perfil.

### 38.3 `ProfileString`

Lee string desde INI:

```powerscript
ls_dsn = ProfileString("app.ini", "database", "dsn", "")
```

### 38.4 `ProfileInt`

Lee entero desde INI:

```powerscript
li_timeout = ProfileInt("app.ini", "database", "timeout", 30)
```

### 38.5 Icons, bitmaps, cursors, images y sonidos

Recursos frecuentes:

```text
.ico
.bmp
.cur
.png
.jpg
.gif
.wav
```

Pueden referenciarse desde windows, DataWindows, menus, scripts o PBR.

### 38.6 XML

PowerBuilder puede usar XML para configuración, RibbonBar, integración, datos o artefactos generados.

### 38.7 JSON

JSON puede aparecer en:

```text
- PBAutoBuild;
- REST payloads;
- configuración;
- PowerServer/PowerClient;
- APIs modernas.
```

### 38.8 SQL files

Algunas aplicaciones almacenan SQL fuera del código:

```text
scripts\create_tables.sql
queries\customer_search.sql
```

Una IA no debe limitar análisis SQL a embedded SQL.

### 38.9 HTML/JS/CSS assets

Con WebBrowser/WebView2 o HTML rendering, puede haber assets web:

```text
index.html
app.js
styles.css
```

### 38.10 Recursos en builds

PBAutoBuild, OrcaScript o Project painter pueden incluir recursos. El hecho de que un archivo no aparezca en PowerScript no significa que no se use.

### 38.11 Recursos referenciados desde DataWindow

DataWindow puede referenciar imágenes o recursos en propiedades internas.

### 38.12 Recursos referenciados desde PowerScript

Ejemplos:

```powerscript
p_1.PictureName = "images\logo.bmp"
li_rc = Run("notepad.exe app.ini")
```

### 38.13 Riesgo de case sensitivity en source control

Windows suele ser case-insensitive, pero Git y despliegues pueden introducir riesgos con casing:

```text
Logo.bmp
logo.bmp
```

Reglas para IA:

```text
1. Buscar referencias en scripts, DataWindow, PBR, INI, XML, JSON y build files.
2. No eliminar recursos aparentemente no usados sin revisar PBR/build.
3. No exponer secretos de INI/JSON.
4. Preservar rutas relativas.
5. Revisar casing en repositorios Git.
6. Distinguir recurso source de artefacto generado.
```

---

## 39. External functions y DLL

PowerBuilder permite declarar funciones externas escritas en otros lenguajes y almacenadas en DLLs u otras dynamic libraries. Estas funciones no tienen implementación PowerScript visible y deben tratarse como símbolos externos.

### 39.1 Global external functions

Disponibles desde cualquier script de la aplicación tras su declaración.

```powerscript
FUNCTION long GetTickCount() LIBRARY "kernel32.dll"
```

### 39.2 Local external functions

Declaradas dentro de un objeto, como Window o User Object. Forman parte de la definición de ese objeto.

```powerscript
private function long MyNativeCall() library "mylib.dll"
```

### 39.3 External subroutines

Si no devuelven valor, se declaran como subroutine:

```powerscript
SUBROUTINE Sleep(ulong milliseconds) LIBRARY "kernel32.dll"
```

### 39.4 `LIBRARY`

Indica DLL o librería externa:

```powerscript
FUNCTION long Foo() LIBRARY "foo.dll"
```

### 39.5 `ALIAS FOR`

Permite mapear nombre PowerBuilder a nombre real exportado:

```powerscript
FUNCTION long Foo() LIBRARY "foo.dll" ALIAS FOR "FooA"
```

También puede usarse si el nombre externo no es un identificador PowerScript válido.

### 39.6 `REF`

`REF` permite pasar argumentos por referencia al código externo:

```powerscript
FUNCTION long GetValue(ref long al_value) LIBRARY "native.dll"
```

Debe respetarse estrictamente porque afecta ABI y memoria.

### 39.7 Datatype mapping

Los datatypes de PowerBuilder deben corresponder con los tipos esperados por la DLL. Cambiar un tipo puede causar crashes.

Especial atención:

```text
- string;
- char arrays;
- blob;
- longptr;
- 32/64-bit pointers;
- structures;
- REF parameters.
```

### 39.8 `_stdcall` / WINAPI

PowerBuilder espera calling convention compatible con Windows API para DLLs. Una calling convention incorrecta puede provocar crash.

### 39.9 32-bit y 64-bit

La bitness debe coincidir:

```text
Aplicación 32-bit → DLL 32-bit.
Aplicación 64-bit → DLL 64-bit.
```

`Longptr` puede ser importante para compatibilidad.

### 39.10 Deployment de DLL

La DLL debe estar en path accesible en runtime:

```text
- carpeta del ejecutable;
- PATH del sistema;
- ruta configurada;
- deployment bundle;
- runtime folder.
```

### 39.11 Diferencia con PBX/PBNI

Una external function DLL expone funciones procedurales. Una PBX/PBNI puede exponer clases, funciones y objetos integrados como user objects.

### 39.12 Diferencia con RPCFUNC

`RPCFUNC` declara stored procedures en DBMS, no funciones en DLL.

```powerscript
FUNCTION long sp_update(long al_id) RPCFUNC
```

### 39.13 Riesgos de crash por calling convention

External functions pueden provocar crashes por:

```text
- firma incorrecta;
- REF mal usado;
- buffer insuficiente;
- string encoding incompatible;
- calling convention incorrecta;
- DLL 32/64-bit incorrecta;
- DLL ausente;
- dependencia nativa ausente.
```

Reglas para IA:

```text
1. No cambiar firmas external sin documentación nativa.
2. No cambiar REF.
3. No cambiar long/longptr sin revisar bitness.
4. No eliminar ALIAS FOR.
5. No tratar DLL external como PowerScript interno.
6. No prometer rename seguro dentro de DLL.
7. Revisar deployment y PATH.
8. Distinguir external function, RPCFUNC y PBX.
```

---

## 40. RPCFUNC y stored procedures

PowerBuilder permite declarar stored procedures como remote procedure calls mediante `RPCFUNC`, normalmente en un user object heredado de `Transaction` o directamente asociado al transaction object. Esto permite llamar stored procedures con dot notation.

### 40.1 Stored procedures como RPC

Un stored procedure puede exponerse como función PowerBuilder:

```powerscript
FUNCTION long sp_update_customer(long al_id, string as_name) RPCFUNC
```

Y llamarse como método del transaction object:

```powerscript
SQLCA.sp_update_customer(ll_id, ls_name)
```

### 40.2 `RPCFUNC`

`RPCFUNC` indica que la declaración corresponde a un procedimiento o función del DBMS, no a una DLL.

```powerscript
SUBROUTINE sp_recalculate(long al_id) RPCFUNC
```

### 40.3 Dot notation sobre Transaction object

La llamada se realiza sobre el transaction object:

```powerscript
ltr_custom.sp_process(ll_id)
```

Esto significa que el tipo del transaction object puede importar, especialmente si `SQLCA` se redefine como descendant custom.

### 40.4 FUNCTION frente a SUBROUTINE

Si el stored procedure devuelve valor, se declara como function:

```powerscript
FUNCTION long sp_count_customer() RPCFUNC
```

Si no devuelve valor, como subroutine:

```powerscript
SUBROUTINE sp_update_status(long al_id, string as_status) RPCFUNC
```

### 40.5 `REF`

Los parámetros de salida o entrada/salida se declaran con `REF`:

```powerscript
SUBROUTINE sp_get_name(long al_id, ref string as_name) RPCFUNC
```

La variable pasada debe tener tamaño/tipo adecuado, especialmente con strings.

### 40.6 `ALIAS FOR`

Permite mapear nombre PowerBuilder a nombre real en la base de datos:

```powerscript
SUBROUTINE updateCustomer(long al_id) RPCFUNC ALIAS FOR "sp_update_customer"
```

No debe eliminarse ni cambiarse sin revisar DBMS.

### 40.7 Result sets y limitaciones

`RPCFUNC` no es la opción adecuada para procesar result sets de stored procedures si el DBMS devuelve filas. Para result sets suele usarse embedded SQL con `DECLARE PROCEDURE`, `EXECUTE`, `FETCH` y `CLOSE`.

### 40.8 Stored procedures vía embedded SQL

Ejemplo:

```powerscript
DECLARE p_customer PROCEDURE FOR get_customer :ll_id;
EXECUTE p_customer;
FETCH p_customer INTO :ls_name;
CLOSE p_customer;
```

Este patrón debe distinguirse de `RPCFUNC`.

### 40.9 Custom transaction object heredado de Transaction

Es frecuente definir un user object que hereda de `Transaction` y declara RPCFUNC dentro:

```powerscript
global type n_tr from transaction
end type

FUNCTION long sp_process(long al_id) RPCFUNC
```

Luego se usa como SQLCA o transacción custom.

### 40.10 Particularidades ODBC y DBMS concretos

Cada DBMS/driver puede tener reglas sobre:

```text
- nombres de parámetros;
- OUT/INOUT;
- result sets;
- tipos compatibles;
- schema/owner;
- package/procedure syntax;
- commit/rollback;
- SQLCode;
- callable statement syntax.
```

Reglas para IA:

```text
1. No confundir RPCFUNC con external DLL function.
2. No eliminar ALIAS FOR.
3. No cambiar REF sin revisar stored procedure.
4. No usar RPCFUNC para result sets sin validar.
5. Revisar transaction object real.
6. Revisar SQLCA custom.
7. Revisar DBMS/ODBC specifics.
8. No renombrar stored procedure sin coordinación con base de datos.
```

## 41. PBX, PBNI y extensiones nativas

PowerBuilder puede ampliarse mediante extensiones nativas. Estas extensiones suelen distribuirse como PBX y exponen clases, funciones o comportamiento implementado fuera de PowerScript, normalmente en C/C++. Para una IA, PBX/PBNI representa una frontera semántica: el objeto puede comportarse como un user object dentro de PowerBuilder, pero su implementación real no está en el source PowerScript del proyecto.

### 41.1 Qué es PBNI

PBNI significa PowerBuilder Native Interface. Es la interfaz que permite crear extensiones nativas para PowerBuilder o interactuar con la PBVM desde código externo.

Una extensión PBNI puede proporcionar:

```text
- clases no visuales;
- clases visuales;
- funciones globales;
- marshalers;
- integración con C/C++;
- acceso a DataWindow/DataStore desde código nativo;
- llamada de PowerScript desde código nativo.
```

### 41.2 Qué es una PBX

Una PBX es una librería nativa compilada, normalmente con extensión `.pbx`, que PowerBuilder puede importar como extensión.

Una vez importada, sus clases pueden aparecer en el System Tree como user objects y pueden usarse desde PowerScript.

### 41.3 Nonvisual extensions

Una extensión nonvisual expone clases que se usan como objetos no visuales:

```powerscript
n_native_regex lnv_regex

lnv_regex = CREATE n_native_regex
lb_ok = lnv_regex.of_match(ls_text, ls_pattern)
DESTROY lnv_regex
```

Aunque parezcan user objects normales, su implementación reside en la PBX.

### 41.4 Visual extensions

Una extensión visual expone controles o componentes visuales nativos. Pueden heredarse o colocarse en ventanas/user objects según el modelo de PowerBuilder.

Riesgo para IA:

```text
- puede haber eventos y propiedades expuestos por la extensión;
- la implementación no es PowerScript;
- el comportamiento puede depender de runtime nativo;
- el deployment necesita la PBX y dependencias.
```

### 41.5 Marshaler extensions

Los marshalers permiten invocar métodos en objetos remotos o proxy. Para análisis estático, esto introduce una frontera dinámica parecida a una llamada externa.

### 41.6 `PBX_GetDescription`

Función exportada por la PBX que describe las clases y funciones disponibles para PowerBuilder.

Para una IA, esta descripción puede explicar qué clases y signatures están disponibles, pero normalmente no estará en PowerScript.

### 41.7 `PBX_CreateNonVisualObject`

Función nativa usada para crear instancias de clases nonvisual expuestas por la PBX.

### 41.8 `PBX_CreateVisualObject`

Función nativa usada para crear instancias de clases visuales expuestas por la PBX.

### 41.9 `PBX_InvokeGlobalFunction`

Si la extensión expone global functions, puede implementar este entry point para invocarlas desde PowerBuilder.

### 41.10 `Invoke`

Las clases nativas implementan un método `Invoke` que recibe llamadas desde PowerBuilder y despacha a métodos nativos.

### 41.11 `Destroy`

Las clases nativas implementan `Destroy` para liberar recursos. Una IA debe tener especial cuidado con lifecycle y `DESTROY` en objetos PBX.

### 41.12 `IPB_VM`

Interfaz relacionada con la PowerBuilder VM. Puede usarse en integraciones externas avanzadas.

### 41.13 `IPB_Session`

Interfaz usada por extensiones para interactuar con la sesión PowerBuilder, crear objetos, acceder a valores, llamar funciones y trabajar con datos.

### 41.14 `IPB_Value`

Representa un valor PowerBuilder en código nativo. Puede incluir tipo, null flag, acceso, array/simple y referencia.

### 41.15 `IPB_Arguments`

Representa argumentos recibidos desde PowerScript. Es clave para la conversión entre tipos PowerBuilder y tipos C/C++.

### 41.16 `IPB_ResultSetAccessor`

Permite acceder a result sets o datos relacionados con DataWindow/DataStore desde código nativo.

### 41.17 `IPBX_NonVisualObject`

Interfaz base para clases nativas no visuales.

### 41.18 `IPBX_VisualObject`

Interfaz base para clases nativas visuales.

### 41.19 Import PB Extension

Para usar una PBX, normalmente se importa en el target. PowerBuilder genera/usa definiciones que permiten ver clases, properties, events y functions en el entorno.

### 41.20 PBXRuntimeError

Una PBX puede lanzar errores runtime específicos. Estos errores pueden aparecer como exceptions PowerBuilder.

### 41.21 32-bit/64-bit PBX deployment

La PBX debe coincidir con la arquitectura del ejecutable y runtime:

```text
PowerBuilder 32-bit → PBX 32-bit.
PowerBuilder 64-bit → PBX 64-bit.
```

También deben desplegarse dependencias nativas.

### 41.22 Cómo debe tratar esto una IA

Reglas:

```text
1. No buscar implementación PowerScript de métodos PBX.
2. No cambiar signatures expuestas por PBX sin documentación nativa.
3. No eliminar DESTROY si la extensión gestiona recursos nativos.
4. Revisar bitness 32/64.
5. Revisar deployment de PBX y DLL dependientes.
6. No confundir PBX con external function DLL simple.
7. No asumir que todos los métodos visibles son refactorizables.
8. Marcar baja confianza ante comportamiento nativo no visible.
```

---

## 42. ORCA y Library Painter

ORCA permite automatizar tareas equivalentes al Library Painter: exportar, importar, compilar, regenerar, consultar y construir objetos/librerías PowerBuilder. Es fundamental para entender source round-trip, PBL binarias y compilación fuera del IDE.

### 42.1 Qué es ORCA

ORCA es una API para manipular librerías y objetos PowerBuilder programáticamente.

Puede usarse para:

```text
- exportar objetos;
- importar objetos;
- compilar objetos;
- regenerar objetos;
- consultar librerías;
- crear PBD/DLL/EXE;
- trabajar con source control en ciertos contextos;
- automatizar builds o migraciones.
```

### 42.2 Relación con Library Painter

El Library Painter permite realizar operaciones manuales sobre PBLs. ORCA proporciona funciones programáticas equivalentes para muchas de esas tareas.

### 42.3 PBL como archivo binario con source y compiled form

En Workspace clásico, una PBL es binaria y contiene tanto representación source como compiled form. El source exportado es una representación textual derivada.

### 42.4 Exportar objetos

ORCA puede exportar objetos a texto:

```text
PBL + object name + object type → source exportado
```

El export puede incluir o no cabeceras `$PBExportHeader$` y `$PBExportComments$` según configuración.

### 42.5 Importar objetos

ORCA puede importar source a una PBL. Al importar, PowerBuilder compila el objeto para validar que el source es correcto.

Si hay errores de compilación, el objeto no debe considerarse importado correctamente.

### 42.6 Compilar objetos

ORCA permite compilar/regenerar entries existentes. Esto es útil tras cambios, migraciones o importaciones masivas.

### 42.7 Regenerar objetos

Regenerar recompila un objeto existente sin necesariamente cambiar su source.

### 42.8 Copiar, mover, borrar y renombrar objetos

ORCA puede realizar operaciones de librería parecidas al Library Painter. Una IA debe entender que estas operaciones afectan PBLs, no solo archivos sueltos.

### 42.9 Consultar objetos

ORCA puede consultar información de entries, tipos, dependencias, ancestors o referencias según función disponible.

### 42.10 Crear ejecutables y PBD/DLL

ORCA puede usarse como parte de toolchains que crean ejecutables o dynamic libraries PowerBuilder.

### 42.11 Source control operations

ORCA incluye funciones históricas relacionadas con source control, pero su compatibilidad concreta depende del modo de proyecto y proveedor.

### 42.12 Callbacks y errores de compilación

Las funciones de import/compile pueden recibir callbacks con errores de compilación:

```text
- nivel de error;
- número;
- mensaje;
- línea;
- columna;
- objeto/script afectado.
```

### 42.13 Limitación oficial: ORCA trabaja con Workspace, no Solution

ORCA debe tratarse principalmente como herramienta de Workspace/PBL. En proyectos Solution modernos puede haber diferencias importantes.

### 42.14 Riesgos del source import/export

Riesgos:

```text
- encoding incorrecto;
- headers exportados o no exportados;
- source syntax no documentada formalmente;
- diferencias entre painter y source editor;
- cambios automáticos al guardar;
- pérdida de componentes binarios;
- dependencia de library list;
- current application no configurada.
```

### 42.15 Qué significa compilar un objeto importado

Importar no es solo copiar texto: PowerBuilder valida y compila. Por eso, si una IA genera source, el criterio de éxito no es solo que el archivo exista, sino que compile/regeneré correctamente.

Reglas para IA:

```text
1. No tratar PBL binaria como texto.
2. No asumir que export source es especificación formal completa.
3. Preservar headers si el flujo los espera.
4. Revisar library list y current application.
5. Revisar encoding.
6. Considerar callbacks de compilación.
7. No asumir que ORCA funciona igual con Solution moderna.
8. Validar con compile/regenerate cuando sea posible.
```

---

## 43. OrcaScript

OrcaScript es un lenguaje de scripting para automatizar operaciones sobre aplicaciones PowerBuilder sin usar interactivamente el IDE. Es útil para builds, regeneraciones, copia de objetos y creación de PBD/EXE en entornos automatizados.

### 43.1 Qué es OrcaScript

OrcaScript permite ejecutar comandos batch sobre PowerBuilder:

```text
- abrir sesión;
- configurar library list;
- configurar application;
- copiar entradas;
- regenerar;
- construir librerías;
- construir ejecutables;
- crear librerías;
- ejecutar operaciones de source control legacy.
```

### 43.2 `start session`

Todo script debe iniciar sesión:

```text
start session
```

### 43.3 `end session`

Todo script debe cerrar sesión:

```text
end session
```

### 43.4 `set liblist`

Define lista de librerías:

```text
set liblist "app.pbl" "shared.pbl"
```

### 43.5 `set appendlib`

Añade librería a la lista:

```text
set appendlib ".\shared\shared.pbl" "y"
```

### 43.6 `set application`

Define application object actual:

```text
set application ".\app\app.pbl" "my_app"
```

### 43.7 `regenerate`

Regenera un objeto:

```text
regenerate ".\app\app.pbl" "w_main" window
```

### 43.8 `copy entry`

Copia un entry entre PBLs:

```text
copy entry ".\source.pbl" "d_customer" dw ".\target.pbl"
```

### 43.9 `build library`

Construye PBD o librería dinámica:

```text
build library ".\shared\shared.pbl" "" pbd
```

### 43.10 `build executable`

Construye ejecutable:

```text
build executable ".\bin\app.exe" ".\app.ico" ".\app.pbr" ""
```

### 43.11 `build application`

Puede ejecutar rebuild full, migrate, incremental o 3pass según comandos disponibles.

```text
build application full
```

### 43.12 `build project`

Construye un project object:

```text
build project ".\app\app.pbl" "p_app"
```

### 43.13 `create library`

Crea una PBL:

```text
create library ".\newlib.pbl" "Generated library"
```

### 43.14 Parámetros, comillas y whitespace

OrcaScript separa parámetros por whitespace y suele requerir strings entre comillas.

Una IA debe preservar comillas en rutas con espacios.

### 43.15 Builds batch sin IDE

OrcaScript se ejecuta mediante executable de OrcaScript y un archivo de comandos. Aunque no se use el IDE visualmente, el entorno PowerBuilder/runtime debe estar instalado/configurado.

### 43.16 Limitaciones con SVN/Git solution

Algunas operaciones de source control de OrcaScript no aplican igual a Git/SVN Solution moderna. Puede requerirse usar cliente Git/SVN externo.

### 43.17 Riesgos de ejecutar OrcaScript con PowerBuilder abierto

No debe ejecutarse OrcaScript sobre las mismas librerías mientras el IDE las tiene abiertas, porque puede provocar conflictos o corrupción.

Reglas para IA:

```text
1. Incluir start session/end session.
2. Configurar library list y application antes de build.
3. Preservar comillas y rutas.
4. No usar OrcaScript como si fuera PowerScript.
5. No ejecutar sobre PBLs abiertas en IDE.
6. Revisar relative paths.
7. Revisar PBR y PBD outputs.
8. No asumir compatibilidad total con Solution moderna.
```

---

## 44. PBAutoBuild y builds por línea de comandos

PBAutoBuild permite construir y desplegar proyectos PowerBuilder desde línea de comandos usando configuración exportada desde el IDE o parámetros directos. Es una herramienta importante para CI/CD y automatización moderna.

### 44.1 `PBAutoBuild250.exe`

Executable de PowerBuilder 2025 para construir proyectos:

```text
PBAutoBuild250.exe
```

### 44.2 Build files JSON

PowerBuilder puede exportar configuración de build a JSON. Este JSON contiene opciones de compilación, runtime, targets/projects y deployment.

### 44.3 Export build file desde IDE

El IDE puede exportar build files para proyectos existentes. Esto reduce errores porque parte de configuración conocida por el painter.

### 44.4 `MetaInfo`

Sección de metadata del build file.

### 44.5 `IDEVersion`

Versión de IDE usada al exportar/generar build file.

### 44.6 `RuntimeVersion`

Versión de runtime esperada.

### 44.7 Build C/S application

PBAutoBuild puede construir aplicaciones client/server PowerBuilder.

### 44.8 PowerClient build

PowerClient también puede construirse mediante PBAutoBuild con build JSON correspondiente.

### 44.9 PowerServer build

PowerServer puede introducir configuraciones y artefactos adicionales; una IA debe revisar el tipo de project antes de modificar build files.

### 44.10 `/pbc`

Indica uso del enfoque PBC para build/deploy.

```text
PBAutoBuild250 /pbc /d "app.pbw"
```

### 44.11 `/d`

Indica archivo raíz de workspace, solution, target o project:

```text
/d "app.pbw"
/d "app.pbsln"
/d "app.pbt"
/d "app.pbproj"
```

### 44.12 Entradas soportadas: `.pbw`, `.pbsln`, `.pbt`, `.pbproj`

PBAutoBuild acepta esos tipos como entrada de `/d`.

### 44.13 `.pbl` no soportado como entrada directa en `/pbc /d`

No debe pasarse una PBL como raíz directa de `/pbc /d`.

### 44.14 PBR en builds

PBAutoBuild puede usar un PBR como lista de recursos.

```text
/r "app.pbr"
```

### 44.15 Platform 32/64-bit

La plataforma de build afecta EXE, runtime, PBD, DLL y PBX.

### 44.16 Full vs incremental compilation

Full compilation recompila todo; incremental compila cambios. En CI o validaciones profundas puede preferirse full.

### 44.17 Diferencia entre PBAutoBuild, OrcaScript y ORCA

```text
ORCA       → API programática de bajo nivel.
OrcaScript → scripting batch basado en ORCA/Library Painter operations.
PBAutoBuild → herramienta moderna de build/deploy basada en proyectos/configuración.
```

Reglas para IA:

```text
1. No usar .pbl como /d directo.
2. Revisar tipo de entrada: .pbw/.pbsln/.pbt/.pbproj.
3. Preservar JSON exportado si viene del IDE.
4. Revisar RuntimeVersion/IDEVersion.
5. Revisar 32/64-bit.
6. Revisar PBR.
7. No mezclar semántica de OrcaScript y PBAutoBuild.
8. En CI, preferir validación reproducible.
```

---

## 45. Database interfaces y DBMS specifics

PowerBuilder puede conectarse mediante varias interfaces de base de datos. Cada interfaz y DBMS introduce diferencias de conexión, SQL dialect, tipos, stored procedures, locking, isolation y deployment.

### 45.1 Standard database interfaces

Interfaces estándar frecuentes:

```text
- ODBC;
- OLE DB;
- ADO.NET.
```

### 45.2 ODBC

ODBC es muy común en aplicaciones empresariales y legacy.

Aspectos importantes:

```text
- DSN;
- driver instalado;
- bitness 32/64;
- connection string;
- PBODB.ini;
- SQL dialect;
- locking/isolation;
- stored procedure syntax.
```

### 45.3 OLE DB

OLE DB puede usarse especialmente en entornos Microsoft/SQL Server legacy.

### 45.4 ADO.NET

ADO.NET puede aparecer en proyectos más modernos o integraciones .NET.

### 45.5 Native database interfaces

PowerBuilder también puede usar interfaces nativas para ciertos DBMS. Estas pueden tener diferencias en propiedades, deployment y SQL soportado.

### 45.6 DB2 vía ODBC

En DB2 vía ODBC, una IA debe revisar cuidadosamente:

```text
- formato de SQL;
- schema/owner;
- tipos DECIMAL/NUMERIC;
- DATE/TIME/TIMESTAMP;
- isolation levels;
- stored procedures;
- SQLCode/SQLErrText;
- paquetes y configuración ODBC;
- restricciones de driver.
```

### 45.7 PostgreSQL vía ODBC

PostgreSQL vía ODBC puede tener particularidades con stored procedures/functions, parámetros, tipos y configuración del driver.

### 45.8 SAP SQL Anywhere

Frecuente en ejemplos y aplicaciones PowerBuilder. Puede tener dialecto y funciones específicas.

### 45.9 SQL Server

Puede aparecer mediante ODBC, OLE DB, SNC/MSOLEDBSQL u otras interfaces. Revisar syntax T-SQL, stored procedures y identity columns.

### 45.10 Oracle

Oracle puede introducir PL/SQL, packages, ref cursors, tipos específicos y tratamiento particular de strings/NULL.

### 45.11 Stored procedures por DBMS

El soporte y sintaxis de stored procedures varía según DBMS e interfaz.

### 45.12 Locking e isolation

`Lock`/isolation impacta:

```text
- lecturas sucias;
- bloqueos;
- concurrencia;
- deadlocks;
- consistencia;
- rendimiento.
```

### 45.13 PBODB.ini

En ODBC, PBODB.ini puede controlar funciones, sintaxis y comportamiento del driver.

### 45.14 DBParm

`DBParm` puede contener opciones específicas de interfaz/driver:

```powerscript
SQLCA.DBParm = "ConnectString='DSN=MYDB',DisableBind=1"
```

### 45.15 Consideraciones de portabilidad SQL

No todo SQL es portable. Una IA no debe cambiar SQL específico del DBMS por “SQL estándar” si el proyecto depende del dialecto.

Reglas para IA:

```text
1. Identificar DBMS e interfaz antes de modificar SQL.
2. Revisar DBParm y PBODB.ini.
3. Revisar bitness del driver.
4. No cambiar isolation sin entender concurrencia.
5. No asumir portabilidad entre DBMS.
6. Revisar stored procedure syntax específica.
7. Mantener formato SQL oficial del proyecto si existe.
```

---

## 46. Integraciones modernas del runtime

PowerBuilder moderno incluye objetos para HTTP, REST, JSON, OAuth, WebBrowser/WebView, .NET, PDF, compresión y criptografía. Estas integraciones suelen usar strings dinámicos, endpoints, payloads y objetos externos, por lo que reducen certeza estática.

### 46.1 `HTTPClient`

Permite realizar peticiones HTTP.

```powerscript
HTTPClient lhc_client
lhc_client = CREATE HTTPClient
li_rc = lhc_client.SendRequest("GET", ls_url)
```

### 46.2 `RESTClient`

Cliente de REST APIs, normalmente con JSON, endpoints y status codes.

### 46.3 `InternetResult`

Puede representar resultado de operaciones de red/internet.

### 46.4 `ResourceResponse`

Relacionado con respuestas de recursos, especialmente en integraciones web.

### 46.5 `JSONParser`

Parsea JSON.

```powerscript
JSONParser ljp
ljp = CREATE JSONParser
ljp.LoadString(ls_json)
```

### 46.6 `JSONGenerator`

Genera JSON:

```powerscript
JSONGenerator ljg
ljg = CREATE JSONGenerator
```

### 46.7 `JSONPackage`

Puede usarse para empaquetar/intercambiar estructuras JSON.

### 46.8 `OAuthClient`

Gestiona flujos OAuth. Debe tratarse como sensible porque maneja tokens/secrets.

### 46.9 `WebBrowser`

Control/objeto para navegación o integración web.

### 46.10 WebView2 / JavaScript evaluation

Puede ejecutar JavaScript o interactuar con páginas web. Strings JS dentro de PowerScript son otro sublenguaje.

### 46.11 `DotNetObject`

Permite interactuar con objetos .NET.

### 46.12 `DotNetAssembly`

Permite cargar/usar assemblies .NET.

### 46.13 PDF objects

PowerBuilder incluye objetos para crear, manipular o extraer contenido PDF.

### 46.14 Compression objects

Objetos de compresión/extracción pueden operar sobre blobs, archivos o streams.

### 46.15 Crypto objects

Objetos de criptografía pueden manejar claves, hashes, cifrado y firmas. Una IA no debe modificar algoritmos o claves sin revisión.

### 46.16 File system APIs

Funciones de fichero como `FileOpen`, `FileReadEx`, `FileWriteEx`, `FileEncoding`, etc. son críticas para encoding, blobs y recursos.

### 46.17 Riesgos de endpoints, paths, JSON, JS y strings dinámicos

Riesgos:

```text
- endpoints hardcoded;
- tokens en source;
- JSON paths dinámicos;
- JavaScript en strings;
- rutas locales absolutas;
- encoding incorrecto;
- tamaño de respuesta grande;
- streaming/chunks;
- manejo inseguro de errores HTTP.
```

Reglas para IA:

```text
1. No exponer secretos/tokens.
2. No cambiar endpoints sin contexto.
3. Tratar JSON/JS como sublenguajes en strings.
4. Revisar encoding.
5. Revisar status codes y errores.
6. No cambiar crypto sin análisis de seguridad.
7. Revisar manejo de blobs y streams.
```

---

## 47. Frameworks reales PowerBuilder

Las aplicaciones PowerBuilder reales suelen apoyarse en frameworks: PFC/PFE, STD, frameworks internos o capas propias. Estos frameworks introducen ancestors, services, hooks, user events, dynamic calls y convenciones que no se ven en una función aislada.

### 47.1 Por qué PowerBuilder real suele depender de frameworks

PowerBuilder facilita inheritance visual/no visual. Por eso, muchas aplicaciones construyen frameworks con:

```text
- ancestor windows;
- ancestor user objects;
- services;
- transaction managers;
- error handlers;
- DataWindow services;
- security;
- preferences;
- menus;
- resize/layout;
- logging.
```

### 47.2 PFC

PowerBuilder Foundation Classes es un framework clásico basado en ancestors y services. Una IA debe esperar capas profundas y nombres convencionales.

### 47.3 PFE

Extensión o adaptación de PFC en muchos entornos. Puede contener descendants o customization layers.

### 47.4 STD Foundation Classes

Framework alternativo o complementario visto en corpus público. Debe tratarse como fuente de patrones reales, no como norma universal.

### 47.5 Frameworks internos

Muchas empresas tienen frameworks propios con reglas estrictas. La IA debe priorizar convenciones del proyecto activo cuando existan.

### 47.6 Ancestor framework vs descendant application

Patrón:

```text
framework ancestor → comportamiento base;
application descendant → lógica específica.
```

Eliminar una función en ancestor puede afectar cientos de descendants.

### 47.7 Service objects

Objetos no visuales que encapsulan lógica reusable.

### 47.8 Transaction services

Servicios para manejar conexión, commit, rollback, pooling o DBMS specifics.

### 47.9 DataWindow services

Servicios para retrieve/update, validación, sorting, filtering, resize, export, impresión o estilos.

### 47.10 Security services

Autenticación, permisos, roles, menús y acceso a acciones.

### 47.11 Preference/configuration services

Lectura/escritura de INI, registry, base de datos o JSON/XML.

### 47.12 Error/logging services

Manejo centralizado de errores, mensajes, logs, auditoría o trazas.

### 47.13 Resize/UI services

Servicios para adaptar ventanas, controles y DataWindows.

### 47.14 Extension points

Frameworks suelen exponer hooks:

```text
of_preopen
of_postopen
of_preretrieve
of_postretrieve
of_validate
of_save
ue_postopen
ue_refresh
```

Una IA no debe eliminar hooks sin llamadas textuales: pueden invocarse dinámicamente por framework.

### 47.15 Overrides y cascada de impacto

Modificar un ancestor puede afectar a todos sus descendants. Modificar un descendant puede romper un contrato esperado por el ancestor.

### 47.16 Cómo debe razonar una IA ante frameworks

Reglas:

```text
1. Construir cadena ancestor/descendant.
2. Identificar hooks y naming conventions.
3. No eliminar methods sin references por dynamic invocation.
4. Revisar services agregados/delegados.
5. Revisar DataWindow services antes de tocar dw_*.
6. Mantener CALL SUPER si el framework lo espera.
7. No aplicar patrones modernos rompiendo framework legacy.
8. Documentar incertidumbre si faltan PBD/PBL ancestors.
```

---

## 48. Seguridad, credenciales y configuración sensible

PowerBuilder legacy puede contener credenciales, DSNs, tokens, endpoints, certificados, rutas de red y parámetros sensibles en scripts, INI, JSON, XML o build files. Una IA debe proteger estos datos y evitar introducir nuevos secretos.

### 48.1 DB credentials en scripts

Riesgo:

```powerscript
SQLCA.UserID = "admin"
SQLCA.DBPass = "password"
```

Acción recomendada: señalar riesgo y proponer externalización segura si el proyecto lo permite.

### 48.2 DBParm

`DBParm` puede contener credenciales:

```powerscript
SQLCA.DBParm = "ConnectString='DSN=MYDB;UID=user;PWD=secret'"
```

### 48.3 INI files

Los INI pueden contener credenciales o rutas sensibles.

### 48.4 Tokens HTTP/OAuth

Tokens en source son críticos:

```powerscript
lhc_client.SetRequestHeader("Authorization", "Bearer " + ls_token)
```

### 48.5 Certificados

Rutas a certificados, claves privadas o almacenes deben tratarse como sensibles.

### 48.6 Hardcoded endpoints

Endpoints pueden revelar infraestructura:

```powerscript
ls_url = "https://internal-api.company.local"
```

### 48.7 Logs y errores

Mensajes de error pueden exponer SQL, credenciales, rutas o datos personales.

### 48.8 Redacción de datos sensibles

Si se documenta o muestra un ejemplo, deben redacted values:

```text
UID=<redacted>;PWD=<redacted>
Bearer <redacted>
```

### 48.9 Qué debe advertir una IA

Advertir sobre:

```text
- credenciales hardcoded;
- tokens en source;
- SQL concatenado con input externo;
- logs con datos sensibles;
- endpoints internos;
- certificados expuestos;
- rutas de red sensibles;
- dumps de datos en repositorio.
```

### 48.10 Qué no debe transformar automáticamente

No transformar automáticamente:

```text
- esquemas de autenticación;
- algoritmos crypto;
- certificados;
- connection strings productivas;
- DBParm críticos;
- permisos/roles;
- validaciones de seguridad;
- auditoría.
```

Reglas:

```text
1. No exponer secretos en respuestas.
2. Redactar valores sensibles.
3. Proponer externalización, no inventar gestor de secretos sin contexto.
4. No cambiar crypto/auth sin revisión humana.
5. No eliminar logging/auditoría sin alternativa.
6. Señalar SQL injection si hay concatenación de input.
```

---

## 49. Reglas semánticas críticas para IA

Esta sección resume reglas que una IA debe aplicar siempre al analizar PowerBuilder.

### 49.1 Parent es contenedor, no ancestor

`Parent` apunta al objeto que contiene al actual.

### 49.2 Super es ancestor inmediato

`Super` apunta al ancestor inmediato en un descendant.

### 49.3 `::` puede ser ancestor call o global qualification según contexto

Resolver por contexto antes de interpretar.

### 49.4 `.srd` no es PowerScript

DataWindow syntax debe tratarse como sublenguaje.

### 49.5 DataWindow expressions son un sublenguaje propio

No parsearlas como PowerScript.

### 49.6 DataWindow object no es DataWindow control

El control contiene al objeto.

### 49.7 DataStore no es visual, pero usa DataWindow functionality

No tratarlo como simple colección.

### 49.8 Prototype e implementation no son duplicados

`forward prototypes` declara signatures; el cuerpo está en implementation.

### 49.9 Object assignment copia referencia

No copia objeto completo.

### 49.10 Structure assignment copia datos

No comparte identidad como objeto.

### 49.11 `Any` reduce certeza semántica

Requiere tracing de assignments.

### 49.12 Dynamic calls se resuelven en runtime

No pueden resolverse solo por tipo declarado.

### 49.13 Dynamic SQL reduce certeza

Puede ocultar tablas, columnas, parámetros y efectos.

### 49.14 External functions no tienen body PowerScript

La implementación está en DLL.

### 49.15 PBX/PBNI no tiene implementación PowerScript interna

La implementación está en código nativo.

### 49.16 NULL no se compara con `= NULL`

Usar `IsNull`.

### 49.17 Enumerated values terminan en `!`

No convertirlos en strings.

### 49.18 SetTrans y SetTransObject no son equivalentes

Tienen modelos transaccionales distintos.

### 49.19 Workspace source control usa `ws_objects`; Solution no

No asumir mismo layout.

### 49.20 ORCA source syntax no es una especificación formal completa

El source exportado es práctico, no gramática oficial completa.

### 49.21 Library order importa

Afecta resolución y compilación.

### 49.22 Posted events no devuelven valor utilizable

No tratar `PostEvent` como llamada síncrona.

### 49.23 Encoding legacy puede no ser UTF-8

Revisar encoding.

### 49.24 El IDE puede reescribir source exportado

Evitar formateos innecesarios.

### 49.25 Los strings pueden contener SQL, DataWindow syntax, JSON, JavaScript o rutas

Analizar sublenguaje antes de modificar.

---

## 50. Errores frecuentes que una IA debe evitar

### 50.1 Tratar PowerBuilder como lenguaje procedural simple

PowerBuilder es OOP, event-driven y fuertemente integrado con el IDE/runtime.

### 50.2 Parsear todo como PowerScript

DataWindow, SQL, JSON, JavaScript, ORCA, OrcaScript y build JSON son sublenguajes distintos.

### 50.3 Parsear `.srd` como PowerScript

Error crítico.

### 50.4 Confundir containment con inheritance

`Parent` no es `Super`.

### 50.5 Resolver referencias solo por texto

Ignora scopes, overloads, ancestors y library path.

### 50.6 Ignorar library search path

Puede resolver objetos equivocados.

### 50.7 Ignorar source control mode

Workspace y Solution tienen layouts distintos.

### 50.8 Ignorar encoding

Puede corromper caracteres.

### 50.9 Tratar PBL binaria como texto editable

PBL clásica no es source textual directo.

### 50.10 Tratar PBD como source

PBD es artefacto compilado/dinámico.

### 50.11 Tratar prototypes como duplicados

No eliminar prototypes sin revisar.

### 50.12 Ignorar overload/override

Puede romper dispatch.

### 50.13 Romper dynamic dispatch

No sustituir dynamic calls por static calls sin evidencia.

### 50.14 Renombrar strings dinámicos como si fueran símbolos seguros

Strings pueden ser SQL, DataWindow property paths o event names.

### 50.15 Reescribir DataWindow expressions sin entender su sintaxis

Puede romper UI, validaciones o reports.

### 50.16 Reescribir SQL embebido sin respetar host variables

Los `:` importan.

### 50.17 Confundir external function con RPCFUNC

DLL vs stored procedure.

### 50.18 Confundir PBX con DLL externa simple

PBX expone objetos/classes PowerBuilder.

### 50.19 Confundir SetTrans con SetTransObject

Modelos transaccionales distintos.

### 50.20 Asumir UTF-8

Legacy puede usar ANSI/DBCS/HEXASCII.

### 50.21 Asumir que todo proyecto tiene SR* completo

Pueden faltar exports, PBDs o PBLs.

### 50.22 Asumir que ORCA funciona igual con Solution y Workspace

No es seguro.

### 50.23 Inventar sintaxis source no documentada

Usar corpus y exports reales, no suposiciones.

### 50.24 Eliminar `call super::*` sin entender lifecycle

Puede romper frameworks.

### 50.25 Ignorar `SystemError`, exceptions y runtime errors

Eventos y errores runtime pueden no tener callers textuales.

---

## 51. Ejemplos canónicos explicados

Esta sección debe contener ejemplos mínimos, claros y comentados. En el documento final pueden ampliarse como apéndice práctico.

### 51.1 Application con `Open`, `Close` y `SystemError`

```powerscript
event open;
    CONNECT USING SQLCA;
    Open(w_main)
end event

event close;
    DISCONNECT USING SQLCA;
end event

event systemerror;
    MessageBox("System Error", error.Text)
end event
```

### 51.2 Window con controles nested

```powerscript
type cb_ok from commandbutton within w_customer
end type

event clicked;
    Parent.uf_save()
end event
```

### 51.3 Menu con `Parent` y `ParentWindow`

```powerscript
event clicked;
    ParentWindow.Close()
end event
```

### 51.4 Nonvisual User Object de servicio

```powerscript
public function long uf_save(long al_id);
    return 1
end function
```

### 51.5 Visual User Object

```powerscript
type u_customer_panel from userobject
end type
```

### 51.6 Structure y assignment por valor

```powerscript
str_customer lstr_a, lstr_b
lstr_b = lstr_a
```

### 51.7 Global Function

```powerscript
public function string gf_trim(string as_value);
    return Trim(as_value)
end function
```

### 51.8 Function prototype + implementation

```powerscript
forward prototypes
public function long uf_load(long al_id)
end prototypes

public function long uf_load(long al_id);
    return 1
end function
```

### 51.9 User event con `event type`

```powerscript
event type long ue_refresh()
```

### 51.10 Override con `CALL SUPER`

```powerscript
event open;
    CALL SUPER::open
    uf_load()
end event
```

### 51.11 Ancestor call explícita con `ancestorclass::`

```powerscript
w_base::uf_refresh()
```

### 51.12 Overload

```powerscript
public function long uf_find(long al_id)
public function long uf_find(string as_code)
```

### 51.13 Dynamic call

```powerscript
luo_service.DYNAMIC uf_execute(ls_action)
```

### 51.14 `CREATE USING`

```powerscript
lnv_service = CREATE USING ls_className
```

### 51.15 `TRY/CATCH/FINALLY`

```powerscript
TRY
    uf_process()
CATCH (Exception ex)
    MessageBox("Error", ex.GetMessage())
FINALLY
    uf_cleanup()
END TRY
```

### 51.16 Embedded SQL con host variables

```powerscript
SELECT name
INTO :ls_name
FROM customer
WHERE id = :ll_id;
```

### 51.17 Embedded SQL con indicator variables

```powerscript
FETCH c_customer INTO :ls_name :li_ind;
```

### 51.18 Dynamic SQL Format 4

```powerscript
PREPARE SQLSA FROM :ls_sql USING SQLCA;
DESCRIBE SQLSA INTO SQLDA;
```

### 51.19 Transaction object custom

```powerscript
n_tr ltr_custom
ltr_custom = CREATE n_tr
CONNECT USING ltr_custom;
```

### 51.20 DataWindow con `SetTransObject` y `Retrieve`

```powerscript
dw_1.SetTransObject(SQLCA)
dw_1.Retrieve(ll_id)
```

### 51.21 DataStore sin UI

```powerscript
CREATE datastore lds_data
lds_data.DataObject = "d_customer"
lds_data.SetTransObject(SQLCA)
lds_data.Retrieve()
```

### 51.22 `Describe("DataWindow.Table.Select")`

```powerscript
ls_sql = dw_1.Describe("DataWindow.Table.Select")
```

### 51.23 `Modify` con expresión `default~tIf(...)`

```powerscript
dw_1.Modify("amount.Color='0~tIf(amount > 1000,255,0)'")
```

### 51.24 `Evaluate` dentro de `Describe`

```powerscript
ls_sum = dw_1.Describe("Evaluate('Sum(amount)',0)")
```

### 51.25 DataWindow data expression

```powerscript
ls_name = dw_1.Object.customer_name[1]
```

### 51.26 External DLL function

```powerscript
FUNCTION long GetTickCount() LIBRARY "kernel32.dll"
```

### 51.27 RPCFUNC stored procedure

```powerscript
SUBROUTINE sp_update(long al_id) RPCFUNC
```

### 51.28 PBX nonvisual extension

```powerscript
n_native_object lnv_native
lnv_native = CREATE n_native_object
```

### 51.29 OrcaScript build

```text
start session
set application ".\app.pbl" "my_app"
build application full
end session
```

### 51.30 PBAutoBuild command-line build

```text
PBAutoBuild250 /pbc /d "app.pbw" /o "bin\app.exe"
```

---

## 52. Corpus público recomendado para validar comprensión

El corpus público sirve para validar patrones reales, detectar edge cases y comparar sintaxis exportada. No debe elevarse automáticamente a norma oficial.

### 52.1 PFC 2025 Solution

Útil para estudiar Solution moderna, herencia, services y patterns oficiales/comunitarios.

### 52.2 PFC Workspace clásico

Útil para entender PBL/PBT/PBW, library list, PFC legacy y exports.

### 52.3 PFC/PFE versiones anteriores

Útiles para compatibilidad histórica y patrones heredados.

### 52.4 STD Foundation Classes

Corpus alternativo de framework real.

### 52.5 Appeon Sales Example

Ejemplo oficial/común para build, DataWindow, DB y UI.

### 52.6 Appeon AutoBuild samples

Útiles para PBAutoBuild y CI.

### 52.7 PowerFramework

Framework público para validar patterns OOP y services.

### 52.8 pbMailKit

Ejemplo de integración externa/librerías.

### 52.9 PBNI/PBX examples

Necesarios para entender extensiones nativas.

### 52.10 DataWindow examples

Útiles para property expressions, DataWindow syntax y reports.

### 52.11 JSON/REST examples

Útiles para objetos modernos y strings dinámicos.

### 52.12 ORCA utilities

Útiles para export/import/compile/regenerate.

### 52.13 tree-sitter-powerscript como referencia comparativa no oficial

Puede ayudar a comparar parsing, pero no es autoridad normativa.

### 52.14 DataWindow grammar/reference comparativa no oficial

Puede ayudar con `.srd`, pero debe validarse con exports reales.

### 52.15 Criterios de selección de corpus

```text
- proyectos con licencia pública;
- variedad Workspace/Solution;
- variedad PowerBuilder versions;
- uso real de DataWindow;
- frameworks con inheritance profunda;
- external functions/PBX;
- SQL embebido y dinámico;
- build scripts reales.
```

### 52.16 Qué no debe elevarse a regla oficial desde corpus

```text
- naming conventions específicas;
- prefijos de un framework;
- formato SQL propio;
- hacks legacy;
- workarounds de un DBMS;
- decisiones de una empresa;
- errores presentes en corpus;
- limitaciones de un parser externo.
```

---

## 53. Glosario PowerBuilder para IA

### 53.1 Application object

Objeto de entrada de la aplicación.

### 53.2 Workspace

Contenedor clásico de targets.

### 53.3 Solution

Modelo moderno de organización de proyectos.

### 53.4 Target

Unidad construible dentro de Workspace.

### 53.5 Project

Objeto/configuración de build/deploy.

### 53.6 PBL

PowerBuilder Library; binaria en Workspace, carpeta en Solution.

### 53.7 PBD

PowerBuilder Dynamic Library compilada.

### 53.8 PBW

Archivo Workspace.

### 53.9 PBT

Archivo Target.

### 53.10 PBSLN

Archivo Solution.

### 53.11 PBPROJ

Archivo Project moderno.

### 53.12 Painter

Editor visual/especializado de PowerBuilder.

### 53.13 Library Painter

Herramienta para administrar PBLs.

### 53.14 System Tree

Árbol de navegación del entorno PowerBuilder.

### 53.15 PowerScript

Lenguaje de scripting de PowerBuilder.

### 53.16 PowerObject

Base conceptual de objetos PowerBuilder.

### 53.17 User Object

Objeto definido por usuario, visual o no visual.

### 53.18 Visual User Object

User object con UI.

### 53.19 Nonvisual User Object

User object sin UI, usado para lógica/services.

### 53.20 DataWindow object

Definición de datos/presentación.

### 53.21 DataWindow control

Contenedor visual de un DataWindow object.

### 53.22 DataStore

Contenedor no visual de un DataWindow object.

### 53.23 DataWindowChild

DataWindow anidado/DDDW/report child.

### 53.24 Transaction object

Objeto de conexión y estado SQL.

### 53.25 SQLCA

Transaction object global por defecto.

### 53.26 SQLSA

DynamicStagingArea global.

### 53.27 SQLDA

DynamicDescriptionArea global.

### 53.28 ClassDefinition

Metamodelo runtime de clases.

### 53.29 VariableDefinition

Metamodelo runtime de variables/argumentos.

### 53.30 ScriptDefinition

Metamodelo runtime de functions/events.

### 53.31 External Function

Función declarada en DLL/librería externa.

### 53.32 RPCFUNC

Declaración de stored procedure como llamada remota.

### 53.33 PBX

PowerBuilder extension nativa.

### 53.34 PBNI

PowerBuilder Native Interface.

### 53.35 ORCA

API para operaciones de librería/build.

### 53.36 OrcaScript

Lenguaje batch de operaciones ORCA/PowerBuilder.

### 53.37 PBAutoBuild

Herramienta moderna de build/deploy por línea de comandos.

### 53.38 PBR

PowerBuilder Resource file/list.

### 53.39 PSR

Powersoft Report, reporte guardado con definición/datos.

### 53.40 Source export

Representación textual exportada de un objeto PowerBuilder.

---

## 54. Fuentes oficiales usadas

Esta sección lista las familias de documentación oficial que deben consultarse para validar o ampliar el documento. En esta versión parcial no se incluyen citas inline, por petición explícita, pero el documento completo puede incorporar referencias por sección.

### 54.1 Appeon PowerBuilder 2025 Getting Started

Fuente para conceptos introductorios, objetos básicos y entorno.

### 54.2 Appeon PowerBuilder 2025 Users Guide

Fuente para IDE, workspaces, solutions, libraries, source control, Git, OrcaScript, PBAutoBuild y uso de objetos.

### 54.3 Appeon PowerBuilder 2025 PowerScript Reference

Fuente principal del lenguaje: syntax, datatypes, variables, functions, events, statements, SQL embebido, dynamic SQL, exceptions y built-in functions.

### 54.4 Appeon PowerBuilder 2025 Application Techniques

Fuente para OOP, transaction objects, external functions, exception handling, Unicode, HTTPClient y técnicas de aplicación.

### 54.5 Appeon PowerBuilder 2025 Objects and Controls

Fuente para system objects, controls, ClassDefinition, VariableDefinition, ScriptDefinition y objetos runtime modernos.

### 54.6 Appeon PowerBuilder 2025 DataWindow Programmers Guide

Fuente para DataWindow/DataStore, uso en aplicaciones, dynamic DataWindow processing, DataStore, sharing data y acceso DB.

### 54.7 Appeon PowerBuilder 2025 DataWindow Reference

Fuente para DataWindow expressions, methods, properties, Describe, Modify, Evaluate, data expressions y object properties.

### 54.8 Appeon PowerBuilder 2025 Connecting to Your Database

Fuente para DB interfaces, ODBC/OLE DB/ADO.NET/native, embedded SQL por interfaz y DBMS specifics.

### 54.9 Appeon PowerBuilder 2025 Connection Reference

Fuente para parámetros de conexión, Lock/isolation y propiedades DB.

### 54.10 Appeon PowerBuilder 2025 ORCA Guide

Fuente para ORCA, Library Painter correspondence, source export/import, compile/regenerate, library operations y limitations.

### 54.11 Appeon PowerBuilder 2025 PowerBuilder Extension Reference

Fuente para uso de PBX/extensiones PowerBuilder.

### 54.12 Appeon PowerBuilder 2025 PBNI Programmers Guide and Reference

Fuente para crear extensiones nativas, interfaces PBNI, PBX entry points, IPB_Session, IPB_Value, Invoke/Destroy y marshaler extensions.

### 54.13 Documentación de migración 32/64-bit relevante para PBX/PBNI

Fuente complementaria para revisar `longptr`, DLL/PBX bitness, runtime 32/64 y cambios de compatibilidad.

### 54.14 Corpus público usado solo como validación, no como autoridad normativa

El corpus público debe usarse para verificar patrones reales, edge cases y compatibilidad con código legacy, pero no reemplaza la documentación oficial.

---
