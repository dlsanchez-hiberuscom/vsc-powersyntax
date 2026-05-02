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
### B107. Status bar con contexto de proyecto — **Cerrada (spec 052 + cierre runtime 2026-05)**

**Resumen del bloque cerrado:**
- modernización/obsoletas cubierta;
- hover enriquecido con metadatos útiles;
- `ON object_name.event_name` mejor soportado;
- comando de información del objeto operativo;
- barra de estado unificada con resumen del proyecto activo, estado de `projectModel`, caches/persistencia y accesos rápidos a stats/salud/build.

---

## 1.5 P4 — Escala, validación continua y rendimiento

### B127. File watcher estratificado y debounce de invalidación — **Cerrada (spec 043)**
### B128. Estados de readiness del workspace — **Cerrada (spec 044)**
### B129. Fairness por proyecto/root en background indexing — **Cerrada (spec 058)**

**Resumen del bloque cerrado:**
- invalidación agrupada y más estable;
- readiness del workspace formalizado;
- fairness por root/proyecto incorporada.

### B030. Validación sobre workspace grande real — **Cerrada (validación PFC + legacy 2026-05)**
**Objetivo:** validar sobre PFC 2025 Solution/Workspace y corpus legacy.

**Resultado registrado:**
- PFC 2025 Workspace y PFC 2025 Solution quedan integrados como corpus reales del ciclo;
- se añadió un slot legacy reproducible en `fixtures-local/public/legacy-pbl-dump` con helper dedicado y smoke real sobre fuente exportada;
- `test/corpora/README.md` documenta la preparación reproducible y `docs/testing.md` la referencia como matriz activa de corpus.

**Validación registrada:**
- `npm run test:performance -- --grep "(PFC Workspace smoke|PFC Solution smoke|legacy PBL dump smoke)"`
- `npm run test:smoke -- --grep "smoke/pfc-solution-extension"`

### B069. Fixtures reales permanentes de PFC/legacy — **Cerrada (fixtures locales controlados 2026-05)**
**Objetivo:** fixtures permanentes y mantenidos.

**Resultado registrado:**
- `fixtures-local/pfc/2025-Workspace` y `fixtures-local/pfc/2025-Solution` quedan fijados como fixtures reales del producto;
- `fixtures-local/public/legacy-pbl-dump` queda formalizado como slot local permanente para regresión legacy;
- `test/README.md` y `test/server/helpers/publicCorpusPaths.ts` dejan trazado estable para mantener estos corpus fuera de Git y dentro del ciclo de regresión.

**Validación registrada:**
- `npm run test:performance -- --grep "(PFC Workspace smoke|PFC Solution smoke|legacy PBL dump smoke)"`
- `npm run test:smoke -- --grep "smoke/pfc-solution-extension"`

### B221. PowerBuilder public corpus matrix — **Cerrada (matriz reproducible 2026-05)**
**Objetivo:** definir matriz reproducible de corpus públicos PowerBuilder para validar parsing, discovery, serving y performance.

**Resultado registrado:**
- `test/corpora/README.md` define matriz pública reproducible con PFC 2025 Solution, PFC 2025 Workspace, DataWindow examples, PBL dump examples, ORCA/build examples, native/PBNI examples y modern JSON/WebView2 examples;
- la matriz documenta criterios de inclusión/exclusión y modo de descarga/preparación local;
- el ciclo actual deja trazado qué corpus están ya integrados de forma ejecutable y cuáles quedan listos para activarse por área.

**Validación registrada:**
- auditoría documental local de la matriz reproducible;
- `npm run test:performance -- --grep "(PFC Workspace smoke|PFC Solution smoke|legacy PBL dump smoke)"`

### B118. Integration test matrix del plugin — **Cerrada (smoke matrix 2026-05)**
**Objetivo:** lifecycle real del plugin y workspaces reales.

**Resultado registrado:**
- `test/smoke/extension.test.ts` cubre activación y API pública mínima en `vscode-test`;
- `test/smoke/pfc-solution.extension.test.ts` valida el ciclo real sobre PFC Solution;
- `test/smoke/pfc-workspace.extension.test.ts` completa la matriz real sobre PFC Workspace;
- la documentación de testing y corpus deja trazado explícito qué cubre esta matriz y sobre qué corpus se ejecuta.

**Validación registrada:**
- `npm run test:smoke -- --grep "smoke/(extension|pfc-solution-extension|pfc-workspace-extension)"`

### B068. Calibración real del performance budget — **Cerrada (baseline real 2026-05)**
**Objetivo:** convertir budgets teóricos en budgets medidos.

**Resultado registrado:**
- `docs/performance-budget.md` deja de tratar discovery/cold/warm/archivo activo como objetivos solo teóricos y fija budgets ejecutables sobre corpus reales;
- `test/results/003-real-corpora-baseline.md` registra la medición base sobre PFC Workspace/Solution y legacy PBL dump;
- la calibración actual queda trazada para revisión futura sin mezclarla con presupuestos de memoria aún pendientes.

**Validación registrada:**
- `npm run test:performance`

### B119. Performance regression suite — **Cerrada (suite real 2026-05)**
**Objetivo:** medir activación, primer hover, primer diagnostics, discovery, warm/cold index.

**Resultado registrado:**
- la suite de performance ya cubre discovery sobre PFC, cold/warm index, batch documental sobre corpus real, primer hover y primeros diagnostics del archivo activo;
- la activación real queda cubierta por la matriz smoke sobre `vscode-test` y corpus PFC;
- la base queda trazada en `test/results/003-real-corpora-baseline.md` para detectar regresiones futuras.

**Validación registrada:**
- `npm run test:performance`
- `npm run test:smoke -- --grep "smoke/(extension|pfc-solution-extension|pfc-workspace-extension)"`

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

## 1.7A Gobernanza documental IA y docs de producto

### B201. IA-first documentation reorganization — **Cerrada**
**Objetivo:** reorganizar la documentación para que IA tenga ruta clara, sin duplicidades ni contradicciones.

**Resultado registrado:**
- `docs/00-ai-entrypoint.md` creado como puerta de entrada mínima y orden de lectura;
- `docs/product-operating-model.md` ampliado como documento propietario del modelo operativo;
- `docs/current-focus.md` simplificado para exponer un único foco ejecutable;
- `docs/spec-driven-development.md` y `docs/constitution.md` alineados con la ruta documental y el Definition of Done;
- catálogo de agentes y propiedad única de información consolidados en la capa documental;
- baseline de validación reforzado en `docs/testing.md`;
- documento de referencia de `plugin_old` reformulado como `docs/plugin-old-migration-opportunities.md`.

