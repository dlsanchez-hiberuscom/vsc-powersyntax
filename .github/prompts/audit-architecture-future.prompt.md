# PLAN MAESTRO DEFINITIVO — Arquitectura semántica unificada, indexación masiva y caches

Actúa como arquitecto principal del plugin **VSC PowerSyntax / PowerBuilder 2025 para VS Code**.

Usa todo el contexto de la ultra auditoría semántica, backlog derivado, arquitectura actual, código real, tests y documentación.

## Modelo recomendado

Usa el modelo más capaz disponible para diseño arquitectónico profundo, razonamiento largo, lectura masiva de repositorio y planificación multi-fase.

---

# Objetivo

Diseñar el **modelo definitivo objetivo** del plugin para que todo funcione como un sistema único:

```txt
una sola fuente de verdad semántica
discovery/indexing rápido, potente e inteligente
KnowledgeBase publicada y versionada
caches como proyecciones, no verdades paralelas
consumers como lectores/proyectores
confidence/evidence/reason codes comunes
sin duplicidad de lógica
sin full scans en hot paths
apto para workspaces de 5000+ archivos
útil para desarrolladores PowerBuilder y para IA que use el plugin
```

No implementes todavía.
Esta tarea es de **diseño, auditoría complementaria, simplificación, documentación objetivo y backlog arquitectónico**.

---

# Restricciones absolutas

1. No hagas big-bang.
2. No propongas full scans en hot paths.
3. No propongas leer 5000+ archivos en cada request interactiva.
4. No hagas que hover/completion/definition/references resuelvan semántica por su cuenta.
5. No conviertas caches en fuente de verdad.
6. No dupliques owners documentales.
7. No crees backlog vago.
8. No mantengas features que no aporten valor real a desarrolladores o a IA.
9. Puedes proponer fusionar, degradar, mover a report-only o eliminar superficies si su coste supera su valor.
10. Todo diseño debe respetar:

```txt
El plugin debe descubrir e indexar muy rápido sin bloquear y con prioridades, ventana abierta/s, herencias y referencias,... (elige la mejor opcion según los patrones modernos)
```

---

# Workspaces objetivo

Diseña pensando en:

```txt
workspace pequeño: 100-800 archivos
workspace medio: 800-2500 archivos
workspace grande: 2500-5000 archivos
workspace masivo: 5000+ archivos
```

Para cada decisión arquitectónica, indica si escala a 5000+ archivos.

---

# Fuentes obligatorias

Lee antes de diseñar:

```txt
resultado de ultra auditoria semantica
backlog.md
current-focus.md
done-log.md
roadmap.md
docs/powerbuilder-2025-vscode-plugin-technical-guide.md
docs/architecture.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/performance-budget.md
docs/testing.md
docs/troubleshooting.md
package.json
```

Lee código real relacionado con:

```txt
discovery
workspaceIndexer
KnowledgeBase
ProjectModel
InheritanceGraph
SystemCatalog
SemanticQueryFacade
QueryContext
SemanticQueryService
ServingCache
HotContextCache
DocumentCache
NegativeCache
hover
completion
signatureHelp
definition
references
diagnostics
semanticTokens
Object Explorer
Current Object Context
Diagnostics Explainability
RuntimeSelfTest
Health dashboard
AI/read-only reports
```

Si falta contexto, vuelve a auditar los archivos necesarios.

---

# Documento obligatorio de suposiciones

Crea:

```txt
docs/semantic-design-assumptions.md
```

Este documento debe ser un ledger vivo de supuestos, decisiones, dudas y validaciones.

Después de **cada fase**, actualiza este documento con una sección completa:

```md
## FASE <n> — Assumption Ledger

### Hechos confirmados
- ...

### Suposiciones utilizadas
- ...

### Dudas abiertas
- ...

### Decisiones tomadas
- ...

### Riesgos
- ...

### Evidencia consultada
- ...

### Validación pendiente
- ...

### Impacto en diseño objetivo
- ...

### Impacto en backlog
- ...
```

Reglas:

- No mezclar hechos confirmados con suposiciones.
- Toda suposición debe tener owner, riesgo y validación prevista.
- Toda duda que afecte diseño debe acabar en backlog o en validación explícita.
- Si una fase invalida una suposición anterior, actualizar la entrada anterior con estado `Superseded`.

---

# Documento objetivo recomendado

Crea si lo consideras conveniente:

```txt
docs/semantic-design-target.md
```

Debe ser el documento owner del diseño objetivo.

Debe definir:

