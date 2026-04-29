# Architecture.md — versión revisada y reforzada

## 1. Objetivo

Definir una arquitectura base más robusta para el plugin profesional de **PowerBuilder 2025 para Visual Studio Code**, manteniendo la dirección ya correcta del proyecto pero reforzando los límites internos para evitar refactorizaciones estructurales futuras a medida que crezcan la semántica, la navegación, el índice global y la posible exposición de una API local. La extensión debe priorizar **carga rápida**, **activación perezosa**, **impacto mínimo en el Extension Host**, **escalabilidad en workspaces grandes**, **soporte para código legacy**, **mantenibilidad a largo plazo** y **evolución incremental guiada por documentación viva**. 

---

## 2. Decisión arquitectónica base vigente

La arquitectura oficial del proyecto seguirá siendo:

- **cliente ligero en VS Code**, con activación perezosa y responsabilidad mínima; VS Code recomienda activar solo cuando el usuario realmente lo necesita y evitar trabajo innecesario en el host. 
- **servidor LSP separado**, porque las features de lenguaje y el análisis de muchos archivos pueden consumir CPU y memoria y deben ejecutarse fuera del Extension Host siempre que sea posible. 
- **prioridad absoluta al archivo activo**, dejando la indexación global como trabajo secundario, progresivo y cancelable. 
- **evolución hacia una única base semántica reutilizable**, donde AST, símbolos, scopes, resolución y consultas compartidas sirvan a todas las features LSP sin duplicación de lógica. 
- **documentación viva alineada con el estado real del repositorio**, distinguiendo siempre entre implementado, parcial y objetivo. 

---

## 3. Problema a corregir en la arquitectura actual

La arquitectura actual está bien orientada, pero todavía concentra demasiado peso conceptual en bloques como `server/analysis`, `server/model`, `server/utils` y `shared`, que son útiles en bootstrap pero peligrosos a medio plazo porque tienden a absorber responsabilidades heterogéneas. En arquitecturas mantenibles, el problema habitual es el **dependency creep**: lógica de dominio mezclada con infraestructura, contratos y utilidades transversales, lo que complica pruebas, sustitución de componentes y evolución incremental. 

Si el proyecto crece sin endurecer estos límites, el riesgo más probable es que:

- `analysis/` se convierta en un núcleo provisional permanente,
- `model/` acabe siendo un contenedor genérico de tipos sin cohesión,
- `utils/` absorba lógica sin responsabilidad clara,
- `features/` empiece a reconstruir semántica por su cuenta,
- y `shared/` mezcle contratos de transporte con conceptos internos del dominio. 

---

## 4. Principios arquitectónicos reforzados

### 4.1 Cliente mínimo real

El cliente de VS Code debe limitarse a:

- registrar la extensión,
- levantar y detener el servidor cuando proceda,
- exponer comandos ligeros,
- leer configuración,
- mostrar estado mínimo,
- y ofrecer superficies ligeras de observabilidad.

No debe contener parseo profundo, indexación, resolución semántica ni lógica de negocio del lenguaje. VS Code recomienda la activación bajo demanda y documenta distintos hosts/runtimes precisamente para evitar cargar el editor con tareas pesadas. 

### 4.2 Runtime de análisis separado

El servidor LSP seguirá siendo el runtime principal del conocimiento PowerBuilder y será responsable de parseo, binding, resolución, indexación incremental, diagnósticos, navegación y demás capacidades de lenguaje. El modelo LSP existe precisamente para desacoplar el análisis costoso del editor y comunicar ambos lados mediante mensajes JSON-RPC. citeturn1search7turn1search9

### 4.3 Core agnóstico del editor

La mejora principal es introducir un **core explícito** dentro del servidor, con separación formal entre:

- **domain**,
- **application**,
- **ports**.

Ese core no debe depender de VS Code, del cliente LSP, de JSON, del sistema de logs concreto ni de la infraestructura de caché o filesystem. Esa independencia del núcleo frente a frameworks y herramientas externas es el principio central de Clean Architecture y Hexagonal Architecture. 

