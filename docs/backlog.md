# Backlog — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este backlog contiene el trabajo pendiente priorizado del proyecto.

Debe mantenerse siempre alineado con:

- la constitución,
- el roadmap,
- la arquitectura vigente,
- el current focus,
- y el estado real del código.

El backlog no debe comportarse como una lista estática de deseos, sino como una cola viva y realista de trabajo ejecutable por fases pequeñas, con prioridad clara y validación suficiente.

---

## 2. Reglas de gestión

- No se listan features ya cerradas como si siguieran pendientes.
- No se reabre trabajo cerrado salvo bug, regresión o deuda real claramente justificada.
- Toda entrada debe ser concreta, accionable y revisable.
- El backlog debe priorizar la base antes que mejoras periféricas.
- Las features grandes deben dividirse en slices pequeños.
- Ninguna entrada debe introducir duplicación de semántica si puede apoyarse en servicios comunes.
- No se priorizan features avanzadas de IA ni automatización externa antes de consolidar la base.
- Toda entrada que afecte a arquitectura, rendimiento o documentación debe reflejarse también en los artefactos canónicos correspondientes.

---

## 3. Estructura de prioridades

### P0 — Crítico / base inmediata
Trabajo necesario para que el plugin tenga una base profesional, rápida y mantenible.

### P1 — Núcleo de valor inmediato
Trabajo que ya aporta valor visible al desarrollador y se apoya en base razonablemente estable.

### P2 — Backbone semántico y escalabilidad
Trabajo que endurece la semántica, la precisión, el índice y la escala del plugin.

### P3 — Profesionalización avanzada
Trabajo de alto valor que requiere núcleo más maduro y validación mayor.

### P4 — Ecosistema PowerBuilder y automatización
Trabajo específico del ecosistema PowerBuilder y de apertura controlada a tooling/automatización.

---

## 4. Backlog priorizado actual

## P0 — Crítico / base inmediata

### ~~B001. Cerrar activación perezosa definitiva~~ ✅ CERRADA
La extensión se activa por contribución declarativa del lenguaje (`onLanguage:powerbuilder` implícito). No hay `activationEvents` globales. El cliente no hace trabajo pesado al arranque.

### ~~B002. Consolidar wiring cliente ↔ servidor LSP~~ ✅ CERRADA
El wiring está limpio, estable y con manejo correcto de errores de arranque y parada. Cliente ligero (~130 líneas) sin semántica ni parseo.

### ~~B003. Medición base de cold start y primer archivo~~ ✅ CERRADA
Medición implementada en `timing.ts` y reportada en el output channel para todos los handlers. Baseline documentada en `002-baseline.md`.

### ~~B004. Formalizar prioridad estricta del archivo activo~~ ✅ CERRADA
El documento actual se registra en `server.ts` y se priorizan las operaciones utilizando `TaskPriority.Interactive`.

### ~~B005. Añadir scheduler mínimo con prioridades y cancelación~~ ✅ CERRADA
Implementado `TaskScheduler` con 2 prioridades (Interactive y Background) y cancelación cooperativa a través de `cancellation.ts`. Las tareas background se cancelan automáticamente si llega un handler interactivo.

### ~~B006. Descubrimiento de workspace y política básica de roots~~ ✅ CERRADA
Crawler asíncrono y cooperativo implementado en `discovery.ts`. Detecta roots, archivos relevantes (`.sr*`), y exclusiones sin bloquear el event loop usando abstracción `IFileSystem`.

### ~~B007. Observabilidad mínima del runtime~~ ✅ CERRADA
Tiempos de activación del Extension Host y del Language Client (`start()`) añadidos al Output Channel.

### ~~B008. Endurecer ciclo de vida del servidor~~ ✅ CERRADA
Handlers protegidos con try/catch en `server.ts`. Añadido comando `vscPowerSyntax.restartServer` para reiniciar el cliente/servidor limpiamente sin recargar la ventana.

