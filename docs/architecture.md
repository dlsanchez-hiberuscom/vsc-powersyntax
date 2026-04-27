# Arquitectura técnica — Plugin PowerBuilder 2025 para VS Code

## 1. Objetivo

Definir la arquitectura base recomendada para un plugin profesional de **PowerBuilder 2025 para Visual Studio Code** con foco en:

- rapidez de carga,
- separación estricta de responsabilidades,
- mantenibilidad,
- escalabilidad en workspaces grandes,
- soporte razonable para código legacy,
- rendimiento predecible,
- y facilidad de evolución mediante SDD.

---

## 2. Principios arquitectónicos

### 2.1 Cliente mínimo

El cliente de VS Code debe limitarse a:

- registrar la extensión,
- levantar el servidor LSP cuando proceda,
- exponer comandos ligeros,
- mostrar estado mínimo,
- coordinar configuración básica,
- y ofrecer superficies ligeras de observabilidad.

Toda lógica pesada debe quedar fuera del Extension Host.

### 2.2 Servidor LSP separado

El servidor LSP será el responsable de:


- parseo,
- análisis por documento,
- indexación,
- semántica,
- diagnósticos,
- hover,
- definition / references / rename,
- semantic tokens,
- signature help,
- completions,
- y servicios relacionados.

### 2.3 Declarativo antes que programático

Siempre que sea posible, se usará configuración declarativa para:

- `contributes.languages`
- `contributes.grammars`
- `language-configuration.json`
- snippets
- configuración visible de `package.json`

### 2.4 Prioridad del archivo activo

El sistema debe optimizar primero la experiencia del archivo abierto.

La indexación global debe ejecutarse como trabajo secundario y cancelable.


### 2.5 Fuente única de verdad semántica

La arquitectura debe evolucionar hacia una única base semántica reutilizable por todas las features.

Esto implica:

- el AST representa sintaxis, no lógica semántica completa,
- los símbolos deben ser entidades canónicas,
- las referencias deben resolverse contra esos símbolos,
- y las features LSP deben consumir servicios comunes, no reconstruir lógica por su cuenta.

### 2.6 Rendimiento como restricción de diseño

La velocidad no es un añadido posterior, sino una condición arquitectónica desde el inicio.

Toda capacidad costosa debe definir:

- cuándo se ejecuta,
- con qué prioridad,
- cómo se invalida,
- qué cachea,
- y cómo se cancela.

---

## 3. Vista de alto nivel

```text
VS Code UI
  └─ Extension Host (cliente ligero)
      ├─ manifest / contributions
      ├─ bootstrap mínimo
      ├─ start / stop / restart del LSP
      ├─ comandos ligeros
      ├─ output channel / estado
      └─ wiring de configuración


Language Server Process
  ├─ project discovery
  ├─ parsing
  ├─ document analysis
  ├─ symbol index
  ├─ semantic engine
  ├─ diagnostics engine
  ├─ navigation services
  ├─ completion services
  ├─ semantic tokens
  ├─ file watching / invalidation
  └─ workspace cache
```

---

## 4. Capas principales

## 4.1 Capa de manifiesto y contribuciones

Responsable de declarar el lenguaje y comportamiento base del editor.

Incluye:

- `package.json`
- `language-configuration.json`
- gramáticas TextMate
- snippets

No debe depender de lógica pesada.

## 4.2 Capa cliente VS Code

Responsable de la interacción mínima con la API de VS Code.

Responsabilidades:

- activación mínima,
- gestión del ciclo de vida del LSP,
- comandos de mantenimiento,
- lectura de configuración,
- exposición de logs / estado,
- y wiring básico.

No debe contener análisis profundo del lenguaje.

## 4.3 Capa de transporte LSP

Responsable de conectar cliente y servidor.

Responsabilidades:

- inicialización del servidor,
- negociación de capacidades,
- transmisión de eventos,
- ciclo de vida,
- reinicio controlado,
- logging y tracing.

## 4.4 Capa de proyecto / workspace

Responsable de descubrir y modelar el workspace.

Responsabilidades:

- roots,
- tipos de archivo relevantes,
- marcadores del proyecto,
- exclusiones,
- metadatos del workspace,
- estrategia de watch / scan.

## 4.5 Capa de parseo

Responsable de convertir archivos PowerBuilder en estructuras sintácticas reutilizables.

Debe ser independiente de VS Code y testeable sin el editor.

## 4.6 Capa de análisis documental (bootstrap)

Responsable de soportar el estado actual del proyecto mientras no exista todavía una capa semántica completa.
Responsabilidades:

- análisis rápido por documento,
- extracción estructural inicial,
- preparación de datos reutilizables para hover, document symbols y diagnósticos,
- coordinación con caché y scheduler de análisis.

Esta capa debe considerarse evolutiva.
A medio plazo, parte de su lógica deberá redistribuirse hacia parseo formal, binder, resolver, índice global y semántica compartida.

## 4.7 Capa de índice

