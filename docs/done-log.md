# Done Log — Plugin PowerBuilder 2025 para VS Code

**Documento complementario del backlog activo.**

Este archivo recoge trabajo **cerrado** e hitos **históricos** que ya no deben contaminar el backlog operativo principal.

---

## Reglas de uso

- El **backlog activo** contiene solo trabajo **Open**, **Partial**, **Ready for closure** o **Blocked**.
- Este **done-log** conserva:
  - ítems **completamente cerrados**;
  - auditorías ya resueltas;
  - sprints históricos cerrados;
  - decisiones técnicas relevantes que conviene poder rastrear.
- Si un ítem está **cerrado parcialmente**, permanece en el backlog activo y **no** se mueve aquí.
- Si un ítem pasa a `Done`, debe salir del backlog activo y registrarse aquí con:
  - resultado técnico;
  - alcance trazado por spec;
  - validación ejecutada;
  - documentación afectada si aplica.

---

# 1. Ítems cerrados movidos fuera del backlog activo

## 1.1 P0 — Base inmediata de descubrimiento, scheduling, contexto, visibilidad de estado y caché de serving

### B120. Discovery rápido no bloqueante del workspace — **Cerrada (spec 013)**
**Objetivo:** descubrir roots y archivos relevantes sin bloquear el flujo interactivo.

**Resultado registrado:**
- detección rápida de markers de Workspace y Solution;
- detección de archivos PowerBuilder relevantes;
- cola inicial de trabajo sin esperar a la indexación completa;
- devolución temprana del control al usuario.

---

### B121. Scheduler de indexación multinivel con colas por prioridad — **Cerrada (spec 014)**
**Objetivo:** introducir colas explícitas y justas para repartir trabajo sin bloquear.

**Resultado registrado:**
- cola **Interactive**;
- cola **Near**;
- cola **Background**;
- prioridad real al archivo abierto;
- indexación progresiva del resto del workspace.

---

### B133. Barra de estado con progreso de indexación — **Cerrada (spec 015)**
**Objetivo:** reflejar en la barra de estado el progreso real del indexador.

**Resultado registrado:**
- progreso visible;
- estado actual del motor;
- actividad dominante;
- acceso rápido a diagnóstico/mantenimiento.

---

### B054. Contexto posicional semántico reutilizable — **Cerrada (spec 032)**
**Objetivo:** introducir `findInnermostCallableAtPosition()`, `findInnermostTypeAtPosition()` y contexto reutilizable de nesting real.

**Referencia histórica `plugin_old`:** lógica antigua de spans, nesting y comparación por anidamiento.

---

### B055. Parseo documental con secciones / state machine — **Cerrada (spec 033)**
**Objetivo:** sustituir parsing demasiado lineal por una máquina de estados capaz de distinguir con seguridad bloques declarativos y ejecutables.

**Referencia histórica `plugin_old`:** `pbDocumentParser.ts` y lógica útil de reconocimiento de secciones.

---

### B113. Parser canónico del contenedor SR* — **Cerrada (spec 034)**
**Objetivo:** crear un parser explícito para la estructura contenedora de `.sra`, `.srw`, `.sru`, `.srm`, `.srf`.

**Resultado registrado:**
- reconocimiento estable de `forward global type`;
- `global type ... from ...`;
- `global <type> <instance>`;
- `forward prototypes`;
- `on create/destroy`;
- contenedores de callables;
- variables declarativas del objeto.

---

### B061. Completion scoring heredado y normalizado — **Cerrada (spec 035)**
**Objetivo:** portar y normalizar el scoring semántico del `plugin_old` usando distancia de herencia, scope, owner context y visibilidad.

**Referencia histórica `plugin_old`:** `semanticEngine.ts`, `getCompletionScore`.

---

### B134A. Caché caliente del contexto activo — **Cerrada (spec 016)**
**Objetivo:** mantener una caché extremadamente rápida del documento activo y sus dependencias inmediatas.

---

### B134B. Caché de serving para hover / completion / signature help / definition — **Cerrada (spec 017)**
**Objetivo:** diseñar una capa de caché específica para serving de features interactivas.

---

### B034. Diagnóstico de variables no usadas — **Cerrada (spec 026)**
**Objetivo:** detectar variables declaradas pero no utilizadas con conocimiento real de scopes.

**Referencia histórica `plugin_old`:** `diagnosticResolver.ts`, `analyzeUnusedVariables`.

---

### B035. Detección de shadowing — **Cerrada (spec 027)**
**Objetivo:** detectar sombreado entre locals, shared, globals e instance variables.

**Referencia histórica `plugin_old`:** `diagnosticResolver.ts`, `analyzeVariableShadowing`.

---

## 1.2 P1 — Topología real y resolución fuerte de PowerScript

### B056. Workspace topology parser (`.pbw/.pbt/.pbsln/.pbproj`) — **Cerrada (spec 018)**
### B057. Project registry con scoring — **Cerrada (spec 019)**
### B087. Topología de workspace y library order — **Cerrada (spec 020)**
### B064. Enriched symbol model incremental — **Cerrada (spec 021)**
### B059. Symbol visibility real (`public/protected/private/...`) — **Cerrada (spec 022)**
### B058. InheritanceGraph robusto con caches — **Cerrada (spec 023)**
### B060. Owner resolution robusto (estático + dinámico) — **Cerrada (spec 024)**
### B023. Búsqueda de referencias segura en casos base — **Cerrada (spec 025)**

**Resumen del bloque cerrado:**
- topología real Workspace/Solution operativa;
- `projectRegistry` y scoring de pertenencia funcionales;
- `library order` explotado en resolución;
- modelo de símbolo enriquecido;
- visibilidad real;
- herencia robusta con caches;
- owner resolution base;
- references base reconstruidas sobre topología y resolución fuertes.

---

## 1.3 P2 — Hardening del parser y del lexer

### B089. Lexing de precisión: comentarios anidados y escapes — **Cerrada (spec 040)**
### B092. Sistema de máscaras de código (code masking) — **Cerrada (spec 028)**
### B095. Normalizador / splitter de sentencias — **Cerrada (spec 029)**
### B090. Detección enriquecida de SQL embebido — **Cerrada (spec 041)**
### B073. Soporte para funciones externas (`EXTERNAL FUNCTION/SUBROUTINE`) — **Cerrada (spec 039)**
### B099. Resolución por anidamiento (`Range Span Comparison`) — **Cerrada (spec 030)**
### B101. Deduplicación semántica robusta — **Cerrada (spec 031)**

**Resumen del bloque cerrado:**
- masking reutilizable;
- splitting robusto de sentencias;
- SQL embebido identificado;
- externas soportadas;
- resolución por nesting fuerte;
- deduplicación semántica mejorada;
- reducción de falsos positivos y fortalecimiento del pipeline reusable.

---

## 1.4 P3 — Productividad avanzada segura

### B074. Diagnósticos de modernización y funciones obsoletas — **Cerrada (spec 036)**
### B103. Hover enriquecido con metadatos PB — **Cerrada (spec 037)**
### B104. Soporte para eventos calificados y `on-handlers` — **Cerrada (spec 038)**
### B106. Comando de información del objeto actual — **Cerrada (spec 051)**

**Resumen del bloque cerrado:**
- modernización/obsoletas cubierta;
- hover enriquecido con metadatos útiles;
- `ON object_name.event_name` mejor soportado;
- comando de información del objeto operativo.

---

## 1.5 P4 — Escala, validación continua y rendimiento

### B127. File watcher estratificado y debounce de invalidación — **Cerrada (spec 043)**
### B128. Estados de readiness del workspace — **Cerrada (spec 044)**
### B129. Fairness por proyecto/root en background indexing — **Cerrada (spec 058)**

**Resumen del bloque cerrado:**
- invalidación agrupada y más estable;
- readiness del workspace formalizado;
- fairness por root/proyecto incorporada.

---

## 1.6 P5 — Ecosistema PowerBuilder, build y automatización

