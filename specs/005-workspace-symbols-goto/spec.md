# Spec 005: Workspace Symbols & Go to Definition

## 1. Motivación

Con la KnowledgeBase operativa y corregida (Spec 004 + parche D1-D3), el servidor ya conoce todas las entidades del workspace: funciones, tipos, variables y eventos, con su posición exacta. Sin embargo, ese conocimiento es invisible para el usuario.

Esta spec expone la KnowledgeBase al desarrollador a través de dos features LSP de alto impacto:

1. **Workspace Symbols** (`textDocument/workspaceSymbol`): Permite buscar cualquier símbolo del proyecto entero desde la barra de búsqueda de VS Code (`Ctrl+T`).
2. **Go to Definition** (`textDocument/definition`): Permite saltar a la definición de una función, tipo o variable con `F12` o `Ctrl+Click`.

Ambas features se alimentan directamente de la KnowledgeBase sin duplicar lógica de parseo.

## 2. Objetivos de Diseño

1. **Workspace Symbols**: Responder con las entidades indexadas filtrando por query. Latencia < 50ms incluso en workspaces grandes.
2. **Go to Definition**: Resolver el identificador bajo el cursor, buscarlo en la KB, y devolver su ubicación exacta (URI + línea + columna).
3. **Sin duplicación**: Ambas features consumen la KB como fuente de verdad. No parsean, no indexan, no cachean por su cuenta.

## 3. Arquitectura

### 3.1 Workspace Symbols (`src/server/features/workspaceSymbols.ts`)

```typescript
function provideWorkspaceSymbols(query: string, kb: KnowledgeBase): SymbolInformation[]
```

- Itera sobre las entidades de la KB.
- Filtra por `query` (substring match, case-insensitive).
- Convierte `Entity` a `SymbolInformation` (con ubicación: URI + posición).
- Limita resultados a un máximo razonable (e.g. 200).

### 3.2 Go to Definition (`src/server/features/definition.ts`)

```typescript
function provideDefinition(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase
): Location | Location[] | null
```

- Extrae la palabra bajo el cursor.
- Busca en la KB (`findAllDefinitions`).
- Si hay 1 resultado, devuelve `Location` directa.
- Si hay N resultados (overloading PB), devuelve `Location[]` para que VS Code muestre el Peek view.

### 3.3 Registro de capabilities (`server.ts`)

- Registrar `definitionProvider: true` en `InitializeResult.capabilities`.
- Registrar `workspaceSymbolProvider: true`.
- Añadir handlers `connection.onDefinition(...)` y `connection.onWorkspaceSymbol(...)`.

### 3.4 Método auxiliar: Word at Position

Necesitamos un helper para extraer el identificador PowerBuilder bajo el cursor:
```typescript
function getWordAtPosition(lines: string[], position: Position): string | null
```
PowerBuilder usa `[a-zA-Z_][a-zA-Z0-9_]*` como patrón de identificador.

## 4. Presupuestos

- **Workspace Symbols**: < 50ms para query sobre un workspace mediano.
- **Go to Definition**: < 10ms (es un lookup en Map).
- **Memoria**: Sin coste adicional (reutiliza la KB existente).

## 5. Riesgos

- **Precisión de Go to Definition**: Sin un binder/resolver de scopes, el match es por nombre global. Puede devolver falsos positivos si el usuario hace F12 sobre una variable local que comparte nombre con una función global. Esto es aceptable en esta fase; se refinará con el resolver de tipos (B016).
