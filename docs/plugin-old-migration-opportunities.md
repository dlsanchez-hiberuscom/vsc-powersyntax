# Plugin Old — Migration Opportunities

## 1. Propósito

Este documento recoge capacidades útiles de `plugin_old` que pueden servir como referencia para el plugin nuevo.

Regla principal:

> `plugin_old` es referencia, no fuente de port masivo.

No se debe portar código por inercia. Cada idea debe adaptarse a la arquitectura nueva, con tests y documentación.

---

## 2. Ya absorbido o cerrado en el plugin nuevo

El nuevo plugin ya ha incorporado o superado como base operativa:

- topología Workspace/Solution base;
- project model unificado;
- library order;
- parser hardening principal;
- unused variables;
- shadowing;
- hover/definition/completion base;
- serving cache;
- hot context cache;
- semantic snapshots;
- KnowledgeBase atómico;
- lineage base;
- readiness/degraded mode;
- latency governor;
- hierarchy inspection inicial;
- API pública mínima;
- diagnostics snapshot agrupado;
- compactación de strings calientes.

No reimplementar estas piezas desde cero.

---

## 3. Pendiente de valor alto

### 3.1 Gramática centralizada

`plugin_old` tenía una gramática PowerBuilder más centralizada.

Oportunidad:

- crear `grammar.ts` o equivalente;
- unificar regex dispersas;
- testear patrones como unidad;
- reducir divergencia entre parser/diagnostics/features.

### 3.2 Metadata de símbolos más rica

Campos útiles a evaluar:

- `containerKind`;
- `containerSignature`;
- `fileObjectName`;
- `declarationScope`;
- `baseTypeName` enriquecido;
- `parameterCount`;
- `implementationKind`;
- `ownerName`;
- `isExternal`;
- `externalLibraryName`;
- `externalName`;
- `access`;
- `returnType`.

Añadir solo cuando una feature lo necesite.

### 3.3 Visibilidad avanzada

Recuperar ideas de:

- public/protected/private;
- protectedread/protectedwrite;
- privateread/privatewrite;
- fallback seguro si el contexto tipado es insuficiente.

### 3.4 Semantic occurrences

Aprovechable para:

- references robustas;
- rename seguro;
- separación de referencias seguras/probables;
- confidence gates.

### 3.5 DataWindow ecosystem

Alta prioridad en Fase E/L4:

- parser `.srd`;
- hover DataWindow;
- diagnostics DataWindow;
- PowerScript ↔ DataWindow links;
- `.Object` properties;
- column occurrences.

### 3.6 Diagnostics snapshot y reporting

El nuevo `B063` ya cierra snapshot diagnóstico agrupado, pero pueden rescatarse ideas de visualización y formatting.

### 3.7 Public API patterns

El nuevo `B109` ya expone API mínima. Ideas futuras:

- batch semantic queries;
- navigation programática;
- workspace manifests;
- diagnostics tree export;
- AI context packs.

---

## 4. No portar sin rediseño

No portar directamente:

- servicios acoplados a arquitectura vieja;
- APIs internas no versionadas;
- heurísticas sin tests;
- código que reconstruya semántica fuera del knowledge pipeline;
- lógica que rompa readiness/confidence gates;
- cualquier integración que contamine el hot path.

---

## 5. Uso recomendado por IA

Cuando una spec mencione `plugin_old`:

1. leer este documento;
2. identificar si la capacidad ya está cerrada;
3. revisar solo archivos legacy relevantes;
4. extraer patrón, no copiar diseño completo;
5. adaptar a arquitectura actual;
6. añadir tests;
7. actualizar docs afectadas.

---

## 6. Auditoría 2026-05-04

Clasificación vigente tras revisar `plugin_old` frente a la arquitectura actual:

- **Ya implementado mejor:** core semántico, snapshots, KnowledgeBase, sourceOrigin, scoring base de completion, DataWindow safe mode inicial, ORCA staging moderno y guards de rename/references.
- **Ya absorbido por B342:** linked editing para `Local` y `Argumento` vive ahora en el servidor LSP nuevo sobre `queryContext` + `references`, limitado al documento activo y a resolución semántica única; no existe provider host ni índice paralelo heredado.
- **Ya absorbido por B344:** `dataWindowPropertyPaths.ts` sirve ya el root resoluble de `report(name=... dataobject=...)` y mantiene navegable el tramo `report -> column -> dddw.name` sobre `DataWindowModel` + bindings actuales, con unit y smoke sobre `.srd` en disco sin portar providers legacy.
- **Implementación parcial aprovechable:** folding estructural/comentarios, inlay hints owner-aware para parámetros, resúmenes extra de callable/code lens por herencia y advanced semantic tokens.
- **Valuable gaps registrados:** no queda un gap DataWindow `child/report/column occurrences` confirmado tras `B344`; cualquier nueva reapertura debe venir acompañada de fixture/corpus nuevo y seguir entrando como regla sobre `DataWindowModel`, bindings y resolvers actuales.
- **No portar:** provider host cliente, singleton indexes sin versionado, symbol keys sin sourceOrigin, ORCA directo y cualquier lógica que reconstruya semántica fuera de `KnowledgeBase`/snapshots/query service.

La sesión actual sigue sin portar código legacy masivo: `B342` absorbió linked editing, `B344` fijó el frente DataWindow `report -> column -> dddw` sobre el backbone nuevo y el resto queda clasificado para slices posteriores.
