# Wave 07 - DataWindow Submodel and Status Ownership Report

## Resultado

Wave 07 queda cerrada como slice incremental y no big-bang.

- Se introdujo un boundary minimo real para DataWindow en `src/server/semantic/submodels/datawindow/`.
- `Current Object Context` ya publica `DataWindow bindings` bounded por consumer con receipt propio.
- El ownership historico de los items 46/47/48 queda normalizado sin inventar cierres falsos.
- La deuda restante queda explicitamente en `PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01` y en la smoke suite amplia del repositorio.

---

## PHASE 0 - Baseline and dependency verification

### Baseline observado

- No existia `src/server/semantic/submodels/datawindow/`.
- `src/server/features/currentObjectContext.ts` consumia el collector bruto de bindings DataWindow y no publicaba un receipt especifico para esa seccion.
- `src/shared/publicApi.ts` no tenia `dataWindowBindingReceipt` en `ApiCurrentObjectContext`.
- `src/client/currentObjectContextPanel.ts` solo componia microcopy compacta para receipts ya existentes, pero no para bindings DataWindow.
- El ownership documental era contradictorio: `PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01` seguia `Open`, `PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01` aparecia `Done`, y los historicos SQL/native seguian `Open` pese a tener specs absorbentes ya cerradas.

### Dependencias verificadas

- Specs: `specs/PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01.md`, `specs/PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01.md`, `specs/PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01.md`.
- Owners documentales: `docs/backlog.md`, `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/semantic-design-assumptions.md`, `docs/testing.md`, `docs/performance-budget.md`, `docs/instant-semantic-indexing-target.md`.
- Consumers/runtime: `src/server/features/currentObjectContext.ts`, `src/client/currentObjectContextPanel.ts`, `src/shared/publicApi.ts`.
- Superficie DataWindow leida para el mapa de responsabilidades: `dataWindowModel`, `dataWindowBindingModel`, `dataWindowBindingProjection`, `dataWindowColumnAccess`, `dataWindowFastContext`, `dataWindowPropertyPaths`, `dataWindowServingAdapters`, `dataWindowSqlLineage`, `dataWindowSafeMode`, `dataWindowLegacySafeMode`.

### Baseline de validacion usado durante la ola

- Baseline focal previo del slice: `npx vscode-test --label unit --grep "(dataWindow|currentObjectContext)"` -> 33 passing.
- Tras introducir el wrapper bounded y el boundary minimo: `npm run build:test` verde y suites focales del slice en verde.

---

## PHASE 1 - DataWindow responsibility map

