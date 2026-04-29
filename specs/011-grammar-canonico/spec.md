# Spec 011: Grammar Canónico (B053)

## 1. Motivación
Actualmente, las expresiones regulares que definen cómo se parsea el código PowerBuilder (identificadores, firmas de funciones, declaración de variables, secciones) están dispersas a lo largo de varios archivos: `matchers.ts`, `sections.ts`, `diagnostics.ts` y `documentAnalysis.ts`. Esta dispersión provoca que cualquier cambio en las reglas léxicas (por ejemplo, permitir un nuevo modificador o un carácter especial en identificadores) deba replicarse manualmente en múltiples lugares, generando deuda técnica, riesgo de inconsistencias y dificultando la mantenibilidad. 

El objetivo es abstraer las reglas gramaticales básicas (identificadores, modificadores, etc.) en un único archivo canónico (`grammar.ts`), del que dependan todos los matchers.

## 2. Alcance
- Crear el módulo `src/server/parsing/grammar.ts` para alojar los "building blocks" de la gramática PowerBuilder (bloques declarativos, partes de expresiones regulares).
- Refactorizar `matchers.ts` para que componga sus expresiones regulares utilizando las constantes de `grammar.ts`.
- Refactorizar `sections.ts`, `diagnostics.ts` y `documentAnalysis.ts` para que utilicen este mismo motor léxico centralizado en lugar de regex literales ("hardcoded").
- **Exclusiones**: No se implementará un Abstract Syntax Tree (AST) completo ni un analizador tipo ANTLR. El modelo seguirá basado en expresiones regulares (parser conservador) pero organizadas jerárquicamente.

## 3. Arquitectura y Diseño

### 3.1. Building Blocks del Léxico
`grammar.ts` exportará constantes de cadena y RegExp que representen componentes atómicos, por ejemplo:
- `IDENTIFIER_PATTERN`: Patrón que describe un identificador válido en PB (ej. `[A-Za-z_$#%][\w$#%\-]*`).
- `ACCESS_MODIFIERS`: Modificadores de visibilidad (`public`, `private`, `protected`, `global`, `shared`, etc.).
- Funciones utilitarias para construir expresiones: `buildRegex(parts, flags)`.

### 3.2. Refactorización de Consumidores
Todos los módulos de parseo dejarán de usar literales regex estáticos compuestos para usar la gramática canónica.
- **`matchers.ts`**: Utilizará `IDENTIFIER_PATTERN` para extraer nombres de variables, tipos y funciones.
- **`sections.ts`**: Utilizará la gramática para detectar el inicio y fin de secciones.
- **`diagnostics.ts`**: Utilizará la gramática para el detector de llamadas (`callRegex`), el mapeo de bloques de cierre (`matchClosingBlock`), etc.

## 4. Criterios de Aceptación
1. `grammar.ts` contiene al menos los componentes básicos del léxico (Identificador, Modificadores, Tipos).
2. Las expresiones regulares complejas en `matchers.ts` han sido reemplazadas por patrones compuestos dinámicamente desde `grammar.ts`.
3. Ninguna de las funcionalidades existentes (completado, hover, diagnósticos, extracción de símbolos) sufre regresiones. Todos los tests de la suite (100%) pasan exitosamente.
4. Las pruebas de rendimiento validan que el armado dinámico de Regex (o su instanciación) no incrementa significativamente el tiempo de análisis. (La caché de Regex o instanciación única puede ser necesaria).
