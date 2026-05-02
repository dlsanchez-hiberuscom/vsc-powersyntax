# Spec 003: Descubrimiento de Workspace

**Estado:** cerrada históricamente y normalizada por B233.

**Nota histórica:** esta base quedó implementada y más tarde reforzada por las specs `013`, `018`, `019` y `020`, pero la carpeta original no tenía `plan.md` mínimo.

## 1. Motivación y Contexto

Hasta la Spec 002, el servidor LSP de PowerSyntax operaba de forma aislada archivo por archivo (Single File Mode). Esto permitía validar la gramática y el rendimiento inicial, pero carecía de visión global.

Para que PowerBuilder 2025 soporte semántica avanzada (resolución de herencia, navegación *Go To Definition* cruzada entre archivos, análisis de dependencias), el Language Server necesita conocer la topología completa del proyecto. Esto implica identificar los "roots" del proyecto (típicamente archivos `.pbw` y `.pbt`), las librerías (`.pbl`) y descubrir todos los archivos de código fuente válidos dentro de esas estructuras.

El gran desafío es realizar este descubrimiento **sin bloquear el Extension Host**, respetando la latencia interactiva y sin devorar memoria ni ciclos de CPU innecesarios durante el arranque.

## 2. Objetivos de Diseño

1. **Desacoplamiento del FS:** El core del Language Server no debe invocar directamente librerías de Node (`node:fs`, `node:path`), sino operar a través de una interfaz abstracta (`IFileSystem`). Esto prepara el terreno para soportar entornos web (vscode.dev) y testabilidad.
2. **Descubrimiento Cooperativo:** El rastreo de miles de archivos se ejecutará como tarea en background usando el `TaskScheduler` de la Spec 002.
3. **Identificación de Estructura:** 
   - Detectar Workspaces (`.pbw`).
   - Detectar Targets (`.pbt`).
   - Ignorar explícitamente directorios de salida o sistema (`.git`, `node_modules`, `ws_objects` si se duplican, carpetas de compilación).
4. **Estado en Memoria:** Mantener un inventario ligero de los archivos encontrados y sus metadatos (URI, tipo, timestamp modificado) en `WorkspaceState`.

## 3. Arquitectura Propuesta

### 3.1. Abstracción del Sistema de Archivos

Se crea el contrato `IFileSystem` en `src/server/system/fileSystem.ts`:

```typescript
export interface FileStat {
  isFile: boolean;
  isDirectory: boolean;
  mtime: number;
  size: number;
}

export interface IFileSystem {
  stat(uri: string): Promise<FileStat | null>;
  readDirectory(uri: string): Promise<[string, FileStat][]>;
  readFile(uri: string): Promise<string>;
}
```

Se provee una implementación `NodeFileSystem` que usa `node:fs/promises`.

### 3.2. Modelo de Workspace

`src/server/workspace/workspaceState.ts` expondrá la entidad central que rastrea:
- Lista de carpetas raíz (enviadas por el LSP client).
- Lista de `ProjectRoots` (`.pbw`, `.pbt`).
- Inventario de todos los URIs relevantes descubiertos.

### 3.3. Algoritmo de Crawler (Discovery)

El descubrimiento se lanza durante el `onInitialized` del LSP:
1. Recibe los `workspaceFolders`.
2. Encola un `BackgroundTask` en el `TaskScheduler`.
3. El crawler recorre el FS usando `IFileSystem.readDirectory`.
4. Chequea tokens de cancelación (`CancellationToken.isCancelled`) frecuentemente (cada 10-50 archivos procesados o por directorio) para ceder control si el usuario edita un archivo.

## 4. Presupuestos y Rendimiento

Según el documento `docs/performance-budget.md`:
- **Workspace Pequeño (< 100 archivos):** < 1s
- **Workspace Mediano (100 - 500 archivos):** < 2s
- **Workspace Grande (500 - 5000 archivos):** < 5s

El crawler de la Spec 003 debe medir e informar estos tiempos en el output de performance. No indexará todavía el *contenido* de todos los archivos, solo descubrirá y registrará sus URIs, por lo que debería ser sustancialmente más rápido que estos límites.

## 5. Riesgos y Mitigaciones

- **Duplicidad de Código Fuente:** Los proyectos PB modernos exportados en texto pueden tener el código tanto en `ws_objects/` como en otras ubicaciones temporales. Necesitaremos un filtro inicial crudo para omitir `.git` y similares. Si se detectan duplicados reales, esto será competencia de la etapa de indexación (Spec 004).
- **Paths de Windows vs URIs:** PowerBuilder es exclusivo de Windows, pero las URIs de VS Code utilizan `/`. `uriUtils.ts` se asegurará de normalizar consistentemente y evitar errores en la traducción de paths.