**Validación registrada:**
- auditoría documental local contra criterios de cierre en backlog;
- comprobación manual de orden de lectura, propiedad única y ausencia de contradicción operativa en docs canónicas.

### B202. Rules catalog and diagnostics governance — **Cerrada**
**Objetivo:** crear catálogo versionado de reglas diagnósticas.

**Resultado registrado:**
- `docs/rules-catalog.md` define plantilla canónica con ID estable, severidad, readiness, confidence, alcance, riesgo de falso positivo, tests y docs relacionadas;
- se documentaron reglas estructurales, de símbolos, DataWindow, PBL/ORCA y externas con contratos consistentes.

**Validación registrada:**
- auditoría documental local de presencia de IDs, severidad, readiness, confidence, falsos positivos y tests en el catálogo.

### B203. Developer workflows documentation — **Cerrada**
**Objetivo:** documentar workflows reales de programación PowerBuilder.

**Resultado registrado:**
- `docs/developer-workflows.md` fija workflows canónicos para apertura de proyecto, entendimiento del objeto actual, navegación de herencia, DataWindows, build y preparación de contexto para IA;
- backlog y roadmap ya pueden evaluarse contra workflows reales de valor profesional y no contra demos aisladas.

**Validación registrada:**
- auditoría documental local de cobertura de workflows visibles y trazabilidad con prioridades de producto.

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

## 1.36 B171. Confidence gates por feature — **Cerrada (runtime coverage 2026-05)**

**Objetivo:** que cada feature opere solo con el nivel de confianza adecuado.

**Resultado registrado:**
- `src/server/features/featureReadiness.ts` ya fija comparador, thresholds mínimos y decisión base por feature;
- `src/server/features/servingReadiness.ts` encapsula el gate de runtime consumido por los handlers sensibles;
- `src/server/server.ts` reutiliza ese gate en `references`, `prepareRename` y `rename` para devolver fallback seguro y mensaje estable cuando la confidence no alcanza el umbral requerido;
- `test/server/unit/servingReadiness.test.ts` aporta evidencia negativa ejecutable para `references` y `rename` bajo confidence insuficiente, además del caso positivo con confidence alta.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(servingReadiness|featureReadiness)"`

## 1.37 B167. Journaling transaccional de caché persistente — **Cerrada (recovery robusto 2026-05)**

**Objetivo:** evitar corrupción de caché y estados incompletos.

**Resultado registrado:**
- `src/server/cache/cacheStore.ts` mantiene journal persistente, lo limpia al consolidar checkpoint y recompone el restore aplicando solo entradas válidas;
- el loader distingue ahora entre estado ausente y payload JSON corrupto/truncado, forzando rebuild limpio cuando el journal o el checkpoint quedaron a medias;
- la validación existente de secuencia y entradas del journal en `src/server/cache/cacheCheckpoint.ts` queda reforzada por recovery explícito ante corrupción parcial en disco;
- `test/server/unit/cacheStore.test.ts` y `test/server/unit/cachePersistence.test.ts` cubren limpieza del journal, secuencias inválidas y truncado/corrupción parcial del estado persistido.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(cacheStore|cachePersistence)"`

## 1.38 B168. Cache schema versioning + migraciones — **Cerrada (policy/documentation 2026-05)**

**Objetivo:** versionar persistencia y decidir migrate/invalidate/rebuild con seguridad.

**Resultado registrado:**
- `src/server/cache/cacheSchema.ts` mantiene un schema persistente explícito para `checkpoint` y `journal`, con migradores internos para payloads compatibles del mismo corte;
- `src/server/cache/cacheCheckpoint.ts` conserva la política canónica: payload compatible se normaliza y reutiliza, `schemaVersion` desconocido o incompatible fuerza `rebuild` limpio;
- `docs/architecture.md` documenta la política oficial de migrate/rebuild y el contenido del schema persistente para checkpoint y journal;
- `test/server/unit/cachePersistence.test.ts` cubre tanto el camino compatible sin `schemaVersion` explícito como el rebuild seguro por versión incompatible.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/cachePersistence"`

## 1.39 B071. Warm indexing y resume de caché persistente — **Cerrada (observable closure 2026-05)**

**Objetivo:** evitar cold indexing en cada reapertura.

**Resultado registrado:**
- la base de persistencia ya permite warm resume real de `DocumentCache` y `KnowledgeBase`, con reuse/rebuild seguro sobre `cacheStore` y `checkpoint` persistido;
- `test/results/003-real-corpora-baseline.md` deja medido el delta cold/warm en corpus grandes reales de PFC Workspace;
- `src/shared/publicApi.ts`, `src/server/server.ts` y `src/client/statusBarPresentation.ts` exponen ahora en stats/status si la reapertura quedó en `restored`, `reused` o `rebuilt`, junto con el número de documentos restaurados y la snapshot de serving reaprovechada;
- la barra de estado y sus reportes dejan visible ese estado sin depender solo de logs internos.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(statusBarPresentation|publicApi)"`
- `npm run test:performance`

## 1.40 B205. PowerBuilder grammar canonical module — **Cerrada (shared grammar consolidation 2026-05)**

**Objetivo:** centralizar patrones, keywords y matchers estructurales de PowerBuilder en un módulo canónico.

**Resultado registrado:**
- `src/server/parsing/grammar.ts` consolida keywords, matchers de secciones, bloques ejecutables y patrones estructurales reutilizados por parsing y diagnostics;
- `src/server/parsing/controlBlocks.ts`, `src/server/parsing/sectionMachine.ts`, `src/server/features/diagnosticsExtra.ts` y `src/server/analysis/documentAnalysis.ts` dejan de duplicar regex críticas y consumen patrones compartidos o matchers canónicos;
- la suite de gramática queda reforzada con cobertura de `type prototypes` y `owner type variables` en `test/server/unit/sectionMachine.test.ts`.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(sectionMachine|matchers|documentAnalysis|diagnosticsExtra)"`

## 1.41 B036. Code actions básicas — **Cerrada (safe quick-fix baseline 2026-05)**

**Objetivo:** quick fixes pequeños, seguros y explicables.

