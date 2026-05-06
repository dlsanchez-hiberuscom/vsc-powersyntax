# Constitución documental — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento define la **constitución documental** del plugin profesional de PowerBuilder 2025 para VS Code.

Su objetivo es que cada archivo tenga un papel claro, evitar duplicidades, mantener fuentes de verdad explícitas y permitir que personas y agentes IA trabajen sin perder contexto ni generar documentación contradictoria.

La constitución no sustituye a la arquitectura, al backlog, al roadmap ni a los documentos de IA. Define **cómo se gobiernan**.

---

## 2. Principios obligatorios

### 2.1. Una responsabilidad por documento

Cada documento debe tener una responsabilidad principal. Si una sección explica algo que pertenece mejor a otro documento, debe sustituirse por un resumen corto y un enlace.

### 2.2. Una fuente de verdad por tema

No se permite mantener la misma información detallada en varios documentos. Se permite repetir únicamente:

- una descripción breve;
- un enlace al documento canónico;
- una referencia a una spec, ADR, backlog item o informe.

### 2.3. Los documentos vivos deben estar alineados

Cuando se cambia arquitectura, backlog, specs, agentes, rendimiento, testing o workflows, se deben actualizar todos los documentos afectados en la misma tarea.

### 2.4. El histórico no se reescribe

Los documentos históricos o congelados no deben modificarse salvo corrección explícita, migración autorizada o normalización planificada.

Por ahora quedan congelados:

- `docs/done-log.md`
- `docs/architecture-implementation-map.md`

### 2.5. El backlog manda sobre el trabajo pendiente

Todo trabajo accionable debe vivir en `docs/backlog.md` o en specs enlazadas desde el backlog. Otros documentos pueden mencionar trabajo pendiente, pero no deben mantener listas paralelas.

### 2.6. La arquitectura objetivo y el estado real son cosas distintas

- `docs/architecture.md` define hacia dónde debe ir el sistema.
- `docs/architecture-status.md` define cómo está realmente ahora.
- `docs/architecture-implementation-map.md` aporta evidencia profunda, pero no se normaliza en esta fase.

### 2.7. La IA debe obedecer esta constitución

Cualquier agente IA que modifique documentación o código debe respetar esta jerarquía, evitar duplicados y actualizar los documentos afectados antes de cerrar una tarea.

---

## 3. Jerarquía documental

Cuando dos documentos se contradigan, aplicar esta prioridad:

1. `docs/constitution.md` — reglas documentales y gobierno.
2. ADRs en `docs/adr/` — decisiones arquitectónicas aceptadas.
3. `docs/architecture.md` — arquitectura objetivo.
4. `docs/architecture-status.md` — estado real actual.
5. Specs en `docs/specs/` y entradas de `docs/backlog.md` — trabajo accionable.
6. `docs/current-focus.md` — foco activo inmediato.
7. `docs/roadmap.md` — planificación estratégica.
8. `docs/performance-budget.md` — presupuestos y métricas de rendimiento.
9. `docs/testing.md` — estrategia de validación.
10. `docs/developer-workflows.md` — uso operativo por desarrolladores.
11. Documentos IA en `docs/ai*` y `docs/prompts/` — operación de agentes/contexto.
12. Informes de auditoría y mapas profundos — evidencia, no fuente normativa salvo promoción explícita.
13. `docs/done-log.md` — histórico cerrado.

---

## 4. Ownership de documentos actuales

