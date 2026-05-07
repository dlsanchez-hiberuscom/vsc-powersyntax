# Performance Budget — Plugin PowerBuilder 2025 para VS Code

> **Estado:** documento canónico de presupuestos de rendimiento.  
> **Última revisión:** 2026-05-06.  
> **Ámbito:** latencia, memoria, hot paths, cold paths, indexación, caches, mediciones y gates de regresión.  
> **No contiene:** arquitectura completa, backlog detallado, specs concretas, histórico cerrado ni estrategia de testing completa.  
> **Documentos relacionados:** `docs/constitution.md`, `docs/architecture.md`, `docs/architecture-status.md`, `docs/testing.md`, `docs/developer-workflows.md`, `docs/backlog.md`.

---

## 1. Propósito

Este documento define los **presupuestos de rendimiento** del plugin profesional de PowerBuilder 2025 para VS Code.

Debe responder a una pregunta:

> ¿Qué límites de latencia, memoria, trabajo incremental y regresión debe respetar el plugin para sentirse rápido en proyectos reales de PowerBuilder?

La arquitectura objetivo vive en `docs/architecture.md`. El estado real vive en `docs/architecture-status.md`. La estrategia completa de pruebas vive en `docs/testing.md`. El trabajo accionable vive en `docs/backlog.md` o en specs enlazadas desde backlog.

---

## 2. Principios de rendimiento

### 2.1. El editor no se bloquea

Ninguna operación interactiva debe bloquear perceptiblemente VS Code. Si una feature no puede resolver información completa dentro de presupuesto, debe devolver una respuesta parcial útil o degradar de forma controlada.

### 2.2. Hot path primero

Las operaciones ejecutadas durante edición diaria tienen prioridad sobre tareas de análisis profundo. Hover, completion, signature help, diagnostics incrementales, semantic tokens, definition y references deben estar protegidos por budgets explícitos.

### 2.3. Incremental por defecto

El plugin debe preferir trabajo incremental frente a rescans completos:

- por documento;
- por versión de documento;
- por objeto PowerBuilder;
- por library/target;
- por workspace.

### 2.4. Caches con contrato

Toda cache que exista para mejorar rendimiento debe tener:

```text
owner
scope
key
value
invalidation trigger
max size / memory policy
metrics
fallback
```

### 2.5. Medir antes de cerrar

Una mejora de rendimiento no se considera cerrada si no deja forma de medir latencia, hit/miss, fallback, memoria o regresión según corresponda.

---

## 3. Taxonomía de paths

### 3.1. Hot paths interactivos

Son operaciones que el usuario percibe durante edición:

- hover;
- completion;
- completion resolve;
- signature help;
- definition;
- references;
- semantic tokens;
- document symbols;
- diagnostics incrementales;
- cambios de documento abierto.

### 3.2. Warm paths

Son operaciones que pueden ejecutarse tras apertura, cambios de workspace o actividad moderada:

- indexación incremental;
- actualización de symbol graph;
- actualización de caches de workspace;
- diagnostics de workspace parcial;
- actualización de modelos DataWindow.

### 3.3. Cold paths

Son operaciones costosas que deben ejecutarse con progreso, cancelación o scheduling controlado:

- discovery inicial de workspace grande;
- indexación completa;
- análisis profundo de todo el workspace;
- import/export o lectura externa mediante herramientas;
- builds externos;
- generación de support bundles.

---

## 4. Presupuestos objetivo de latencia

> Estos valores son presupuestos de producto. Si un workspace real exige superar un límite, la feature debe degradar con fallback explícito y registrar métrica.

### 4.1. Operaciones interactivas

