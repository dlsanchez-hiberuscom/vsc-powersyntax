# [002] Plan técnico — Consolidación del runtime y observabilidad base

## 1. Resumen técnico

Este slice introduce instrumentación de rendimiento, un scheduler mínimo con prioridades y cancelación, endurecimiento del ciclo de vida del servidor y los primeros performance tests del proyecto.

El enfoque es **mínimo y pragmático**: no se construye un framework completo de observabilidad ni un scheduler avanzado, sino las piezas más pequeñas que permitan medir, priorizar y proteger el flujo interactivo.

---

## 2. Estado actual

### Ya existe

- cliente ligero en `src/client/extension.ts` con activación perezosa,
- servidor LSP en `src/server/server.ts` con handlers para Document Symbols, Hover y Diagnósticos,
- caché de análisis por documento en `src/server/analysis/analysisCache.ts`,
- scheduling de diagnósticos con debounce en `src/server/analysis/diagnosticScheduler.ts`,
- manejo básico de start/stop/errores en el cliente y servidor,
- y framework de tests configurado con `@vscode/test-cli` y Mocha.

### Falta

- instrumentación de tiempos de activación y operaciones,
- scheduler formal con prioridades y cancelación,
- política de prioridad del archivo activo,
- soporte de restart del servidor,
- observabilidad accesible vía output channel,
- y performance tests.

---

## 3. Diseño propuesto

### 3.1 Instrumentación de métricas (B003 + B007)

#### Servidor: `src/server/runtime/timing.ts` (NUEVO)

Utilidad ligera para medir operaciones:

```typescript
export function measureMs(label: string, fn: () => T): T;
export function measureMsAsync(label: string, fn: () => Promise<T>): Promise<T>;
```

Registra resultados vía `connection.console.log` con formato estructurado parseable.

#### Cliente: timestamps en `extension.ts`

Añadir `performance.now()` en:
- inicio de `activate()`,
- justo antes de `client.start()`,
- tras `client.start()` completado,
- y registrar los deltas en el output channel.

#### Servidor: timestamps en `server.ts`

Añadir timestamps en:
- `onInitialize` (inicio del servidor),
- `onInitialized` (servidor listo),
- primera invocación de cada handler (primer Document Symbols, primer Hover, primer Diagnóstico).

### 3.2 Scheduler mínimo (B005)

#### Ubicación: `src/server/runtime/scheduler.ts` (NUEVO)

Diseño mínimo con:

```typescript
interface ScheduledTask {
  id: string;
  priority: TaskPriority;
  execute: (token: CancellationToken) => Promise<void>;
}

enum TaskPriority {
  Interactive = 0,   // archivo activo, respuesta a usuario
  Background = 10,   // trabajo global diferido
}
```

Comportamiento:
- las tareas `Interactive` se ejecutan inmediatamente,
- las tareas `Background` esperan a que no haya tareas Interactive pendientes,
- toda tarea `Background` es cancelable,
- si llega una tarea `Interactive`, las `Background` en curso se cancelan si llevan más de un tiempo configurable.

#### Cancelación cooperativa: `src/server/runtime/cancellation.ts` (NUEVO)

```typescript
interface CancellationToken {
  readonly isCancelled: boolean;
  onCancelled(callback: () => void): void;
}

function createCancellationSource(): {
  token: CancellationToken;
  cancel: () => void;
};
```

### 3.3 Prioridad del archivo activo (B004)

Integrar en `server.ts`:
- rastrear el URI del documento activo (via `onDidOpen`, `onDidChangeContent`),
- cuando un handler recibe una petición, marcarla como `Interactive`,
- el scheduler prioriza automáticamente estas peticiones,
- y el debounce de diagnósticos existente se integra con el scheduler.

### 3.4 Ciclo de vida del servidor (B008)

#### Cliente: comando de restart

Registrar un comando `vscPowerSyntax.restartServer` que:
- detenga el cliente LSP,
- lo reinicie limpiamente,
- y registre el evento en el output channel.