| Archivo | Responsabilidad actual | Consumers principales | Riesgo | Safe move candidate | Cobertura observable |
|---|---|---|---|---|---|
| `src/server/features/dataWindowModel.ts` | Parser canonico `.srd`; produce bands, columns, controls, expressions, retrieve args y SQL references. Objetivo futuro: modelo del submodelo, no adapter hot path. | binding model, fast context, property paths, legacy safe mode, SQL lineage | Alto | No, sin paridad extra | `unit/dataWindowModel`, `unit/dataWindowLegacySafeMode`, `unit/hover`, `unit/definition` |
| `src/server/features/dataWindowBindingModel.ts` | Collector bruto de bindings `DataObject` y helpers de owner types/targets. Objetivo futuro: engine interno del submodelo. | current object context, fast context, column access, property paths, SQL lineage, diagnostics | Medio/alto | Solo via facade/re-export | `unit/dataWindowFastContext`, `unit/currentObjectContext`, `unit/diagnostics`, `unit/definition`, `unit/hover` |
| `src/server/semantic/submodels/datawindow/bindingProjection.ts` | Wrapper bounded por consumer y receipt-driven para bindings DataWindow. Objetivo futuro: projection canonical read-only del submodelo. | current object context y futuros consumers read-only | Bajo | Si, ya movido | `unit/dataWindowBindingProjection`, `unit/currentObjectContext` |
| `src/server/features/dataWindowBindingProjection.ts` | Compat shim; re-export del wrapper movido al boundary nuevo. | imports legacy y tests de compatibilidad | Bajo | Si, retirar al final | `unit/dataWindowBindingProjection` |
| `src/server/features/dataWindowColumnAccess.ts` | Resuelve columnas DataWindow para hover/definition desde llamadas `GetItem*`/`SetItem*`. Objetivo futuro: helper de adapter o projection especifica, no parser global. | hover, definition | Medio | No todavia | `unit/definition`, `unit/hover` |
| `src/server/features/dataWindowFastContext.ts` | Materializa contexto advisory rapido con binding, columnas, computed fields, property paths, buffers y built-ins. Objetivo futuro: facade hot-path sobre el submodelo. | hover, completion, definition, signature help | Alto | No | `unit/dataWindowFastContext`, `unit/completion`, `unit/hover`, `unit/definition` |
| `src/server/features/dataWindowPropertyPaths.ts` | Inspeccion segura de `Describe`, `Modify`, `Object` y `GetChild`; completion/hover/definition de property paths. Objetivo futuro: helper seguro del submodelo o adapter especializado. | serving adapters, diagnostics, hover, completion, definition | Alto | No, todavia | `unit/completion`, `unit/hover`, `unit/definition`, `unit/diagnostics` |
| `src/server/features/dataWindowServingAdapters.ts` | Adapters LSP de hover/definition/completion/signature para DataWindow usando fast context, legacy safe mode y property paths. Objetivo futuro: adapter layer estable, fuera del submodelo interno. | hover, definition, completion, signature help | Alto | No | `unit/completion`, `unit/hover`, `unit/definition` |
| `src/server/features/dataWindowSqlLineage.ts` | SQL lineage advisory bajo demanda. Objetivo futuro: projection/reporting del submodelo SQL/DataWindow, no hot path. | current object context, reports tecnicos, lineage consumers | Medio | Si, mas adelante | `unit/dataWindowSqlLineage` |
| `src/server/features/dataWindowSafeMode.ts` | Resumen barato del modelo DataWindow. Objetivo futuro: helper puro del submodelo. | hover y views safe-mode | Bajo | Si | `unit/dataWindowSafeMode`, `unit/hover` |
| `src/server/features/dataWindowLegacySafeMode.ts` | Compat layer legacy para hover/definition/document symbols sobre `.srd`. Objetivo futuro: compatibilidad hasta demostrar paridad total. | hover, definition, document symbols sobre `.srd` | Alto | No | `unit/dataWindowLegacySafeMode`, `unit/hover`, `unit/definition` |

### Decision de ownership derivada

- El primer movimiento seguro era `bindingProjection`, no `dataWindowModel`, `fastContext` ni `propertyPaths`.
- `dataWindowServingAdapters` y `dataWindowLegacySafeMode` siguen siendo fronteras de alto riesgo y no debian moverse en Wave 07.
- `dataWindowSafeMode` y algunos helpers del binding model quedan como candidatos razonables para oleadas futuras, siempre con facade y re-export mientras existan imports legacy.

---

## PHASE 2 - DataWindow boundary and compatibility facade

### Boundary introducido

- Nuevo boundary canonico: `src/server/semantic/submodels/datawindow/index.ts`.
- Nueva implementacion real: `src/server/semantic/submodels/datawindow/bindingProjection.ts`.
- Compatibilidad mantenida: `src/server/features/dataWindowBindingProjection.ts` queda como re-export del path nuevo.

### Imports y consumo

- `src/server/features/currentObjectContext.ts` deja de importar el wrapper desde `features/` y pasa a consumir el boundary nuevo.
- No se cambiaron imports de `dataWindowModel`, `dataWindowFastContext`, `dataWindowPropertyPaths`, `dataWindowServingAdapters`, `dataWindowSqlLineage` ni `dataWindowLegacySafeMode`.

### Decision de compatibilidad

- No hubo move masivo.
- No se retiro ningun path legacy.
- El facade nuevo publica solo helpers/tipos de bajo riesgo y el wrapper bounded que ya tenia cobertura clara.

### Gaps pendientes

- El parser canonico, `fastContext`, `propertyPaths`, adapters LSP y compat legacy siguen viviendo en `src/server/features/`.
- El boundary todavia no es el owner unico de todo el submodelo; es un punto de entrada incremental y reversible.

