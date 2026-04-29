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
- **Fase 6A** (productividad semántica base): **en curso** — completado contextual (B029) y signature help (B028) cerrados; diagnósticos semánticos (B033) como siguiente prioridad.

---

## 3. Foco actual

### Meta actual

**Cerrar Fase 6A (Core Semántico y Deuda de Diagnósticos)**
- ~~**B033**: Implementar validación semántica (Semantic Diagnostics)~~ **(CERRADA)**
- ~~**B053**: Crear `grammar.ts` canónico y migrar regex dispersas~~ **(CERRADA)**
- **B027**: Semantic tokens por rol y scope **(ABIERTA - NEXT)**

## Tarea Activa (Next)
**B027: Semantic tokens por rol y scope**

### Fase del roadmap en foco

- **Fase 6A**: en curso (B018, B028, B029, B033, B053 completados; B027 como siguiente).
- **Backbone**: Scopes, resolución y queries compartidas listos. Gramática centralizada.

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

- ~~**B053. Crear `grammar.ts` canónico y migrar regex dispersas**~~
- [/] B027. Semantic tokens por rol y scope
- [ ] B051. Desambiguación semántica de tipos vs funciones

### Orden operativo recomendado

1. grammar.ts canónico (B053),
2. semantic tokens (B027),
3. modelo de dependencias básico (B022).

---

## 5. Qué sí debe hacerse ahora

### Trabajo permitido y prioritario

- ~~implementar `grammar.ts` canónico (B053)~~,
- implementar semantic tokens básicos (B027) sobre el backbone de símbolos,
- y mantener la coherencia documental tras cada cambio.

### Resultado esperado de esta etapa

Al final del foco actual, el plugin debe:

- detectar en tiempo real errores semánticos básicos (tipos inexistentes, miembros no resueltos),
- mantener la latencia controlable en el archivo activo,
- y preparar la base para la Fase 6B (contexto posicional y scoring avanzado).

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

- diagnósticos semánticos funcionales y verificados sobre fixtures,
- medición de latencia de diagnósticos en archivo activo,
- cobertura mínima de tests sobre diagnósticos semánticos,
- gramática centralizada y verificada con 0 regresiones,
- y documentación actualizada reflejando el estado real.

---

## 9. Siguiente paso natural

El siguiente paso natural del proyecto, una vez cerrado este foco, es:

1. semantic tokens (B027) para enriquecer visualmente el editor,
2. modelo de dependencias básico (B022),
3. entrar en Fase 6B (contexto posicional fino, scoring avanzado, parseo documental mejorado).

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

La prioridad inmediata es completar la Fase 6A con diagnósticos semánticos funcionales para que el crecimiento futuro sea seguro y sostenible.