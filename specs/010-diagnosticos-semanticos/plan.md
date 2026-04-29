# [010] Plan técnico — Diagnósticos Semánticos Iniciales

## 1. Resumen técnico

Se añadirá una función `validateSemantics()` que complemente a la existente `validateStructure()`. Ambas se invocarán desde el scheduling de diagnósticos existente. La validación semántica escaneará las líneas del documento fuera de secciones declarativas, buscando identificadores que no se resuelvan contra el scope local, variables de instancia, la jerarquía de herencia (vía InheritanceGraph) o el catálogo del sistema (vía SystemCatalog).

## 2. Estado actual

### Diagnósticos existentes
- `validateStructure()` en `features/diagnostics.ts` — valida bloques abiertos/cerrados (IF, FOR, type, function, etc.).
- `publishDiagnosticsNow()` y `scheduleDiagnostics()` en `analysis/diagnosticScheduler.ts` — manejan debounce y publicación.
- `getDocumentAnalysis()` en `analysis/analysisCache.ts` — retorna análisis cacheado con facts, scopes y secciones.

### Infraestructura disponible
- `KnowledgeBase.getScopeAt(uri, line)` — devuelve el scope más profundo para una línea.
- `InheritanceGraph.getMembers(typeName)` — devuelve todos los miembros de la jerarquía.
- `SystemCatalog.findFunction(name)` — busca funciones oficiales del lenguaje.
- `DocumentAnalysis.scopes` — árbol de scopes con variables locales y parámetros.

## 3. Diseño propuesto

### 3.1 Nueva función `validateSemantics()`

```typescript
// features/diagnostics.ts
export function validateSemantics(
  document: TextDocument,
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  inheritanceGraph: InheritanceGraph
): Diagnostic[]
```

**Algoritmo:**
1. Obtener el análisis del documento (`getDocumentAnalysis()`).
2. Encontrar el tipo principal del archivo (Entity con kind=Type en el análisis).
3. Para cada línea fuera de secciones declarativas (forward, prototypes, variables):
   a. Determinar si estamos dentro de un scope Function/Event.
   b. Si la línea contiene una llamada a función (`identifier(`) que parece una invocación:
      - Buscar en scope local (parámetros + variables locales).
      - Buscar en miembros de la jerarquía (InheritanceGraph.getMembers).
      - Buscar en SystemCatalog.
      - Si no se encuentra en ningún lado → emitir diagnóstico.
   c. Si la línea contiene una asignación a una variable no declarada:
      - Buscar en scope local, variables de instancia, y globales.
      - Si no se encuentra → emitir diagnóstico.
4. Validar tipos base (`from`) de todas las definiciones de tipo contra la KB y SystemCatalog.
5. **Variables locales no usadas (SD4)**: para cada scope Function/Event, recorrer sus `symbols` (variables declaradas); para cada una, buscar si su nombre aparece en alguna línea del cuerpo del scope (excluyendo la línea de declaración y parámetros). Si no aparece → emitir diagnóstico Hint.
6. **Variables privadas no usadas (SD5)**: para cada variable de instancia que sea `private` (detectando el modificador en `detail`), buscar si su nombre aparece en alguna línea del archivo fuera de secciones `variables`. Si no aparece → emitir diagnóstico Hint.

### 3.2 Lista de keywords a excluir

Se añadirá una constante `PB_KEYWORDS` con las keywords del lenguaje PowerBuilder que no deben generar diagnósticos de "variable no declarada". Ejemplos: `if`, `then`, `else`, `end`, `for`, `to`, `next`, `do`, `loop`, `while`, `until`, `return`, `destroy`, `create`, `true`, `false`, `this`, `super`, `parent`, `sqlca`, `sqlsa`, `sqlda`, `error`, `message`.

### 3.3 Lista de tipos built-in a excluir

Los tipos base del lenguaje (`integer`, `long`, `string`, `boolean`, `any`, `blob`, `char`, `date`, `datetime`, `decimal`, `double`, `real`, `time`, `uint`, `ulong`, `window`, `application`, `datawindow`, `datastore`, `transaction`, `dynamicdescriptionarea`, `dynamicstagingarea`, `oleobject`, `powerobject`, `nonvisualobject`, `graphicobject`) no deben generar diagnósticos de tipo inexistente.