### 4.4 Fuente única de verdad semántica

La arquitectura debe converger a este contrato estable:

- el AST representa sintaxis,
- el binder crea símbolos y scopes,
- el resolver enlaza referencias, símbolos y tipos,
- el índice de workspace mantiene conocimiento global ligero e incremental,
- y las features LSP consumen consultas compartidas en lugar de reconstruir semántica. 

### 4.5 Contratos separados del dominio

Los contratos compartidos entre cliente y servidor, y cualquier futura API local, deben vivir en un espacio propio y no ser un reflejo serializado del modelo interno. Las buenas prácticas modernas de diseño de APIs insisten en contratos claros, desacoplamiento de implementación interna y evolución/versionado independiente. 

### 4.6 Rendimiento como restricción de diseño

Toda capacidad costosa debe declarar:

- cuándo se ejecuta,
- con qué prioridad,
- cómo se invalida,
- qué cachea,
- cómo se cancela,
- y qué presupuesto temporal razonable consume.

Las guías de Language Server explican que analizar muchos archivos, construir árboles y realizar análisis estático puede ser intensivo en CPU y memoria; por eso el rendimiento debe modelarse desde el inicio, no añadirse al final. citeturn1search7turn1search8turn1search25

---

## 5. Vista de alto nivel revisada

```text
VS Code UI
  └─ Extension Host (cliente ligero)
      ├─ manifest / contributions
      ├─ bootstrap mínimo
      ├─ commands ligeros
      ├─ status / output / observabilidad mínima
      └─ bridge LSP

Language Server Process
  ├─ runtime/
  │   ├─ lifecycle
  │   ├─ scheduler
  │   ├─ priorities
  │   ├─ cancellation
  │   └─ invalidation
  │
  ├─ core/
  │   ├─ domain/
  │   ├─ application/
  │   └─ ports/
  │
  ├─ workspace/
  ├─ parsing/
  ├─ knowledge/
  │   ├─ syntax/
  │   ├─ symbols/
  │   ├─ binding/
  │   ├─ resolution/
  │   ├─ index/
  │   ├─ snapshots/
  │   └─ queries/
  │
  ├─ diagnostics/
  ├─ features/
  ├─ adapters/
  │   ├─ filesystem/
  │   ├─ cache/
  │   ├─ logging/
  │   ├─ lsp/
  │   └─ api-jsonrpc/ (futuro)
  │
  └─ platform/
      ├─ observability/
      ├─ performance/
      ├─ persistence/
      └─ primitives/
```

Esta vista mantiene la dirección actual del proyecto, pero endurece los boundaries más importantes: **runtime**, **core**, **knowledge**, **adapters** y **contracts**. Esa separación reduce la probabilidad de que la semántica termine acoplada al transporte, a los handlers LSP o a utilidades genéricas sin control. 

---

## 6. Capas principales revisadas

### 6.1 Capa de manifiesto y contribuciones

Responsable de declarar el lenguaje y comportamiento base del editor:

- `package.json`
- `contributes.languages`
- `contributes.grammars`
- `language-configuration.json`
- snippets
- configuración visible del plugin

Debe ser declarativa siempre que sea posible y no depender de lógica pesada. VS Code da soporte explícito a este modelo declarativo mediante manifest, contribution points y activation events. 

### 6.2 Capa cliente VS Code

Responsable de:

- activación mínima,
- wiring con el servidor,
- comandos ligeros,
- estado mínimo,
- lectura de configuración,
- logging superficial,
- restart / stop / start del cliente LSP.

No debe contener análisis profundo del lenguaje ni conocimiento semántico compartido. citeturn1search13turn1search7

### 6.3 Capa runtime

Responsable de la orquestación operativa del servidor:

- scheduler,
- colas,
- prioridades,
- cancelación,
- invalidación,
- lifecycle,
- warmup,
- coordinación de trabajos pesados.

