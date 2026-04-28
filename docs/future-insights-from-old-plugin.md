# Insights y Capacidades Avanzadas del `plugin_old`

Al analizar en detalle la carpeta `plugin_old`, se revela que contenía un motor semántico y de análisis sumamente robusto y profundo para PowerBuilder.
Estas capacidades superan con creces el parsing básico, adentrándose en cómo PowerBuilder compila y resuelve ámbitos (scopes), herencias y librerías.

Este documento recopila las **"joyas de la corona"** del antiguo plugin que deberíamos considerar portar progresivamente a `vsc-powersyntax` en futuras fases para convertirlo en un Language Server de grado comercial.

---

## 1. Topología de Proyectos y Librerías (Workspace & Target Parsing)

Actualmente, nuestro nuevo LSP lee todos los archivos `.sru`, `.srw`, etc., como si fueran un gran saco plano (flat scope).

**En el `plugin_old` (`src/powerbuilder/workspace/`):**
- **Parseo de `.pbw` y `.pbt`:** El plugin viejo leía el `Workspace` y el `Target` explícitamente (`pbBuildTargetParser.ts`, `pbProjectParser.ts`).
- **`PbLibraryGraph`:** Construía un grafo de dependencias de librerías (`.pbl`).
- **`PowerBuilderProjectRegistry`:** Un registro centralizado que sabía asociar cada archivo fuente con su proyecto preferido (por matching de path), soportando múltiples proyectos en el mismo workspace.
- **¿Por qué es valioso?** En PowerBuilder, dos objetos pueden llamarse igual si están en diferentes Targets. Además, el orden de las `.pbl` en un `.pbt` determina qué objeto "tapa" (overrides) a otro. Traer esta topología permitirá que el "Go to Definition" y "Workspace Symbols" no colisionen y sean idénticos a la compilación real del IDE de PB.

**Archivos clave a portar:**
- `workspace/pbBuildTargetParser.ts` — Parser de `.pbw`, `.pbt`, `.pbsln` con soporte de secciones INI, rutas relativas y absolutas, y resolución de referencias encadenadas.
- `workspace/projectRegistry.ts` — Registro con scoring inteligente para asignar archivos fuente al proyecto más probable.

**Fase objetivo:** Fase 5 (navegación por herencia) o Fase 8 (escala real).

---

## 2. Parseo de Documentos con Estado (`PbDocumentParser.ts`)

Nuestro analizador actual (`documentAnalysis.ts`) usa expresiones regulares línea a línea de forma agnóstica.

**En el `plugin_old` (`src/powerbuilder/parsing/`):**
- El `PbDocumentParser` (de más de 1300 líneas) usaba una máquina de estados para rastrear bloques: `type variables`, `forward prototypes`, `type prototypes`, `event`, `function`, etc.
- Extraía variables de instancia vs globales vs locales.
- Distinguía entre `file-object` (el tipo raíz del archivo exportado) y tipos anidados (`within`).
- Extraía firmas con conteo de parámetros, tipos de retorno, y detectaba funciones externas con `library "..."` y `alias for`.
- **¿Por qué es valioso?** PowerBuilder divide sus archivos exportados en "secciones" rígidas. Conocer exactamente en qué sección se declara una variable nos permite saber automáticamente su "scope" (¿es compartida `shared`? ¿es de instancia `instance`? ¿es `global`?).

**Fase objetivo:** Fase 5-6 (mejora de la base semántica).

---

## 3. Motor Semántico Completo (`semanticEngine.ts`)

Esta es posiblemente la pieza más avanzada del plugin viejo. No solo buscaba coincidencias de strings, sino que entendía las reglas de resolución de PowerBuilder.

### A. Grafo de Herencia (`inheritanceGraph.ts`)

Calculaba qué objeto heredaba de cuál. Si tienes un `w_main` que hereda de `w_base`, el motor sabía que una función llamada `of_init` en `w_base` era visible desde `w_main`.