### ~~B009. Alinear documentación canónica de base~~ ✅ CERRADA
Auditoría completa realizada. Documentación canónica alineada y Spec 002 documentada correctamente.

### ~~B010. Normalizar validación base del repositorio~~ ✅ CERRADA
Framework de tests configurado. Completados unit tests de runtime (`timing`, `cancellation`, `scheduler`), smoke test de extensión y test de rendimiento documentando base de performance.

---

## P1 — Núcleo de valor inmediato

### ~~B011. Pipeline de parseo incremental usable~~ ✅ CERRADA
Refactorizado `analyzeDocument` para generar `Facts` semánticos. Integrado con `workspaceIndexer.ts` para procesamiento asíncrono y cooperativo.

### ~~B012. Caché documental por archivo~~ ✅ CERRADA
Implementado `DocumentCache.ts` con persistencia en memoria e invalidación por hash MD5 del contenido. Evita re-parseos innecesarios durante la indexación y el uso interactivo.

### ~~B013. Esqueleto de índice incremental~~ ✅ CERRADA
Implementada `KnowledgeBase.ts` como almacén global de entidades (Funciones, Tipos, Eventos). Soporta inserción/borrado incremental por URI y búsquedas globales case-insensitive.

### ~~B014. Document symbols robustos y jerárquicos~~ ✅ CERRADA
Extracción jerárquica completada, detectando y anidando variables, funciones, subrutinas, eventos y tipos correctamente según su contenedor.

### ~~B015. Navegación global exacta (Go to Definition)~~ ✅ CERRADA
Utilizando la KnowledgeBase y el InheritanceGraph, ahora es capaz de resolver la herencia y saltar a la definición correcta de métodos invocados mediante `this`, `super`, variables tipeadas o sin cualificador.

### ~~B016. Resolver de tipos básico e InheritanceGraph~~ ✅ CERRADA
Implementado `InheritanceGraph` para calcular ancestros y miembros considerando la jerarquía (Phase 4).

### ~~B017. Go to definition fiable en casos base~~ ✅ CERRADA
Resolver navegación a definición en escenarios iniciales frecuentes y controlados. Consolidado en B015 y B021.

### ~~B018. Diagnósticos iniciales bien delimitados~~ ✅ CERRADA
Publicados diagnósticos sintácticos y estructurales (`validateStructure`) cubriendo bloques ejecutables y declarativos sin penalizar semántica avanzada (Phase 6).

### ~~B019. Introducir primer catálogo oficial del lenguaje~~ ✅ CERRADA
Modelar funciones, keywords y elementos oficiales de PowerBuilder que aporten valor temprano a hover, ayuda y validación.

### ~~B020. Base de scopes y binding inicial~~ ✅ CERRADA
Implementación de ámbitos léxicos (Global, Type, Function, Event) para resolver variables locales y parámetros con precisión.

### ~~B021. Queries compartidas del knowledge layer~~ ✅ CERRADA
Consolidados los métodos de resolución de `definition` en `semanticQueryService`, usados ahora por `definition` y `hover` simultáneamente para garantizar coherencia en la interpretación del código.

### ~~B028. Ayuda de firmas (Signature Help) básico~~ ✅ CERRADA
Introducido `signatureHelp.ts` que utiliza un backward scanner robusto para manejar llamadas anidadas y detectar el parámetro activo. Integrado con el catálogo oficial y el conocimiento semántico del workspace.

---

## P2 — Backbone semántico y escalabilidad

### B022. Modelo de dependencias básico
Relacionar símbolos y objetos entre sí para entender impacto y contexto.

### B023. Búsqueda de referencias segura en casos base
Introducir find references sobre la misma plataforma de conocimiento común.

### B024. Caché persistente por workspace
Persistir metadatos útiles para acelerar reinicios y warm-up.

### B025. Invalidación fina por impacto
Mejorar el recálculo para que solo se reanalice lo afectado por cambios locales.

### B026. Navegación por herencia y owner-awareness
Añadir soporte inicial de ancestros, descendientes y relaciones más propias de PowerBuilder.

