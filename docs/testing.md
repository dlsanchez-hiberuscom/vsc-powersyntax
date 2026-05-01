# Testing — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Definir cómo se valida el plugin y qué evidencia mínima debe existir antes de considerar estable un cambio.

Este documento no describe todos los tests posibles.
Define la **estrategia de validación** del proyecto y las reglas mínimas de calidad.

---

## 2. Objetivo de testing

La estrategia de testing debe proteger estas 4 cosas:

1. **corrección funcional**,
2. **no bloqueo del editor**,
3. **estabilidad del core semántico**,
4. **evolución segura del producto**.

El testing debe demostrar que el plugin sigue siendo:

- útil,
- rápido,
- no bloqueante,
- coherente,
- y estable en proyectos reales.

---

## 3. Principios de testing

### 3.1 Testear primero lo que más rompe el producto
Se prioriza siempre este orden:

1. archivo activo e interacción básica,
2. núcleo semántico compartido,
3. invalidación / incrementalidad,
4. persistencia / warm resume,
5. comportamiento global del workspace,
6. especialización PowerBuilder,
7. automatización externa.

### 3.2 No todo cambio necesita el mismo tipo de prueba
Cada cambio debe validar lo suficiente, pero no sobreactuar.

### 3.3 El test debe seguir la arquitectura
- las pruebas unitarias validan lógica pura,
- las integraciones validan contratos reales,
- las smoke validan arranque y wiring,
- las performance validan presupuestos y regresiones.

### 3.4 El rendimiento también se prueba
No basta con que funcione.
Debe seguir funcionando **sin bloquear** y dentro de presupuestos razonables.

### 3.5 Los corpus reales importan
Los fixtures pequeños no sustituyen la validación sobre proyectos grandes y legacy.

---

## 4. Tipos de prueba

## 4.1 Smoke tests
**Objetivo:** comprobar que la extensión arranca y no falla de forma catastrófica.

Deben cubrir como mínimo:
- activación básica,
- arranque cliente/servidor,
- apertura de archivo PowerBuilder,
- contribution points principales.

## 4.2 Unit tests
**Objetivo:** validar lógica aislada, pura y reutilizable.

Deben cubrir prioritariamente:
- parsing,
- snapshots,
- symbols/scopes,
- invalidación,
- scheduler/runtime,
- query engine,
- utilidades semánticas puras.

Regla:
- no depender de VS Code,
- no depender del transporte LSP,
- no depender del filesystem real salvo necesidad muy controlada,
- y en suites ejecutadas con `vscode-test` + `mocha.ui = tdd`, usar los globals `suite` y `test` en lugar de importar `suite/test` desde `mocha`.

## 4.3 Integration tests
**Objetivo:** validar el comportamiento real extremo a extremo.

Deben cubrir:
- Document Symbols,
- Hover,
- Definition,
- Completion,
- Signature Help,
- Diagnostics,
- invalidación visible,
- y features activas del LSP.

## 4.4 Performance tests
**Objetivo:** detectar regresiones de latencia, indexación, memoria o warm resume.

Deben medir:
- primer valor en archivo activo,
- discovery,
- cold indexing,
- warm indexing,
- análisis por documento,
- y consumo de memoria en escenarios representativos.

## 4.5 Golden / semantic tests
**Objetivo:** proteger el comportamiento semántico del motor.

Deben fijar resultados esperados para:
- hover,
- definition,
- references,
- rename eligibility,
- readiness,
- y reasoning semántico relevante.

---

## 5. Qué debe validarse según la fase del producto

### 5.1 Core interactivo
Siempre validar:
- que el archivo activo responde primero,
- que el background no bloquea,
- que el motor degrada con seguridad,
- y que el estado visible es coherente.

### 5.2 Incrementalidad e invalidación
Siempre validar:
- qué se invalida,
- qué se reutiliza,
- qué se recalcula,
- y que no se recompone más de lo necesario.

### 5.3 Persistencia
Siempre validar:
- cold vs warm,
- recuperación segura,
- versionado,
- y ausencia de corrupción visible.

### 5.4 Query engine / serving
Siempre validar:
- coherencia entre hover/completion/definition/references,
- evidencia o trazabilidad cuando aplique,
- y estabilidad del resultado bajo contexto parcial o presión.

### 5.5 Escala
Siempre validar:
- corpus reales,
- latencia bajo carga,
- memoria,
- y comportamiento en cambios masivos.

---

## 6. Fixtures y corpus

## 6.1 Fixtures
Los fixtures son casos pequeños, controlados y deterministas.

