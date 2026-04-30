Plugin profesional de **Visual Studio Code** para **PowerBuilder 2025** y **PowerScript**, diseñado para ser **ultra-rápido**, **mantenible** y **escalable** sobre proyectos grandes y código legacy (Workspace + Solution).

> Este repositorio desarrolla el **plugin**, no una aplicación PowerBuilder de negocio. Los archivos PowerBuilder presentes en fixtures o corpus se usan como **casos de validación y prueba**.

---

## Por qué este plugin

PowerBuilder sigue siendo un pilar en muchas organizaciones con bases de código extensas y legacy. Sin embargo, su ecosistema de herramientas modernas es limitado y los LLMs actuales carecen de conocimiento profundo del lenguaje.

Este plugin se construye con una visión clara:

- **Ultra-rápido**: cliente mínimo, servidor LSP separado, activación perezosa, análisis incremental y cancelable.
- **Proyectos grandes y legacy**: diseñado desde el inicio para escalar sobre workspaces reales con miles de objetos.
- **Profesional y mantenible**: arquitectura Clean/Hexagonal con core agnóstico del editor, separación fuerte de responsabilidades y documentación viva.
- **Preparado para IA**: el plugin construye un modelo semántico profundo de PowerBuilder que podrá exponer a agentes IA para que entiendan, naveguen y asistan sobre código PowerBuilder con precisión — algo que ningún LLM puede hacer por sí solo hoy.
- **Catálogo oficial del lenguaje**: el plugin mantiene un catálogo exhaustivo del lenguaje, objetos y runtime de PowerBuilder 2025 como activo estratégico propio.

---

## Documentación Técnica Destacada

Para una comprensión profunda del ecosistema PowerBuilder 2025 y la implementación del plugin:

- **[Guía Técnica PowerBuilder 2025](docs/powerbuilder-2025-vscode-plugin-technical-guide.md)**: El documento maestro sobre SR*, Workspace vs Solution, y estrategia de parsing.
- **[Arquitectura](docs/architecture.md)**: Detalle del servidor LSP, Scheduler de prioridades y sistema de Caché.
- **[Backlog Operativo](docs/backlog.md)**: Estado real del trabajo pendiente y prioridades P0-P5.

---

## Objetivo

Ofrecer la mejor experiencia posible para desarrollar en PowerBuilder dentro de VS Code:

- soporte declarativo completo del lenguaje;
- arquitectura **cliente VS Code + servidor LSP** profesional;
- evolución incremental hacia análisis semántico profundo y reutilizable;
- validación sobre corpus reales;
- y preparación estructural para que la IA pueda consumir conocimiento semántico del proyecto.

---

## Estado actual

### Implementado hoy

- contribución declarativa del lenguaje;
- `language-configuration.json`;
- gramática TextMate principal para PowerScript;
- gramática para bloques PowerBuilder en Markdown (syntax highlighting en docs `.md`);
- activación perezosa por contribución declarativa;
- estructura **cliente ligero + servidor LSP separado**;
- `Document Symbols` con extracción de variables, funciones, eventos y tipos;
- `Hover` básico con contexto por símbolo;
- diagnósticos estructurales con validación de bloques;
- análisis por documento con caché en memoria;
- scheduling de diagnósticos con debounce;
- **descubrimiento inicial de workspace y roots** (`.pbw`, `.pbt`, `.pbl`);
- **runtime consolidado** con observabilidad, métricas de rendimiento y `TaskScheduler`;
- **índice global incremental** (KnowledgeBase) con caché documental (DocumentCache);
- **navegación global exacta** (Go to Definition) considerando herencia y cualificadores;
- **ayuda de firmas (Signature Help)** con soporte para parámetros y llamadas anidadas;
- **completado contextual** (Completion) con scoring por ámbito (local/miembro/global);
- **diagnósticos semánticos** (SD2–SD6) con detección de funciones desconocidas en la jerarquía, tipos base inexistentes, locales/privadas no usadas y **shadowing** (local vs instance/shared/global);
- **gramática canónica centralizada** (`grammar.ts`) para consistencia léxica total;
- **tokens semánticos** (Semantic Tokens) para coloreado avanzado por rol y ámbito;
- **soporte inicial de Solution** (`.pbsln`, `.pbproj`) y **Workspace** (`.pbw`, `.pbt`).
- **discovery dual** Workspace + Solution con detección automática de modo (`workspace` / `solution` / `mixed`) y exclusión de `.pb`, `build`, `_BackupFiles`;
- **scheduler multinivel** con tres prioridades (`Interactive` / `Near` / `Background`);
- **barra de estado de progreso** con fases `descubriendo / indexando / parcial / listo` (configurable vía `vscPowerSyntax.progress.show`);
- **caché caliente del contexto activo** y **caché LRU de serving** para hover/completion/signatureHelp/definition;
- **topología real de workspace** (`.pbw/.pbt/.pbsln/.pbproj`) con project registry y library order;
- **visibility real** (public/protected/private) y **owner resolution** (`this`/`super`/variables tipadas);
- **InheritanceGraph robusto** con descendientes transitivos;
- **Find All References** (basado en KB + scan textual word-boundary, ignora comentarios y strings).