| Documento | Papel canónico | Qué NO debe contener |
|---|---|---|
| `docs/constitution.md` | **Contrato documental y reglas maestras.** Define jerarquía, ownership, no duplicación, flujo de actualización y criterios de cierre. No contiene backlog operativo ni diseño detallado. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/architecture.md` | **Arquitectura objetivo.** Describe capas, límites, contratos arquitectónicos y decisiones estructurales vigentes. No almacena estado granular ni histórico. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/architecture-status.md` | **Estado arquitectónico actual.** Resume implementación real por capa: OK/parcial/riesgo/pendiente, desviaciones y enlaces a specs. No duplica el diseño objetivo. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/architecture-implementation-map.md` | **Mapa código ↔ arquitectura / evidencia de auditoría.** Documento congelado por ahora. Sirve como evidencia técnica e inventario profundo; no se normaliza en esta fase. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/current-focus.md` | **Foco activo inmediato.** Contiene solo el trabajo activo actual, sus criterios mínimos y el siguiente paso. No es roadmap ni backlog completo. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/backlog.md` | **Trabajo accionable.** Contiene specs pendientes/en curso/listas para ejecutar, con estado, alcance y criterios de aceptación. No explica arquitectura larga. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/roadmap.md` | **Plan estratégico por fases.** Ordena la evolución del producto por bloques/fases. No contiene specs completas ni estado diario. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/done-log.md` | **Histórico cerrado.** Documento congelado por ahora. Registra cierres y evidencias históricas; no debe reabrirse salvo corrección explícita. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/performance-budget.md` | **Presupuesto de rendimiento.** Define límites, métricas, budgets, hot/cold paths, cache hit ratio y criterios de performance. No sustituye tests ni arquitectura. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/testing.md` | **Estrategia de pruebas.** Define niveles de test, fixtures, corpora, smoke/unit/integration/performance y gates. No duplica backlog. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/developer-workflows.md` | **Flujos de desarrollo.** Describe cómo un desarrollador usa, prueba, depura y opera el plugin. No define arquitectura objetivo. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/ai-strategy.md` | **Estrategia IA.** Define principios de uso de IA, objetivos, límites y relación con el repositorio. No contiene prompts operativos largos. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/ai-orchestration.md` | **Orquestación IA/agentes.** Define cómo se coordinan agentes, fases, handoffs y validaciones. No duplica reglas individuales de agentes. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/ai/README.md` | **Índice operativo IA.** Entrada a docs/ai; enumera documentos y cuándo usarlos. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/ai/agent-skill-routing.md` | **Routing de agentes.** Define qué agente/capacidad usar según tipo de tarea. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/ai/lean-token-policy.md` | **Política de tokens/contexto.** Define cómo reducir contexto sin perder trazabilidad ni seguridad. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/ai-context/powerbuilder-plugin-context.md` | **Contexto compacto para IA.** Resumen estable del dominio PowerBuilder/plugin para inyectar en prompts. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/adr/ADR-0001-system-catalog-source-of-truth.md` | **ADR / decisión arquitectónica.** Registra decisiones irreversibles o de alto impacto. No se usa para tareas pequeñas. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` | **Guía técnica PowerBuilder.** Fuente de conocimiento del lenguaje/runtime/ecosistema para IA y desarrolladores. No contiene estado del proyecto. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |
| `docs/bloque13-multi-audit-report.md` | **Informe de auditoría.** Evidencia de auditoría concreta; no debe convertirse en fuente canónica salvo promoción explícita. | Duplicados extensos de otros documentos; listas paralelas de trabajo; contenido histórico salvo que sea su función. |

---

## 5. Reglas por tipo de documento

### 5.1. Constitución

`docs/constitution.md` debe contener:

- jerarquía documental;
- ownership de archivos;
- reglas de no duplicación;
- flujo de actualización;
- reglas para IA/agentes;
- criterios de cierre documental.

No debe contener:

- backlog técnico detallado;
- diseño profundo de caches, LSP, DataWindow, ORCA o PBAutoBuild;
- histórico de tareas cerradas;
- prompts largos.

---

### 5.2. Arquitectura objetivo

`docs/architecture.md` debe contener:

- visión estructural del plugin;
- capas y límites;
- contratos entre cliente VS Code, servidor LSP, workspace, parser, indexer, semantic layer, cache layer, providers e integraciones;
- decisiones vigentes de diseño;
- enlaces a ADRs, specs y documentos especializados.

No debe contener:

- estado granular de implementación;
- listas largas de TODO;
- resultados extensos de auditoría;
- histórico de cierres;
- planes por fases propios del roadmap.