Responsable de construir y mantener:

- símbolos por archivo,
- símbolos exportados,
- referencias cruzadas,
- metadatos de tipos,
- dependencias e invalidaciones.

Debe diseñarse de forma incremental y ligera.

## 4.8 Capa semántica

Responsable de resolver:

- scopes,
- símbolos,
- tipos,
- herencia,
- owner-awareness,
- navegación simbólica,
- diagnósticos semánticos,
- y contratos del lenguaje.

## 4.9 Capa de features LSP

Responsable de adaptar la semántica a handlers LSP.

Incluye:

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

## 4.9 Capa de caché y rendimiento

Responsable de:

- persistencia de metadatos,
- fingerprints por archivo,
- invalidación fina,
- warmup progresivo,
- colas de prioridad,
- cancelación,
- presupuestos de tiempo,
- y observabilidad básica de rendimiento.

---

## 5. Estrategia de carga

### 5.1 Arranque en frío

En arranque en frío la extensión debe hacer casi cero trabajo.

Debe limitarse a declararse, quedar disponible y esperar el primer uso real.

### 5.2 Primer archivo PowerBuilder

Al abrir el primer archivo PowerBuilder:

1. se activa el cliente,
2. se arranca el LSP,
3. se analiza primero el archivo activo,
4. y el trabajo global queda diferido.

### 5.3 Warm indexing

La indexación de workspace debe operar con prioridades:

1. documento activo,
2. dependencias inmediatas,
3. archivos relacionados,
4. resto del workspace.

Debe ser incremental, cancelable y no bloqueante.

---

## 6. Módulos recomendados del repositorio

```text
/src
  /client
    extension.ts
    commands/
    config/
    ui/
    lsp/
  /server
    
server.ts
    protocol/
    workspace/
    parsing/
    analysis/
    index/
    semantic/
    diagnostics/
    features/
    cache/
    performance/
    model/
    utils/
  /shared
    contracts/
    constants/
    types/
    utils/
```

Esta estructura representa la dirección objetivo del proyecto.
En el estado actual (bootstrap), solo una parte está implementada físicamente y otras áreas se cubren de forma provisional mediante módulos como analysis/, parsing/, features/, model/, utils/ y shared/.

No debe forzarse una reestructuración grande antes de que exista valor claro en hacerlo.

---

## 7. Responsabilidades por módulo

### `src/client/extension.ts`
Punto de entrada del cliente.

### `src/client/lsp/`
Wiring del cliente con el servidor.

### `src/client/commands/`
Comandos explícitos del usuario.

### `src/client/ui/`
Output channel, status, mensajes y superficies ligeras.

### `src/server/server.ts`
Punto de entrada del servidor.

### `src/server/workspace/`
Descubrimiento, roots, estrategia de escaneo y watchers.

### `src/server/parsing/`
Parseo del lenguaje PowerBuilder.

### `src/server/analysis/`
Análisis documental rápido y soporte evolutivo del bootstrap.

### `src/server/index/`
Índice incremental de símbolos y referencias.

### `src/server/semantic/`
Resolución semántica y reglas del lenguaje.

### `src/server/diagnostics/`
Producción de diagnósticos.

### `src/server/features/`
Handlers LSP por capacidad.

### `src/server/cache/`
Persistencia e invalidación.

### `src/server/performance/`
Métricas, time budgets, colas, cancelación.

### `src/server/model/`
Tipos y estructuras internas del dominio del servidor.

### `src/server/utils/`
Utilidades internas del servidor sin responsabilidad semántica principal.

### `src/shared/`
Tipos y contratos compartidos entre cliente y servidor.

---

## 8. Reglas de diseño

- El cliente no implementa semántica pesada.
- El parser no depende de VS Code.
- La semántica no depende de la UI.
- Los handlers LSP no contienen lógica de negocio profunda.
- Todo módulo debe ser testeable en aislamiento razonable.
- Toda capacidad costosa debe exponer estrategia de invalidación.
- No debe duplicarse lógica de resolución entre features.
- La semántica compartida debe crecer por capas, no por atajos puntuales.

## 8.1 Regla de fuente única de verdad semántica

La arquitectura debe converger a este contrato:

- El AST representa solo sintaxis.
- El binder crea símbolos y scopes.
- El resolver enlaza referencias con símbolos.
- El workspace index mantiene un índice global ligero e incremental.
- Las features LSP (hover, definition, references, completion, semantic tokens, diagnostics) deben apoyarse en servicios semánticos comunes.
- Ningún handler LSP debe reconstruir lógica semántica por su cuenta.
- Un uso de símbolo no crea un nuevo símbolo; debe apuntar a una entidad canónica existente.

## 8.2 Reglas de evolución del bootstrap

Mientras no exista todavía la arquitectura semántica completa:

- analysis/ puede concentrar parte del valor funcional inicial,
- pero esa lógica no debe crecer sin control,
- y debe migrarse progresivamente hacia parseo formal, binder, resolver e índice según el roadmap.

---

