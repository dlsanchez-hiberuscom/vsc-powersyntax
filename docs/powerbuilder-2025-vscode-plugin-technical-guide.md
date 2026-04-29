# Guía técnica exhaustiva para que una IA construya un plugin de VS Code para **PowerBuilder 2025** (Workspace + Solution)

> **Objetivo**  
> Este documento está escrito para que una IA (por ejemplo GitHub Copilot en modo agente) entienda **cómo está organizado PowerBuilder 2025**, **cómo se representan los objetos en disco**, **qué diferencias hay entre Workspace y Solution**, **cómo se estructuran los archivos SR***, **cómo funciona PowerScript a nivel semántico**, y **qué estrategia de parsing/indexación/LSP** conviene seguir para construir un plugin profesional de Visual Studio Code. La base oficial relevante está repartida entre la documentación de PowerBuilder 2025/2025 R2, el material de “What’s New”, la referencia de PowerScript, la referencia de DataWindow, la guía de usuario y los repositorios abiertos de PFC 2025 en formato Workspace y Solution.

---

## 1. Modelo mental correcto: **PowerBuilder no es solo un lenguaje; es un ecosistema de objetos, librerías y formatos de proyecto**

PowerBuilder organiza una aplicación como un conjunto de **objetos** (Application, Window, Menu, User Object, DataWindow, Function, Structure, Query, Pipeline, etc.) que históricamente se almacenaban en librerías `.pbl`, y que en el modelo moderno **Solution** se representan como **archivos fuente SR\*** dentro de carpetas `*.pbl`. La documentación oficial del nuevo formato explica que, al convertir desde workspace, `pbw -> pbsln`, `pbt -> pbproj`, y `pbl -> carpeta .pbl`, separando además el código fuente (`.sr*`) de los artefactos de compilación (`.pb`, `build`). El catálogo clásico de extensiones `.sra`, `.srw`, `.sru`, `.srm`, `.srd`, `.srf`, `.srs`, `.srq`, `.srp`, `.srj` sigue siendo la base conceptual que una IA debe reconocer para clasificar archivos y construir un modelo semántico del proyecto. 

Para un plugin de VS Code, esto significa que el problema no es únicamente “resaltar sintaxis PowerScript”, sino **detectar el tipo de repositorio**, **descubrir librerías/proyectos/soluciones**, **clasificar cada SR\*** por tipo de objeto, **parsear las secciones contenedoras** del archivo y **parsear el lenguaje embebido** (PowerScript o sintaxis DataWindow según el caso). Además, el plugin debe funcionar tanto con **repositorios antiguos en formato Workspace** como con **repositorios modernos en formato Solution**, porque ambos son soportados por PowerBuilder 2025 y conviven en repositorios reales como OpenSourcePFCLibraries. 

---

## 2. Hay **dos modos de proyecto** y el plugin debe soportarlos de forma explícita

### 2.1 Workspace clásico

El formato **Workspace** usa principalmente `.pbw` (workspace), `.pbt` (target) y `.pbl` (libraries binarias). Cuando se añade un workspace a Git desde el IDE, PowerBuilder genera un subdirectorio **`ws_objects`** que contiene los archivos de objeto fuente a nivel individual (`.srw`, `.sru`, `.srd`, `.srm`, etc.), y ese directorio debe versionarse para gestionar el código a nivel de objeto. En este modelo, `ws_objects` es el puente entre las librerías binarias `.pbl` y el control de versiones. 

### 2.2 Solution moderno

El formato **Solution** usa `.pbsln` y `.pbproj`, y cada `.pbl` deja de ser un archivo binario para convertirse en una **carpeta con sufijo `.pbl`**. Dentro de esa carpeta vive el código fuente de cada objeto como archivo `.sr*`, y los metadatos/comentarios de librería se guardan en un archivo `.pblmeta`. Este formato usa el **ultra-fast compiler**, separa claramente fuente y artefactos generados, y ya no necesita `ws_objects` porque la propia estructura del filesystem representa los objetos individualmente. 

### 2.3 Conclusión práctica para la IA

La IA debe empezar cada análisis detectando si la raíz contiene:
- `*.pbsln` / `*.pbproj` / carpetas `*.pbl` → **Solution**. 
- `*.pbw` / `*.pbt` / `ws_objects` / `.pbl` binarios → **Workspace**. 

