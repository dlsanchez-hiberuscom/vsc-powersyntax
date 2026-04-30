# Spec 015 — Barra de estado con progreso de indexación (B133)

## 1. Motivación

Hoy el servidor reporta progreso solo en logs. El usuario no tiene
señal visible sobre si el plugin está descubriendo archivos, indexando
o listo. En workspaces grandes se percibe como "colgado".

## 2. Alcance

- Definir notificación custom LSP `vscPowerSyntax/progress`:
  - `phase: 'discovering' | 'indexing' | 'partial' | 'ready' | 'idle'`
  - `current?: number`
  - `total?: number`
  - `message?: string`
- Emitir progreso desde:
  - inicio/fin de discovery,
  - inicio/cada N archivos/fin de `indexWorkspace`.
- Cliente: `StatusBarItem` que renderiza el estado.
- Setting `vscPowerSyntax.progress.show` (default `true`) para esconderlo.

### Fuera de alcance

- Bus de progreso para features individuales (hover/completion).
- Watch incremental (B125).

## 3. Criterios de aceptación

1. Tipo compartido `ProgressNotification` en `src/shared/types.ts`.
2. `indexWorkspace` acepta un callback `onProgress` y lo invoca al inicio,
   cada 25 archivos y al final.
3. Cliente registra y muestra el `StatusBarItem` cuando arranca.
4. El item se oculta si `vscPowerSyntax.progress.show === false`.
5. Tests unitarios para el callback de progreso.

## 4. Documentación afectada

- `package.json` (nueva configuración).
- `README.md` (mención del status bar).
- `docs/current-focus.md` y `docs/backlog.md` (B133 cerrada).