### B112. Herramientas de consistencia del catálogo — **Cerrada (specs 046 y 047)**
### B130. Detector y normalizador de encoding de fuentes — **Cerrada (spec 042)**
### B131. Soporte explícito para `.pblmeta` — **Cerrada (spec 045)**
### B138. Code masking pipeline (strip strings/comments) — **Cerrada**

**Resumen del bloque cerrado:**
- sanity checks y consistencia de catálogo;
- encoding heterogéneo mejor soportado;
- `.pblmeta` parseado;
- pipeline central de masking consolidado.

---

## 1.7 Hito 2026-05 — Ola 133-152 implementada y validada como primer corte operativo

### Resultado técnico registrado

La ola `Specs 133-152` dejó implementado un primer corte operativo de:

- snapshot semántico canónico por documento;
- `KnowledgeBase` con staging/publicación atómica y `semanticEpoch`;
- `semanticDiff`, dependencias semánticas inversas e invalidación dirigida/transitiva;
- indexación en dos fases con prioridad al activo, budgets adaptativos, yielding cooperativo, cancelación/preempción y modo degradado;
- backpressure del watcher, progreso/readiness enriquecidos y observabilidad ampliada;
- `UnifiedProjectModel` como base de topología compartida;
- persistencia base con `cacheSchema`, `cacheJournal` y `cacheCheckpoint`.

### Alcance trazado por spec

- `Specs 133-148` materializan primer corte de `B151`, `B165`, `B166`, `B170`, `B153`, `B154`, `B152`, `B122`, `B123`, `B124`, `B169`, `B125`, `B126`, `B134`, `B158` y `B159`.
- `Specs 149-152` materializan la base de `B141`, `B155`, `B167` y `B168`.

### Nota de gobierno

Este hito no implica que todos los ítems asociados estén cerrados. Los que siguieran `Partial` permanecen en backlog activo hasta cierre formal.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `309 passing`
- `npm test` → smoke `2 passing`, unit `309 passing`, integration `4 passing`

---

## 1.8 Hito 2026-05 — Ola 153-172 implementada y validada

### Resultado técnico registrado

La ola `Specs 153-172` consolidó un segundo corte operativo de:

- puerto persistente de filesystem y `cacheStore` real sobre `cacheStorageUri`;
- `workspaceKey` estable, metadata de checkpoint y validación estricta de journal con rebuild seguro;
- export/restore defensivo y versionado en `KnowledgeBase` y `DocumentCache`, más `journal` interactivo desde `analysisCache`;
- warm resume real de `DocumentCache` + `KnowledgeBase` y persistencia solo en `readiness` estable;
- helper común de contexto de query, `ServingCache` ampliado a `definition` / `signatureHelp` / `completion`, y consumo real de `HotContextCache`;
- `queryTrace` retenida, `reasonCodes` del winner path y snapshot ampliado de stats interno/público.

### Alcance trazado por spec

- `Specs 153-163` materializan segundo corte de `B167`, `B168`, `B071`, `B071A` y `B174`.
- `Specs 164-172` materializan primer corte operativo de `B156`, `B157`, `B160`, `B176` y `B109`.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `324 passing`
- `npm test` → smoke `2 passing`, unit `324 passing`, integration `4 passing`

---

## 1.8A B157. Winner evidence contractual del query engine — **Slice cerrada (spec 219)**

### Resultado técnico registrado

`Spec 219` abre una evidencia estructurada minima sobre el ganador actual del query engine:

- `ResolvedTargetInfo` expone `evidence` como contrato derivado y estable;
- el primer item `winner-target` reutiliza `reasonCode`, `confidence` y lineage del target ganador;
- la logica de derivacion queda concentrada en `semanticQueryService`, sin cambiar el comportamiento de resolucion.

### Cierre real

La slice no cierra todavia `B157`, pero deja un contrato reutilizable para las siguientes piezas de descartes, ambiguedad y confidence.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.8B B157. Pool bruto de candidatos del winner path — **Slice cerrada (spec 220)**

### Resultado técnico registrado

`Spec 220` conserva el conjunto de candidatos evaluados antes del filtro final:

- `ResolvedTargetInfo` expone `candidatePool` como contrato estable y pequeño;
- las rutas locales, jerárquicas, cualificadas y globales retienen el pool bruto antes del filtro definitivo;
- la resolución final sigue saliendo por `targets`, sin cambios funcionales en providers.

### Cierre real

La slice no cierra todavía `B157`, pero deja disponible el material base para explicar descartes y empates en slices posteriores.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.8C B157. Descartes explicados por distancia jerarquica — **Slice cerrada (spec 221)**

### Resultado técnico registrado

`Spec 221` convierte el filtro jerarquico minimo en evidence explicable:

- el runtime conserva descartes producidos por la misma distancia usada para elegir el ganador;
- `ResolvedTargetInfo.evidence` añade entradas `discarded-distance` con distancia ganadora y del candidato descartado;
- la resolucion final sigue inalterada y el cambio queda concentrado en `semanticQueryService`.

### Cierre real

La slice no cierra todavia `B157`, pero ya explica por que un ancestro o miembro mas lejano no gana frente al override mas cercano.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.8D B157. Descartes contextuales de qualifier — **Slice cerrada (spec 222)**

### Resultado técnico registrado

`Spec 222` hace visibles los misses de contexto más inmediatos en rutas cualificadas:

- `ResolvedTargetInfo.evidence` registra `qualifier-unresolved` cuando el qualifier no resuelve a tipo;
- también registra `qualifier-no-match` cuando el tipo resuelto no aporta miembros compatibles;
- los casos negativos siguen devolviendo cero targets, pero dejan de ser opacos para debugging y futuras confidence gates.

### Cierre real

La slice no cierra todavía `B157`, pero añade explicabilidad negativa básica en el punto exacto donde la ruta cualificada se corta.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.8E B157. Ambiguedad explicita de distancia minima — **Slice cerrada (spec 223)**

### Resultado técnico registrado

`Spec 223` hace visible la ambigüedad residual del winner path jerárquico:

- el ranking por distancia conserva cuándo la distancia ganadora deja más de un candidato;
- `ResolvedTargetInfo.evidence` añade entradas `distance-ambiguity` con distancia mínima y número de empatados;
- `targets` mantiene su comportamiento actual, dejando la decisión de gates para slices posteriores.

### Cierre real

La slice no cierra todavía `B157`, pero deja formalizado el caso de empate que luego necesitarán confidence y feature gates.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.8AD B157. Cardinalidad de ganadores en hover de usuario — **Slice cerrada (spec 237)**

### Resultado técnico registrado

`Spec 237` separa la cardinalidad del winner path como dato estable dentro del hover:

- `formatUserHover()` renderiza `Candidatos ganadores`;
- la cardinalidad se reutiliza desde el `targetCount` ya aportado por el provider;
- la cobertura unitaria valida casos simple y ambiguo.

### Cierre real

La slice distingue claramente entre advertencia de ambigüedad y cardinalidad informativa del winner path.

### Validación registrada

- `npm run test:unit -- --grep "unit/hover"`

---

## 1.8AC B157. Reason detallado de confidence insuficiente — **Slice cerrada (spec 244)**

### Resultado técnico registrado

`Spec 244` mejora la explicabilidad de las decisiones motivadas por confidence insuficiente:

- el `reason` incluye la confidence actual y la requerida;
- la acción calculada no cambia respecto a la `Spec 243`;
- la cobertura unitaria valida el detalle del mensaje en el caso `low < medium`.

### Cierre real

La slice deja la decisión lista para diagnosis más precisa cuando se active en callers del servidor.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8AB B157. Último paso del snapshot en queryTrace — **Slice cerrada (spec 248)**

### Resultado técnico registrado

`Spec 248` añade un resumen escalar del cierre de la última traza capturada:

- `TraceSnapshot` expone `lastStepName`;
- el valor refleja el último paso emitido, o queda ausente si no hubo pasos;
- la cobertura unitaria valida la coherencia entre resumen y array real.

### Cierre real