Ese detector condiciona:
- el **descubrimiento de objetos**, 
- el **scanning de fuentes**, 
- la **exclusión de carpetas generadas**, 
- y el **backend de build/integración** (ORCA/PBAutoBuild clásico frente a flujo Solution). 

---

## 3. Estructura física que una IA debe reconocer

### 3.1 Estructura típica de un **Workspace**

```text
MiApp/
├─ MiApp.pbw
├─ MiApp.pbt
├─ generic.pbt
├─ algunas_librerias.pbl
├─ ws_objects/
│  ├─ pfcmain__pbl/
│  │  ├─ w_main.srw
│  │  ├─ u_toolbar.sru
│  │  ├─ d_orders.srd
│  │  ├─ m_main.srm
│  │  ├─ n_utils.srf
│  │  └─ ...
│  └─ otras_librerias...
└─ otros archivos
```

En Workspace, el plugin debe considerar `ws_objects` como **fuente canónica versionable**, aunque la aplicación siga dependiendo de `.pbl` en el ecosistema clásico. La guía de Git de PowerBuilder describe explícitamente que `ws_objects` se crea para gestionar `.srw`, `.srm`, `.sru`, `.srd`, etc. a nivel de objeto. 

### 3.2 Estructura típica de una **Solution**

```text
MiSolucion/
├─ MiSistema.pbsln
├─ app.pbproj
├─ core.pbproj
├─ appmain.pbl/
│  ├─ appmain.pblmeta
│  ├─ w_login.srw
│  ├─ w_main.srw
│  ├─ u_customer.sru
│  ├─ d_customer_list.srd
│  ├─ m_main.srm
│  ├─ f_string_utils.srf
│  ├─ st_customer.srs
│  ├─ q_customer.srq
│  └─ a_app.sra
├─ shared.pbl/
│  ├─ shared.pblmeta
│  ├─ ...
├─ .pb/
│  └─ ...
├─ build/
│  └─ ...
└─ _BackupFiles/   (si hubo migración)
```

La documentación del nuevo formato indica que en Solution: los objetos fuente van en carpetas `*.pbl`, los comentarios de librería van en `.pblmeta`, `.pb` guarda AST/Pcode intermedio, y `build` guarda Pcode final. `_BackupFiles` puede aparecer tras conversiones desde Workspace. 

### 3.3 Regla operativa para el plugin

El indexador **debe**:
- indexar `ws_objects/**` en Workspace, 
- indexar `**/*.pbl/**/*.sr*` y `*.pblmeta` en Solution, 
- ignorar `.pb/**`, `build/**` y `_BackupFiles/**`, porque no son fuente canónica. 

---

## 4. Mapa de extensiones SR\* que la IA debe conocer

Las extensiones SR\* más importantes son las siguientes, y el plugin debe mapearlas directamente a “kind” interno de símbolo/objeto: `.sra` (Application), `.srw` (Window), `.sru` (User Object), `.srm` (Menu), `.srd` (DataWindow), `.srf` (Function), `.srs` (Structure), `.srq` (Query), `.srp` (Pipeline), `.srj` (Project). Además, la guía de Git y el material de objetos/librerías/archivos muestran ejemplos de `.srw`, `.sru`, `.srd`, `.srm`, y el inventario general clásico incluye el resto. 

### 4.1 Tabla mental (no de implementación) de tipos

- **`.sra`** → objeto **Application**.
- **`.srw`** → **Window**. 
- **`.sru`** → **User Object** (visual o no visual). 
- **`.srm`** → **Menu**. 
- **`.srd`** → **DataWindow**. 
- **`.srf`** → **Function** (normalmente global function). 
- **`.srs`** → **Structure**. 
- **`.srq`** → **Query**. 
- **`.srp`** → **Pipeline**. 
- **`.srj`** → **Project**. 

---

## 5. Cómo pensar los archivos SR\*: **dos capas de parsing**

La clave para que una IA lo entienda bien es asumir que muchos archivos SR\* tienen **dos niveles**:

1. **Capa contenedora del objeto**: declaraciones `forward`, tipo global, herencia `from`, listas de prototipos, eventos especiales `on create / on destroy`, propiedades estructurales del objeto, etc.   
2. **Capa de lenguaje embebido**: scripts PowerScript o sintaxis específica de DataWindow/SQL según el tipo de archivo. 

