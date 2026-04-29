# Backlog — Plugin PowerBuilder 2025 para VS Code (versión revisada v3, sin citas)

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---

## 1. Propósito

Este backlog define la **cola operativa real** del plugin profesional de **PowerBuilder 2025 para VS Code**.

Debe servir para ejecutar trabajo en slices pequeños, priorizados, verificables y alineados con la arquitectura objetivo del producto.

Dirección técnica base del producto:
- **activación perezosa**,
- **cliente fino**,
- **servidor LSP separado**,
- **análisis pesado fuera del Extension Host**,
- **índice incremental**,
- **backbone semántico compartido**,
- **caché en varios niveles**,
- **respuesta interactiva rápida**.

Además, el backlog asume explícitamente que el plugin debe soportar **dos modos reales de proyecto** en PowerBuilder 2025:
- **Workspace** (`.pbw`, `.pbt`, `.pbl`, `ws_objects`),
- **Solution** (`.pbsln`, `.pbproj`, carpetas `*.pbl` con archivos `*.sr*`).

Ambos deben tratarse de forma distinta en discovery, indexación, topología, resolución y build.

---

## 2. Reglas de gestión del backlog

- El backlog operativo debe contener **trabajo pendiente real**, no mezcla de ideas vagas y trabajo ya cerrado.
- Se prioriza primero la **base de PowerScript**, la **topología real de workspace/solution**, la **resolución fuerte** y la **escala** antes que DataWindow avanzado, automatización externa o IA.
- Se mantiene la referencia al `plugin_old` siempre que aporte valor como fuente de consulta, lógica portable, datasets curados o heurísticas probadas.
- No se porta nada del `plugin_old` por inercia: solo por resultado funcional y encaje con la arquitectura nueva.
- Toda entrada debe dejar claro: objetivo, alcance, criterio de salida, riesgos y, cuando proceda, referencia al `plugin_old`.
- Ninguna feature debe reconstruir semántica por su cuenta si puede apoyarse en el backbone común del plugin.
- Todo cambio semántico, estructural o relacionado con PowerBuilder 2025 debe reflejarse también en `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.
- El usuario debe poder entender el estado del sistema durante la indexación y percibir progreso real, no una caja negra.
- La estrategia de caché se considera una pieza central del producto, no una optimización secundaria.
- La percepción de profesionalidad depende de tres cosas: **arranque rápido**, **estado observable** y **features que respondan rápido**.

---

## 3. Criterios de priorización

Se prioriza siempre, en este orden:

1. **velocidad de carga y activación**,
2. **descubrimiento rápido no bloqueante e indexación progresiva**,
3. **topología real de workspace/solution**,
4. **resolución fuerte de PowerScript** (scopes, herencia, owner, visibilidad),
5. **caché reutilizable y serving rápido del conocimiento**,
6. **hardening del parser/lexer**,
7. **productividad avanzada segura** (`references`, `rename`, `CodeLens`, acciones),
8. **escala, memoria y validación continua**,
9. **especialización PowerBuilder** (DataWindow, build, toolchain),
10. **automatización externa y API pública** sobre base ya madura.

---

## 4. Estado estratégico actual

El backlog se organiza partiendo de este estado de producto:

- Base cliente/servidor ya operativa.
- Activación perezosa y separación LSP ya asumidas como dirección correcta.
- Parsing y semántica iniciales ya existen, pero todavía falta una capa más fuerte de:
  - **contexto posicional**,
  - **container parsing SR***,
  - **topología real de proyecto**,
  - **resolución enriquecida**,
  - **caché preparada para serving rápido de hover/completion/signature help/definition**.
- **DataWindow no sube ahora de prioridad**: se mantiene en backlog, pero se aborda después de consolidar mejor la base de PowerScript y la resolución fuerte.
- La necesidad inmediata es mejorar el **descubrimiento rápido no bloqueante** y la **indexación progresiva por colas con prioridad**, para que el sistema descubra e indexe todo el workspace sin bloquear y sin que el usuario lo note.
- También es prioritario que el usuario vea mejor el estado del motor, idealmente mediante **barra de estado**, progreso y estados de readiness.
- La caché debe ser ya una capacidad de primera clase, tanto en memoria como persistente entre sesiones.

---

## 5. Estrategia oficial de caché

La estrategia de caché del plugin se divide en varios niveles.

### 5.1 Caché caliente en memoria
Orientada a la sesión actual y al serving interactivo.

Debe cubrir:
- documento activo,
- dependencias inmediatas,
- contexto posicional,
- hover,
- completion,
- signature help,
- definition,
- consultas frecuentes de alta repetición.

Esta caché **no necesita persistir** entre sesiones, pero debe ser extremadamente rápida y con invalidación fina.

### 5.2 Caché persistente por workspace/proyecto
Orientada a acelerar reaperturas, warm indexing y serving posterior.

Debe cubrir:
- fingerprints,
- estado de discovery,
- snapshots del índice,
- símbolos exportados,
- topología parseada,
- progreso parcial ya alcanzado,
- metadatos seguros reutilizables.

Esta caché **sí debe persistir entre sesiones**.

### 5.3 Caché de serving
Capa específica para responder rápido a features interactivas.

No basta con guardar archivos parseados; hace falta una capa orientada a:
- `hover`,
- `completion`,
- `signatureHelp`,
- `definition`,
- `references` cercanas,
- resolución de owners y tipos inmediatos.

### 5.4 Reglas de invalidación
Toda caché debe invalidarse con granularidad fina por:
- contenido del archivo,
- fingerprint,
- cambios estructurales,
- cambios en topología,
- cambios en herencia/visibilidad cuando afecten a resolución.

### 5.5 Regla de producto
La caché no es solo una optimización técnica; es parte del valor percibido del plugin:
- abrir un archivo debe sentirse rápido,
- repetir una consulta debe sentirse inmediato,
- reabrir el workspace no debe parecer un recomputado completo.

---

## 6. Estructura de prioridades revisada

### P0 — Base inmediata de descubrimiento, scheduling, contexto, visibilidad de estado y caché de serving
Trabajo que reduce bloqueo visible, mejora el tiempo hasta valor y prepara la siguiente generación del backbone semántico.

### P1 — Topología real y resolución fuerte de PowerScript
Trabajo orientado a modelar correctamente workspace/solution, scopes, herencia, owner resolution, visibilidad y referencias fiables.

### P2 — Hardening del parser y del lexer
Trabajo que mejora precisión, reduce falsos positivos y fortalece el pipeline de parsing reusable.

### P3 — Productividad avanzada segura
Trabajo de valor visible apoyado ya en semántica fuerte: rename, references robustas, CodeLens, formatter, hierarchy inspection.

### P4 — Escala, validación continua y rendimiento
Trabajo de endurecimiento real sobre corpus grandes, memoria, caché persistente, tests de extensión e instrumentación.

### P5 — Ecosistema PowerBuilder, build y automatización
Trabajo específico del ecosistema PowerBuilder: DataWindow, PBAutoBuild, ORCA legacy, API pública y automatización externa.

---

# 7. Backlog priorizado actual

## P0 — Base inmediata de descubrimiento, scheduling, contexto, visibilidad de estado y caché de serving

### B120. Discovery rápido no bloqueante del workspace
**Objetivo:** descubrir roots y archivos relevantes sin bloquear el flujo interactivo.

**Descripción ampliada:**
- detectar con rapidez markers de Workspace y Solution (`.pbw`, `.pbt`, `.pbsln`, `.pbproj`),
- detectar archivos PowerBuilder relevantes (`*.sr*`, carpetas `*.pbl`, `ws_objects`),
- poblar una cola inicial de trabajo sin esperar a la indexación completa,
- devolver control al usuario lo antes posible.

**Criterio de salida:**
- el sistema descubre el workspace de forma rápida,
- puede seguir encontrando archivos en segundo plano,
- y el documento activo no queda penalizado por el discovery.

---

### B121. Scheduler de indexación multinivel con colas por prioridad
**Objetivo:** introducir colas explícitas y justas para repartir trabajo sin bloquear.

**Descripción ampliada:**
El scheduler debe operar al menos con estas colas:
- **Interactive**: archivo activo, hover, completion, diagnostics inmediatos, definition, references del contexto inmediato.
- **Near**: ancestros, owners, tipos usados por el archivo activo, dependencias cercanas y símbolos con alta probabilidad de consulta inmediata.
- **Background**: resto del workspace o solution detectado.

**Criterio de salida:**
- el archivo abierto responde primero,
- las colas bajas nunca monopolizan el servidor,
- y el workspace se indexa progresivamente sin bloquear UX.

---

### B122. Priorización por dependencias semánticas cercanas
**Objetivo:** no indexar “por orden de disco”, sino por valor semántico inmediato.

**Descripción ampliada:**
Cuando se abre un archivo, el sistema debe priorizar:
1. el documento activo,
2. su cadena cercana de herencia,
3. owners y tipos usados en el archivo,
4. referencias y call targets probables,
5. el resto del proyecto,
6. el resto del workspace.

**Criterio de salida:**
- el orden de indexación refleja la utilidad real para el usuario,
- y mejora perceptiblemente el tiempo hasta valor en proyectos grandes.

---

### B123. Presupuestos de trabajo y yielding cooperativo
**Objetivo:** imponer time slices y yielding explícito para evitar monopolizar CPU.

**Descripción ampliada:**
- cada job de discovery/indexación se ejecuta por lotes limitados,
- el resto del trabajo se reprograma,
- y cualquier petición interactiva puede adelantarse sin esperar a que un batch largo termine.

**Criterio de salida:**
- no hay bursts largos de trabajo de fondo que degraden la interacción,
- y el uso de CPU del servidor queda repartido en slices pequeños.

---

### B124. Cancelación y preempción real de tareas de fondo
**Objetivo:** permitir que cualquier trabajo background se cancele o ceda ante una petición interactiva.

**Descripción ampliada:**
- background no debe bloquear hover/completion/definition,
- las colas bajas deben poder pausarse o cancelarse,
- y el scheduler debe retomar luego sin perder progreso útil.

**Criterio de salida:**
- cuando llega una petición interactiva, el servidor responde con prioridad real,
- y las tareas de fondo no comprometen la latencia percibida.

---

### B125. Indexación progresiva del workspace completo
**Objetivo:** indexar **todos** los archivos detectados, pero en segundo plano y con estado conocido.

**Descripción ampliada:**
Cada archivo relevante debe pasar por estados como:
- pendiente,
- descubierto,
- indexado parcial,
- indexado completo,
- invalidado.

La meta no es solo descubrir, sino **meter todo el workspace en el pipeline** sin penalizar el archivo activo.

**Criterio de salida:**
- el indexador conoce el estado de todos los archivos relevantes,
- y el sistema puede converger hacia “workspace listo” de forma progresiva.

---

### B126. Superficie de estado del indexador
**Objetivo:** exponer estado visible del motor para depuración y confianza operativa.

**Descripción ampliada:**
Mostrar, al menos:
- tamaño de colas,
- trabajo actual,
- documento activo priorizado,
- progreso aproximado,
- invalidaciones recientes,
- causas de cancelación,
- último archivo procesado.

**Criterio de salida:**
- el estado del indexador es observable,
- y sirve tanto para depurar como para entender la madurez del workspace en tiempo real.

---

### B133. Barra de estado con progreso de indexación
**Objetivo:** reflejar en la barra de estado el progreso real del indexador para que el usuario perciba qué está ocurriendo y cuánto falta aproximadamente.

**Descripción ampliada:**
La barra de estado debe poder mostrar, de forma configurable:
- porcentaje aproximado de indexación,
- estado actual (`descubriendo`, `indexando`, `contexto activo listo`, `workspace parcial`, `workspace listo`),
- actividad dominante (`archivo activo`, `herencia`, `referencias cercanas`, `background`),
- acceso rápido a comandos de diagnóstico o mantenimiento.

**Criterio de salida:**
- el usuario ve progreso real,
- entiende si el contexto activo ya está listo,
- y no percibe el indexador como una caja negra.

---

### B134. Modelo de progreso y readiness del indexador
**Objetivo:** definir una métrica de progreso y readiness lo bastante estable como para alimentar barra de estado, logs, debugging y tests.

**Descripción ampliada:**
Debe separar al menos:
- `% de discovery`,
- `% de indexación total estimada`,
- readiness del contexto activo,
- readiness del proyecto actual,
- readiness global del workspace.

No hace falta que el porcentaje sea matemáticamente perfecto; debe ser **útil, estable y no engañoso**.

**Criterio de salida:**
- existe una fuente de verdad única para progreso y readiness,
- y la barra de estado no depende de heurísticas locales dispersas.

---

### B054. Contexto posicional semántico reutilizable
**Objetivo:** introducir `findInnermostCallableAtPosition()`, `findInnermostTypeAtPosition()` y contexto reutilizable de nesting real.

**Descripción ampliada:**
Debe servir a hover, completion, diagnostics, references y rename para dejar de recalcular ad hoc el contexto del cursor.

**Referencia `plugin_old`:** mantener la consulta a la lógica antigua de spans, nesting y comparación por anidamiento si ya estaba resuelta de forma fiable.

---

### B055. Parseo documental con secciones / state machine
**Objetivo:** sustituir parsing demasiado lineal por una máquina de estados capaz de distinguir con seguridad bloques declarativos y ejecutables.

**Descripción ampliada:**
Debe diferenciar:
- `type variables`,
- `forward prototypes`,
- `functions`,
- `events`,
- `on handlers`,
- zonas declarativas,
- y zonas ejecutables.

**Referencia `plugin_old`:** `pbDocumentParser.ts` y toda lógica útil de reconocimiento de secciones.

---

### B113. Parser canónico del contenedor SR*
**Objetivo:** crear un parser explícito para la estructura contenedora de `.sra`, `.srw`, `.sru`, `.srm`, `.srf`.

**Descripción ampliada:**
Debe reconocer con estabilidad:
- `forward global type`,
- `global type ... from ...`,
- `global <type> <instance>`,
- `forward prototypes`,
- `on create/destroy`,
- contenedores de callables,
- variables declarativas del objeto.

**Por qué entra tan pronto:** el lenguaje PowerBuilder no puede tratarse solo como “lista de statements”; el contenedor SR* forma parte del modelo real del objeto.

**Referencia `plugin_old`:** cualquier lógica previa de parsing estructural fiable.

---

### B061. Completion scoring heredado y normalizado
**Objetivo:** portar y normalizar el scoring semántico del `plugin_old` usando distancia de herencia, scope, owner context y visibilidad.

**Descripción ampliada:**
El completion debe ordenar mejor por:
- locals,
- members,
- globals,
- ancestros/descendientes,
- owner context,
- access rights reales.

**Referencia `plugin_old`:** `semanticEngine.ts`, `getCompletionScore`.

---

### B134A. Caché caliente del contexto activo
**Objetivo:** mantener una caché extremadamente rápida del documento activo y sus dependencias inmediatas para mejorar hover, completion, signature help y definition.

**Descripción ampliada:**
Debe incluir, al menos:
- snapshot del documento activo,
- símbolos locales,
- contexto posicional precalculable,
- resolución cercana,
- ancestros inmediatos,
- owners probables,
- consultas frecuentes ya materializadas.

**Criterio de salida:**
- abrir un archivo y empezar a usar hover/completion no obliga a reconstruir todo cada vez,
- y la experiencia interactiva mejora de forma visible.

---

### B134B. Caché de serving para hover / completion / signature help / definition
**Objetivo:** diseñar una capa de caché específica para serving de features interactivas.

**Descripción ampliada:**
No basta con caché documental o de índice; hace falta una capa pensada para responder rápido a:
- hover,
- completion,
- signature help,
- go to definition,
- references cercanas.

Debe permitir invalidez fina y aprovechar snapshots ya construidos.

**Criterio de salida:**
- las features interactivas dejan de depender exclusivamente de recomputación directa,
- y mejoran tanto en archivos ya abiertos como al reabrirlos.

---

### B034. Diagnóstico de variables no usadas
**Objetivo:** detectar variables declaradas pero no utilizadas con conocimiento real de scopes.

**Descripción ampliada:**
Debe usar:
- scopes reales,
- reconocimiento fiable de callables,
- y un modelo que evite falsos positivos por parsing débil.

**Referencia `plugin_old`:** `diagnosticResolver.ts`, `analyzeUnusedVariables`.

---

### B035. Detección de shadowing
**Objetivo:** detectar sombreado entre locals, shared, globals e instance variables.

**Descripción ampliada:**
Debe respetar el orden real de lookup del lenguaje:
- local,
- shared,
- global,
- instance.

**Referencia `plugin_old`:** `diagnosticResolver.ts`, `analyzeVariableShadowing`.

---

## P1  Topología real y resolución fuerte de PowerScript

### B056. Workspace topology parser (`.pbw/.pbt/.pbsln/.pbproj`)
**Objetivo:** parsear la topología real del workspace/solution y dejar de depender solo de discovery por carpetas.

**Descripción ampliada:**
Debe cubrir:
- workspace markers,
- solution markers,
- targets/proyectos,
- library lists,
- project roots,
- y diferencias explícitas entre Workspace y Solution.

**Referencia `plugin_old`:** `PbLibraryGraph`, `projectRegistry`.

---

### B057. Project registry con scoring
**Objetivo:** asociar cada archivo con su proyecto preferido y resolver conflictos multi-root / multi-project.

**Descripción ampliada:**
Debe usar:
- cercanía por path,
- library order,
- markers reales,
- y scoring de pertenencia para evitar mezclar símbolos de distintos proyectos.

**Referencia `plugin_old`:** `projectRegistry.ts`.

---

### B087. Topología de workspace y library order
**Objetivo:** explotar el `library order` real para priorizar resolución de símbolos y evitar colisiones falsas.

**Descripción ampliada:**
Una vez parseada la topología, el resolver debe usar el orden real de librerías/proyectos y no solo el primer símbolo encontrado por nombre.

**Referencia `plugin_old`:** `PbLibraryGraph`, `projectRegistry.ts`.

---

### B064. Enriched symbol model incremental
**Objetivo:** enriquecer progresivamente el modelo de símbolo para reducir heurística repetida.

**Campos objetivo sugeridos:**
- `containerKind`,
- `implementationKind`,
- `access`,
- `parameterCount`,
- `ownerName`,
- `isExternal`,
- `externalLibraryName`,
- `returnType`.

Esto facilita hover, completion, diagnostics, references y navegación jerárquica.

---

### B059. Symbol visibility real (`public/protected/private/...`)
**Objetivo:** modelar visibilidad real de miembros y variables de instancia.

**Descripción ampliada:**
Debe cubrir:
- `public`,
- `protected`,
- `private`,
- `protectedread`,
- `protectedwrite`,
- `privateread`,
- `privatewrite`.

**Criterio de salida:**
- definition/completion/references dejan de comportarse de forma demasiado permisiva.

---

### B058. InheritanceGraph robusto con caches
**Objetivo:** robustecer ancestros, derivados y caches de herencia.

**Descripción ampliada:**
Introducir y endurecer:
- `ancestorCache`,
- `memberCache`,
- `derivedTypeCache`,
- `getTypeDistance()`,
- consulta de descendientes directos,
- invalidación correcta ante cambios.

**Referencia `plugin_old`:** `InheritanceGraph`.

---

### B060. Owner resolution robusto (estático + dinámico)
**Objetivo:** resolver mejor owners y cadenas compuestas.

**Descripción ampliada:**
Debe soportar progresivamente:
- `This`,
- `Parent`,
- `::`,
- dot notation sobre variables tipadas,
- expresiones compuestas,
- dispatch dinámico acotado cuando proceda.

**Referencia `plugin_old`:** `owners/`, resolución semántica antigua y cualquier lógica probada de access chains.

---

### B023. Búsqueda de referencias segura en casos base
**Objetivo:** reconstruir `find references` sobre topología y resolución fuertes.

**Descripción ampliada:**
No debe seguir ampliándose solo por matching superficial; debe apoyarse en:
- topología real,
- visibilidad,
- owner resolution,
- herencia,
- y enriched symbol model.

---

## P2 — Hardening del parser y del lexer

### B089. Lexing de precisión: comentarios anidados y escapes
**Objetivo:** portear soporte serio para comentarios anidados y secuencias de escape complejas.

**Referencia `plugin_old`:** `powerScriptLexingUtils.ts`.

---

### B092. Sistema de máscaras de código (code masking)
**Objetivo:** generar máscaras para que el resto de servicios opere sobre código real ignorando strings y comentarios.

**Por qué es importante:** reduce falsos positivos en diagnostics, completion y parsing semántico.

**Referencia `plugin_old`:** `powerScriptLexingUtils.ts`.

---

### B095. Normalizador / splitter de sentencias
**Objetivo:** portear la segmentación robusta de statements y continuaciones.

**Referencia `plugin_old`:** `powerScriptStatementUtils.ts`.

---

### B090. Detección enriquecida de SQL embebido
**Objetivo:** detectar regiones SQL para reducir diagnósticos falsos y preparar soporte futuro.

**Descripción ampliada:**
Debe distinguir zonas SQL en scripts PowerScript y convivir bien con diagnostics semánticos del lenguaje base.

**Referencia `plugin_old`:** `powerScriptSqlUtils.ts`.

---

### B073. Soporte para funciones externas (`EXTERNAL FUNCTION/SUBROUTINE`)
**Objetivo:** parsear y resolver mejor `LIBRARY`, `ALIAS FOR` y declaraciones externas.

**Referencia `plugin_old`:** `tryParseCallableSymbol` y parsing de external callables.

---

### B099. Resolución por anidamiento (`Range Span Comparison`)
**Objetivo:** identificar el símbolo más anidado bajo el cursor con precisión fuerte.

**Referencia `plugin_old`:** `symbolIndex.ts`, `compareByNesting`.

---

### B101. Deduplicación semántica robusta
**Objetivo:** evitar colisiones entre símbolos homónimos usando claves compuestas más ricas.

**Referencia `plugin_old`:** `symbolIndex.ts`, `uniqueSymbols`.

---

## P3 — Productividad avanzada segura

### B031. Referencias más precisas y robustas
**Objetivo:** ampliar cobertura de referencias cuando la base de resolución ya sea suficientemente fuerte.

---

### B032. Rename controlado
**Objetivo:** permitir rename solo en escenarios con suficiente fiabilidad semántica.

**Descripción ampliada:**
Fuera de esos escenarios, el sistema debe degradar con seguridad o bloquear la operación.

---

### B036. Code actions básicas
**Objetivo:** añadir quick fixes pequeños y seguros basados en diagnósticos existentes.

---

### B066. CodeLens de referencias y herencia
**Objetivo:** mostrar conteo de referencias y relación de override/herencia sobre funciones y eventos.

**Referencia `plugin_old`:** `pbPowerScriptCodeLens.ts`.

---

### B065. Ancestor script navigation e hierarchy inspection
**Objetivo:** unir navegación al ancestro directo e inspección jerárquica del símbolo bajo cursor.

**Descripción ampliada:**
Debe permitir:
- saltar al ancestro inmediato,
- inspeccionar cadena de herencia,
- entender relaciones override/extend,
- y navegar con seguridad por scripts heredados.

**Referencia `plugin_old`:** `ancestorScriptService.ts`, servicios de hierarchy inspection.

---

### B067. Formateador configurable
**Objetivo:** homogeneizar el estilo del código PowerBuilder de forma configurable, pero solo después de consolidar parsing/resolución.

---

### B074. Diagnósticos de modernización y funciones obsoletas
**Objetivo:** identificar uso de funciones obsoletas y sugerir reemplazos del runtime moderno cuando el catálogo ya lo soporte.

**Referencia `plugin_old`:** `diagnosticResolver.ts`, `analyzeObsoleteRuntimeFunctions`.

---

### B103. Hover enriquecido con metadatos PB
**Objetivo:** mostrar más información útil en hover: access, external library, prototype vs implementation, owner context.

**Referencia `plugin_old`:** `hover/presentation.ts`.

---

### B104. Soporte para eventos calificados y `on-handlers`
**Objetivo:** mejorar la identificación visual y semántica de eventos declarados mediante sintaxis `ON object_name.event_name`.

---

### B106. Comando de información del objeto actual
**Objetivo:** mostrar resumen del archivo actual: eventos, funciones, variables, tipo principal y, más adelante, datos básicos si es DataWindow.

**Referencia `plugin_old`:** mensajes de usuario y servicios de inspección antiguos.

---

### B107. Status bar con contexto de proyecto
**Objetivo:** reflejar target/proyecto activo, estado del indexador y accesos rápidos a mantenimiento.

**Descripción ampliada:**
Debe convivir con el progreso de indexación y mostrar, cuando proceda:
- nombre del proyecto o target preferido,
- estado del contexto activo,
- acceso a reinicio del servidor,
- acceso a comandos de limpieza o diagnóstico.

---

## P4 — Escala, validación continua y rendimiento

### B030. Validación sobre workspace grande real
**Objetivo:** medir y validar el plugin sobre corpus grandes reales, no solo sobre fixtures sintéticos.

**Corpus prioritario:**
- PFC 2025 Solution,
- PFC 2025 Workspace,
- y corpus legacy internos representativos.

---

### B068. Calibración real del performance budget
**Objetivo:** contrastar budgets teóricos con métricas reales en entornos representativos.

---

### B069. Fixtures reales permanentes de PFC/legacy
**Objetivo:** incorporar fixtures permanentes y mantenidos para regresión continua.

---

### B070. Memory budgets de caché e índice
**Objetivo:** definir y verificar límites de memoria para índice, caché documental y snapshots.

---

### B071. Warm indexing y resume de caché persistente
**Objetivo:** evitar que cada reinicio implique un cold indexing completo.

**Descripción ampliada:**
Debe permitir reusar:
- descubrimiento ya hecho,
- fingerprints,
- snapshots de índice,
- estado parcial del workspace,
- y bases útiles para serving rápido al reabrir archivos.

---

### B071A. Caché persistente por workspace y por proyecto
**Objetivo:** separar mejor la persistencia de caché por workspace/proyecto para evitar recomputaciones innecesarias en repositorios grandes o multi-root.

**Descripción ampliada:**
Debe permitir:
- invalidación localizada,
- reutilización por proyecto,
- reapertura más rápida,
- mejor base para warm indexing.

---

### B071B. Caché de consultas frecuentes
**Objetivo:** persistir o reutilizar resultados de consultas de alto valor cuando sea seguro hacerlo.

**Descripción ampliada:**
Pensado para:
- hover frecuente,
- completado en archivos ya abiertos,
- signature help,
- definition cercana,
- información de tipos y owners inmediatos.

**Criterio de salida:**
- reabrir archivos y volver a consultar símbolos comunes se siente más ágil,
- sin comprometer corrección por invalidación deficiente.

---

### B063. Diagnostics snapshot agrupado
**Objetivo:** agrupar y servir diagnósticos por proyecto/objeto con snapshots más profesionales.

---

### B118. Integration test matrix del plugin
**Objetivo:** añadir tests de extensión explícitos para lifecycle real del plugin.

**Debe cubrir:**
- smoke activation,
- arranque cliente/servidor,
- apertura de workspace Solution,
- apertura de workspace Workspace,
- tests sobre `--disable-extensions`,
- tests con `@vscode/test-cli` y `@vscode/test-electron`.

---

### B119. Performance regression suite de extensión
**Objetivo:** medir regresiones en activación, primer hover, primer diagnostics, discovery e index warm/cold.

---

### B127. File watcher estratificado y debounce de invalidación
**Objetivo:** mejorar watchers e invalidación para que cambios masivos no disparen trabajo caótico.

**Descripción ampliada:**
- distinguir cambios interactivos de cambios masivos,
- agrupar invalidaciones,
- y reinyectar trabajo en las colas correctas.

---

### B128. Estados de readiness del workspace
**Objetivo:** modelar y exponer estados como `discovered`, `active-context-ready`, `workspace-partial`, `workspace-ready`.

---

### B129. Fairness por proyecto/root en background indexing
**Objetivo:** evitar que un root o proyecto muy grande monopolice la cola background.

**Descripción ampliada:**
Introducir fairness o round-robin por proyecto/root para equilibrar progreso cuando existan multi-root workspaces o solutions grandes.

---

## P5 — Ecosistema PowerBuilder, build y automatización

### B117. DataWindow safe mode mínimo
**Objetivo:** introducir soporte seguro mínimo de `.srd` sin abordar todavía toda la complejidad de DataWindow.

**Descripción ampliada:**
Debe permitir:
- detectar DataWindows,
- extraer SQL base,
- retrieve args,
- columnas,
- bandas principales,
- metadata suficiente para hover/navegación básica y reducción de falsos positivos.

**Nota de prioridad:** este item se mantiene deliberadamente **después** de consolidar una base fuerte de PowerScript.

---

### B041. Catálogo y navegación de DataWindow
**Objetivo:** tratar DataWindow/DataStore como entidades semánticas de primer nivel dentro del índice del plugin.

---

### B042. Soporte avanzado de DataWindow
**Objetivo:** ampliar a expresiones, funciones, propiedades avanzadas, `dw.Object` y relaciones con DataStore.

**Referencia `plugin_old`:** `datawindow/` y cualquier lógica previa útil.

---

### B081. Inteligencia de DataWindow y acceso a `.Object`
**Objetivo:** cubrir navegación y validación sobre `dw_1.Object` una vez exista base suficiente de DataWindow.

---

### B043. Integración con PBAutoBuild
**Objetivo:** integrar el backend moderno oficial de build/automatización de PowerBuilder.

**Descripción ampliada:**
- lanzar builds,
- validar entorno,
- capturar errores de compilación,
- y alimentar el estado de salud del workspace.

---

### B083. Integración avanzada con PBAutoBuild
**Objetivo:** enriquecer la integración hasta Problems panel, reporting y validación de precondiciones.

**Referencia `plugin_old`:** `pbAutoBuildService.ts` si sigue aportando consulta útil.

---

### B044. Estado de build y salud del workspace
**Objetivo:** detectar precondiciones, errores de configuración y readiness de compilación.

---

### B048. Integración con OrcaScript / ORCA
**Objetivo:** añadir compatibilidad con automatización avanzada o legacy del ecosistema clásico.

**Nota de prioridad:** debe venir **después** de PBAutoBuild en el camino moderno del producto.

---

### B045. Auditoría de arquitectura y convenciones
**Objetivo:** explotar el conocimiento semántico maduro para revisar consistencia técnica, convenciones y salud del proyecto.

---

### B109. API pública para integración (Extension Provider)
**Objetivo:** exponer una API para que otras extensiones o herramientas consuman capacidades semánticas del plugin.

**Referencia `plugin_old`:** `publicApi.ts`.

---

### B110. Exportación de superficie de automatización
**Objetivo:** generar manifiestos del workspace en JSON/YAML para CI, auditoría o agentes externos.

---

### B111. Árbol global de diagnósticos exportable
**Objetivo:** exportar problemas del proyecto en formato jerárquico procesable por máquinas.

---

### B112. Herramientas de consistencia del catálogo
**Objetivo:** validar la integridad del catálogo oficial y del dataset curado heredado del `plugin_old`.

---

### B130. Detector y normalizador de encoding de fuentes
**Objetivo:** detectar y normalizar correctamente UTF-8 con y sin BOM en Solution, y convivir con legacy heterogéneo.

**Descripción ampliada:**
- respetar `PB.INI` cuando aplique,
- detectar UTF-8/BOM,
- reducir problemas de lectura/guardado en flujos mixtos.

---

### B131. Soporte explícito para `.pblmeta`
**Objetivo:** indexar comentarios y metadatos de librería en Solution.

**Descripción ampliada:**
Esto mejora exploración de librerías, hover contextual y tooling alrededor de la estructura real del proyecto.

---

### B132. Gobernanza del catálogo oficial + dataset curado
**Objetivo:** separar formalmente dos capas de conocimiento:
- catálogo oficial PowerBuilder,
- dataset curado heredado del `plugin_old`.

**Descripción ampliada:**
Debe permitir trazabilidad, validación, versionado y explotación clara de ambos sin mezclarlos de forma opaca.

---

## 8. Impacto recomendado en el roadmap

### Ajustes recomendados al roadmap

#### Fase 6B
Añadir explícitamente:
- barra de estado con progreso de indexación,
- modelo de readiness del indexador,
- caché caliente del contexto activo,
- caché de serving para features interactivas.

#### Fase 7A
Añadir explícitamente:
- explotación de caché para serving rápido una vez exista topología fuerte,
- reutilización de snapshots semánticos por proyecto.

#### Fase 8A
Añadir explícitamente:
- caché persistente por workspace/proyecto,
- warm indexing real,
- caché de consultas frecuentes,
- budgets de memoria específicos por capa de caché.

### Regla estratégica que conviene dejar escrita en el roadmap
El producto debe perseguir dos objetivos simultáneos y no negociables:
1. **velocidad de carga**,
2. **utilidad profesional real**.

Eso implica que no basta con implementar semántica fuerte; también hay que conseguir que:
- abrir VS Code no cueste,
- abrir un archivo se sienta ágil,
- el usuario vea progreso,
- y repetir consultas se sienta rápido gracias a la caché.

---

## 9. Ítems que se mantienen deliberadamente más abajo

Estos ítems no desaparecen, pero **no suben** hasta consolidar antes una base fuerte de PowerScript, topología y resolución:

- DataWindow avanzado (`B042`, `B081`),
- auditoría avanzada y refactorizaciones complejas,
- API pública / automatización externa profunda,
- integraciones legacy más profundas con ORCA antes de cerrar el camino moderno con PBAutoBuild.

---

## 10. Slices recomendados de ejecución inmediata

### Slice A — Discovery, progreso visible e indexación no bloqueante
- B120
- B121
- B122
- B123
- B124
- B125
- B126
- B133
- B134

### Slice B — Contexto, parser base y caché interactiva de PowerScript
- B054
- B055
- B113
- B061
- B134A
- B134B
- B034
- B035

### Slice C — Topología y resolución fuerte
- B056
- B057
- B087
- B064
- B059
- B058
- B060
- B023

### Slice D — Hardening parser/lexer
- B089
- B092
- B095
- B090
- B073
- B099
- B101

### Slice E — Escala, caché persistente y validación continua
- B030
- B068
- B069
- B070
- B071
- B071A
- B071B
- B118
- B119
- B127
- B128
- B129

---

## 11. Regla de cierre

Un item del backlog solo puede cerrarse si:

- existe implementación real,
- pasa validación suficiente,
- la documentación afectada está actualizada,
- el estado del roadmap/current-focus está alineado,
- y no deja deuda crítica oculta sin registrar.

---

## 12. Resumen operativo

La prioridad inmediata del producto ya no debería ser “más features visibles”, sino:

1. **descubrir e indexar rápido sin bloquear**,
2. **hacer visible el progreso real del indexador al usuario**,
3. **fortalecer el parser y el contexto de PowerScript**,
4. **modelar correctamente Workspace/Solution**,
5. **cerrar resolución fuerte con herencia, owners y visibilidad**,
6. **hacer de la caché una pieza central para serving rápido de hover, completion, signature help y definition**,
7. **y después endurecer references, rename, escala y build**.

**DataWindow se mantiene, pero no se acelera** hasta que la base de PowerScript y resolución del plugin sea claramente más fuerte.
