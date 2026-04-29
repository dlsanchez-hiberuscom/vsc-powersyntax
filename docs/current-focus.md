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
- **Hover básico** con contexto por símbolo,
- **Diagnósticos estructurales** con validación de bloques abiertos/cerrados (ampliado a bloques ejecutables como IF/FOR/DO),
- **Caché de análisis** por documento con invalidación por cierre,
- **Scheduling de diagnósticos** con debounce para no saturar al editar,
- **Parseo** de secciones, declaraciones y cabeceras de implementación,
- **KnowledgeBase** con soporte para indexación global y actualizaciones en lote (batch updates),
- **Gramática TextMate** principal y gramática para bloques PowerBuilder en Markdown,
- **FileSystemWatcher** para archivos de proyecto PowerBuilder (`.pbw`, `.pbt`, `.pbproj`, `.pbsln`),
- **Completado Contextual** semántico con soporte para herencia y cualificadores,
- **Ayuda de firmas (Signature Help)** interactiva con soporte para parámetros,
- y **base de tests** con estructura smoke / unit / integration / performance.

### Fases del roadmap completadas o en curso

- **Fase 0** (bootstrap profesional): **cerrada**.
- **Fase 1** (base operativa rápida): **cerrada**. El cliente es ligero, el servidor se levanta correctamente, la activación es perezosa y la consolidación del runtime (Spec 002) introdujo medición formal (B003), prioridad estricta del archivo activo (B004), scheduler formal (B005) y ciclo de vida (B008).
- **Fase 2** (workspace, runtime y observabilidad): **en curso**. Tenemos scheduling con debounce, caché por documento y observabilidad de métricas (B007). Falta descubrimiento formal de workspace (B006).
- **Capacidades adelantadas**: Document Symbols, Hover y Diagnósticos ya funcionan (Fases 4–6 del roadmap), pero sobre la capa bootstrap, no sobre el knowledge pipeline objetivo.

---

## 3. Foco actual

### Prioridad operativa

### Prioridad operativa

**Diagnósticos Semánticos iniciales (B033).**
Tras haber consolidado el Completado Contextual, el foco se desplaza a los diagnósticos semánticos. Aprovechando el motor de resolución ya construido, el objetivo es detectar en tiempo real errores de tipo, variables no declaradas o llamadas a métodos que no existen en la jerarquía del objeto, elevando la fiabilidad del plugin antes de entrar en operaciones de refactorización.

### Fase del roadmap en foco

- **Fase 4**: Semántica de lenguaje (B014, B015, B016, B020 completados).
- **Fase 6**: Diagnósticos y productividad semántica base (B018, B021 completados).
- **Backbone**: Scopes y resolución exacta listos.

Todavía **no** estamos en fase de automatización externa ni ecosistema PowerBuilder profundo.

---

## 4. Backlog que debe cerrarse ahora

### Entradas ya cerradas o resueltas de facto

- ~~**B001. Cerrar activación perezosa definitiva**~~ → **Cerrada.**
- ~~**B002. Consolidar wiring cliente ↔ servidor LSP**~~ → **Cerrada.**
- ~~**B003. Medición base de cold start y primer archivo**~~ → **Cerrada.**
- ~~**B004. Formalizar prioridad estricta del archivo activo**~~ → **Cerrada.**
- ~~**B005. Añadir scheduler mínimo con prioridades y cancelación**~~ → **Cerrada.**
- ~~**B006. Descubrimiento de workspace y política básica de roots**~~ → **Cerrada.**
- ~~**B007. Observabilidad mínima del runtime**~~ → **Cerrada.**
- ~~**B008. Endurecer ciclo de vida del servidor**~~ → **Cerrada.**
- ~~**B009. Alinear documentación canónica de base**~~ → **Cerrada.**
- ~~**B010. Normalizar validación base del repositorio**~~ → **Cerrada.**
- ~~**B011. Pipeline de parseo incremental usable**~~ → **Cerrada.**
- ~~**B012. Caché documental por archivo**~~ → **Cerrada.**
- ~~**B013. Esqueleto de índice incremental**~~ → **Cerrada.**

### Entradas pendientes prioritarias

- [x] B014. Navegación a definición (Go to Definition)
- [x] B015. Navegación global exacta (considerando herencia/distancia)
- [x] B018. Hover semántico con documentación heredada
- [x] B021. Consolidación de queries semánticas compartidas
- [x] B020. Base de scopes y binding inicial (variables locales)
- [x] B028. Ayuda de firmas (Signature Help) inicial
- [x] B029. Completado contextual básico (miembros de objeto)
- [/] B033. Diagnósticos semánticos (detectar tipos/miembros inexistentes)