Un error común al diseñar tooling es parsear todo como si fuera “solo PowerScript”. Eso falla especialmente en `.srd`, pero también en `.srw` y `.sru`, donde hay secciones que son estructura de objeto y no cuerpo directo de función. El parser ideal es por tanto:
- **classifier** del tipo de archivo, 
- **container parser** por SR\*, 
- **embedded-language parser** (PowerScript / DataWindow / SQL, según sección). 

---

## 6. Anatomía real de un `.SRU` (User Object) y por qué es tan importante

El ejemplo real `examples/exmmain.pbl/n_tr.sru` del repositorio abierto **2025-Solution** muestra patrones muy útiles para tu parser: aparecen bloques `forward global type ... end type`, la declaración `global type ... from ... end type`, la instancia global `global n_tr n_tr`, un bloque `forward prototypes`, funciones (`public function long of_begin ()`), y handlers de ciclo de vida `on n_tr.create ... end on` y `on n_tr.destroy ... end on`. Esto confirma que un `.sru` puede contener **metadefinición de tipo**, **prototipos**, **funciones** y **scripts de eventos especiales** en un único archivo. 

### 6.1 Ejemplo **esquemático** de `.sru`

> **Nota**: el siguiente ejemplo es **ilustrativo**, no una copia literal de la documentación.

```powerscript
forward global type n_customer_service from nonvisualobject
end type
end forward

global type n_customer_service from nonvisualobject
end type
global n_customer_service n_customer_service

forward prototypes
public function long of_loadCustomer (long al_customer_id)
public function boolean of_isReady ()
end prototypes

public function long of_loadCustomer (long al_customer_id);
    long ll_rc
    // lógica...
    return ll_rc
end function

public function boolean of_isReady ();
    return true
end function

on n_customer_service.create
    call super::create
    TriggerEvent(this, "constructor")
end on

on n_customer_service.destroy
    call super::destroy
    TriggerEvent(this, "destructor")
end on
```

### 6.2 Qué debe extraer el plugin de un `.sru`

- **nombre del tipo definido**, 
- **ancestro / herencia** (`from X`), 
- **lista de funciones prototipo**, 
- **firma completa de cada función**, 
- **eventos especiales create/destroy**, 
- **variables/instancias globales asociadas**, cuando existan. 

---

## 7. Anatomía de un `.SRW` (Window)

Un `.srw` representa una **ventana**, que en el modelo de PowerBuilder es uno de los objetos centrales del runtime. Las ventanas contienen eventos, controles, scripts asociados y variables de instancia; además, la herencia de ventanas es común en aplicaciones grandes y frameworks como PFC. La User Guide describe que Application, Window y User Object painters comparten el modelo de declaración de variables y funciones en Script editor, y el ecosistema de objetos de PowerBuilder sitúa a la ventana como un contenedor de lógica/eventos/controles. 

### 7.1 Qué esperar estructuralmente en un `.srw`

- cabecera del tipo y posible herencia, 
- variables de instancia/shared/global declaradas en secciones `Declare`, 
- funciones locales o globales definidas desde Script editor, 
- scripts de eventos (`open`, `close`, `clicked`, `resize`, etc.), porque PowerScript modela eventos y funciones como entidades invocables del objeto. 

### 7.2 Ejemplo **esquemático** de `.srw`

```powerscript
forward global type w_customer from window
end type
end forward

global type w_customer from window
end type
global w_customer w_customer

type variables
    public long il_customer_id
    shared string is_lastFilter
end variables

forward prototypes
public function integer uf_load ()
end prototypes

public function integer uf_load ();
    return 1
end function

on w_customer.open
    this.uf_load()
end on

on cb_close.clicked
    close(parent)
end on
```

### 7.3 Qué debe indexar el plugin en `.srw`

- símbolo principal **Window**, 
- controles conocidos si se consigue parsearlos, 
- eventos como nodos semánticos navegables, 
- funciones locales/miembro, 
- variables de instancia/shared/global del objeto. 

---

## 8. Anatomía de un `.SRA` (Application)

El **Application object** es el **punto de entrada** de la aplicación. Cuando el usuario ejecuta la app, se dispara el **evento `Open`** del Application object, que inicia la actividad del sistema. La referencia oficial del objeto Application documenta propiedades propias como `AppName`, `DisplayName`, `DWMessageTitle`, `HighDPIMode`, `RightToLeft`, etc. 

### 8.1 Implicaciones para el plugin