**Resultado registrado:**
- `src/server/features/codeActions.ts` fija un catálogo mínimo y estable sobre SD7, limitado a un reemplazo simple dentro del rango diagnosticado;
- cada action expone metadata explícita de `evidence`, `confidence` y tipo de edición segura;
- el provider rechaza sugerencias no seguras fuera del patrón de identificador simple, evitando modificaciones peligrosas o ambiguas.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/codeActions"`

## 1.42 B160. Query result cache con claves semánticas estables — **Cerrada (observable serving cache 2026-05)**

**Objetivo:** cachear respuestas semánticas seguras.

**Resultado registrado:**
- `src/server/knowledge/ServingCache.ts` deja cubiertas claves estables para `hover`, `definition`, `signatureHelp` y `completion`, incluyendo discriminadores extra y epoch semántica;
- `src/server/server.ts` reutiliza `resolveServingReadiness` también en cache hits de `definition`, de modo que el resultado cacheado sigue respetando readiness y `resolutionConfidence` antes de servirse;
- `src/shared/publicApi.ts` y `src/client/statusBarPresentation.ts` hacen observable el hit ratio, misses y evictions del serving cache en stats y status.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(ServingCache|servingReadiness|statusBarPresentation)"`

## 1.43 B157. Semantic evidence de primera clase — **Cerrada (diagnostics parity 2026-05)**

**Objetivo:** modelar formalmente por qué una resolución ganó o fue descartada.

**Resultado registrado:**
- el query engine ya dejaba cubiertos `winner evidence`, `candidatePool`, descartes por distancia/contexto, ambigüedad mínima, `confidence`, `queryContext`, `queryTrace`, hover y policy base por feature;
- `src/server/features/diagnostics.ts` reutiliza ahora `semanticQueryService` también para SD2, evitando reconstruir resolución local y proyectando un resumen seguro de `confidence`, `reasonCodes`, `evidenceKinds` y cardinalidad en `Diagnostic.data`;
- diagnostics, stats/API y consumers sensibles quedan alineados sobre la misma semántica explicable sin abrir una segunda lógica de resolución.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/diagnostics"`

## 1.44 B031. Referencias más precisas y robustas — **Cerrada (topología real + masking + family filtering 2026-05)**

**Objetivo:** referencias cross-file y contexto fuerte sin matching superficial.

**Resultado registrado:**
- `src/server/server.ts` deja de limitar `references` a documentos abiertos y pasa a recopilar fuentes sobre `WorkspaceState`, preservando además documentos abiertos fuera del inventario para no perder contexto activo;
- `src/server/features/references.ts` deja de escanear contenido crudo y reutiliza el masking canónico de strings/comentarios antes del matching textual, evitando falsos positivos en literales y comentarios;
- cada ocurrencia candidata se revalida contra la misma familia semántica resuelta por el query engine compartido, de modo que owners homónimos no contaminan el resultado aunque exista match textual coincidente;
- el resultado sigue bloqueado o habilitado por `confidence/readiness` del runtime ya cerrados en `B171`, manteniendo `references` explicable sobre topología real sin reabrir una segunda lógica de resolución.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/references"`
- `npm run test:unit -- --grep "unit/queryEngineConsistency"`
- `npm run test:unit -- --grep "unit/codeLensReferences|unit/references|unit/queryEngineConsistency|unit/featureReadiness"`

## 1.45 B155. Checkpoints reales de indexación y resume robusto — **Cerrada (discovery snapshot + restore temprano validado 2026-05)**

**Objetivo:** reaperturas rápidas y resume seguro del pipeline.

**Resultado registrado:**
- `src/server/cache/cacheSchema.ts` y `src/server/cache/cacheCheckpoint.ts` amplían el contrato persistente con un snapshot explícito de discovery (`roots` + `sourceFiles`) normalizado junto a la metadata ya existente del checkpoint;
- `src/server/workspace/workspaceState.ts` expone export/restore/reemplazo controlado del snapshot de discovery para separar el estado restaurado del estado redescubierto sin contaminar el inventario real del workspace;
- `src/server/server.ts` aplica ahora restore temprano de `DocumentCache`, `KnowledgeBase`, serving snapshot y discovery snapshot antes del redescubrimiento, ejecuta el discovery real sobre un `WorkspaceState` temporal y valida después la metadata completa antes de indexar o conservar el resume;
- el servidor siembra además un checkpoint actualizado justo tras discovery, de modo que una sesión interrumpida durante la indexación ya conserva discovery/readiness base y puede reencolar solo trabajo pendiente o incompatible en la reapertura siguiente.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/workspace|unit/cachePersistence"`
- `npm run test:unit -- --grep "unit/cacheStore|unit/statusBarPresentation|unit/publicApi"`

## 1.46 B032. Rename controlado — **Cerrada (queryContext real + workspace edit seguro + bloqueo dinámico 2026-05)**

**Objetivo:** ampliar rename solo en escenarios semánticamente seguros.

**Resultado registrado:**
- `src/server/features/rename.ts` introduce un helper puro que reutiliza `queryContext`, `references` y `renamePreflight` para construir `WorkspaceEdit` solo cuando existe un target único y seguro;
- `src/server/server.ts` deja de renombrar por scope léxico local y delega `onRenameRequest` al helper semántico con fuentes reales del workspace;
- el rename queda habilitado para variables locales, parámetros y miembros resueltos por qualifier/hierarchy con confidence alta, y bloqueado con razón estable ante ambigüedad, fallback global o hits dinámicos en strings;
- `test/server/unit/rename.test.ts` cubre parámetros locales, miembros tipados cross-file, bloqueo por fallback global y bloqueo por referencias dinámicas.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/rename|unit/renamePreflight"`
- `npm run test:unit -- --grep "unit/dynamicStringReferences|unit/rename|unit/renamePreflight|unit/references|unit/queryEngineConsistency|unit/featureReadiness|unit/servingReadiness|unit/codeLensReferences"`

## 1.47 B208. Dynamic string reference detector — **Cerrada (clasificación conservadora + degradación honesta 2026-05)**

**Objetivo:** detectar referencias relevantes en strings dinámicos y degradar operaciones peligrosas cuando no exista cobertura fiable.