La slice facilita inspección inmediata del último evento observado sin recorrer la colección completa de pasos.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8AA B157. Suficiencia de confidence por feature — **Slice cerrada (spec 240)**

### Resultado técnico registrado

`Spec 240` compone la policy de confidence en un helper booleando reutilizable:

- `featureReadiness` expone `isResolutionConfidenceSufficient()`;
- el helper reutiliza comparador y thresholds ya centralizados;
- la cobertura unitaria valida casos laxos y estrictos por feature.

### Cierre real

La slice deja preparada una comprobación declarativa de sufficiency antes de activar decisiones automáticas en callers.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8Z B157. Resumen de acciones únicas en queryTrace — **Slice cerrada (spec 247)**

### Resultado técnico registrado

`Spec 247` completa el resumen agregado del snapshot con las acciones únicas observadas:

- `TraceSnapshot` expone `actions`;
- el resumen preserva el orden de primera aparición y elimina duplicados;
- la cobertura unitaria valida la agregación sobre una traza con acciones repetidas.

### Cierre real

La slice deja el snapshot listo para inspección rápida por fases y acciones sin reparseo externo.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8Y B157. Resumen de fases únicas en queryTrace — **Slice cerrada (spec 246)**

### Resultado técnico registrado

`Spec 246` añade al snapshot un resumen ligero de fases únicas observadas:

- `TraceSnapshot` expone `phases`;
- el resumen preserva el orden de primera aparición y elimina duplicados;
- la cobertura unitaria valida la agregación sobre una traza con fases repetidas.

### Cierre real

La slice facilita inspección rápida de la traza sin recorrer todos los pasos ni reagruparlos fuera del módulo.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8X B157. Clonado defensivo de pasos en queryTrace — **Slice cerrada (spec 245)**

### Resultado técnico registrado

`Spec 245` blinda la lectura de la última traza frente a mutaciones externas:

- `getLastTrace()` devuelve clones de cada `TraceStep`;
- mutar el snapshot obtenido ya no altera lecturas posteriores;
- la cobertura unitaria valida el encapsulamiento del estado retenido.

### Cierre real

La slice mejora la seguridad del snapshot retenido sin cambiar el comportamiento observable de la traza.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8W B157. Gating de confidence en featureReadiness — **Slice cerrada (spec 243)**

### Resultado técnico registrado

`Spec 243` activa la policy de confidence dentro de la decisión de readiness:

- `decideFeatureReadiness()` compara `actualResolutionConfidence` contra el threshold del feature;
- cuando la confidence es insuficiente y el readiness base ya era suficiente, aplica `fallbackAction`;
- la cobertura unitaria valida casos de `block` y de `allow` con threshold bajo.

### Cierre real

La slice deja operativo el gating por confidence dentro de la decisión, aunque la integración con callers del servidor quede para slices posteriores.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8V B157. Confidence real contextual en la decisión de readiness — **Slice cerrada (spec 242)**

### Resultado técnico registrado

`Spec 242` completa el contrato de decisión con la señal real aportada por el caller:

- `FeatureReadinessContext` acepta `resolutionConfidence`;
- `FeatureReadinessDecision` expone `actualResolutionConfidence`;
- la cobertura unitaria valida la propagación del valor sin alterar aún la acción final.

### Cierre real

La slice prepara decisiones explicables basadas en confidence sin recalcular la resolución dentro de `featureReadiness`.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8U B157. Threshold requerido en la decisión de readiness — **Slice cerrada (spec 241)**

### Resultado técnico registrado

`Spec 241` hace autocontenida la decisión de readiness respecto a la policy de confidence:

- `FeatureReadinessDecision` expone `requiredResolutionConfidence`;
- `decideFeatureReadiness()` rellena el threshold correspondiente al feature en todas sus ramas;
- la cobertura unitaria fija el contrato de decisión enriquecida.

### Cierre real

La slice deja visible la policy aplicada sin necesitar consultas externas adicionales al getter de thresholds.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8T B157. Thresholds mínimos de confidence por feature — **Slice cerrada (spec 239)**

### Resultado técnico registrado

`Spec 239` centraliza la política mínima de confidence de resolución por feature:

- `featureReadiness` expone `getRequiredResolutionConfidence()`;
- hover y completion aceptan `low`, definition exige `medium`, references y rename exigen `high`;
- la cobertura unitaria deja la política fijada antes de activar gates automáticos.

### Cierre real

La slice prepara la activación controlada de decisions por confidence sin dispersar thresholds en handlers del servidor.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8S B157. Orden canónico de confidence por feature — **Slice cerrada (spec 238)**

### Resultado técnico registrado

`Spec 238` fija la comparación básica de confidence de resolución en la capa de readiness:

- `featureReadiness` define un orden canónico `low < medium < high`;
- `compareResolutionConfidence()` centraliza la comparación;
- la cobertura unitaria deja preparada la base para thresholds y gates posteriores.

### Cierre real

La slice elimina la necesidad de comparaciones ad hoc antes de introducir políticas por feature.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8R B157. Nota de ambigüedad en hover de usuario — **Slice cerrada (spec 236)**

### Resultado técnico registrado

`Spec 236` hace visible en el hover cuándo la resolución sigue siendo ambigua:

- `provideHover()` proyecta si existen varios targets ganadores y cuántos son;
- `formatUserHover()` renderiza una nota explícita de `Resolución ambigua`;
- la cobertura unitaria valida un caso real con dos candidatos a distancia mínima.

### Cierre real

La slice mantiene el target principal actual, pero ya no oculta al usuario que el winner path sigue siendo ambiguo.

### Validación registrada

- `npm run test:unit -- --grep "unit/hover"`

---

## 1.8Q B157. Reason code principal en hover de usuario — **Slice cerrada (spec 235)**

### Resultado técnico registrado

`Spec 235` añade explicabilidad directa del camino de resolución en el hover de usuario:

- `provideHover()` pasa el `reasonCode` principal desde la resolución detallada;
- `formatUserHover()` renderiza `Motivo de resolución` con el valor canónico del query engine;
- la cobertura unitaria valida la proyección en el caso real de `global-fallback`.

### Cierre real

La slice mejora la trazabilidad visible de la resolución sin reinterpretar ni traducir la semántica del engine.

### Validación registrada

- `npm run test:unit -- --grep "unit/hover"`

---

## 1.8P B157. Confidence general en hover de usuario — **Slice cerrada (spec 234)**

### Resultado técnico registrado

`Spec 234` proyecta la confidence general del winner path en el hover de símbolos de usuario:

- `provideHover()` pasa la confidence desde `ResolvedTargetInfo`;
- `formatUserHover()` renderiza `Confianza de resolución` sin mezclarla con la confidence de lineage;
- la cobertura unitaria recoge tanto el formateador como el caso real de `global-fallback`.

### Cierre real

La slice lleva la primera señal compacta del query engine a una feature visible sin tocar la lógica de selección de targets.

### Validación registrada

- `npm run test:unit -- --grep "unit/hover"`

---

## 1.8O B157. Resumen temporal en queryTrace — **Slice cerrada (spec 233)**

### Resultado técnico registrado

`Spec 233` añade metadatos temporales ligeros al snapshot de la última traza:

- `TraceSnapshot` expone `startedAt`, `endedAt` y `durationMs`;
- la duración se deriva en el cierre de `withTrace()`;
- `getLastTrace()` devuelve un resumen temporal coherente junto al resto del snapshot.

### Cierre real

La slice aporta una señal diagnóstica ligera de coste sin introducir perf tooling adicional en el hot path.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8N B157. Step count en queryTrace — **Slice cerrada (spec 232)**

### Resultado técnico registrado

`Spec 232` añade un resumen directo del tamaño de la última traza capturada:

- `TraceSnapshot` expone `stepCount`;
- el valor se fija al cerrar la traza y coincide con `steps.length`;
- `getLastTrace()` devuelve una copia coherente del resumen.

### Cierre real

La slice permite inspección rápida del volumen de pasos sin recorrer el array completo fuera de `queryTrace`.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8M B157. Acción derivada en queryTrace — **Slice cerrada (spec 231)**