El plugin debe tratar el `.sra` como un objeto especial porque:
- define el **entry point lógico** de la aplicación, 
- puede contener **variables de aplicación** y scripts globales de arranque/cierre, 
- y es un punto natural para localizar inicialización de servicios, apertura de ventana principal, inicialización de `SQLCA`, etc. 

### 8.2 Ejemplo **esquemático** de `.sra`

```powerscript
global type a_myapp from application
end type
global a_myapp a_myapp

type variables
    public n_app_service inv_appService
end variables

on a_myapp.open
    open(w_login)
end on
```

---

## 9. Anatomía de un `.SRF` (Global Function)

La documentación de User Guide indica que desde Script editor se pueden declarar variables y también funciones, distinguiendo entre **local** y **global**. Además, la clasificación clásica de archivos asocia `.srf` con **Function source files**. Para una IA, `.srf` es el contenedor natural de **funciones globales reutilizables**, muy importante para navegación, hover y autocompletado a nivel de workspace/solution. 

### 9.1 Qué es una función global

Una función global no pertenece semánticamente a una instancia concreta de Window/User Object/Menu, sino que queda accesible dentro del ámbito de la aplicación según la organización del proyecto y la library list. La guía de script editor confirma que el usuario puede declarar **function type (local or global)**, y la referencia de PowerScript modela funciones y eventos como parte central del lenguaje. 

### 9.2 Ejemplo **esquemático** de `.srf`

```powerscript
global function string gf_normalizePhone (string as_value);
    string ls_result
    // normalización...
    return ls_result
end function
```

### 9.3 Qué debe hacer el plugin con `.srf`

- indexar **firma**, **tipo de retorno** y **argumentos**, 
- resolver llamadas desde cualquier script, 
- distinguir entre **prototipo** y **implementación** si aparecen separadas en el modelo fuente, 
- detectar colisiones por nombre y sobrecargas si el lenguaje las admite en el contexto definido. 

---

## 10. Variables globales, de instancia, shared y locales: esto es crítico para la semántica

La referencia de PowerScript define cuatro scopes principales: **global**, **instance**, **shared** y **local**. Las globales son accesibles en toda la aplicación; las instance pertenecen a un objeto/instancia; las shared pertenecen a la definición del objeto y viven entre instancias; las locales existen solo dentro del script. Además, las variables globales, instance y shared pueden declararse desde Script editor de Application, Window, User Object o Menu; y las globales también pueden declararse desde Function painter. 

### 10.1 Regla de resolución de nombres

Cuando PowerBuilder encuentra una referencia **no calificada** a una variable, la busca en este orden:
1. local,  
2. shared,  
3. global,  
4. instance.  
Eso significa que el plugin debe implementar una **resolución de scopes exactamente en ese orden**, o los resultados de `Go to Definition`, `Find References`, `rename`, hover y diagnósticos de shadowing serán incorrectos. 

### 10.2 Accesos y modificadores

Las variables de instancia pueden declararse con derechos de acceso y restricción de lectura/escritura: `public`, `protected`, `private`, más modificadores como `protectedread`, `privateread`, `protectedwrite`, `privatewrite`. Esto es importante para el modelo semántico porque no solo hay que saber “dónde se declara”, sino también “desde qué scripts puede verse o modificarse”. 

### 10.3 Ejemplos **esquemáticos**

```powerscript
// Global
string gs_companyName
long gl_userId

// Instance
public string is_title
protected long il_state

// Shared
shared string ss_cachedFilter

// Local
string ls_name
long ll_rows
```

### 10.4 Qué debe extraer la IA

- scope de cada variable, 
- acceso (public/protected/private), 
- tipo de dato y tamaño/precisión si aplica (`blob{n}`, `decimal{p}`), 
- valor inicial si existe, sabiendo que algunas inicializaciones se fijan en compilación y no deben reinterpretarse como runtime evaluation. 

---

## 11. Pronombres, nombres calificados y herencia: imprescindible para navegación correcta

PowerScript usa pronombres como `This`, `Parent` y también el operador de scope global `::`. La referencia de variables explica que, para evitar ambigüedades, muchas veces hay que usar nombres calificados (`obj.var`) y que `::globalname` permite acceder a una global oculta por un nombre local/shared. También se usan pronombres en scripts de ventana/control para referirse al objeto actual o al contenedor. 

### 11.1 Consecuencias para el plugin

