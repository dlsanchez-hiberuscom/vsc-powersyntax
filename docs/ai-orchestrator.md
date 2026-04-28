# Orquestador de IA del repositorio

## 1. Objetivo

Este repositorio usa un orquestador de IA **LEAN** para mejorar análisis, decisión, implementación controlada y mantenimiento documental sin perder gobernanza técnica. 

El orquestador **no sustituye** al desarrollador principal ni al flujo SDD del proyecto. 

Su función es:

- enrutar cada tarea al mecanismo adecuado,  
- mantener contexto mínimo,  
- reducir exploración innecesaria,  
- producir salidas útiles para decidir,  
- y permitir ejecución controlada cuando la tarea ya está madura. 

---

## 2. Modelo del sistema

El sistema se apoya en **tres mecanismos distintos** y complementarios: **custom agents**, **prompt files** y **skills**. VS Code recomienda usar agentes para roles persistentes con herramientas y reglas propias, prompt files para tareas ligeras y repetibles, y skills para capacidades portables más complejas. 

### 2.1 Custom agents
Se usan para roles persistentes con:

- instrucciones estables,
- herramientas permitidas por rol,
- posibles handoffs,
- y comportamiento consistente. 

### 2.2 Prompt files
Se usan para tareas cortas y repetibles invocadas a demanda, por ejemplo revisión rápida, preparación de plan o checklist documental. Los prompt files son Markdown reutilizable con configuración opcional en frontmatter. 

### 2.3 Skills
Se usan para capacidades portables y reutilizables que van más allá de una simple persona, especialmente cuando una tarea necesita recursos, scripts o lógica más estable. 

---

## 3. Principios

### 3.1 Contexto mínimo
Cada agente o flujo debe cargar solo el contexto imprescindible. 

### 3.2 Especialización clara
Cada agente tiene una responsabilidad concreta y no debe absorber trabajo ambiguo de otros roles. 

### 3.3 La spec manda
Todo el sistema está subordinado a:

- constitución,
- arquitectura,
- roadmap,
- backlog,
- current focus,
- y specs activas. 

### 3.4 Ejecutar no sustituye revisar
Los agentes write-enabled no pueden saltarse revisión, validación ni documentación. 

### 3.5 Herramientas mínimas por rol
Cada agente debe tener solo las herramientas necesarias para su tarea. Los custom agents existen precisamente para restringir herramientas por rol. 

### 3.6 Lean antes que proliferación
Si una necesidad puede resolverse con un prompt file o una skill, no debe crearse un agente nuevo. VS Code recomienda elegir el mecanismo según el tipo de tarea. 

---

## 4. Capas de agentes

## 4.1 Capa read-only

### `spec-orchestrator`
Coordina tareas complejas, decide qué contexto cargar, qué mecanismo usar y a qué agentes delegar. Los custom agents están pensados para este tipo de roles persistentes con handoffs. 

### `research-analyst`
Investiga documentación, estructura del repo, fuentes externas y sintetiza hechos útiles para decidir. 

### `architecture-reviewer`
Evalúa propuestas y estado del repo desde arquitectura, carga, modularidad y escalabilidad. Los agentes especializados por rol son un caso de uso explícito de custom agents. 

### `docs-auditor`
Detecta desalineaciones entre documentación canónica y estado real del repositorio. 

### `codebase-analyst`
Analiza módulos afectados, patrones existentes y riesgos técnicos del código real. 

## 4.2 Capa write-enabled

### `implementation-agent`
Implementa tareas concretas con cambios pequeños, localizados y compatibles con la arquitectura. El modo agent/edit está orientado a este tipo de trabajo controlado. 

### `test-writer`
Escribe o amplía tests y fixtures de forma controlada. Los prompt files y agentes pueden usarse para tareas repetibles de testing. 

### `docs-updater`
Actualiza documentación afectada por cambios técnicos o funcionales. Las customizations de Copilot recomiendan usar instrucciones y prompt files para consistencia documental y tareas recurrentes. 

---

## 5. Preferencia de modelos

Las asignaciones de modelo deben entenderse como **preferencias por clase de modelo**, no como verdad rígida y permanente. La configuración de custom agents y prompt files permite fijar un modelo, pero también heredar el modelo por defecto del entorno. 

### Read-only
- `spec-orchestrator` → modelo fuerte en razonamiento y coordinación. 
- `research-analyst` → modelo fuerte en lectura, síntesis y contexto largo. 
- `architecture-reviewer` → modelo fuerte en razonamiento técnico y trade-offs. 
- `docs-auditor` → modelo fuerte en consistencia textual y contraste documental. 
- `codebase-analyst` → modelo fuerte en lectura de código y análisis estructural. 

### Write-enabled
- `implementation-agent` → modelo fuerte en edición multiarchivo y ejecución controlada. 
- `test-writer` → modelo fuerte en generación de tests y lectura de código. 
- `docs-updater` → modelo fuerte en síntesis y consistencia documental. 

---

## 6. Herramientas permitidas

### 6.1 Regla general
Cada agente debe exponer solo las herramientas mínimas necesarias para su rol. Los custom agents permiten precisamente fijar herramientas por perfil. 

### 6.2 Read-only
Usar solo capacidades de:

- lectura,
- búsqueda,
- navegación,
- análisis,
- investigación externa cuando haga falta,
- y handoff al coordinador si aplica. 

### 6.3 Write-enabled
Usar solo capacidades de:

- lectura,
- edición controlada,
- búsqueda local,
- y validación mínima asociada a la tarea. 

### 6.4 Investigación externa
La investigación externa solo debe activarse cuando el repositorio no contenga ya la respuesta o cuando la tarea dependa de documentación oficial externa. 

### 6.5 Capacidades avanzadas
Hooks, MCP, plugins o skills no deben introducirse por defecto en todos los flujos; solo cuando el caso de uso lo justifique. La documentación de VS Code los trata como mecanismos adicionales, no como base obligatoria del sistema. 

---

## 7. Handoffs permitidos

Los custom agents permiten definir handoffs entre roles; este repositorio fija handoffs explícitos para evitar flujos ambiguos. 

### 7.1 Handoffs válidos
- `spec-orchestrator` → `research-analyst`, `architecture-reviewer`, `docs-auditor`, `codebase-analyst` 
- `research-analyst` → `spec-orchestrator` o `architecture-reviewer` 
- `codebase-analyst` → `spec-orchestrator` o `architecture-reviewer` 
- `architecture-reviewer` → `spec-orchestrator` o `implementation-agent` solo si la tarea ya está madura 
- `implementation-agent` → `test-writer` → `docs-updater` 
- revisión final posterior → `architecture-reviewer` y/o `docs-auditor` 

### 7.2 Regla de paso a write-enabled
Ningún agente write-enabled debe empezar si antes no existe una salida suficiente de la capa read-only o una spec ya madura. 

---

## 8. Salida mínima exigida por agente

### `spec-orchestrator`
Debe devolver:
- objetivo,
- alcance,
- artefactos relevantes,
- agentes/mecanismos a invocar,
- criterio para pasar a implementación. 

### `research-analyst`
Debe devolver:
- hechos confirmados,
- fuentes,
- impacto,
- dudas abiertas. 

### `architecture-reviewer`
Debe devolver:
- compatibilidad con constitución/arquitectura,
- riesgos,
- trade-offs,
- decisión recomendada. 

### `docs-auditor`
Debe devolver:
- documentos afectados,
- desalineaciones,
- propuesta mínima de corrección. 

### `codebase-analyst`
Debe devolver:
- módulos afectados,
- patrones existentes,
- riesgos técnicos,
- puntos de extensión recomendados. 

### `implementation-agent`
Debe devolver:
- cambios realizados,
- alcance exacto,
- archivos tocados,
- validación realizada o pendiente. 

### `test-writer`
Debe devolver:
- tests añadidos o ampliados,
- cobertura objetivo,
- límites de lo validado. 

### `docs-updater`
Debe devolver:
- docs actualizadas,
- qué cambios reflejan,
- divergencias detectadas entre plan y estado real. 

---

## 9. Flujos recomendados

### Caso 1 — Nueva feature
1. `spec-orchestrator`
2. `research-analyst`
3. `architecture-reviewer`
4. `docs-auditor`
5. si la tarea está madura:
   - `implementation-agent`
   - `test-writer`
   - `docs-updater`
6. revisión final:
   - `architecture-reviewer`
   - `docs-auditor` 

### Caso 2 — Revisión de estado del repo
1. `codebase-analyst`
2. `docs-auditor`
3. `architecture-reviewer`
4. salida consolidada por `spec-orchestrator` o equivalente read-only. 

### Caso 3 — Preparación antes de implementar
1. `spec-orchestrator`
2. `codebase-analyst`
3. `architecture-reviewer`
4. recomendación de siguiente paso implementable. 

### Caso 4 — Implementación controlada
1. `implementation-agent`
2. `test-writer`
3. `docs-updater`
4. revisión posterior por:
   - `architecture-reviewer`
   - `docs-auditor` 

---

## 10. Qué debe devolver el sistema

- resumen ejecutivo,
- contexto mínimo relevante,
- módulos afectados,
- documentación afectada,
- riesgos,
- plan por pasos,
- recomendación final. 

## 11. Qué no debe devolver

- cambios fuera de alcance,
- propuestas sin anclaje en docs/spec,
- texto excesivo,
- cierres falsos de tareas no validadas,
- implementación cuando todavía falta madurez de análisis. 

---

## 12. Guardrails operativos

- Ningún agente write-enabled ejecuta si no existe spec, plan o tarea suficientemente madura. 
- Ningún agente puede considerar cerrada una tarea sin validación y documentación afectada. 
- Los agentes deben favorecer cambios pequeños y revisables, no lotes opacos. 
- Si el contexto es ambiguo, el flujo vuelve a `spec-orchestrator` en vez de inventar alcance. 
- Si una tarea es repetible y simple, debe preferirse un prompt file antes que un agente nuevo. 
- Si una capacidad es reusable y estable, debe evaluarse como skill antes que como proliferación de prompts o agentes. 

---

## 13. Regla de mantenimiento

Este sistema debe mantenerse pequeño, explícito y versionable. La documentación de personalización de VS Code recomienda introducir customizaciones de forma incremental y elegir el mecanismo adecuado para cada necesidad. 

Si se añaden más agentes, solo hacerlo si el nuevo rol aporta valor claro y no puede absorberse con:

- un agente existente,
- un prompt file,
- o una skill. 

---

## 14. Nota operativa

Las customizaciones de agentes y prompt files están en evolución y algunas capacidades se encuentran en preview según la documentación actual, por lo que este orquestador debe mantenerse **estable en concepto y ligero en configuración**. 