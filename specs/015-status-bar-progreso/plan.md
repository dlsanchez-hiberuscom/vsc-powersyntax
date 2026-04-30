# Plan — 015 Status Bar Progreso (B133)

## 1. Tipos compartidos (`src/shared/types.ts`)

```ts
export const PROGRESS_NOTIFICATION = 'vscPowerSyntax/progress';

export type ProgressPhase =
  | 'discovering'
  | 'indexing'
  | 'partial'
  | 'ready'
  | 'idle';

export interface ProgressNotification {
  phase: ProgressPhase;
  current?: number;
  total?: number;
  message?: string;
}
```

## 2. Servidor

- En `server.ts`, helper `sendProgress(p: ProgressNotification)` que llama
  a `connection.sendNotification(PROGRESS_NOTIFICATION, p)`.
- Llamarlo:
  - `'discovering'` antes de `discoverWorkspace`.
  - `'indexing'` con `total = files.length` antes del bucle.
  - `'indexing'` con `current` cada 25 archivos.
  - `'ready'` al terminar; `'partial'` si fue cancelado.
  - `'idle'` si no hay archivos.
- Pasar `onProgress` callback a `indexWorkspace`.

## 3. Cliente

- Nuevo `StatusBarItem` en `extension.ts`.
- `client.onNotification(PROGRESS_NOTIFICATION, ...)` actualiza texto:
  - `discovering` → `$(sync~spin) PB: descubriendo`
  - `indexing` → `$(sync~spin) PB: indexando current/total`
  - `partial` → `$(warning) PB: parcial`
  - `ready` → `$(check) PB: listo (total)`
  - `idle` → ocultar
- Lectura de `vscode.workspace.getConfiguration('vscPowerSyntax').get('progress.show')`.
- Listener `onDidChangeConfiguration` para alternar visibilidad.

## 4. `package.json`

Añadir setting:
```json
"vscPowerSyntax.progress.show": {
  "type": "boolean",
  "default": true,
  "description": "Mostrar el indicador de progreso de indexación en la barra de estado."
}
```

## 5. Tests

- Unit test sobre `indexWorkspace` para verificar que `onProgress` recibe
  `start`, intermedios y `end`.