El plugin debe modelar:
- `This.x` como miembro del objeto actual, 
- `Parent.x` como miembro del contenedor en controles/eventos hijos, 
- `::x` como resolución forzada de variable global, 
- llamadas a ancestro (`super::...` o sintaxis análoga contextual) dentro de herencia/eventos. 

### 11.2 Recomendación

La IA no debe implementar `Find References` o `Rename` sólo con matching textual; debe hacerlo con **resolución semántica de pronombres, scopes y ancestros**. 

---

## 12. Tipos de datos y sistema de tipos que debe conocer el parser

La referencia de PowerScript enumera datatypes estándar, estructuras, objetos de sistema, enumerados y el tipo `Any`. La declaración de variables permite tipos estándar, estructuras, objetos definidos por el usuario y objetos del sistema. El plugin debe tener un catálogo de tipos básicos como `integer`, `long`, `longlong`, `decimal`, `double`, `real`, `string`, `boolean`, `date`, `time`, `datetime`, `blob`, `any`, además de tipos-objeto derivados (`window`, `transaction`, user objects, DataStore, etc.). 

### 12.1 Implicaciones para el motor semántico

- permitir dot notation sobre tipos-objeto, 
- diferenciar escala/precisión en `decimal{n}`, tamaño en `blob{n}`, 
- reconocer que una variable puede ser de tipo estructura o tipo objeto definido en otra librería del proyecto. 

---

## 13. Eventos, funciones y scripts: el corazón de PowerScript

La referencia de PowerScript organiza el lenguaje en **funciones**, **eventos**, **statement syntax**, **SQL statements** y llamadas estáticas/dinámicas. El lenguaje soporta `IF...THEN`, `FOR...NEXT`, `DO...LOOP`, `RETURN`, `TRY...CATCH...FINALLY`, `THROW`, `CALL`, etc., además de numerosos eventos estándar del runtime. Para un plugin serio, estas entidades deben representarse como nodos de AST navegables y con rango de texto claro. 

### 13.1 El plugin debe distinguir

- **declaración/prototipo** de función, 
- **implementación** de función, 
- **script de evento**, 
- **script de evento especial create/destroy**, que en los SR\* aparece con `on ... end on`. 

### 13.2 Ejemplo **esquemático**

```powerscript
forward prototypes
public function integer uf_validate (string as_name)
end prototypes

public function integer uf_validate (string as_name);
    if Trim(as_name) = "" then
        return -1
    end if
    return 1
end function

on w_customer.open
    this.uf_validate("test")
end on
```

---

## 14. Comentarios, whitespace, continuación de statements y lexing

La referencia de PowerScript incluye explícitamente temas como comentarios, reserved words, pronouns, statement continuation, statement separation y white space. Esto implica que el lexer no puede limitarse a tokens básicos; debe contemplar continuaciones de sentencia, comentarios de línea y de bloque, y comportamiento robusto frente a whitespace y formatos legacy. 

### 14.1 Recomendación concreta

La primera capa de la IA debería ser un **lexer tolerante** que:
- preserve offsets/rangos exactos, 
- identifique comentarios y regiones comentadas, 
- soporte recuperación ante errores, porque los SR\* de proyectos reales a veces contienen scripts parciales o estilos heterogéneos. 

---

## 15. SQL dentro de PowerScript y su relación con `Transaction` / `SQLCA`

PowerScript soporta **SQL en scripts** y también SQL dinámico; la referencia del lenguaje lo documenta formalmente. Además, la guía Getting Started recuerda que para conectar con base de datos es necesario un `Transaction object`, y que `SQLCA` es el objeto Transaction por defecto en muchos escenarios. Para tooling, eso significa que el plugin debe detectar patrones SQL tanto en DataWindow como en scripts PowerScript clásicos. 

### 15.1 Qué conviene soportar en una primera fase

- resaltar SQL embebido, 
- detectar referencias a `SQLCA`, `Transaction`, `SetTransObject`, etc., 
- y construir, más adelante, una subcapa opcional de análisis SQL para hover y referencias a tablas/columnas. 

---

## 16. DataWindow (`.SRD`) no es “otro script”: es un sublenguaje completo

La documentación de DataWindow 2025/2025 R2 demuestra que DataWindow tiene:
- **expresiones propias**, 
- **propiedades del objeto y de controles internos**, 
- **eventos y métodos propios**, 
- y una semántica específica de acceso a datos, retrieve, sort, filter, buffers, `Describe/Modify`, etc.