---

### 5.3. Estado arquitectónico

`docs/architecture-status.md` debe contener:

- estado real por capa o módulo;
- desviaciones respecto a `architecture.md`;
- riesgos activos;
- deuda técnica identificada;
- enlace a backlog/specs que corrigen cada desviación.

No debe contener:

- diseño arquitectónico completo;
- explicación duplicada de patrones;
- histórico de cierres;
- specs completas.

Formato recomendado por bloque:

```markdown
## Área / capa

- Estado: OK / Parcial / Riesgo / Pendiente
- Arquitectura objetivo: enlace a `architecture.md`
- Evidencia: enlace a mapa/auditoría/test si aplica
- Desviación: descripción breve
- Acción: enlace a backlog/spec
```

---

### 5.4. Mapa de implementación

`docs/architecture-implementation-map.md` es un documento de evidencia profunda.

Por ahora:

- no se toca;
- no se compacta;
- no se reescribe;
- no se usa como documento operativo diario.

Uso permitido:

- consultar evidencias;
- extraer hallazgos;
- promover hallazgos a `architecture-status.md`, `backlog.md` o specs;
- validar que la documentación normalizada no contradice el estado observado.

---

### 5.5. Foco actual

`docs/current-focus.md` debe contener solo:

- bloque activo;
- objetivo inmediato;
- specs actuales;
- criterios mínimos de finalización;
- siguiente paso.

No debe contener:

- roadmap completo;
- backlog global;
- arquitectura larga;
- histórico.

---

### 5.6. Backlog

`docs/backlog.md` debe contener trabajo accionable.

Cada entrada debe incluir, como mínimo:

```markdown
### SPEC-ID — Título

- Estado: Pendiente / En curso / Bloqueado / Listo para cierre
- Prioridad: P0 / P1 / P2 / P3
- Área: arquitectura / cache / symbols / hover / diagnostics / testing / docs / ai / etc.
- Objetivo:
- Alcance:
- Criterios de aceptación:
- Documentación afectada:
```

No debe contener:

- explicación arquitectónica extensa;
- auditorías completas;
- histórico cerrado;
- planes estratégicos largos.

---

### 5.7. Roadmap

`docs/roadmap.md` debe contener:

- fases o bloques estratégicos;
- orden recomendado de ejecución;
- dependencias entre bloques;
- resultado esperado por fase.

No debe contener:

- specs completas;
- estado diario;
- criterios detallados de implementación;
- histórico.

---

### 5.8. Done log

`docs/done-log.md` registra trabajo cerrado.

Por ahora:

- no se toca;
- no se compacta;
- no se reordena;
- no se normaliza.

Solo se actualiza cuando una tarea se cierra realmente y el usuario o el proceso del repo lo autoriza.

---

### 5.9. Performance budget

`docs/performance-budget.md` debe contener:

- presupuestos de latencia;
- límites de memoria;
- hot/cold path budgets;
- métricas de cache hit/miss;
- límites de indexación;
- criterios de regresión de rendimiento.

No debe contener:

- diseño completo de arquitectura;
- specs largas;
- procedimientos detallados de testing salvo enlaces a `testing.md`.

---

### 5.10. Testing

`docs/testing.md` debe contener:

- estrategia de pruebas;
- niveles de test;
- fixtures/corpora;
- smoke, unit, integration, performance y regression tests;
- gates mínimos por tipo de cambio.

No debe contener:

- arquitectura objetivo completa;
- backlog detallado;
- roadmap;
- histórico de cierres.

---

### 5.11. Developer workflows

`docs/developer-workflows.md` debe contener:

- flujos reales de trabajo del desarrollador;
- comandos habituales;
- depuración;
- validación local;
- uso de tareas, vistas o comandos del plugin;
- flujos con IA si son operativos.

No debe contener:

- arquitectura profunda;
- backlog;
- specs completas;
- estrategia IA general.

---

### 5.12. IA, agentes y prompts

Los documentos IA deben separarse así:

- `docs/ai-strategy.md`: principios y objetivos de IA.
- `docs/ai-orchestration.md`: coordinación de agentes y fases.
- `docs/ai/README.md`: índice de la sección IA.
- `docs/ai/agent-skill-routing.md`: qué agente usar para cada tarea.
- `docs/ai/lean-token-policy.md`: cómo reducir contexto sin perder seguridad.
- `docs/ai-context/powerbuilder-plugin-context.md`: contexto compacto y estable del plugin.
- `docs/prompts/README.md`: índice de prompts reutilizables.

No deben contener:

- arquitectura completa;
- backlog duplicado;
- histórico cerrado;
- resultados largos de auditoría salvo enlace.

---

## 6. Reglas de no duplicación

### 6.1. Permitido

Se permite duplicar únicamente:

- una frase resumen;
- una tabla de enlaces;
- un estado breve;
- una referencia cruzada;
- una cita a una spec/ADR/backlog.

Ejemplo permitido:

```markdown
La arquitectura objetivo de caché está definida en `docs/architecture.md`; los límites de latencia están en `docs/performance-budget.md`.
```

### 6.2. Prohibido

No se permite:

- copiar secciones completas entre documentos;
- mantener dos listas de specs pendientes;
- explicar la misma arquitectura en varios lugares;
- actualizar backlog sin revisar current-focus/roadmap si aplica;
- cerrar tareas sin actualizar documentación afectada.

### 6.3. Regla de promoción

Si un hallazgo aparece en un informe, auditoría o mapa:

1. si es diseño objetivo, promover a `architecture.md`;
2. si es estado/desviación, promover a `architecture-status.md`;
3. si es acción pendiente, promover a `backlog.md` o `docs/specs/`;
4. si es histórico cerrado, promover a `done-log.md` solo al cerrar;
5. si es métrica de rendimiento, promover a `performance-budget.md`;
6. si es regla de pruebas, promover a `testing.md`;
7. si es regla de agentes, promover a docs IA.

---

## 7. Flujo obligatorio de actualización documental

Cuando se cambie código, arquitectura o backlog, aplicar este flujo:

### Paso 1 — Identificar tipo de cambio

- Arquitectura objetivo.
- Estado real o desviación.
- Nueva spec o tarea.
- Cambio de foco activo.
- Cambio de roadmap.
- Cambio de rendimiento.
- Cambio de testing.
- Cambio de IA/agentes.
- Cierre de tarea.

### Paso 2 — Actualizar fuente canónica

Actualizar primero el documento propietario del tema.

### Paso 3 — Actualizar referencias cruzadas

Actualizar solo resúmenes o enlaces en documentos relacionados.

### Paso 4 — Eliminar duplicados

Si el cambio deja información repetida, eliminar la copia no canónica y sustituirla por enlace.

### Paso 5 — Validar coherencia

Antes de cerrar:

- no debe haber dos documentos reclamando ser fuente de verdad del mismo tema;
- no debe haber specs pendientes fuera de backlog/specs;
- no debe haber arquitectura objetivo en documentos de estado;
- no debe haber histórico cerrado fuera de done-log;
- no debe haber reglas IA repartidas sin enlace a docs IA.

---

## 8. Reglas para agentes IA

Todo agente IA que trabaje sobre este repositorio debe cumplir:

1. Leer `docs/constitution.md` antes de modificar documentación.
2. Respetar la jerarquía documental.
3. No tocar `docs/done-log.md` ni `docs/architecture-implementation-map.md` durante la fase actual salvo instrucción explícita.
4. No crear documentos nuevos si puede normalizarse uno existente.
5. No duplicar contenido entre documentos.
6. Si mueve contenido, dejar enlace desde el documento original cuando sea útil.
7. Si detecta contradicciones, corregir la fuente no canónica.
8. Si detecta trabajo pendiente, moverlo a `docs/backlog.md` o a spec enlazada.
9. Si modifica arquitectura, revisar `architecture.md`, `architecture-status.md`, `performance-budget.md`, `testing.md`, `developer-workflows.md` y docs IA cuando aplique.
10. Antes de cerrar, ejecutar una revisión documental final.

