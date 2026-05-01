# Architecture.md — versión LEAN

## 1. Objetivo

Definir la arquitectura base del plugin profesional de **PowerBuilder 2025 para Visual Studio Code**.

La arquitectura debe garantizar:

- **carga rápida**,
- **activación perezosa**,
- **impacto mínimo en el Extension Host**,
- **descubrimiento e indexación muy rápidos sin bloquear**,
- **base semántica reutilizable**,
- **escalabilidad en workspaces grandes y legacy**,
- **mantenibilidad a largo plazo**,
- y **evolución incremental sin rehacer el núcleo**.

---

## 2. Meta maestra

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Toda decisión arquitectónica debe proteger simultáneamente:

1. descubrimiento rápido,
2. indexación progresiva no bloqueante,
3. prioridad real al archivo activo,
4. latencia interactiva baja,
5. persistencia útil entre sesiones,
6. estado observable del motor,
7. y semántica fuerte sin sacrificar tiempo hasta valor.

---

## 3. Decisiones arquitectónicas base

La arquitectura oficial del proyecto es:

- **cliente ligero en VS Code**,
- **servidor LSP separado**,
- **prioridad absoluta al archivo activo**,
- **core semántico progresivamente compartido**,
- **análisis incremental y cancelable**,
- **persistencia y caché como capacidades de primer nivel**,
- y **documentación viva alineada con el estado real del repositorio**.

---

## 4. Principios arquitectónicos

### 4.1 Cliente mínimo real
El cliente solo debe encargarse de:

- activación mínima,
- lifecycle del cliente LSP,
- comandos ligeros,
- configuración,
- estado visible básico,
- y bridge con el servidor.

No debe contener análisis profundo ni semántica del lenguaje.

### 4.2 Servidor como runtime principal del conocimiento
El servidor LSP es responsable de:

- parseo,
- indexación,
- semántica,
- resolución,
- diagnósticos,
- navegación,
- y serving de capacidades de lenguaje.

### 4.3 Core agnóstico del editor
El núcleo del sistema no debe depender directamente de:

- VS Code,
- LSP,
- JSON-RPC,
- DTOs externos,
- ni herramientas de IA concretas.

Toda integración externa debe resolverse en adaptadores de borde.

### 4.4 Fuente única de verdad semántica
La arquitectura debe converger a una base común donde:

- la sintaxis se representa una sola vez,
- los símbolos y scopes se construyen una sola vez,
- la resolución se centraliza,
- y las features consumen consultas compartidas en lugar de reconstruir semántica.

### 4.5 Atomicidad del estado semántico
El sistema no debe exponer estados a medias.

Los cambios relevantes del conocimiento compartido deben publicarse de forma coherente y atómica, o con degradación explícita y segura.

### 4.6 Incrementalidad fina
El sistema debe recalcular solo lo necesario.

La invalidación debe ser fina, explícita y basada en impacto semántico real siempre que sea posible.

### 4.7 Persistencia robusta
La caché y la persistencia no son un añadido tardío.

Deben diseñarse con:

- versionado,
- invalidación clara,
- recuperación segura,
- y estrategia explícita de reanudación.

### 4.8 Explicabilidad y observabilidad
El motor debe poder exponer:

- qué está haciendo,
- qué parte del workspace está lista,
- qué caché está reutilizando,
- y por qué una consulta devolvió un resultado.

### 4.9 Estado real tras las olas 133-172
El repositorio ya materializa un primer corte operativo de:

- snapshot semántico canónico por documento,
- `KnowledgeBase` con staging/publicación atómica y `semanticEpoch`,
- diff semántico, dependencias inversas e invalidación dirigida/transitiva,
- indexación estructural + enriquecida con prioridad al activo, budgets adaptativos, preempción y modo degradado,
- `UnifiedProjectModel` como base topológica compartida,
- `cacheStore` real sobre `cacheStorageUri` con `workspaceKey` estable, metadata de checkpoint y validación estricta de `journal`,
- warm resume de `DocumentCache` + `KnowledgeBase` con persistencia solo en `readiness` estable,
- helper común de contexto de query y resolver detallado con `queryTrace` y `reasonCodes`,
- `ServingCache` extendido a `hover`, `definition`, `signatureHelp` y `completion`, con consumo real de `HotContextCache`,
- y snapshot de stats interno/público ampliado con `readiness`, `projectModel`, `persistence` y última traza de query.