### 16.1 Qué debe entender el plugin de un `.srd`

Como mínimo:
- nombre del DataWindow, 
- columnas y nombres de data fields, 
- SQL base / retrieve arguments si se consigue extraer, 
- bandas (`header`, `detail`, `summary`, etc.) y controles relevantes, 
- eventos típicos (`RetrieveStart`, `RetrieveRow`, `RetrieveEnd`, `RowFocusChanged`, `ItemChanged`, etc.). 

### 16.2 Ejemplo **esquemático** de `.srd`

```text
release 12;
datawindow(
    column=(name=customer_id type=number)
    column=(name=customer_name type=char)
    retrieve="SELECT customer_id, customer_name FROM customer WHERE active = :ai_active"
    band=(header height=...)
    band=(detail height=...)
)
```

### 16.3 Estrategia recomendada

No intentes resolver todo DataWindow en la v1. Empieza con un **safe mode**:
1. detectar SQL, columnas, argumentos y bandas,   
2. extraer símbolos básicos y metadata,   
3. luego ampliar a `Describe/Modify`, expresiones y nested reports. 

---

## 17. `.SRM`, `.SRS`, `.SRQ`, `.SRP`, `.SRJ`: cómo modelarlos aunque no empieces por ellos

Aunque el foco inicial del plugin suele estar en `.srw`, `.sru`, `.srf` y `.srd`, la IA debe conocer el resto:
- **`.srm`** → menús, comandos y eventos de menú, 
- **`.srs`** → estructuras de datos, cruciales para tipado, 
- **`.srq`** → queries reutilizables, útiles para tooling SQL, 
- **`.srp`** → pipelines, relevante si quieres cobertura enterprise, 
- **`.srj`** → proyectos, más metadato que lógica ejecutable. 

### 17.1 Ejemplos **esquemáticos**

**`.srs`**
```powerscript
global type st_customer from structure
    long customer_id
    string customer_name
    date created_on
end type
```

**`.srq`**
```sql
SELECT customer_id, customer_name
FROM customer
WHERE active = :ai_active
```

**`.srm`**
```powerscript
on m_file.exit.clicked
    close(parentwindow)
end on
```

---

## 18. Workspace vs Solution: diferencias que impactan directamente al plugin

### 18.1 `ws_objects` solo existe para Workspace

La guía de Git 2025 aclara que al añadir un **workspace** a Git se crea `ws_objects`; **en solution no se crea**. Por tanto, un plugin que espere siempre `ws_objects` fallará en PB 2025 Solution. 

### 18.2 Algunas funciones de librería cambian de comportamiento

La documentación de “Working with PBL folder” enumera diferencias de funciones cuando se trabaja con **PBL file** frente a **PBL folder**, incluyendo `AddToLibraryList`, `FindClassDefinition`, `FindFunctionDefinition`, `FindTypeDefinition`, `LibraryImport`, etc. Además, existe `IsRunningAsSolution`. Esto es importante porque el plugin no debe asumir equivalencia total entre ambos modos si en el futuro quieres integración profunda con runtime/build tooling. 

### 18.3 ORCA/OrcaScript no cubre el nuevo Solution format

La guía de `What’s New` dice que el ultra-fast compiler/solution no soporta **ORCA/OrcaScript compilation**, y la sección de PBL folder añade que no se soporta importar objetos al PBL folder vía ORCA. Sin embargo, ORCA sigue siendo relevante en el mundo workspace clásico, y PBAutoBuild también forma parte del ecosistema de automatización. 

### 18.4 Implicación

Para VS Code:
- integra **detección dual**, 
- mantén **dos estrategias de build/automation**, 
- y **no mezcles** supuestos de workspace con solution. 

---

## 19. Encoding real de los archivos: esto no es un detalle, es una condición de compilación

La documentación de `Working with PBL folder` indica que en Solution los archivos fuente generados durante la migración, y también `.pbsln`, `.pbproj` y `.pblmeta`, usan **UTF-8**. También especifica que el comportamiento BOM/no BOM se controla con `PB.INI` (`DefaultEncoding=4` para UTF-8 con BOM, `DefaultEncoding=64` para UTF-8 sin BOM). Además, una mejora del build 3559 confirma soporte para UTF-8 sin BOM y que los objetos de la carpeta PBL se cargan dinámicamente. 