Esta capa no pertenece ni al dominio ni al transporte; debe existir como capa explícita para que la semántica no quede acoplada a la forma concreta de ejecución. 

### 6.4 Capa core/domain

Responsable de los conceptos canónicos del sistema:

- símbolos,
- scopes,
- referencias,
- tipos,
- unidades lógicas,
- relaciones de herencia,
- dependencias,
- contratos del lenguaje.

Debe ser pura, agnóstica de VS Code, LSP, JSON y filesystem real. 

### 6.5 Capa core/application

Responsable de los casos de uso internos del motor:

- analizar documento,
- actualizar conocimiento del workspace,
- resolver símbolos,
- calcular definiciones y referencias,
- preparar snapshots,
- servir consultas compartidas,
- coordinar diagnósticos.

Debe depender del dominio y de puertos, no de adaptadores concretos. 

### 6.6 Capa core/ports

Responsable de declarar interfaces para infraestructura intercambiable:

- filesystem,
- caché,
- logging,
- reloj,
- persistencia,
- observabilidad,
- almacenamiento de índices,
- transporte futuro.

Los adaptadores implementan estos puertos; el core no depende de implementaciones concretas. 

### 6.7 Capa workspace

Responsable de:

- descubrimiento del workspace,
- roots,
- exclusiones,
- tipos de archivo relevantes,
- estrategia de watch / scan,
- metadatos del proyecto,
- priorización del análisis del documento activo y sus dependencias inmediatas. 

### 6.8 Capa parsing

Responsable de convertir archivos PowerBuilder en estructuras sintácticas reutilizables.

Debe ser testeable sin VS Code y no debe incorporar semántica rica. Puede convivir temporalmente con heurísticas de bootstrap, pero su objetivo es evolucionar hacia parseo cada vez más formal. 

### 6.9 Capa knowledge

Nueva capa explícita que reemplaza conceptualmente el crecimiento indiscriminado de `analysis/`.

Se divide en:

- `syntax/`
- `symbols/`
- `binding/`
- `resolution/`
- `index/`
- `snapshots/`
- `queries/`

Su función es construir y servir la plataforma de conocimiento compartida que usarán hover, definition, references, rename, diagnostics, semantic tokens y demás capacidades. 

### 6.10 Capa bootstrap analysis (temporal)

Mientras el knowledge pipeline no esté completo, puede mantenerse una capa de análisis documental rápido para soportar valor funcional temprano. Pero debe declararse explícitamente como **temporal y decreciente**.

Reglas:

- puede concentrar valor inicial,
- no debe absorber binder ni resolver completos,
- no debe convertirse en la fuente permanente de semántica,
- y debe vaciarse progresivamente hacia `parsing/`, `knowledge/` y `core/application/`. 

### 6.11 Capa diagnostics

Responsable de producir y publicar diagnósticos a partir de servicios comunes del core y del knowledge pipeline.

No debe duplicar resolución semántica por su cuenta. 

### 6.12 Capa features LSP

Responsable de adaptar el conocimiento interno a handlers LSP:

- hover,
- completion,
- definition,
- references,
- rename,
- document symbols,
- workspace symbols,
- semantic tokens,
- signature help,
- diagnostics.

Debe ser fina y actuar como adapter; la lógica profunda debe residir en consultas y servicios compartidos. El modelo LSP precisamente separa cliente/servidor y protocolo de la lógica de lenguaje. citeturn1search7turn1search9

### 6.13 Capa adapters

Responsable de conectar el core y el runtime con infraestructura concreta:

- filesystem,
- cache,
- logging,
- lsp,
- y futura api local JSON-RPC.

Aquí también vivirán los mappers y contratos de borde cuando se quiera exponer una API local desacoplada. Las buenas prácticas de API recomiendan versionado y desacoplamiento en el borde, no dentro del dominio. 

### 6.14 Capa platform

Responsable de utilidades técnicas con intención clara y sin mezclar dominio:

- observability,
- performance,
- persistence,
- collections,
- text,
- timing,
- cancellation,
- hashing,
- ids.

