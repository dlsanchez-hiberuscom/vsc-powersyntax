# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento refleja el foco operativo actual del proyecto.

Debe responder siempre a estas preguntas:

- qué estamos cerrando ahora,
- por qué es prioritario,
- qué no debemos tocar salvo necesidad,
- cuál es el siguiente paso natural,
- y qué condición debe cumplirse para cambiar el foco.

Este documento no describe aspiraciones a largo plazo, sino el **trabajo inmediato y realista** que debe cerrarse antes de abrir nuevas capas del producto.

---

## 2. Estado real del proyecto

### Capacidades ya implementadas

El proyecto dispone actualmente de una base funcional que incluye:

- **cliente ligero** en `src/client/extension.ts` (~130 líneas, sin semántica ni parseo),
- **servidor LSP separado** en `src/server/server.ts` con wiring limpio,
- **activación perezosa** por contribución declarativa del lenguaje (sin `activationEvents` explícitos; VS Code activa automáticamente vía `onLanguage:powerbuilder`),
- **Document Symbols jerárquicos** funcionales con anidación correcta de funciones/eventos dentro de sus contenedores (clases/tipos),
- **Hover semántico** con contexto por símbolo, catálogo oficial y resolución por herencia,
- **Go to Definition** con resolución de herencia, cualificadores (`this.`, `super.`, variables tipadas) y distancia semántica,
- **Completado Contextual** semántico con soporte para herencia, cualificadores y scoring por ámbito (local/miembro/global),
- **Ayuda de firmas (Signature Help)** interactiva con soporte para parámetros y llamadas anidadas,
- **Diagnósticos estructurales** con validación de bloques abiertos/cerrados (incluidos bloques ejecutables como IF/FOR/DO),
- **Caché de análisis** por documento con invalidación por cierre,
- **Scheduling de diagnósticos** con debounce para no saturar al editar,
- **Parseo** de secciones, declaraciones y cabeceras de implementación,
- **KnowledgeBase** con soporte para indexación global, actualizaciones en lote (batch updates) y scopes,
- **InheritanceGraph** para resolución de herencia y miembros heredados,
- **SemanticQueryService** como capa de consultas compartidas para definition y hover,
- **SystemCatalog** con funciones oficiales del lenguaje PowerBuilder,
- **Gramática TextMate** principal y gramática para bloques PowerBuilder en Markdown,
- **Descubrimiento de workspace** con crawler asíncrono y cooperativo,
- **FileSystemWatcher** para archivos de proyecto PowerBuilder (`.pbw`, `.pbt`, `.pbproj`, `.pbsln`),
- y **base de tests** con estructura smoke / unit / integration / performance.

### Fases del roadmap completadas o en curso

- **Fase 0** (bootstrap profesional): **cerrada**.
- **Fase 1** (base operativa rápida): **cerrada**.
- **Fase 2** (workspace, runtime y observabilidad): **cerrada**.
- **Fase 3** (parsing, caché e invalidación): **cerrada**.
- **Fase 4** (backbone semántico inicial y catálogo): **cerrada**.
- **Fase 5** (navegación profesional y valor visible): **cerrada**.
- **Fase 6A** (productividad semántica base): **cerrada** (B018, B028, B029, B033, B053, B027 completados; B022 integrado).
- **Fase 6B / P0** (infraestructura de escala): **cerrada** (specs 013–017).
- **Fase 7A / P1** (topología real y resolución fuerte): **cerrada** (specs 018–027).
- **Fase 7B / P2** (parser hardening + utilidades cross-cutting): **cerrada** (specs 028–042).
- **Fase 7C / P3** (infraestructura workspace + integraciones + features avanzadas): **cerrada** (specs 043–062, 20 entregas).
- **Catálogo built-in PowerBuilder 2025**: **rediseñado y ampliado** (manual + generated, 1.729 entries activos, registry+services+indexes; SystemCatalog ahora con resolutores por owner-type y dataset).