La comunidad de Appeon también explica que el compilador del nuevo modelo soporta UTF-8 y por eso se eligió ese formato para los fuentes del solution. Para un plugin, esto implica: detección robusta de UTF-8 BOM/no BOM, evitar asumir UTF-16LE como formato de trabajo en Solution, y tener cuidado con repositorios legacy mezclados. 

### 19.1 Reglas recomendadas para la IA

- **Solution**: asumir UTF-8, detectar BOM/no BOM. 
- **Workspace/legacy**: no asumir uniformidad; detectar encoding al abrir.
- Normalizar internamente a UTF-8 para el parser, conservando encoding original al guardar si es posible. 

---

## 20. El repositorio Open PFC 2025 es un corpus esencial para entrenar/validar al plugin

El repositorio **OpenSourcePFCLibraries/2025-Solution** es la prueba real de cómo luce una solución moderna de PowerBuilder 2025: contiene `PFC.pbsln`, varios `.pbproj`, carpetas `*.pbl` y objetos `.sru`, `.srw`, etc. El repositorio **2025-Workspace** muestra la contrapartida clásica con `PFC.pbw`, `.pbt` y `ws_objects`. Tener ambos repositorios permite a una IA validar clasificación, discovery, performance, parsing e indexación contra un framework real de gran tamaño. 

### 20.1 Qué investigar en ese corpus

- patrones de `forward prototypes`, 
- herencia intensiva (`from pfc_*`), 
- mezcla de ventanas, objetos no visuales, DataWindows y utilidades, 
- estructura multi-proyecto multi-librería. 

---

## 21. Metodología de investigación para que una IA siga aprendiendo PowerBuilder correctamente

La IA debería investigar PowerBuilder siguiendo siempre este orden:

1. **What’s New / Solution format / PBL folder** para entender el modelo actual de filesystem, compiler y límites del nuevo formato.   
2. **Users Guide** para el flujo del IDE, scripts, variables, funciones, source control, libraries, targets/projects. 
3. **PowerScript Reference** para sintaxis real del lenguaje, scopes, funciones, statements, SQL y eventos. 
4. **Objects and Controls** para Application y otros objetos de runtime.   
5. **DataWindow Reference + DataWindow Programmers Guide** para `.srd`, expresiones, métodos, propiedades y eventos.  
6. **Repositorios Open PFC 2025 Solution/Workspace** como corpus real de validación.   
7. **ORCA / PBAutoBuild docs** solo para integración de build clásica o compatibilidad workspace. 

---

## 22. Arquitectura recomendada del plugin de VS Code

### 22.1 Fases del motor

**Fase 1 — Project detector**  
Detecta `workspace` vs `solution`, identifica raíz, localiza `.pbsln/.pbproj` o `.pbw/.pbt`, descubre libraries. 

**Fase 2 — File classifier**  
Clasifica `.sra/.srw/.sru/.srm/.srd/.srf/.srs/.srq/.srp/.srj`. 

**Fase 3 — Container parser SR\***  
Extrae tipo, herencia, prototipos, eventos especiales, secciones y metadatos. 

**Fase 4 — PowerScript parser**  
Parsea funciones, eventos, scopes, declaraciones, expresiones, llamadas, pronombres, SQL embebido. 

**Fase 5 — DataWindow safe parser**  
Extrae SQL, columnas, retrieve args, eventos y propiedades mínimas. 

**Fase 6 — Semantic index**  
Resuelve definiciones, referencias, herencia, variables por scope, funciones globales, estructuras y tipos derivados. 

### 22.2 Exclusiones por defecto

Ignorar:
- `.pb/**`, 
- `build/**`, 
- `_BackupFiles/**`, 
- binarios/artefactos no fuente. 

---

## 23. Funcionalidades LSP recomendadas en orden de valor

### 23.1 Imprescindibles

- **Syntax highlighting** de PowerScript.   
- **Document Symbols** por objeto, función, evento, variable y prototype.   
- **Go to Definition** para funciones globales, métodos, variables y tipos. 
- **Find References** con scopes reales.   
- **Hover** con firma y origen (`global`, `instance`, `shared`, `local`).  
- **Workspace symbols** multi-librería.   

### 23.2 Alta prioridad

- diagnósticos de **símbolo no resuelto**, 
- diagnóstico de **shadowing** según orden local/shared/global/instance, 
- completado contextual por tipo y por pronombre (`This`, `Parent`), 
- signature help para funciones globales y de objeto. 

### 23.3 Fase posterior