### ~~B027. Semantic tokens por rol y scope~~ ✅ CERRADA
Implementado `semanticTokens.ts` que emite tokens semánticos (variable, parameter, property, function, event, type) utilizando el backbone de símbolos (`DocumentAnalysis` y `KnowledgeBase`). Soporta resolución local rápida y delegación a `semanticQueryService` para miembros.

### ~~B029. Completado contextual base~~ ✅ CERRADA
Implementado `completion.ts` con scoring por contexto (`0_local`, `1_member`, `2_global`). Soporta cualificadores (`this.`, `super.`, variables tipadas) utilizando el `InheritanceGraph` y el `semanticQueryService`. Propuestas ordenadas por relevancia semántica.

### B030. Validación sobre workspace grande real
Ejecutar y medir el plugin sobre un corpus grande real de PowerBuilder para detectar cuellos de botella y falsos positivos.

### ~~B051. Desambiguación semántica de tipos vs funciones~~ ✅ CERRADA
Resuelto mediante el uso de Semantic Tokens. El servidor ahora identifica tipos nativos (como `String`, `Integer`) y les asigna el token `type`, sobrescribiendo el coloreado incorrecto de TextMate que los trataba como llamadas a función.

---

## P3 — Profesionalización avanzada

### B031. Referencias más precisas y robustas
Ampliar cobertura de referencias sobre más escenarios semánticos y estructurales.

### B032. Rename controlado
Permitir renombrado seguro en escenarios acotados con suficiente fiabilidad.

### ~~B033. Diagnósticos semánticos iniciales~~ ✅ CERRADA
Detectar incoherencias de más valor (tipos/miembros inexistentes, variables no declaradas/usadas) apoyado en el backbone semántico. Implementado SD1-SD5.

### B034. Diagnóstico de variables no usadas
Introducir regla semántica clara y útil de productividad. Ref: `plugin_old/src/powerbuilder/resolution/diagnosticResolver.ts` (`analyzeUnusedVariables`).

### B035. Detección de shadowing
Detectar sombreado de variables o identificadores cuando exista soporte suficiente en scopes. Ref: `plugin_old/src/powerbuilder/resolution/diagnosticResolver.ts` (`analyzeVariableShadowing`).

### B036. Code actions básicas
Añadir correcciones automáticas pequeñas apoyadas en diagnósticos ya consolidados.

### B037. Explorador semántico del proyecto
Presentar el sistema por conceptos lógicos y no solo por archivos.

### B038. Métricas y análisis de complejidad
Aportar visión de riesgo y mantenibilidad sobre el proyecto real.

### B039. Validación continua sobre corpus reales
Convertir la validación sobre PFC u otros corpus en práctica repetible y mantenida en el tiempo.

### B040. Optimización sobre workspaces grandes y legacy
Reducir coste de memoria, latencias y puntos de bloqueo en escenarios enterprise reales.

---

## PD — Deuda arquitectónica (transversal)

### B052. Desmantelar `server/analysis/` como módulo genérico
Migrar `documentAnalysis.ts` → `parsing/extractors/` + `knowledge/snapshots/`; `analysisCache.ts` → `adapters/cache/` o `knowledge/snapshots/`; `diagnosticScheduler.ts` → `runtime/scheduler/` o `diagnostics/publishing/`. Prohibir crecimiento adicional.

### ~~B053. Crear `grammar.ts` canónico y migrar regex dispersas~~ ✅ CERRADA
Centralizar las regex del lenguaje dispersas entre `matchers.ts`, `sections.ts`, `diagnostics.ts` y `documentAnalysis.ts` en un módulo canónico declarativo, portando lógicas probadas del `plugin_old`.

### B054. Introducir contexto posicional semántico reutilizable
Implementar `findInnermostCallableAtPosition()` y `findInnermostTypeAtPosition()` para obtener el contexto posicional del cursor, reutilizable por todas las features.