Sustituye progresivamente el uso de `utils/` genérico. 

### 6.15 Shared/contracts y shared/kernel

`shared/` debe dividirse conceptualmente en:

- `contracts/`: DTOs y tipos de mensajes compartidos,
- `kernel/`: primitives neutras y utilidades mínimas realmente compartibles.

Regla fuerte: `shared/contracts` no debe importar entidades del dominio interno. Los contratos deben poder evolucionar independientemente de la implementación interna. 

---

## 7. Estrategia de carga revisada

### 7.1 Arranque en frío

En arranque en frío la extensión debe hacer prácticamente cero trabajo: declararse, quedar disponible y esperar el primer uso real. VS Code documenta que las extensiones se activan perezosamente y recomienda usar activation events específicos. 

### 7.2 Primer archivo PowerBuilder

Al abrir el primer archivo PowerBuilder:

1. se activa el cliente,
2. se levanta el runtime LSP,
3. se analiza primero el archivo activo,
4. se enriquecen sus dependencias inmediatas,
5. y el trabajo global queda diferido. 

### 7.3 Warm indexing

La indexación de workspace debe operar con esta prioridad:

1. documento activo,
2. dependencias inmediatas,
3. archivos relacionados,
4. resto del workspace.

Debe ser incremental, cancelable y no bloqueante. La necesidad de análisis incremental y de aislamiento del trabajo pesado está alineada con la guía de Language Server y el modelo del Extension Host. 

---

## 8. Reglas de diseño reforzadas

- El cliente no implementa semántica pesada. citeturn1search13turn1search7
- El parser no depende de VS Code. 
- La semántica no depende de UI ni de transporte. 
- Los handlers LSP no contienen lógica de negocio profunda. citeturn1search7turn1search9
- El dominio no conoce JSON ni DTOs.
- Los contratos no exponen entidades internas directamente. 
- Toda capacidad costosa debe exponer invalidación, cancelación y estrategia de caché. 
- Ninguna feature debe reconstruir lógica semántica por su cuenta. 
- `analysis/` es bootstrap temporal, no destino final. 
- `model/` y `utils/` deben descomponerse progresivamente en módulos con responsabilidad real. 

---

## 9. Reglas de dependencia recomendadas

- `client/*` puede depender de `shared/contracts`, `shared/kernel` y wiring LSP, pero no del core del servidor. 
- `server/features/*` debe depender de servicios públicos del core/knowledge, no de estructuras internas crudas del parser salvo interfaces explícitas. 
- `server/diagnostics/*` no debe reconstruir resolver o binder por su cuenta. 
- `server/adapters/*` implementan puertos; no definen dominio. 
- `shared/contracts/*` no debe importar `server/core/domain/*`.
- `runtime/*` coordina ejecución, pero no contiene reglas semánticas profundas. 
- `knowledge/*` puede depender de `core/domain` y `core/application`, pero no de UI ni de cliente VS Code. 

---

## 10. Estado del sistema que debe modelarse explícitamente

### 10.1 Estado documental caliente

Para archivos abiertos o recientes:

- syntax tree,
- símbolos locales,
- scopes locales,
- referencias inmediatas,
- diagnósticos rápidos,
- metadatos de edición.

### 10.2 Estado de conocimiento del workspace

Para el proyecto:

- símbolos exportados,
- dependencias,
- jerarquías,
- fingerprints,
- snapshots del índice global.

### 10.3 Estado persistente / caché

Para acelerar reinicios:

- fingerprints,
- metadatos mínimos,
- versión de esquema interno,
- resumen ligero de índice,
- información de invalidación.

Separar estos niveles evita usar el mismo modelo para servir necesidades de latencia inmediata y para mantener conocimiento global pesado. Esa separación es coherente con el diseño incremental recomendado para runtimes de lenguaje. 

---

## 11. Estrategia de validación arquitectónica

Toda evolución arquitectónica debe comprobar:

- impacto en arranque,
- impacto en archivo activo,
- impacto en workspaces grandes,
- impacto en memoria,
- trazabilidad de responsabilidades,
- y actualización documental. 