**Resultado registrado:**
- `src/server/features/dynamicStringReferences.ts` añade un detector reusable con clasificación `safe-literal`, `probable`, `dynamic`, `unknown` sobre `Open`, `DataObject`, `PostEvent`, `TriggerEvent`, `EvaluateJavascriptSync/Async`, JSON paths, SQL dinámico y `Describe/Modify/Evaluate`;
- `src/server/features/rename.ts` bloquea el rename cuando el símbolo aparece en un hit no seguro dentro de strings dinámicos;
- `src/server/features/references.ts` degrada a definiciones cuando detecta ese riesgo, evitando prometer cobertura textual completa en presencia de referencias dinámicas;
- la surface actual de code actions sigue siendo un quick-fix local de diagnóstico de rango único, por lo que no necesita una ruta adicional de degradación semántica para este cierre.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/dynamicStringReferences|unit/rename|unit/renamePreflight|unit/references"`
- `npm run test:unit -- --grep "unit/dynamicStringReferences|unit/rename|unit/renamePreflight|unit/references|unit/queryEngineConsistency|unit/featureReadiness|unit/servingReadiness|unit/codeLensReferences"`

## 1.48 B204. Source origin model unificado — **Cerrada (contrato compartido + persistence + API/diagnostics 2026-05)**

**Objetivo:** clasificar de forma uniforme el origen de cada documento, símbolo y snapshot semántico.

**Resultado registrado:**
- `src/shared/sourceOrigin.ts` introduce un contrato compartido de `sourceOrigin` con prioridad explícita entre source real, staging, export, generated, backup y unknown;
- `src/server/workspace/workspaceState.ts`, `src/server/workspace/discovery.ts`, `src/server/cache/cacheSchema.ts` y `src/server/cache/cacheCheckpoint.ts` persisten y restauran origen por archivo junto al snapshot de discovery del workspace;
- `src/server/analysis/documentAnalysis.ts`, `src/server/knowledge/types.ts` y `src/server/knowledge/resolution/semanticQueryService.ts` propagan `sourceOrigin` a lineage y evidence del query engine;
- `src/server/features/diagnostics.ts`, `src/server/features/diagnosticsSnapshot.ts`, `src/server/features/workspaceSymbols.ts`, `src/server/server.ts` y `src/client/extension.ts` exponen `sourceOrigin` en diagnostics snapshot, stats y API pública de `querySymbols()` sin abrir una surface paralela.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/sourceOrigin|unit/workspace|unit/cachePersistence|unit/publicApi"`
- `npm run test:unit -- --grep "unit/sourceOrigin|unit/workspace|unit/cachePersistence|unit/publicApi|unit/workspaceSymbols|unit/diagnosticsSnapshot|unit/diagnostics"`
- `npm run test:unit -- --grep "unit/sourceOrigin|unit/workspace|unit/cachePersistence|unit/publicApi|unit/workspaceSymbols|unit/diagnosticsSnapshot|unit/diagnostics|unit/queryEngineConsistency|unit/references|unit/rename|unit/renamePreflight|unit/featureReadiness|unit/servingReadiness"`

## 1.49 B206. Rich PowerBuilder symbol metadata — **Cerrada (metadata contractual viva + hover/document analysis 2026-05)**

**Objetivo:** enriquecer progresivamente el modelo de símbolo con metadata específica de PowerBuilder.

**Resultado registrado:**
- `src/server/analysis/documentAnalysis.ts`, `src/server/model/types.ts` y `src/server/knowledge/types.ts` propagan `containerKind`, `containerSignature`, `fileObjectName`, `declarationScope`, `implementationKind`, `ownerName`, `parameterCount`, `returnType`, `access` y `sourceOrigin` en el modelo real cuando aplica;
- `src/server/knowledge/enrichEntity.ts` consolida derivaciones estables para `ownerName`, `declarationScope` e `implementationKind`, incluyendo distinción explícita entre `on-handler` y `external-function`;
- `src/server/features/hoverFormat.ts` consume esa metadata para explicar prototype, implementation, on-handler, external function, member/local/parameter y owner real sin recomputar semántica fuera del backbone;
- `src/server/knowledge/stringInterning.ts` y `src/server/knowledge/semanticDiff.ts` incorporan los nuevos campos para que la metadata enriquecida participe en internado, diff y persistencia sin modelos paralelos.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/documentAnalysis|unit/enrichEntity|unit/hoverFormat"`
- `npm run test:unit -- --grep "unit/documentAnalysis|unit/enrichEntity|unit/hoverFormat|unit/hover|unit/semanticTokens|unit/documentSymbols|unit/references|unit/rename|unit/renamePreflight|unit/queryEngineConsistency"`
- `npm run test:unit -- --grep "unit/documentAnalysis|unit/enrichEntity|unit/hoverFormat|unit/hover|unit/documentSymbols|unit/references|unit/rename|unit/renamePreflight|unit/queryEngineConsistency|unit/cachePersistence|unit/workspaceSymbols"`

## 1.50 B209. PowerBuilder call model and invocation classification — **Cerrada (invocationKind/invocationRisk + parent/ancestor 2026-05)**

**Objetivo:** clasificar llamadas PowerBuilder según forma y riesgo semántico.

**Resultado registrado:**
- `src/server/utils/invocationContext.ts` distingue ya `.` y `::`, preservando la forma sintáctica de invocación para `this`, `parent`, `super`, `ancestor` y qualifiers tipados;
- `src/server/knowledge/resolution/semanticQueryService.ts` resuelve el current object real por línea/scope, añade `invocationKind`, `invocationRisk` y `resolvedQualifierType`, y soporta `parent.uf_xxx()` y `ancestor::event` como rutas explícitas del query engine compartido;
- `src/server/features/queryContext.ts`, `src/server/knowledge/queryTrace.ts` y `src/shared/publicApi.ts` propagan la clasificación de invocación a traces y contexto compartido, de modo que definition/references/rename/completion/signatureHelp puedan explicar cómo se resolvió cada callsite;
- los tests focalizados cubren `invocationContext`, `queryContext`, `semanticQueryService` y `definition`, y la validación lateral mantiene verdes `references`, `rename`, `renamePreflight`, `queryEngineConsistency`, `completion` y `signatureHelp`.

**Validación registrada:**
- `npm run test:unit -- --grep "server/utils/invocationContext|unit/queryContext|unit/semanticQueryService|unit/definition"`
- `npm run test:unit -- --grep "server/utils/invocationContext|unit/queryContext|unit/semanticQueryService|unit/definition|unit/references|unit/rename|unit/renamePreflight|unit/queryEngineConsistency|unit/completion|unit/signatureHelp"`