### B055. Parseo documental con secciones/estado (state machine)
Evolucionar el parseo actual de regex línea a línea hacia una máquina de estados que rastree bloques (type variables, forward prototypes, event, function), distinguiendo file-object, tipos anidados (`within`) y scopes de variables. Ref: `plugin_old/src/powerbuilder/parsing/pbDocumentParser.ts`.

---

## P2+ — Backbone semántico ampliado

### B056. Workspace topology parser (.pbw/.pbt/.pbsln)
Leer y parsear la topología real de workspace y targets. Incluir resolución de library order para que la KnowledgeBase agrupe entidades por target y resuelva conflictos de objetos duplicados.

### B057. Project registry con scoring
Registro centralizado que asocie cada archivo fuente con su proyecto preferido (por matching de path), soportando múltiples proyectos en el mismo workspace.

### B058. InheritanceGraph robusto con caches
Ampliar el InheritanceGraph actual con ancestorCache, hierarchyCache, derivedTypeCache y memberCache invalidados automáticamente. Incluir `getTypeDistance()` y `getDirectDerivedTypes()`.

### B059. Symbol visibility real (public/protected/private)
Implementar las reglas reales de visibilidad de PowerBuilder incluyendo protectedread/protectedwrite/privateread/privatewrite usando getTypeDistance(). Incluir fallback permisivo.

### B060. Owner resolution robusto (estático + dinámico)
Resolver expresiones compuestas como `dw_1.Object.DataWindow.Bands`, manejar dynamic dispatch y diferenciar llamadas estáticas vs dinámicas.

### B061. Completion scoring heredado y normalizado
Adaptar el sistema de ranking del `plugin_old` con scoring por distancia de herencia, scope (local +12000, member +8000), visibilidad y owner context. Ref: `plugin_old/src/powerbuilder/semantic/semanticEngine.ts` (`getCompletionScore`).

### B062. Hierarchy inspection service
Servicio para inspeccionar el estado de herencia: cadena de ancestros, descendencia directa, relaciones entre objetos, y navegación al script del ancestro.

### B063. Diagnostics snapshot agrupado
Sistema de snapshot de diagnósticos agrupado por proyecto y por objeto, con conteo de errores vs warnings por nivel, ordenación por severidad y filtrado por fuente.


### B064. Enriched symbol model incremental
Añadir progresivamente campos al Entity: containerKind, implementationKind, access, parameterCount, ownerName, isExternal, externalLibraryName, returnType.

### B065. Ancestor script navigation
Permitir navegar al script del ancestro directo de un evento o función. Fundamental para el flujo `CALL ancestor::event_name`.

### B066. CodeLens de referencias/herencia
Mostrar conteo de referencias e indicación de herencia sobre funciones y eventos. Enlazar a acciones de navegación.

### B067. Formateador de código configurable
Homogeneizar el estilo del código PowerBuilder mediante reglas parametrizables.

### B068. Calibración real del performance budget sobre corpus grandes
Medir y calibrar los presupuestos de rendimiento definidos en performance-budget.md contra workspaces reales de PFC y proyectos enterprise.

### B069. Fixtures reales permanentes de PFC/legacy
Incorporar y mantener fixtures reales de PFC 2025 y patrones legacy comunes para validación permanente.

### B070. Memory budgets de caché e índice
Definir y verificar presupuestos de memoria específicos para caché documental e índice global.

### B071. Warm indexing y resume de caché persistente
Implementar caché persistente por workspace para que el reinicio del servidor no requiera re-indexación completa.

### B072. Diagnósticos de código inalcanzable
Detectar sentencias después de terminadores incondicionales (`return`, `throw`, `halt`) y en ramas de bloques `IF/CHOOSE` ya terminadas. Ref: `plugin_old/src/powerbuilder/resolution/diagnosticResolver.ts` (`analyzeBlocks`).