### Resultado técnico registrado

`Spec 231` completa la descomposición ligera del nombre de paso en la traza:

- `TraceStep` expone `action`;
- `recordTraceStep()` deriva el sufijo posterior a `:` cuando existe;
- pasos sin patrón compuesto conservan `action` indefinida.

### Cierre real

La slice evita parseo externo del nombre completo de paso y deja la semántica básica de la traza centralizada en `queryTrace`.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8L B157. Fase derivada en queryTrace — **Slice cerrada (spec 230)**

### Resultado técnico registrado

`Spec 230` enriquece cada paso de traza con una fase derivada del nombre compuesto:

- `TraceStep` expone `phase`;
- `recordTraceStep()` deriva el prefijo antes de `:` cuando existe;
- pasos sin prefijo conservan `phase` indefinida.

### Cierre real

La slice mejora la inspección ligera de la traza sin imponer aún una taxonomía cerrada ni tocar los nombres ya emitidos.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8K B157. Tipos de evidence en DocumentQueryContext — **Slice cerrada (spec 229)**

### Resultado técnico registrado

`Spec 229` proyecta una vista resumida de la evidence disponible en el contexto documental:

- `DocumentQueryContext` expone `resolutionEvidenceKinds`;
- la lista reutiliza los `kind` de `resolvedTargets?.evidence` sin tocar los payloads canónicos;
- el resumen cubre casos simples, ambiguos y ausencia de contexto.

### Cierre real

La slice permite detectar qué explicaciones están disponibles sin inspeccionar toda la evidence heterogénea.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryContext"`

---

## 1.8J B157. Cardinalidad de targets en DocumentQueryContext — **Slice cerrada (spec 228)**

### Resultado técnico registrado

`Spec 228` proyecta la cardinalidad del resultado de resolución como un escalar directo del contexto documental:

- `DocumentQueryContext` expone `resolutionTargetCount`;
- el valor reutiliza `resolvedTargets?.targets.length` sin recomputar el query;
- la surface cubre resolución simple, ambigua y ausencia de contexto.

### Cierre real

La slice permite a capas superiores leer cardinalidad sin navegar el resultado detallado completo.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryContext"`

---

## 1.8I B157. Bandera de ambigüedad en DocumentQueryContext — **Slice cerrada (spec 227)**

### Resultado técnico registrado

`Spec 227` proyecta la ambigüedad del winner path como surface booleana directa del contexto documental:

- `DocumentQueryContext` expone `hasResolutionAmbiguity`;
- la bandera se deriva de la evidence `distance-ambiguity` ya calculada por el query engine;
- sin contexto resoluble, el valor degrada a `false`.

### Cierre real

La slice evita que capas superiores tengan que inspeccionar evidence estructurada solo para detectar empates mínimos.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryContext"`

---

## 1.8H B157. Reason code principal en DocumentQueryContext — **Slice cerrada (spec 226)**

### Resultado técnico registrado

`Spec 226` proyecta la causa principal del winner path como surface directa del contexto documental:

- `DocumentQueryContext` expone `primaryResolutionReasonCode`;
- el valor se deriva de `resolvedTargets?.reasonCodes[0]` sin recalcular la resolución;
- la surface degrada a `undefined` cuando no existe contexto resoluble.

### Cierre real

La slice simplifica consumidores de reason codes y mantiene la fuente de verdad en el query engine detallado.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryContext"`

---

## 1.8G B157. Surface de confidence en DocumentQueryContext — **Slice cerrada (spec 225)**

### Resultado técnico registrado

`Spec 225` proyecta la confidence general del query engine como surface de conveniencia en el contexto documental:

- `DocumentQueryContext` expone `resolutionConfidence`;
- la proyección reutiliza `resolvedTargets?.confidence` sin recalcular la resolución;
- el contexto degrada a `undefined` cuando no existe invocación resoluble.

### Cierre real

La slice mantiene la fuente de verdad dentro de `semanticQueryService` y prepara surfaces consumidoras más simples en capas superiores.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryContext"`

---

## 1.8F B157. Confidence scorer v1 del winner path — **Slice cerrada (spec 224)**

### Resultado técnico registrado

`Spec 224` sintetiza la evidence estabilizada en una confidence general del query engine:

- `ResolvedTargetInfo` expone `confidence` con buckets `high`, `medium` y `low`;
- el scorer reutiliza `reasonCodes`, lineage, misses contextuales y ambigüedad sin cambiar `targets`;
- quedan cubiertas rutas altas, medias y bajas sobre el mismo módulo de resolución.

### Cierre real

La slice no cierra todavía `B157`, pero deja un scorer puro reutilizable para surfaces posteriores y futuras confidence gates.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.9 B071A. Caché persistente por workspace y por proyecto — **Cerrada (specs 173 y 174)**

### Resultado técnico registrado

Las `Specs 173-174` cierran `B071A` como capacidad operativa de persistencia fina:

- `cacheStore` acepta `UnifiedProjectModel` para conocer la pertenencia de los documentos;
- el checkpoint persistido se divide por proyecto;
- el journal persistido se divide por proyecto con secuencias locales por partición;
- los documentos huérfanos permanecen anclados a la partición de workspace;
- el warm resume recompone el conjunto agregado aplicando checkpoint y journal por partición.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `326 passing`
- `npm test` → smoke `2 passing`, unit `326 passing`, integration `4 passing`

---

## 1.10 B071B. Caché de consultas frecuentes — **Cerrada (specs 175-184)**

### Resultado técnico registrado

Las `Specs 175-184` cierran `B071B` como cache persistente de serving:

- `ServingCache` expone `exportEntries()` y `restoreEntries()`;
- `cacheStore` persiste y carga snapshots de `ServingCache` en archivo dedicado y versionado;
- el runtime restaura entries persistidas tras warm resume compatible;
- `kbVersionFromKey()` permite filtrar claves por epoch;
- persistencia y restore descartan claves inválidas u obsoletas;
- `ServingCacheFlushCoordinator` coordina dirty/flush;
- el runtime dispara flush oportuno tras hover, definition, signatureHelp y completion;
- invalidaciones y shutdown fuerzan flush estable;
- `powerbuilder.showStats` expone `lastRestoredEntries` y `lastPersistedEntries` en `persistence.servingSnapshot`.

### Alcance trazado por spec

- `Specs 175-184` materializan el cierre completo de `B071B`.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `341 passing`
- `npm test` → smoke `2 passing`, unit `341 passing`, integration `4 passing`

---

## 1.11 B172. Provenance / lineage de símbolos — **Cerrada (specs 185-192)**

### Resultado técnico registrado

Las `Specs 185-192` cierran `B172`:

- añaden `EntityLineage` al modelo semántico central;
- pueblan lineage desde `analyzeDocument`;
- distinguen prototype frente a implementation;
- propagan herencia documental mínima desde `baseTypeName`;
- normalizan lineage en `enrichEntity`;
- incorporan lineage estable al `semanticDiff`;
- exponen `winnerLineage` en `semanticQueryService`;
- conectan provenance del catálogo de sistema con lineage;
- muestran lineage mínimo en hover;
- estabilizan `ApiSymbolLineage` y `toApiSymbol()` en el contrato público.

### Alcance trazado por spec

- `Specs 185-192` cierran `B172`.
- `Spec 192` amplía `B109` sin cerrar aún la API pública completa.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `350 passing`
- `npm test` → smoke `2 passing`, unit `350 passing`, integration `4 passing`

---

## 1.11A B151. KB snapshot-first readers en KnowledgeBase — **Slice cerrada (spec 193)**

### Resultado técnico registrado

`Spec 193` reduce `B151` en un boundary pequeño y reusable:

- `KnowledgeBase` prioriza `documentSnapshots` en `getEntitiesByUri()` y `getScopeAt()`;
- el fallback legacy se conserva cuando el documento aún no tiene snapshot publicado;
- tests unitarios focalizados cubren la lectura documental snapshot-first.

### Cierre real

