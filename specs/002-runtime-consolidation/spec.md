# [002] Consolidación del runtime y observabilidad base

## 1. Resumen

Consolidar la base operativa del plugin cerrando las piezas pendientes de medición, observabilidad, priorización del archivo activo y ciclo de vida del servidor, para que la Fase 1 quede formalmente cerrada y se pueda entrar con confianza a la Fase 2.

---

## 2. Problema

El plugin ya tiene un bootstrap funcional con Document Symbols, Hover y Diagnósticos que funcionan, pero carece de:

- **medición real** de tiempos de activación y rendimiento por operación,
- **observabilidad** del runtime (no hay forma de saber qué cuesta cada operación),
- **priorización formal** del archivo activo frente a trabajo futuro,
- **scheduler** con cancelación cooperativa para proteger el flujo interactivo,
- y **endurecimiento** del ciclo de vida del servidor (restart, fallos, reconexión).

Sin estas piezas, el plugin puede crecer en features pero sin saber si está degradando la experiencia. No se puede proteger lo que no se mide.

---

## 3. Objetivo

Al cerrar este slice, el plugin debe:

- medir de forma repetible el cold start, la activación y el tiempo hasta primer servicio,
- disponer de un scheduler mínimo con prioridades y cancelación cooperativa,
- garantizar que el archivo activo tiene prioridad real sobre cualquier trabajo futuro,
- exponer métricas básicas de rendimiento observables,
- soportar restart y escenarios de fallo del servidor de forma controlada,
- y tener tests que verifiquen los presupuestos de rendimiento definidos en `docs/performance-budget.md`.

---

## 4. Usuarios / actores

### 4.1 Desarrollador principal del plugin
Necesita saber cuánto cuesta cada operación y poder detectar regresiones antes de que lleguen al usuario final.

### 4.2 Desarrollador PowerBuilder (usuario final)
Necesita que el plugin no bloquee el editor y que el archivo que está editando tenga prioridad.

### 4.3 IA / agentes de desarrollo
Necesitan métricas observables para tomar decisiones informadas sobre rendimiento al proponer cambios.

---

## 5. Alcance

Este slice incluye:

- instrumentación de métricas de activación y operaciones clave,
- scheduler mínimo del servidor con prioridades y cancelación cooperativa,
- política formal de prioridad del archivo activo,
- endurecimiento del ciclo de vida del servidor (restart, error recovery),
- observabilidad mínima accesible (output channel / logs estructurados),
- performance tests que verifiquen presupuestos de `performance-budget.md`,
- y actualización de documentación afectada.

---

## 6. Fuera de alcance

Este slice **no** incluye:

- descubrimiento formal de workspace ni roots (será spec 003 o posterior),
- indexación global ni índice incremental,
- mejoras a las features funcionales existentes (Document Symbols, Hover, Diagnósticos),
- nuevas features LSP (definition, references, completion, etc.),
- caché persistente entre sesiones,
- knowledge pipeline ni backbone semántico,
- ni integración con tooling externo (PBAutoBuild, OrcaScript, IA).

---

## 7. Requisitos

- **R1.** El cliente debe medir y registrar el tiempo de activación.
- **R2.** El servidor debe medir y registrar el tiempo de inicialización y el tiempo hasta primer servicio.
- **R3.** Las operaciones LSP principales (Document Symbols, Hover, Diagnósticos) deben registrar su tiempo de ejecución.
- **R4.** El servidor debe tener un scheduler mínimo que proteja las operaciones interactivas de trabajo pesado futuro.
- **R5.** El archivo activo debe tener prioridad real y documentada en el scheduler.
- **R6.** El ciclo de vida del servidor debe soportar restart sin pérdida de estado visible para el usuario.
- **R7.** Las métricas deben ser accesibles vía output channel o logs estructurados.
- **R8.** Deben existir performance tests que verifiquen los presupuestos definidos en `docs/performance-budget.md`.

---

## 8. Criterios de aceptación

- **AC1.** El output channel del plugin muestra el tiempo de activación del cliente al arrancar.
- **AC2.** El servidor registra en log el tiempo de inicialización y el tiempo hasta estar listo para servir.
- **AC3.** Las operaciones Document Symbols, Hover y publishDiagnostics registran su tiempo de ejecución.
- **AC4.** Existe un scheduler mínimo que permite encolar trabajo y cancelar tareas pendientes.
- **AC5.** El scheduler garantiza que las peticiones del archivo activo se atienden antes que cualquier trabajo de fondo.
- **AC6.** El servidor puede ser reiniciado por el cliente sin dejar el editor en estado inconsistente.
- **AC7.** Existe al menos un performance test que mide cold start y lo compara con el presupuesto definido.
- **AC8.** La documentación afectada está actualizada (current-focus, backlog, testing.md).

---

## 9. Riesgos / dudas abiertas

- **Riesgo:** sobre-instrumentar el código con métricas puede añadir complejidad innecesaria. **Mitigación:** empezar con métricas mínimas y puntuales (timestamps en puntos clave), no un framework completo de telemetría.
- **Riesgo:** el scheduler puede ser prematuro si todavía no hay trabajo de fondo real que coordinar. **Mitigación:** diseñar el scheduler como infraestructura mínima que ya proteja el archivo activo, incluso si por ahora no hay trabajo de fondo; el coste es bajo y evita retrabajo futuro.
- **Duda:** ¿el scheduler debe vivir en `server/runtime/scheduler/` (arquitectura objetivo) o en `server/analysis/` (bootstrap actual)? **Recomendación:** crearlo directamente en `server/runtime/` para empezar a materializar la arquitectura objetivo sin refactorizar todo lo demás.
- **Duda:** ¿restart del servidor debe ser automático (watchdog) o solo manual (comando del usuario)? **Recomendación:** empezar con restart manual (comando) y documentar la posibilidad de automático como mejora futura.

---

## 10. Resultado esperado

Al cerrar este slice:

- el plugin tiene observabilidad mínima de sus operaciones clave,
- el scheduler protege el flujo interactivo,
- el archivo activo tiene prioridad formal,
- el ciclo de vida del servidor es más robusto,
- existen performance tests verificando presupuestos,
- y la Fase 1 del roadmap puede considerarse formalmente cerrada.