```txt
fuente de verdad semántica
flujo discovery/indexing/snapshot
contrato SemanticQuery
contrato de caches
consumers como proyecciones
submodelos semánticos
principios de simplificación
estrategia para 5000+ archivos
```

No dupliques contenido de `architecture.md`, `architecture-status.md` o `architecture-implementation-map.md`.

Si decides no crearlo, explica dónde vivirá cada parte del diseño.

---

# FASE 0 — Contexto, modelo y alcance

1. Lee auditoría semántica y backlog derivado.
2. Lee arquitectura y mapa de implementación.
3. Identifica contexto faltante.
4. Decide si necesitas reauditar alguna parte.
5. Decide si crearás `docs/semantic-design-target.md`.
6. Actualiza `docs/semantic-design-assumptions.md`.

Salida:

```md
## FASE 0 COMPLETADA

- Modelo IA elegido:
- Contexto disponible:
- Contexto faltante:
- Reauditorías necesarias:
- Documentos nuevos propuestos:
- Riesgos iniciales:
```

---

# FASE 1 — Investigación de patrones modernos

Investiga patrones aplicables:

```txt
LSP architecture
incremental query systems
Salsa/rust-analyzer style architecture
published immutable snapshots
semantic database
query facade
cache invalidation by epoch
negative cache
read-only projections
large workspace indexing
AI-friendly semantic APIs
Y cualquier otro que consideres que se puede ajustar a nuestra arquitectura
```

Analiza qué patrones sirven y cuáles no.

Salida:

```md
## FASE 1 COMPLETADA

### Patrones recomendados
- ...

### Patrones rechazados
- ...

### Decisiones preliminares
- ...

### Impacto para 5000+ archivos
- ...
```

Actualiza `docs/semantic-design-assumptions.md`.

---

# FASE 2 — Diagnóstico arquitectónico actual

Audita capas reales:

```txt
Discovery
WorkspaceIndexer
ProjectModel
LibrarySearchPath
SourceOrigin
DocumentFacts
KnowledgeBase
InheritanceGraph
SystemCatalog
DataWindowModel
SqlAnchors
TransactionModel
ExternalNativeModel
SemanticQueryFacade
SemanticQueryService
QueryContext
ServingCache
HotContextCache
DocumentCache
NegativeCache
LSP providers
Read-only surfaces
RuntimeSelfTest
Health dashboard
```

Para cada capa:

```md
## Capa: <nombre>

- Responsabilidad actual:
- Archivos:
- Produce:
- Consume:
- Consumers:
- Caches:
- Qué considera verdad:
- Duplicidades:
- Ownership difuso:
- Riesgo hot path:
- Escala a 5000+ archivos: sí/no/parcial
- Mantener/fusionar/degradar/eliminar:
- Motivo:
```

Actualiza `docs/semantic-design-assumptions.md`.

---

# FASE 3 — Duplicidades de verdad

Busca verdades duplicadas en:

```txt
symbols
types
ancestors
functions
events
built-ins
DataWindow bindings
SQL anchors
transactions
confidence
evidence
reason codes
hover targets
completion candidates
signature overloads
definition targets
references candidates
semantic tokens
Object Explorer nodes
Current Object Context
Diagnostics Explainability
health reports
AI bundle
```

Para cada duplicidad:

```md
## Duplicidad: <concepto>

- Verdad A:
- Verdad B:
- Verdad C:
- Archivos:
- Consumers afectados:
- Riesgo:
- Fuente de verdad objetivo:
- Qué debe ser proyección:
- Qué debe eliminarse:
- Backlog:
```

Actualiza `docs/semantic-design-assumptions.md`.

---

# FASE 4 — Arquitectura objetivo

Diseña el flujo definitivo, priorizando la meta del plugin:

```txt
Workspace inputs
  -> Discovery
  -> ProjectModel
  -> DocumentFacts
  -> SemanticEnrichment
  -> PublishedSemanticSnapshot
  -> SemanticQueryFacade
  -> Caches/projections
  -> LSP providers/read-only surfaces
```

Define componentes:

```md
## Componente objetivo: <nombre>

- Responsabilidad:
- Owner:
- Inputs:
- Outputs:
- No debe hacer:
- Depende de:
- Lo consumen:
- Cache:
- Invalidación:
- Escalabilidad 5000+:
- Tests:
- Docs owner:
```

Actualiza `docs/semantic-design-target.md` si existe.
Actualiza `docs/semantic-design-assumptions.md`.

---

# FASE 5 — Fuente única de verdad

Define:

```txt
PublishedSemanticSnapshot
```

Debe incluir o referenciar submodelos:

```txt
ProjectModel
SourceOriginModel
DocumentFacts
SymbolModel
CallableModel
ScopeModel
TypeModel
InheritanceModel
SystemCatalogModel
DataWindowSubmodel
SqlAnchorSubmodel
TransactionSubmodel
ExternalNativeSubmodel
FrameworkAdvisorySubmodel
ConfidenceEvidenceModel
```

Formato:

```md
## PublishedSemanticSnapshot

- Qué contiene:
- Qué no contiene:
- Cómo se publica:
- semanticEpoch/version:
- Invalidación:
- Hot path permitido:
- Offline/background:
- Low confidence:
- Escala 5000+:
- Tests:
```

Actualiza documentos.

---

# FASE 6 — Contrato común SemanticQuery

Diseña el contrato común:

```txt
target
kind
owner
scope
source origin
project
library
document URI
range
signature
parameters
return type
confidence
evidence
reason codes
ambiguity
alternatives
fallback
degradation
cacheability
semanticEpoch
consumerProjection
```

Define:

```md
## SemanticQueryResult

- query:
- target:
- kind:
- owner:
- scope:
- source:
- confidence:
- evidence:
- reasons:
- alternatives:
- degraded:
- cacheability:
- semanticEpoch:
- consumerProjection:
```

Después define consumers:

```txt
hover
completion
signature help
definition
references
semantic tokens
diagnostics
document symbols
workspace symbols
Object Explorer
Current Object Context
Diagnostics Explainability
RuntimeSelfTest
Health dashboard
AI/read-only reports
```

Para cada consumer:

```md
## Consumer: <nombre>

- Usa:
- Proyección:
- No debe hacer:
- Fallback:
- Cache:
- Latency budget:
- Escala 5000+:
- Tests:
```

Actualiza documentos.

---

# FASE 7 — Caches e invalidación

Define:

```txt
DocumentCache
KnowledgeBase snapshot store
ServingCache
HotContextCache
NegativeCache
ReadOnlyReportCache
```

Para cada cache:

```md
## Cache: <nombre>

- Owner:
- Key:
- Contenido:
- Qué NO debe contener:
- Invalidación:
- TTL:
- Relación con semanticEpoch:
- Hot path permitido:
- Métricas:
- Escala 5000+:
- Tests:
```

Diseña eventos:

```txt
DocumentChanged
DocumentFactsChanged
ProjectModelChanged
LibraryOrderChanged
DataWindowFactsChanged
SqlAnchorsChanged
KnowledgeBasePublished
SemanticEpochAdvanced
```

Regla:

```txt
Si cambia texto pero no cambia semántica pública, no invalidar todo el workspace.
```

Actualiza documentos.

---

# FASE 8 — Simplificación, fusión y eliminación

Busca cosas que no aportan suficiente valor.

Analiza:

```txt
providers con lógica semántica duplicada
reports read-only redundantes
caches redundantes
diagnostics de baja acción
surfaces AI duplicadas
docs duplicadas
features visuales no usadas
metadata nativa que sobrepromete
DataWindow/SQL heurístico demasiado visible
legacy influence no documentada
```

Formato:

```md
## Candidato: <nombre>

- Qué es:
- Dónde vive:
- Valor para desarrollador:
- Valor para IA:
- Coste mantenimiento:
- Riesgo:
- Propuesta:
  - mantener
  - fusionar
  - eliminar
  - degradar
  - report-only
  - experimental
- Motivo:
- Backlog:
```

Actualiza `docs/semantic-design-assumptions.md`.

---

# FASE 9 — Plan incremental

No big-bang.

Diseña etapas:

```txt
Etapa 1 — Diseño objetivo + Assumption Ledger + conformance tests
Etapa 2 — SemanticQuery contract
Etapa 3 — Completion + Signature Help projections
Etapa 4 — References structural confirmation
Etapa 5 — Semantic Tokens evidence contract
Etapa 6 — Read-only surfaces as projections
Etapa 7 — Cache/invalidation coordinator
Etapa 8 — DataWindow/SQL/native submodels
Etapa 9 — Cleanup/deletion of duplicated logic
```

Para cada etapa:

```md
## Etapa <n> — <nombre>

- Objetivo:
- Archivos afectados:
- Riesgos:
- Tests:
- Docs:
- Criterio de salida:
- Backlog items:
```

Actualiza documentos.

---

# FASE 10 — Backlog arquitectónico final