`Spec 193` no cerraba por sí sola `B151`, pero deja preparado el consumo snapshot-first de features core y sirve de base a `Specs 198-204`, que terminan cerrando `B151A` y `B151`.

### Validación registrada

- `npm run test:unit -- --grep "unit/knowledgeBase"`
- `npm run compile`

---

## 1.12 B165. Publicación atómica del Knowledge Base y de los índices — **Cerrada (specs 134 y 194)**

### Resultado técnico registrado

`B165` queda cerrado y debe salir del backlog activo:

- se separa construcción/staging de publicación visible;
- el swap atómico evita mezcla de estado viejo y nuevo;
- `rollbackBatchUpdate()` descarta publicaciones incompletas;
- `Spec 194` amplía la validación para cubrir `getEntitiesByUri()`, `getScopeAt()` y `getDocumentSnapshot()` durante batch y tras commit.

### Cierre real

`Specs 134 y 194` prueban que las lecturas documentales y globales no ven estado staged ni mezcla parcial.

### Validación registrada

- `npm run test:unit -- --grep "unit/(ServingCache|servingCachePersistence|knowledge)"`
- `npm run compile`
- `npm run test:unit` → `352 passing`
- `npm test` → smoke `2 passing`, unit `352 passing`, integration `4 passing`

---

## 1.13 B166. Versionado semántico interno del workspace — **Cerrada (specs 135, 178-180)**

### Resultado técnico registrado

`B166` queda cerrado y debe salir del backlog activo:

- `KnowledgeBase` publica `semanticEpoch`;
- `ServingCache` liga sus claves a la epoch/version semántica;
- la persistencia filtra snapshots por epoch activa/esperada;
- resultados y caches se invalidan por versión semántica global y no solo por archivo.

### Cierre real

`Specs 135`, `178`, `179` y `180`, junto con el wiring persistente del runtime, hacen que resultados y caches sean coherentes con la epoch semántica global.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `352 passing`
- `npm test` → smoke `2 passing`, unit `352 passing`, integration `4 passing`

---

## 1.14 B170. Semantic diff engine — **Cerrada (specs 136 y 195)**

### Resultado técnico registrado

`Spec 195` completa el cierre de `B170`:

- el diff semántico deja de marcar cambio por puro fingerprint;
- distingue cambios cosméticos de cambios semánticos reales;
- los cambios cosméticos invalidan solo el documento origen;
- los cambios semánticos combinan impactos previos y siguientes.

### Validación registrada

- `npm run test:unit -- --grep "unit/(semanticDiff|semanticInvalidation)"`
- `npm run compile`
- `npm run test:unit` → `355 passing`
- `npm test` → smoke `2 passing`, unit `355 passing`, integration `4 passing`

---

## 1.15 B153. Índice de dependencias semánticas inversas — **Cerrada (specs 137 y 195)**

### Resultado técnico registrado

`B153` queda cerrado sobre el reverse graph existente:

- `KnowledgeBase` extrae dependencias desde snapshot;
- mantiene el grafo inverso;
- `Spec 195` usa planes previos y siguientes para resolver el conjunto impactado real;
- se resuelven impactos directos/transitivos sin volver a invalidación gruesa por cambio documental.

### Validación registrada

- `npm run test:unit -- --grep "unit/(semanticDiff|semanticInvalidation)"`
- `npm run compile`
- `npm run test:unit` → `355 passing`
- `npm test` → smoke `2 passing`, unit `355 passing`, integration `4 passing`

---

## 1.16 B154. Invalidation engine explícito — **Cerrada (specs 138 y 195)**

### Resultado técnico registrado

`B154` queda cerrado:

- `semanticInvalidation.ts` concentra planes explícitos de invalidación;
- soporta invalidación `document-only`, merge de impactos y plan snapshot-aware;
- el servidor deja de decidir ad hoc entre invalidación gruesa o selectiva;
- desaparece la lógica dispersa de invalidación por feature en el hot path.

### Validación registrada

- `npm run test:unit -- --grep "unit/(semanticDiff|semanticInvalidation)"`
- `npm run compile`
- `npm run test:unit` → `355 passing`
- `npm test` → smoke `2 passing`, unit `355 passing`, integration `4 passing`

---

## 1.17 B123. Presupuestos de trabajo y yielding cooperativo — **Cerrada (spec 141)**

### Resultado técnico registrado

`B123` queda cerrado:

- `workspaceIndexer` trabaja con `workBudgetMs`;
- integra `latencyGovernor`;
- contabiliza `yielded`;
- cede cooperativamente con `setImmediate()` en ambos pases;
- el indexador ya no monopoliza CPU durante batches largos.

### Validación registrada

- `npm run compile`
- `npm test` → smoke `2 passing`, unit `355 passing`, integration `4 passing`

---

## 1.18 B124. Cancelación y preempción real de tareas de fondo — **Cerrada (spec 142)**

### Resultado técnico registrado

`B124` queda cerrado:

- `TaskScheduler` preempta `Background` con `Near` e `Interactive`;
- cancela tareas activas o pendientes;
- expone contadores de preemption;
- el trabajo interactivo y cercano al contexto activo no queda bloqueado por background.

### Validación registrada

- `npm run compile`
- `npm test` → smoke `2 passing`, unit `355 passing`, integration `4 passing`

---

## 1.19 B126. Superficie de estado del indexador — **Cerrada (specs 145 y 196)**

### Resultado técnico registrado

`B126` queda cerrado:

- `getIndexerStatus()` expone fase, pass, progreso, budget y degradación;
- `Spec 196` añade `lastProcessedUri`, `lastFailedUri` y `partialRuns`;
- el indexador deja de ser una caja negra;
- el operador puede ver última actividad relevante sin esperar al event log completo.

### Validación registrada

- `npm run test:unit -- --grep "unit/workspaceIndexer"`
- `npm run compile`
- `npm test` → smoke `2 passing`, unit `357 passing`, integration `4 passing`

---

## 1.20 Hito 2026-05 — Limpieza del backlog activo y traslado de ítems Done

### Resultado técnico registrado

Se actualiza el done-log para reflejar los ítems retirados del backlog activo en la versión corregida del backlog.

### Ítems retirados del backlog activo por estar cerrados

- B165 — Publicación atómica del Knowledge Base y de los índices.
- B166 — Versionado semántico interno del workspace.
- B170 — Semantic diff engine.
- B153 — Índice de dependencias semánticas inversas.
- B154 — Invalidation engine explícito.
- B123 — Presupuestos de trabajo y yielding cooperativo.
- B124 — Cancelación y preempción real de tareas de fondo.
- B126 — Superficie de estado del indexador.
- B071B — Caché de consultas frecuentes.
- B172 — Provenance / lineage de símbolos.

### Nota de gobierno

Estos ítems ya no deben aparecer en el backlog activo. Si quedan referencias a ellos, deben estar solo como dependencias históricas, trazabilidad o notas de cierre, no como trabajo pendiente.

---

## 1.21 B174. Resultados semánticos inmutables — **Cerrada (specs 159-160 y 197)**

### Resultado técnico registrado

`B174` queda cerrado:

- `Specs 159-160` ya blindaban export/restore y el payload persistente versionado de `KnowledgeBase` y `DocumentCache`;
- `Spec 197` completa la frontera inmutable sobre lecturas y escrituras publicas de `KnowledgeBase`, `DocumentCache` y `HotContextCache`;
- mutar entradas o resultados leidos deja de contaminar snapshots, scopes y entidades publicadas.

### Validación registrada

- `npm run test:unit -- --grep "unit/(knowledge|HotContextCache)"`
- `npm run compile`

---

## 1.22 Hito 2026-05 — Specs 198-217: cierre de B151, B152 y B169; reducción de B141A

### Resultado técnico registrado

La ola `Specs 198-217` consolida tres cierres reales del core incremental y reduce el último residual `Partial` de topología compartida:

