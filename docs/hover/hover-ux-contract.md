# Hover UX Contract — PowerBuilder VS Code Plugin

## 1. Objetivo

Definir cómo debe ser el hover visible para el usuario final.

El hover debe ser rápido, compacto y útil. No debe mostrar trazas internas del motor semántico salvo que exista un modo diagnóstico/debug explícito.

---

## 2. Principios

Hover debe responder:

```txt
¿Qué es esto?
¿De qué tipo es?
¿De dónde viene?
¿Qué hereda?
¿Hay algún riesgo real?
```

Hover no debe mostrar por defecto:

```txt
Origen
Autoridad
Fase
Confianza: direct
Confianza de resolución: high
Motivo de resolución
Candidatos ganadores
Declaration scope
Owner real
Container kind
Callable contenedor técnico
```

Esa información pertenece a:

```txt
Explain Semantic Query
object-check
debug hover mode
logs/tests
```

---

## 3. Niveles de detalle

```txt
compact    -> default; información mínima útil
standard   -> compact + herencia/source útil
diagnostic -> añade warnings si hay fallback/ambigüedad/dynamic/external
debug      -> trace completo interno
```

Default recomendado: `compact` o `standard`.

---

## 4. Formatos por tipo

### 4.1 Variable local

```markdown
**Local variable** `ls_sqlsyntax`

```powerscript
string ls_sqlsyntax
```

Scope: event `pfc_values`
```

### 4.2 Variable miembro / instance variable

```markdown
**Instance variable** `idw_requestor`

```powerscript
public u_dw idw_requestor
```

Type: `u_dw`  
Inherits: `u_dw → datawindow`
```

### 4.3 Tipo / clase / user object

```markdown
**Type** `n_cst_selection`

Inherits: `n_cst_selection → pfc_n_cst_selection`
```

Si hay baja confianza útil para usuario:

```markdown
⚠ Resolved using workspace fallback. Some inherited members may be incomplete.
```

### 4.4 Función de sistema

```markdown
**System function** `Len`

```powerscript
long Len(string value)
```

Returns the length of a string.
```

### 4.5 Función de usuario

```markdown
**Function** `of_validate_column`

```powerscript
integer of_validate_column(string as_column)
```

Defined in: `pfc_n_cst_dwsrv_querymode`
```

Si es heredada:

```markdown
**Inherited function** `of_validate_column`

```powerscript
integer of_validate_column(string as_column)
```

Defined in: `pfc_n_cst_dwsrv`  
Inherited by: `pfc_n_cst_dwsrv_querymode`
```

### 4.6 Evento

```markdown
**Event** `pfc_values`

```powerscript
event pfc_values()
```

Defined in: `pfc_n_cst_dwsrv_querymode`
```

No debe incluir texto posterior a `;` en la cabecera.

### 4.7 Función nativa DataWindow

```markdown
**DataWindow function** `GetColumnName`

```powerscript
string GetColumnName()
```

Receiver: `idw_requestor : u_dw → datawindow`
```

### 4.8 External function / PBX / DLL

```markdown
**External function** `FunctionName`

```powerscript
function long FunctionName(...) library "xxx.dll"
```

⚠ External/native call. Runtime behavior is not validated.
```

### 4.9 SQL embebido / dinámico

```markdown
**Embedded SQL**

Statement: `SELECT`  
Transaction: `SQLCA`
```

Para dinámico:

```markdown
**Dynamic SQL**

⚠ SQL text is built dynamically. Static analysis is limited.
```

### 4.10 Diagnostic hover

Para unreachable real:

```markdown
**Unreachable code**

This statement cannot execute because a previous `RETURN` exits the current block.

Previous exit: line 130
```

No debe aparecer sobre `END IF` ni cierres estructurales equivalentes.

---

## 5. Warnings permitidos en hover normal

Mostrar warning solo si aporta valor real:

```txt
ambiguous target
low confidence relevante
dynamic call/string
external/native call
sourceOrigin no confiable
workspace fallback que cambia resultado
DataWindow dinámico
```

No mostrar `confidence high/direct` ni `candidates: 1`.

---

## 6. Criterios de aceptación

- Hover normal no muestra trace interno.
- Hover muestra firma/declaración útil.
- Herencia aparece cuando aporta valor.
- Warnings aparecen solo si hay riesgo real.
- Debug trace queda disponible vía explain/debug, no por defecto.
- Tests cubren cada tipo de hover.