Como guía de diseño, deben medirse y vigilarse al menos:

- tiempo de activación del cliente,
- tiempo hasta primer document symbols,
- tiempo hasta primer hover,
- tiempo hasta primera publicación de diagnósticos,
- tiempo de análisis por documento,
- consumo de memoria de caché,
- comportamiento sobre corpus pequeños, medianos y grandes.

Las guías oficiales de VS Code/LSP justifican esta preocupación porque el análisis de lenguaje es costoso y debe proteger la experiencia de edición. 

---

## 12. Estado actual revisado

### IMPLEMENTADO

- cliente ligero en `src/client/extension.ts`,
- bootstrap del servidor en `src/server/server.ts`,
- parseo y heurísticas iniciales en `src/server/parsing/*`,
- análisis documental y scheduling básico en `src/server/analysis/*`,
- features LSP activas: Document Symbols, Hover sem�ntico, Go to Definition, Workspace Symbols, Completado Contextual, Signature Help en `src/server/features/*`,
- tipos internos en `src/server/model/*`,
- utilidades internas en `src/server/utils/*`,
- tipos compartidos en `src/shared/*`,
- gramáticas y configuración del lenguaje,
- documentación y tests iniciales.

### PARCIAL

- caché e invalidación más robustas,
- observabilidad de rendimiento,
- estructura formal de core/domain/application/ports,
- knowledge pipeline explícito,
- separación fuerte entre contracts y kernel,
- runtime/scheduler como capa propia.

### OBJETIVO

- core agnóstico consolidado,
- knowledge pipeline incremental compartido,
- runtime explícito,
- contracts externos separados del dominio,
- índice global ligero e incremental,
- queries compartidas para todas las features,
- y preparación estructural para API local basada en mensajes JSON versionables. 

---

## 13. Criterios para siguientes fases

Las siguientes fases del proyecto deben seguir este orden lógico:

1. consolidar activación, manifiesto y flujo básico, 
2. normalizar tests y validación, 
3. endurecer caché, invalidación y observabilidad básica, 
4. reforzar parseo y análisis documental reusable, 
5. introducir core/domain, core/application y core/ports, 
6. introducir knowledge pipeline explícito: symbols, binding, resolution, queries, 
7. construir índice global incremental y snapshots, 
8. añadir navegación semántica fuerte y diagnósticos compartidos, 
9. optimizar rendimiento sobre corpus grandes y legacy, 
10. preparar contracts y adapter de API local futura sin contaminar el dominio. 

No debe adelantarse semántica avanzada si antes no existe una base fiable de activación, tests, análisis reusable, caché, runtime y observabilidad mínima. 

---

## 14. Regla de alineación documental

Toda decisión arquitectónica relevante debe reflejarse en la documentación canónica del repositorio.

Si durante la evolución del proyecto cambia cualquiera de estos elementos:

- estructura de módulos,
- responsabilidades de capas,
- políticas de caché,
- estrategia semántica,
- estrategia de runtime,
- contratos compartidos,
- o roadmap arquitectónico,

se deberán actualizar al menos:

- `README.md`,
- `architecture.md`,
- `roadmap.md`,
- `backlog.md`,
- `current-focus.md` si existe,
- y cualquier otra nota técnica afectada.

La documentación no debe describir una arquitectura imaginaria como si ya existiera; debe distinguir siempre entre **implementado**, **parcial** y **objetivo**. 

---

## 15. Estructura final sugerida de carpetas y archivos futuros (solo nombres, sin código)

> Esta estructura representa la **dirección objetivo futura**; no implica que deba aplicarse mediante big bang.