## 1.51 B210. PowerBuilder event model — **Cerrada (owner real + TriggerEvent/PostEvent estables 2026-05)**

**Objetivo:** modelar eventos PowerBuilder como entidades semánticas de primera clase.

**Resultado registrado:**
- `src/server/parsing/grammar.ts`, `src/server/parsing/matchers.ts` y `src/server/model/types.ts` separan owner y event name en `on object.event`, preservando además la firma cualificada original del handler;
- `src/server/analysis/documentAnalysis.ts` cuelga el scope del evento del owner real, estabiliza `containerName`/`ownerName` de on-handlers y deja de modelar los eventos como nombres planos `owner.event` dentro del backbone semántico;
- `src/server/utils/invocationContext.ts`, `src/server/features/queryContext.ts`, `src/server/features/definition.ts` y `src/server/features/references.ts` sintetizan contexto semántico para literales estables de `TriggerEvent/PostEvent`, permitiendo navegación y referencias sobre eventos reales sin abrir un motor paralelo;
- la validación lateral mantiene verdes `hover`, `hoverFormat`, `documentSymbols`, `semanticTokens`, `completion`, `signatureHelp`, `rename`, `renamePreflight`, `dynamicStringReferences` y `queryEngineConsistency` sobre el modelo nuevo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/matchers|unit/documentAnalysis|unit/definition"`
- `npm run test:unit -- --grep "server/utils/invocationContext|unit/queryContext|unit/definition|unit/references"`
- `npm run test:unit -- --grep "unit/matchers|unit/documentAnalysis|server/utils/invocationContext|unit/queryContext|unit/definition|unit/references|unit/rename|unit/renamePreflight|unit/queryEngineConsistency|unit/hover|unit/hoverFormat|unit/documentSymbols|unit/semanticTokens|unit/completion|unit/signatureHelp|unit/dynamicStringReferences"`

## 1.52 B207. External functions and native dependency model — **Cerrada (dll/pbx/unknown + degradación honesta 2026-05)**

**Objetivo:** modelar funciones externas, DLL/PBX/PBNI y dependencias nativas sin tratarlas como símbolos internos.

**Resultado registrado:**
- `src/server/parsing/externalFunctions.ts`, `src/server/model/types.ts`, `src/server/knowledge/types.ts` y `src/server/analysis/documentAnalysis.ts` conservan ya librería, alias y clasificación `dll`/`pbx`/`unknown` en el modelo real de external functions/subroutines;
- `src/server/features/hoverFormat.ts` explica dependencia externa, alias y tipo nativo, mientras `src/server/features/rename.ts` bloquea rename y `src/server/features/references.ts` degrada a la declaración cuando el target es externo;
- `src/server/features/diagnostics.ts` emite una nota informativa para dependencias nativas sin implementación interna navegable, evitando presentar la declaración externa como definition interna del workspace;
- `src/server/knowledge/stringInterning.ts`, `src/server/knowledge/semanticDiff.ts`, `unit/cachePersistence` y `unit/workspaceSymbols` validan que la metadata nativa no quede muerta fuera del path inmediato de hover/serving.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/externalFunctions|unit/documentAnalysis|unit/hoverFormat|unit/rename|unit/references|unit/diagnostics"`
- `npm run test:unit -- --grep "unit/externalFunctions|unit/documentAnalysis|unit/hoverFormat|unit/hover|unit/rename|unit/renamePreflight|unit/references|unit/diagnostics|unit/queryEngineConsistency|unit/semanticQueryService|unit/cachePersistence|unit/workspaceSymbols"`

## 1.53 B211. Transaction and SQLCA semantic model — **Cerrada (SQLCA especial + binding básico transaction/DataWindow 2026-05)**

**Objetivo:** modelar `Transaction`, `SQLCA`, `SetTransObject`, `SetTrans`, `Retrieve`, `Update` y SQL embebido sin semántica plana ni inventada.

**Resultado registrado:**
- `src/server/knowledge/resolution/semanticQueryService.ts` y `src/server/features/queryContext.ts` tratan ya `SQLCA` como transaction global especial, estabilizando el owner-type de `SQLCA.*` dentro del query engine compartido;
- `src/server/features/completion.ts`, `src/server/features/hover.ts` y `src/server/features/signatureHelp.ts` resuelven members del catálogo filtrando por `ownerType`, con lo que `datastore/datawindow.Retrieve`, `Update`, `SetTransObject`, `SetTrans` y `SQLCA.DBHandle()` explican la entrada correcta del catálogo en vez de una coincidencia plana por nombre;
- `src/server/features/diagnostics.ts` enlaza `SetTransObject`/`SetTrans` con `Retrieve`/`Update`, informa transaction desconocida y degrada la confidence cuando el binding es dinámico;
- la parte de SQL estático/dinámico reaprovecha las piezas ya cerradas en `sqlRegions` y `dynamicStringReferences`, sin abrir un motor paralelo para B211.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/completion"`
- `npm run test:unit -- --grep "unit/diagnostics"`
- `npm run test:unit -- --grep "unit/(hover|signatureHelp)"`
- `npm run test:unit -- --grep "unit/(completion|diagnostics|hover|signatureHelp|sqlRegions|dynamicStringReferences)"`

## 1.54 B213. PowerBuilder object lifecycle model — **Cerrada (create/destroy + hooks constructor/destructor 2026-05)**

**Objetivo:** modelar create/destroy, constructor/destructor y ancestor flow sin tratarlos como eventos o wiring planos.

**Resultado registrado:**
- `src/server/features/hierarchyInspection.ts` proyecta ya lifecycle create/destroy con evidence de `call super::create/destroy`, hook disparado (`constructor/destructor`), resolución del hook y warnings suaves por wiring sospechoso desde el snapshot semántico publicado;
- `src/server/features/hover.ts` reutiliza ese mismo bloque para explicar `constructor/destructor` resueltos desde `TriggerEvent(this, ...)` y no presentarlos como eventos aislados;
- `src/server/features/diagnostics.ts` emite warnings suaves reutilizando el mismo backbone (`missing-super-*`, `missing-trigger-*`, `unresolved-*`) cuando el lifecycle declarado por el tipo es sospechoso;
- la navegación base de `call super::create` y de literales estables de `TriggerEvent/PostEvent` ya permanecía soportada por `definition` y el query engine compartido cerrado en `B210`, así que B213 se cerró como proyección consistente, no como un motor nuevo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/hierarchyInspection"`
- `npm run test:unit -- --grep "unit/hover"`
- `npm run test:unit -- --grep "unit/diagnostics"`
- `npm run test:unit -- --grep "unit/(hierarchyInspection|hover|diagnostics|definition)"`