---

## 3. Foco actual

### Meta actual

**P0 (Infraestructura de Escala) y P1 (Resolución fuerte) cerrados.**

#### P0 — cerrado
- ~~B120 Discovery rápido no bloqueante~~ (spec 013).
- ~~B121 Scheduler multinivel~~ (spec 014).
- ~~B133 Barra de estado~~ (spec 015).
- ~~B134A Caché caliente~~ (spec 016).
- ~~B134B Caché de serving~~ (spec 017).

#### P1 — cerrado
- ~~B056 Workspace topology parser~~ (spec 018).
- ~~B057 Project registry~~ (spec 019).
- ~~B087 Library order~~ (spec 020).
- ~~B064 Modelo de símbolos enriquecido~~ (spec 021).
- ~~B059 Visibility real~~ (spec 022).
- ~~B058 InheritanceGraph robusto~~ (spec 023).
- ~~B060 Owner resolution~~ (spec 024).
- ~~B023 Find references~~ (spec 025).
- ~~B034 Variables no usadas (refuerzo)~~ (spec 026).
- ~~B035 Shadowing~~ (spec 027).

## Tarea Activa (Next)
**Fase 7C / P3 cerrada (specs 043–062, 20 entregas).** Próximo foco: integración profunda real de los módulos P2/P3 en las features
LSP visibles (cableado de `codeActions`, `codeLensReferences`, `objectInfo`,
`projectStatus`, `diagnosticsSnapshot`, etc. en `server.ts`) y exploración
de los nuevos backlog entries B139–B142 detectados en `plugin_old`.

### Fase del roadmap en foco

- **Fase 6B / P0**: cerrada.
- **Fase 7A / P1**: cerrada.
- **Fase 7B / P2**: cerrada (módulos: parsing/codeMasking, statementSplitter,
  nesting, sectionMachine, srContainerParser, onEventParser, externalFunctions,
  sqlRegions; knowledge/symbolKey, positionContext, obsoleteCatalog;
  features/completionScoring, hoverFormat, obsoleteDetector; system/encoding).
- **Backbone**: Scopes, resolución, queries compartidas, library order y
  visibilidad listos. Gramática centralizada.

Todavía **no** estamos en fase de automatización externa ni ecosistema PowerBuilder profundo.

---

## 4. Backlog que debe cerrarse ahora

### Entradas ya cerradas o resueltas de facto

- ~~**B001–B013**~~ → Todas **cerradas** (Fases 0–3).
- ~~**B014. Document Symbols jerárquicos**~~ → **Cerrada.**
- ~~**B015. Navegación global exacta**~~ → **Cerrada.**
- ~~**B016. Resolver de tipos e InheritanceGraph**~~ → **Cerrada.**
- ~~**B018. Diagnósticos iniciales**~~ → **Cerrada.**
- ~~**B019. Primer catálogo oficial**~~ → **Cerrada.**
- ~~**B020. Base de scopes y binding inicial**~~ → **Cerrada.**
- ~~**B021. Queries compartidas del knowledge layer**~~ → **Cerrada.**
- ~~**B028. Ayuda de firmas (Signature Help)**~~ → **Cerrada.**
- ~~**B029. Completado contextual base**~~ → **Cerrada.**
- ~~**B033. Diagnósticos semánticos**~~ → **Cerrada.**
- ~~**B053. Grammar canónico y refactor de regex**~~ → **Cerrada.**

### Entradas pendientes prioritarias

- ~~B027. Semantic tokens por rol y scope~~
- ~~B051. Desambiguación semántica de tipos vs funciones~~
- ~~B022. Modelo de dependencias básico~~
- ~~B120. Discovery rápido no bloqueante del workspace~~ → **Cerrada (spec 013).**
- ~~B121. Scheduler de indexación multinivel~~ → **Cerrada (spec 014).**
- ~~B133. Barra de estado con progreso~~ → **Cerrada (spec 015).**
- ~~B134A. Caché caliente del contexto activo~~ → **Cerrada (spec 016).**
- ~~B134B. Caché de serving (LSP features)~~ → **Cerrada (spec 017).**

