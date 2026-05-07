# Spec: PB-SEMANTIC-P1-POWERSCRIPT-CONTROL-SLICE-01

## 1. Identificación
- **ID:** PB-SEMANTIC-P1-POWERSCRIPT-CONTROL-SLICE-01
- **Título:** Cerrar el slice estructural de IF single-line y exception blocks en PowerScript
- **Estado:** Done
- **Prioridad:** P1
- **Área:** Semántica, Parsing Estructural

## 2. Objetivo
Cerrar un slice estructural concreto y testeable para `IF` single-line y exception blocks (`TRY/CATCH/FINALLY`), sin abrir un canon general de todo el lenguaje.

## 3. Decisiones y Detalles de Implementación

### 3.1 Soporte de IF Single-Line y Continuación
El parser estructural ignora de forma deliberada el single-line `IF ... THEN ... ELSE` para no interferir con la lógica de pila de bloques que requiere `END IF`. Al requerir que un bloque `IF` de múltiples líneas termine lógicamente en `THEN`, evitamos errores en construcciones de una sola línea, incluso si emplean continuaciones lógicas con `&`. La declaración `ELSE` dentro del IF de una sola línea escapa la validación que asume saltos de línea físicos.

### 3.2 Soporte Estructural de TRY/CATCH/FINALLY
Se introdujeron patrones léxicos `CATCH_PATTERN` (`/^catch\b/i`) y `FINALLY_PATTERN` (`/^finally\b/i`).
El parser en `validateStructure` (`diagnostics.ts`) ahora supervisa las cláusulas `CATCH` y `FINALLY` asegurándose de que sólo aparezcan cuando el bloque en el tope del stack es de tipo `try`.
Además, se agregó validación a `ELSE` y equivalentes para garantizar que la cima de la pila sea `if` o `choose-case`.

### 3.3 Status de THROW/THROWS
`THROW` (instrucción de una sola línea, similar a `RETURN`) y `THROWS` (modificador de firma de eventos/funciones) quedan fuera de validación estructural compleja y bloqueos de scope, ya que no inician subcontextos y su comportamiento afecta puramente el resolution de tipos lanzados. Por lo tanto, se documentan como "Partial / Advisory" en el análisis sintáctico actual sin causar falsos positivos de fin de bloque.

## 4. Criterios de Aceptación Cumplidos
- `IF` single line es consumido sin requerir `END IF` y sin falso positivo.
- Expresiones `CATCH` y `FINALLY` sin `TRY` reportan un error estructural.
- `ELSE` sin `IF` o `CHOOSE CASE` reporta un error estructural.