- Sobre la base de `Spec 193`, `Specs 198-204` hacen snapshot-first `documentSymbols`, `completion`, `signatureHelp`, `diagnostics` y `semanticTokens`, eliminan la recomposición semántica residual por feature y permiten cerrar `B151A` y `B151`.
- `Specs 205-206`, `216` y `217` convierten el indexador en un pipeline de dos fases real con `analyzeDocumentStructural()`, publicación temprana `structural-only`, promoción explícita a `nearby-semantic-ready` y contadores por pass, permitiendo cerrar `B152A` y `B152`.
- `Specs 207-208` y `210` cablean el intake real del watcher sobre el runtime, distinguen modo incremental frente a massive mode, barren caches derivadas de forma selectiva o global según el burst y validan el backpressure extremo a extremo, permitiendo cerrar `B169A` y `B169`.
- `Specs 209`, `211-215` llevan `UnifiedProjectModel` a `workspaceIndexer`, `libraryOrder`, `projectRouting`, refresh por watcher y status activo; `B141A` queda reducido a serving e invariantes finales, pero no cerrado todavía.

### Alcance trazado por spec

- `Specs 198-204` cierran `B151A` y `B151`.
- `Specs 205-206`, `216` y `217` cierran `B152A` y `B152`.
- `Specs 207-208` y `210` cierran `B169A` y `B169`.
- `Specs 209`, `211-215` reducen `B141A`, pero la mantienen en backlog activo.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- suites focalizadas por slice sobre `documentSymbols`, `documentAnalysis`, `workspaceIndexer`, `watchedFileIntake`, `watcherPipeline`, `unifiedProjectModel`, `libraryOrder`, `workspace`, `knowledgeBase` y `scopeResolution`
- `npm run test:unit` → `376 passing`
- `npm test` → smoke `2 passing`, unit `376 passing`, integration `4 passing`

---

## 1.23 B141/B141A. Library graph / project model unificado y adopción runtime — **Cerradas (specs 149-152, 209, 211-215 y 218)**

### Resultado técnico registrado

Las `Specs 149-152`, `209`, `211-215` y `218` dejan cerrado el modelo compartido de proyecto/routing del runtime:

- `UnifiedProjectModel` actúa como única fuente de verdad project-aware en `cacheStore`, `workspaceIndexer`, `libraryOrder`, refresh por watcher y status del proyecto activo;
- `WorkspaceState.clear()` reinicia también `projectRegistry`, evitando arrastrar routing legacy tras un reset completo del workspace;
- el contrato de proyecto activo sigue derivándose del modelo unificado y el reset deja `getProjectContextForFile()` en estado seguro;
- backlog, roadmap y current-focus dejan de tratar `B141A` como residual `Partial`.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `379 passing`
- `npm test` → smoke `2 passing`, unit `379 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.24 B122. Priorización por dependencias semánticas cercanas — **Cerrada (spec 140)**

### Resultado técnico registrado

`Spec 140` queda cerrada sobre el runtime real del indexador:

- el servidor pasa `activeDocumentUri` real a `indexWorkspace`, evitando que la prioridad quede reducida a orden físico cuando existe contexto activo;
- `prioritizeFilesForIndexing()` ordena ahora por buckets explicables: activo, ancestros, owners/tipos cercanos, calls probables, proyecto y workspace;
- el grafo inverso publicado y los snapshots semánticos del activo alimentan esa heurística sin reintroducir lógica duplicada en el hot path;
- `getIndexerStatus()` expone `prioritySummary`, dejando visible la razón de prioridad observada por el runtime.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `381 passing`
- `npm test` → smoke `2 passing`, unit `381 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.25 B125. Indexación progresiva del workspace completo — **Cerrada (spec 144)**

### Resultado técnico registrado

`Spec 144` queda cerrada sobre el runtime real del indexador y del watcher:

- `watchedFileIntake` ya alimenta la misma file state machine que `workspaceIndexer`, dejando estado explícito para `create`, `change`, `delete`, saltos por documento abierto y fallos locales;
- `getFileIndexState()` y `getIndexerStatus()` cubren ahora tanto la indexación completa del workspace como los lotes incrementales del watcher, sin abrir una segunda vía de estado;
- el pipeline mantiene prioridad, yielding, preempción y backpressure ya existentes, pero ahora con visibilidad coherente de estados simultáneos mientras el workspace converge hacia `ready`.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/watchedFileIntake"`
- `npm test` → smoke `2 passing`, unit `382 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.26 B134. Modelo de progreso y readiness del indexador — **Cerrada (spec 146)**

### Resultado técnico registrado

`Spec 146` queda cerrada sobre el runtime real del servidor:

- discovery, indexación, watcher intake y `powerbuilder.showStats` derivan ahora del mismo snapshot de progreso/readiness en lugar de mezclar señales separadas de `readiness` e `indexer`;
- el modelo distingue progreso operativo de disponibilidad semántica y publica `activeContextReady`, `projectReady` y `workspaceReady` sobre esa misma fuente;
- `discoverWorkspace` expone progreso monotónico de discovery y el servidor reutiliza esa señal para transiciones coherentes sin abrir un segundo camino de status.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/146-indexer-progress-readiness/quickstart.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/progressReadiness|unit/workspace|unit/watchedFileIntake"`
- `npm test` → smoke `2 passing`, unit `386 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.27 B158. Modo degradado formal — **Cerrada (spec 147)**

### Resultado técnico registrado

`Spec 147` queda cerrada sobre el runtime real de serving:

- existe ya una enumeración formal de niveles (`structural-only`, `nearby-semantic-ready`, `project-semantic-ready`, `workspace-semantic-ready`) y un helper único que decide `allow`, `degrade` o `block` por feature;
- `hover` y `completion` consumen el contrato en modo degradado, mientras `definition`, `references` y `rename` se bloquean o habilitan según el nivel requerido sin fingir precisión semántica;
- el mapping se apoya en la fuente única de progreso/readiness ya cerrada en `B134`, sin duplicar lógica en el query engine ni abrir una segunda vía de elegibilidad.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/147-formal-degraded-mode/quickstart.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness|unit/progressReadiness|unit/definition|unit/references|unit/hover|unit/completion|unit/renamePreflight"`
- `npm test` → smoke `2 passing`, unit `390 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing` (segunda ejecución; la primera fue ruido no reproducible de entorno)

---

## 1.28 B159. Gobernador de latencia del servidor — **Cerrada (spec 148)**

### Resultado técnico registrado

`Spec 148` queda cerrada sobre el runtime real del servidor:

- el `latencyGovernor` deja de estar encapsulado solo en el indexador y pasa a proteger también el serving interactivo y la admisión de trabajo de fondo desde el `scheduler`;
- existe una política explícita por tipo de request: `hover` y `completion` degradan bajo presión, `references` se bloquea bajo presión, y el background queda aplazado durante un cooldown corto sin romper el pipeline;
- la presión de latencia ya es observable y reutilizable en el runtime, alineada con el contrato de degradación de `B158`.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/148-server-latency-governor/quickstart.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/latencyGovernor|unit/scheduler|unit/featureReadiness|unit/hover|unit/completion|unit/references"`
- `npm test` → smoke `2 passing`, unit `394 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.29 B156. Query engine unificado — **Cerrada (spec 164 + cierre operativo posterior)**

### Resultado técnico registrado

`B156` queda cerrada como capacidad real del runtime:

- el helper común de contexto de query y el resolver semántico detallado alimentan ya el hot path de `hover`, `definition`, `signatureHelp`, `completion` y la resolución de declaración en `references`;
- `references` deja de elegir definiciones solo por nombre cuando el acceso es cualificado y pasa a usar el mismo winner semántico que `definition`;
- `completion` deja de depender de un contexto documental paralelo para obtener el objeto activo y el tipo del cualificador;
- existe una prueba de consistencia cross-feature que fija el mismo contexto base entre `definition`, `references` y `completion`.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/164-query-context-helper/quickstart.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/references|unit/completion|unit/queryEngineConsistency|unit/definition|unit/semanticQueryService"`
- `npm test` → smoke `2 passing`, unit `396 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.30 B173. Precomputed member closures por tipo — **Cerrada**

### Resultado técnico registrado

`B173` queda cerrada como infraestructura reusable del runtime:

- `InheritanceGraph` precomputa una closure de miembros por tipo con `relation`, `distance`, `accessible` y marca de override local;
- `getMembers()` deja de reconstruir la misma lista plana por su cuenta y pasa a reutilizar esa closure cacheada;
- la información precomputada ya queda disponible para consumers del query engine y deja preparada una base honesta para `B066`, `B065` y `B031`.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- `npm run test:unit -- --grep "InheritanceGraph|unit/completion|unit/definition|unit/references|unit/hover|unit/semanticQueryService"`
- `npm test` → smoke `2 passing`, unit `397 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.31 B066. CodeLens de referencias y herencia — **Cerrada (spec 050 ampliada)**