### B073. Soporte para Funciones Externas (DLLs)
Parseo y resolución de declaraciones `EXTERNAL FUNCTION/SUBROUTINE` con soporte para `LIBRARY` y `ALIAS FOR`. Ref: `plugin_old/src/powerbuilder/parsing/pbDocumentParser.ts` (`tryParseCallableSymbol`).

### B074. Diagnósticos de modernización y funciones obsoletas
Identificar el uso de funciones globales obsoletas y sugerir el reemplazo moderno del sistema. Ref: `plugin_old/src/powerbuilder/resolution/diagnosticResolver.ts` (`analyzeObsoleteRuntimeFunctions`).

---

## P4 — Ecosistema PowerBuilder y automatización

### B041. Catálogo y navegación de DataWindow
Tratar DataWindow y DataStore con una base de conocimiento comparable al lenguaje general.

### B042. Soporte avanzado de DataWindow
Ampliar cobertura específica de expresiones, funciones, objetos y patrones DataWindow.

### B043. Integración con PBAutoBuild
Permitir compilar y validar proyectos desde el backend oficial de automatización PowerBuilder.

### B044. Estado de build y salud del workspace
Detectar precondiciones, configuración y problemas de compilación antes de lanzar automatizaciones.

### B045. Auditoría de arquitectura y convenciones
Permitir revisar consistencia técnica y reglas del equipo sobre una plataforma ya madura.

### B046. Contratos públicos de API local
Preparar una frontera desacoplada y versionable para consumo externo. Diseño contract-first desde el inicio.

### B047. Consultas automatizables para herramientas externas
Exponer conocimiento útil del proyecto sin contaminar el dominio interno.

### B048. Integración con OrcaScript/ORCA
Añadir compatibilidad con automatizaciones avanzadas o legacy del ecosistema PowerBuilder.

### B049. Asistencia a refactorización más avanzada
Aprovechar el backbone semántico para cambios más complejos y guiados.

### B050. Capacidades avanzadas para automatización e IA
Permitir que agentes externos consuman la plataforma mediante contratos limpios y estables.

### B075. CodeLens de Herencia y Referencias (Herencia PB)
Implementar indicadores visuales sobre eventos y funciones que muestren el conteo de usos y si el método hace override de un ancestro. Ref: `plugin_old/src/powerbuilder/semantic/pbPowerScriptCodeLens.ts`.

### B076. Motor de Ocurrencias Semánticas Avanzado
Mejorar la detección de usos de variables y métodos considerando el contexto de ejecución y el binding dinámico. Ref: `plugin_old/src/powerbuilder/semantic/semanticOccurrences.ts`.

### B077. Catálogo Extendido de Símbolos del Sistema
Integrar la base de datos completa de funciones, objetos y tipos del runtime de PowerBuilder. Ref: `plugin_old/src/powerbuilder/systemSymbols/`.

### B078. Análisis de SQL Embebido (Diagnósticos)
Detección básica de sentencias SQL dentro del código PowerScript para evitar falsos positivos en diagnósticos semánticos y preparar validación futura. Ref: `plugin_old/src/powerbuilder/resolution/diagnosticResolver.ts` (`analyzeSql`).

### B079. Resolución de Owners y Expresiones Compuestas
Soporte para la resolución de cadenas de acceso complejas (ej. `parent.dw_1.object.name`). Ref: `plugin_old/src/powerbuilder/semantic/owners/`.

### B080. Generador de Documentación Técnica (PB-Doc)
Sistema para generar documentación en Markdown o HTML a partir de los metadatos de objetos y comentarios en el código. Ref: `plugin_old/src/powerbuilder/documentation/`.

### B081. Inteligencia de DataWindow y acceso a .Object
Soporte para navegación y validación de la sintaxis `dw_1.Object` y análisis del fuente de la DataWindow. Ref: `plugin_old/src/powerbuilder/datawindow/`.

### B082. Servicio de Inspección de Script Ancestro
Generación de reportes visuales de la jerarquía de herencia para el método bajo el cursor. Ref: `plugin_old/src/powerbuilder/hierarchy/ancestorScriptService.ts`.

