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

### B027. Semantic tokens por rol y scope
Enriquecer el editor usando el backbone de símbolos y roles semánticos compartidos.

### ~~B029. Completado contextual base~~ ✅ CERRADA
Implementado `completion.ts` con scoring por contexto (`0_local`, `1_member`, `2_global`). Soporta cualificadores (`this.`, `super.`, variables tipadas) utilizando el `InheritanceGraph` y el `semanticQueryService`. Propuestas ordenadas por relevancia semántica.

### B030. Validación sobre workspace grande real
Ejecutar y medir el plugin sobre un corpus grande real de PowerBuilder para detectar cuellos de botella y falsos positivos.

### B051. Desambiguación semántica de tipos vs funciones
Resolver limitación actual del Lexer/TextMate donde las declaraciones de tipos de sistema (como `String` e `Integer`) son coloreadas y tratadas como llamadas a función (ej. `String()`). Requiere Semantic Tokens apoyados en el contexto del AST para distinguir declaración vs. conversión.

---

## P3 — Profesionalización avanzada

### B031. Referencias más precisas y robustas
Ampliar cobertura de referencias sobre más escenarios semánticos y estructurales.

### B032. Rename controlado
Permitir renombrado seguro en escenarios acotados con suficiente fiabilidad.

### B033. Diagnósticos semánticos iniciales
Detectar incoherencias de más valor cuando la base de resolución ya sea razonablemente fiable.

### B034. Diagnóstico de variables no usadas
Introducir regla semántica clara y útil de productividad.

### B035. Detección de shadowing
Detectar sombreado de variables o identificadores cuando exista soporte suficiente en scopes.

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
Preparar una frontera desacoplada y versionable para consumo externo.

### B047. Consultas automatizables para herramientas externas
Exponer conocimiento útil del proyecto sin contaminar el dominio interno.

### B048. Integración con OrcaScript/ORCA
Añadir compatibilidad con automatizaciones avanzadas o legacy del ecosistema PowerBuilder.

### B049. Asistencia a refactorización más avanzada
Aprovechar el backbone semántico para cambios más complejos y guiados.

### B050. Capacidades avanzadas para automatización e IA
Permitir que agentes externos consuman la plataforma mediante contratos limpios y estables.

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

### Fase 4–6
- B021–B030

### Fase 7–8
- B031–B040

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