## 1.55 B212. DataObject binding model — **Cerrada (bridge PowerScript/.srd + retrieve args 2026-05)**

**Objetivo:** modelar bindings básicos entre PowerScript, DataWindow/DataStore y objetos `.srd` sin abrir un parser DataWindow paralelo ni fingir navegación para bindings dinámicos.

**Resultado registrado:**
- `src/server/analysis/documentAnalysis.ts` publica un stub navegable para `.srd` como `datawindow`, de forma que el objeto exportado entra en `KnowledgeBase` y puede servir como target semántico sin parsear `.srd` como PowerScript;
- `src/server/features/definition.ts` y `src/server/features/hover.ts` reutilizan ese mismo backbone para navegar y explicar `DataObject = "d_xxx"` cuando el binding literal apunta a un `.srd` único ya indexado;
- `src/server/features/signatureHelp.ts` especializa `Retrieve(...)` leyendo los args reales desde `arguments=(...)` y `ARG(...)` del snapshot `.srd` enlazado por `DataObject`, en vez de quedarse en la firma plana del catálogo;
- `src/server/features/diagnostics.ts` distingue binding `DataObject` faltante, ambiguo o dinámico y además avisa cuando `Retrieve(...)` no respeta la aridad declarada por el `.srd`, compartiendo transaction, confidence y degradación honesta en el mismo flujo semántico.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(documentAnalysis|definition)"`
- `npm run test:unit -- --grep "unit/signatureHelp"`
- `npm run test:unit -- --grep "unit/diagnostics"`
- `npm run test:unit -- --grep "unit/(documentAnalysis|definition|hover|diagnostics|signatureHelp)"`

## 1.56 B222. PowerBuilder semantic golden suite — **Cerrada (backbone semántico congelado 2026-05)**

**Objetivo:** fijar con evidencia ejecutable el comportamiento semántico PowerBuilder ya soportado por el backbone compartido para detectar regresiones antes de abrir más superficie.

**Resultado registrado:**
- `test/server/unit/powerbuilderSemanticGolden.test.ts` congela scope resolution, prototypes vs implementations, herencia visible, event handlers, external functions, binding `DataObject` literal, downgrade dinámico y conflictos de `sourceOrigin` sobre fixtures reales del repositorio;
- el hallazgo de la suite destapó y corrigió un bug real en `src/server/knowledge/resolution/InheritanceGraph.ts`: para variables miembro a igual distancia de herencia, la closure ahora desempata con prioridad `Compartida -> Global -> Instancia` en vez de depender solo de la distancia;
- `definition`, `hover`, `signatureHelp`, `diagnostics`, `references` y `rename` quedan cubiertos contra esa misma base semántica sin crear harnesses paralelos ni duplicar resolución.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/powerbuilderSemanticGolden"`
- `npm run test:unit -- --grep "unit/(powerbuilderSemanticGolden|scopeResolution|semanticQueryService|definition|hover|signatureHelp|diagnostics|references|rename|renamePreflight|sourceOrigin)"`

## 1.57 B217. AI context pack for current object — **Cerrada (contexto read-only fiable 2026-05)**

**Objetivo:** servir a IA un paquete read-only del objeto activo con contexto semántico rico y trazable, sin releer todo el workspace ni reconstruir semántica fuera del backbone compartido.

**Resultado registrado:**
- `src/server/features/currentObjectContext.ts` construye ya un context pack del objeto activo a partir de `getDocumentAnalysis()`, `KnowledgeBase`, `hierarchyInspection`, diagnostics reales y bindings `DataObject`, incluyendo metadata, excerpt, `sourceOrigin`, proyecto/librería, ancestor chain, functions/events/prototypes, referenced symbols, diagnostics, evidence/confidence y related files;
- `src/server/server.ts` expone el contrato por `powerbuilder.currentObjectContext`, y `src/client/extension.ts` lo publica vía `getCurrentObjectContext()` dentro de la API pública versionada de la extensión;
- `src/server/features/diagnostics.ts` ahora comparte `buildDiagnosticsForDocument()` para que el context pack reutilice exactamente la misma lógica de diagnostics que el publish real, y `src/server/features/dataWindowBindingModel.ts` exporta un resumen de bindings reutilizable sin abrir otro parser o un flujo paralelo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/currentObjectContext"`
- `npm run test:unit -- --grep "unit/(currentObjectContext|objectInfo|hierarchyInspection|diagnostics|signatureHelp|powerbuilderSemanticGolden)"`
- `npm test -- --grep "smoke/extension"`

## 1.58 B218. Spec impact analyzer — **Cerrada (impacto read-only explícito 2026-05)**

**Objetivo:** calcular impacto probable de una spec o cambio usando el backbone semántico real, para que la IA no planifique ni edite a ciegas.

**Resultado registrado:**
- `src/server/features/impactAnalysis.ts` calcula ya símbolos afectados, referencias seguras, descendientes, overrides, eventos relacionados, DataWindows vinculadas, archivos probables de impacto y build targets conocidos reutilizando `references`, `InheritanceGraph`, `currentObjectContext` y `WorkspaceState` en un único resultado serializable;
- `src/server/server.ts` expone el análisis por `powerbuilder.analyzeImpact`, y `src/client/extension.ts` lo añade a la API pública versionada como `analyzeImpact()` sin abrir todavía ejecución automática;
- el análisis degrada con honestidad cuando no puede resolver un símbolo raíz y mantiene confidence/evidence explícitas cuando la resolución sí existe.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/impactAnalysis"`
- `npm run test:unit -- --grep "unit/(impactAnalysis|currentObjectContext|references|hierarchyInspection|diagnostics|signatureHelp|powerbuilderSemanticGolden)"`

## 1.59 B219. Safe edit plan generator — **Cerrada (plan read-only trazable 2026-05)**

**Objetivo:** generar un plan de edición seguro antes de aplicar cambios, dejando explícitos archivos/objetos, razones, riesgos, tests, docs y bloqueos por ambigüedad.