### B083. Integración avanzada con PBAutoBuild
Lanzamiento de builds y reporte de errores oficiales de compilación en el panel de Problems. Ref: `plugin_old/src/powerbuilder/build/pbAutoBuildService.ts`.

### B084. Explorador de Jerarquía de Objetos
Vista especializada para navegar la cadena de ancestros y descendientes de cualquier objeto del workspace. Ref: `plugin_old/src/powerbuilder/hierarchy/activeHierarchyInspectionService.ts`.

### B085. Validación de SQL Embebido
Detección y validación básica de sintaxis SQL dentro de bloques PowerScript. Ref: `plugin_old/src/powerbuilder/resolution/diagnosticResolver.ts` (`analyzeSql`).

### B086. Code Action: Implement Ancestor
Acción rápida para generar el esqueleto de un evento o función heredado del ancestro.

### B087. Topología de Workspace y Library Order
Uso de archivos .pbw/.pbt para priorizar la resolución de símbolos según el orden real de las librerías del proyecto. Ref: `plugin_old/src/powerbuilder/workspace/projectRegistry.ts`.

### B088. Catálogo Curado del Lenguaje (200KB+ Dataset)
Integración del dataset manual de funciones, objetos y eventos del sistema extraído del plugin anterior. Ref: `plugin_old/src/powerbuilder/knowledge/manual/`.

### B089. Lexing de Precisión: Comentarios Anidados y Escapes
Portar la lógica de lexing que soporta comentarios de bloque anidados y secuencias de escape complejas (~n, ~h, ~o). Ref: `plugin_old/src/core/utils/powerScriptLexingUtils.ts`.

### B090. Detección de SQL Embebido (Enriquecido)
Lógica para identificar bloques de SQL y desactivar diagnósticos semánticos erróneos en esas zonas. Ref: `plugin_old/src/core/utils/powerScriptSqlUtils.ts`.

### B092. Sistema de Máscaras de Código (Code Masking)
Implementar generador de máscaras para que todos los servicios semánticos operen solo sobre caracteres de código, ignorando de forma segura strings y comentarios. Ref: `plugin_old/src/core/utils/powerScriptLexingUtils.ts`.

### B095. Normalizador de Sentencias Lógicas (Statement Splitter)
Portar el motor de segmentación de sentencias que maneja `;`, `:` y el carácter de continuación `&`. Ref: `plugin_old/src/core/utils/powerScriptStatementUtils.ts`.

### B099. Resolución por Anidamiento (Range Span Comparison)
Implementar lógica de "span" para identificar el símbolo más anidado bajo el cursor, garantizando precisión absoluta en scopes locales vs miembros. Ref: `plugin_old/src/powerbuilder/indexing/symbolIndex.ts` (`compareByNesting`).

### B100. Sistema de Batch Updates para el KnowledgeBase
Portar el mecanismo de batching para indexaciones masivas, reduciendo el tráfico de eventos y mejorando el rendimiento de UI durante el warm-up. Ref: `plugin_old/src/powerbuilder/indexing/symbolIndex.ts`.

### B101. Deduplicación Semántica Robusta (18-field Key)
Evolucionar la detección de duplicados en el índice usando claves compuestas exhaustivas para evitar colisiones entre símbolos homónimos. Ref: `plugin_old/src/powerbuilder/indexing/symbolIndex.ts` (`uniqueSymbols`).

### B102. Soporte para AncestorReturnValue
Reconocimiento y hover especial para la variable implícita `AncestorReturnValue` en scripts descendientes. Ref: `plugin_old/src/powerbuilder/semantic/hover/presentation.ts`.

### B103. Hover Enriquecido con Metadatos PB
Mostrar visibilidad (public/protected), biblioteca externa (`ALIAS FOR`), y distinción clara entre prototipos y ejecuciones en el hover. Ref: `plugin_old/src/powerbuilder/semantic/hover/presentation.ts`.

### B104. Soporte para Eventos Calificados y On-Handlers
Identificación visual en el hover de eventos declarados mediante la sintaxis `ON object_name.event_name`.