---

## 5. Vista de alto nivel

```text
VS Code UI
  └─ Cliente ligero
      ├─ bootstrap mínimo
      ├─ commands ligeros
      ├─ estado visible
      └─ bridge LSP

Language Server Process
  ├─ runtime/
  ├─ core/
  │   ├─ domain/
  │   ├─ application/
  │   └─ ports/
  ├─ workspace/
  ├─ parsing/
  ├─ knowledge/
  ├─ diagnostics/
  ├─ features/
  ├─ adapters/
  └─ platform/
```

---

## 6. Capas principales

### 6.1 `client/`
Cliente mínimo de VS Code.

Responsable de:
- activación,
- wiring con el servidor,
- configuración,
- comandos ligeros,
- status mínimo.

### 6.2 `runtime/`
Orquestación operativa del servidor.

Responsable de:
- scheduler,
- prioridades,
- yielding,
- cancelación,
- preempción,
- invalidación,
- backpressure,
- gobernador de latencia,
- warm resume,
- progreso y readiness.

### 6.3 `core/domain/`
Conceptos canónicos del sistema.

Incluye:
- símbolos,
- scopes,
- tipos,
- referencias,
- dependencias,
- relaciones de herencia,
- contratos internos del lenguaje.

### 6.4 `core/application/`
Casos de uso internos del motor.

Incluye:
- analizar documento,
- actualizar conocimiento,
- resolver símbolos,
- calcular definition/references,
- preparar snapshots,
- servir consultas compartidas.

### 6.5 `core/ports/`
Puertos del núcleo hacia infraestructura intercambiable.

Incluye interfaces para:
- filesystem,
- caché,
- persistencia,
- logging,
- reloj,
- observabilidad.

### 6.6 `workspace/`
Modelo y estrategia del workspace/proyecto.

Responsable de:
- discovery,
- roots,
- tipos de proyecto,
- exclusiones,
- markers,
- watch/scan,
- metadatos de proyecto,
- contexto de pertenencia,
- y project model unificado.

### 6.7 `parsing/`
Conversión de archivos PowerBuilder en estructuras sintácticas reutilizables.

Debe ser:
- testeable sin VS Code,
- reusable,
- y separada de la semántica rica.

### 6.8 `knowledge/`
Backbone semántico compartido.

Responsable de:
- snapshots,
- symbols,
- binding,
- resolution,
- index,
- queries,
- publish atómico,
- epochs semánticas,
- dependencias inversas,
- y conocimiento incremental del workspace.

### 6.9 `diagnostics/`
Reglas diagnósticas apoyadas en servicios comunes.

No debe reconstruir semántica por su cuenta.

### 6.10 `features/`
Adaptadores finos para capacidades LSP:

- hover,
- completion,
- definition,
- references,
- rename,
- document symbols,
- workspace symbols,
- signature help,
- semantic tokens,
- diagnostics.

### 6.11 `adapters/`
Implementaciones concretas de borde:

- filesystem,
- cache,
- logging,
- lsp,
- y futura API local.

### 6.12 `platform/`
Primitivas técnicas compartidas con responsabilidad clara:

- observability,
- performance,
- persistence,
- hashing,
- text,
- cancellation,
- ids,
- collections.

### 6.13 `shared/`
Debe separarse conceptualmente en:

- `shared/contracts/` → DTOs y mensajes compartidos,
- `shared/kernel/` → primitivas mínimas realmente neutras.

Regla fuerte:
**los contratos no exponen directamente entidades internas del dominio.**

---

## 7. Estado explícito del sistema

La arquitectura debe modelar al menos estos niveles de estado:

