# Spec 012: Semantic Tokens (B027)

**Estado:** cerrada históricamente y normalizada por B233.

**Nota histórica:** el provider `semanticTokens/full` existe hoy en `src/server/features/semanticTokens.ts` con cobertura unitaria en `test/server/unit/semanticTokens.test.ts`, pero la carpeta original no tenía `plan.md` ni `tasks.md`.

## 1. Motivación
Con el backbone semántico ya implementado (KnowledgeBase, extracciones y scopes), el editor actualmente colorea el código PowerBuilder apoyándose de forma exclusiva en la gramática de TextMate (`powerbuilder.tmLanguage.json`). TextMate, al ser puramente léxico/regex, no puede distinguir el significado profundo de los tokens en todos los casos. Por ejemplo, no puede distinguir si un identificador genérico es una variable local, una variable de instancia, un parámetro, o una función oficial del sistema.

La implementación de los Semantic Tokens permitirá que el Language Server (LSP) enriquezca y sobrescriba el coloreado sintáctico aportando un nivel de detalle semántico basado en roles y scopes (ej. colorear de forma distinta propiedades de clases heredadas, parámetros de función, y métodos).

## 2. Alcance
- Implementar `textDocument/semanticTokens/full` en el servidor LSP.
- Proveer los `semanticTokensLegend` requeridos al inicializar el servidor.
- Utilizar el `semanticQueryService` y el conocimiento extraído (KnowledgeBase, Scopes) para mapear rangos de código a tipos de tokens semánticos y modificadores (ej. `variable`, `parameter`, `property`, `function`, `class`, con modificadores como `readonly`, `defaultLibrary`).
- **Exclusiones**: No se implementará por el momento `semanticTokens/range` ni `semanticTokens/full/delta` por simplicidad, priorizando obtener el valor visual en el `full`.

## 3. Arquitectura y Diseño

### 3.1. Legends
Se definirán los tipos base en el `semanticTokensLegend`.
Tipos comunes a soportar:
- `variable`
- `parameter`
- `property`
- `function`
- `method`
- `class`
- `type`

Modificadores:
- `declaration`
- `readonly`
- `defaultLibrary` (para el catálogo del sistema)

### 3.2. Extracción de Tokens
Se creará un `semanticTokensProvider.ts` que iterará sobre las entidades extraídas en el `documentAnalysis.ts` y sobre las llamadas a funciones detectadas, generando los tokens correspondientes mediante un `SemanticTokensBuilder`.

### 3.3. Rendimiento
El cálculo de semantic tokens será demandado frecuentemente por VS Code al editar. Debe apoyarse de forma estricta en el resultado analítico almacenado en el `DocumentCache` y el análisis de scopes ya existente para evitar re-parseos costosos.

## 4. Criterios de Aceptación
1. El servidor LSP responde a las solicitudes de `semanticTokens/full` con un array codificado de tokens.
2. El coloreado en el editor evidencia la distinción entre variables locales, parámetros y funciones de sistema.
3. No hay degradación en la latencia de respuesta de los handlers interactivos (completion, hover, signature help).
4. El conjunto de pruebas pasa exitosamente sin regresiones de rendimiento en la extracción documental.