**Resultado registrado:**
- `src/server/features/safeEditPlan.ts` construye ya un plan read-only a partir del impacto explícito, clasificando archivos por rol/riesgo, agregando tests recomendados, docs a revisar y bloqueos honestos cuando la confidence no alcanza;
- `src/server/server.ts` expone el plan por `powerbuilder.safeEditPlan`, y `src/client/extension.ts` lo añade a la API pública versionada como `generateSafeEditPlan()` sin convertirlo en ejecución automática;
- el plan mantiene trazabilidad suficiente para IA: objetos afectados, razones por archivo, riesgos, confidence y casos bloqueados, pero no toca código ni finge seguridad cuando el análisis es ambiguo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/safeEditPlan"`
- `npm run test:unit -- --grep "unit/(safeEditPlan|impactAnalysis|currentObjectContext|references|hierarchyInspection|diagnostics|signatureHelp|powerbuilderSemanticGolden)"`

## 1.60 B220. AI-readable semantic workspace manifest — **Cerrada (manifiesto compacto/versionado 2026-05)**

**Objetivo:** exportar un manifiesto semántico compacto y versionado para agentes IA sin obligarlos a escanear manualmente todo el workspace.

**Resultado registrado:**
- `src/server/features/semanticWorkspaceManifest.ts` compone ya un manifiesto read-only con `projects`, `libraries`, `objects`, `inheritanceSummary`, `exportedSymbols`, `diagnosticsSummary`, `sourceOriginSummary`, `readiness`, `schemaVersion` y límites explícitos de payload;
- `src/server/server.ts` lo expone por `powerbuilder.semanticWorkspaceManifest`, y `src/client/extension.ts` lo añade a la API pública versionada como `getSemanticWorkspaceManifest()`;
- el resultado reutiliza `WorkspaceState`, `UnifiedProjectModel`, `KnowledgeBase`, `InheritanceGraph` y `diagnostics snapshot` ya publicados, sin exportar código bruto ni abrir un canal paralelo fuera del backbone semántico.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/semanticWorkspaceManifest"`
- `npm run test:unit -- --grep "unit/(semanticWorkspaceManifest|safeEditPlan|impactAnalysis|currentObjectContext|references|hierarchyInspection|diagnostics|signatureHelp|powerbuilderSemanticGolden)"`

## 1.61 B117. DataWindow safe mode mínimo — **Cerrada (safe mode .srd explícito 2026-05)**

**Objetivo:** soporte seguro mínimo de `.srd` con detección, SQL base, argumentos, columnas, bandas principales y hover/navegación básica sin parsear DataWindow como PowerScript completo.

**Resultado registrado:**
- `src/server/features/dataWindowSafeMode.ts` resume ya `retrieve`, `arguments`, columnas y bandas principales de snapshots `.srd` como un contrato read-only pequeño y reutilizable;
- `src/server/features/hover.ts` proyecta ese resumen cuando un `DataObject` literal o type stub resuelve hacia un `.srd`, reforzando el safe mode sin abrir soporte avanzado;
- la navegación básica sigue apoyada en los stubs `.srd` ya publicados por `documentAnalysis`, de modo que definition/hover/signatureHelp/diagnostics continúan sobre el mismo backbone semántico y no sobre un parser paralelo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(dataWindowSafeMode|hover)"`
- `npm run test:unit -- --grep "unit/(dataWindowSafeMode|documentAnalysis|definition|hover|signatureHelp|diagnostics|currentObjectContext|impactAnalysis|safeEditPlan|powerbuilderSemanticGolden)"`

## 1.62 B139. DataWindow safe-mode desde `plugin_old` — **Cerrada (legacy-safe rediseñado 2026-05)**

**Objetivo:** reaprovechar parser/definition/hover seguros del legacy para reforzar el safe mode DataWindow sin abrir soporte avanzado completo.

**Resultado registrado:**
- `src/server/features/dataWindowLegacySafeMode.ts` adapta de forma selectiva el conocimiento útil de `plugin_old` a un analizador puro de `.srd` con bandas, columnas `table(column=...)`, `retrieve` y referencias SQL simples dentro del propio DataWindow;
- `src/server/features/definition.ts` y `src/server/features/hover.ts` incorporan un fast-path local para documentos `.srd`, permitiendo navegación y hover seguros sobre bandas y columnas SQL sin depender de stores globales ni del subsistema legacy completo;
- el refuerzo mantiene el backbone actual: no usa `SymbolIndex`, no introduce async en hot path y no abre todavía expresiones, `DataWindowChild`, propiedades avanzadas ni mutación automática.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(dataWindowLegacySafeMode|definition|hover)"`
- `npm run test:unit -- --grep "unit/(dataWindowLegacySafeMode|dataWindowSafeMode|documentAnalysis|definition|hover|signatureHelp|diagnostics|currentObjectContext|impactAnalysis|safeEditPlan|powerbuilderSemanticGolden)"`

## 1.63 B041. Catálogo y navegación de DataWindow — **Cerrada (entidades de primer nivel 2026-05)**

**Objetivo:** promover DataWindow/DataStore a entidades semánticas de primer nivel con catálogo y navegación básicos integrados.

**Resultado registrado:**
- `src/server/features/documentSymbols.ts` ya expone Document Symbols específicos para `.srd` usando el modelo legacy-safe, incluyendo root DataWindow, bandas, tabla, columnas y `retrieve`;
- `workspaceSymbols` y `queryApiSymbols` ya publican los stubs `.srd` como tipos navegables del workspace, de modo que el catálogo básico DataWindow queda integrado también fuera del archivo activo;
- el resultado no abre soporte avanzado todavía: reutiliza el safe mode `.srd` ya cerrado y mantiene la separación entre catálogo básico y DataWindow avanzado.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(documentSymbols|workspaceSymbols)"`
- `npm run test:unit -- --grep "unit/(documentSymbols|workspaceSymbols|dataWindowLegacySafeMode|dataWindowSafeMode|documentAnalysis|definition|hover|signatureHelp|diagnostics|currentObjectContext|impactAnalysis|safeEditPlan|semanticWorkspaceManifest|powerbuilderSemanticGolden)"`

## 1.64 B161. Golden tests semánticos end-to-end — **Cerrada (suite golden ampliada 2026-05)**

**Objetivo:** fijar contratos visibles de comportamiento semántico para hover, definition, references, rename eligibility y readiness sin depender de interpretación manual del estado del motor.