Deben:
- tener un propósito claro,
- cubrir casos comunes y edge cases,
- ser fáciles de leer,
- y documentarse cuando el caso no sea obvio.

## 6.2 Corpus reales
Los corpus sirven para validar:
- escala,
- rendimiento,
- robustez,
- y compatibilidad con código legacy.

No deben usarse como sustituto de fixtures unitarios.

El corpus prioritario debe incluir:
- PFC 2025 Solution,
- PFC 2025 Workspace,
- y proyectos legacy representativos cuando estén disponibles.

---

## 7. Reglas mínimas por tipo de cambio

### 7.1 Cambio en parsing o modelo documental
Mínimo:
- unit test del caso afectado,
- fixture asociado si aplica.

### 7.2 Cambio en knowledge / resolución / query engine
Mínimo:
- unit tests del componente,
- integration test de la feature afectada,
- y golden test si cambia comportamiento semántico visible.

### 7.3 Cambio en scheduler / invalidación / caché / runtime
Mínimo:
- unit tests,
- integración de comportamiento observable,
- y performance test si puede afectar latencia o background work.

### 7.4 Cambio en persistencia / warm resume
Mínimo:
- test de reapertura / resume,
- test de versión o invalidez,
- y medición cold vs warm.

### 7.5 Cambio en activación / bootstrap / wiring
Mínimo:
- smoke test.

---

## 8. Baseline vigente de validación

Tras las olas 133-172, el baseline mínimo del repositorio queda en:

- `npm run compile`
- `npm run test:unit`
- `npm test`

Evidencia reciente registrada:

- `npm run test:unit` → `324 passing`
- `npm test` → smoke `2 passing`, unit `324 passing`, integration `4 passing`

Notas operativas:

- `npm test` cubre smoke + unit + integration.
- `npm run test:performance` sigue siendo un carril específico y no forma parte del gate estándar diario.
- Cambios en runtime, indexador, invalidación, warm resume, serving compartido o persistencia deben pasar al menos por ese baseline antes de darse por estables.

### 7.6 Cambio en rendimiento
Mínimo:
- medición antes/después,
- y performance test o benchmark reproducible.

### 7.7 Cambio solo documental
No requiere test técnico, pero sí revisión de coherencia.

---

## 8. Evidencia mínima para cerrar trabajo

Una tarea no debe cerrarse si no deja evidencia razonable de validación.

La evidencia puede ser:
- test automatizado,
- test de integración,
- golden test,
- medición de rendimiento,
- validación manual guiada,
- o combinación de varias.

La evidencia debe ser proporcional al riesgo del cambio.

---

## 9. Rutas críticas que deben vigilarse siempre

### 9.1 Interactive path
Debe mantenerse estable en:
- hover,
- completion,
- definition,
- signature help,
- document symbols,
- diagnósticos del archivo activo.

### 9.2 Discovery / indexing path
Debe mantenerse estable en:
- discovery,
- indexación progresiva,
- prioridades del scheduler,
- readiness,
- y progreso observable.

### 9.3 Warm / resume path
Debe mantenerse estable en:
- reapertura,
- checkpoints,
- caché persistente,
- reuso de conocimiento.

### 9.4 Massive change path
Debe mantenerse estable en:
- git pull,
- cambio de rama,
- invalidaciones amplias,
- watchers,
- y cambios masivos en disco.

---

## 10. Comandos y ejecución

El proyecto debe ofrecer comandos claros para:

- compilar tests,
- ejecutar todos los tests,
- ejecutar smoke,
- ejecutar unit,
- ejecutar integration,
- ejecutar performance.

Flujo recomendado:

1. compilar proyecto,
2. compilar tests,
3. ejecutar el tipo de test relevante al cambio,
4. ejecutar la verificación global antes de cerrar trabajo importante.

---

## 11. Relación con otros documentos

Este documento debe alinearse con:

- `docs/constitution.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/current-focus.md`
- `docs/performance-budget.md`
- y las specs afectadas

Si cambia la estrategia de validación, debe reflejarse aquí.

---

## 12. Regla de mantenimiento

Este documento debe actualizarse cuando:

- cambien herramientas o runners,
- cambie la estructura de tests,
- aparezcan nuevos tipos de prueba,
- cambie el criterio de cierre,
- o se introduzcan nuevas rutas críticas del producto.

---

## 13. Regla final

El testing no existe para acumular tests.

Existe para asegurar que el plugin puede seguir creciendo sin romper:

- la experiencia del archivo activo,
- la estabilidad del motor,
- la calidad semántica,
- el rendimiento,
- ni la mantenibilidad del producto.