### Orden operativo recomendado

1. diagnósticos semánticos (B033),
2. modelo de dependencias básico (B022).

---

## 5. Qué sí debe hacerse ahora

### Trabajo permitido y prioritario

- refinar la precisión del parser para Document Symbols (B014),
- implementar la navegación global Go to Definition (B015) utilizando la KnowledgeBase,
- sentar las bases del sistema de resolución de tipos (B016),
- y asegurar que las nuevas features semánticas utilicen la DocumentCache para mantener el rendimiento.

### Resultado esperado de esta etapa

Al final del foco actual (Spec 009), el plugin debe:

- responder a peticiones de completado (`textDocument/completion`) con precisión contextual,
- sugerir variables locales si estamos dentro de una función o evento,
- sugerir miembros (`this.`, `super.`, o variables `tipo.`) usando el catálogo y el grafo de herencia.

---

## 6. Qué no debe hacerse ahora salvo causa clara

### Trabajo explícitamente fuera de foco

No debe hacerse ahora, salvo bug, deuda bloqueante o necesidad muy justificada:

- reabrir arquitectura general sin motivo,
- meter features vistosas antes de consolidar base,
- ampliar demasiado la superficie funcional,
- introducir complejidad innecesaria en el cliente,
- adelantar semántica fuerte (binder, resolver, índice global) si todavía no están cerrados prioridades, observabilidad y validación base,
- abrir aún integraciones como PBAutoBuild, OrcaScript/ORCA, DataWindow avanzado o API local, porque pertenecen a fases posteriores del roadmap.

### No tocar todavía salvo necesidad real

- rename,
- references robustas,
- semantic tokens avanzados,
- catálogo amplio del lenguaje,
- validación grande sobre PFC,
- automatización externa o IA.

Todo eso tiene valor, pero **no es el foco inmediato**.

---

## 7. Riesgos actuales a vigilar

### Riesgos principales

- crecimiento desordenado de las features bootstrap sin pasar por el knowledge pipeline,
- falta de medición formal que permita detectar regresiones de rendimiento,
- conversión inadvertida de la capa `analysis/` en estructura permanente,
- falta de separación entre runtime y lógica semántica a medida que crezca el servidor,
- y documentación que vuelva a desalinearse si no se mantiene sincronizada con los cambios.

### Riesgo estructural específico

El principal riesgo técnico de esta etapa es consolidar las features existentes (Document Symbols, Hover, Diagnósticos) sobre la capa bootstrap sin preparar la migración al knowledge pipeline objetivo. El foco actual debe fortalecer la base operativa para que esa migración sea progresiva y no un big bang.

---

## 8. Evidencia mínima que debe salir de este foco

Antes de mover el foco, esta etapa debe dejar evidencia razonable de mejora.

### Evidencias mínimas esperadas

- medición repetible de activación del cliente,
- medición repetible de tiempo hasta primer archivo útil,
- medición repetible de tiempo hasta primer servicio visible,
- comprobación de que el archivo activo tiene prioridad real,
- cobertura mínima de tests sobre features existentes,
- validación básica del ciclo de vida del servidor,
- y documentación actualizada reflejando el estado real.

---

## 9. Siguiente paso natural

El siguiente paso natural del proyecto, una vez cerrado este foco, es:

1. introducir diagnósticos semánticos (B033),
2. ampliar soporte de DataWindow (Fase 9) de forma gradual.

Las features funcionales existentes (Document Symbols, Hover, Signature Help) ya usan el knowledge pipeline. El completado contextual confirmará la robustez del resolver.

---

## 10. Condición para mover el foco

El foco actual solo debe cambiar cuando:

- existan mediciones mínimas repetibles de rendimiento,
- la prioridad del archivo activo esté impuesta de verdad,
- el scheduler mínimo funcione con cancelación cooperativa,
- el descubrimiento de workspace esté formalizado,
- la validación base del repositorio sea repetible,
- y la estructura documental quede alineada con el estado real del repositorio.

Si estas condiciones no se cumplen, no debe abrirse de forma agresiva la siguiente capa del roadmap.

---

## 11. Regla final de foco

Mientras este documento siga vigente, la regla operativa es:

> **no abrir más superficie funcional de la que la base actual puede sostener sin comprometer carga, estabilidad, claridad arquitectónica o documentación viva.**

La prioridad inmediata es medir, observar y formalizar la base ya existente para que el crecimiento futuro sea seguro y sostenible.