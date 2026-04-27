# Orquestador de IA del repositorio

## 1. Objetivo

Este repositorio incorpora un **orquestador de IA por capas** para mejorar análisis, revisión, coordinación e implementación controlada sin perder gobernanza técnica.

El orquestador no sustituye al desarrollador principal ni al flujo SDD del proyecto.

Su función es:

- enrutar preguntas al agente más adecuado,
- mantener limpio el contexto,
- reducir exploración innecesaria,
- producir salidas útiles para decidir mejor,
- y permitir ejecución controlada cuando la tarea ya está bien definida.

---

## 2. Principios

### 2.1 Arquitectura en dos capas

El sistema se divide en:

- **agentes read-only**, para analizar, revisar, planificar y auditar;
- **agentes write-enabled**, para implementar, escribir tests y actualizar documentación.

### 2.2 Contexto mínimo

Cada agente debe cargar solo el contexto imprescindible.

### 2.3 Especialización clara

Cada agente tiene una responsabilidad concreta.

### 2.4 La spec manda

Todo el sistema está subordinado a:

- constitución,
- SDD,
- arquitectura,
- roadmap,
- backlog,
- current focus,
- y specs activas.

### 2.5 La ejecución no sustituye la revisión

Los agentes que escriben no deben ignorar:

- la constitución,
- la arquitectura oficial,
- la spec activa,
- ni la validación/documentación necesaria.

---

## 3. Capas de agentes

## 3.1 Capa read-only

### `spec-orchestrator`
Coordina tareas complejas, decide qué contexto cargar, a qué agentes delegar y devuelve un plan claro.

### `research-analyst`
Investiga documentación y estructura del repo, detecta impacto y sintetiza información.

### `architecture-reviewer`
Evalúa propuestas y estado del repo desde el punto de vista de arquitectura, carga, modularidad y escalabilidad.

### `docs-auditor`
Detecta desalineaciones entre documentación canónica y estado real del repositorio.

### `codebase-analyst`
Analiza módulos afectados, patrones existentes y riesgos técnicos del código real.

## 3.2 Capa write-enabled

### `implementation-agent`
Implementa tareas concretas de la spec con cambios pequeños, localizados y compatibles con la arquitectura.

### `test-writer`
Escribe o amplía tests y fixtures de forma controlada.

### `docs-updater`
Actualiza documentación afectada por cambios técnicos o funcionales.

---

## 4. Asignación de modelos recomendada

### Read-only

- **spec-orchestrator** → **GPT-5.4**
- **research-analyst** → **Claude Sonnet 4.6**
- **architecture-reviewer** → **GPT-5.4**
- **docs-auditor** → **Claude Sonnet 4.6**
- **codebase-analyst** → **GPT-5.3-Codex**

### Write-enabled

- **implementation-agent** → **GPT-5.4**
- **test-writer** → **GPT-5.3-Codex**
- **docs-updater** → **Claude Sonnet 4.6**

---

## 5. Herramientas permitidas

## 5.1 En VS Code custom agents

Las herramientas recomendadas son:

- `search`
- `web`
- `agent`
- `edit`

## 5.2 Reglas por capa

### Read-only
Usar solo herramientas de análisis y coordinación:

- `search`
- `web` (solo cuando haga falta investigación externa)
- `agent` (solo para el coordinador)

### Write-enabled
Usar herramientas de ejecución controlada:

- `search`
- `edit`

---

## 6. Flujo recomendado

## Caso 1 — Nueva feature

1. `spec-orchestrator`
2. `research-analyst`
3. `architecture-reviewer`
4. `docs-auditor`
5. si la tarea está madura:
   - `implementation-agent`
   - `test-writer`
   - `docs-updater`

## Caso 2 — Revisión de estado del repo

1. `codebase-analyst`
2. `docs-auditor`
3. `architecture-reviewer`
4. salida final consolidada

## Caso 3 — Preparación antes de implementar

1. `spec-orchestrator`
2. `codebase-analyst`
3. `architecture-reviewer`
4. recomendación de siguiente paso implementable

## Caso 4 — Implementación controlada

1. `implementation-agent`
2. `test-writer`
3. `docs-updater`
4. revisión posterior por:
   - `architecture-reviewer`
   - `docs-auditor`

---

## 7. Qué sí debe devolver el orquestador

- resumen ejecutivo,
- contexto mínimo relevante,
- módulos afectados,
- documentación afectada,
- riesgos,
- plan por pasos,
- y recomendación final.

## 8. Qué no debe devolver

- cambios fuera de alcance,
- propuestas sin anclaje en docs/spec,
- texto excesivo,
- cierres falsos de tareas no validadas.

---

## 9. Regla de mantenimiento

Este sistema debe mantenerse pequeño y explícito.

Si se añaden más agentes, solo hacerlo si el nuevo rol aporta valor claro y no puede absorberse en los existentes.