**Implementación destacada:**
- BFS (breadth-first search) para calcular la cadena de ancestros completa.
- Cachés múltiples: `ancestorCache`, `hierarchyCache`, `derivedTypeCache`, `memberCache`, todos invalidados automáticamente vía `onDidChange`.
- `getTypeDistance()`: calcula la distancia en la jerarquía entre dos tipos, fundamental para el scoring.
- `getMembers()`: recolecta todos los miembros accesibles de un tipo resolviendo toda la cadena hereditaria.
- `getDirectDerivedTypes()`: obtiene los tipos que heredan directamente (usado para "Show Call Hierarchy" / inspección).

**Futuro en el nuevo LSP:** Vital para el autocompletado y validación de tipos. Sin esto, si escribimos `this.of_init()`, un LSP plano marcará error porque no ve la función en ese archivo exacto.

**Fase objetivo:** Fase 5 (herencia y owner-awareness) y Fase 7 (resolución fuerte).

### B. Sistema de Ranking para Autocompletado (Code Completion Scoring)

El autocompletado del plugin viejo no devolvía una lista alfabética; devolvía resultados "inteligentes" puntuados dinámicamente (`getCompletionScore`):
- Variables locales en la misma función: **+12,000 puntos** (Arriba del todo).
- Variables de miembro (instancia) válidas para el objeto: **+8,000 puntos**.
- Penalizaciones por "Distancia de Herencia": Si el método viene de un ancestro lejano, perdía puntos en favor de un método sobreescrito localmente.
- Variables compartidas (`shared`) se puntuaban más alto (+225) que las globales (+150).
- Bonus por estar en el mismo archivo (+100), por ser implementación vs prototipo (+20/+10).

**Fase objetivo:** Fase 6 (completado contextual).

### C. Resolución Dinámica y Estática de "Dueños" (`ownerResolution.ts`)

Sabía interpretar expresiones compuestas como `dw_1.Object.DataWindow.Bands`.
Manejaba el "Dynamic Dispatch" (llamadas dinámicas) diferenciándolas de las llamadas estáticas y evaluando si usar `::` para llamadas a ancestros (`isAncestorControlCall`).

**Fase objetivo:** Fase 5 (owner-awareness) y Fase 7 (resolución fuerte).

---

## 4. Sistema de Visibilidad de Símbolos (`symbolVisibility.ts`)

El plugin viejo implementaba las reglas reales de visibilidad de PowerBuilder:

- **`public`**: visible desde cualquier lugar.
- **`protected` / `protectedread` / `protectedwrite`**: visible solo dentro de la jerarquía de herencia. Usaba `getTypeDistance()` para verificar si el tipo actual está en la cadena ancestral del tipo que declara la variable.
- **`private` / `privateread` / `privatewrite`**: visible solo si `typeDistance === 0` (mismo tipo declarante).
- **Regla de fallback**: si no hay contexto tipado suficiente para determinar la visibilidad, el símbolo se muestra (para evitar falsos positivos).

**Patrón rescatable:** `filterSymbolsVisibleFromPosition()` y `getSymbolVisibility()` se pueden trasladar casi 1:1 cuando tengamos `InheritanceGraph`.

**Fase objetivo:** Fase 7 (semántica fuerte).

---

## 5. Referencias y Refactorización Segura (`semanticOccurrences.ts`)

El plugin viejo tenía implementado un motor formal de 35 KB para:
- **Find All References:** Rastreando usos de una función o variable en todo el proyecto.
- **Rename Symbol:** Renombrado seguro (Plan Rename) asegurándose de no renombrar variables locales que casualmente se llamaran igual en otros archivos.

**Fase objetivo:** Fase 7 (renombrado seguro).

---

## 6. Gramática Centralizada de PowerBuilder (`pbLanguageGrammar.ts`)

Un patrón de diseño que no hemos replicado aún:

**El plugin viejo centralizaba TODAS las regex del lenguaje en un único archivo `pbLanguageGrammar.ts`:**
- Cada patrón tenía una constante nombrada y exportada (`ROOT_TYPE_PATTERN`, `FUNCTION_PATTERN`, `EVENT_PATTERN`, etc.).
- Los matchers de apertura y cierre de bloque estaban organizados en **tablas declarativas** (`STRUCTURE_OPEN_MATCHERS`, `STRUCTURE_CLOSE_MATCHERS`), que asocian cada `RegExp` con su tipo de bloque (`PbStructureBlockKind`).
- Incluía un diccionario completo de **keywords** de PowerScript (`PB_KEYWORDS`) y una función para generar el patrón regex compilado (`createPbKeywordPattern()`).
- Cubría bloques ejecutables (`IF`, `FOR`, `DO`, `CHOOSE CASE`, `TRY`) además de los estructurales.

**¿Por qué es valioso?** En nuestro código actual, las regex están dispersas entre `matchers.ts`, `diagnostics.ts`, `documentSymbols.ts` y `documentAnalysis.ts`. Centralizar en un módulo de gramática canónico:
1. Evita duplicación y divergencia de patrones.
2. Facilita el testing de la gramática como unidad independiente.
3. Permite agregar nuevos bloques (ej. `CHOOSE CASE`, `TRY`) sin tocar múltiples archivos.

**Mejora sugerida para el plugin actual:** Unificar las regex y los matchers de apertura/cierre en un módulo `grammar.ts` centralizado. Esto puede hacerse incrementalmente sin romper nada.

**Fase objetivo:** Mejora continua (puede hacerse en cualquier momento como refactor de calidad).

---

## 7. Modelo de Símbolo Enriquecido (`PbSymbol`)

Nuestro `Entity` actual tiene ~8 campos. El `PbSymbol` del plugin viejo tenía **22 campos**, cada uno con propósito claro:

| Campo | Propósito | Estado en nuestro plugin |
|---|---|---|
| `containerName` | Objeto padre | ✅ Recién añadido |
| `containerKind` | Tipo del contenedor (`file-object`, `type`, `function`...) | ❌ Falta |
| `containerSignature` | Firma del callable contenedor | ❌ Falta |
| `fileObjectName` | Nombre del objeto raíz del archivo PB exportado | ❌ Falta |
| `declarationScope` | `member` / `local` / `parameter` | ❌ Falta |
| `baseTypeName` | Tipo base (para resolver herencia) | ❌ Falta |
| `signature` | Firma completa normalizada | ✅ Existe |
| `parameterCount` | Conteo de parámetros | ❌ Falta |
| `isPrototype` | Si viene de `forward prototypes` | ❌ Parcial (tenemos `declarationOnly`) |
| `implementationKind` | `implementation` / `prototype` / `on-handler` / `qualified-event` | ❌ Falta |
| `ownerName` | Dueño explícito en eventos calificados u `ON` handlers | ❌ Falta |
| `isExternal` | Función externa (`library "..."`) | ❌ Falta |
| `externalLibraryName` | Nombre de la DLL | ❌ Falta |
| `externalName` | Alias exportado (`alias for "..."`) | ❌ Falta |
| `access` | Modificador de acceso (`public`, `private`, `protected`...) | ❌ Falta |
| `returnType` | Tipo de retorno | ❌ Parcial (en `signature`) |
| `children` | Hijos del símbolo | ✅ Existe (en DocumentSymbol) |

**Mejora recomendada:** Enriquecer progresivamente nuestro `Entity` con los campos que cada nueva feature necesite, sin añadirlos todos de golpe. Priorizar: `baseTypeName` (para herencia), `declarationScope` (para scoring), `access` (para visibilidad).

**Fase objetivo:** Cada campo se añade en la fase que lo necesite.

---

## 8. Índice de Símbolos con Batch Updates (`SymbolIndex`)

El `SymbolIndex` del plugin viejo tenía un patrón elegante de actualización por lotes:

```typescript
beginBatchUpdate(): void { this.batchDepth++; }
endBatchUpdate(): void {
    if (this.batchDepth > 0) this.batchDepth--;
    if (this.batchDepth === 0 && this.hasPendingChange) {
        this.hasPendingChange = false;
        this.onDidChangeEmitter.fire();
    }
}
```