| Operación | Objetivo | Límite tolerable | Regla |
|---|---:|---:|---|
| Hover desde cache | ≤ 20 ms | ≤ 50 ms | No debe leer disco ni reindexar. |
| Hover con resolución semántica ligera | ≤ 50 ms | ≤ 120 ms | Puede consultar snapshot, symbol graph y catálogo. |
| Completion inicial | ≤ 60 ms | ≤ 150 ms | Debe devolver candidatos útiles aunque falte ranking avanzado. |
| Completion resolve | ≤ 30 ms | ≤ 80 ms | Debe resolver detalles bajo demanda. |
| Signature Help | ≤ 50 ms | ≤ 120 ms | Debe usar callable/scope resolution. |
| Definition | ≤ 50 ms | ≤ 150 ms | Debe usar symbol identity/index. |
| References en documento activo | ≤ 80 ms | ≤ 200 ms | Puede usar índice local. |
| References workspace | ≤ 300 ms | ≤ 1000 ms | Si supera límite, usar progreso/cancelación. |
| Semantic Tokens documento | ≤ 80 ms | ≤ 200 ms | Debe usar snapshot/AST/cache. |
| Document Symbols | ≤ 50 ms | ≤ 150 ms | Debe usar parse/index local. |
| Diagnostics documento abierto | ≤ 150 ms | ≤ 500 ms | Deben ser incrementales y cancelables. |

### 4.2. Operaciones de workspace

| Operación | Objetivo | Límite tolerable | Regla |
|---|---:|---:|---|
| Detección inicial de tipo de proyecto | ≤ 500 ms | ≤ 1500 ms | No debe bloquear activación básica. |
| Discovery incremental | ≤ 2 s | ≤ 5 s | Debe mostrar progreso si aplica. |
| Indexación parcial tras cambio | ≤ 500 ms | ≤ 2 s | Solo invalidar lo afectado. |
| Indexación completa workspace mediano | ≤ 10 s | ≤ 30 s | Debe ser cancelable. |
| Rehidratación de cache persistente | ≤ 1 s | ≤ 3 s | Debe validar versión/hash. |
| Diagnostics workspace parcial | ≤ 3 s | ≤ 10 s | Debe ser schedulable. |

Validación real 2026-05:

- corpus OrderEntry/PFC: `discoverWorkspace=545.49ms`, `index cold=17736.90ms`, `warm=9.48ms`;
- el warm path limpio debe reutilizar snapshots publicados y no reindexar todo el corpus si el workspace no está dirty.

---

## 5. Presupuestos de memoria

### 5.1. Objetivos generales

El servidor debe mantener memoria proporcional al workspace y evitar crecimiento no acotado.

| Área | Objetivo | Regla |
|---|---:|---|
| Request-local cache | Liberada al terminar request | No persistir referencias pesadas. |
| Active document snapshot | Solo documentos abiertos/relevantes | Evictar al cerrar o cambiar versión. |
| Workspace index | Proporcional a símbolos reales | Evitar duplicar strings/modelos pesados. |
| Persistent metadata cache | Acotada por tamaño/configuración | Validar hash/version antes de uso. |
| DataWindow model cache | Acotada por uso reciente | Evictar modelos no usados. |
| Diagnostics cache | Por documento/fuente | Invalidar por versión/configuración. |

### 5.2. Reglas anti-fuga

- No guardar `TextDocument` completo en caches de larga vida si basta con snapshot reducido.
- No duplicar AST completo en varias capas.
- No retener respuestas LSP finales si se puede guardar ViewModel compacto.
- Toda cache L2/L3 debe tener política de evicción.
- Toda integración externa debe liberar procesos, handles y temporales.

---

## 6. Presupuesto de cache hit/miss

### 6.1. Objetivos por cache

| Cache | Hit objetivo | Miss tolerable | Observación |
|---|---:|---:|---|
| Active document snapshot | ≥ 95% en documento abierto | ≤ 5% | Base para hot paths. |
| HoverViewModel cache | ≥ 80% en posiciones repetidas | ≤ 20% | Debe incluir negative cache. |
| Completion list cache | ≥ 70% en contexto estable | ≤ 30% | Invalidar por scope/configuración. |
| Completion resolve cache | ≥ 80% en item repetido | ≤ 20% | TTL corto aceptable. |
| Catalog lookup cache | ≥ 95% | ≤ 5% | Catálogos versionados. |
| Semantic tokens cache | ≥ 80% si documento no cambia | ≤ 20% | Por versión de documento. |
| Diagnostics cache | ≥ 70% en revalidación sin cambios | ≤ 30% | Por fuente y versión. |
| DataWindow model cache | ≥ 80% en DW ya vista | ≤ 20% | Invalidar por hash/source. |