```text
src/
  client/
    extension.ts
    commands/
      restartLanguageServer.ts
      showServerStatus.ts
      clearCaches.ts
    config/
      extensionConfiguration.ts
      configurationSchema.ts
    ui/
      outputChannel.ts
      statusBar.ts
      notifications.ts
    lsp/
      languageClient.ts
      clientLifecycle.ts
      clientCapabilities.ts

  server/
    server.ts

    runtime/
      lifecycle/
        serverLifecycle.ts
        serverShutdown.ts
      scheduler/
        analysisScheduler.ts
        jobQueue.ts
        taskBudget.ts
      priorities/
        analysisPriority.ts
        priorityPolicy.ts
      cancellation/
        cancellationTokens.ts
        cooperativeCancellation.ts
      invalidation/
        invalidationGraph.ts
        invalidationPlanner.ts
      warmup/
        warmIndexingPlan.ts
        activeDocumentFirstPolicy.ts

    core/
      domain/
        symbols/
          symbol.ts
          symbolKind.ts
          symbolId.ts
          symbolTable.ts
        scopes/
          scope.ts
          scopeKind.ts
          scopeStack.ts
        types/
          pbType.ts
          typeReference.ts
          typeRelations.ts
        references/
          symbolReference.ts
          referenceKind.ts
          referenceTarget.ts
        workspace/
          workspaceUnit.ts
          projectRoot.ts
          sourceDocument.ts
        dependencies/
          dependencyEdge.ts
          dependencyGraph.ts
          inheritanceRelation.ts
      application/
        analysis/
          analyzeDocument.ts
          reanalyzeImpactedDocuments.ts
        navigation/
          getDefinition.ts
          getReferences.ts
          renameSymbol.ts
        diagnostics/
          collectDiagnostics.ts
          publishDiagnostics.ts
        queries/
          getDocumentSymbols.ts
          getWorkspaceSymbols.ts
          getHoverInfo.ts
      ports/
        fileSystemPort.ts
        cachePort.ts
        loggerPort.ts
        clockPort.ts
        indexStoragePort.ts
        telemetryPort.ts

    workspace/
      discovery/
        workspaceDiscovery.ts
        projectMarkers.ts
      roots/
        workspaceRoots.ts
        rootSelection.ts
      watch/
        fileWatchPolicy.ts
        workspaceWatcher.ts
      metadata/
        workspaceMetadata.ts
        fileClassification.ts

    parsing/
      lexer/
        token.ts
        tokenKind.ts
        tokenizer.ts
      syntax/
        syntaxNode.ts
        syntaxTree.ts
        parseDocument.ts
      matchers/
        declarationMatchers.ts
        statementMatchers.ts
      sections/
        sourceSections.ts
        documentRegions.ts

    knowledge/
      syntax/
        syntaxSnapshot.ts
        syntaxCache.ts
      symbols/
        symbolExtraction.ts
        symbolCatalog.ts
      binding/
        binder.ts
        bindingContext.ts
        bindingResult.ts
      resolution/
        resolver.ts
        resolutionContext.ts
        resolutionResult.ts
      index/
        workspaceIndex.ts
        exportedSymbolIndex.ts
        referenceIndex.ts
      snapshots/
        documentKnowledgeSnapshot.ts
        workspaceKnowledgeSnapshot.ts
      queries/
        definitionQuery.ts
        referencesQuery.ts
        hoverQuery.ts
        completionQuery.ts
        semanticTokensQuery.ts
        signatureHelpQuery.ts

    diagnostics/
      rules/
        syntaxDiagnosticsRule.ts
        semanticDiagnosticsRule.ts
        unusedVariablesRule.ts
      publishing/
        diagnosticsPublisher.ts
        diagnosticsBatch.ts

    features/
      hover/
        hoverFeature.ts
      definition/
        definitionFeature.ts
      references/
        referencesFeature.ts
      rename/
        renameFeature.ts
      completion/
        completionFeature.ts
      documentSymbols/
        documentSymbolsFeature.ts
      workspaceSymbols/
        workspaceSymbolsFeature.ts
      semanticTokens/
        semanticTokensFeature.ts
      signatureHelp/
        signatureHelpFeature.ts
      diagnostics/
        diagnosticsFeature.ts

    adapters/
      filesystem/
        nodeFileSystemAdapter.ts
      cache/
        memoryCacheAdapter.ts
        persistentCacheAdapter.ts
      logging/
        outputChannelLoggerAdapter.ts
        structuredLoggerAdapter.ts
      lsp/
        lspMessageAdapter.ts
        lspCapabilitiesAdapter.ts
      api-jsonrpc/
        jsonRpcAdapter.ts
        apiVersionRegistry.ts
        dtoMapping.ts

    platform/
      observability/
        metricsRegistry.ts
        timingProbe.ts
      performance/
        latencyBudget.ts
        memoryBudget.ts
      persistence/
        cacheSchemaVersion.ts
        persistedIndexStore.ts
      collections/
        multiMap.ts
        indexedSet.ts
      text/
        textSpan.ts
        textNormalizer.ts
      timing/
        stopwatch.ts
        deadline.ts
      cancellation/
        cancellationState.ts
        cancellationPolicy.ts
      hashing/
        contentFingerprint.ts
      ids/
        stableId.ts

  shared/
    contracts/
      clientServerMessages.ts
      sharedConfiguration.ts
      transportEvents.ts
    kernel/
      disposable.ts
      result.ts
      option.ts
      invariants.ts
```