Esto permitía indexar 500 archivos PFC sin disparar 500 eventos de cambio (solo uno al final). Nuestra `KnowledgeBase` actual notifica implícitamente por cada `upsertDocument`. Cuando escalemos a workspaces grandes, necesitaremos este patrón.

También tenía:
- `findSymbolsAtPosition()` con ordenación por *nesting* (el bloque más interno primero).
- `findInnermostCallableAtPosition()` y `findInnermostTypeAtPosition()` para obtener el contexto posicional del cursor.

**Fase objetivo:** Fase 8 (escala real).

---

## 9. Soporte Avanzado de DataWindow

El plugin viejo tenía un **ecosistema completo de DataWindow** en `src/powerbuilder/datawindow/`:

- **`pbDataWindowParser.ts` (631 líneas):** Parser dedicado para archivos `.srd` que entiende la sintaxis de DataWindow (bandas, tabla, columnas, retrieve, textos). Genera un árbol jerárquico `PbDataWindowNode` con un Outline propio.
- **`pbDataWindowHover.ts`:** Hover enriquecido sobre propiedades de columnas, bandas y expresiones DataWindow.
- **`pbDataWindowDiagnostics.ts`:** Diagnósticos específicos para DataWindows.
- **`pbPowerScriptDataWindowLinks.ts` (35 KB):** Navegación desde PowerScript a controles/columnas de DataWindow y viceversa.
- **`pbPowerScriptDataWindowProperties.ts` (28 KB):** Autocompletado de propiedades `.Object.` de DataWindow (ej. `dw_1.Object.DataWindow.Print.Preview`).
- **`pbPowerScriptDataWindowColumnOccurrences.ts`:** Find References de columnas DataWindow en código PowerScript.

**¿Por qué es valioso?** DataWindow es el diferenciador #1 de PowerBuilder. Ningún otro plugin o IDE competidor ofrece este nivel de soporte semántico para DataWindows. Portarlo nos daría una ventaja competitiva enorme.

**Fase objetivo:** Fase 9 (especialización PowerBuilder).

---

## 10. Inspección de Jerarquía de Herencia (`hierarchy/`)

El plugin viejo tenía un subsistema completo de **inspección de herencia** con:

- **`inheritanceHierarchyService.ts` (521 líneas):** Genera un informe completo en Markdown con: cadena de ancestros, descendencia directa, relaciones entre el objeto actual y el objeto foco, precisión del análisis, y evidencia semántica.
- **`activeHierarchyInspectionService.ts` (26 KB):** Servicio que inspecciona el estado de herencia en la posición actual del cursor.
- **`ancestorScriptService.ts` (25 KB):** Servicio que permite navegar al script del ancestro directo de un evento o función. Fundamental para el flujo `CALL ancestor::event_name`.

**¿Por qué es valioso?** En PFC y frameworks grandes, la herencia es todo. Un desarrollador necesita saber "¿de dónde viene esta función?" y "¿quién más la usa?". Este servicio responde a ambas preguntas.

**Fase objetivo:** Fase 5 (herencia) y Fase 8 (explorador semántico).

---

## 11. API Pública Extensible (`publicApi.ts` / `publicApiContract.ts`)

El plugin viejo exponía una **API pública consumible por otras extensiones o herramientas externas**:

- Consultas semánticas (`runSemanticQuery`, `runSemanticQueryBatch`).
- Navegación programática (`runSemanticNavigate`).
- Exportación de manifiestos del workspace.
- Reportes de build y diagnósticos.
- Inspección de jerarquía.

**¿Por qué es valioso?** Esto es exactamente lo que necesitaremos en la Fase 10 (Plataforma Abierta). Ya existe un diseño probado con versionado de API, contratos tipados y separación entre interfaz pública e implementación interna.

**Fase objetivo:** Fase 10 (plataforma abierta).

---

## 12. Sistema de Diagnósticos Agrupados (`pbDiagnosticsSnapshot.ts`)

El plugin viejo no se limitaba a publicar una lista plana de errores. Tenía un sistema de **snapshot de diagnósticos** que:

- Agrupaba los diagnósticos por proyecto (usando `ProjectRegistry`).
- Dentro de cada proyecto, agrupaba por objeto (archivo fuente).
- Contaba errores vs warnings por cada nivel.
- Ordenaba los resultados por severidad (errores primero, luego por nombre).
- Filtraba solo diagnósticos de fuentes soportadas (`PowerBuilder`, `PBAutoBuild`).

**Patrón rescatable:** `PbDiagnosticsSnapshot` + `formatPowerBuilderDiagnosticsViewMessage()` para cuando implementemos un panel de diagnósticos global.

**Fase objetivo:** Fase 8 (escala real) y Fase 9 (integración con PBAutoBuild).

---

## 13. CodeLens para PowerScript (`pbPowerScriptCodeLens.ts`)

El plugin viejo tenía CodeLens (los textos interactivos que aparecen encima de cada función/evento):

- Mostraba conteo de referencias.
- Indicaba si la función era heredada y de quién.
- Enlazaba a acciones como "Ver jerarquía" o "Navegar a ancestro".

**Fase objetivo:** Fase 7 o posterior.

---

## Mejoras Directas para el Plugin Actual

Además de las capacidades para portar en el futuro, el análisis del `plugin_old` revela varias mejoras de calidad que podemos aplicar **ya** al plugin actual:

### A. Centralizar las regex de gramática
Nuestras regex están dispersas en `matchers.ts`, `diagnostics.ts` y `documentSymbols.ts`. Crear un módulo `grammar.ts` centralizado, imitando `pbLanguageGrammar.ts`, evitaría divergencia y simplificaría el testing.

### B. Mejorar nuestro `matchClosingBlock`
En nuestro `diagnostics.ts`, `matchClosingBlock` no cubre `IF/THEN`, `FOR/NEXT`, `DO/LOOP`, `CHOOSE CASE/END CHOOSE`, ni `TRY/END TRY`. El `plugin_old` los tenía todos mapeados en tablas declarativas. Podemos portarlos para detectar más errores estructurales.

### C. Añadir `baseTypeName` a `Entity`
Es el campo más impactante que nos falta. Con una simple regex sobre la línea `type X from Y`, podemos extraer `Y` como `baseTypeName` y empezar a construir el grafo de herencia sin tocar el parser profundo.

### D. Añadir Batch Update a `KnowledgeBase`
El patrón `beginBatchUpdate()` / `endBatchUpdate()` es trivial de implementar y evita que la indexación inicial dispare cientos de notificaciones innecesarias.

---

## Conclusión Estratégica

El `plugin_old` no era solo un resaltador de sintaxis; estaba programado como un **compilador frontend** de PowerBuilder.

**Plan de Acción Futuro Recomendado (por prioridad):**

1. **Inmediata — Refactor de calidad:** Centralizar regex en un módulo `grammar.ts` y añadir `baseTypeName` a `Entity`.
2. **Fase 5 — Herencia:** Portar `InheritanceGraph` y conectarlo a nuestra `KnowledgeBase`. Esto desatará el verdadero poder del "Go to Definition" y del "Hover" en proyectos PFC.
3. **Fase 5-6 — Topología:** Traer el parser de `.pbw` y `.pbt` (`PbBuildTargetParser`) para que nuestra `KnowledgeBase` agrupe las entidades por "Target" en lugar de un pool global.
4. **Fase 6 — Autocompletado:** Traer las reglas de Scoring del `SemanticEngine` para un intellisense inteligente.
5. **Fase 7 — Visibilidad:** Portar `symbolVisibility.ts` para aplicar reglas reales de `public/private/protected`.
6. **Fase 9 — DataWindow:** Portar el ecosistema completo de DataWindow (~200 KB de código especializado).
7. **Fase 10 — API Pública:** Implementar `publicApi.ts` con contratos versionados.

Estas piezas de código del `plugin_old` están excelentemente tipadas y pueden adaptarse casi 1:1 a la arquitectura de inyección de dependencias y servicios que hemos construido en `vsc-powersyntax`.
