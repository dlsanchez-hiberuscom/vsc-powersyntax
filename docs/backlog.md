# Backlog — Plugin PowerBuilder 2025 para VS Code (versión activa + mejoras de core)

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

**Objetivo de esta versión:**
- mantener el backlog **operativo y limpio**;
- conservar solo trabajo **abierto** o **cerrado parcialmente**;
- integrar **14 mejoras nuevas del core** como backlog real;
- recolocar prioridades para reforzar incrementalidad, persistencia, serving, validación y explicabilidad del motor.

---

## 1. Propósito

Este backlog define la **cola operativa activa** del plugin profesional de **PowerBuilder 2025 para VS Code**.

Debe servir para ejecutar trabajo en slices pequeños, priorizados, verificables y alineados con la arquitectura objetivo del producto.

Dirección técnica base del producto:
- **activación perezosa**,
- **cliente fino**,
- **servidor LSP separado**,
- **análisis pesado fuera del Extension Host**,
- **índice incremental**,
- **backbone semántico compartido**,
- **caché en varios niveles**,
- **respuesta interactiva rápida**.

Además, el backlog asume explícitamente que el plugin debe soportar **dos modos reales de proyecto** en PowerBuilder 2025:
- **Workspace** (`.pbw`, `.pbt`, `.pbl`, `ws_objects`),
- **Solution** (`.pbsln`, `.pbproj`, carpetas `*.pbl` con archivos `*.sr*`).

Ambos deben tratarse de forma distinta en discovery, indexación, topología, resolución y build.

---

## 2. Reglas de gestión del backlog