### 3.4 Integración con el pipeline

```
publishDiagnosticsNow()
  └─→ validateStructure(document)        // existente
  └─→ validateSemantics(document, kb, systemCatalog, inheritanceGraph)  // NUEVO
  └─→ combinar diagnostics
  └─→ connection.sendDiagnostics()
```

Esto requiere modificar `diagnosticScheduler.ts` para pasar los backends semánticos a `publishDiagnosticsNow`.

### 3.5 Patrón de extracción de identificadores

Para esta fase, se usará un enfoque conservador basado en regex para extraer:
- Llamadas a función: `/\b([a-z_]\w*)\s*\(/ig` (identificador seguido de paréntesis).
- Asignaciones: `/^(\s*)([a-z_]\w*)\s*=/ig` (identificador al inicio de línea seguido de `=`).

No se intentará parsear expresiones completas.

## 4. Impacto en rendimiento

- **Latencia adicional**: Se estima < 10ms por archivo típico (100-300 líneas), ya que el análisis reutiliza scopes y miembros ya cacheados.
- **Memoria**: Sin incremento significativo — los diagnósticos son transitorios.
- **Indexación**: No afecta al indexador; solo consume datos ya existentes en la KB.

## 5. Riesgos técnicos

- **Falsos positivos en variables globales**: Las variables globales de PowerBuilder no están en el scope local. Mitigación: no emitir diagnóstico si la variable podría ser global (excluir de la regla SD1 por ahora).
- **Falsos positivos en expresiones complejas**: `dw_1.GetItemString(1, "name")` — el `GetItemString` es un método del DataWindow, no se encuentra en la jerarquía del tipo actual. Mitigación: no validar la parte derecha de expresiones con `.` (dejar para B060).
- **Keywords confundidas con variables**: Mitigación: la lista `PB_KEYWORDS` debe ser exhaustiva.

## 6. Estrategia de validación

### Tests unitarios
- test para SD1: variable no declarada dentro de función → diagnóstico.
- test para SD1: variable declarada localmente → sin diagnóstico.
- test para SD1: parámetro de función → sin diagnóstico.
- test para SD2: llamada a función inexistente → diagnóstico.
- test para SD2: llamada a función heredada → sin diagnóstico.
- test para SD2: llamada a función del SystemCatalog → sin diagnóstico.
- test para SD3: tipo base inexistente → diagnóstico.
- test para SD3: tipo base del lenguaje (built-in) → sin diagnóstico.
- test para keywords: keyword del lenguaje no genera diagnóstico.
- test para SD4: variable local no usada → diagnóstico Hint.
- test para SD4: variable local usada → sin diagnóstico.
- test para SD4: parámetro de función no usado → NO genera diagnóstico (los parámetros son contractuales).
- test para SD5: variable privada no usada → diagnóstico Hint.
- test para SD5: variable privada usada en un método → sin diagnóstico.
- test para SD5: variable no privada no usada → NO genera diagnóstico (puede usarse externamente).

### Validación manual
- Abrir un archivo PowerBuilder con el plugin (F5) y verificar que aparecen diagnósticos en el panel de problemas.
- Verificar que no aparecen falsos positivos en un archivo limpio.

### Performance
- Medir latencia de diagnósticos con el timing existente (ya integrado en `publishDiagnosticsNow`).

## 7. Documentación a actualizar

- `docs/current-focus.md` — marcar B033 como cerrada.
- `docs/backlog.md` — actualizar estado de B033.
- `README.md` — añadir "diagnósticos semánticos iniciales" al estado actual.
- `docs/roadmap.md` — actualizar Fase 6A con progreso.

## 8. Módulos afectados

| Módulo | Tipo de cambio |
|---|---|
| `server/features/diagnostics.ts` | Añadir `validateSemantics()` |
| `server/analysis/diagnosticScheduler.ts` | Pasar backends semánticos a publishDiagnosticsNow |
| `server/server.ts` | Pasar KB, SystemCatalog, InheritanceGraph al scheduler |
| `test/server/features/diagnostics.test.ts` | Nuevo archivo de tests |
| `test/fixtures/` | Posibles nuevos fixtures para diagnósticos |