### 6.2. Regla de miss

Un cache miss en hot path no debe disparar trabajo global. Debe:

1. intentar resolución local/snapshot;
2. consultar índice semántico;
3. usar fallback parcial si excede presupuesto;
4. programar recomputación fuera del hot path si procede.

---

## 7. Budgets por feature

### 7.1. Hover

**Objetivo:** respuesta inmediata y útil.

Debe medir:

- latencia total;
- tipo de símbolo;
- cache hit/miss;
- fallback usado;
- resolución semántica usada;
- tamaño del Markdown resultante.

No debe:

- escanear workspace completo;
- leer disco en flujo normal;
- recalcular catálogos built-in;
- formatear desde modelos crudos si existe ViewModel válido.

Validación real 2026-05:

- built-ins/system functions deben resolverse por fast path de catálogo antes de depender de workspace readiness;
- un miss de serving cache no justifica reabrir discovery/indexing ni bloquear hover sobre `IsNull`, `UpperBound` y equivalentes.

### 7.2. Completion

**Objetivo:** candidatos rápidos, resolve bajo demanda.

Debe medir:

- latencia de lista inicial;
- número de candidatos;
- coste de ranking;
- latencia de resolve;
- cache hit/miss;
- fallback usado.

No debe:

- calcular documentación completa de todos los candidatos en la lista inicial;
- bloquear por ranking avanzado;
- recalcular símbolos globales si el índice es válido.

### 7.3. Signature Help

**Objetivo:** mostrar firma útil dentro de presupuesto.

Debe medir:

- latencia;
- resolución de callable;
- número de overloads;
- fallback sintáctico/semántico.

No debe depender únicamente de regex si hay información semántica disponible.

### 7.4. Definition y References

**Objetivo:** navegación rápida basada en identidad semántica.

Debe medir:

- latencia;
- fuente de resolución;
- hits de symbol graph;
- fallback textual;
- número de resultados.

Búsqueda textual global solo debe ser fallback explícito y presupuestado.

### 7.5. Diagnostics

**Objetivo:** diagnósticos incrementales, cancelables y separados por fuente.

Debe medir:

- latencia por documento;
- latencia por fuente;
- número de diagnósticos;
- cancelaciones;
- invalidaciones;
- reuso de cache.

No debe publicar diagnósticos obsoletos para una versión anterior de documento.

### 7.6. Semantic Tokens

**Objetivo:** tokens consistentes sin reparsing innecesario.

Debe medir:

- latencia;
- documento/versión;
- uso de snapshot/AST/cache;
- tamaño de respuesta.

---

## 8. Budgets de DataWindow

DataWindow es un subdominio propio y puede tener costes distintos al PowerScript principal.

### 8.1. Operaciones objetivo

| Operación DataWindow | Objetivo | Límite tolerable | Regla |
|---|---:|---:|---|
| Detectar referencia DW desde PowerScript | ≤ 50 ms | ≤ 150 ms | Usar semantic/index context. |
| Cargar modelo DW desde cache | ≤ 30 ms | ≤ 100 ms | Validar hash/version. |
| Parsear DW individual | ≤ 150 ms | ≤ 500 ms | Fuera de hot path si es pesada. |
| Resolver columna/control | ≤ 50 ms | ≤ 150 ms | Usar modelo cacheado. |
| Diagnostics DW individual | ≤ 300 ms | ≤ 1000 ms | Cancelable/schedulable. |

### 8.2. Reglas

- No parsear todas las DataWindows por una request de hover.
- No bloquear completion por análisis SQL profundo.
- Cachear modelo DW por source/hash.
- Separar safe mode de análisis avanzado.

---

## 9. Budgets de integraciones externas

### 9.1. ORCA

ORCA debe tratarse como integración externa y potencialmente lenta.

Reglas:

- no ejecutar ORCA en hot path interactivo;
- no bloquear LSP mientras una sesión ORCA trabaja;
- usar progress/cancelación si la operación es larga;
- mapear errores sin romper el servidor;
- degradar si ORCA no está disponible.

Regla validada 2026-05: ORCA ausente sólo puede degradar dashboards y capabilities de build legacy; no debe alterar la latencia ni el estado funcional de hover, views o diagnostics.