### Resultado técnico registrado

`B066` deja de ser una lens cosmética y queda cerrada como feature usable:

- el handler del servidor ya no usa `findAllDefinitions(name)` como proxy bruto de referencias y pasa a calcular conteos sobre el motor compartido de `references`;
- los títulos de CodeLens incorporan información de overrides/herencia consumiendo `member closures` de `B173`;
- existe caché de conteos por documento/epoch para no reescanear el workspace en cada solicitud;
- si `references` no está lista por readiness o presión de latencia, la lens degrada honestamente y deja de exponer un comando engañoso.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/050-codelens-refs/spec.md`
- `specs/050-codelens-refs/tasks.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/codeLensReferences|unit/references|unit/queryEngineConsistency|unit/featureReadiness"`
- `npm test` → smoke `2 passing`, unit `400 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.32 B065. Ancestor script navigation + hierarchy inspection — **Cerrada (spec 059, absorbiendo B137)**

### Resultado técnico registrado

`B065` deja de ser un par de helpers aislados y queda cerrada como inspección jerárquica usable:

- `getAncestorChain` y `buildHierarchyTree` pasan a alimentar una inspección estructurada del tipo activo con ancestro inmediato, cadena de ancestros, árbol de descendencia y overrides heredados;
- el runtime reutiliza `member closures` de `B173` para explicar overrides locales e integrar accesibilidad y origen heredado sin duplicar lógica semántica;
- la extensión publica el comando `PowerSyntax: Inspeccionar Jerarquía Activa`, que ejecuta la inspección sobre el documento y posición activos y expone el resultado de forma visible desde el cliente.

### Documentación afectada

- `README.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/059-ancestor-chain/spec.md`
- `specs/059-ancestor-chain/plan.md`
- `specs/059-ancestor-chain/tasks.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/hierarchyInspection|unit/ancestorNav|unit/hierarchyTree"`
- `npm test` → smoke `2 passing`, unit `401 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing` (segunda ejecución; la primera falló por ruido no reproducible del host)

---

## 1.33 B109. API pública para integración — **Cerrada (spec 054 ampliada sobre specs 172 y 192)**

### Resultado técnico registrado

`B109` deja de ser solo un archivo de tipos y queda cerrada como superficie pública mínima real:

- la activación de la extensión exporta una API versionada y estable para consumidores externos;
- la API expone `getServerStats()` sobre el contrato maduro de `ApiServerStats` y `querySymbols()` sobre `ApiQuerySymbolsRequest`/`ApiSymbol`, sin abrir estructuras internas mutables ni prometer evidence que aún pertenece a `B157`;
- el flujo `build:test` recompila ahora cliente y servidor antes de smoke/unit/integration, evitando validar contra artefactos obsoletos del `out/`.

### Documentación afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/testing.md`
- `specs/054-public-api/spec.md`
- `specs/054-public-api/plan.md`
- `specs/054-public-api/tasks.md`

### Validación registrada