---

## PHASE 3 - DataWindow caps and receipts

### Consumer actualizado

- `Current Object Context` ya no expone `DataWindow bindings` como lista raw sin contrato explicito.
- Ahora usa `collectDataObjectBindingsProjection(...)` y publica `dataWindowBindingReceipt` con envelope nested.

### Contrato publicado

- `ApiCurrentObjectContext` gana `dataWindowBindingReceipt?`.
- Se añaden `ApiDataWindowBindingConsumer` y `ApiDataWindowBindingReceipt` en la API publica.
- `PUBLIC_API_VERSION` sube a `2.27.0` como cambio aditivo.

### Politica actual

- Cap interactivo para `current-object-context`: 12 bindings.
- `unbounded` solo queda permitido para consumers de debug profundo.
- El panel cliente fusiona el estado de `dataWindowBindingReceipt.projection` con el de `embeddedSqlReceipt.projection` para no duplicar microcopy de estado.

### Consumers aun no convergidos

- `powerBuilderCodeMetrics`.
- Bundles IA/soporte que todavia no pidan una projection bounded especifica para DataWindow.
- Cualquier future surface read-only que quiera serializar bindings DataWindow fuera de `Current Object Context`.

### Cobertura

- `test/server/unit/dataWindowBindingProjection.test.ts` fija cap y modo unbounded de debug.
- `test/server/unit/currentObjectContext.test.ts` valida el receipt normal y el receipt truncado con fixture denso.

---

## PHASE 4 - Incremental module split

### Split realizado en Wave 07

- Movido: implementacion de `bindingProjection` al boundary `src/server/semantic/submodels/datawindow/`.
- Añadido: `index.ts` como facade minima del submodelo.
- Mantenido: re-export legacy en `src/server/features/dataWindowBindingProjection.ts`.
- Actualizado: import de `currentObjectContext.ts` al boundary nuevo.

### Lo que explicitamente no se movio

- `dataWindowModel.ts`.
- `dataWindowBindingModel.ts` salvo el wrapper bounded consumido por facade.
- `dataWindowColumnAccess.ts`.
- `dataWindowFastContext.ts`.
- `dataWindowPropertyPaths.ts`.
- `dataWindowServingAdapters.ts`.
- `dataWindowSqlLineage.ts`.
- `dataWindowSafeMode.ts`.
- `dataWindowLegacySafeMode.ts`.

### Razon de corte

- Era el slice mas pequeno que comprobaba el boundary con impacto real en producto.
- Evita mover hot paths o compat layers antes de tener paridad suficiente.
- Permite cerrar Wave 07 con evidencia ejecutable en un consumer read-only real, sin reescribir el submodelo entero.

---

## PHASE 5 - Historical submodel item status normalization

| Item historico | Estado nuevo | Owner ejecutable/canonico | Evidencia |
|---|---|---|---|
| `PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01` | `Open by conformance` | `PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01` | El boundary existe y un consumer real ya usa caps/receipts, pero parser/adapters/consumers restantes siguen parciales. |
| `PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01` | `Superseded` | `PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01` y `specs/PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01.md` | La spec funcional absorbente ya esta `Done` y el slice runtime bounded ya existe. |
| `PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01` | `Superseded` | `specs/PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01.md` | La spec funcional absorbente ya esta `Done`; no hay justificacion para tratar el historico como trabajo ejecutable independiente. |

---

## PHASE 6 - Submodel status ownership normalization

| Dominio | Owner actual | Estado | Trazabilidad historica |
|---|---|---|---|
| DataWindow | `PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01` | `Partial` | `PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01` queda `Open by conformance` |
| SQL / Transaction | `PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01` y `PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01.md` | runtime `Partial`, spec absorbente `Done` | `PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01` queda `Superseded` |
| Native / external | `PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01.md` | `Done` para el alcance declarado | `PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01` queda `Superseded` |

### Decision documental