---

## 9. Reglas de creación, eliminación y renombrado

### 9.1. Crear documentos nuevos

Solo se permite crear un nuevo documento si:

- el tema no tiene propietario claro;
- el documento existente quedaría demasiado mezclado;
- el nuevo documento tendrá mantenimiento real;
- se actualiza esta constitución o el índice correspondiente.

### 9.2. Eliminar documentos

Solo se permite eliminar un documento si:

- su contenido ha sido migrado;
- no quedan enlaces rotos;
- existe una fuente canónica equivalente;
- se actualizan índices y referencias.

### 9.3. Renombrar documentos

Solo se permite renombrar si:

- mejora claramente el ownership;
- se actualizan todos los enlaces;
- se documenta el cambio si afecta a agentes/prompts.

---

## 10. Criterios de cierre de una normalización documental

Una tarea de normalización documental solo puede cerrarse si cumple:

- cada documento tocado tiene una responsabilidad clara;
- no se ha modificado `done-log.md` ni `architecture-implementation-map.md` salvo autorización explícita;
- las duplicidades detectadas se han eliminado o sustituido por enlaces;
- backlog/current-focus/roadmap están alineados si la tarea afecta planificación;
- architecture/architecture-status están alineados si la tarea afecta arquitectura;
- performance/testing/workflows están alineados si la tarea afecta ejecución o calidad;
- docs IA están alineados si la tarea afecta agentes, prompts o contexto;
- los enlaces relativos siguen siendo válidos;
- se deja indicado el siguiente bloque recomendado.

---

## 11. Plan recomendado de normalización

### Bloque 1 — Constitución documental

- `docs/constitution.md`

Objetivo: fijar ownership, jerarquía y reglas.

### Bloque 2 — Arquitectura viva

- `docs/architecture.md`
- `docs/architecture-status.md`

Objetivo: separar arquitectura objetivo de estado real.

No tocar aún:

- `docs/architecture-implementation-map.md`

### Bloque 3 — Planificación operativa

- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/roadmap.md`

Objetivo: separar foco activo, trabajo accionable y estrategia por fases.

### Bloque 4 — Calidad, rendimiento y workflows

- `docs/performance-budget.md`
- `docs/testing.md`
- `docs/developer-workflows.md`

Objetivo: separar métricas, validación y uso operativo.

### Bloque 5 — IA, agentes y prompts

- `docs/ai-strategy.md`
- `docs/ai-orchestration.md`
- `docs/ai/README.md`
- `docs/ai/agent-skill-routing.md`
- `docs/ai/lean-token-policy.md`
- `docs/ai-context/powerbuilder-plugin-context.md`
- `docs/prompts/README.md`

Objetivo: separar estrategia IA, orquestación, routing, contexto y prompts.

### Bloque 6 — Specs, ADRs e informes

- `docs/specs/README.md`
- `docs/adr/*`
- informes de auditoría existentes

Objetivo: asegurar que specs, decisiones e informes no compiten con la documentación canónica.

---

## 12. Regla final

Si hay duda sobre dónde colocar información nueva:

1. si es regla documental, va aquí;
2. si es diseño objetivo, va a `architecture.md`;
3. si es estado actual, va a `architecture-status.md`;
4. si es tarea, va a `backlog.md` o `docs/specs/`;
5. si es foco inmediato, va a `current-focus.md`;
6. si es estrategia temporal, va a `roadmap.md`;
7. si es cierre histórico, va a `done-log.md`;
8. si es rendimiento, va a `performance-budget.md`;
9. si es test, va a `testing.md`;
10. si es workflow, va a `developer-workflows.md`;
11. si es IA/agentes/prompts, va a docs IA o prompts;
12. si es evidencia de auditoría, va a informe o mapa, pero debe promoverse a la fuente canónica si afecta decisiones futuras.

La documentación debe ayudar a construir el plugin, no convertirse en un segundo sistema contradictorio.