- soporte semántico de DataWindow, 
- rename seguro con herencia, 
- integración build/test workspace + solution. 

---

## 24. Ejemplo de modelo interno que la IA debería construir

### 24.1 Entidades principales

```text
WorkspaceModel
  - mode: workspace | solution
  - roots
  - projects
  - libraries
  - objects
  - symbolIndex

Project
  - name
  - path
  - libraries[]

Library
  - name
  - path
  - kind: pbl-file | pbl-folder | ws_objects-bucket
  - objectFiles[]

PBObject
  - objectKind: application | window | userobject | menu | datawindow | function | structure | query | pipeline | project
  - name
  - ancestor
  - filePath
  - prototypes[]
  - functions[]
  - events[]
  - variables[]
  - diagnostics[]
```

Este modelo refleja la división oficial entre proyecto/solución, librerías y objetos, y además permite incorporar metadatos como `.pblmeta`, herencia y secciones por archivo. 

---

## 25. Ejemplos de “qué va en cada sitio”

### 25.1 Dónde van las **variables globales**
Las variables globales pueden definirse en Application, Window, User Object o Menu painters, y también en Function painter según la documentación de variables y Script editor. Para el plugin, esto significa que una “global” no necesariamente está solo en un `.sra`; puede aparecer en distintos contextos de edición de PowerBuilder. 

### 25.2 Dónde van las **funciones globales**
Las funciones globales se modelan a nivel de Function painter / `.srf`, y también deben indexarse como símbolos accesibles desde otros scripts. El Script editor distingue explícitamente function type `local or global`. 

### 25.3 Dónde van las **variables de instancia/shared**
Pertenecen al objeto (`.sra`, `.srw`, `.sru`, `.srm`) y su scope/visibilidad depende de la declaración. El plugin debe asociarlas al nodo del objeto que las contiene. 

### 25.4 Dónde van los **eventos**
En el script del objeto o control correspondiente, y en SR\* pueden aparecer como bloques específicos `on ... end on`. 

### 25.5 Dónde va el **SQL**
Puede vivir en scripts PowerScript (`DECLARE`, SQL estático o dinámico) o dentro de DataWindow/Query. El plugin debería tratarlos como sublenguajes/contextos distintos.

---

## 26. Errores de diseño que la IA debe evitar

1. **Asumir que todo proyecto moderno usa `ws_objects`**. En Solution no existe.  
2. **Parsear `.srd` como si fuera solo PowerScript**. DataWindow es otro universo.  
3. **Hacer navegación por texto sin scopes**. PowerBuilder resuelve local/shared/global/instance en orden estricto.   
4. **Indexar `.pb` y `build` como fuente**. Son artefactos.   
5. **Suponer que ORCA sirve igual en Solution**. No.   
6. **Ignorar `This`, `Parent`, `::` y herencia**. Rompe casi toda la semántica útil.  

---

## 27. Plan mínimo viable para GitHub Copilot / IA agente

### 27.1 Objetivo v1
Construir un plugin que:
- abra workspaces y solutions, 
- clasifique SR\*, 
- indexe objetos/funciones/eventos/variables, 
- resuelva definiciones y referencias básicas, 
- y haga safe parse de DataWindow. 

### 27.2 Objetivo v2
Añadir:
- completado semántico por tipo, 
- diagnósticos de shadowing/unused, 
- semantic tokens por clase de símbolo, 
- e integración de build dual workspace/solution. 

---

## 28. Resumen ejecutivo para una IA

Si una IA tuviera que quedarse con una sola idea, sería esta:

> **PowerBuilder 2025 debe modelarse como un sistema dual (Workspace + Solution) donde los objetos viven como SR\* individuales, pero esos SR\* no son homogéneos: algunos son contenedores con secciones estructurales y scripts PowerScript, y otros (como DataWindow) representan un sublenguaje propio. La semántica correcta depende de scopes (local/shared/global/instance), pronombres (`This`, `Parent`, `::`), herencia y separación entre fuente real y artefactos generados (`.pb`, `build`).** 

---

## 29. Siguiente uso recomendado de este documento

Usa este MD como **contexto canónico** para GitHub Copilot / Copilot Agent / Claude / GPT cuando les pidas:
- diseñar el parser SR\*, 
- crear el indexador de símbolos, 
- implementar LSP features, 
- o definir la arquitectura del plugin para repositorios grandes como PFC 2025 Solution / Workspace. 