**Resultado registrado:**
- `test/server/unit/powerbuilderSemanticGolden.test.ts` cubre ahora de forma explícita scope resolution, prototypes/implementation, herencia, event handlers, external functions, `DataObject` literal, `rename eligibility`, `readiness gating`, downgrade dinámico y conflictos de `sourceOrigin` sobre la misma base semántica compartida;
- rename y references siguen validados además por sus suites propias, pero la suite golden ya fija también los contratos mínimos de rename eligibility y readiness que faltaban para cerrar `B161` sin depender solo de tests auxiliares separados;
- el cierre no introduce otro harness: reutiliza `validateRenameTarget()`, `decideFeatureReadiness()` y el backbone semántico ya congelado por `B222`.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/powerbuilderSemanticGolden"`
- `npm run test:unit -- --grep "unit/(powerbuilderSemanticGolden|featureReadiness|renamePreflight|scopeResolution|semanticQueryService|definition|hover|signatureHelp|diagnostics|references|rename|sourceOrigin)"`

## 1.65 B163. Semantic work journal / event log del motor — **Cerrada (runtime journal exportable 2026-05)**

**Objetivo:** exponer un event log técnico del runtime para tuning y debugging sin abrir un subsistema paralelo ni romper el hot path.

**Resultado registrado:**
- `src/server/runtime/runtimeJournal.ts` introduce un ring buffer exportable con eventos tipados, fases, severidad, latencia y payload defensivo;
- `src/server/knowledge/queryTrace.ts`, `src/server/knowledge/ServingCache.ts` y `src/server/server.ts` alimentan el journal desde traces resueltas, hits/misses/evictions/invalidationes del serving cache e invalidaciones documentales reales (`change`, `close`, watcher flush);
- `src/shared/publicApi.ts` y `src/client/statusBarPresentation.ts` publican el snapshot del journal en `showStats` y lo resumen en status/health sin recalcular la observabilidad fuera del runtime.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(runtimeJournal|runtimeHealth|queryTrace|ServingCache|statusBarPresentation)"`
- `npm run test:unit -- --grep "unit/(runtimeJournal|runtimeHealth|queryTrace|ServingCache|statusBarPresentation|publicApi|cachePersistence|servingCachePersistence|servingReadiness|featureReadiness)"`
- `npm test -- --grep "smoke/extension"`

## 1.66 B176. Health checker interno del motor — **Cerrada (health report estructurado 2026-05)**

**Objetivo:** detectar degradación interna del motor antes del bug visible, con findings machine-readable reutilizables por stats y status.

**Resultado registrado:**
- `src/server/runtime/runtimeHealth.ts` construye un reporte estructurado `healthy/warning/error` con findings por capa (`runtime`, `scheduler`, `project-model`, `analysis-cache`, `serving-cache`, `hot-context`, `persistence`, `query`) y contadores por severidad;
- `src/server/server.ts` integra ese reporte en `showStats`, reutilizando el estado real de readiness, scheduler, project model, cachés, persistencia y última query en vez de abrir un checker desconectado del runtime;
- `src/client/statusBarPresentation.ts` proyecta counts, findings y tail del journal en el tooltip/health report, dejando alineadas las surfaces visibles con el contrato público compartido.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(runtimeJournal|runtimeHealth|queryTrace|ServingCache|statusBarPresentation)"`
- `npm run test:unit -- --grep "unit/(runtimeJournal|runtimeHealth|queryTrace|ServingCache|statusBarPresentation|publicApi|cachePersistence|servingCachePersistence|servingReadiness|featureReadiness)"`
- `npm test -- --grep "smoke/extension"`

## 1.67 B224. Watcher topology and sourceOrigin reconciliation — **Cerrada (routing/provenance incremental 2026-05)**

**Objetivo:** refrescar incrementalmente `project model`, routing y `sourceOrigin` cuando cambian markers (`.pbw`, `.pbt`, `.pbsln`, `.pbproj`) o aparecen SR* nuevos en caliente.

**Resultado registrado:**
- `src/server/workspace/watchedFileIntake.ts` trata markers de topología como eventos de primer nivel, reprocesa `roots`/topology, recomputa `sourceOrigin` y refresca `project routing` sin exigir rediscovery completo;
- `src/server/workspace/workspaceState.ts` añade operaciones explícitas para retirar `roots` y entradas de topología ya invalidadas, de modo que delete/change de markers no dejan routing obsoleto;
- `src/server/workspace/watchedFileChangeBridge.ts` y `src/server/server.ts` cierran el puente real LSP -> watcher para que los markers lleguen al intake incremental y no queden filtrados antes del runtime.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(watchedFileChangeBridge|watchedFileIntake|watcherPipeline|workspace)"`

## 1.68 B223. References/rename sin barrido global en hot path — **Cerrada (candidate pool acotado 2026-05)**

**Objetivo:** evitar que `references`, `rename` y CodeLens relean/remasqueen todo el workspace en la ruta interactiva.

**Resultado registrado:**
- `src/server/features/referenceSourcePool.ts` introduce un pool compartido de fuentes con scope `direct/project/multi-project/workspace`, basado en URIs candidatas reales y en el `project routing` vigente;
- `src/server/features/references.ts`, `src/server/features/dynamicStringReferences.ts` y `src/server/server.ts` reutilizan líneas y `maskedText` ya publicados por snapshot cuando están disponibles, evitando split/remask globales por request;
- CodeLens, `references` y `rename` ya consultan ese mismo pool acotado, manteniendo degradación honesta y sin relectura global por defecto en el hot path.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(referenceSourcePool|references|rename|codeLensReferences)"`

## 1.69 B067. Formateador configurable — **Cerrada (formatter conservador cliente-side 2026-05)**

**Objetivo:** formateo configurable solo sobre base sintáctica/semántica fiable.

**Resultado registrado:**
- `src/shared/formatting/powerBuilderFormatter.ts` introduce un formatter conservador, puro y configurable que respeta strings/comentarios y opera solo sobre un subconjunto PowerScript soportado;
- `src/client/formatting/registerFormatting.ts` registra `DocumentFormattingEditProvider` y `formatOnSave`, manteniendo el cliente ligero y dejando el motor reutilizable fuera de VS Code;
- `package.json` publica settings explícitas (`keywordCase`, `statementCase`, `eventKeywordCase`, indentación, espacios y `formatOnSave`) para controlar el comportamiento sin tocar DataWindow ni abrir un parser paralelo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/powerBuilderFormatter"`
- `npm run test:smoke -- --grep "smoke/formatting-extension"`

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
