# Tareas: Spec 003 — Descubrimiento de Workspace

## 1. Bloques de Implementación

### Abstracción de Sistema de Archivos (B001)

- [ ] **T1.** Crear `src/server/system/fileSystem.ts` definiendo las interfaces `FileStat` e `IFileSystem`.
- [ ] **T2.** Crear `NodeFileSystem` implementando `IFileSystem` usando APIs asíncronas de `node:fs/promises`.
- [ ] **T3.** Crear `src/server/system/uriUtils.ts` para conversión segura entre URI strings y file paths, normalizando las barras e ignorando sensibilidad de mayúsculas (Windows).

### Modelo y Lógica de Descubrimiento (B002)

- [ ] **T4.** Crear `src/server/workspace/workspaceState.ts` para mantener el registro de raíces y archivos conocidos (`Set<string>`).
- [ ] **T5.** Crear `src/server/workspace/discovery.ts` con la lógica de crawler recursivo asíncrono.
- [ ] **T6.** Implementar checks de cancelación (`token.isCancelled`) dentro del loop de crawler y ceder la ejecución (`setImmediate` o await timeout) periódicamente.

### Integración en el Servidor (B003)

- [ ] **T7.** Modificar `server.ts` para escuchar en `onInitialize`/`onInitialized` los `workspaceFolders`.
- [ ] **T8.** Configurar el crawler como un `BackgroundTask` en el `TaskScheduler` del servidor.
- [ ] **T9.** Publicar progreso de inicialización en el output de consola e instrumentarlo con `measureMsAsync`.

### Pruebas y Validación (B004)

- [ ] **T10.** Escribir `test/server/unit/workspace.test.ts` que simule un `IFileSystem` falso y valide el algoritmo del crawler (cancelación y listado correcto de archivos).
- [ ] **T11.** Actualizar o crear `test/server/performance/pfc-workspace.perf.test.ts` para medir el tiempo real del crawler sobre el corpus local de pruebas.
- [ ] **T12.** Documentar los resultados del performance base de descubrimiento.

## 2. Orden recomendado

```text
Bloque 1 — FileSystem Abstraction
  T1 → T2 → T3

Bloque 2 — Core de Descubrimiento
  T4 → T5 → T6

Bloque 3 — Integración
  T7 → T8 → T9

Bloque 4 — Tests
  T10 → T11 → T12
```