## 9. Estrategia de validación arquitectónica

Toda evolución arquitectónica debe comprobar:

- impacto en arranque,
- impacto en archivo activo,
- impacto en workspaces grandes,
- impacto en memoria,
- trazabilidad de responsabilidades,
- y actualización documental.

## 9.1 Reglas de evolución del bootstrap

- Prioridad absoluta al archivo activo.
- Análisis global siempre secundario, progresivo y cancelable.
- Estado rico para archivos abiertos o recientes.
- Estado ligero para archivos cerrados.
- Invalidación incremental por archivo y dependencias afectadas.
- Toda caché debe tener estrategia explícita de tamaño, expiración o evicción.
- Ninguna operación costosa debe bloquear el flujo visible del usuario.
- Toda feature debe poder medirse razonablemente en latencia y coste.

## 9.2 Reglas de evolución del bootstrap

Como guía de diseño, deben medirse y vigilarse al menos:

- tiempo de activación del cliente,
- tiempo hasta primer document symbols,
- tiempo hasta primer hover,
- tiempo hasta primera publicación de diagnósticos,
- tiempo de análisis por documento,
- consumo de memoria de caché,
- y comportamiento sobre corpus pequeños, medianos y grandes.

Estos presupuestos pueden ajustarse por fase, pero deben existir desde el inicio como referencia operativa.
---

## 10. Decisión base vigente

La arquitectura base oficial del proyecto será:

- **cliente ligero en VS Code**, 
- **servidor LSP separado**,
- **activación perezosa**,
- **análisis incremental**,
- **prioridad al archivo activo**,
- **estado rico para abierto / estado ligero para cerrado**,
- y **documentación viva alineada con SDD**.

## 11. Estado actual (bootstrap real)

En el estado actual (bootstrap) el repositorio implementa un esqueleto operativo que debe mapearse explícitamente a archivos reales:

- **Cliente:** `src/client/extension.ts` — wiring del `LanguageClient` y lógica mínima de activación/arranque.
- **Servidor:** `src/server/server.ts` — bootstrap del servidor LSP y handlers iniciales.
- **Parseo / Matchers:** `src/server/parsing/*` (`matchers.ts`, `sections.ts`) — heurísticas basadas principalmente en expresiones regulares.
- **Análisis documental y scheduling:** `src/server/analysis/*` (`documentAnalysis.ts`, `analysisCache.ts`, `diagnosticScheduler.ts`) — análisis por documento, caché en memoria por versión y coordinación básica de diagnósticos.
- **Features LSP:** `src/server/features/*` (`documentSymbols.ts`, `hover.ts`, `diagnostics.ts`).
- **Tipos del servidor:** `src/server/model/types.ts`.
- **Utilidades del servidor:** `src/server/utils/helpers.ts`.
- **Tipos compartidos:** `src/shared/types.ts`.
- **Gramáticas y configuración:** `syntaxes/*` y `language-configuration.json.`.
- **Tests:** carpeta `test/` con pruebas en TypeScript (no integradas en `package.json`).
- **Specs y documentación::** `docs/`, `specs/`, `AGENTS.md`, `README.md`.

Esto confirma que la arquitectura objetivo está correctamente encaminada, pero que las áreas de `index/`, `semantic/`, `cache/` y `performance/` siguen siendo objetivos evolutivos y todavía no existen como módulos propios consolidados.

La capa `analysis/` representa actualmente una solución de bootstrap útil y razonable.
A medio plazo, parte de su responsabilidad deberá redistribuirse hacia parseo formal, binder, resolver, índice global y servicios semánticos compartidos.

## 12. Criterios para siguientes fases

Las siguientes fases del proyecto deben seguir este orden lógico:

1. corregir y consolidar activación, manifiesto y flujo básico,
2. normalizar tests y validación,
3. endurecer caché e invalidación,
4. reforzar parseo y análisis documental,
5. introducir modelo de símbolos y scopes,
6. construir índice global incremental,
7. añadir navegación semántica fuerte,
8. ampliar diagnósticos y productividad avanzada,
9. optimizar rendimiento sobre corpus grandes y legacy.

No debe adelantarse semántica avanzada si antes no existe una base fiable de:

- activación,
- tests,
- análisis reusable,
- caché,
- y observabilidad mínima.

## 13. Regla de alineación documental

Toda decisión arquitectónica relevante debe reflejarse en la documentación canónica del repositorio.

Si durante la evolución del proyecto cambia cualquiera de estos elementos:

- estructura de módulos,
- responsabilidades de capas,
- políticas de caché,
- estrategia semántica,
- roadmap arquitectónico,

deberán actualizarse, como mínimo:

- `README.md`,
- `architecture.md`,
- `roadmap.md`,
- `backlog.md`,
- y cualquier otra nota técnica afectada.

La documentación no debe describir una arquitectura imaginaria como si ya existiera.

Debe distinguir siempre entre:

- estado actual implementado,
- dirección objetivo,
- y trabajo planificado.