### Orden operativo recomendado

1. discovery rápido no bloqueante (B120),
2. scheduler de indexación multinivel (B121),
3. barra de estado con progreso (B133),
4. caché caliente y de serving (B134A/B).

---

## 5. Qué sí debe hacerse ahora

### Trabajo permitido y prioritario

- implementar discovery dual (Workspace/Solution) sin bloquear el arranque,
- implementar scheduler de colas para proteger el archivo activo,
- añadir barra de estado con progreso real,
- y mantener la coherencia documental tras cada cambio.

### Resultado esperado de esta etapa

Al final del foco actual, el plugin debe:

- indexar el workspace de forma progresiva sin bloquear la UI,
- mostrar progreso real y estado de readiness al usuario,
- mantener la latencia controlable mediante yielding y budgets,
- y preparar la base de caché para la resolución fuerte de la Fase 7A.

---

## 6. Qué no debe hacerse ahora salvo causa clara

### Trabajo explícitamente fuera de foco

No debe hacerse ahora, salvo bug, deuda bloqueante o necesidad muy justificada:

- reabrir arquitectura general sin motivo,
- meter features vistosas antes de consolidar base,
- adelantar resolución fuerte (topología, visibility rules, owner resolution) que pertenecen a Fase 7A,
- abrir integraciones como PBAutoBuild, OrcaScript/ORCA, DataWindow avanzado o API local.

### No tocar todavía salvo necesidad real

- rename,
- references robustas,
- CodeLens,
- formateador de código,
- explorador semántico,
- automatización externa o IA.

Todo eso tiene valor, pero **no es el foco inmediato**.

---

## 7. Riesgos actuales a vigilar

### Riesgos principales

- crecimiento desordenado de las features bootstrap sin pasar por el knowledge pipeline,
- conversión inadvertida de la capa `analysis/` en estructura permanente (ver bloque transversal de deuda en roadmap),
- falta de separación entre runtime y lógica semántica a medida que crezca el servidor,
- ~~regex dispersas que compliquen la evolución de la gramática (B053 pendiente)~~ → **Resuelto**,
- y documentación que vuelva a desalinearse si no se mantiene sincronizada con los cambios.

---

## 8. Evidencia mínima que debe salir de este foco

Antes de mover el foco, esta etapa debe dejar evidencia razonable de mejora.

### Evidencias mínimas esperadas

- descubrimiento asíncrono y no bloqueante verificado,
- scheduler de colas operando con prioridades (Interactive/Near/Background),
- barra de estado reflejando progreso real de indexación,
- caché de contexto activo y de serving funcional,
- y documentación actualizada reflejando el estado real.

---

## 9. Siguiente paso natural

El siguiente paso natural del proyecto, una vez cerrado este foco, es:

1. Infraestructura de escala (P0): discovery, scheduler, caché,
2. entrar en Fase 7A (resolución fuerte, topología real, visibilidad).

---

## 10. Condición para mover el foco

El foco actual solo debe cambiar cuando:

- los diagnósticos semánticos funcionen correctamente en casos base,
- exista validación mínima sobre fixtures representativos,
- la latencia de diagnósticos no degrade la experiencia del archivo activo,
- y la estructura documental quede alineada con el estado real del repositorio.

Si estas condiciones no se cumplen, no debe abrirse de forma agresiva la siguiente capa del roadmap.

---

## 11. Regla final de foco

Mientras este documento siga vigente, la regla operativa es:

> **no abrir más superficie funcional de la que la base actual puede sostener sin comprometer carga, estabilidad, claridad arquitectónica o documentación viva.**

La prioridad inmediata es completar la Fase 6B / P0 con la infraestructura de escala necesaria para que el crecimiento futuro sea seguro y sostenible.