### 7.1 Estado caliente del documento
- snapshot del documento activo,
- símbolos locales,
- scopes locales,
- contexto posicional,
- diagnósticos rápidos,
- datos inmediatos de serving.

### 7.2 Estado semántico del workspace
- símbolos exportados,
- relaciones de herencia,
- dependencias,
- topología de proyecto,
- índices globales,
- readiness del proyecto/workspace.

### 7.3 Estado persistente
- fingerprints,
- metadatos de caché,
- checkpoints de indexación,
- versión de esquema,
- resúmenes reutilizables del índice.

---

## 8. Reglas de dependencia

- `client/*` no depende del core del servidor.
- `features/*` depende de consultas/servicios públicos del core y del knowledge pipeline, no de estructuras crudas dispersas.
- `diagnostics/*` no reconstruye resolver o binder por su cuenta.
- `adapters/*` implementa puertos; no define dominio.
- `shared/contracts/*` no importa `core/domain/*`.
- `runtime/*` coordina ejecución; no contiene reglas semánticas profundas.
- `knowledge/*` puede depender de `core/domain` y `core/application`, pero no de UI ni de cliente VS Code.

---

## 9. Componentes temporales y migración

Las capas bootstrap son válidas si aportan valor temprano, pero deben ser:

- **explícitas**,
- **temporales**,
- **decrecientes**,
- y con **dirección clara de migración**.

Regla fuerte:

> ninguna capa provisional debe convertirse en núcleo permanente por acumulación histórica.

La dirección objetivo es que el peso semántico migre progresivamente hacia:

- `core/`
- `knowledge/`
- `runtime/`

y no quede atrapado en módulos transitorios o utilidades genéricas.

---

## 10. Estrategia de carga

### 10.1 Arranque en frío
El arranque debe hacer prácticamente cero trabajo pesado.

### 10.2 Primer archivo PowerBuilder
Al abrir un archivo PowerBuilder, el orden es:

1. activar cliente,
2. levantar servidor,
3. analizar primero el archivo activo,
4. enriquecer dependencias inmediatas,
5. diferir el trabajo global.

### 10.3 Indexación del workspace
El orden obligatorio de prioridad es:

1. documento activo,
2. dependencias inmediatas,
3. contexto cercano,
4. resto del proyecto,
5. resto del workspace.

Siempre:
- progresiva,
- cancelable,
- y no bloqueante.

---

## 11. Reglas transversales

- El cliente no implementa semántica pesada.
- El parser no depende de VS Code.
- La semántica no depende de UI ni de transporte.
- Los handlers LSP no contienen lógica de negocio profunda.
- El dominio no conoce JSON ni DTOs.
- Ninguna feature reconstruye semántica por su cuenta.
- Toda capacidad costosa debe declarar:
  - prioridad,
  - invalidación,
  - estrategia de caché,
  - cancelación,
  - y presupuesto razonable.
- Toda decisión estructural relevante debe reflejarse en la documentación canónica.

---

## 12. Regla de alineación documental

Toda decisión relevante sobre:

- estructura de capas,
- estrategia de caché,
- estrategia semántica,
- runtime,
- contratos,
- persistencia,
- observabilidad,
- o dirección arquitectónica,

debe actualizar, cuando aplique:

- `README.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- y las specs afectadas.

La arquitectura documentada debe distinguir siempre entre:

- **implementado**
- **parcial**
- **objetivo**

---

## 13. Resumen final

La arquitectura del plugin debe converger a este modelo:

1. **cliente mínimo**,  
2. **runtime explícito**,  
3. **core agnóstico**,  
4. **knowledge pipeline compartido**,  
5. **features como adaptadores finos**,  
6. **persistencia robusta**,  
7. **observabilidad operativa**,  
8. y **crecimiento incremental sin rehacer el núcleo**.

La meta arquitectónica no es añadir muchas piezas, sino sostener un plugin que combine:

- rapidez,
- estabilidad,
- semántica fuerte,
- soporte de proyectos grandes,
- y evolución limpia hacia automatización futura.
