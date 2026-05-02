# Spec 004: Incremental Knowledge Pipeline & Document Cache

**Estado:** cerrada históricamente y normalizada por B233.

**Nota histórica:** la base quedó implementada y luego evolucionó en múltiples specs del pipeline incremental; la carpeta original sólo conservaba `spec.md` y `tasks.md`.

## 1. Motivación y Contexto

Tras completar el descubrimiento de workspace (Spec 003), el servidor LSP sabe *dónde* están los archivos, pero sigue sin saber *qué contienen* hasta que el usuario los abre explícitamente.
Si el usuario hace un "Go to Definition" de una función global, el servidor hoy fallaría porque no existe un índice semántico residente en memoria.

Sin embargo, recorrer miles de archivos para parsearlos requiere una gestión de recursos impecable. Si parseamos todo sin un sistema de caché o invalidación riguroso, la experiencia del usuario se degradaría con picos de CPU continuos.
Además, la `constitution.md` dicta que las capacidades avanzadas no deben fingirse, sino basarse en una base semántica sólida.

Por lo tanto, la Spec 004 construye la **Caché Documental** y el **KnowledgeBase (KB)**, unificando la salida del parser en un modelo global agnóstico e incremental.

## 2. Objetivos de Diseño

1. **DocumentCache Riguroso**: Implementar un sistema que asigne un _fingerprint_ rápido a cada archivo para decidir si es necesario o no volver a parsearlo.
2. **KnowledgeBase Abstracto**: Crear un índice global en memoria (una especie de base de datos) para mapear:
   - Identificadores y símbolos exportados.
   - Referencias.
   - Relaciones de archivos/dependencias.
3. **Indexer Cooperativo**: Un planificador secundario que consuma los URIs descubiertos y los procese (leyendo de disco y cacheando) utilizando el `TaskScheduler` de la Spec 002.
4. **Resiliencia al Hot-Path**: La indexación jamás debe bloquear una petición interactiva (Hover, Symbols, Diagnósticos).

## 3. Arquitectura Propuesta

### 3.1. Knowledge Domain (`src/server/knowledge/types.ts`)

A diferencia del parser que escupe árboles concretos o "secciones", el `KnowledgeBase` solo entiende _Facts_ abstractos:
- `Entity` (Clase, Función, Variable, Evento).
- `Reference` (Uso de una entidad).
- `Relation` (Inherits from, Includes).

### 3.2. Caché Documental (`src/server/knowledge/DocumentCache.ts`)

Mantiene el estado validado de cada documento procesado.
```typescript
interface CacheEntry {
  version: number;
  hash: string;
  facts: Fact[];
  symbols: DocumentSymbol[];
}
```
Si el documento se modifica en memoria (LSP textSync), se actualiza su `version`.
Si el documento se lee de disco (durante indexación), se hashea su contenido.

### 3.3. KnowledgeBase (`src/server/knowledge/KnowledgeBase.ts`)

La interfaz principal para consultar conocimiento global:
```typescript
class KnowledgeBase {
  public upsertDocument(uri: string, facts: Fact[]): void;
  public removeDocument(uri: string): void;
  public findDefinition(symbolName: string): Entity | null;
  public findReferences(symbolName: string): Reference[];
}
```

### 3.4. Background Indexer (`src/server/indexer/workspaceIndexer.ts`)

Es un loop asíncrono que arranca tras el *Workspace Discovery*.
Toma los URIs almacenados en `WorkspaceState` y, uno por uno:
1. Comprueba si está en `DocumentCache`.
2. Si no, lee el disco (`IFileSystem`).
3. Calcula el Hash.
4. Llama a `analyzeDocument` (que generará `Facts`).
5. Guarda en `DocumentCache`.
6. Publica en `KnowledgeBase`.
7. `await yieldToEventLoop()` / checks `isCancelled`.

## 4. Presupuestos y Rendimiento

- **Indexación Fría (Cold Indexing):** 
  - Workspace pequeño: < 5s
  - Workspace mediano: < 15s
- **Indexación Caliente (Warm Indexing / Caché Hit):**
  - Instantáneo (se asume < 1s).
- **Consumo de Memoria:**
  - El índice de un workspace mediano no debe superar los 150 MB (conforme al `performance-budget.md`).

## 5. Riesgos

- **Bloqueos silenciosos**: Si el parseo individual de un archivo muy grande toma 500ms, el hilo se bloqueará medio segundo antes de chequear la cancelación. Se asume como tolerable en esta fase; si hay archivos anómalos, el parser mismo debería poder suspenderse internamente (a futuro).
- **Invalidación parcial**: Al actualizar un archivo, sus dependencias podrían quedar inconsistentes. Por ahora, nos limitamos al *Upsert* básico; en fases futuras se añadirá invalidación transitiva.