### Base técnica actual

- **Cliente:** `src/client/extension.ts`
- **Servidor:** `src/server/server.ts`
- **Runtime & Concurrencia:** `src/server/runtime/*`
- **Descubrimiento & FS:** `src/server/workspace/*`, `src/server/system/*`
- **Pipeline de Conocimiento:** `src/server/knowledge/*`, `src/server/indexer/*`
- **Parseo inicial:** `src/server/parsing/*`
- **Análisis documental:** `src/server/analysis/*`
- **Features LSP actuales:** `src/server/features/*`
- **Tipos compartidos:** `src/shared/types.ts`

### Aún no cerrado

Todavía no deben asumirse como implementadas o completas estas áreas:

- AST formal completo;
- `rename`;
- integración profunda de visibility/library order en completion/definition;
- política de caché con límite o evicción;
- flujo estándar de tests y CI completamente normalizado.

---

## Principios del proyecto

1. **Prioridad a la base** antes que a features avanzadas.
2. **Cliente ligero, servidor rico**.
3. **Corpus real antes que teoría**.
4. **Evolución incremental** y verificable.
5. **Documentación alineada** con el estado real del repositorio.

---

## Arquitectura

### Cliente VS Code

Responsable de:

- activación de la extensión;
- arranque del cliente LSP;
- configuración y coordinación ligera con el editor.

### Servidor LSP

Responsable de:

- parseo;
- análisis documental;
- diagnósticos;
- `hover`;
- `document symbols`;
- evolución futura hacia semántica, índice y navegación avanzada.

### Regla clave

La lógica costosa debe vivir en el servidor, no en el cliente.

---

## Estructura real del repositorio

```text
/src
  /client
    extension.ts
  /server
    server.ts
    /analysis        ← capa bootstrap (temporal, en migración)
    /features        ← handlers LSP
    /indexer         ← indexación de workspace
    /knowledge       ← KnowledgeBase, InheritanceGraph, SystemCatalog, SemanticQueryService
                       └─ /system    ← catálogo built-in PowerBuilder 2025
                          ├─ /manual      curado (categorías ES, español)
                          ├─ /generated   oficial autogenerado (Appeon)
                          ├─ /registry    slices dataset×domain
                          ├─ /services    queryService (resolutores por owner)
                          └─ /indexes     índices precomputados
    /model           ← tipos internos del dominio
    /parsing         ← matchers y secciones
    /runtime         ← scheduler, timing, cancellation
    /system          ← filesystem, hash, uriUtils
    /utils           ← helpers, invocationContext, wordAtPosition
    /workspace       ← discovery, workspaceState
  /shared
    types.ts

/syntaxes
/test
/docs
/specs
/tools
```

---

## Instalación y arranque

### Instalar dependencias

```bash
npm install
```

### Compilar

```bash
npm run compile
```

### Ejecutar en desarrollo

- abrir el repositorio en VS Code;
- pulsar `F5`.

---

## Validación mínima

Si hay cambios en TypeScript o runtime:

```bash
npm install
npm run compile
```

Y además:

- lanzar la extensión con `F5`;
- validar al menos un archivo PowerBuilder real o fixture.

Si hay cambios en gramáticas:

- revisar highlighting;
- validar patrones conflictivos conocidos;
- evitar regresiones visuales.

---

## Roadmap corto

1. ~~consolidar activación, manifest y flujo básico~~ ✅;
2. ~~normalizar tests y validación~~ ✅;
3. ~~endurecer caché e invalidación~~ ✅;
4. ~~reforzar parseo y análisis documental~~ ✅;
5. ~~introducir modelo de símbolos, scopes y catálogo~~ ✅;
6. ~~navegación profesional y valor visible temprano~~ ✅;
7. ~~diagnósticos semánticos y productividad base~~ ✅;
8. ~~semantic tokens, contexto posicional y scoring avanzado~~ ✅;
9. **Infraestructura de escala (P0): discovery dual, scheduler y caché de serving** (en curso);
10. resolución fuerte, topología y visibilidad (Fase 7A);
11. escala real y validación sobre corpus grandes (Fase 8);
12. especialización PowerBuilder (DataWindow, PBAutoBuild);
13. plataforma abierta y automatización IA.

---

## Política de documentación

Toda decisión técnica relevante debe reflejarse en la documentación canónica del repositorio.

Si cambia cualquiera de estos elementos:

- arquitectura;
- estructura del repo;
- estrategia semántica;
- políticas de caché;
- roadmap;
- comandos de build o validación;

deben actualizarse, como mínimo:

- `README.md`;
- `docs/**` afectados;
- `specs/**` afectados;
- y cualquier otra documentación canónica impactada.

La documentación debe distinguir siempre entre:

- **estado actual implementado**;
- **dirección objetivo**;
- **trabajo planificado**.

---

## Uso de IA

La IA debe actuar como asistente del **plugin**, no como asistente de una aplicación PowerBuilder de negocio.

Siempre debe:

- pensar en términos de **VS Code extension + LSP**;
- respetar la arquitectura del plugin;
- no inventar features no implementadas;
- actualizar la documentación afectada cuando proponga o implemente cambios.