Crea backlog muy completo para ejecutar después de los arreglos de la auditoría, para llegar al diseño sugerido, incluyendo la eliminacion del codigo duplicado o legacy. Se muy especifico en cada item, indicando claramente la situacion actual y el diseño objetivo que se quiere alcanzar.

IDs sugeridos:

```txt
PB-ARCH-P0-SEMANTIC-DESIGN-TARGET-01
PB-ARCH-P0-SEMANTIC-SOURCE-OF-TRUTH-01
PB-ARCH-P0-SEMANTIC-CONFORMANCE-TESTS-01
PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01
PB-ARCH-P1-CONSUMER-CONVERGENCE-COMPLETION-SIGNATURE-01
PB-ARCH-P1-REFERENCES-STRUCTURAL-CONFIRMATION-01
PB-ARCH-P1-CACHE-SEMANTIC-EPOCH-CONTRACT-01
PB-ARCH-P1-CROSS-CACHE-INVALIDATION-COORDINATOR-01
PB-ARCH-P1-READONLY-SURFACES-PROJECTIONS-01
PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01
PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01
PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01
PB-ARCH-P2-FEATURE-SIMPLIFICATION-AND-DELETION-01
```

Cada item:

```md
## <ID> — <Título>

- **Estado:** Open.
- **Prioridad:** P0/P1/P2.
- **Origen:** Plan maestro de diseño semántico.
- **Problema:**
- **Objetivo:**
- **Fuente de verdad afectada:**
- **Consumers afectados:**
- **Caches afectadas:**
- **Riesgo actual:**
- **Diseño objetivo:**
- **Plan incremental:**
- **Notas de performance:**
- **Escala 5000+ archivos:**
- **Acceptance criteria:**
- **Docs:**
- **Tests:**
- **Validación:**
```

Este backlog debe quedar listo para ejecutarse después de los arreglos derivados de la auditoría semántica, salvo que alguno se quede absorbido.

---

# FASE 11 — Documentación final

Actualizar:

```txt
docs/semantic-design-target.md si se crea
docs/semantic-design-assumptions.md
docs/architecture.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/performance-budget.md
docs/testing.md
docs/troubleshooting.md
backlog.md
current-focus.md
roadmap.md
```

No actualizar `done-log.md` salvo cierre real.

---

# FASE 12 — Revisión final estricta

Antes de cerrar, verifica:

```txt
1. ¿Hay una sola fuente de verdad definida?
2. ¿Discovery/indexing produce facts y snapshot?
3. ¿KnowledgeBase publicada es verdad estable?
4. ¿Caches son proyecciones/aceleradores?
5. ¿Consumers dejan de ser owners de semántica?
6. ¿Confidence/evidence/reason codes son comunes?
7. ¿Hay estrategia para 5000+ archivos?
8. ¿Se propusieron simplificaciones/eliminaciones?
9. ¿No hay full scans en hot paths?
10. ¿Backlog es accionable?
11. ¿Docs están alineadas?
12. ¿Assumption Ledger está completo fase por fase?
13. ¿Nada dudoso queda fuera del backlog?
```

Si algo falla, vuelve a la fase concreta y corrige.

---

# Salida final obligatoria

```md
# Resultado — Plan maestro de diseño semántico

## 1. Modelo IA elegido
- ...

## 2. Resumen ejecutivo
- ...

## 3. Assumption Ledger creado/actualizado
- ...

## 4. Diagnóstico actual
- ...

## 5. Patrones investigados
- ...

## 6. Duplicidades detectadas
- ...

## 7. Arquitectura objetivo
- ...

## 8. Fuente de verdad propuesta
- ...

## 9. Flujo discovery/indexing/snapshot/cache objetivo
- ...

## 10. Contrato SemanticQuery
- ...

## 11. Caches e invalidación
- ...

## 12. Consumers como proyecciones
- ...

## 13. Elementos a simplificar/fusionar/eliminar
- ...

## 14. Estrategia 5000+ archivos
- ...

## 15. Plan incremental
- ...

## 16. Backlog creado/actualizado
- ...

## 17. Documentación actualizada
- ...

## 18. Riesgos de performance
- ...

## 19. Riesgos residuales
- ...

## 20. Siguiente foco recomendado
- ...
```

---

# Restricción final

No cierres con recomendaciones genéricas.

Debe quedar un documento claro que defina la estructura objetivo exacta del plugin y un backlog ejecutable para llegar a esa estructura después de los arreglos de la auditoría.

NO PARES HASTA TERMINAR TODAS LAS FASES UNA A UNA