- `npm run test:smoke -- --grep "smoke/extension"`
- `npm run test:unit -- --grep "unit/publicApi"`
- `npm test` → smoke `2 passing`, unit `401 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.34 B164. Interning y compactación de memoria — **Cerrada**

### Resultado técnico registrado

`B164` queda cerrada como optimización interna real y observable:

- `KnowledgeBase` y `DocumentCache` compactan por documento las strings calientes de URIs, ids, nombres, owners, tipos y contenedores antes de persistir facts/scopes/snapshots;
- la compactación no introduce fugas silenciosas: al reemplazar o invalidar un documento, el interner libera sus referencias y el pool vuelve a tamaño cero cuando el documento desaparece;
- el estado queda observable vía stats (`internedStrings`) para no dejar la optimización como una caja negra no verificable.

### Documentación afectada

- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/managedStringInterner|unit/knowledge"`
- `npm test` → smoke `2 passing`, unit `404 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.35 B063. Diagnostics snapshot agrupado — **Cerrada**

### Resultado técnico registrado

`B063` deja de ser un contador plano por URI y queda cerrada como snapshot diagnóstico agrupado y versionado:

- `buildDiagnosticsSnapshot()` agrupa ahora por proyecto y por objeto, conserva `documentVersion` y `snapshotVersion`, y mantiene además la vista agregada por archivo/código/severidad para no perder consumidores previos;
- `publishDiagnostics()` deja de mantener un resumen ad hoc divergente y reutiliza el mismo contrato enriquecido, con limpieza coherente al cerrar o eliminar archivos;
- `powerbuilder.showStats` y la API pública mínima heredan ese snapshot agrupado como surface exportable ligera, sin introducir una UI nueva ni duplicar lógica de agregación.

### Documentación afectada

- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/053-diagnostics-snapshot/spec.md`
- `specs/053-diagnostics-snapshot/plan.md`
- `specs/053-diagnostics-snapshot/tasks.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/diagnosticsSnapshot|unit/diagnostics"`
- `npm test` → smoke `2 passing`, unit `406 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

# 2. Auditoría 2026-04 — bugs críticos corregidos

## B143 — `end if` cerraba el scope de la función — **Corregido**
**Síntoma:** `END_GENERIC_PATTERN = /^end\s+/i` cerraba funciones con `end if`, `end choose`, `end try`, etc.

**Fix registrado:**
- cierre solo con `END_FUNCTION_PATTERN | END_SUBROUTINE_PATTERN | END_EVENT_PATTERN | END_ON_PATTERN`;
- `end type` cierra explícitamente `currentTypeScope`.

**Tests:** `documentAnalysis.test.ts` + fixture `function_with_endif.sru`.

---

## B144 — Declaraciones múltiples no detectadas — **Corregido**
**Síntoma:** `Integer li_a, li_b, li_c` solo registraba el primer identificador.

**Fix registrado:**
- `extractAdditionalNames()`;
- un símbolo por identificador adicional con mismo `datatype/access`.

---

## B145 — IF multi-línea con continuación `&` — **Corregido**
**Síntoma:** `if a > 0 and & \n b < 10 then` no abría correctamente el bloque IF.

**Fix registrado:**
- `validateStructure` acumula líneas lógicas con continuación `&`.

---

## B146 — Parser de parámetros más robusto — **Corregido**
**Síntoma:** `pushScopeArguments` perdía el nombre real en casos como `readonly ref string as_arr[]`.

**Fix registrado:**
- ignora múltiples modificadores iniciales;
- limpia el sufijo `[...]` del nombre.

---

## B149 — SD2 ya no recompila el regex por línea — **Corregido**
**Síntoma:** `validateSemantics` construía `new RegExp(...)` por cada línea visitada en cada scope.

**Fix registrado:**
- `SD2_CALL_REGEX` elevado a constante de módulo;
- `lastIndex` reseteado antes de cada línea.

---

# 3. Sprint de hardening del core (specs 063–082)

**Resultado global:** 275 tests verdes.

## Resueltos
- **Spec 063 — Sub-scope tracker.** `parsing/controlBlocks.ts` con `scanControlBlocks()`; cierra B148.
- **Spec 064 — Multi `type ... within` real.** `documentAnalysis` resuelve `containerName` por anidación efectiva; cierra B147.
- **Spec 065 — `getScopeAt` O(log n).** Índice plano ordenado por `startLine`.
- **Spec 067 — Default param values.** `pushScopeArguments` ignora lo posterior a `=`.
- **Spec 069 — `try/catch/finally` tracking.** Cubierto por `controlBlocks`.
- **Spec 071 — Stable scope IDs.** `stableScopeId(container, name)` en minúsculas.
- **Spec 072 — Dedup robusto.** `mapToSemanticFacts` deduplica por `(kind, container, name)`.
- **Spec 073 — Cancelación cooperativa.** `workspaceIndexer` re-comprueba `token.isCancelled` tras yield.
- **Spec 074 — Document fingerprint.** `DocumentAnalysis.fingerprint` FNV-1a 32-bit.
- **Spec 075 — URI normalization.** `projectRegistry` normaliza marker URIs y libraries.
- **Spec 078 — SD8 declaración duplicada.** Warning por nombre local duplicado.
- **Spec 079 — SD9 `return` huérfano.** Warning fuera de function/subroutine/event/on.
- **Spec 080 — SD10 `exit`/`continue` huérfano.** Warning fuera de bucle.
- **Spec 081 — `END_GENERIC_PATTERN` fuera de SD2.** `visitScopes` enumera cierres reales.
- **Spec 082 — EOF estable.** Regresión preventiva documentada.

## Confirmados como ya correctos
- **Spec 076** (`next [var]` vs `next_xxx`).
- **Spec 077** (`do ... loop while|until expr`).

## Documentación / consumo
- **Spec 066** multi-line impl header con `&`: documentado, sin cambio invasivo.
- **Spec 068** `static`: sin evidencia real en corpus actuales.
- **Spec 070** consumidor centralizado de stripper: ya mayoritariamente cubierto por `analysis.strippedLines`.

---

# 4. Sprint de hardening 2 (specs 083–102)

**Resultado global:** 278 tests verdes (275 baseline + 3 nuevos).

## Resueltos
- **Spec 083 — analysisCache LRU bound.** `MAX_CACHED_ANALYSES = 256`.
- **Spec 084 — Invalidación en cascada.** Limpia también `DocumentCache` y `KnowledgeBase`.
- **Spec 085 — URI normalization en boundary.** `getDocumentAnalysis` normaliza la URI al guardar/leer cache.
- **Spec 087 — BOM strip.** U+FEFF eliminado antes de tokenizar.
- **Spec 092/093/094 — Diagnostic dedup + cap.** dedup + máximo 500 diagnósticos por archivo.
- **Spec 095 — PROGRESS_INTERVAL configurable.** `PB_PROGRESS_INTERVAL`.
- **Spec 096 — projectRegistry orden estable.** listas ordenadas alfabéticamente.
- **Spec 097 — Indexer orden estable.** archivos procesados en orden lexicográfico.
- **Spec 099 — getStats expone indexedScopes.** observabilidad del coste del scopeIndex.
- **Spec 100 — Perf log opt-in.** `PB_PERF_LOG=1` advierte si `analyzeDocument` supera 100ms.
- **Spec 101 — Test fingerprint estable.** contrato FNV-1a determinista.
- **Spec 102 — Test containerAt anidado.** varios `type within`.

## Confirmados como ya correctos
- **Spec 086** `findDefinition` case-insensitive.
- **Spec 088** default param stripper ya cubierto.
- **Spec 089** `matchVariableDeclaration` robusto.
- **Spec 090** `stripCommentsSmart` sin sangrado entre líneas.
- **Spec 091** `getScopeAt` defensivo.
- **Spec 098** `KnowledgeBase.removeDocument` limpia estructuras relevantes.

---

# 5. Sprint de hardening 3 (specs 103–132)

**Resultado global:** 287 tests pasando (278 baseline + 9 nuevos), sin regresiones.

## Wave A — Wiring de features existentes
- **Spec 103 — Code actions wiring.** `provideCodeActions` conectado.
- **Spec 104 — CodeLens wiring.** `provideReferenceCodeLenses` conectado.
- **Spec 105 — Rename wiring.** `onPrepareRename` + `onRenameRequest` con `validateRenameTarget`.
- **Spec 106 — Execute command.** comando `powerbuilder.showStats`.
- **Spec 107 — Server stats snapshot.** snapshot agregado de KB, scheduler y workspace.

## Wave B — Análisis core
- **Spec 108 — Logical statements.** `DocumentAnalysis.logicalStatements`.
- **Spec 109 — findCallable.** `KnowledgeBase.findCallable(name, container?)`.
- **Spec 110 — Signature label.** `enrichEntity` deriva `signatureLabel` y `kindLabel`.
- **Spec 111 — Fingerprint shortcut.** reuse sin reparseo si el contenido es idéntico.
- **Spec 112 — Analysis cache stats.** `getAnalysisCacheStats()`.

## Wave C — Diagnostics nuevos
- **Spec 113 — SD11 unreachable.** línea ejecutiva tras `return` en el mismo bloque.
- **Spec 114 — SD12 unbalanced parens.** conteo simple por línea.
- **Spec 115 — SD13 missing return.** función con `returnType` declarado sin `return`.
- **Spec 116 — Severity overrides.** `PB_SEVERITY_OVERRIDES`.
- **Spec 117 — Diagnostics summary.** `getDiagnosticsSummary(uri?)`.

## Wave D — Cache y serving
- **Spec 118 — ServingCache TTL.** eviction al expirar.
- **Spec 119 — HotContextCache cap.** LRU explícito de 128 tipos.
- **Spec 120 — DocumentCache uris.** `getCachedUris()` y `getStats()`.
- **Spec 121 — ServingCache stats.** hits/misses/evictions/ttl.
- **Spec 122 — KB resync batch.** `resyncDocuments(updates[])`.

## Wave E — Indexer y scheduler
- **Spec 123 — File state machine.** `FileIndexState` y `getFileIndexState(uri)`.
- **Spec 124 — Active priority.** `indexWorkspace(..., activeUri?)` mueve el archivo activo al frente.
- **Spec 125 — Time slice budget.** `PB_TIME_SLICE_MS`.
- **Spec 126 — Max file bytes.** `PB_MAX_FILE_BYTES` con `Skipped` para archivos enormes.
- **Spec 127 — Indexer status.** `getIndexerStatus()`.

## Wave F — Tools y regresión
- **Spec 128 — Public API stats.** `ApiServerStats`.
- **Spec 129 — Public API project.** `ApiProjectInfo`.
- **Spec 130 — Public API diag tree.** `ApiDiagnosticsTreeNode`.
- **Spec 131 — Perf regression.** `perfRegression.test.ts`.
- **Spec 132 — Corpus regression.** `corpusRegression.test.ts` con fragmentos canónicos.

## Resultado funcional destacado
- 4 capabilities LSP nuevas:
  - codeAction;
  - codeLens;
  - rename;
  - executeCommand.

---

# 6. Notas de absorción / trazabilidad

## Ítems absorbidos en backlog activo nuevo

Los siguientes ítems no aparecen ya como piezas separadas en el backlog activo nuevo porque su evolución queda absorbida en líneas más fuertes del core:

- **B135** → absorbido por el snapshot semántico canónico y el nuevo núcleo documental.
- **B136** → absorbido por la línea de semantic evidence de primera clase.
- **B137** → absorbido por ancestor navigation + hierarchy inspection.

## Ítems parciales que permanecen en el backlog activo

Tras la normalización 2026-05, las antiguas épicas legacy ya no viven como `Partial`: vuelven a `Open` cuando el trabajo pendiente no cabe honestamente en un único corte. Después de `Specs 198-218`, ya no queda ningún residual `Partial` heredado de esa ola: `B141A` se cierra con `Spec 218` y el resto del trabajo abierto debe seguir leyéndose directamente desde el backlog activo bajo estado `Open`, `Ready for closure` o `Blocked`.

---

# 7. Uso recomendado

- Usar este archivo como **histórico técnico de referencia**.
- Usar el **backlog activo** para planificación diaria.
- No volver a mezclar aquí trabajo abierto salvo que se cierre completamente.