### 9.2. PBAutoBuild

PBAutoBuild debe tratarse como proceso externo controlado.

Reglas:

- ejecutar bajo comando explícito o tarea programada;
- no mezclar salida cruda con diagnostics sin parser/mapping;
- no bloquear providers interactivos;
- registrar duración, exit code y errores parseados;
- permitir cancelación cuando sea posible.

Regla validada 2026-05: ausencia de build files o del runner no debe contaminar budgets de runtime interactivo ni bloquear serving/readiness del lenguaje.

---

## 10. Métricas obligatorias

### 10.1. Métricas por request LSP

```text
traceId
method
documentUri
documentVersion
workspaceId
durationMs
cacheHit/cacheMiss
fallbackKind
cancelled
resultSize
errorKind
```

### 10.2. Métricas por cache

```text
cacheName
scope
keyKind
hit
miss
invalidated
entryCount
estimatedSize
reason
```

### 10.3. Métricas por indexación

```text
workspaceId
changedFiles
parsedFiles
indexedSymbols
durationMs
cancelled
fullOrIncremental
invalidatedScopes
```

### 10.4. Métricas por integración externa

```text
adapterName
operation
durationMs
exitCode
cancelled
stdoutSize
stderrSize
mappedDiagnostics
```

---

## 11. Gates de regresión

Una tarea que afecte rendimiento no debe cerrarse si:

- aumenta latencia de hot path sin justificación;
- introduce lectura de disco en hot path sin cache/fallback;
- invalida caches de forma global cuando basta invalidación parcial;
- no añade o actualiza pruebas de performance cuando aplica;
- no deja métrica para comparar antes/después;
- degrada apertura de workspace grande;
- rompe cancelación o publica resultados obsoletos.

---

## 12. Testing relacionado

La estrategia completa vive en `docs/testing.md`, pero este documento exige como mínimo:

- smoke tests de activación/apertura;
- unit tests para invalidación de caches;
- tests de parser incremental;
- tests de semantic facade en hot paths;
- tests de DataWindow model cache;
- tests de adapters externos con fake/mocks;
- performance smoke tests para hover/completion/diagnostics/indexing;
- fixtures de workspaces reales o representativos.

---

## 13. Política de degradación

Cuando una feature no pueda cumplir presupuesto:

1. debe devolver respuesta parcial si es útil;
2. debe evitar bloquear el editor;
3. debe registrar fallback;
4. debe programar recomputación si procede;
5. debe evitar publicar resultados obsoletos;
6. debe mantener UX predecible.

Ejemplos:

- Hover puede mostrar tipo/nombre básico y omitir documentación avanzada.
- Completion puede devolver candidatos locales antes de globales.
- References puede mostrar resultados de documento activo antes de workspace completo.
- Diagnostics puede publicar sintácticos primero y semánticos después.

---

## 14. Relación con backlog y specs

Este documento no lista specs concretas. Si se detecta una desviación de rendimiento, debe registrarse como trabajo accionable en `docs/backlog.md` o en una spec bajo `docs/specs/`.

La entrada de backlog/spec debe enlazar a este documento y declarar:

```text
hot path afectado
budget incumplido
métrica actual
métrica objetivo
prueba de regresión requerida
documentación afectada
```

---

## 15. Criterios de cierre de este documento

Este documento está alineado si:

- define budgets y métricas, no arquitectura completa;
- no contiene specs concretas ni histórico;
- cada hot path tiene objetivo y límite tolerable;
- cache layer, DataWindow e integraciones externas tienen reglas de rendimiento;
- los gates de regresión son claros;
- `docs/testing.md` queda como propietario de la estrategia de pruebas;
- `docs/backlog.md` queda como propietario del trabajo accionable.

---

## 16. Próximo paso documental

Después de normalizar este documento, los siguientes documentos recomendados son:

```text
docs/current-focus.md
docs/backlog.md
docs/testing.md
```

Orden recomendado:

1. `docs/current-focus.md` — foco inmediato.
2. `docs/backlog.md` — specs accionables.
3. `docs/testing.md` — estrategia de validación alineada con estos budgets.