#### Servidor: manejo de errores no fatales

- envolver los handlers en try/catch para que un error en un handler no tumbe el servidor,
- registrar errores en el log con suficiente contexto,
- y asegurar que el estado de la caché se limpia correctamente al cerrar.

### 3.5 Performance tests (B003 parcial + B010 parcial)

#### Ubicación: `test/server/` y `test/smoke/`

Tests mínimos:
- **smoke**: la extensión se activa en menos de 500ms (según performance-budget.md),
- **unit**: `measureMs` devuelve resultados correctos,
- **performance**: Document Symbols sobre un fixture pequeño completa en menos de 50ms,
- **performance**: análisis de documento sobre un fixture mediano completa en menos de 300ms.

---

## 4. Impacto en arquitectura

**Impacto positivo moderado.** Este slice empieza a materializar la capa `runtime/` definida en `architecture.md` (§6.3) sin reorganizar todo el servidor. Los nuevos archivos se crean directamente en `src/server/runtime/` para alinear con la dirección arquitectónica objetivo.

Archivos nuevos:
- `src/server/runtime/timing.ts`
- `src/server/runtime/scheduler.ts`
- `src/server/runtime/cancellation.ts`

Archivos modificados:
- `src/client/extension.ts` (timestamps + comando restart)
- `src/server/server.ts` (instrumentación + integración scheduler)
- `package.json` (comando restart)

---

## 5. Impacto en rendimiento

**Impacto mínimo.** La instrumentación con `performance.now()` tiene coste despreciable (< 0.01ms por medición). El scheduler añade una capa de indirección pero solo para tareas de fondo, no para el path interactivo.

El resultado neto debe ser **positivo** porque el scheduler protegerá el flujo interactivo de trabajo futuro de fondo.

---

## 6. Riesgos técnicos

- **Scheduler prematuro:** por ahora no hay trabajo de fondo real. **Mitigación:** implementar la interfaz mínima y conectar el debounce de diagnósticos existente como primera tarea schedulable; el coste es bajo.
- **Over-engineering de métricas:** añadir demasiada instrumentación. **Mitigación:** solo instrumentar los 5 puntos clave definidos en performance-budget.md §8.1.
- **Restart que pierde estado:** si el servidor tiene caché caliente, un restart la pierde. **Mitigación:** aceptable en esta fase; la caché persistente vendrá en fases posteriores.

---

## 7. Estrategia de validación

### 7.1 Tests automatizados

- smoke test: extensión se activa correctamente,
- unit test: `timing.ts` mide correctamente,
- unit test: `scheduler.ts` prioriza Interactive sobre Background,
- unit test: `cancellation.ts` cancela correctamente,
- performance test: Document Symbols bajo presupuesto,
- performance test: análisis de documento bajo presupuesto.

### 7.2 Validación manual

- abrir un archivo PB y verificar que el output channel muestra tiempos de activación,
- verificar que los handlers registran tiempos de ejecución,
- ejecutar el comando de restart y verificar que el servidor se reinicia limpiamente,
- abrir el Developer Tools (F12) y verificar que no hay errores en consola.

### 7.3 Validación de rendimiento

- comparar tiempos medidos con los presupuestos de `performance-budget.md`,
- verificar que la instrumentación no introduce regresión visible,
- documentar resultados de la primera medición como baseline.

---

## 8. Documentación a actualizar

- `docs/current-focus.md` — reflejar progreso de B003–B008,
- `docs/backlog.md` — marcar B003, B005, B007 como parciales o cerrados según resultado,
- `docs/testing.md` — confirmar que los tests creados cumplen las convenciones,
- `README.md` — mencionar observabilidad y comando restart si aplica,
- y specs/002 artifacts.

---

## 9. Criterio de cierre técnico

Este slice puede darse por cerrado cuando:

- existen mediciones repetibles de activación y operaciones clave,
- el scheduler prioriza el archivo activo,
- el servidor soporta restart controlado,
- existen performance tests que verifican los presupuestos,
- y la documentación afectada está actualizada.
