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
- **¿Por qué es valioso?** En PowerBuilder, dos objetos pueden llamarse igual si están en diferentes Targets. Además, el orden de las `.pbl` en un `.pbt` determina qué objeto "tapa" (overrides) a otro. Traer esta topología permitirá que el "Go to Definition" y "Workspace Symbols" no colisionen y sean idénticos a la compilación real del IDE de PB.

## 2. Parseo de Documentos con Estado (`PbDocumentParser.ts`)

Nuestro analizador actual (`documentAnalysis.ts`) usa expresiones regulares línea a línea de forma agnóstica.

**En el `plugin_old` (`src/powerbuilder/parsing/`):**
- El `PbDocumentParser` (de más de 1300 líneas) usaba una máquina de estados para rastrear bloques: `type variables`, `forward prototypes`, `type prototypes`, `event`, `function`, etc.
- Extraía variables de instancia vs globales vs locales.
- **¿Por qué es valioso?** PowerBuilder divide sus archivos exportados en "secciones" rígidas. Conocer exactamente en qué sección se declara una variable nos permite saber automáticamente su "scope" (¿es compartida `shared`? ¿es de instancia `instance`? ¿es `global`?).

## 3. Motor Semántico Completo (`semanticEngine.ts`)

Esta es posiblemente la pieza más avanzada del plugin viejo. No solo buscaba coincidencias de strings, sino que entendía las reglas de resolución de PowerBuilder.

### A. Grafo de Herencia (`inheritanceGraph.ts`)
Calculaba qué objeto heredaba de cuál. Si tienes un `w_main` que hereda de `w_base`, el motor sabía que una función llamada `of_init` en `w_base` era visible desde `w_main`.
* **Futuro en el nuevo LSP:** Vital para el autocompletado y validación de tipos. Sin esto, si escribimos `this.of_init()`, un LSP plano marcará error porque no ve la función en ese archivo exacto.

### B. Sistema de Ranking para Autocompletado (Code Completion Scoring)
El autocompletado del plugin viejo no devolvía una lista alfabética; devolvía resultados "inteligentes" puntuados dinámicamente (`getCompletionScore`):
- Variables locales en la misma función: **+12,000 puntos** (Arriba del todo).
- Variables de miembro (instancia) válidas para el objeto: **+8,000 puntos**.
- Penalizaciones por "Distancia de Herencia": Si el método viene de un ancestro lejano, perdía puntos en favor de un método sobreescrito localmente.
- Variables compartidas (`shared`) se puntuaban más alto (+225) que las globales (+150).

### C. Resolución Dinámica y Estática de "Dueños" (`ownerResolution.ts`)
Sabía interpretar expresiones compuestas como `dw_1.Object.DataWindow.Bands`. 
Manejaba el "Dynamic Dispatch" (llamadas dinámicas) diferenciándolas de las llamadas estáticas y evaluando si usar `::` para llamadas a ancestros (`isAncestorControlCall`).

---

## 4. Referencias y Refactorización Segura (`semanticOccurrences.ts`)

El plugin viejo tenía implementado un motor formal para:
- **Find All References:** Rastreando usos de una función o variable en todo el proyecto.
- **Rename Symbol:** Renombrado seguro (Plan Rename) asegurándose de no renombrar variables locales que casualmente se llamaran igual en otros archivos.

---

## Conclusión Estratégica

El `plugin_old` no era solo un resaltador de sintaxis; estaba programado como un **compilador frontend** de PowerBuilder. 

**Plan de Acción Futuro Recomendado:**
1. **Prioridad Media:** Traer el parser de `.pbw` y `.pbt` (`PbProjectParser`) para que nuestra `KnowledgeBase` agrupe las entidades por "Target" en lugar de un pool global.
2. **Prioridad Media-Alta:** Implementar el `InheritanceGraph`. Esto desatará el verdadero poder del "Go to Definition" y del "Hover" en proyectos PFC donde todo es orientado a objetos.
3. **Prioridad Alta:** Traer las reglas de Scoring del `SemanticEngine` cuando implementemos la Spec de **Autocompletado Inteligente**.

Estas piezas de código del `plugin_old` están excelentemente tipadas y pueden adaptarse casi 1:1 a la arquitectura de inyección de dependencias y servicios que hemos construido en `vsc-powersyntax`.