Esta estructura final sugerida refuerza la separación entre **cliente**, **runtime**, **core**, **knowledge**, **adapters**, **platform** y **contracts**, y deja un hueco explícito para una futura API local versionable sin contaminar el dominio. Ese enfoque está alineado con el modelo LSP/JSON-RPC y con los principios de Clean/Hexagonal para mantener el núcleo independiente de frameworks y contratos externos. 

---

## 16. Resumen operativo final

La mejora recomendada no cambia la dirección base del proyecto, pero sí endurece los puntos que más suelen provocar deuda y refactorizaciones futuras:

1. formalizar `core/domain`, `core/application` y `core/ports`, 
2. declarar `analysis/` como bootstrap temporal y disminuir su peso con el tiempo, 
3. crear una capa `knowledge/` explícita como backbone semántico compartido, 
4. separar `runtime/` como orquestación independiente, 
5. dividir `shared/` en `contracts/` y `kernel/`,
6. preparar `adapters/api-jsonrpc/` como boundary futuro desacoplado, 
7. y medir siempre el impacto en activación, archivo activo, workspaces grandes y memoria. 

Con esta revisión, la arquitectura queda mejor preparada para crecer en semántica fuerte, soportar proyectos legacy grandes y abrir más adelante capacidades consumibles externamente sin rediseñar el core. 

---

## 17. Evolución y Herencia (Insights de `plugin_old`)

La arquitectura actual, fuertemente basada en inyección de dependencias y servicios acotados (como `KnowledgeBase` y `SystemCatalog`), está diseñada deliberadamente para soportar y absorber progresivamente la complejidad técnica que residía en el `plugin_old`.

A medida que el proyecto avance hacia fases semánticas fuertes (Fase 6 y 7), se planea el porting e integración de los siguientes artefactos clave del antiguo plugin:

1.  **`PbLibraryGraph` (Workspace Topology):** Extender el motor de indexación para que deje de ser agnóstico a las carpetas, parseando los `.pbw` y `.pbt` para entender el concepto de *Library List*. Esto resolverá conflictos de objetos duplicados y shadowing.
2.  **`InheritanceGraph`:** Incorporar el grafo de herencia de objetos dentro de la capa `knowledge`. Esto es vital para que las capas de `application` y `features` puedan resolver herencias complejas y determinar si un método es accesible desde clases descendientes.
3.  **`SemanticEngine` y Ranking de Completado:** Adoptar el avanzado algoritmo de scoring del viejo plugin (`getCompletionScore`), el cual aplica puntajes basados en la distancia de herencia, visibilidad (global, shared, local) y *owner context*.

Estas adiciones no romperán el diseño actual; se conectarán como nuevos "proveedores de contexto" dentro del `semantic backbone` (`knowledge/`), manteniendo intactos a los clientes finales (las features LSP).