### B105. Quick Fixes de Cierre de Bloque
Code Actions para insertar automáticamente cierres de bloques faltantes (END IF, NEXT, END CHOOSE, etc.) basados en diagnósticos. Ref: `plugin_old/src/core/i18n/pbUserMessages.ts`.

### B106. Comando de Información del Objeto/DataWindow
Visualización de un resumen estadístico del archivo actual: eventos, funciones, columnas de tabla, bandas de DW y SQL. Ref: `plugin_old/src/core/i18n/pbUserMessages.ts`.

### B107. Status Bar con Contexto de Proyecto
Barra de estado enriquecida que muestra el Target activo y estadísticas del índice, con acceso rápido a comandos de mantenimiento.

### B108. Quick Fix de Modernización de Runtime
Acción de código para sustituir funciones obsoletas por sus reemplazos modernos recomendados. Ref: `plugin_old/src/core/i18n/pbUserMessages.ts`.

### B109. API Pública para Integración (Extension Provider)
Diseñar y exponer una API para que otras extensiones de VS Code puedan consumir servicios semánticos del plugin. Ref: `plugin_old/src/publicApi.ts`.

### B110. Exportación de Superficie de Automatización
Generación de manifiestos estructurados del workspace (JSON/YAML) para su integración en pipelines de CI/CD y herramientas de auditoría externa.

### B111. Árbol de Diagnósticos Global Exportable
Capacidad de exportar todos los problemas semánticos y sintácticos del proyecto en un formato jerárquico procesable por máquinas.

### B112. Herramientas de Consistencia del Catálogo (Knowledge Base)
Implementar validadores internos para asegurar la integridad de la base de conocimientos y los miles de símbolos del sistema. Ref: `plugin_old/src/powerbuilder/knowledge/validation/`.

---

## 5. Entradas candidatas futuras

Estas entradas no deben pasar a prioridad alta sin justificación:

- vistas adicionales no esenciales,
- capacidades ornamentales sin valor técnico claro,
- features avanzadas de IA sin base consolidada,
- automatizaciones que no estén apoyadas en una arquitectura ya estable,
- integraciones específicas de bajo retorno si no existe todavía valor suficiente en el núcleo del plugin.

---

## 6. Relación con fases del roadmap

### Fase 0–1
- B001–B010

### Fase 2–3
- B011–B020

### Fase 4–5
- B014–B021

### Fase 6A
- B018, B028, B029 (cerrados), B027 (semantic tokens), B051

### Fase 6B
- B033, B034, B035, B054, B055, B061

### Bloque transversal de deuda
- B052, B053 (ejecutable en paralelo con Fase 6A/6B)

### Fase 7A
- B022, B023, B056, B057, B058, B059, B060, B064

### Fase 7B
- B031, B032, B036, B062, B065, B066, B067

### Fase 8A
- B040, B063, B068, B070, B071

### Fase 8B
- B030, B037, B038, B039, B069

### Fase 9–11
- B041–B050

---

## 7. Regla de promoción entre prioridades

Una entrada no debe subir de prioridad si:

- depende de otra base no cerrada,
- no tiene criterio de validación razonable,
- no tiene impacto o alcance entendible,
- o empuja al plugin a crecer por atajos fuera del backbone semántico común.

---

## 8. Regla de cierre

Una entrada del backlog solo puede cerrarse si:

- existe implementación real,
- pasa validación suficiente,
- la documentación afectada está actualizada,
- su cierre queda reflejado en current-focus / roadmap si corresponde,
- y no deja deuda crítica oculta sin registrar.

---

## 9. Observación operativa

Este backlog debe revisarse frecuentemente para que:

- no arrastre trabajo ya cerrado,
- no mezcle trabajo real con ideas futuras vagas,
- no desordene la prioridad base → semántica → escala → ecosistema,
- y siga siendo una herramienta operativa de ejecución, no solo una lista aspiracional.