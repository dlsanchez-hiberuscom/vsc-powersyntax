# Plan de Implementación: Grammar Canónico (B053)

## 1. Módulo `grammar.ts` (Basado en `plugin_old`)

Crear `src/server/parsing/grammar.ts` portando y adaptando la lógica de `pbLanguageGrammar.ts` y `pbIdentifier.ts` del plugin viejo.

### 1.1. Constantes Léxicas Básicas
Aprovechar las bases probadas del antiguo plugin:
```typescript
export const PB_IDENTIFIER_START_SOURCE = '[a-zA-Z_$#%]';
export const PB_IDENTIFIER_BODY_SOURCE = '[\\w$#%-]*';
export const PB_IDENTIFIER_SOURCE = `${PB_IDENTIFIER_START_SOURCE}${PB_IDENTIFIER_BODY_SOURCE}`;

// Para constructos que admiten backticks
export const PB_TYPE_REFERENCE_SOURCE = '[a-zA-Z_$#%][\\w$#%`-]*';
```

### 1.2. Modificadores y Keywords
Importar el array de `PB_KEYWORDS` exacto del plugin antiguo (más de 60 palabras) para asegurar precisión total.

### 1.3. Patrones Compuestos
A diferencia del antiguo plugin (que sólo validaba con `.test()`), en VSC-PowerSyntax necesitamos extraer grupos de captura (nombre, ancestro, return type). Adaptaremos los `RegExp` de `pbLanguageGrammar.ts` para asegurar que los grupos de captura (`()`) sirvan a `matchers.ts`:
```typescript
export const TYPE_DEF_HEADER_REGEX = new RegExp(
  `^\\s*(?:(?:global|public|private|protected)\\s+)?type\\s+(${PB_IDENTIFIER_SOURCE})\\s+from\\s+(${PB_TYPE_REFERENCE_SOURCE})(?:\\s+within\\s+(${PB_TYPE_REFERENCE_SOURCE}))?`, 'i'
);
// ... y así para funciones, eventos, y variables.
```

### 1.3. Patrones Compuestos
Exportar objetos `RegExp` pre-instanciados para evitar el coste de recompilación.
```typescript
export const TYPE_DEF_HEADER_REGEX = new RegExp(`^${WS_OPT}(?:${MODIFIER_ACCESS}${WS_REQ})?type${WS_REQ}(${PB_IDENTIFIER})${WS_REQ}from${WS_REQ}(${PB_TYPE_IDENTIFIER})(?:${WS_REQ}within${WS_REQ}(${PB_TYPE_IDENTIFIER}))?`, 'i');

export const FUNC_IMPL_HEADER_REGEX = new RegExp(`^${WS_OPT}${ANY_MODIFIER}function${WS_REQ}(${PB_TYPE_IDENTIFIER})${WS_REQ}(${PB_IDENTIFIER})${WS_OPT}(?=\\()`, 'i');
export const SUB_IMPL_HEADER_REGEX = new RegExp(`^${WS_OPT}${ANY_MODIFIER}subroutine${WS_REQ}(${PB_IDENTIFIER})${WS_OPT}(?=\\()`, 'i');

export const EVENT_IMPL_HEADER_REGEX = new RegExp(`^${WS_OPT}${ANY_MODIFIER}event${WS_REQ}(${PB_IDENTIFIER}(?:::${PB_IDENTIFIER})?)${WS_OPT}(?:;|\\(|$)`, 'i');
export const ON_IMPL_HEADER_REGEX = new RegExp(`^${WS_OPT}on${WS_REQ}(${PB_IDENTIFIER}(?:\\.${PB_IDENTIFIER})+)${WS_OPT};?${WS_OPT}$`, 'i');

export const VAR_DECL_REGEX = new RegExp(`^${WS_OPT}(${ANY_MODIFIER})(${PB_TYPE_IDENTIFIER}(?:\\{\\d+\\})?)${WS_REQ}(${PB_IDENTIFIER})`, 'i');
```

## 2. Refactorización de `matchers.ts`

Importar los objetos `RegExp` pre-compilados desde `grammar.ts` y reemplazar la ejecución de literales:

```typescript
import {
  TYPE_DEF_HEADER_REGEX,
  FUNC_IMPL_HEADER_REGEX,
  SUB_IMPL_HEADER_REGEX,
  EVENT_IMPL_HEADER_REGEX,
  ON_IMPL_HEADER_REGEX,
  VAR_DECL_REGEX,
  PB_KEYWORDS
} from './grammar';

export function isTypeDefinitionHeader(line: string): boolean {
  return TYPE_DEF_HEADER_REGEX.test(line);
}
//... y así para el resto.
```
*Nota: Reubicar la constante `PB_KEYWORDS` que se creó en `diagnostics.ts` a `grammar.ts` para que esté verdaderamente centralizada, ya que `matchers.ts` también la usa.*

## 3. Refactorización de `diagnostics.ts` y `sections.ts`

- Migrar `PB_KEYWORDS` y `PB_BUILTIN_TYPES` desde `diagnostics.ts` hacia `grammar.ts` para centralizar todo el vocabulario del lenguaje.
- Migrar las comprobaciones léxicas como `matchClosingBlock` en `diagnostics.ts` o las de secciones en `sections.ts` utilizando las bases declarativas de `grammar.ts` si procede, o documentarlas explícitamente en `grammar.ts`.
- En `diagnostics.ts`, reemplazar la detección de llamadas (`callRegex`) por una regex ensamblada a partir de `PB_IDENTIFIER`.

## 4. Tests y Validación

- Asegurarse de que `npm run test:unit` aprueba con un 100%. Las pruebas existentes ya cubren indirectamente todas estas regex a través de `documentAnalysis.test.ts`, `diagnostics.test.ts` y `scopeResolution.test.ts`. No debe alterarse el resultado de análisis (sólo la fuente del patrón de expresiones regulares).
- Medir los tiempos (performance) durante el unit testing para verificar que las RegExp compiladas centralmente mantienen la misma velocidad o superior.