- El backlog operativo debe contener **trabajo pendiente real**, no mezcla de ideas vagas, histórico técnico y trabajo ya cerrado.
- Se prioriza primero la **base de PowerScript**, la **topología real de workspace/solution**, la **resolución fuerte** y la **escala** antes que DataWindow avanzado, automatización externa o IA.
- Se mantiene la referencia al `plugin_old` siempre que aporte valor como fuente de consulta, lógica portable, datasets curados o heurísticas probadas.
- No se porta nada del `plugin_old` por inercia: solo por resultado funcional y encaje con la arquitectura nueva.
- Toda entrada debe dejar claro: objetivo, alcance, criterio de salida, riesgos y, cuando proceda, referencia al `plugin_old`.
- Ninguna feature debe reconstruir semántica por su cuenta si puede apoyarse en el backbone común del plugin.
- Todo cambio semántico, estructural o relacionado con PowerBuilder 2025 debe reflejarse también en `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.
- El usuario debe poder entender el estado del sistema durante la indexación y percibir progreso real, no una caja negra.
- La estrategia de caché se considera una pieza central del producto, no una optimización secundaria.
- La percepción de profesionalidad depende de tres cosas: **arranque rápido**, **estado observable** y **features que respondan rápido**.

---

## 3. Criterios de priorización

Se prioriza siempre, en este orden:

1. **velocidad de carga y activación**,
2. **descubrimiento rápido no bloqueante e indexación progresiva**,
3. **topología real de workspace/solution**,
4. **resolución fuerte de PowerScript** (scopes, herencia, owner, visibilidad),
5. **caché reutilizable y serving rápido del conocimiento**,
6. **hardening del parser/lexer**,
7. **productividad avanzada segura** (`references`, `rename`, `CodeLens`, acciones),
8. **escala, memoria y validación continua**,
9. **especialización PowerBuilder** (DataWindow, build, toolchain),
10. **automatización externa y API pública** sobre base ya madura.

---

## 4. Estado estratégico actual

El backlog se organiza partiendo de este estado de producto:

- Base cliente/servidor ya operativa.
- Activación perezosa y separación LSP ya asumidas como dirección correcta.
- Hay una base sólida ya entregada en discovery inicial, scheduler base, parser estructural SR*, topología workspace/solution, resolución base, visibilidad, herencia, masking, scoring inicial y wiring LSP fundamental.
- El foco pendiente inmediato ya no es “levantar la base”, sino **cerrar bien la incrementalidad**, **hacer observable el progreso**, **persistir conocimiento útil entre sesiones**, **unificar el motor de consultas** y **endurecer la validación real sobre corpus grandes**.
- **DataWindow no sube ahora de prioridad**: se mantiene en backlog, pero se aborda después de consolidar mejor la base de PowerScript, la persistencia de caché, la validación fuerte y la productividad segura.
- Se incorporan en esta versión **14 mejoras nuevas del core** orientadas a:
  - dependencias semánticas inversas,
  - indexación en dos fases,
  - snapshot semántico canónico,
  - query engine unificado,
  - semantic evidence,
  - invalidación explícita,
  - checkpoints/resume,
  - gobernador de latencia,
  - compactación de memoria,
  - modo degradado formal,
  - golden tests,
  - query result cache,
  - reconciliación parser/symbol/LSP,
  - work journal del motor.
- Además, **B141** sube de prioridad práctica: deja de tratarse como un item tardío del ecosistema y pasa a considerarse una pieza importante del core ampliado porque impacta discovery, fairness, status contextual, caché persistente y serving.

---

## 5. Estrategia oficial de caché

La estrategia de caché del plugin se divide en varios niveles.

### 5.1 Caché caliente en memoria
Orientada a la sesión actual y al serving interactivo.

Debe cubrir:
- documento activo,
- dependencias inmediatas,
- contexto posicional,
- hover,
- completion,
- signature help,
- definition,
- consultas frecuentes de alta repetición.

Esta caché **no necesita persistir** entre sesiones, pero debe ser extremadamente rápida y con invalidación fina.

### 5.2 Caché persistente por workspace/proyecto
Orientada a acelerar reaperturas, warm indexing y serving posterior.

Debe cubrir:
- fingerprints,
- estado de discovery,
- snapshots del índice,
- símbolos exportados,
- topología parseada,
- progreso parcial ya alcanzado,
- metadatos seguros reutilizables.

Esta caché **sí debe persistir entre sesiones**.

### 5.3 Caché de serving
Capa específica para responder rápido a features interactivas.

No basta con guardar archivos parseados; hace falta una capa orientada a:
- `hover`,
- `completion`,
- `signatureHelp`,
- `definition`,
- `references` cercanas,
- resolución de owners y tipos inmediatos.

### 5.4 Reglas de invalidación
Toda caché debe invalidarse con granularidad fina por:
- contenido del archivo,
- fingerprint,
- cambios estructurales,
- cambios en topología,
- cambios en herencia/visibilidad cuando afecten a resolución.

### 5.5 Regla de producto
La caché no es solo una optimización técnica; es parte del valor percibido del plugin:
- abrir un archivo debe sentirse rápido,
- repetir una consulta debe sentirse inmediato,
- reabrir el workspace no debe parecer un recomputado completo.

---

## 6. Estructura de prioridades activas

### P0 — Orquestación interactiva, incrementalidad y estado observable
Trabajo que reduce bloqueo visible, mejora el tiempo hasta valor y termina de endurecer el comportamiento interactivo del indexador.

### P3 — Query engine y productividad avanzada segura
Trabajo de valor visible apoyado ya en semántica fuerte: references, rename, CodeLens, formatter, hierarchy inspection, status contextual y serving semántico unificado.

### P4 — Escala, persistencia, validación continua y robustez interna
Trabajo de endurecimiento real sobre corpus grandes, memoria, caché persistente, tests de extensión, project model unificado e instrumentación profunda.

### P5 — Ecosistema PowerBuilder, build y automatización
Trabajo específico del ecosistema PowerBuilder: DataWindow, PBAutoBuild, ORCA legacy, API pública madura y automatización externa.

> **Nota:** P1 (topología real y resolución fuerte) y P2 (hardening parser/lexer) no tienen actualmente trabajo activo principal en esta versión, porque sus ítems operativos nucleares ya están cerrados. Parte de su evolución continúa ahora a través de P0, P3 y P4.

---

# 7. Backlog priorizado activo

## P0 — Orquestación interactiva, incrementalidad y estado observable

### B122. Priorización por dependencias semánticas cercanas
**Objetivo:** no indexar “por orden de disco”, sino por valor semántico inmediato.

**Descripción ampliada:**
Cuando se abre un archivo, el sistema debe priorizar:
1. el documento activo,
2. su cadena cercana de herencia,
3. owners y tipos usados en el archivo,
4. referencias y call targets probables,
5. el resto del proyecto,
6. el resto del workspace.

**Criterio de salida:**
- el orden de indexación refleja la utilidad real para el usuario,
- y mejora perceptiblemente el tiempo hasta valor en proyectos grandes.

---

### B123. Presupuestos de trabajo y yielding cooperativo
**Objetivo:** imponer time slices y yielding explícito para evitar monopolizar CPU.

**Descripción ampliada:**
- cada job de discovery/indexación se ejecuta por lotes limitados,
- el resto del trabajo se reprograma,
- y cualquier petición interactiva puede adelantarse sin esperar a que un batch largo termine.

**Criterio de salida:**
- no hay bursts largos de trabajo de fondo que degraden la interacción,
- y el uso de CPU del servidor queda repartido en slices pequeños.

---

### B124. Cancelación y preempción real de tareas de fondo
**Objetivo:** permitir que cualquier trabajo background se cancele o ceda ante una petición interactiva.

**Descripción ampliada:**
- background no debe bloquear hover/completion/definition,
- las colas bajas deben poder pausarse o cancelarse,
- y el scheduler debe retomar luego sin perder progreso útil.

**Criterio de salida:**
- cuando llega una petición interactiva, el servidor responde con prioridad real,
- y las tareas de fondo no comprometen la latencia percibida.

---

### B125. Indexación progresiva del workspace completo
**Objetivo:** indexar **todos** los archivos detectados, pero en segundo plano y con estado conocido.

**Descripción ampliada:**
Cada archivo relevante debe pasar por estados como:
- pendiente,
- descubierto,
- indexado parcial,
- indexado completo,
- invalidado.

La meta no es solo descubrir, sino **meter todo el workspace en el pipeline** sin penalizar el archivo activo.

**Criterio de salida:**
- el indexador conoce el estado de todos los archivos relevantes,
- y el sistema puede converger hacia “workspace listo” de forma progresiva.

---

### B126. Superficie de estado del indexador
**Objetivo:** exponer estado visible del motor para depuración y confianza operativa.

**Descripción ampliada:**
Mostrar, al menos:
- tamaño de colas,
- trabajo actual,
- documento activo priorizado,
- progreso aproximado,
- invalidaciones recientes,
- causas de cancelación,
- último archivo procesado.

**Criterio de salida:**
- el estado del indexador es observable,
- y sirve tanto para depurar como para entender la madurez del workspace en tiempo real.

---

### B134. Modelo de progreso y readiness del indexador
**Objetivo:** definir una métrica de progreso y readiness lo bastante estable como para alimentar barra de estado, logs, debugging y tests.

**Descripción ampliada:**
Debe separar al menos:
- `% de discovery`,
- `% de indexación total estimada`,
- readiness del contexto activo,
- readiness del proyecto actual,
- readiness global del workspace.

No hace falta que el porcentaje sea matemáticamente perfecto; debe ser **útil, estable y no engañoso**.

**Criterio de salida:**
- existe una fuente de verdad única para progreso y readiness,
- y la barra de estado no depende de heurísticas locales dispersas.

---

### B151. Semantic snapshot canónico por documento
**Objetivo:** introducir una unidad semántica estable y reutilizable por documento para que el resto del sistema consuma un snapshot único en lugar de recomponer información dispersa.

**Descripción ampliada:**
El snapshot debe agrupar como mínimo:
- fingerprint,
- container model,
- symbols,
- scopes,
- logical statements,
- stripped/masked text,
- control blocks,
- imports/dependencies,
- facts enriquecidos reutilizables,
- readiness y metadatos de serving.

**Specs sugeridas:**
- **Spec 133:** `buildSemanticSnapshot()`
- **Spec 134:** `snapshotFingerprintKey()`
- **Spec 135:** `snapshotDeltaMerge()`

**Criterio de salida:**
- hover/completion/definition/references dejan de reconstruir piezas por separado,
- el análisis documental tiene una representación canónica,
- y la invalidación puede operar sobre snapshots bien definidos.

---

### B152. Pipeline de indexación en dos fases reales
**Objetivo:** separar de forma explícita una fase rápida estructural y una fase enriquecida semántica para mejorar el tiempo hasta valor y la progresividad real del motor.

**Descripción ampliada:**
**Fase rápida:**
- discovery,
- parse estructural,
- contenedor SR*,
- símbolos exportados mínimos,
- topología básica,
- facts básicos.

**Fase enriquecida:**
- owner resolution,
- visibilidad real,
- herencia,
- tipos,
- evidence,
- datos de serving.

**Specs sugeridas:**
- **Spec 136:** `runStructuralIndexPass()`
- **Spec 137:** `runEnrichedSemanticPass()`
- **Spec 138:** `updateReadinessAfterPass()`

**Criterio de salida:**
- el sistema ofrece utilidad temprana sin esperar a enriquecimiento completo,
- readiness refleja correctamente qué fase está lista,
- y la indexación progresiva mejora perceptiblemente la UX.

---

### B153. Índice de dependencias semánticas inversas
**Objetivo:** introducir un grafo explícito de dependencias directas e inversas para invalidar y recomputar solo lo estrictamente necesario.

**Descripción ampliada:**
Debe modelar al menos:
- documento → tipos usados,
- documento → ancestros,
- documento → owners,
- documento → símbolos llamados,
- símbolo/tipo → documentos impactados.

**Specs sugeridas:**
- **Spec 139:** `extractSemanticDependencies()`
- **Spec 140:** `buildReverseDependencyGraph()`
- **Spec 141:** `getImpactedDocuments()`

**Criterio de salida:**
- cambios en firma/herencia/visibilidad invalidan de forma localizada,
- el motor deja de recomputar demasiado,
- y el resume/warm indexing pueden reaprovechar mejor el conocimiento existente.

---

### B154. Invalidation engine explícito
**Objetivo:** convertir la invalidación en una pieza explícita del core y no en una colección de reglas locales dispersas.

**Descripción ampliada:**
Debe clasificar cambios como mínimo en:
- texto local,
- firma,
- visibilidad,
- herencia,
- topología,
- proyecto,
- cambios masivos.

Y decidir:
- qué snapshots invalidar,
- qué caches limpiar,
- qué documentos recalcular,
- qué jobs reinyectar.

**Specs sugeridas:**
- **Spec 142:** `classifyChangeKind()`
- **Spec 143:** `buildInvalidationPlan()`
- **Spec 144:** `scheduleSelectiveReindex()`

**Criterio de salida:**
- la invalidación es consistente, fina y centralizada,
- baja la recomputación innecesaria,
- y mejora la corrección de serving y persistencia.

---

### B155. Checkpoints reales de indexación y resume robusto
**Objetivo:** persistir checkpoints del pipeline para que reaperturas y warm indexing no parezcan un recomputado desde cero.

**Descripción ampliada:**
Debe persistir al menos:
- discovery terminado,
- topología conocida,
- archivos estructuralmente parseados,
- archivos semánticamente enriquecidos,
- readiness por proyecto,
- cola reanudable o pendientes reinyectables.

**Specs sugeridas:**
- **Spec 145:** `persistIndexCheckpoint()`
- **Spec 146:** `restoreIndexerCheckpoint()`
- **Spec 147:** `resumePendingWork()`

**Criterio de salida:**
- reabrir workspaces grandes se siente claramente más rápido,
- el estado de progreso se recupera con estabilidad,
- y el motor sabe continuar donde lo dejó cuando sea seguro hacerlo.

---

### B158. Modo degradado formal (“partial semantic mode”)
**Objetivo:** definir contratos explícitos de disponibilidad semántica para que cada feature sepa qué puede prometer y cuándo debe degradar o bloquearse.

**Descripción ampliada:**
Niveles sugeridos:
- structural-only,
- nearby-semantic-ready,
- project-semantic-ready,
- workspace-semantic-ready.

**Specs sugeridas:**
- **Spec 154:** `defineSemanticReadinessLevels()`
- **Spec 155:** `gateFeatureByReadiness()`

**Criterio de salida:**
- rename/references no operan “a medias” sin contrato,
- el estado visible del sistema es coherente,
- y la UX mejora al distinguir claramente qué está listo y qué no.

---

### B159. Gobernador de latencia del servidor
**Objetivo:** imponer presupuestos y políticas de degradación para proteger la latencia interactiva real del usuario bajo carga.

**Descripción ampliada:**
Debe contemplar:
- presupuesto máximo por batch,
- presupuesto máximo por petición interactiva,
- yielding forzado,
- downgrade controlado cuando no haya suficiente contexto,
- preempción adaptativa según presión del sistema.

**Specs sugeridas:**
- **Spec 156:** `requestLatencyBudgetPolicy()`
- **Spec 157:** `applyOverloadDowngradePolicy()`
- **Spec 158:** `adaptivePreemptionController()`

**Criterio de salida:**
- la interacción del usuario mantiene latencia consistente,
- el servidor evita picos largos de bloqueo,
- y las colas de fondo se comportan con mayor justicia y control.

---

## P3 — Query engine y productividad avanzada segura

### B031. Referencias más precisas y robustas
**Objetivo:** ampliar cobertura de referencias cuando la base de resolución ya sea suficientemente fuerte.

---

### B032. Rename controlado
**Objetivo:** permitir rename solo en escenarios con suficiente fiabilidad semántica.

**Descripción ampliada:**
Fuera de esos escenarios, el sistema debe degradar con seguridad o bloquear la operación.

— **Cerrada parcialmente (spec 048: pre-flight de rename `validateRenameTarget`).**

---

### B036. Code actions básicas
**Objetivo:** añadir quick fixes pequeños y seguros basados en diagnósticos existentes.

— **Cerrada parcialmente (spec 049: quick-fix SD7 obsoleta → reemplazo).**

---

### B066. CodeLens de referencias y herencia
**Objetivo:** mostrar conteo de referencias y relación de override/herencia sobre funciones y eventos.

**Referencia `plugin_old`:** `pbPowerScriptCodeLens.ts`.

— **Cerrada parcialmente (spec 050: lens de referencias `provideReferenceCodeLenses`).**

---

### B065. Ancestor script navigation e hierarchy inspection
**Objetivo:** unir navegación al ancestro directo e inspección jerárquica del símbolo bajo cursor.

**Descripción ampliada:**
Debe permitir:
- saltar al ancestro inmediato,
- inspeccionar cadena de herencia,
- entender relaciones override/extend,
- y navegar con seguridad por scripts heredados.

**Referencia `plugin_old`:** `ancestorScriptService.ts`, servicios de hierarchy inspection.

— **Cerrada parcialmente (spec 059: `getAncestorChain`; spec 060: `buildHierarchyTree`).**

---

### B067. Formateador configurable
**Objetivo:** homogeneizar el estilo del código PowerBuilder de forma configurable, pero solo después de consolidar parsing/resolución.

---

### B107. Status bar con contexto de proyecto
**Objetivo:** reflejar target/proyecto activo, estado del indexador y accesos rápidos a mantenimiento.

**Descripción ampliada:**
Debe convivir con el progreso de indexación y mostrar, cuando proceda:
- nombre del proyecto o target preferido,
- estado del contexto activo,
- acceso a reinicio del servidor,
- acceso a comandos de limpieza o diagnóstico.

— **Cerrada parcialmente (spec 052: `formatProjectStatus`).**

---

### B156. Query engine unificado para features semánticas
**Objetivo:** centralizar la resolución de consultas semánticas para evitar lógica divergente entre hover, completion, definition, references y futuras features.

**Descripción ampliada:**
Debe proporcionar una capa común para consultas como:
- `resolveSymbolAtPosition`,
- `resolveOwnerChainAtPosition`,
- `resolveCallableAtPosition`,
- `resolveTypeAtPosition`,
- `findDefinitions`,
- `findReferences`,
- `buildCompletionContext`,
- `buildHoverContext`.

**Specs sugeridas:**
- **Spec 148:** `createSemanticQueryEngine()`
- **Spec 149:** `resolveSymbolAtPosition()`
- **Spec 150:** `buildUnifiedCompletionContext()`

**Criterio de salida:**
- las features semánticas consumen una capa común,
- baja la duplicidad y la divergencia entre resultados,
- y el core queda mejor preparado para API pública y tools.

---

### B157. Semantic evidence de primera clase
**Objetivo:** modelar formalmente las razones por las que una resolución ganó, no solo como trazas ad hoc sino como parte del contrato del motor.

**Descripción ampliada:**
La evidencia debe contemplar:
- scope ganador,
- visibilidad,
- inheritance distance,
- owner match,
- project affinity,
- library order,
- confidence score,
- descartes relevantes.

**Specs sugeridas:**
- **Spec 151:** `createSemanticEvidenceModel()`
- **Spec 152:** `computeSemanticConfidenceScore()`
- **Spec 153:** comando `whyThisResult`

**Criterio de salida:**
- hover/definition/completion pueden explicar por qué devuelven un resultado,
- mejora la depuración del motor,
- y el tuning de resolución se vuelve mucho más fiable.

---

### B160. Query result cache con claves semánticas estables
**Objetivo:** cachear respuestas semánticas útiles con claves seguras y estables para acelerar features interactivas sin comprometer corrección.

**Descripción ampliada:**
La clave debe contemplar como mínimo:
- URI normalizada,
- fingerprint,
- posición lógica,
- readiness actual,
- versión de topología,
- versión de catálogo/índice.

**Specs sugeridas:**
- **Spec 159:** `buildSemanticQueryCacheKey()`
- **Spec 160:** `wireSemanticQueryCacheInvalidation()`

**Criterio de salida:**
- hover/definition/completion/signature help cercanos responden más rápido,
- el hit ratio es observable,
- y la cache se invalida correctamente cuando cambian las precondiciones semánticas.

---

## P4 — Escala, persistencia, validación continua y robustez interna

### B030. Validación sobre workspace grande real
**Objetivo:** medir y validar el plugin sobre corpus grandes reales, no solo sobre fixtures sintéticos.

**Corpus prioritario:**
- PFC 2025 Solution,
- PFC 2025 Workspace,
- y corpus legacy internos representativos.

---

### B068. Calibración real del performance budget
**Objetivo:** contrastar budgets teóricos con métricas reales en entornos representativos.

---

### B069. Fixtures reales permanentes de PFC/legacy
**Objetivo:** incorporar fixtures permanentes y mantenidos para regresión continua.

---

### B070. Memory budgets de caché e índice
**Objetivo:** definir y verificar límites de memoria para índice, caché documental y snapshots.

---

### B071. Warm indexing y resume de caché persistente
**Objetivo:** evitar que cada reinicio implique un cold indexing completo.

**Descripción ampliada:**
Debe permitir reusar:
- descubrimiento ya hecho,
- fingerprints,
- snapshots de índice,
- estado parcial del workspace,
- y bases útiles para serving rápido al reabrir archivos.

---

### B071A. Caché persistente por workspace y por proyecto
**Objetivo:** separar mejor la persistencia de caché por workspace/proyecto para evitar recomputaciones innecesarias en repositorios grandes o multi-root.

**Descripción ampliada:**
Debe permitir:
- invalidación localizada,
- reutilización por proyecto,
- reapertura más rápida,
- mejor base para warm indexing.

---

### B071B. Caché de consultas frecuentes
**Objetivo:** persistir o reutilizar resultados de consultas de alto valor cuando sea seguro hacerlo.

**Descripción ampliada:**
Pensado para:
- hover frecuente,
- completado en archivos ya abiertos,
- signature help,
- definition cercana,
- información de tipos y owners inmediatos.

**Criterio de salida:**
- reabrir archivos y volver a consultar símbolos comunes se siente más ágil,
- sin comprometer corrección por invalidación deficiente.

---

### B063. Diagnostics snapshot agrupado
**Objetivo:** agrupar y servir diagnósticos por proyecto/objeto con snapshots más profesionales.

— **Cerrada parcialmente (spec 053: `buildDiagnosticsSnapshot`).**

---

### B118. Integration test matrix del plugin
**Objetivo:** añadir tests de extensión explícitos para lifecycle real del plugin.

**Debe cubrir:**
- smoke activation,
- arranque cliente/servidor,
- apertura de workspace Solution,
- apertura de workspace Workspace,
- tests sobre `--disable-extensions`,
- tests con `@vscode/test-cli` y `@vscode/test-electron`.

---

### B119. Performance regression suite de extensión
**Objetivo:** medir regresiones en activación, primer hover, primer diagnostics, discovery e index warm/cold.

---

### B141. Library graph / project model unificado — **Promovida desde P5**
**Objetivo:** disponer de un modelo único `pbProjectModel + pbLibraryGraph` que represente targets, librerías y dependencias para alimentar discovery, fairness, project affinity, status contextual, caché persistente e invalidación.

**Referencia `plugin_old`:** `powerbuilder/projecting/*`.

**Descripción ampliada:**
Este item deja de tratarse como una mejora tardía del ecosistema y pasa a considerarse una pieza del core ampliado porque impacta:
- project affinity,
- fairness por root/proyecto,
- status bar contextual,
- persistencia de caché por proyecto,
- resolución y serving por topología efectiva.

**Criterio de salida:**
- existe una única fuente de verdad para proyecto/librería,
- la topología enriquecida se reutiliza en scheduler, cache e invalidación,
- y se reduce la lógica dispersa de afinidad y pertenencia.

---

### B161. Golden tests semánticos end-to-end
**Objetivo:** introducir tests dorados de comportamiento semántico sobre fixtures reales y casos representativos para proteger el motor frente a regresiones complejas.

**Descripción ampliada:**
Debe cubrir, como mínimo:
- hover esperado,
- definition esperada,
- references esperadas,
- rename eligibility,
- readiness/progress observables,
- casos reales de PFC y corpus legacy.

**Specs sugeridas:**
- **Spec 161:** `goldenFixturesPfc()`
- **Spec 162:** `semanticGoldensHoverDefinitionReferences()`
- **Spec 163:** `renameEligibilityGoldens()`

**Criterio de salida:**
- el core tiene contratos de comportamiento visibles,
- refactors profundos detectan roturas semánticas reales,
- y la confianza para endurecer el motor aumenta.

---

### B162. Reconciliación fuerte entre parser, symbol model y salida LSP
**Objetivo:** detectar inconsistencias internas entre análisis, modelo semántico y artefactos publicados por el servidor antes de que se conviertan en bugs de usuario.

**Descripción ampliada:**
Debe detectar, como mínimo:
- símbolos sin rango válido,
- scopes incoherentes,
- callables exportados sin owner esperado,
- árboles de document symbols inconsistentes,
- results de references/definition apuntando a entidades degradadas.

**Specs sugeridas:**
- **Spec 164:** `runSemanticConsistencyAssertions()`
- **Spec 165:** `reportInternalSemanticInconsistencies()`

**Criterio de salida:**
- el core detecta incoherencias internas antes de publicarlas,
- la robustez del servidor sube,
- y depurar regresiones semánticas complejas es más rápido.

---

### B163. Semantic work journal / event log del motor
**Objetivo:** crear un journal técnico ligero del motor para entender qué pasó, en qué orden, por qué una consulta fue lenta y qué cache hit/miss o invalidación ocurrió.

**Descripción ampliada:**
Debe registrar al menos:
- archivo procesado,
- fase del pipeline,
- cache hit/miss,
- invalidación aplicada,
- job reprogramado,
- latencia relevante,
- readiness transicionada.

**Specs sugeridas:**
- **Spec 166:** `appendSemanticWorkEvent()`
- **Spec 167:** `exportSemanticWorkJournal()`

**Criterio de salida:**
- existe trazabilidad real del trabajo del motor,
- tuning y debugging en corpus grandes mejoran claramente,
- y el equipo puede comparar mejor cold/warm y cambios de estrategia.

---

### B164. Interning y compactación de memoria para strings y keys
**Objetivo:** reducir presión de memoria y coste de comparación en workspaces grandes internando valores repetidos y compactando identificadores internos.

**Descripción ampliada:**
Candidatos claros:
- nombres de símbolos,
- URIs normalizadas,
- contenedores,
- tipos,
- modifiers/access,
- ids internas,
- project ids.

**Specs sugeridas:**
- **Spec 168:** `createStringInternPools()`
- **Spec 169:** `compactSemanticIds()`
- **Spec 170:** `memoryInterningStats()`

**Criterio de salida:**
- la densidad del índice mejora,
- los budgets de memoria son más sostenibles,
- y el core aguanta mejor workspaces y solutions grandes.

---

## P5 — Ecosistema PowerBuilder, build y automatización

### B117. DataWindow safe mode mínimo
**Objetivo:** introducir soporte seguro mínimo de `.srd` sin abordar todavía toda la complejidad de DataWindow.

**Descripción ampliada:**
Debe permitir:
- detectar DataWindows,
- extraer SQL base,
- retrieve args,
- columnas,
- bandas principales,
- metadata suficiente para hover/navegación básica y reducción de falsos positivos.

**Nota de prioridad:** este item se mantiene deliberadamente **después** de consolidar una base fuerte de PowerScript.

---

### B041. Catálogo y navegación de DataWindow
**Objetivo:** tratar DataWindow/DataStore como entidades semánticas de primer nivel dentro del índice del plugin.

---

### B042. Soporte avanzado de DataWindow
**Objetivo:** ampliar a expresiones, funciones, propiedades avanzadas, `dw.Object` y relaciones con DataStore.

**Referencia `plugin_old`:** `datawindow/` y cualquier lógica previa útil.

---

### B081. Inteligencia de DataWindow y acceso a `.Object`
**Objetivo:** cubrir navegación y validación sobre `dw_1.Object` una vez exista base suficiente de DataWindow.

---

### B043. Integración con PBAutoBuild
**Objetivo:** integrar el backend moderno oficial de build/automatización de PowerBuilder.

**Descripción ampliada:**
- lanzar builds,
- validar entorno,
- capturar errores de compilación,
- y alimentar el estado de salud del workspace.

---

### B083. Integración avanzada con PBAutoBuild
**Objetivo:** enriquecer la integración hasta Problems panel, reporting y validación de precondiciones.

**Referencia `plugin_old`:** `pbAutoBuildService.ts` si sigue aportando consulta útil.

---

### B044. Estado de build y salud del workspace
**Objetivo:** detectar precondiciones, errores de configuración y readiness de compilación.

---

### B048. Integración con OrcaScript / ORCA
**Objetivo:** añadir compatibilidad con automatización avanzada o legacy del ecosistema clásico.

**Nota de prioridad:** debe venir **después** de PBAutoBuild en el camino moderno del producto.

---

### B045. Auditoría de arquitectura y convenciones
**Objetivo:** explotar el conocimiento semántico maduro para revisar consistencia técnica, convenciones y salud del proyecto.

---

### B109. API pública para integración (Extension Provider)
**Objetivo:** exponer una API para que otras extensiones o herramientas consuman capacidades semánticas del plugin.

**Referencia `plugin_old`:** `publicApi.ts`.

— **Cerrada parcialmente (spec 054: superficie inicial `shared/publicApi`).**

---

### B110. Exportación de superficie de automatización
**Objetivo:** generar manifiestos del workspace en JSON/YAML para CI, auditoría o agentes externos.

---

### B111. Árbol global de diagnósticos exportable
**Objetivo:** exportar problemas del proyecto en formato jerárquico procesable por máquinas.

---

### B132. Gobernanza del catálogo oficial + dataset curado
**Objetivo:** separar formalmente dos capas de conocimiento:
- catálogo oficial PowerBuilder,
- dataset curado heredado del `plugin_old`.

**Descripción ampliada:**
Debe permitir trazabilidad, validación, versionado y explotación clara de ambos sin mezclarlos de forma opaca.

— **Cerrada parcialmente (spec 046: reporte de consistencia con domain/dataset counts).**

---

### B135. Document model con logical lines y statements
**Objetivo:** introducir un modelo documental con:
- líneas lógicas (que respetan continuaciones `&`),
- statements segmentados,
- y mapping bidireccional posición ↔ statement offset.

**Por qué:** habilita parsing/diagnostics/completion sobre statements completos, no líneas físicas, evitando falsos positivos en código con continuaciones.

**Referencia `plugin_old`:** `powerScriptDocumentModel.ts`, `mapPositionToStatementOffset`, `getStatementAtPositionFromModel`.

— **Cerrada parcialmente (spec 056: `buildDocumentModel` con statements/sections/container).**

---

### B136. Query precision evidence (trazabilidad de resoluciones)
**Objetivo:** exponer, para hover/definition/completion, el conjunto de **razones** y **evidencia** que llevaron a un resultado:
- qué scope ganó,
- qué visibilidad permitió el match,
- qué library order priorizó,
- qué inheritance distance se usó.

**Por qué:** facilita debugging del motor en proyectos grandes y permite comandos del tipo "Why this result?".

**Referencia `plugin_old`:** `queryPrecision.ts`, `buildSemanticQueryReasons`, `buildSemanticEvidence`.

— **Cerrada parcialmente (spec 057: `withTrace` + `recordTraceStep`).**

---

### B137. Hierarchy explorer view
**Objetivo:** un comando/vista que muestre la jerarquía completa (ancestros + descendientes) del tipo bajo cursor con miembros heredados/overridden.

**Por qué:** es una de las features más útiles del IDE original; sirve como navegador semántico.

**Referencia `plugin_old`:** `powerbuilder/hierarchy/`.

— **Cerrada parcialmente (spec 060: `buildHierarchyTree` data API).**

---

### B139. DataWindow safe-mode (mejora futura desde plugin_old)
**Objetivo:** retomar la lógica de `pbDataWindowParser.ts`, `pbDataWindowDefinition.ts`, `pbDataWindowHover.ts` para hover/definition seguros sobre `.srd`, sin abrir todavía la superficie completa de DataWindow.

**Referencia `plugin_old`:** `powerbuilder/datawindow/*`.

---

### B140. Language Model Tools (Copilot Chat tools API)
**Objetivo:** exponer comandos del plugin como tools consumibles por Copilot Chat (semantic target/batch). Reaprovechar el contrato y los schemas ya diseñados.

**Referencia `plugin_old`:** `powerbuilder/contracts/languageModelTools.ts`, `publicApiContract.ts`.

---

### B142. Auto-build service y build target utils
**Objetivo:** integrar build target detection y auto-build (out-of-process) tras consolidar topología.

**Referencia `plugin_old`:** `powerbuilder/build/*`.

---

## 8. Impacto recomendado en el roadmap

### Ajustes recomendados al roadmap

#### Fase 7A — Core incremental y persistencia fuerte
Añadir explícitamente:
- semantic snapshot canónico por documento,
- indexación en dos fases,
- dependencias semánticas inversas,
- invalidation engine,
- checkpoints/resume,
- modo degradado formal.

#### Fase 8A — Serving y query engine profesional
Añadir explícitamente:
- query engine unificado,
- semantic evidence de primera clase,
- query result cache,
- gobernador de latencia del servidor,
- status y progreso alimentados por contratos de readiness estables.

#### Fase 9A — Escala y robustez interna
Añadir explícitamente:
- project model/librería unificado (B141 promovida),
- golden tests semánticos end-to-end,
- reconciliación parser/symbol/LSP,
- work journal del motor,
- interning y compactación de memoria,
- validación sobre corpus grandes reales,
- performance regression suite.

#### Fase 10A — Especialización PowerBuilder y automatización
Añadir explícitamente:
- DataWindow safe mode,
- build integration moderna con PBAutoBuild,
- evolución de API pública,
- herramientas de automatización externa sobre base madura.

### Regla estratégica que conviene dejar escrita en el roadmap
El producto debe perseguir dos objetivos simultáneos y no negociables:
1. **velocidad de carga**,
2. **utilidad profesional real**.

Eso implica que no basta con implementar semántica fuerte; también hay que conseguir que:
- abrir VS Code no cueste,
- abrir un archivo se sienta ágil,
- el usuario vea progreso,
- repetir consultas se sienta rápido gracias a la caché,
- las features visibles descansen sobre una base semántica fiable,
- y el motor sea explicable, medible y reanudable.

---

## 9. Ítems que se mantienen deliberadamente más abajo

Estos ítems no desaparecen, pero **no suben** hasta consolidar antes una base fuerte de PowerScript, persistencia de caché, validación real y productividad segura:

- DataWindow avanzado (`B042`, `B081`),
- auditoría avanzada y refactorizaciones complejas,
- API pública / automatización externa profunda,
- integraciones legacy más profundas con ORCA antes de cerrar el camino moderno con PBAutoBuild.

---

## 10. Slices recomendados de ejecución inmediata

### Slice A — Cierre real del comportamiento interactivo de P0
- B122
- B123
- B124
- B125
- B126
- B134
- B151
- B152
- B153
- B154
- B155
- B158
- B159

### Slice B — Query engine y serving semántico
- B156
- B157
- B160
- B031
- B032
- B036
- B066
- B065
- B107

### Slice C — Escala, persistencia y validación fuerte
- B030
- B068
- B069
- B070
- B071
- B071A
- B071B
- B063
- B118
- B119
- B141
- B161
- B162
- B163
- B164

### Slice D — Ecosistema PowerBuilder y automatización posterior
- B117
- B041
- B042
- B081
- B043
- B083
- B044
- B048
- B045
- B109
- B110
- B111
- B132
- B135
- B136
- B137
- B139
- B140
- B142

---

## 11. Regla de cierre

Un item del backlog solo puede cerrarse si:

- existe implementación real,
- pasa validación suficiente,
- la documentación afectada está actualizada,
- el estado del roadmap/current-focus está alineado,
- y no deja deuda crítica oculta sin registrar.

---

## 12. Resumen operativo

La prioridad inmediata del producto ya no debería ser “más features visibles”, sino:

1. **descubrir e indexar rápido sin bloquear**,
2. **hacer visible el progreso real del indexador al usuario**,
3. **terminar de endurecer la preempción, yielding, incrementalidad e invalidación del motor**,
4. **hacer del semantic snapshot y del resume persistente capacidades reales de producto**,
5. **unificar el query engine y el serving semántico**,
6. **medir el comportamiento real sobre corpus grandes y blindar regresiones**,
7. **y después subir DataWindow safe mode, build moderno y automatización externa madura**.

**DataWindow se mantiene, pero no se acelera** hasta que la base de PowerScript, la persistencia de caché, el query engine y la validación del plugin sean claramente más fuertes.