- `docs/current-focus.md` fue revisado y se deja sin cambio porque sigue siendo owner del foco activo global del repositorio, no del estado historico de submodelos.
- `docs/roadmap.md` fue revisado y se deja sin cambio porque no era el owner factual de estos estados y no hubo nueva linea de roadmap independiente.
- `docs/done-log.md` se deja sin cambio porque Wave 07 no cierra todavia `PB-DW-P1` ni `PB-DOCS-P1` como `Done`.

---

## PHASE 7 - Documentation alignment

### Documentos actualizados

- `docs/backlog.md`: estados oficiales, historicos 46/47/48, item `PB-DW-P1`, item `PB-DOCS-P1`.
- `specs/PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01.md`: pasa a `Open by conformance` y se alinea con el owner ejecutable real.
- `docs/architecture-status.md`: refleja el boundary minimo DataWindow y el nuevo receipt de bindings en Current Object Context.
- `docs/architecture-implementation-map.md`: registra el boundary `src/server/semantic/submodels/datawindow/` y el compat shim.
- `docs/semantic-design-assumptions.md`: refleja el boundary nuevo y normaliza el ownership historico DataWindow/SQL/native.
- `docs/testing.md`: registra contract coverage del facade/re-export y de `dataWindowBindingReceipt`.
- `docs/performance-budget.md`: fija que las surfaces read-only con datos DataWindow deben usar caps/receipts por consumer.
- `docs/instant-semantic-indexing-target.md`: registra Wave 07 como primer boundary real y acotado del submodelo.

### Documentos revisados y dejados sin cambio

- `docs/current-focus.md`.
- `docs/roadmap.md`.
- `docs/done-log.md`.

Motivo: no eran el owner factual del estado que cambió o requeririan un cierre total que Wave 07 todavia no entrega.

---

## PHASE 8 - Validation

### Validaciones en verde

| Comando | Resultado |
|---|---|
| `npm run test:docs:drift` | Passed |
| `npm run build:test` | Passed |
| `npx vscode-test --label unit --grep "(dataWindow|currentObjectContext|diagnostic|completion|hover|definition)"` | 255 passing |
| `npm run test:architecture:rapid` | Passed; 0 violations |
| `npm run test:architecture:metrics` | Passed; hotspots 17, warnings 9, failing 0 |
| `npm run test:performance:gate` | Passed |

### Validacion amplia no verde

| Comando | Resultado | Clasificacion |
|---|---|---|
| `npm test` | Exit code 1 | No atribuido a Wave 07; requiere clasificacion por smoke suite amplia |
| `npm run test:smoke` | 13 passing, 17 failing | Falla amplia del harness/smoke lane; no reproduce una regresion focal del slice de Wave 07 |

### Suites fallidas en `npm run test:smoke`

- `smoke/support-bundle-extension`: timeout.
- `smoke/semantic-repro-pack-extension`: timeout.
- `smoke/lsp-guards-extension`: assert de `Document Symbols`.
- `smoke/health-report-extension`: assert de stats serializadas.
- `smoke/extension`: varios asserts y `Pending response rejected since connection got disposed` / `El cliente LSP no esta disponible`.
- `smoke/datawindow-b344-extension`: timeout.
- `smoke/code-actions-extension`: diagnostico esperado no aparece a tiempo.

### Razones para no atribuirlo a Wave 07

- La compilacion completa esta verde.
- Los tests unitarios focales del slice DataWindow/currentObjectContext estan verdes.
- La arquitectura, performance budget y docs drift estan verdes.
- Los fallos de smoke se concentran en timeouts, disposal del cliente LSP y asserts transversales de harness, no en una ruptura localizada del nuevo boundary o del receipt introducido.

---

## Cierre de Wave 07

Wave 07 queda cerrada con el siguiente estado real:

- Boundary minimo de DataWindow introducido y defendido por tests.
- Primer consumer read-only real (`Current Object Context`) convergido a caps/receipts DataWindow.
- Ownership historico 46/47/48 normalizado sin falsos `Done`.
- `PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01` y `PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01` quedan `Partial` con pendiente exacto explicitado.
- La smoke suite amplia permanece como deuda aparte del slice y no bloquea declarar cerrada la ola Wave 07.